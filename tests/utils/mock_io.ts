// tests/utils/mock_io.ts

import { toWritableStream } from "https://deno.land/std@0.224.0/io/mod.ts";

interface REPLStreamReader {
	read(p: Uint8Array): Promise<number | null>;
	setRaw?(mode: boolean): Promise<void>;
	close(): void;
}

interface REPLStreamWriter {
	write(p: Uint8Array): Promise<number>;
	close(): void;
}

/**
 * Mock implementation of REPLStreamReader for testing purposes.
 */
export class MockStreamReader implements REPLStreamReader {
	private encoder = new TextEncoder();
	private decoder = new TextDecoder();
	private queue: string[] = [];

	constructor(private lines: string[] = []) {
		// Lines are no longer enqueued in the constructor
	}

	/**
	 * Enqueue all characters from the provided lines into the queue.
	 * This method should be called explicitly to inject inputs.
	 */
	public enqueueLines(lines: string[]): void {
		for (const line of lines) {
			for (const char of line) {
				this.queue.push(char);
			}
		}
	}

	/**
	 * Read one character from the queue and write it to the provided buffer.
	 * @param p The buffer to write the character into.
	 * @returns The number of bytes written or null if the queue is empty.
	 */
	async read(p: Uint8Array): Promise<number | null> {
		if (this.queue.length === 0) return null;
		const char = this.queue.shift()!;
		const encoded = this.encoder.encode(char);
		const len = Math.min(encoded.length, p.length);
		p.set(encoded.slice(0, len));
		return len;
	}

	/**
	 * Mock implementation of setRaw (no-op).
	 * @param mode The raw mode state.
	 */
	async setRaw(mode: boolean): Promise<void> {
		// Mock implementation (no-op)
		return Promise.resolve();
	}

	/**
	 * Mock implementation of close (clears the queue).
	 */
	close(): void {
		// Mock implementation (no-op)
		this.queue = [];
	}

	/**
	 * Enqueue a single character into the queue.
	 * @param char The character to enqueue.
	 */
	public enqueueChar(char: string): void {
		this.queue.push(char);
	}

	/**
	 * Set multiple lines of input, splitting them into individual characters.
	 * @param lines The lines of input to set.
	 */
	public setLines(lines: string[]): void {
		this.enqueueLines(lines);
	}
}

/**
 * Mock implementation of REPLStreamWriter for testing purposes.
 */
export class MockStreamWriter implements REPLStreamWriter {
	public output: string[] = [];
	private decoder = new TextDecoder();

	/**
	 * Write data to the output buffer.
	 * @param p The data to write.
	 * @returns The number of bytes written.
	 */
	async write(p: Uint8Array): Promise<number> {
		const decoded = this.decoder.decode(p);
		this.output.push(decoded);
		return p.length;
	}

	/**
	 * Clear the output buffer.
	 */
	clear(): void {
		this.output = [];
	}

	/**
	 * Mock implementation of close (clears the output).
	 */
	close(): void {
		this.output = [];
	}

	/**
	 * Retrieve the current output.
	 * @returns An array of output strings.
	 */
	get(): string[] {
		return this.output;
	}
}

/**
 * Creates a mock input stream with predefined lines.
 * @param lines Array of strings to enqueue as input.
 * @returns A MockStreamReader instance.
 */
export function createMockInput(lines: string[]): MockStreamReader;

/**
 * Creates a mock input stream using a generator function.
 * @param fn A function that returns a string to enqueue as input.
 * @returns A MockStreamReader instance.
 */
export function createMockInput(fn: () => string): MockStreamReader;

/**
 * Creates a mock input stream with predefined lines or a generator function.
 * @param input Array of strings or a generator function to enqueue as input.
 * @returns A MockStreamReader instance.
 */
export function createMockInput(
	input: string[] | (() => string),
): MockStreamReader {
	if (typeof input === "function") {
		const generator = input;
		const reader = new MockStreamReader();
		// The generator function can be used to enqueue inputs as needed
		return reader;
	}
	const reader = new MockStreamReader();
	reader.setLines(input);
	return reader;
}

/**
 * Creates a mock output stream that captures written data.
 * @returns A MockStreamWriter instance.
 */
export function createMockOutput(): MockStreamWriter {
	return new MockStreamWriter();
}
