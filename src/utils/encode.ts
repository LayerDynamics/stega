// src/utils/encode.ts
const encoder=new TextEncoder();

/**
 * Encode a string into a Uint8Array using UTF-8
 */
export function encode(input: string): Uint8Array {
    return encoder.encode(input);
}

/**
 * Convert a string to Base64
 */
export function encodeBase64(input: string): string {
    return btoa(input);
}

/**
 * Convert Base64 to string
 */
export function decodeBase64(input: string): string {
    return atob(input);
}
