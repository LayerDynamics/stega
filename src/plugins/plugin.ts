// src/plugin.ts
import { CLI } from "../core/core.ts";

export interface PluginMetadata {
	name: string;
	version: string;
	description?: string;
	dependencies?: string[];
}

export interface BuildOptions {
	output: string;
	target: string;
	allowPermissions: string[];
	entry: string;
}

export interface Plugin {
	metadata: PluginMetadata;
	init(cli: CLI): void | Promise<void>;
	unload?(cli: CLI): void | Promise<void>;
	beforeBuild?(options: BuildOptions): Promise<boolean | void>;
	afterBuild?(options: BuildOptions, success: boolean): void | Promise<void>;
}
