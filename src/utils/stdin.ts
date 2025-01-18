// src/utils/stdin.ts

/**
 * Enhanced stdin handler for Deno applications.
 * Provides utilities for reading from standard input in various modes.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const BUFFER_SIZE = 4096;

export interface StdinOptions {
	raw?: boolean;
	echo?: boolean;
	bufferSize?: number;
	stripNewlines?: boolean;
	timeout?: number;
}

/**
 * A class for handling standard input operations in Deno with advanced terminal features.
 *
 * @class
 * @example
 * ```ts
 * const stdin = new Stdin();
 * const line = await stdin.readLine();
 * ```
 *
 * @property {boolean} private isRawMode - Tracks if terminal is in raw mode
 * @property {Uint8Array} private buffer - Internal buffer for reading data
 * @property {number} private currentPosition - Current position in the buffer
 * @property {boolean} private isReading - Flag indicating if reading is in progress
 *
 * @interface StdinOptions
 * @property {number} [bufferSize] - Size of the internal buffer
 * @property {boolean} [raw] - Enable raw mode for input
 * @property {boolean} [echo] - Enable character echoing
 * @property {boolean} [stripNewlines] - Remove newline characters from output
 *
 * @throws {Deno.errors.NotSupported} When raw mode is not supported
 * @throws {Deno.errors.Interrupted} When input is interrupted (Ctrl+C)
 */
export class Stdin {
	private isRawMode = false;
	private buffer: Uint8Array;
	private currentPosition = 0;
	private isReading = false;

	constructor(private options: StdinOptions = {}) {
		this.buffer = new Uint8Array(options.bufferSize || BUFFER_SIZE);
	}

	/**
	 * Read a single line from stdin.
	 */
	async readLine(options: StdinOptions = {}): Promise<string> {
		const mergedOptions = { ...this.options, ...options };
		let line = "";
		let char: string;

		while ((char = await this.readChar(mergedOptions)) !== "\n") {
			if (char === null) break;
			line += char;
		}

		return mergedOptions.stripNewlines ? line : line + "\n";
	}

	/**
	 * Read a single character from stdin.
	 */
	async readChar(options: StdinOptions = {}): Promise<string> {
		const mergedOptions = { ...this.options, ...options };

		if (mergedOptions.raw && !this.isRawMode) {
			await this.setRawMode(true);
		}

		try {
			const buffer = new Uint8Array(1);
			const bytesRead = await Deno.stdin.read(buffer);

			if (bytesRead === null) {
				return "";
			}

			const char = decoder.decode(buffer.subarray(0, bytesRead));

			if (mergedOptions.echo && !mergedOptions.raw) {
				await Deno.stdout.write(encoder.encode(char));
			}

			return char;
		} catch (error) {
			if (error instanceof Deno.errors.Interrupted) {
				return "\x03"; // CTRL+C
			}
			throw error;
		}
	}

	/**
	 * Read multiple lines until EOF or delimiter.
	 */
	async *readLines(options: StdinOptions = {}): AsyncIterableIterator<string> {
		const mergedOptions = { ...this.options, ...options };
		let line: string;

		while ((line = await this.readLine(mergedOptions)) !== null) {
			if (line === "") break;
			yield mergedOptions.stripNewlines ? line.trimEnd() : line;
		}
	}

	/**
	 * Read raw bytes from stdin.
	 */
	async readBytes(length?: number): Promise<Uint8Array> {
		const buffer = new Uint8Array(length || this.buffer.length);
		const bytesRead = await Deno.stdin.read(buffer);

		return bytesRead === null
			? new Uint8Array(0)
			: buffer.subarray(0, bytesRead);
	}

	/**
	 * Read a password without echoing characters.
	 */
	async readPassword(prompt = "Password: "): Promise<string> {
		await Deno.stdout.write(encoder.encode(prompt));

		const previousRawMode = this.isRawMode;
		await this.setRawMode(true);

		let password = "";

		try {
			while (true) {
				const char = await this.readChar({ echo: false });

				if (char === "\r" || char === "\n") {
					await Deno.stdout.write(encoder.encode("\n"));
					break;
				}

				if (char === "\x03") { // CTRL+C
					await Deno.stdout.write(encoder.encode("^C\n"));
					return "";
				}

				if (char === "\x08" || char === "\x7f") { // Backspace
					if (password.length > 0) {
						password = password.slice(0, -1);
						await Deno.stdout.write(encoder.encode("\x08 \x08"));
					}
					continue;
				}

				password += char;
				await Deno.stdout.write(encoder.encode("*"));
			}
		} finally {
			if (!previousRawMode) {
				await this.setRawMode(false);
			}
		}

		return password;
	}

	/**
	 * Set raw mode for terminal input.
	 */
	async setRawMode(enabled: boolean): Promise<void> {
		if (this.isRawMode === enabled) return;

		try {
			await Deno.stdin.setRaw(enabled);
			this.isRawMode = enabled;
		} catch (error) {
			if (!(error instanceof Deno.errors.NotSupported)) {
				throw error;
			}
		}
	}

	/**
	 * Check if stdin is connected to a TTY.
	 */
	isTTY(): boolean {
		return Deno.stdin.isTerminal();
	}

	/**
	 * Read with timeout.
	 */
	async readWithTimeout<T>(
		reader: () => Promise<T>,
		timeout: number,
	): Promise<T | null> {
		const timeoutPromise = new Promise<null>((resolve) => {
			setTimeout(() => resolve(null), timeout);
		});

		return await Promise.race([reader(), timeoutPromise]);
	}

	/**
	 * Clean up resources and restore terminal state.
	 */
	async dispose(): Promise<void> {
		if (this.isRawMode) {
			await this.setRawMode(false);
		}
	}
}

// Export singleton instance
export default new Stdin();
