/**
 * Stega CLI Framework
 * A comprehensive command-line interface framework for Deno with advanced features.
 *
 * @module
 */

// Core exports
export { CLI } from "./core/core.ts";
export { CommandRegistry } from "./command.ts";
export { Parser } from "./parser.ts";
export { Help } from "./help.ts";
export { ConfigLoader } from "./config.ts";

// Plugin system
export type { Plugin, PluginMetadata } from "./plugins/plugin.ts";
export { PluginLoader } from "./plugins/plugin_loader.ts";

// Command system
export * from "./commands/mod.ts";

// Middleware system
export type { MiddlewareFunction } from "./middleware/middleware.ts";
export { MiddlewareRegistry } from "./middleware/middleware.ts";

// Types
export type {
	Args,
	BuildOptions,
	CommandLifecycle,
	Option,
	ValidationRules,
} from "./types/types.ts";

// Re-export Command type from a single location
export type { Command } from "./command.ts";

// Error handling
export {
	CommandNotFoundError,
	InvalidFlagValueError,
	MissingFlagError,
	StegaError,
	SubcommandNotFoundError,
} from "./error.ts";

// Utilities
export { logger, setup as setupLogger } from "./logger/logger.ts";
export type { ILogger } from "./logger/logger_interface.ts";
export { convertFlagValue, type FlagType, type FlagValue } from "./flag.ts";
export { I18n } from "./i18n.ts";

// Compiler system
export * from "./compiler/mod.ts";
