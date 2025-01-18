// src/types.ts
import type { CLI } from "../core/core.ts"; // Add import for CLI type

/**
 * Represents the arguments passed to a command's action.
 */
export interface Args {
	command: string[];
	flags: Record<string, FlagValue>;
	cli: CLI;
	[key: string]: unknown; // Changed from 'any' to 'unknown'
}

export type JsTarget = "es5" | "es6" | "es2017" | "es2020";
export type ModuleFormat = "esm" | "cjs" | "umd";

export interface GeneratedOutput {
	code: string;
	map?: string;
	warnings?: string[];
	assets?: Map<string, unknown>;
}

export interface CompilerOptions {
	entryPoint: string;
	outDir: string;
	sourceMaps: boolean; // Changed from optional
	minify: boolean; // Changed from optional
	target: JsTarget;
	plugins: CompilerPlugin[];
	module: ModuleFormat; // Changed from string to ModuleFormat
	platform: string;
	externals: string[];
	define: Record<string, string>;
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
	onResolve: (
		callback: (args: OnResolveArgs) => Promise<OnResolveResult>,
	) => void;
	onTransform: (
		callback: (args: OnTransformArgs) => Promise<OnTransformResult>,
	) => void;
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
		typeof value === "object" &&
		value !== null &&
		"path" in value &&
		"code" in value &&
		"dependencies" in value &&
		"ast" in value
	);
}

export interface BuildOptions {
	output: string;
	target: string;
	allowPermissions: string[];
	entry: string;
}

export type ValidatorFn = (value: unknown) => boolean | Promise<boolean>;
export type CustomValidator = (args: Args) => boolean | Promise<boolean>;

export interface CommandLifecycle {
	beforeExecute?: () => Promise<void>;
	afterExecute?: () => Promise<void>;
	onError?: (error: Error) => Promise<void>;
	cleanup?: () => Promise<void>;
}

export interface ValidationRules {
	flags?: Record<string, ValidatorFn>;
	args?: Record<string, ValidatorFn>;
	custom?: CustomValidator[];
}

export interface Command {
	name: string;
	description?: string;
	options?: Option[];
	subcommands?: Command[];
	action: (args: Args) => void | Promise<void>;
	aliases?: string[];
	category?: string;
	permissions?: string[];
	lifecycle?: CommandLifecycle;
	validation?: ValidationRules;
}

// Add Option interface
export interface Option {
	name: string;
	type: "string" | "number" | "boolean" | "array"; // Make type more specific
	description?: string;
	required?: boolean;
	default?: FlagValue; // Change from unknown to FlagValue
}

export abstract class BaseCommand implements Command {
	name: string = ""; // Initialize with empty string
	description?: string;
	options?: Option[];
	subcommands?: Command[];
	aliases?: string[];
	category?: string;
	permissions?: string[];
	lifecycle?: CommandLifecycle;
	validation?: ValidationRules;

	constructor(config: Partial<Command>) {
		Object.assign(this, config);
	}

	abstract action(args: Args): void | Promise<void>;

	protected async validateArgs(args: Args): Promise<boolean> {
		if (!this.validation) return true;

		// Validate flags
		if (this.validation.flags) {
			for (const [flag, validator] of Object.entries(this.validation.flags)) {
				if (args.flags[flag] !== undefined) {
					const isValid = await validator(args.flags[flag]);
					if (!isValid) return false;
				}
			}
		}

		// Validate args
		if (this.validation.args) {
			for (const [index, validator] of Object.entries(this.validation.args)) {
				const idx = parseInt(index);
				if (!isNaN(idx) && args.command[idx] !== undefined) {
					const isValid = await validator(args.command[idx]);
					if (!isValid) return false;
				}
			}
		}

		// Run custom validators
		if (this.validation.custom) {
			for (const validator of this.validation.custom) {
				const isValid = await validator(args);
				if (!isValid) return false;
			}
		}

		return true;
	}

	protected async executeWithLifecycle(args: Args): Promise<void> {
		try {
			if (this.lifecycle?.beforeExecute) {
				await this.lifecycle.beforeExecute();
			}

			const isValid = await this.validateArgs(args);
			if (!isValid) {
				throw new Error("Validation failed");
			}

			await this.action(args);

			if (this.lifecycle?.afterExecute) {
				await this.lifecycle.afterExecute();
			}
		} catch (error) {
			if (this.lifecycle?.onError) {
				await this.lifecycle.onError(
					error instanceof Error ? error : new Error(String(error)),
				);
			}
			throw error;
		} finally {
			if (this.lifecycle?.cleanup) {
				await this.lifecycle.cleanup();
			}
		}
	}
}

export type ValidationFunction<T> = (
	value: T,
) => boolean | string | Promise<boolean | string>;

export type BasePromptOptions = {
	message: string;
	defaultValue?: unknown;
	validate?: ValidationFunction<unknown>;
	color?: string;
};

export type ProgressBarOptions = {
	total: number;
	width?: number;
	complete?: string;
	incomplete?: string;
	format?: string;
};

export type SpinnerOptions = {
	text?: string;
	frames?: string[];
	interval?: number;
};

export interface DatePromptOptions extends BasePromptOptions {
	min?: Date;
	max?: Date;
	format?: string;
}

// Export FlagType and FlagValue directly
export type FlagType = "string" | "number" | "boolean" | "array";
export type FlagValue = string | number | boolean | Array<string>;
