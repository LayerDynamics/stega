// src/io.ts
type Reader = {
	read(p: Uint8Array): Promise<number | null>;
};

const BUFFER_SIZE = 4096;

export class TextLineReader {
	private decoder = new TextDecoder();

	constructor(private reader: Reader) {}

	async *readLines(): AsyncIterableIterator<string> {
		const buffer = new Uint8Array(BUFFER_SIZE);
		let leftover = new Uint8Array(0);

		while (true) {
			const readResult = await this.reader.read(buffer);
			if (readResult === null) {
				if (leftover.length > 0) {
					yield this.decoder.decode(leftover).trim();
				}
				break;
			}

			const chunk = buffer.subarray(0, readResult);
			const fullChunk = concat([leftover, chunk]);
			const lines = this.decoder.decode(fullChunk).split("\n");

			if (readResult < BUFFER_SIZE) {
				// Last chunk
				yield* lines.map((line) => line.trim());
				break;
			} else {
				// More chunks coming
				const lastLine = lines.pop() || "";
				yield* lines.map((line) => line.trim());
				leftover = this.encoder.encode(lastLine);
			}
		}
	}

	private encoder = new TextEncoder();
}

function concat(arrays: Uint8Array[]): Uint8Array {
	const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return result;
}

export function readLines(reader: Reader): AsyncIterableIterator<string> {
	const lineReader = new TextLineReader(reader);
	return lineReader.readLines();
}
