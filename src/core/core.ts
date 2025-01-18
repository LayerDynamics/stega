// src/core.ts
import { Command, CommandRegistry } from "../command.ts";
import { FlagValue, Parser } from "../parser.ts"; // Imported FlagValue
import { Help } from "../help.ts";
import { ConfigLoader } from "../config.ts";
import {
	CommandNotFoundError,
	MissingFlagError,
	StegaError,
	SubcommandNotFoundError,
} from "../error.ts"; // Removed InvalidFlagValueError as it's unused
import {
	MiddlewareFunction,
	MiddlewareRegistry,
} from "../middleware/middleware.ts";
import { logger, setup } from "../logger/logger.ts";
import { I18n } from "../i18n.ts";
import { PluginLoader } from "../plugins/mod.ts"; // Updated import path
import { Plugin } from "../plugins/plugin.ts"; // Updated path
import type { LevelName } from "jsr:@std/log@0.224.0/levels"; // Changed from /levels.ts to /levels
import type { ILogger } from "../logger/logger_interface.ts";
import type { Args } from "../types/types.ts";

export type { Command };

export interface Option {
	name: string;
	alias?: string;
	description?: string;
	type: "boolean" | "string" | "number" | "array";
	default?: unknown;
	required?: boolean;
}

export interface BuildOptions {
	output: string;
	target: string;
	allowPermissions: string[];
	entry: string;
}

/**
 * Represents the main Command Line Interface (CLI) application.
 * Handles command registration, parsing, plugin management, internationalization,
 * and execution of commands.
 * 
 * @example
 * ```typescript
 * const cli = new CLI();
 * await cli.run();
 * ```
 * 
 * @class
 * @property {CommandRegistry} registry - Stores and manages CLI commands
 * @property {Parser} parser - Parses command line arguments
 * @property {Help} help - Generates help documentation
 * @property {ConfigLoader} configLoader - Loads configuration from files
 * @property {Record<string, FlagValue>} config - Stores CLI configuration
 * @property {boolean} testMode - Indicates if CLI is running in test mode
 * @property {MiddlewareRegistry} middlewareRegistry - Manages middleware functions
 * @property {I18n} i18n - Handles internationalization
 * @property {PluginLoader} pluginLoader - Manages CLI plugins
 * @property {boolean} ready - Indicates if CLI is ready for use
 * @property {Promise<void>} loadingPromise - Promise resolving when CLI is loaded
 * @property {ILogger} logger - Logger instance for CLI operations
 * 
 * @throws {CommandNotFoundError} When a specified command is not found
 * @throws {SubcommandNotFoundError} When a specified subcommand is not found
 * @throws {MissingFlagError} When a required flag is missing
 * @throws {StegaError} When a CLI-specific error occurs
 */
export class CLI {
	private registry: CommandRegistry;
	private parser: Parser;
	private help: Help;
	private configLoader: ConfigLoader | undefined;
	private config: Partial<Record<string, FlagValue>> = {}; // Updated type
	private testMode: boolean;
	private middlewareRegistry: MiddlewareRegistry;
	private i18n: I18n;
	private pluginLoader: PluginLoader;
	private ready: boolean = false;
	private loadingPromise?: Promise<void>;

	// Injected logger instance
	public readonly logger: ILogger;

