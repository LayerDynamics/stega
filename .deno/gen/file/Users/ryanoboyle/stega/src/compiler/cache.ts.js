// /src/compiler/cache.ts
import { crypto } from "https://deno.land/std@0.203.0/crypto/mod.ts";
/**
 * Simple caching mechanism to store and retrieve parsed modules to avoid redundant parsing.
 * Enhanced with hash-based invalidation for cache consistency.
 */ export class Cache {
  cache = new Map();
  /**
	 * Computes a SHA-256 hash of the given content.
	 * @param contents - The content to hash.
	 * @returns The hexadecimal representation of the hash.
	 */ async computeHash(contents) {
    const encoder = new TextEncoder();
    const data = encoder.encode(contents);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((byte)=>byte.toString(16).padStart(2, "0")).join("");
  }
  /**
	 * Retrieves a cached value by key if the content hash matches.
	 * @param key - The key to retrieve from the cache.
	 * @param contents - The current content to validate the cache.
	 * @returns The cached value or undefined if not found or hash mismatch.
	 */ async get(key, contents) {
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
	 */ async set(key, value, contents) {
    const hash = await this.computeHash(contents);
    this.cache.set(key, {
      value,
      hash
    });
  }
  /**
	 * Clears all entries from the cache.
	 */ clear() {
    this.cache.clear();
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29tcGlsZXIvY2FjaGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gL3NyYy9jb21waWxlci9jYWNoZS50c1xuaW1wb3J0IHsgY3J5cHRvIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL2NyeXB0by9tb2QudHNcIjtcbi8qKlxuICogU2ltcGxlIGNhY2hpbmcgbWVjaGFuaXNtIHRvIHN0b3JlIGFuZCByZXRyaWV2ZSBwYXJzZWQgbW9kdWxlcyB0byBhdm9pZCByZWR1bmRhbnQgcGFyc2luZy5cbiAqIEVuaGFuY2VkIHdpdGggaGFzaC1iYXNlZCBpbnZhbGlkYXRpb24gZm9yIGNhY2hlIGNvbnNpc3RlbmN5LlxuICovXG5leHBvcnQgY2xhc3MgQ2FjaGU8VD4ge1xuXHRwcml2YXRlIGNhY2hlOiBNYXA8c3RyaW5nLCB7IHZhbHVlOiBUOyBoYXNoOiBzdHJpbmcgfT4gPSBuZXcgTWFwKCk7XG5cblx0LyoqXG5cdCAqIENvbXB1dGVzIGEgU0hBLTI1NiBoYXNoIG9mIHRoZSBnaXZlbiBjb250ZW50LlxuXHQgKiBAcGFyYW0gY29udGVudHMgLSBUaGUgY29udGVudCB0byBoYXNoLlxuXHQgKiBAcmV0dXJucyBUaGUgaGV4YWRlY2ltYWwgcmVwcmVzZW50YXRpb24gb2YgdGhlIGhhc2guXG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIGNvbXB1dGVIYXNoKGNvbnRlbnRzOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRcdGNvbnN0IGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcblx0XHRjb25zdCBkYXRhID0gZW5jb2Rlci5lbmNvZGUoY29udGVudHMpO1xuXHRcdGNvbnN0IGhhc2hCdWZmZXIgPSBhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdChcIlNIQS0yNTZcIiwgZGF0YSk7XG5cdFx0Y29uc3QgaGFzaEFycmF5ID0gQXJyYXkuZnJvbShuZXcgVWludDhBcnJheShoYXNoQnVmZmVyKSk7XG5cdFx0cmV0dXJuIGhhc2hBcnJheS5tYXAoKGJ5dGUpID0+IGJ5dGUudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsIFwiMFwiKSkuam9pbihcIlwiKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgYSBjYWNoZWQgdmFsdWUgYnkga2V5IGlmIHRoZSBjb250ZW50IGhhc2ggbWF0Y2hlcy5cblx0ICogQHBhcmFtIGtleSAtIFRoZSBrZXkgdG8gcmV0cmlldmUgZnJvbSB0aGUgY2FjaGUuXG5cdCAqIEBwYXJhbSBjb250ZW50cyAtIFRoZSBjdXJyZW50IGNvbnRlbnQgdG8gdmFsaWRhdGUgdGhlIGNhY2hlLlxuXHQgKiBAcmV0dXJucyBUaGUgY2FjaGVkIHZhbHVlIG9yIHVuZGVmaW5lZCBpZiBub3QgZm91bmQgb3IgaGFzaCBtaXNtYXRjaC5cblx0ICovXG5cdHB1YmxpYyBhc3luYyBnZXQoa2V5OiBzdHJpbmcsIGNvbnRlbnRzOiBzdHJpbmcpOiBQcm9taXNlPFQgfCB1bmRlZmluZWQ+IHtcblx0XHRjb25zdCBjdXJyZW50SGFzaCA9IGF3YWl0IHRoaXMuY29tcHV0ZUhhc2goY29udGVudHMpO1xuXHRcdGNvbnN0IGNhY2hlZCA9IHRoaXMuY2FjaGUuZ2V0KGtleSk7XG5cdFx0aWYgKGNhY2hlZCAmJiBjYWNoZWQuaGFzaCA9PT0gY3VycmVudEhhc2gpIHtcblx0XHRcdHJldHVybiBjYWNoZWQudmFsdWU7XG5cdFx0fVxuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblxuXHQvKipcblx0ICogU2V0cyBhIHZhbHVlIGluIHRoZSBjYWNoZSB3aXRoIHRoZSBhc3NvY2lhdGVkIGNvbnRlbnQgaGFzaC5cblx0ICogQHBhcmFtIGtleSAtIFRoZSBrZXkgdW5kZXIgd2hpY2ggdG8gc3RvcmUgdGhlIHZhbHVlLlxuXHQgKiBAcGFyYW0gdmFsdWUgLSBUaGUgdmFsdWUgdG8gY2FjaGUuXG5cdCAqIEBwYXJhbSBjb250ZW50cyAtIFRoZSBjb250ZW50IGFzc29jaWF0ZWQgd2l0aCB0aGUgdmFsdWUgZm9yIGhhc2ggY29tcHV0YXRpb24uXG5cdCAqL1xuXHRwdWJsaWMgYXN5bmMgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogVCwgY29udGVudHM6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGhhc2ggPSBhd2FpdCB0aGlzLmNvbXB1dGVIYXNoKGNvbnRlbnRzKTtcblx0XHR0aGlzLmNhY2hlLnNldChrZXksIHsgdmFsdWUsIGhhc2ggfSk7XG5cdH1cblxuXHQvKipcblx0ICogQ2xlYXJzIGFsbCBlbnRyaWVzIGZyb20gdGhlIGNhY2hlLlxuXHQgKi9cblx0cHVibGljIGNsZWFyKCk6IHZvaWQge1xuXHRcdHRoaXMuY2FjaGUuY2xlYXIoKTtcblx0fVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHlCQUF5QjtBQUN6QixTQUFTLE1BQU0sUUFBUSw4Q0FBOEM7QUFDckU7OztDQUdDLEdBQ0QsT0FBTyxNQUFNO0VBQ0osUUFBaUQsSUFBSSxNQUFNO0VBRW5FOzs7O0VBSUMsR0FDRCxNQUFjLFlBQVksUUFBZ0IsRUFBbUI7SUFDNUQsTUFBTSxVQUFVLElBQUk7SUFDcEIsTUFBTSxPQUFPLFFBQVEsTUFBTSxDQUFDO0lBQzVCLE1BQU0sYUFBYSxNQUFNLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXO0lBQ3pELE1BQU0sWUFBWSxNQUFNLElBQUksQ0FBQyxJQUFJLFdBQVc7SUFDNUMsT0FBTyxVQUFVLEdBQUcsQ0FBQyxDQUFDLE9BQVMsS0FBSyxRQUFRLENBQUMsSUFBSSxRQUFRLENBQUMsR0FBRyxNQUFNLElBQUksQ0FBQztFQUN6RTtFQUVBOzs7OztFQUtDLEdBQ0QsTUFBYSxJQUFJLEdBQVcsRUFBRSxRQUFnQixFQUEwQjtJQUN2RSxNQUFNLGNBQWMsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzNDLE1BQU0sU0FBUyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztJQUM5QixJQUFJLFVBQVUsT0FBTyxJQUFJLEtBQUssYUFBYTtNQUMxQyxPQUFPLE9BQU8sS0FBSztJQUNwQjtJQUNBLE9BQU87RUFDUjtFQUVBOzs7OztFQUtDLEdBQ0QsTUFBYSxJQUFJLEdBQVcsRUFBRSxLQUFRLEVBQUUsUUFBZ0IsRUFBaUI7SUFDeEUsTUFBTSxPQUFPLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQztJQUNwQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLO01BQUU7TUFBTztJQUFLO0VBQ25DO0VBRUE7O0VBRUMsR0FDRCxBQUFPLFFBQWM7SUFDcEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLO0VBQ2pCO0FBQ0QifQ==
// denoCacheMetadata=4139135325521655305,3176670718911321905