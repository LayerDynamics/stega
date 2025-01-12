// src/core.ts
import {CommandRegistry} from "./command.ts";
import {Parser} from "./parser.ts";
import {Help} from "./help.ts";
import {ConfigLoader} from "./config.ts";
import {StegaError,CommandNotFoundError,SubcommandNotFoundError,InvalidFlagValueError,MissingFlagError} from "./error.ts";
import {FlagValue,convertFlagValue} from "./flag.ts";
import {MiddlewareRegistry,MiddlewareFunction} from "./middleware.ts";
import {logger,setup} from "./logger.ts";
import {I18n} from "./i18n.ts";
import {PluginLoader} from "./plugin_loader.ts";
import {Plugin} from "./plugin.ts";
import type {LevelName} from "https://deno.land/std@0.224.0/log/levels.ts";
import type { ILogger } from "./logger_interface.ts";

export interface Option {
	name: string;
	alias?: string;
	description?: string;
	type: 'boolean'|'string'|'number'|'array';
	default?: FlagValue;
	required?: boolean;
}

export interface Command {
	name: string;
	description?: string;
	options?: Option[];
	subcommands?: Command[];
	action: (args: Args) => void|Promise<void>;
	aliases?: string[];
}

export interface Args {
	command: string[];
	flags: Record<string,FlagValue>;
	cli: CLI; // Made cli required
}

export interface BuildOptions {
	output: string;
	target: string;
	allowPermissions: string[];
	entry: string;
}

export class CLI {
	private registry: CommandRegistry;
	private parser: Parser;
	private help: Help;
	private configLoader: ConfigLoader;
	private config: Partial<Record<string,FlagValue>>={};
	private testMode: boolean;
	private middlewareRegistry: MiddlewareRegistry;
	private i18n: I18n;
	private pluginLoader: PluginLoader;

	// Injected logger instance
	public readonly logger: ILogger;

	constructor(
		configPath?: string,
		skipConfig=false,
		testMode=false,
		injectedLogger?: ILogger
	) {
		this.registry=new CommandRegistry();
		this.parser=new Parser();
		this.configLoader=skipConfig? undefined!:new ConfigLoader(configPath);
		this.testMode=testMode;
		this.middlewareRegistry=new MiddlewareRegistry();
		this.i18n=new I18n(this.config);
		this.help=new Help(this.registry,this.i18n);
		this.pluginLoader=new PluginLoader();

		// Assign the injected logger or default to the global logger
		this.logger=injectedLogger||logger;

		// Register plugin management commands
		this.registerPluginCommands();

		// Load default plugins if any
		// Optionally, add hooks or default plugin registrations for testing
	}

