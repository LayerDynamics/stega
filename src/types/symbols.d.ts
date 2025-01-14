declare global {
	interface SymbolConstructor {
		readonly asyncDispose: unique symbol;
	}

	interface AsyncDisposable {
		[Symbol.asyncDispose](): Promise<void>;
	}

	interface ChildProcess extends AsyncDisposable {
		readonly pid: number;
		readonly stdin: WritableStream<Uint8Array>;
		readonly stdout: ReadableStream<Uint8Array>;
		readonly stderr: ReadableStream<Uint8Array>;
		readonly status: Promise<{
			success: boolean;
			code: number;
			signal: number | null;
		}>;
		output(): Promise<{
			code: number;
			success: boolean;
			stdout: Uint8Array;
			stderr: Uint8Array;
			signal: number | null;
		}>;
		stderrOutput(): Promise<Uint8Array>;
		kill(signal?: string): void;
		ref(): void;
		unref(): void;
	}
}

export {};
