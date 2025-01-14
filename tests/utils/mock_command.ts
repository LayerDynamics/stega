export class MockCommand implements Deno.Command {
	#cmd: string;
	#options: Deno.CommandOptions;
	#shouldSucceed: boolean;

	constructor(
		cmd: string | URL,
		options?: Deno.CommandOptions,
		shouldSucceed = true,
	) {
		this.#cmd = cmd.toString();
		this.#options = options ?? { args: [] };
		this.#shouldSucceed = shouldSucceed;
	}

	output(): Promise<Deno.CommandOutput> {
		return Promise.resolve({
			code: this.#shouldSucceed ? 0 : 1,
			success: this.#shouldSucceed,
			stdout: new Uint8Array(),
			stderr: new Uint8Array(),
			signal: null,
		});
	}

	spawn(): Deno.ChildProcess {
		return {
			pid: 1234,
			status: Promise.resolve({
				success: this.#shouldSucceed,
				code: this.#shouldSucceed ? 0 : 1,
				signal: null,
			}),
			output: () => this.output(),
			stderrOutput: () => Promise.resolve(new Uint8Array()),
			stdin: new WritableStream(),
			stdout: new ReadableStream(),
			stderr: new ReadableStream(),
			unref() {},
			ref() {},
			kill() {},
		};
	}
}
