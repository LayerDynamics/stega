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
