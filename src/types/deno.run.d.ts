// /src/types/deno.run.d.ts
declare global {
	interface Deno {
		run(options: Deno.RunOptions): Deno.Process;
	}

	namespace Deno {
		interface RunOptions {
			cmd: string[];
			stdout?: 'inherit' | 'piped' | 'null' | number;
			stderr?: 'inherit' | 'piped' | 'null' | number;
			stdin?: 'inherit' | 'piped' | 'null' | number;
			cwd?: string;
			env?: Record<string, string>;
		}

		interface CommandOptions {
			cmd?: string[];
			args?: string[];
			stdout?: 'inherit' | 'piped' | 'null' | number;
			stderr?: 'inherit' | 'piped' | 'null' | number;
			stdin?: 'inherit' | 'piped' | 'null' | number;
			cwd?: string;
			env?: Record<string, string>;
		}

		interface Process {
			status(): Promise<{ success: boolean; code: number }>;
			output(): Promise<Uint8Array>;
			stderrOutput(): Promise<Uint8Array>;
			close(): void;
			kill(signo: number): void;
			rid: number;
			stdin?: WritableStream;
			stdout?: ReadableStream;
			stderr?: ReadableStream;
		}
	}
}

export {};
