// src/types/deno.run.d.ts

declare global {
	interface Deno {
		Command: {
			new (name: string | URL, options?: Deno.CommandOptions): Deno.Command;
			prototype: Deno.Command;
		};
	}

	namespace Deno {
		interface CommandOptions {
			args?: string[];
			env?: Record<string, string>;
			stdout?: "inherit" | "piped" | "null";
			stderr?: "inherit" | "piped" | "null";
			stdin?: "inherit" | "piped" | "null";
			cwd?: string | URL;
		}

		interface Command {
			spawn(): Deno.ChildProcess;
			output(): Promise<CommandOutput>;
		}

		interface CommandOutput {
			code: number;
			success: boolean;
			signal: Deno.Signal | null;
			readonly stdout: Uint8Array;
			readonly stderr: Uint8Array;
		}

		interface ChildProcess {
			readonly pid: number;
			readonly status: Promise<CommandStatus>;
			stdout: ReadableStream<Uint8Array>;
			stderr: ReadableStream<Uint8Array>;
			stdin: WritableStream<Uint8Array>;
			unref(): void;
			ref(): void;
			kill(signo?: number): void;
		}

		interface CommandStatus {
			success: boolean;
			code: number;
			signal: Deno.Signal | null;
		}
	}
}

export {};
