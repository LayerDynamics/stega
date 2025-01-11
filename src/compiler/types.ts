
// /src/compiler/types.ts
import {ts,SourceFile} from "https://deno.land/x/ts_morph@17.0.1/mod.ts";

/**
 * Supported module formats for the bundler.
 */
export type ModuleFormat="es6"|"commonjs"|"umd";

/**
 * Generated output interface for compilation results.
 */
export interface GeneratedOutput {
	code: string;
	map?: string;
	warnings?: string[];
	assets?: Map<string,unknown>;
}

/**
 * Bundle result interface for bundler output.
 */
export interface BundleResult {
	code: string;
	map?: string;
	modules: Map<string,string>;
}

/**
 * Compiler options interface extending necessary configurations.
 */
export interface CompilerOptions {
	target: ts.ScriptTarget;
	module: ts.ModuleKind;
	experimentalDecorators?: boolean;
	entryPoint: string;
	outDir: string;
	sourceMaps: boolean;
	minify: boolean;
	plugins: Array<CompilerPlugin>;
	platform: "browser"|"node"|"deno";
	externals: string[];
	define: {[key: string]: string};
	treeshake: boolean;
	format: ModuleFormat;
	umdName?: string;
	emitDecoratorMetadata?: boolean;
}

/**
 * Code generation options interface.
 */
export interface CodeGenOptions {
	sourceMaps: boolean;
	minify: boolean;
	target: ts.ScriptTarget|string;
	format?: ModuleFormat;
	platform?: "browser"|"node"|"deno";
	externals?: string[];
}

// Re-export needed types
export {type SourceFile};

/**
 * Generic value type for compiler options.
 */
export type CompilerOptionsValue=string|number|boolean|undefined;

/**
 * Interface representing a compiler plugin.
 */
export interface CompilerPlugin {
	name: string;
	setup(build: BuildContext): void|Promise<void>;
}

/**
 * Build context interface providing hooks for plugins.
 */
export interface BuildContext {
	onLoad(callback: (args: OnLoadArgs) => Promise<OnLoadResult>): void;
	onResolve(callback: (args: OnResolveArgs) => Promise<OnResolveResult>): void;
	onTransform(callback: (args: OnTransformArgs) => Promise<OnTransformResult>): void;
}

/**
 * Arguments for the onLoad hook.
 */
export interface OnLoadArgs {
	path: string;
	namespace: string;
}

/**
 * Result returned by the onLoad hook.
 */
export interface OnLoadResult {
	contents: string;
	loader: "ts"|"js"|"json";
	resolveDir?: string;
}

/**
 * Arguments for the onResolve hook.
 */
export interface OnResolveArgs {
	path: string;
	importer: string;
}

/**
 * Result returned by the onResolve hook.
 */
export interface OnResolveResult {
	path: string;
	namespace: string;
}

/**
 * Arguments for the onTransform hook.
 */
export interface OnTransformArgs {
	path: string;
	contents: string;
	loader: string;
}

/**
 * Result returned by the onTransform hook.
 */
export interface OnTransformResult {
	contents: string;
	map?: string;
}

/**
 * Interface representing information about a module.
 */
export interface ModuleInfo {
	path: string;
	code: string;
	dependencies: string[];
	ast: unknown;
}
