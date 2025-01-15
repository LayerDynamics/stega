/**
 * Stega CLI Framework
 * A comprehensive command-line interface framework for Deno with advanced features.
 * 
 * @module
 */

// Core exports
export {CLI} from "./src/core/core.ts";
export {Command,CommandRegistry} from "./src/command.ts";
export {Parser} from "./src/parser.ts";
export {Help} from "./src/help.ts";
export {ConfigLoader} from "./src/config.ts";

// Plugin system
export {type Plugin,type PluginMetadata} from "./src/plugin.ts";
export {PluginLoader} from "./src/plugin_loader.ts";

// Command system
export * from "./src/commands/mod.ts";

// Middleware system
export {type MiddlewareFunction} from "./src/middleware/middleware.ts";
export {MiddlewareRegistry} from "./src/middleware/middleware.ts";

// Types
export type {
	Args,
	BuildOptions,
	Command,
	Option,
	ValidationRules,
	CommandLifecycle,
} from "./src/types/types.ts";

// Error handling
export {
	StegaError,
	CommandNotFoundError,
	InvalidFlagValueError,
	MissingFlagError,
	SubcommandNotFoundError,
} from "./src/error.ts";

// Utilities
export {logger,setup as setupLogger} from "./src/logger/logger.ts";
export type {ILogger} from "./src/logger/logger_interface.ts";
export {type FlagType,type FlagValue,convertFlagValue} from "./src/flag.ts";
export {I18n} from "./src/i18n.ts";

// Compiler system
export * from "./src/compiler/mod.ts";