	/**
	 * Registers a new command with the CLI.
	 * @param command The command to register.
	 */
	register(command: Command) {
		this.registry.register(command);
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
	 */
	formatOutput(data: unknown): string {
		const format=this.config["output"] as string||"text";

		switch(format) {
			case "json":
				return JSON.stringify(data,null,2);
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
		for(const path of pluginPaths) {
			await this.pluginLoader.loadPlugin(path,this);
		}
	}

	/**
	 * Runs the CLI application by parsing arguments and executing the appropriate command.
	 */
	async run() {
		try {
			// Load configuration first if configLoader exists
			if(this.configLoader) {
				try {
					this.config=await this.configLoader.load();
				} catch(error) {
					if(!(error instanceof Deno.errors.NotFound)) {
						throw error;
					}
				}
			}

			// Load i18n
			await this.i18n.load();

			const args=this.parser.parse(Deno.args,this);
			args.cli=this;

			// Load plugins if specified
			if(args.flags.plugins) {
				const plugins=args.flags.plugins as string[];
				await this.loadPlugins(plugins);
			}

			// Handle help command or flags
			if(args.command.includes("help")) {
				const helpIndex=args.command.indexOf("help");
				const helpTarget=args.command[helpIndex+1];
				if(helpTarget) {
					const command=this.registry.findCommand(helpTarget);
					if(command) {
						console.log(this.help.generateHelp(command));
					} else {
						console.error(`Command "${helpTarget}" not found.`);
					}
				} else {
					console.log(this.help.generateHelp());
				}
				return;
			}

			if(args.flags.help||args.flags.h) {
				const cmdName=args.command[0];
				if(cmdName) {
					const command=this.registry.findCommand(cmdName);
					if(command) {
						console.log(this.help.generateHelp(command));
						return;
					}
				}
				console.log(this.help.generateHelp());
				return;
			}

			if(args.command.length===0) {
				this.showHelp();
				return;
			}

			const [cmdName,...subCmds]=args.command;
			const command=this.registry.findCommand(cmdName);

			if(!command) {
				throw new CommandNotFoundError(cmdName);
			}

			// Execute middleware before processing options
			await this.middlewareRegistry.execute(args,command);

			// Handle subcommands if any
			if(subCmds.length>0&&command.subcommands) {
				const subcommand=this.registry.findSubcommand(command,subCmds);
				if(!subcommand) {
					throw new SubcommandNotFoundError(subCmds.join(' '));
				}
				await this.processOptions(subcommand,args.flags);
				await subcommand.action(args);
			} else {
				await this.processOptions(command,args.flags);
				await command.action(args);
			}
		} catch(err) {
			const error=err as Error;
			if(error instanceof StegaError) {
				console.error(this.i18n.t("error",{message: error.message}));
			} else {
				console.error(this.i18n.t("unexpected_error",{message: error.message}));
			}
			this.showHelp();
			if(!this.testMode) {
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
			const parsedArgs=this.parser.parse(args,this);

			// Skip help handling in batch mode
			if(parsedArgs.command.length===0) {
				return;
			}

			const [cmdName,...subCmds]=parsedArgs.command;
			const command=this.registry.findCommand(cmdName);

			if(!command) {
				throw new CommandNotFoundError(cmdName);
			}

			await this.middlewareRegistry.execute(parsedArgs,command);

			if(subCmds.length>0&&command.subcommands) {
				const subcommand=this.registry.findSubcommand(command,subCmds);
				if(!subcommand) {
					throw new SubcommandNotFoundError(subCmds.join(' '));
				}
				await this.processOptions(subcommand,parsedArgs.flags);
				await subcommand.action(parsedArgs);
			} else {
				await this.processOptions(command,parsedArgs.flags);
				await command.action(parsedArgs);
			}
		} catch(error: unknown) {
			const errorMessage=error instanceof Error? error.message:String(error);
			this.logger.error(`Command execution failed: ${errorMessage}`);
			throw error;
		}
	}

	/**
	 * Processes and validates the options for a command.
	 * @param command The command whose options are to be processed.
	 * @param flags The raw flags parsed from the command line.
	 */
	async processOptions(command: Command,flags: Record<string,FlagValue>) {
		if(!command.options||command.options.length===0) return;

		const processedFlags: Record<string,FlagValue>={};

		for(const option of command.options) {
			const {name,alias,type,default: defaultValue,required}=option;
			let value: FlagValue|undefined;

			if(flags[name]!==undefined) {
				value=flags[name];
			} else if(alias&&flags[alias]!==undefined) {
				value=flags[alias];
			} else if(this.config[name]!==undefined) {
				value=this.config[name] as FlagValue;
			} else {
				value=defaultValue;
			}

			if(value!==undefined) {
				try {
					if(typeof value==='string') {
						processedFlags[name]=convertFlagValue(value,type);
					} else {
						processedFlags[name]=value;
					}
				} catch(_error) {
					throw new InvalidFlagValueError(name,type);
				}
			} else if(required) {
				throw new MissingFlagError(name);
			}
		}

		// Set log level if specified
		const logLevel=processedFlags["log-level"];
		if(logLevel&&typeof logLevel==="string") {
			const level=logLevel.toUpperCase() as LevelName;
			await setup({loggers: {default: {level}}});
		}

		command.action=this.wrapAction(command.action,processedFlags);
	}

	/**
	 * Wraps the original action to inject processed flags into args.
	 * @param originalAction The original action function.
	 * @param processedFlags The processed flags to inject.
	 * @returns A new action function with injected flags.
	 */
	wrapAction(
		originalAction: (args: Args) => void|Promise<void>,
		processedFlags: Record<string,FlagValue>
	): (args: Args) => void|Promise<void> {
		return async (args: Args) => {
			args.flags={...args.flags,...processedFlags};
			args.cli=this; // Ensure cli is always provided
			await originalAction(args);
		};
	}

	/**
	 * Displays the general help information.
	 */
	showHelp() {
		console.log(this.help.generateHelp());
	}

	public t(key: string,placeholders?: Record<string,string|number>): string {
		return this.i18n.t(key,placeholders);
	}

	/**
	 * Returns whether the CLI is running in test mode
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

	public findCommand(name: string): Command|undefined {
		return this.registry.findCommand(name);
	}

	private registerPluginCommands() {
		this.register({
			name: "plugin",
			description: "Plugin management commands",
			action: () => {
				// Base command action - show plugin help
				this.showHelp();
			},
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
					action: async (args) => {
						const path=args.flags.path as string;
						await this.pluginLoader.loadPlugin(path,this);
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
					action: async (args) => {
						const name=args.flags.name as string;
						await this.pluginLoader.unloadPlugin(name,this);
					}
				},
				{
					name: "list",
					description: "List loaded plugins",
					action: () => {
						const plugins=this.pluginLoader.listPlugins();
						if(plugins.length===0) {
							console.log("No plugins loaded");
							return;
						}
						console.log("Loaded plugins:");
						for(const plugin of plugins) {
							console.log(`- ${plugin.name} v${plugin.version}: ${plugin.description||""}`);
						}
					}
				}
			]
		});
	}
}
