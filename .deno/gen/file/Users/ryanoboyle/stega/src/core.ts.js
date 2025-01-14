// src/core.ts
import { CommandRegistry } from "./command.ts";
import { Parser } from "./parser.ts"; // Imported FlagValue
import { Help } from "./help.ts";
import { ConfigLoader } from "./config.ts";
import { CommandNotFoundError, MissingFlagError, StegaError, SubcommandNotFoundError } from "./error.ts"; // Removed InvalidFlagValueError as it's unused
import { MiddlewareRegistry } from "./middleware.ts";
import { logger, setup } from "./logger.ts";
import { I18n } from "./i18n.ts";
import { PluginLoader } from "./plugin_loader.ts";
export class CLI {
  registry;
  parser;
  help;
  configLoader;
  config = {};
  testMode;
  middlewareRegistry;
  i18n;
  pluginLoader;
  ready = false;
  loadingPromise;
  // Injected logger instance
  logger;
  constructor(configPath, skipConfig = false, testMode = false, injectedLogger){
    this.registry = new CommandRegistry();
    this.parser = new Parser();
    this.configLoader = skipConfig ? undefined : new ConfigLoader(configPath);
    this.testMode = testMode;
    this.middlewareRegistry = new MiddlewareRegistry();
    this.i18n = new I18n(this.config);
    this.help = new Help(this.registry, this.i18n);
    this.pluginLoader = new PluginLoader();
    // Assign the injected logger or default to the global logger
    this.logger = injectedLogger || logger;
    // Register core commands
    this.registerCoreCommands();
    this.registerPluginCommands();
  // Load default plugins if any
  // Optionally, add hooks or default plugin registrations for testing
  }
  /**
	 * Registers core CLI commands
	 */ registerCoreCommands() {
    this.register({
      name: "help",
      description: "Display help information",
      options: [
        {
          name: "command",
          type: "string",
          description: "Command to get help for",
          required: false
        }
      ],
      action: async (args)=>{
        const cmdName = args.flags.command;
        if (cmdName) {
          const command = this.findCommand(cmdName);
          if (command) {
            console.log(this.help.generateHelp(command));
          } else {
            console.error(`Command "${cmdName}" not found.`);
          }
        } else {
          console.log(this.help.generateHelp());
        }
      }
    });
  }
  /**
	 * Registers a new command with the CLI.
	 * @param command The command to register.
	 */ register(command) {
    this.registry.register(command);
    this.logger.debug(`Registered command: ${command.name}`);
  }
  /**
	 * Registers a middleware function.
	 * @param middleware The middleware function to register.
	 */ use(middleware) {
    this.middlewareRegistry.use(middleware);
  }
  /**
	 * Formats output based on specified format.
	 * @param data The data to format.
	 * @returns The formatted string.
	 */ formatOutput(data) {
    const format = this.config["output"] || "text";
    switch(format){
      case "json":
        return JSON.stringify(data, null, 2);
      case "yaml":
        // Placeholder for YAML support
        return String(data);
      case "text":
      default:
        return String(data);
    }
  }
  /**
	 * Loads plugins from specified paths.
	 * @param pluginPaths Array of plugin module URLs or local paths.
	 */ async loadPlugins(pluginPaths) {
    for (const path of pluginPaths){
      await this.pluginLoader.loadPlugin(path, this);
    }
  }
  /**
	 * Retrieves the command registry.
	 * @returns The CommandRegistry instance.
	 */ getCommandRegistry() {
    return this.registry;
  }
  /**
	 * Runs the CLI application by parsing arguments and executing the appropriate command.
	 */ async run() {
    try {
      // Load configuration first if configLoader exists
      if (this.configLoader) {
        try {
          this.config = await this.configLoader.load();
        } catch (_error) {
          if (!(_error instanceof Deno.errors.NotFound)) {
            throw _error;
          }
        }
      }
      // Load i18n
      await this.i18n.load();
      const args = this.parser.parse(Deno.args, this);
      args.cli = this;
      // Load plugins if specified
      if (args.flags.plugins) {
        const plugins = args.flags.plugins;
        await this.loadPlugins(plugins);
      }
      // Handle help command or flags
      if (args.command.includes("help")) {
        const helpIndex = args.command.indexOf("help");
        const helpTarget = args.command[helpIndex + 1];
        if (helpTarget) {
          const command = this.registry.findCommand(helpTarget);
          if (command) {
            console.log(this.help.generateHelp(command));
          } else {
            console.error(`Command "${helpTarget}" not found.`);
          }
        } else {
          console.log(this.help.generateHelp());
        }
        return;
      }
      if (args.flags.help || args.flags.h) {
        const cmdName = args.command[0];
        if (cmdName) {
          const command = this.registry.findCommand(cmdName);
          if (command) {
            console.log(this.help.generateHelp(command));
            return;
          }
        }
        console.log(this.help.generateHelp());
        return;
      }
      if (args.command.length === 0) {
        this.showHelp();
        return;
      }
      const [cmdName, ...subCmds] = args.command;
      const command = this.registry.findCommand(cmdName);
      if (!command) {
        throw new CommandNotFoundError(cmdName);
      }
      // Execute middleware before processing options
      await this.middlewareRegistry.execute(args, command);
      // Handle subcommands if any
      if (subCmds.length > 0 && command.subcommands) {
        const subcommand = this.registry.findSubcommand(command, subCmds);
        if (!subcommand) {
          throw new SubcommandNotFoundError(subCmds.join(" "));
        }
        await this.processOptions(subcommand, args.flags);
        await subcommand.action(args);
      } else {
        await this.processOptions(command, args.flags);
        await command.action(args);
      }
    } catch (err) {
      const error = err;
      if (error instanceof StegaError) {
        console.error(this.i18n.t("error", {
          message: error.message
        }));
      } else {
        console.error(this.i18n.t("unexpected_error", {
          message: error.message
        }));
      }
      this.showHelp();
      if (!this.testMode) {
        Deno.exit(1);
      }
      throw error; // Re-throw in test mode
    }
  }
  /**
	 * Executes a command given an array of arguments.
	 * @param args Array of command-line arguments.
	 */ async runCommand(args) {
    try {
      const parsedArgs = this.parser.parse(args, this);
      // Skip help handling in batch mode
      if (parsedArgs.command.length === 0) {
        return;
      }
      const [cmdName, ...subCmds] = parsedArgs.command;
      const command = this.registry.findCommand(cmdName);
      if (!command) {
        throw new CommandNotFoundError(cmdName);
      }
      await this.middlewareRegistry.execute(parsedArgs, command);
      if (subCmds.length > 0 && command.subcommands) {
        const subcommand = this.registry.findSubcommand(command, subCmds);
        if (!subcommand) {
          throw new SubcommandNotFoundError(subCmds.join(" "));
        }
        await this.processOptions(subcommand, parsedArgs.flags);
        await subcommand.action(parsedArgs);
      } else {
        await this.processOptions(command, parsedArgs.flags);
        await command.action(parsedArgs);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Command execution failed: ${errorMessage}`);
      throw error;
    }
  }
  /**
	 * Processes and validates the options for a command.
	 * @param command The command whose options are to be processed.
	 * @param flags The raw flags parsed from the command line.
	 */ async processOptions(command, flags) {
    if (!command.options || command.options.length === 0) return;
    const processedFlags = {};
    for (const option of command.options){
      const { name, alias, type: _type, default: defaultValue, required } = option; // Renamed 'type' to '_type'
      let value;
      if (flags[name] !== undefined) {
        value = flags[name];
      } else if (alias && flags[alias] !== undefined) {
        value = flags[alias];
      } else if (this.config[name] !== undefined) {
        value = this.config[name];
      } else {
        value = defaultValue;
      }
      if (value !== undefined) {
        // No need to convert here as Parser already handles type conversion
        processedFlags[name] = value;
      } else if (required) {
        throw new MissingFlagError(name, _type); // Passed both 'name' and 'expectedType'
      }
    }
    // Fix logger setup configuration
    const logLevel = processedFlags["log-level"];
    if (logLevel && typeof logLevel === "string") {
      const level = logLevel.toUpperCase();
      await setup({
        loggers: {
          default: {
            level,
            handlers: [
              "console"
            ]
          }
        }
      });
    }
    // Attach processed flags to args.flags
    for (const [key, value] of Object.entries(processedFlags)){
      flags[key] = value;
    }
  }
  /**
	 * Displays the general help information.
	 */ showHelp() {
    console.log(this.help.generateHelp());
  }
  /**
	 * Translates a key using the I18n system.
	 * @param key The key to translate.
	 * @param placeholders Optional placeholders for the translation.
	 * @returns The translated string.
	 */ t(key, placeholders) {
    return this.i18n.t(key, placeholders);
  }
  /**
	 * Returns whether the CLI is running in test mode
	 * @returns Boolean indicating test mode status
	 */ isTestMode() {
    return this.testMode;
  }
  /**
	 * Retrieves all loaded plugins.
	 * @returns An array of loaded plugins.
	 */ getLoadedPlugins() {
    return this.pluginLoader.getLoadedPlugins();
  }
  /**
	 * Finds a command by name.
	 * @param name The name of the command to find.
	 * @returns The found command or undefined.
	 */ findCommand(name) {
    return this.registry.findCommand(name);
  }
  /**
	 * Registers plugin management commands.
	 */ registerPluginCommands() {
    this.register({
      name: "plugin",
      description: "Plugin management commands",
      options: [],
      subcommands: [
        {
          name: "load",
          description: "Load a plugin",
          options: [
            {
              name: "path",
              alias: "p",
              type: "string",
              description: "Path to plugin",
              required: true
            }
          ],
          action: async (args)=>{
            const path = args.flags.path;
            await this.pluginLoader.loadPlugin(path, this);
          }
        },
        {
          name: "unload",
          description: "Unload a plugin",
          options: [
            {
              name: "name",
              alias: "n",
              type: "string",
              description: "Plugin name",
              required: true
            }
          ],
          action: async (args)=>{
            const name = args.flags.name;
            await this.pluginLoader.unloadPlugin(name, this);
          }
        },
        {
          name: "list",
          description: "List loaded plugins",
          action: ()=>{
            const plugins = this.pluginLoader.listPlugins();
            if (plugins.length === 0) {
              console.log("No plugins loaded");
              return;
            }
            console.log("Loaded plugins:");
            for (const plugin of plugins){
              console.log(`- ${plugin.name} v${plugin.version}: ${plugin.description || ""}`);
            }
          }
        }
      ],
      action: (_args)=>{
        console.log("Plugin management commands. Use 'plugin [command]' to manage plugins.");
      }
    });
  }
  /**
	 * Sets the CLI to ready state and resolves any pending loading promise
	 */ markAsReady() {
    this.ready = true;
    this.loadingPromise = Promise.resolve();
    this.logger.debug("CLI is ready");
  }
  async waitForReady() {
    if (this.ready) return;
    if (this.loadingPromise) {
      await this.loadingPromise;
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29yZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBzcmMvY29yZS50c1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tbWFuZFJlZ2lzdHJ5IH0gZnJvbSBcIi4vY29tbWFuZC50c1wiO1xuaW1wb3J0IHsgRmxhZ1ZhbHVlLCBQYXJzZXIgfSBmcm9tIFwiLi9wYXJzZXIudHNcIjsgLy8gSW1wb3J0ZWQgRmxhZ1ZhbHVlXG5pbXBvcnQgeyBIZWxwIH0gZnJvbSBcIi4vaGVscC50c1wiO1xuaW1wb3J0IHsgQ29uZmlnTG9hZGVyIH0gZnJvbSBcIi4vY29uZmlnLnRzXCI7XG5pbXBvcnQge1xuXHRDb21tYW5kTm90Rm91bmRFcnJvcixcblx0TWlzc2luZ0ZsYWdFcnJvcixcblx0U3RlZ2FFcnJvcixcblx0U3ViY29tbWFuZE5vdEZvdW5kRXJyb3IsXG59IGZyb20gXCIuL2Vycm9yLnRzXCI7IC8vIFJlbW92ZWQgSW52YWxpZEZsYWdWYWx1ZUVycm9yIGFzIGl0J3MgdW51c2VkXG5pbXBvcnQgeyBNaWRkbGV3YXJlRnVuY3Rpb24sIE1pZGRsZXdhcmVSZWdpc3RyeSB9IGZyb20gXCIuL21pZGRsZXdhcmUudHNcIjtcbmltcG9ydCB7IGxvZ2dlciwgc2V0dXAgfSBmcm9tIFwiLi9sb2dnZXIudHNcIjtcbmltcG9ydCB7IEkxOG4gfSBmcm9tIFwiLi9pMThuLnRzXCI7XG5pbXBvcnQgeyBQbHVnaW5Mb2FkZXIgfSBmcm9tIFwiLi9wbHVnaW5fbG9hZGVyLnRzXCI7XG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tIFwiLi9wbHVnaW4udHNcIjtcbmltcG9ydCB0eXBlIHsgTGV2ZWxOYW1lIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyNC4wL2xvZy9sZXZlbHMudHNcIjtcbmltcG9ydCB0eXBlIHsgSUxvZ2dlciB9IGZyb20gXCIuL2xvZ2dlcl9pbnRlcmZhY2UudHNcIjtcbmltcG9ydCB0eXBlIHsgQXJncyB9IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW9uIHtcblx0bmFtZTogc3RyaW5nO1xuXHRhbGlhcz86IHN0cmluZztcblx0ZGVzY3JpcHRpb24/OiBzdHJpbmc7XG5cdHR5cGU6IFwiYm9vbGVhblwiIHwgXCJzdHJpbmdcIiB8IFwibnVtYmVyXCIgfCBcImFycmF5XCI7XG5cdGRlZmF1bHQ/OiB1bmtub3duO1xuXHRyZXF1aXJlZD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQnVpbGRPcHRpb25zIHtcblx0b3V0cHV0OiBzdHJpbmc7XG5cdHRhcmdldDogc3RyaW5nO1xuXHRhbGxvd1Blcm1pc3Npb25zOiBzdHJpbmdbXTtcblx0ZW50cnk6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIENMSSB7XG5cdHByaXZhdGUgcmVnaXN0cnk6IENvbW1hbmRSZWdpc3RyeTtcblx0cHJpdmF0ZSBwYXJzZXI6IFBhcnNlcjtcblx0cHJpdmF0ZSBoZWxwOiBIZWxwO1xuXHRwcml2YXRlIGNvbmZpZ0xvYWRlcjogQ29uZmlnTG9hZGVyIHwgdW5kZWZpbmVkO1xuXHRwcml2YXRlIGNvbmZpZzogUGFydGlhbDxSZWNvcmQ8c3RyaW5nLCBGbGFnVmFsdWU+PiA9IHt9OyAvLyBVcGRhdGVkIHR5cGVcblx0cHJpdmF0ZSB0ZXN0TW9kZTogYm9vbGVhbjtcblx0cHJpdmF0ZSBtaWRkbGV3YXJlUmVnaXN0cnk6IE1pZGRsZXdhcmVSZWdpc3RyeTtcblx0cHJpdmF0ZSBpMThuOiBJMThuO1xuXHRwcml2YXRlIHBsdWdpbkxvYWRlcjogUGx1Z2luTG9hZGVyO1xuXHRwcml2YXRlIHJlYWR5OiBib29sZWFuID0gZmFsc2U7XG5cdHByaXZhdGUgbG9hZGluZ1Byb21pc2U/OiBQcm9taXNlPHZvaWQ+O1xuXG5cdC8vIEluamVjdGVkIGxvZ2dlciBpbnN0YW5jZVxuXHRwdWJsaWMgcmVhZG9ubHkgbG9nZ2VyOiBJTG9nZ2VyO1xuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdGNvbmZpZ1BhdGg/OiBzdHJpbmcsXG5cdFx0c2tpcENvbmZpZyA9IGZhbHNlLFxuXHRcdHRlc3RNb2RlID0gZmFsc2UsXG5cdFx0aW5qZWN0ZWRMb2dnZXI/OiBJTG9nZ2VyLFxuXHQpIHtcblx0XHR0aGlzLnJlZ2lzdHJ5ID0gbmV3IENvbW1hbmRSZWdpc3RyeSgpO1xuXHRcdHRoaXMucGFyc2VyID0gbmV3IFBhcnNlcigpO1xuXHRcdHRoaXMuY29uZmlnTG9hZGVyID0gc2tpcENvbmZpZyA/IHVuZGVmaW5lZCA6IG5ldyBDb25maWdMb2FkZXIoY29uZmlnUGF0aCk7XG5cdFx0dGhpcy50ZXN0TW9kZSA9IHRlc3RNb2RlO1xuXHRcdHRoaXMubWlkZGxld2FyZVJlZ2lzdHJ5ID0gbmV3IE1pZGRsZXdhcmVSZWdpc3RyeSgpO1xuXHRcdHRoaXMuaTE4biA9IG5ldyBJMThuKHRoaXMuY29uZmlnKTtcblx0XHR0aGlzLmhlbHAgPSBuZXcgSGVscCh0aGlzLnJlZ2lzdHJ5LCB0aGlzLmkxOG4pO1xuXHRcdHRoaXMucGx1Z2luTG9hZGVyID0gbmV3IFBsdWdpbkxvYWRlcigpO1xuXG5cdFx0Ly8gQXNzaWduIHRoZSBpbmplY3RlZCBsb2dnZXIgb3IgZGVmYXVsdCB0byB0aGUgZ2xvYmFsIGxvZ2dlclxuXHRcdHRoaXMubG9nZ2VyID0gaW5qZWN0ZWRMb2dnZXIgfHwgbG9nZ2VyO1xuXG5cdFx0Ly8gUmVnaXN0ZXIgY29yZSBjb21tYW5kc1xuXHRcdHRoaXMucmVnaXN0ZXJDb3JlQ29tbWFuZHMoKTtcblx0XHR0aGlzLnJlZ2lzdGVyUGx1Z2luQ29tbWFuZHMoKTtcblxuXHRcdC8vIExvYWQgZGVmYXVsdCBwbHVnaW5zIGlmIGFueVxuXHRcdC8vIE9wdGlvbmFsbHksIGFkZCBob29rcyBvciBkZWZhdWx0IHBsdWdpbiByZWdpc3RyYXRpb25zIGZvciB0ZXN0aW5nXG5cdH1cblxuXHQvKipcblx0ICogUmVnaXN0ZXJzIGNvcmUgQ0xJIGNvbW1hbmRzXG5cdCAqL1xuXHRwcml2YXRlIHJlZ2lzdGVyQ29yZUNvbW1hbmRzKCk6IHZvaWQge1xuXHRcdHRoaXMucmVnaXN0ZXIoe1xuXHRcdFx0bmFtZTogXCJoZWxwXCIsXG5cdFx0XHRkZXNjcmlwdGlvbjogXCJEaXNwbGF5IGhlbHAgaW5mb3JtYXRpb25cIixcblx0XHRcdG9wdGlvbnM6IFt7XG5cdFx0XHRcdG5hbWU6IFwiY29tbWFuZFwiLFxuXHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjogXCJDb21tYW5kIHRvIGdldCBoZWxwIGZvclwiLFxuXHRcdFx0XHRyZXF1aXJlZDogZmFsc2UsXG5cdFx0XHR9XSxcblx0XHRcdGFjdGlvbjogYXN5bmMgKGFyZ3M6IEFyZ3MpID0+IHtcblx0XHRcdFx0Y29uc3QgY21kTmFtZSA9IGFyZ3MuZmxhZ3MuY29tbWFuZCBhcyBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cdFx0XHRcdGlmIChjbWROYW1lKSB7XG5cdFx0XHRcdFx0Y29uc3QgY29tbWFuZCA9IHRoaXMuZmluZENvbW1hbmQoY21kTmFtZSk7XG5cdFx0XHRcdFx0aWYgKGNvbW1hbmQpIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKHRoaXMuaGVscC5nZW5lcmF0ZUhlbHAoY29tbWFuZCkpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGBDb21tYW5kIFwiJHtjbWROYW1lfVwiIG5vdCBmb3VuZC5gKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2codGhpcy5oZWxwLmdlbmVyYXRlSGVscCgpKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZWdpc3RlcnMgYSBuZXcgY29tbWFuZCB3aXRoIHRoZSBDTEkuXG5cdCAqIEBwYXJhbSBjb21tYW5kIFRoZSBjb21tYW5kIHRvIHJlZ2lzdGVyLlxuXHQgKi9cblx0cmVnaXN0ZXIoY29tbWFuZDogQ29tbWFuZCkge1xuXHRcdHRoaXMucmVnaXN0cnkucmVnaXN0ZXIoY29tbWFuZCk7XG5cdFx0dGhpcy5sb2dnZXIuZGVidWcoYFJlZ2lzdGVyZWQgY29tbWFuZDogJHtjb21tYW5kLm5hbWV9YCk7XG5cdH1cblxuXHQvKipcblx0ICogUmVnaXN0ZXJzIGEgbWlkZGxld2FyZSBmdW5jdGlvbi5cblx0ICogQHBhcmFtIG1pZGRsZXdhcmUgVGhlIG1pZGRsZXdhcmUgZnVuY3Rpb24gdG8gcmVnaXN0ZXIuXG5cdCAqL1xuXHR1c2UobWlkZGxld2FyZTogTWlkZGxld2FyZUZ1bmN0aW9uKSB7XG5cdFx0dGhpcy5taWRkbGV3YXJlUmVnaXN0cnkudXNlKG1pZGRsZXdhcmUpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEZvcm1hdHMgb3V0cHV0IGJhc2VkIG9uIHNwZWNpZmllZCBmb3JtYXQuXG5cdCAqIEBwYXJhbSBkYXRhIFRoZSBkYXRhIHRvIGZvcm1hdC5cblx0ICogQHJldHVybnMgVGhlIGZvcm1hdHRlZCBzdHJpbmcuXG5cdCAqL1xuXHRmb3JtYXRPdXRwdXQoZGF0YTogdW5rbm93bik6IHN0cmluZyB7XG5cdFx0Y29uc3QgZm9ybWF0ID0gKHRoaXMuY29uZmlnW1wib3V0cHV0XCJdIGFzIHN0cmluZykgfHwgXCJ0ZXh0XCI7XG5cblx0XHRzd2l0Y2ggKGZvcm1hdCkge1xuXHRcdFx0Y2FzZSBcImpzb25cIjpcblx0XHRcdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpO1xuXHRcdFx0Y2FzZSBcInlhbWxcIjpcblx0XHRcdFx0Ly8gUGxhY2Vob2xkZXIgZm9yIFlBTUwgc3VwcG9ydFxuXHRcdFx0XHRyZXR1cm4gU3RyaW5nKGRhdGEpO1xuXHRcdFx0Y2FzZSBcInRleHRcIjpcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiBTdHJpbmcoZGF0YSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIExvYWRzIHBsdWdpbnMgZnJvbSBzcGVjaWZpZWQgcGF0aHMuXG5cdCAqIEBwYXJhbSBwbHVnaW5QYXRocyBBcnJheSBvZiBwbHVnaW4gbW9kdWxlIFVSTHMgb3IgbG9jYWwgcGF0aHMuXG5cdCAqL1xuXHRhc3luYyBsb2FkUGx1Z2lucyhwbHVnaW5QYXRoczogc3RyaW5nW10pIHtcblx0XHRmb3IgKGNvbnN0IHBhdGggb2YgcGx1Z2luUGF0aHMpIHtcblx0XHRcdGF3YWl0IHRoaXMucGx1Z2luTG9hZGVyLmxvYWRQbHVnaW4ocGF0aCwgdGhpcyk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUgY29tbWFuZCByZWdpc3RyeS5cblx0ICogQHJldHVybnMgVGhlIENvbW1hbmRSZWdpc3RyeSBpbnN0YW5jZS5cblx0ICovXG5cdGdldENvbW1hbmRSZWdpc3RyeSgpOiBDb21tYW5kUmVnaXN0cnkge1xuXHRcdHJldHVybiB0aGlzLnJlZ2lzdHJ5O1xuXHR9XG5cblx0LyoqXG5cdCAqIFJ1bnMgdGhlIENMSSBhcHBsaWNhdGlvbiBieSBwYXJzaW5nIGFyZ3VtZW50cyBhbmQgZXhlY3V0aW5nIHRoZSBhcHByb3ByaWF0ZSBjb21tYW5kLlxuXHQgKi9cblx0YXN5bmMgcnVuKCkge1xuXHRcdHRyeSB7XG5cdFx0XHQvLyBMb2FkIGNvbmZpZ3VyYXRpb24gZmlyc3QgaWYgY29uZmlnTG9hZGVyIGV4aXN0c1xuXHRcdFx0aWYgKHRoaXMuY29uZmlnTG9hZGVyKSB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0dGhpcy5jb25maWcgPSBhd2FpdCB0aGlzLmNvbmZpZ0xvYWRlci5sb2FkKCk7XG5cdFx0XHRcdH0gY2F0Y2ggKF9lcnJvcikgeyAvLyBSZW5hbWVkIHRvIF9lcnJvciB0byBpbmRpY2F0ZSBpbnRlbnRpb25hbCBub24tdXNlXG5cdFx0XHRcdFx0aWYgKCEoX2Vycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpKSB7XG5cdFx0XHRcdFx0XHR0aHJvdyBfZXJyb3I7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIExvYWQgaTE4blxuXHRcdFx0YXdhaXQgdGhpcy5pMThuLmxvYWQoKTtcblxuXHRcdFx0Y29uc3QgYXJncyA9IHRoaXMucGFyc2VyLnBhcnNlKERlbm8uYXJncywgdGhpcyk7XG5cdFx0XHRhcmdzLmNsaSA9IHRoaXM7XG5cblx0XHRcdC8vIExvYWQgcGx1Z2lucyBpZiBzcGVjaWZpZWRcblx0XHRcdGlmIChhcmdzLmZsYWdzLnBsdWdpbnMpIHtcblx0XHRcdFx0Y29uc3QgcGx1Z2lucyA9IGFyZ3MuZmxhZ3MucGx1Z2lucyBhcyBzdHJpbmdbXTtcblx0XHRcdFx0YXdhaXQgdGhpcy5sb2FkUGx1Z2lucyhwbHVnaW5zKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gSGFuZGxlIGhlbHAgY29tbWFuZCBvciBmbGFnc1xuXHRcdFx0aWYgKGFyZ3MuY29tbWFuZC5pbmNsdWRlcyhcImhlbHBcIikpIHtcblx0XHRcdFx0Y29uc3QgaGVscEluZGV4ID0gYXJncy5jb21tYW5kLmluZGV4T2YoXCJoZWxwXCIpO1xuXHRcdFx0XHRjb25zdCBoZWxwVGFyZ2V0ID0gYXJncy5jb21tYW5kW2hlbHBJbmRleCArIDFdO1xuXHRcdFx0XHRpZiAoaGVscFRhcmdldCkge1xuXHRcdFx0XHRcdGNvbnN0IGNvbW1hbmQgPSB0aGlzLnJlZ2lzdHJ5LmZpbmRDb21tYW5kKGhlbHBUYXJnZXQpO1xuXHRcdFx0XHRcdGlmIChjb21tYW5kKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyh0aGlzLmhlbHAuZ2VuZXJhdGVIZWxwKGNvbW1hbmQpKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihgQ29tbWFuZCBcIiR7aGVscFRhcmdldH1cIiBub3QgZm91bmQuYCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKHRoaXMuaGVscC5nZW5lcmF0ZUhlbHAoKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoYXJncy5mbGFncy5oZWxwIHx8IGFyZ3MuZmxhZ3MuaCkge1xuXHRcdFx0XHRjb25zdCBjbWROYW1lID0gYXJncy5jb21tYW5kWzBdO1xuXHRcdFx0XHRpZiAoY21kTmFtZSkge1xuXHRcdFx0XHRcdGNvbnN0IGNvbW1hbmQgPSB0aGlzLnJlZ2lzdHJ5LmZpbmRDb21tYW5kKGNtZE5hbWUpO1xuXHRcdFx0XHRcdGlmIChjb21tYW5kKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyh0aGlzLmhlbHAuZ2VuZXJhdGVIZWxwKGNvbW1hbmQpKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc29sZS5sb2codGhpcy5oZWxwLmdlbmVyYXRlSGVscCgpKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoYXJncy5jb21tYW5kLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHR0aGlzLnNob3dIZWxwKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgW2NtZE5hbWUsIC4uLnN1YkNtZHNdID0gYXJncy5jb21tYW5kO1xuXHRcdFx0Y29uc3QgY29tbWFuZCA9IHRoaXMucmVnaXN0cnkuZmluZENvbW1hbmQoY21kTmFtZSk7XG5cblx0XHRcdGlmICghY29tbWFuZCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgQ29tbWFuZE5vdEZvdW5kRXJyb3IoY21kTmFtZSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEV4ZWN1dGUgbWlkZGxld2FyZSBiZWZvcmUgcHJvY2Vzc2luZyBvcHRpb25zXG5cdFx0XHRhd2FpdCB0aGlzLm1pZGRsZXdhcmVSZWdpc3RyeS5leGVjdXRlKGFyZ3MsIGNvbW1hbmQpO1xuXG5cdFx0XHQvLyBIYW5kbGUgc3ViY29tbWFuZHMgaWYgYW55XG5cdFx0XHRpZiAoc3ViQ21kcy5sZW5ndGggPiAwICYmIGNvbW1hbmQuc3ViY29tbWFuZHMpIHtcblx0XHRcdFx0Y29uc3Qgc3ViY29tbWFuZCA9IHRoaXMucmVnaXN0cnkuZmluZFN1YmNvbW1hbmQoY29tbWFuZCwgc3ViQ21kcyk7XG5cdFx0XHRcdGlmICghc3ViY29tbWFuZCkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBTdWJjb21tYW5kTm90Rm91bmRFcnJvcihzdWJDbWRzLmpvaW4oXCIgXCIpKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRhd2FpdCB0aGlzLnByb2Nlc3NPcHRpb25zKHN1YmNvbW1hbmQsIGFyZ3MuZmxhZ3MpO1xuXHRcdFx0XHRhd2FpdCBzdWJjb21tYW5kLmFjdGlvbihhcmdzKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMucHJvY2Vzc09wdGlvbnMoY29tbWFuZCwgYXJncy5mbGFncyk7XG5cdFx0XHRcdGF3YWl0IGNvbW1hbmQuYWN0aW9uKGFyZ3MpO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0Y29uc3QgZXJyb3IgPSBlcnIgYXMgRXJyb3I7XG5cdFx0XHRpZiAoZXJyb3IgaW5zdGFuY2VvZiBTdGVnYUVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IodGhpcy5pMThuLnQoXCJlcnJvclwiLCB7IG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgfSkpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihcblx0XHRcdFx0XHR0aGlzLmkxOG4udChcInVuZXhwZWN0ZWRfZXJyb3JcIiwgeyBtZXNzYWdlOiBlcnJvci5tZXNzYWdlIH0pLFxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5zaG93SGVscCgpO1xuXHRcdFx0aWYgKCF0aGlzLnRlc3RNb2RlKSB7XG5cdFx0XHRcdERlbm8uZXhpdCgxKTtcblx0XHRcdH1cblx0XHRcdHRocm93IGVycm9yOyAvLyBSZS10aHJvdyBpbiB0ZXN0IG1vZGVcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogRXhlY3V0ZXMgYSBjb21tYW5kIGdpdmVuIGFuIGFycmF5IG9mIGFyZ3VtZW50cy5cblx0ICogQHBhcmFtIGFyZ3MgQXJyYXkgb2YgY29tbWFuZC1saW5lIGFyZ3VtZW50cy5cblx0ICovXG5cdGFzeW5jIHJ1bkNvbW1hbmQoYXJnczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgcGFyc2VkQXJncyA9IHRoaXMucGFyc2VyLnBhcnNlKGFyZ3MsIHRoaXMpO1xuXG5cdFx0XHQvLyBTa2lwIGhlbHAgaGFuZGxpbmcgaW4gYmF0Y2ggbW9kZVxuXHRcdFx0aWYgKHBhcnNlZEFyZ3MuY29tbWFuZC5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBbY21kTmFtZSwgLi4uc3ViQ21kc10gPSBwYXJzZWRBcmdzLmNvbW1hbmQ7XG5cdFx0XHRjb25zdCBjb21tYW5kID0gdGhpcy5yZWdpc3RyeS5maW5kQ29tbWFuZChjbWROYW1lKTtcblxuXHRcdFx0aWYgKCFjb21tYW5kKSB7XG5cdFx0XHRcdHRocm93IG5ldyBDb21tYW5kTm90Rm91bmRFcnJvcihjbWROYW1lKTtcblx0XHRcdH1cblxuXHRcdFx0YXdhaXQgdGhpcy5taWRkbGV3YXJlUmVnaXN0cnkuZXhlY3V0ZShwYXJzZWRBcmdzLCBjb21tYW5kKTtcblxuXHRcdFx0aWYgKHN1YkNtZHMubGVuZ3RoID4gMCAmJiBjb21tYW5kLnN1YmNvbW1hbmRzKSB7XG5cdFx0XHRcdGNvbnN0IHN1YmNvbW1hbmQgPSB0aGlzLnJlZ2lzdHJ5LmZpbmRTdWJjb21tYW5kKGNvbW1hbmQsIHN1YkNtZHMpO1xuXHRcdFx0XHRpZiAoIXN1YmNvbW1hbmQpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgU3ViY29tbWFuZE5vdEZvdW5kRXJyb3Ioc3ViQ21kcy5qb2luKFwiIFwiKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0YXdhaXQgdGhpcy5wcm9jZXNzT3B0aW9ucyhzdWJjb21tYW5kLCBwYXJzZWRBcmdzLmZsYWdzKTtcblx0XHRcdFx0YXdhaXQgc3ViY29tbWFuZC5hY3Rpb24ocGFyc2VkQXJncyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhd2FpdCB0aGlzLnByb2Nlc3NPcHRpb25zKGNvbW1hbmQsIHBhcnNlZEFyZ3MuZmxhZ3MpO1xuXHRcdFx0XHRhd2FpdCBjb21tYW5kLmFjdGlvbihwYXJzZWRBcmdzKTtcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlcnJvcjogdW5rbm93bikge1xuXHRcdFx0Y29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvclxuXHRcdFx0XHQ/IGVycm9yLm1lc3NhZ2Vcblx0XHRcdFx0OiBTdHJpbmcoZXJyb3IpO1xuXHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IoYENvbW1hbmQgZXhlY3V0aW9uIGZhaWxlZDogJHtlcnJvck1lc3NhZ2V9YCk7XG5cdFx0XHR0aHJvdyBlcnJvcjtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogUHJvY2Vzc2VzIGFuZCB2YWxpZGF0ZXMgdGhlIG9wdGlvbnMgZm9yIGEgY29tbWFuZC5cblx0ICogQHBhcmFtIGNvbW1hbmQgVGhlIGNvbW1hbmQgd2hvc2Ugb3B0aW9ucyBhcmUgdG8gYmUgcHJvY2Vzc2VkLlxuXHQgKiBAcGFyYW0gZmxhZ3MgVGhlIHJhdyBmbGFncyBwYXJzZWQgZnJvbSB0aGUgY29tbWFuZCBsaW5lLlxuXHQgKi9cblx0YXN5bmMgcHJvY2Vzc09wdGlvbnMoXG5cdFx0Y29tbWFuZDogQ29tbWFuZCxcblx0XHRmbGFnczogUmVjb3JkPHN0cmluZywgRmxhZ1ZhbHVlPixcblx0KSB7XG5cdFx0aWYgKCFjb21tYW5kLm9wdGlvbnMgfHwgY29tbWFuZC5vcHRpb25zLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG5cdFx0Y29uc3QgcHJvY2Vzc2VkRmxhZ3M6IFJlY29yZDxzdHJpbmcsIEZsYWdWYWx1ZT4gPSB7fTtcblxuXHRcdGZvciAoY29uc3Qgb3B0aW9uIG9mIGNvbW1hbmQub3B0aW9ucykge1xuXHRcdFx0Y29uc3QgeyBuYW1lLCBhbGlhcywgdHlwZTogX3R5cGUsIGRlZmF1bHQ6IGRlZmF1bHRWYWx1ZSwgcmVxdWlyZWQgfSA9XG5cdFx0XHRcdG9wdGlvbjsgLy8gUmVuYW1lZCAndHlwZScgdG8gJ190eXBlJ1xuXHRcdFx0bGV0IHZhbHVlOiBGbGFnVmFsdWUgfCB1bmRlZmluZWQ7XG5cblx0XHRcdGlmIChmbGFnc1tuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHZhbHVlID0gZmxhZ3NbbmFtZV07XG5cdFx0XHR9IGVsc2UgaWYgKGFsaWFzICYmIGZsYWdzW2FsaWFzXSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHZhbHVlID0gZmxhZ3NbYWxpYXNdO1xuXHRcdFx0fSBlbHNlIGlmICh0aGlzLmNvbmZpZ1tuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHZhbHVlID0gdGhpcy5jb25maWdbbmFtZV0gYXMgRmxhZ1ZhbHVlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dmFsdWUgPSBkZWZhdWx0VmFsdWUgYXMgRmxhZ1ZhbHVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHQvLyBObyBuZWVkIHRvIGNvbnZlcnQgaGVyZSBhcyBQYXJzZXIgYWxyZWFkeSBoYW5kbGVzIHR5cGUgY29udmVyc2lvblxuXHRcdFx0XHRwcm9jZXNzZWRGbGFnc1tuYW1lXSA9IHZhbHVlO1xuXHRcdFx0fSBlbHNlIGlmIChyZXF1aXJlZCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWlzc2luZ0ZsYWdFcnJvcihuYW1lLCBfdHlwZSk7IC8vIFBhc3NlZCBib3RoICduYW1lJyBhbmQgJ2V4cGVjdGVkVHlwZSdcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBGaXggbG9nZ2VyIHNldHVwIGNvbmZpZ3VyYXRpb25cblx0XHRjb25zdCBsb2dMZXZlbCA9IHByb2Nlc3NlZEZsYWdzW1wibG9nLWxldmVsXCJdO1xuXHRcdGlmIChsb2dMZXZlbCAmJiB0eXBlb2YgbG9nTGV2ZWwgPT09IFwic3RyaW5nXCIpIHtcblx0XHRcdGNvbnN0IGxldmVsID0gbG9nTGV2ZWwudG9VcHBlckNhc2UoKSBhcyBMZXZlbE5hbWU7XG5cdFx0XHRhd2FpdCBzZXR1cCh7IGxvZ2dlcnM6IHsgZGVmYXVsdDogeyBsZXZlbCwgaGFuZGxlcnM6IFtcImNvbnNvbGVcIl0gfSB9IH0pO1xuXHRcdH1cblxuXHRcdC8vIEF0dGFjaCBwcm9jZXNzZWQgZmxhZ3MgdG8gYXJncy5mbGFnc1xuXHRcdGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHByb2Nlc3NlZEZsYWdzKSkge1xuXHRcdFx0ZmxhZ3Nba2V5XSA9IHZhbHVlO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBEaXNwbGF5cyB0aGUgZ2VuZXJhbCBoZWxwIGluZm9ybWF0aW9uLlxuXHQgKi9cblx0c2hvd0hlbHAoKSB7XG5cdFx0Y29uc29sZS5sb2codGhpcy5oZWxwLmdlbmVyYXRlSGVscCgpKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBUcmFuc2xhdGVzIGEga2V5IHVzaW5nIHRoZSBJMThuIHN5c3RlbS5cblx0ICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHRyYW5zbGF0ZS5cblx0ICogQHBhcmFtIHBsYWNlaG9sZGVycyBPcHRpb25hbCBwbGFjZWhvbGRlcnMgZm9yIHRoZSB0cmFuc2xhdGlvbi5cblx0ICogQHJldHVybnMgVGhlIHRyYW5zbGF0ZWQgc3RyaW5nLlxuXHQgKi9cblx0cHVibGljIHQoXG5cdFx0a2V5OiBzdHJpbmcsXG5cdFx0cGxhY2Vob2xkZXJzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyPixcblx0KTogc3RyaW5nIHtcblx0XHRyZXR1cm4gdGhpcy5pMThuLnQoa2V5LCBwbGFjZWhvbGRlcnMpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgd2hldGhlciB0aGUgQ0xJIGlzIHJ1bm5pbmcgaW4gdGVzdCBtb2RlXG5cdCAqIEByZXR1cm5zIEJvb2xlYW4gaW5kaWNhdGluZyB0ZXN0IG1vZGUgc3RhdHVzXG5cdCAqL1xuXHRpc1Rlc3RNb2RlKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLnRlc3RNb2RlO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyBhbGwgbG9hZGVkIHBsdWdpbnMuXG5cdCAqIEByZXR1cm5zIEFuIGFycmF5IG9mIGxvYWRlZCBwbHVnaW5zLlxuXHQgKi9cblx0Z2V0TG9hZGVkUGx1Z2lucygpOiBQbHVnaW5bXSB7XG5cdFx0cmV0dXJuIHRoaXMucGx1Z2luTG9hZGVyLmdldExvYWRlZFBsdWdpbnMoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBGaW5kcyBhIGNvbW1hbmQgYnkgbmFtZS5cblx0ICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGNvbW1hbmQgdG8gZmluZC5cblx0ICogQHJldHVybnMgVGhlIGZvdW5kIGNvbW1hbmQgb3IgdW5kZWZpbmVkLlxuXHQgKi9cblx0cHVibGljIGZpbmRDb21tYW5kKG5hbWU6IHN0cmluZyk6IENvbW1hbmQgfCB1bmRlZmluZWQge1xuXHRcdHJldHVybiB0aGlzLnJlZ2lzdHJ5LmZpbmRDb21tYW5kKG5hbWUpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJlZ2lzdGVycyBwbHVnaW4gbWFuYWdlbWVudCBjb21tYW5kcy5cblx0ICovXG5cdHByaXZhdGUgcmVnaXN0ZXJQbHVnaW5Db21tYW5kcygpIHtcblx0XHR0aGlzLnJlZ2lzdGVyKHtcblx0XHRcdG5hbWU6IFwicGx1Z2luXCIsXG5cdFx0XHRkZXNjcmlwdGlvbjogXCJQbHVnaW4gbWFuYWdlbWVudCBjb21tYW5kc1wiLFxuXHRcdFx0b3B0aW9uczogW1xuXHRcdFx0XHQvLyBEZWZpbmUgYW55IG9wdGlvbnMgZm9yIHRoZSAncGx1Z2luJyBjb21tYW5kIGlmIG5lY2Vzc2FyeVxuXHRcdFx0XSxcblx0XHRcdHN1YmNvbW1hbmRzOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRuYW1lOiBcImxvYWRcIixcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJMb2FkIGEgcGx1Z2luXCIsXG5cdFx0XHRcdFx0b3B0aW9uczogW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRuYW1lOiBcInBhdGhcIixcblx0XHRcdFx0XHRcdFx0YWxpYXM6IFwicFwiLFxuXHRcdFx0XHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJQYXRoIHRvIHBsdWdpblwiLFxuXHRcdFx0XHRcdFx0XHRyZXF1aXJlZDogdHJ1ZSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRhY3Rpb246IGFzeW5jIChhcmdzOiBBcmdzKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zdCBwYXRoID0gYXJncy5mbGFncy5wYXRoIGFzIHN0cmluZztcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luTG9hZGVyLmxvYWRQbHVnaW4ocGF0aCwgdGhpcyk7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG5hbWU6IFwidW5sb2FkXCIsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IFwiVW5sb2FkIGEgcGx1Z2luXCIsXG5cdFx0XHRcdFx0b3B0aW9uczogW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRuYW1lOiBcIm5hbWVcIixcblx0XHRcdFx0XHRcdFx0YWxpYXM6IFwiblwiLFxuXHRcdFx0XHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJQbHVnaW4gbmFtZVwiLFxuXHRcdFx0XHRcdFx0XHRyZXF1aXJlZDogdHJ1ZSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRhY3Rpb246IGFzeW5jIChhcmdzOiBBcmdzKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zdCBuYW1lID0gYXJncy5mbGFncy5uYW1lIGFzIHN0cmluZztcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luTG9hZGVyLnVubG9hZFBsdWdpbihuYW1lLCB0aGlzKTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bmFtZTogXCJsaXN0XCIsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IFwiTGlzdCBsb2FkZWQgcGx1Z2luc1wiLFxuXHRcdFx0XHRcdGFjdGlvbjogKCkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3QgcGx1Z2lucyA9IHRoaXMucGx1Z2luTG9hZGVyLmxpc3RQbHVnaW5zKCk7XG5cdFx0XHRcdFx0XHRpZiAocGx1Z2lucy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXCJObyBwbHVnaW5zIGxvYWRlZFwiKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXCJMb2FkZWQgcGx1Z2luczpcIik7XG5cdFx0XHRcdFx0XHRmb3IgKGNvbnN0IHBsdWdpbiBvZiBwbHVnaW5zKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdFx0XHRcdGAtICR7cGx1Z2luLm5hbWV9IHYke3BsdWdpbi52ZXJzaW9ufTogJHtcblx0XHRcdFx0XHRcdFx0XHRcdHBsdWdpbi5kZXNjcmlwdGlvbiB8fCBcIlwiXG5cdFx0XHRcdFx0XHRcdFx0fWAsXG5cdFx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0XHRhY3Rpb246IChfYXJnczogQXJncykgPT4geyAvLyBSZW1vdmVkICdhc3luYycgYW5kIHJlbmFtZWQgJ2FyZ3MnIHRvICdfYXJncydcblx0XHRcdFx0Y29uc29sZS5sb2coXG5cdFx0XHRcdFx0XCJQbHVnaW4gbWFuYWdlbWVudCBjb21tYW5kcy4gVXNlICdwbHVnaW4gW2NvbW1hbmRdJyB0byBtYW5hZ2UgcGx1Z2lucy5cIixcblx0XHRcdFx0KTtcblx0XHRcdH0sXG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogU2V0cyB0aGUgQ0xJIHRvIHJlYWR5IHN0YXRlIGFuZCByZXNvbHZlcyBhbnkgcGVuZGluZyBsb2FkaW5nIHByb21pc2Vcblx0ICovXG5cdHB1YmxpYyBtYXJrQXNSZWFkeSgpOiB2b2lkIHtcblx0XHR0aGlzLnJlYWR5ID0gdHJ1ZTtcblx0XHR0aGlzLmxvYWRpbmdQcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5cdFx0dGhpcy5sb2dnZXIuZGVidWcoXCJDTEkgaXMgcmVhZHlcIik7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgd2FpdEZvclJlYWR5KCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICh0aGlzLnJlYWR5KSByZXR1cm47XG5cdFx0aWYgKHRoaXMubG9hZGluZ1Byb21pc2UpIHtcblx0XHRcdGF3YWl0IHRoaXMubG9hZGluZ1Byb21pc2U7XG5cdFx0fVxuXHR9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsY0FBYztBQUNkLFNBQWtCLGVBQWUsUUFBUSxlQUFlO0FBQ3hELFNBQW9CLE1BQU0sUUFBUSxjQUFjLENBQUMscUJBQXFCO0FBQ3RFLFNBQVMsSUFBSSxRQUFRLFlBQVk7QUFDakMsU0FBUyxZQUFZLFFBQVEsY0FBYztBQUMzQyxTQUNDLG9CQUFvQixFQUNwQixnQkFBZ0IsRUFDaEIsVUFBVSxFQUNWLHVCQUF1QixRQUNqQixhQUFhLENBQUMsK0NBQStDO0FBQ3BFLFNBQTZCLGtCQUFrQixRQUFRLGtCQUFrQjtBQUN6RSxTQUFTLE1BQU0sRUFBRSxLQUFLLFFBQVEsY0FBYztBQUM1QyxTQUFTLElBQUksUUFBUSxZQUFZO0FBQ2pDLFNBQVMsWUFBWSxRQUFRLHFCQUFxQjtBQXNCbEQsT0FBTyxNQUFNO0VBQ0osU0FBMEI7RUFDMUIsT0FBZTtFQUNmLEtBQVc7RUFDWCxhQUF1QztFQUN2QyxTQUE2QyxDQUFDLEVBQUU7RUFDaEQsU0FBa0I7RUFDbEIsbUJBQXVDO0VBQ3ZDLEtBQVc7RUFDWCxhQUEyQjtFQUMzQixRQUFpQixNQUFNO0VBQ3ZCLGVBQStCO0VBRXZDLDJCQUEyQjtFQUNYLE9BQWdCO0VBRWhDLFlBQ0MsVUFBbUIsRUFDbkIsYUFBYSxLQUFLLEVBQ2xCLFdBQVcsS0FBSyxFQUNoQixjQUF3QixDQUN2QjtJQUNELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSTtJQUNwQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUk7SUFDbEIsSUFBSSxDQUFDLFlBQVksR0FBRyxhQUFhLFlBQVksSUFBSSxhQUFhO0lBQzlELElBQUksQ0FBQyxRQUFRLEdBQUc7SUFDaEIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUk7SUFDOUIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLEtBQUssSUFBSSxDQUFDLE1BQU07SUFDaEMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLEtBQUssSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSTtJQUM3QyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUk7SUFFeEIsNkRBQTZEO0lBQzdELElBQUksQ0FBQyxNQUFNLEdBQUcsa0JBQWtCO0lBRWhDLHlCQUF5QjtJQUN6QixJQUFJLENBQUMsb0JBQW9CO0lBQ3pCLElBQUksQ0FBQyxzQkFBc0I7RUFFM0IsOEJBQThCO0VBQzlCLG9FQUFvRTtFQUNyRTtFQUVBOztFQUVDLEdBQ0QsQUFBUSx1QkFBNkI7SUFDcEMsSUFBSSxDQUFDLFFBQVEsQ0FBQztNQUNiLE1BQU07TUFDTixhQUFhO01BQ2IsU0FBUztRQUFDO1VBQ1QsTUFBTTtVQUNOLE1BQU07VUFDTixhQUFhO1VBQ2IsVUFBVTtRQUNYO09BQUU7TUFDRixRQUFRLE9BQU87UUFDZCxNQUFNLFVBQVUsS0FBSyxLQUFLLENBQUMsT0FBTztRQUNsQyxJQUFJLFNBQVM7VUFDWixNQUFNLFVBQVUsSUFBSSxDQUFDLFdBQVcsQ0FBQztVQUNqQyxJQUFJLFNBQVM7WUFDWixRQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQztVQUNwQyxPQUFPO1lBQ04sUUFBUSxLQUFLLENBQUMsQ0FBQyxTQUFTLEVBQUUsUUFBUSxZQUFZLENBQUM7VUFDaEQ7UUFDRCxPQUFPO1VBQ04sUUFBUSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZO1FBQ25DO01BQ0Q7SUFDRDtFQUNEO0VBRUE7OztFQUdDLEdBQ0QsU0FBUyxPQUFnQixFQUFFO0lBQzFCLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO0lBQ3ZCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsb0JBQW9CLEVBQUUsUUFBUSxJQUFJLENBQUMsQ0FBQztFQUN4RDtFQUVBOzs7RUFHQyxHQUNELElBQUksVUFBOEIsRUFBRTtJQUNuQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDO0VBQzdCO0VBRUE7Ozs7RUFJQyxHQUNELGFBQWEsSUFBYSxFQUFVO0lBQ25DLE1BQU0sU0FBUyxBQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxJQUFlO0lBRXBELE9BQVE7TUFDUCxLQUFLO1FBQ0osT0FBTyxLQUFLLFNBQVMsQ0FBQyxNQUFNLE1BQU07TUFDbkMsS0FBSztRQUNKLCtCQUErQjtRQUMvQixPQUFPLE9BQU87TUFDZixLQUFLO01BQ0w7UUFDQyxPQUFPLE9BQU87SUFDaEI7RUFDRDtFQUVBOzs7RUFHQyxHQUNELE1BQU0sWUFBWSxXQUFxQixFQUFFO0lBQ3hDLEtBQUssTUFBTSxRQUFRLFlBQWE7TUFDL0IsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxNQUFNLElBQUk7SUFDOUM7RUFDRDtFQUVBOzs7RUFHQyxHQUNELHFCQUFzQztJQUNyQyxPQUFPLElBQUksQ0FBQyxRQUFRO0VBQ3JCO0VBRUE7O0VBRUMsR0FDRCxNQUFNLE1BQU07SUFDWCxJQUFJO01BQ0gsa0RBQWtEO01BQ2xELElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtRQUN0QixJQUFJO1VBQ0gsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSTtRQUMzQyxFQUFFLE9BQU8sUUFBUTtVQUNoQixJQUFJLENBQUMsQ0FBQyxrQkFBa0IsS0FBSyxNQUFNLENBQUMsUUFBUSxHQUFHO1lBQzlDLE1BQU07VUFDUDtRQUNEO01BQ0Q7TUFFQSxZQUFZO01BQ1osTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUk7TUFFcEIsTUFBTSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFLElBQUk7TUFDOUMsS0FBSyxHQUFHLEdBQUcsSUFBSTtNQUVmLDRCQUE0QjtNQUM1QixJQUFJLEtBQUssS0FBSyxDQUFDLE9BQU8sRUFBRTtRQUN2QixNQUFNLFVBQVUsS0FBSyxLQUFLLENBQUMsT0FBTztRQUNsQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUM7TUFDeEI7TUFFQSwrQkFBK0I7TUFDL0IsSUFBSSxLQUFLLE9BQU8sQ0FBQyxRQUFRLENBQUMsU0FBUztRQUNsQyxNQUFNLFlBQVksS0FBSyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQ3ZDLE1BQU0sYUFBYSxLQUFLLE9BQU8sQ0FBQyxZQUFZLEVBQUU7UUFDOUMsSUFBSSxZQUFZO1VBQ2YsTUFBTSxVQUFVLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDO1VBQzFDLElBQUksU0FBUztZQUNaLFFBQVEsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDO1VBQ3BDLE9BQU87WUFDTixRQUFRLEtBQUssQ0FBQyxDQUFDLFNBQVMsRUFBRSxXQUFXLFlBQVksQ0FBQztVQUNuRDtRQUNELE9BQU87VUFDTixRQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVk7UUFDbkM7UUFDQTtNQUNEO01BRUEsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQ3BDLE1BQU0sVUFBVSxLQUFLLE9BQU8sQ0FBQyxFQUFFO1FBQy9CLElBQUksU0FBUztVQUNaLE1BQU0sVUFBVSxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQztVQUMxQyxJQUFJLFNBQVM7WUFDWixRQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQztZQUNuQztVQUNEO1FBQ0Q7UUFDQSxRQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVk7UUFDbEM7TUFDRDtNQUVBLElBQUksS0FBSyxPQUFPLENBQUMsTUFBTSxLQUFLLEdBQUc7UUFDOUIsSUFBSSxDQUFDLFFBQVE7UUFDYjtNQUNEO01BRUEsTUFBTSxDQUFDLFNBQVMsR0FBRyxRQUFRLEdBQUcsS0FBSyxPQUFPO01BQzFDLE1BQU0sVUFBVSxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQztNQUUxQyxJQUFJLENBQUMsU0FBUztRQUNiLE1BQU0sSUFBSSxxQkFBcUI7TUFDaEM7TUFFQSwrQ0FBK0M7TUFDL0MsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLE1BQU07TUFFNUMsNEJBQTRCO01BQzVCLElBQUksUUFBUSxNQUFNLEdBQUcsS0FBSyxRQUFRLFdBQVcsRUFBRTtRQUM5QyxNQUFNLGFBQWEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsU0FBUztRQUN6RCxJQUFJLENBQUMsWUFBWTtVQUNoQixNQUFNLElBQUksd0JBQXdCLFFBQVEsSUFBSSxDQUFDO1FBQ2hEO1FBQ0EsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLFlBQVksS0FBSyxLQUFLO1FBQ2hELE1BQU0sV0FBVyxNQUFNLENBQUM7TUFDekIsT0FBTztRQUNOLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEtBQUssS0FBSztRQUM3QyxNQUFNLFFBQVEsTUFBTSxDQUFDO01BQ3RCO0lBQ0QsRUFBRSxPQUFPLEtBQUs7TUFDYixNQUFNLFFBQVE7TUFDZCxJQUFJLGlCQUFpQixZQUFZO1FBQ2hDLFFBQVEsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVM7VUFBRSxTQUFTLE1BQU0sT0FBTztRQUFDO01BQzdELE9BQU87UUFDTixRQUFRLEtBQUssQ0FDWixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxvQkFBb0I7VUFBRSxTQUFTLE1BQU0sT0FBTztRQUFDO01BRTNEO01BQ0EsSUFBSSxDQUFDLFFBQVE7TUFDYixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNuQixLQUFLLElBQUksQ0FBQztNQUNYO01BQ0EsTUFBTSxPQUFPLHdCQUF3QjtJQUN0QztFQUNEO0VBRUE7OztFQUdDLEdBQ0QsTUFBTSxXQUFXLElBQWMsRUFBaUI7SUFDL0MsSUFBSTtNQUNILE1BQU0sYUFBYSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUk7TUFFL0MsbUNBQW1DO01BQ25DLElBQUksV0FBVyxPQUFPLENBQUMsTUFBTSxLQUFLLEdBQUc7UUFDcEM7TUFDRDtNQUVBLE1BQU0sQ0FBQyxTQUFTLEdBQUcsUUFBUSxHQUFHLFdBQVcsT0FBTztNQUNoRCxNQUFNLFVBQVUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUM7TUFFMUMsSUFBSSxDQUFDLFNBQVM7UUFDYixNQUFNLElBQUkscUJBQXFCO01BQ2hDO01BRUEsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLFlBQVk7TUFFbEQsSUFBSSxRQUFRLE1BQU0sR0FBRyxLQUFLLFFBQVEsV0FBVyxFQUFFO1FBQzlDLE1BQU0sYUFBYSxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTO1FBQ3pELElBQUksQ0FBQyxZQUFZO1VBQ2hCLE1BQU0sSUFBSSx3QkFBd0IsUUFBUSxJQUFJLENBQUM7UUFDaEQ7UUFDQSxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxXQUFXLEtBQUs7UUFDdEQsTUFBTSxXQUFXLE1BQU0sQ0FBQztNQUN6QixPQUFPO1FBQ04sTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsV0FBVyxLQUFLO1FBQ25ELE1BQU0sUUFBUSxNQUFNLENBQUM7TUFDdEI7SUFDRCxFQUFFLE9BQU8sT0FBZ0I7TUFDeEIsTUFBTSxlQUFlLGlCQUFpQixRQUNuQyxNQUFNLE9BQU8sR0FDYixPQUFPO01BQ1YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQywwQkFBMEIsRUFBRSxhQUFhLENBQUM7TUFDN0QsTUFBTTtJQUNQO0VBQ0Q7RUFFQTs7OztFQUlDLEdBQ0QsTUFBTSxlQUNMLE9BQWdCLEVBQ2hCLEtBQWdDLEVBQy9CO0lBQ0QsSUFBSSxDQUFDLFFBQVEsT0FBTyxJQUFJLFFBQVEsT0FBTyxDQUFDLE1BQU0sS0FBSyxHQUFHO0lBRXRELE1BQU0saUJBQTRDLENBQUM7SUFFbkQsS0FBSyxNQUFNLFVBQVUsUUFBUSxPQUFPLENBQUU7TUFDckMsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxLQUFLLEVBQUUsU0FBUyxZQUFZLEVBQUUsUUFBUSxFQUFFLEdBQ2xFLFFBQVEsNEJBQTRCO01BQ3JDLElBQUk7TUFFSixJQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssV0FBVztRQUM5QixRQUFRLEtBQUssQ0FBQyxLQUFLO01BQ3BCLE9BQU8sSUFBSSxTQUFTLEtBQUssQ0FBQyxNQUFNLEtBQUssV0FBVztRQUMvQyxRQUFRLEtBQUssQ0FBQyxNQUFNO01BQ3JCLE9BQU8sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssS0FBSyxXQUFXO1FBQzNDLFFBQVEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLO01BQzFCLE9BQU87UUFDTixRQUFRO01BQ1Q7TUFFQSxJQUFJLFVBQVUsV0FBVztRQUN4QixvRUFBb0U7UUFDcEUsY0FBYyxDQUFDLEtBQUssR0FBRztNQUN4QixPQUFPLElBQUksVUFBVTtRQUNwQixNQUFNLElBQUksaUJBQWlCLE1BQU0sUUFBUSx3Q0FBd0M7TUFDbEY7SUFDRDtJQUVBLGlDQUFpQztJQUNqQyxNQUFNLFdBQVcsY0FBYyxDQUFDLFlBQVk7SUFDNUMsSUFBSSxZQUFZLE9BQU8sYUFBYSxVQUFVO01BQzdDLE1BQU0sUUFBUSxTQUFTLFdBQVc7TUFDbEMsTUFBTSxNQUFNO1FBQUUsU0FBUztVQUFFLFNBQVM7WUFBRTtZQUFPLFVBQVU7Y0FBQzthQUFVO1VBQUM7UUFBRTtNQUFFO0lBQ3RFO0lBRUEsdUNBQXVDO0lBQ3ZDLEtBQUssTUFBTSxDQUFDLEtBQUssTUFBTSxJQUFJLE9BQU8sT0FBTyxDQUFDLGdCQUFpQjtNQUMxRCxLQUFLLENBQUMsSUFBSSxHQUFHO0lBQ2Q7RUFDRDtFQUVBOztFQUVDLEdBQ0QsV0FBVztJQUNWLFFBQVEsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWTtFQUNuQztFQUVBOzs7OztFQUtDLEdBQ0QsQUFBTyxFQUNOLEdBQVcsRUFDWCxZQUE4QyxFQUNyQztJQUNULE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSztFQUN6QjtFQUVBOzs7RUFHQyxHQUNELGFBQXNCO0lBQ3JCLE9BQU8sSUFBSSxDQUFDLFFBQVE7RUFDckI7RUFFQTs7O0VBR0MsR0FDRCxtQkFBNkI7SUFDNUIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLGdCQUFnQjtFQUMxQztFQUVBOzs7O0VBSUMsR0FDRCxBQUFPLFlBQVksSUFBWSxFQUF1QjtJQUNyRCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDO0VBQ2xDO0VBRUE7O0VBRUMsR0FDRCxBQUFRLHlCQUF5QjtJQUNoQyxJQUFJLENBQUMsUUFBUSxDQUFDO01BQ2IsTUFBTTtNQUNOLGFBQWE7TUFDYixTQUFTLEVBRVI7TUFDRCxhQUFhO1FBQ1o7VUFDQyxNQUFNO1VBQ04sYUFBYTtVQUNiLFNBQVM7WUFDUjtjQUNDLE1BQU07Y0FDTixPQUFPO2NBQ1AsTUFBTTtjQUNOLGFBQWE7Y0FDYixVQUFVO1lBQ1g7V0FDQTtVQUNELFFBQVEsT0FBTztZQUNkLE1BQU0sT0FBTyxLQUFLLEtBQUssQ0FBQyxJQUFJO1lBQzVCLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJO1VBQzlDO1FBQ0Q7UUFDQTtVQUNDLE1BQU07VUFDTixhQUFhO1VBQ2IsU0FBUztZQUNSO2NBQ0MsTUFBTTtjQUNOLE9BQU87Y0FDUCxNQUFNO2NBQ04sYUFBYTtjQUNiLFVBQVU7WUFDWDtXQUNBO1VBQ0QsUUFBUSxPQUFPO1lBQ2QsTUFBTSxPQUFPLEtBQUssS0FBSyxDQUFDLElBQUk7WUFDNUIsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxNQUFNLElBQUk7VUFDaEQ7UUFDRDtRQUNBO1VBQ0MsTUFBTTtVQUNOLGFBQWE7VUFDYixRQUFRO1lBQ1AsTUFBTSxVQUFVLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVztZQUM3QyxJQUFJLFFBQVEsTUFBTSxLQUFLLEdBQUc7Y0FDekIsUUFBUSxHQUFHLENBQUM7Y0FDWjtZQUNEO1lBQ0EsUUFBUSxHQUFHLENBQUM7WUFDWixLQUFLLE1BQU0sVUFBVSxRQUFTO2NBQzdCLFFBQVEsR0FBRyxDQUNWLENBQUMsRUFBRSxFQUFFLE9BQU8sSUFBSSxDQUFDLEVBQUUsRUFBRSxPQUFPLE9BQU8sQ0FBQyxFQUFFLEVBQ3JDLE9BQU8sV0FBVyxJQUFJLEdBQ3RCLENBQUM7WUFFSjtVQUNEO1FBQ0Q7T0FDQTtNQUNELFFBQVEsQ0FBQztRQUNSLFFBQVEsR0FBRyxDQUNWO01BRUY7SUFDRDtFQUNEO0VBRUE7O0VBRUMsR0FDRCxBQUFPLGNBQW9CO0lBQzFCLElBQUksQ0FBQyxLQUFLLEdBQUc7SUFDYixJQUFJLENBQUMsY0FBYyxHQUFHLFFBQVEsT0FBTztJQUNyQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztFQUNuQjtFQUVBLE1BQWEsZUFBOEI7SUFDMUMsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO0lBQ2hCLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRTtNQUN4QixNQUFNLElBQUksQ0FBQyxjQUFjO0lBQzFCO0VBQ0Q7QUFDRCJ9
// denoCacheMetadata=13130729825026731266,17327022160085587139