// src/index.ts

// Core functionality
export {CLI} from "./core.ts";
export {CommandRegistry} from "./command.ts";
export {Parser} from "./parser.ts";
export {Help} from "./help.ts";
export {ConfigLoader} from "./config.ts";
export {logger,setup as setupLogger} from "./logger.ts";
export {PluginLoader} from "./plugin_loader.ts";
export {MiddlewareRegistry} from "./middleware.ts";

// Command Exports
export * from "./commands/mod.ts";

// Error Types
export {
	StegaError,
	MissingFlagError,
	InvalidFlagValueError,
	CommandNotFoundError,
	SubcommandNotFoundError,
} from "./error.ts";

// Types
export type {Command,Option} from "./command.ts";
export type {Args} from "./types.ts";
export type {Config} from "./config.ts";
export type {Plugin,PluginMetadata} from "./plugin.ts";
export type {FlagType,FlagValue} from "./flag.ts";
export type {MiddlewareFunction} from "./middleware.ts";
export type {ILogger} from "./logger_interface.ts";

// Utilities
export {convertFlagValue} from "./flag.ts";
export {I18n} from "./i18n.ts";

// Compiler
export * from "./compiler/types.ts";
export {Bundler} from "./compiler/bundler.ts";
export {Cache} from "./compiler/cache.ts";
export {CodeGenerator} from "./compiler/codegen.ts";
export {Compiler} from "./compiler/compiler.ts";
export {DependencyGraph} from "./compiler/dependency-graph.ts";
export {Parser as CompilerParser} from "./compiler/parser.ts";
export {Transformer} from "./compiler/transformer.ts";