// src/types/deno.run.d.ts

declare global {
	interface Deno {
		run(options: Deno.RunOptions): Deno.Process;
	}

	namespace Deno {
		interface RunOptions {
			cmd: readonly string[]|[string|URL,...string[]];
			stdout?: "inherit"|"piped"|"null"|number;
			stderr?: "inherit"|"piped"|"null"|number;
			stdin?: "inherit"|"piped"|"null"|number;
			cwd?: string;
			env?: Record<string,string>;
		}

		interface CommandOptions {
			cmd?: readonly string[]|[string|URL,...string[]];
			args?: string[];
			stdout?: "inherit"|"piped"|"null"|number;
			stderr?: "inherit"|"piped"|"null"|number;
			stdin?: "inherit"|"piped"|"null"|number;
			cwd?: string;
			env?: Record<string,string>;
		}

		interface Process {
			status(): Promise<{success: boolean; code: number}>;
			output(): Promise<Uint8Array>;
			stderrOutput(): Promise<Uint8Array>;
			close(): void;
			kill(signo: number): void;
			readonly rid: number;
			readonly stdin: Writer&Closer&{
				writable: WritableStream<Uint8Array>;
			}|null;
			readonly stdout: Reader&Closer&{
				readable: ReadableStream<Uint8Array>;
			}|null;
			readonly stderr: Reader&Closer&{
				readable: ReadableStream<Uint8Array>;
			}|null;
		}

		interface Writer {
			write(p: Uint8Array): Promise<number>;
		}

		interface Reader {
			read(p: Uint8Array): Promise<number|null>;
		}

		interface Closer {
			close(): void;
		}
	}
}

export {};