// src/types.ts
import {FlagValue} from "./flag.ts";
import type { CLI } from "./core.ts";  // Add import for CLI type

/**
 * Represents the arguments passed to a command's action.
 */
export interface Args {
	command: string[];
	flags: Record<string,FlagValue>;
	cli: CLI;  // Add required CLI property
}

export type JsTarget="es5"|"es6"|"es2017"|"es2020";
export type ModuleFormat="esm"|"cjs"|"umd";

export interface GeneratedOutput {
	code: string;
	map?: string;
	warnings?: string[];
	assets?: Map<string,unknown>;
}

export interface CompilerOptions {
	entryPoint: string;
	outDir: string;
	sourceMaps: boolean;  // Changed from optional
	minify: boolean;      // Changed from optional
	target: JsTarget;
	plugins: CompilerPlugin[];
	module: ModuleFormat; // Changed from string to ModuleFormat
	platform: string;
	externals: string[];
	define: Record<string,string>;
	format: ModuleFormat;
	umdName?: string;
	experimentalDecorators: boolean;
	treeshake: boolean;
}

export interface CodeGenOptions {
	sourceMaps: boolean;
	minify: boolean;
	target: JsTarget;
	format?: ModuleFormat;
}

export interface CompilerPlugin {
	name: string;
	setup: (context: BuildContext) => void;
}

export interface BuildContext {
	onLoad: (callback: (args: OnLoadArgs) => Promise<OnLoadResult>) => void;
	onResolve: (callback: (args: OnResolveArgs) => Promise<OnResolveResult>) => void;
	onTransform: (callback: (args: OnTransformArgs) => Promise<OnTransformResult>) => void;
}

export interface OnLoadArgs {
	path: string;
}

export interface OnLoadResult {
	contents: string;
	loader?: string;
}

export interface OnResolveArgs {
	path: string;
	importer: string;
}

export interface OnResolveResult {
	path: string;
	external?: boolean;
}

export interface OnTransformArgs {
	path: string;
	contents: string;
}

export interface OnTransformResult {
	code: string;
	map?: string;
}

export interface Module {
	path: string;
	code: string;
	dependencies: string[];
	ast: unknown;
}

// Type guard for Module
export function isModule(value: unknown): value is Module {
	return (
		typeof value==="object"&&
		value!==null&&
		"path" in value&&
		"code" in value&&
		"dependencies" in value&&
		"ast" in value
	);
}

export interface BuildOptions {
	output: string;
	target: string;
	allowPermissions: string[];
	entry: string;
}
