/**
 * Stega CLI Framework
 * A comprehensive command-line interface framework for Deno with advanced features.
 * 
 * @module
 */

// Core exports
export { CLI } from "./core/core.ts";
export type { Command } from "./command.ts";
export { CommandRegistry } from "./command.ts";
export { Parser } from "./parser.ts";
export { Help } from "./help.ts";
export { ConfigLoader } from "./config.ts";

// Plugin system
export type { Plugin, PluginMetadata, BuildOptions } from "./plugins/plugin.ts";
export { PluginLoader } from "./plugins/plugin_loader.ts";

// Command system
export * from "./commands/mod.ts";
