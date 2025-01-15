// src/types/process.ts

export interface RunOptions {
	cmd: string[];
	stdout?: "inherit" | "piped" | "null";
	stderr?: "inherit" | "piped" | "null";
	stdin?: "inherit" | "piped" | "null";
	cwd?: string | URL;
	env?: Record<string, string>;
}

export interface CommandOptions {
	cmd?: string[];
	args?: string[];
	stdout?: "inherit" | "piped" | "null";
	stderr?: "inherit" | "piped" | "null";
	stdin?: "inherit" | "piped" | "null";
	cwd?: string | URL;
	env?: Record<string, string>;
}

export interface ProcessStatus {
	success: boolean;
	code: number;
	signal: number | null;
}

export interface ProcessOutput {
	code: number;
	success: boolean;
	stdout: Uint8Array;
	stderr: Uint8Array;
	signal: number | null;
}

export interface AsyncDisposable {
	asyncDispose(): Promise<void>;
}

export interface ChildProcess extends AsyncDisposable {
	readonly pid: number;
	readonly stdin: WritableStream<Uint8Array>;
	readonly stdout: ReadableStream<Uint8Array>;
	readonly stderr: ReadableStream<Uint8Array>;
	readonly status: Promise<ProcessStatus>;
	output(): Promise<ProcessOutput>;
	stderrOutput(): Promise<Uint8Array>;
	kill(signal?: string): void;
	ref(): void;
	unref(): void;
}

export interface Process {
	status(): Promise<{ success: boolean; code: number }>;
	output(): Promise<Uint8Array>;
	stderrOutput(): Promise<Uint8Array>;
	close(): void;
	kill(signo: number): void;
	rid: number;
	stdin?: WritableStream<Uint8Array>;
	stdout?: ReadableStream<Uint8Array>;
	stderr?: ReadableStream<Uint8Array>;
}
