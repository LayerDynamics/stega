// src/types/mod.ts
// Export process types with namespace to avoid conflicts
export * as ProcessTypes from "./process.ts";

// Re-export types from other modules
export type { Command as CoreCommand } from "../core/mod.ts";
export type {
	Args,
	BuildOptions,
	CommandLifecycle,
	ValidationRules,
} from "./types.ts";
export type { FlagType, FlagValue } from "../flag.ts";

export interface PluginRegistry {
	name: string;
	version: string;
	url: string;
	integrity?: string;
}

// Export remaining types
export * from "./types.ts";
