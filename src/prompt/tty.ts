// src/prompt/tty.ts
/**
 * Represents a TTY (teletypewriter) interface providing methods to read from and write to the terminal.
 *
 * @remarks
 * This class allows enabling or disabling raw mode on the terminal, as well as performing cursor manipulation.
 */
 
/**
 * Sets the raw mode on the terminal to either enabled or disabled.
 *
 * @param enabled - A boolean indicating if raw mode should be enabled or disabled.
 * @returns A promise that resolves when the raw mode change is complete.
 */
 
/**
 * Writes the provided string to the standard output.
 *
 * @param data - The string to write to the terminal.
 * @returns A promise that resolves when the write operation is complete.
 */
 
/**
 * Reads a specified number of bytes from the standard input.
 *
 * @param size - The number of bytes to read. Defaults to 1.
 * @returns A promise resolving to the string representation of the read data.
 */
 
/**
 * Restores the terminal to its default mode if raw mode is currently enabled.
 *
 * @returns A promise that resolves when the terminal mode is restored.
 */
 
/**
 * Clears the entire terminal screen.
 */
 
/**
 * Clears the current line in the terminal output.
 */
 
/**
 * Moves the cursor by the specified offsets horizontally and vertically.
 *
 * @param dx - Horizontal offset; negative for left, positive for right.
 * @param dy - Vertical offset; negative for up, positive for down.
 */
export class TTY {
	private static encoder = new TextEncoder();
	private static decoder = new TextDecoder();
	private static isRawMode = false;

	static async setRawMode(enabled: boolean): Promise<void> {
		if (this.isRawMode !== enabled) {
			await Deno.stdin.setRaw(enabled);
			this.isRawMode = enabled;
		}
	}

	static async write(data: string): Promise<void> {
		await Deno.stdout.write(this.encoder.encode(data));
	}

	static async read(size = 1): Promise<string> {
		const buf = new Uint8Array(size);
		const n = await Deno.stdin.read(buf);
		return this.decoder.decode(buf.subarray(0, n ?? 0));
	}

	static async restore(): Promise<void> {
		if (this.isRawMode) {
			await Deno.stdin.setRaw(false);
			this.isRawMode = false;
		}
	}

	static clear(): void {
		console.clear();
	}

	static clearLine(): void {
		this.write("\r\x1b[K");
	}

	static moveCursor(dx: number, dy: number): void {
		if (dx < 0) this.write(`\x1b[${-dx}D`);
		else if (dx > 0) this.write(`\x1b[${dx}C`);
		if (dy < 0) this.write(`\x1b[${-dy}A`);
		else if (dy > 0) this.write(`\x1b[${dy}B`);
	}
}