	constructor(
		configPath?: string,
		skipConfig = false,
		testMode = false,
		injectedLogger?: ILogger,
	) {
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
	 */
	private registerCoreCommands(): void {
		this.register({
			name: "help",
			description: "Display help information",
			options: [{
				name: "command",
				type: "string",
				description: "Command to get help for",
				required: false,
			}],
			action: async (args: Args) => {
				const cmdName = args.flags.command as string | undefined;
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
			},
		});
	}

	/**
	 * Registers a new command with the CLI.
	 * @param command The command to register.
	 */
	register(command: Command) {
		this.registry.register(command);
		this.logger.debug(`Registered command: ${command.name}`);
	}

	/**
	 * Registers a middleware function.
	 * @param middleware The middleware function to register.
	 */
	use(middleware: MiddlewareFunction) {
		this.middlewareRegistry.use(middleware);
	}

	/**
	 * Formats output based on specified format.
	 * @param data The data to format.
	 * @returns The formatted string.
	 */
	formatOutput(data: unknown): string {
		const format = (this.config["output"] as string) || "text";

		switch (format) {
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
	 */
	async loadPlugins(pluginPaths: string[]) {
		for (const path of pluginPaths) {
			await this.pluginLoader.loadPlugin(path, this);
		}
	}

	/**
	 * Retrieves the command registry.
	 * @returns The CommandRegistry instance.
	 */
	getCommandRegistry(): CommandRegistry {
		return this.registry;
	}

	/**
	 * Runs the CLI application by parsing arguments and executing the appropriate command.
	 */
	async run() {
		try {
			// Load configuration first if configLoader exists
			if (this.configLoader) {
				try {
					this.config = await this.configLoader.load();
				} catch (_error) { // Renamed to _error to indicate intentional non-use
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
				const plugins = args.flags.plugins as string[];
				await this.loadPlugins(plugins);
			}

			// Handle help command or flags
			if (args.command.includes("help")) {
				const helpIndex = args.command.indexOf("help");
				const helpTarget = args.command[helpIndex + 1];
				if (helpTarget) {
					const command = this.findCommand(helpTarget);
					if (command) {
						this.logger.info(this.help.generateHelp(command));
					} else {
						this.logger.error(
							this.i18n.t("command_not_found", { command: helpTarget }),
						);
					}
				} else {
					this.showHelp();
				}
				return;
			}

			if (args.flags.help || args.flags.h) {
				const cmdName = args.command[0];
				if (cmdName) {
					const command = this.findCommand(cmdName);
					if (command) {
						this.logger.info(this.help.generateHelp(command));
						return;
					}
				}
				this.showHelp();
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
			const error = err as Error;
			if (error instanceof StegaError) {
				this.logger.error(this.i18n.t("error", { message: error.message }));
			} else {
				this.logger.error(
					this.i18n.t("unexpected_error", { message: error.message }),
				);
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
	 */
	async runCommand(args: string[]): Promise<void> {
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
		} catch (error: unknown) {
			const errorMessage = error instanceof Error
				? error.message
				: String(error);
			this.logger.error(`Command execution failed: ${errorMessage}`);
			throw error;
		}
	}

	/**
	 * Processes and validates the options for a command.
	 * @param command The command whose options are to be processed.
	 * @param flags The raw flags parsed from the command line.
	 */
	async processOptions(
		command: Command,
		flags: Record<string, FlagValue>,
	) {
		if (!command.options || command.options.length === 0) return;

		const processedFlags: Record<string, FlagValue> = {};

		for (const option of command.options) {
			const { name, alias, type: _type, default: defaultValue, required } =
				option; // Renamed 'type' to '_type'
			let value: FlagValue | undefined;

			if (flags[name] !== undefined) {
				value = flags[name];
			} else if (alias && flags[alias] !== undefined) {
				value = flags[alias];
			} else if (this.config[name] !== undefined) {
				value = this.config[name] as FlagValue;
			} else {
				value = defaultValue as FlagValue;
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
			const level = logLevel.toUpperCase() as LevelName;
			await setup({ loggers: { default: { level, handlers: ["console"] } } });
		}

		// Attach processed flags to args.flags
		for (const [key, value] of Object.entries(processedFlags)) {
			flags[key] = value;
		}
	}

	/**
	 * Displays the general help information.
	 */
	showHelp() {
		const helpText = this.help.generateHelp();
		this.logger.info(this.i18n.t("available_commands"));
		console.log(helpText);
	}

	/**
	 * Translates a key using the I18n system.
	 * @param key The key to translate.
	 * @param placeholders Optional placeholders for the translation.
	 * @returns The translated string.
	 */
	public t(
		key: string,
		placeholders?: Record<string, string | number>,
	): string {
		return this.i18n.t(key, placeholders);
	}

	/**
	 * Returns whether the CLI is running in test mode
	 * @returns Boolean indicating test mode status
	 */
	isTestMode(): boolean {
		return this.testMode;
	}

	/**
	 * Retrieves all loaded plugins.
	 * @returns An array of loaded plugins.
	 */
	getLoadedPlugins(): Plugin[] {
		return this.pluginLoader.getLoadedPlugins();
	}

	/**
	 * Finds a command by name.
	 * @param name The name of the command to find.
	 * @returns The found command or undefined.
	 */
	public findCommand(name: string): Command | undefined {
		return this.registry.findCommand(name);
	}

	/**
	 * Registers plugin management commands.
	 */
	private registerPluginCommands() {
		this.register({
			name: "plugin",
			description: "Plugin management commands",
			options: [
				// Define any options for the 'plugin' command if necessary
			],
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
							required: true,
						},
					],
					action: async (args: Args) => {
						const path = args.flags.path as string;
						await this.pluginLoader.loadPlugin(path, this);
					},
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
							required: true,
						},
					],
					action: async (args: Args) => {
						const name = args.flags.name as string;
						await this.pluginLoader.unloadPlugin(name, this);
					},
				},
				{
					name: "list",
					description: "List loaded plugins",
					action: () => {
						const plugins = this.pluginLoader.listPlugins();
						if (plugins.length === 0) {
							console.log("No plugins loaded");
							return;
						}
						console.log("Loaded plugins:");
						for (const plugin of plugins) {
							console.log(
								`- ${plugin.name} v${plugin.version}: ${
									plugin.description || ""
								}`,
							);
						}
					},
				},
			],
			action: (_args: Args) => { // Removed 'async' and renamed 'args' to '_args'
				console.log(
					"Plugin management commands. Use 'plugin [command]' to manage plugins.",
				);
			},
		});
	}

	/**
	 * Sets the CLI to ready state and resolves any pending loading promise
	 */
	public markAsReady(): void {
		this.ready = true;
		this.loadingPromise = Promise.resolve();
		this.logger.debug("CLI is ready");
	}

	public async waitForReady(): Promise<void> {
		if (this.ready) return;
		if (this.loadingPromise) {
			await this.loadingPromise;
		}
	}

	public getI18n(
		key: string,
		placeholders?: Record<string, string | number>,
	): string {
		return this.i18n.t(key, placeholders);
	}
}
