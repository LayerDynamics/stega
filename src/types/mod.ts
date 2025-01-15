// src/types/mod.ts
// Export process types with namespace to avoid conflicts
export * as ProcessTypes from "./process.ts";

// Re-export core types explicitly
import type { Command as CoreCommand } from "../core/mod.ts";
import type {
  Args,
  BuildOptions,
  ValidationRules,
  CommandLifecycle,
  FlagType,
  FlagValue,
} from "./types.ts";

export interface PluginRegistry {
    name: string;
    version: string;
    url: string;
    integrity?: string;
}

export type {
  CoreCommand as Command,
  Args,
  BuildOptions,
  ValidationRules,
  CommandLifecycle,
  FlagType,
  FlagValue,
};

// Also export other types from types.ts
export * from "./types.ts";