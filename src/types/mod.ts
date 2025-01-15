// src/types/mod.ts
// Export process types with namespace to avoid conflicts
export * as ProcessTypes from "./process.ts";

// Re-export core types explicitly
import type { Command as CoreCommand } from "../core/mod.ts";
import type {
	Args,
	BuildOptions,
	CommandLifecycle,
	FlagType,
	FlagValue,
	ValidationRules,
} from "./types.ts";

export interface PluginRegistry {
	name: string;
	version: string;
	url: string;
	integrity?: string;
}

export type {
	Args,
	BuildOptions,
	CommandLifecycle,
	CoreCommand as Command,
	FlagType,
	FlagValue,
	ValidationRules,
};

// Also export other types from types.ts
export * from "./types.ts";
