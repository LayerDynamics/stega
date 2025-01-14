// src/plugin.ts
import { CLI } from './core.ts';

// Remove unused logger import
// import { logger } from "./logger.ts";

export interface PluginMetadata {
	name: string;
	version: string;
	description?: string;
	dependencies?: string[]; // Added dependencies property
}

export interface BuildOptions {
	output: string;
	target: string;
	allowPermissions: string[];
	entry: string;
}

export interface Plugin {
	metadata: PluginMetadata; // Changed from inline type to PluginMetadata
	init(cli: CLI): void | Promise<void>;
	unload?(cli: CLI): void | Promise<void>;

	/**
	 * Hook called before the build process starts.
	 * Return false to cancel the build, void or true to continue.
	 */
	beforeBuild?(options: BuildOptions): Promise<boolean | void>;

	/**
	 * Hook called after the build process completes.
	 */
	afterBuild?(options: BuildOptions, success: boolean): void | Promise<void>;
}

// Removed the duplicated PluginLoader class to avoid conflicts
