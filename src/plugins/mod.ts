// src/plugins/mod.ts

// Core plugin types and interfaces
export type { BuildOptions, Plugin, PluginMetadata } from "./plugin.ts";

// Plugin loader and registry
export { PluginLoader, ValidationError } from "./plugin_loader.ts";
export { PLUGIN_REGISTRY } from "./registry.ts";
export type { PluginKey } from "./registry.ts";

// Example plugins
export { default as SamplePlugin } from "./sample-plugin.ts";
export { default as TemplatePlugin } from "./template-plugin.ts";

// Additional plugin utilities and types
export type {
	PluginModule,
	PluginSource,
	RemotePluginSource,
} from "./plugin_loader.ts";
