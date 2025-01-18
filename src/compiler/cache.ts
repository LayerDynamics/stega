// /src/compiler/cache.ts
import { crypto } from "jsr:@std/crypto@0.224.0";

/**
 * A generic caching mechanism that stores values with content-based hash validation.
 *
 * This class provides a way to cache values and validate them against their original content
 * using SHA-256 hashing. This ensures that cached values are only returned when their
 * associated content remains unchanged.
 *
 * @template T - The type of values stored in the cache
 *
 * @example
 * ```typescript
 * const cache = new Cache<string>();
 * await cache.set('key', 'value', 'content');
 * const value = await cache.get('key', 'content');
 * ```
 */
export class Cache<T> {
	private cache: Map<string, { value: T; hash: string }> = new Map();

	/**
	 * Computes a SHA-256 hash of the given content.
	 * @param contents - The content to hash.
	 * @returns The hexadecimal representation of the hash.
	 */
	private async computeHash(contents: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(contents);
		const hashBuffer = await crypto.subtle.digest("SHA-256", data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
	}

	/**
	 * Retrieves a cached value by key if the content hash matches.
	 * @param key - The key to retrieve from the cache.
	 * @param contents - The current content to validate the cache.
	 * @returns The cached value or undefined if not found or hash mismatch.
	 */
	public async get(key: string, contents: string): Promise<T | undefined> {
		const currentHash = await this.computeHash(contents);
		const cached = this.cache.get(key);
		if (cached && cached.hash === currentHash) {
			return cached.value;
		}
		return undefined;
	}

	/**
	 * Sets a value in the cache with the associated content hash.
	 * @param key - The key under which to store the value.
	 * @param value - The value to cache.
	 * @param contents - The content associated with the value for hash computation.
	 */
	public async set(key: string, value: T, contents: string): Promise<void> {
		const hash = await this.computeHash(contents);
		this.cache.set(key, { value, hash });
	}

	/**
	 * Clears all entries from the cache.
	 */
	public clear(): void {
		this.cache.clear();
	}
}
