// src/types/deno.run.d.ts

declare global {
	interface Deno {
		run(options: Deno.RunOptions): Deno.Process;
	}

	namespace Deno {
		interface RunOptions {
			cmd: string[];
			// Use type union with Deno's built-in types
			stdout?: "inherit"|"piped"|"null";
			stderr?: "inherit"|"piped"|"null";
			stdin?: "inherit"|"piped"|"null";
			// Use URL type for cwd
			cwd?: string|URL;
			env?: Record<string,string>;
		}

		interface CommandOptions {
			cmd?: string[];
			args?: string[];
			stdout?: "inherit"|"piped"|"null";
			stderr?: "inherit"|"piped"|"null";
			stdin?: "inherit"|"piped"|"null";
			cwd?: string|URL;
			env?: Record<string,string>;
		}

		interface Process {
			status(): Promise<{success: boolean; code: number}>;
			output(): Promise<Uint8Array>;
			stderrOutput(): Promise<Uint8Array>;
			close(): void;
			kill(signo: number): void;
			rid: number;
			stdin?: WritableStream<Uint8Array>;
			stdout?: ReadableStream<Uint8Array>;
			stderr?: ReadableStream<Uint8Array>;
		}
	}
}

export {};