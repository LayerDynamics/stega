// mod.ts - Main entry point for Stega CLI Framework

// Core exports
export {CLI} from "./src/core/core.ts";
export {CommandRegistry} from "./src/command.ts";
export {Parser} from "./src/parser.ts";
export {Help} from "./src/help.ts";
export {ConfigLoader} from "./src/config.ts";

// Command system exports
export * from "./src/commands/mod.ts";

// Plugin system
export type {Plugin,PluginMetadata} from "./src/plugins/plugin.ts";
export {PluginLoader} from "./src/plugins/plugin_loader.ts";
export {PLUGIN_REGISTRY} from "./src/plugins/registry.ts";

// Middleware system
export type {MiddlewareFunction} from "./src/middleware/middleware.ts";
export {MiddlewareRegistry} from "./src/middleware/middleware.ts";
export {loggingMiddleware} from "./src/middleware/logger.ts";

// Types
export type {
	Args,
	BuildOptions,
	CommandLifecycle,
	Option,
	ValidationRules,
} from "./src/types/types.ts";

// Re-export Command type
export type {Command} from "./src/command.ts";

// Error handling
export {
	CommandNotFoundError,
	InvalidFlagValueError,
	MissingFlagError,
	StegaError,
	SubcommandNotFoundError,
} from "./src/error.ts";

// Utilities
export {logger,setup as setupLogger} from "./src/logger/logger.ts";
export type {ILogger} from "./src/logger/logger_interface.ts";
export {convertFlagValue,type FlagType,type FlagValue} from "./src/flag.ts";
export {I18n} from "./src/i18n.ts";

// Compiler system
export * from "./src/compiler/mod.ts";

// Prompts and Progress
export * from "./src/prompts.ts";
export {ProgressBar,Spinner} from "./src/progress.ts";

// IO and Process
export * from "./src/io.ts";
export * from "./src/types/process.ts";