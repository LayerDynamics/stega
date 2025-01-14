export interface CoreConfig {
	name: string;
	version: string;
	description?: string;
}

export interface CommandOptions {
	name: string;
	description?: string;
	args?: string[];
	flags?: Record<string, unknown>;
}

export interface ExecutionContext {
	cwd: string;
	env: Record<string, string>;
}
