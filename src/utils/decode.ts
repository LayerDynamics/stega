// src/utils/decode.ts
const decoder = new TextDecoder();

/**
 * Decode a Uint8Array into a string using UTF-8
 */
export function decode(input: Uint8Array): string {
	return decoder.decode(input);
}

/**
 * Convert a Base64 string to an ArrayBuffer
 */
export function decodeBase64(base64: string): ArrayBuffer {
	const binaryStr = atob(base64);
	const bytes = new Uint8Array(binaryStr.length);
	for (let i = 0; i < binaryStr.length; i++) {
		bytes[i] = binaryStr.charCodeAt(i);
	}
	return bytes.buffer;
}

/**
 * Decode a Base64 string to UTF-8 text
 */
export function decodeBase64Text(base64: string): string {
	return decoder.decode(decodeBase64(base64));
}

/**
 * Decode a hex string to Uint8Array
 */
export function decodeHex(hex: string): Uint8Array {
	if (hex.length % 2 !== 0) {
		throw new Error("Hex string must have an even number of characters");
	}

	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		const byte = parseInt(hex.substr(i, 2), 16);
		if (isNaN(byte)) {
			throw new Error("Invalid hex string");
		}
		bytes[i / 2] = byte;
	}
	return bytes;
}

/**
 * Decode URL-safe Base64 to regular Base64
 */
export function decodeBase64Url(base64url: string): string {
	return base64url
		.replace(/-/g, "+")
		.replace(/_/g, "/")
		.replace(/[^A-Za-z0-9+/]/g, "");
}
