// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Extensions to the
 * [Web Crypto](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
 * supporting additional encryption APIs, but also delegating to the built-in
 * APIs when possible.
 *
 * Provides additional digest algorithms that are not part of the WebCrypto
 * standard as well as a `subtle.digest` and `subtle.digestSync` methods. It
 * also provides a `subtle.timingSafeEqual()` method to compare array buffers
 * or data views in a way that isn't prone to timing based attacks.
 *
 * The "polyfill" delegates to `WebCrypto` where possible.
 *
 * The {@linkcode KeyStack} export implements the {@linkcode KeyRing} interface
 * for managing rotatable keys for signing data to prevent tampering, like with
 * HTTP cookies.
 *
 * ## Supported algorithms
 *
 * Here is a list of supported algorithms. If the algorithm name in WebCrypto
 * and Wasm/Rust is the same, this library prefers to use algorithms that are
 * supported by WebCrypto.
 *
 * WebCrypto
 *
 * ```ts
 * // https://deno.land/std/crypto/crypto.ts
 * const webCryptoDigestAlgorithms = [
 *   "SHA-384",
 *   "SHA-256",
 *   "SHA-512",
 *   // insecure (length-extendable and collidable):
 *   "SHA-1",
 * ] as const;
 * ```
 *
 * Wasm/Rust
 *
 * ```ts
 * // https://deno.land/std/crypto/_wasm/mod.ts
 * export const digestAlgorithms = [
 *   "BLAKE2B-224",
 *   "BLAKE2B-256",
 *   "BLAKE2B-384",
 *   "BLAKE2B",
 *   "BLAKE2S",
 *   "BLAKE3",
 *   "KECCAK-224",
 *   "KECCAK-256",
 *   "KECCAK-384",
 *   "KECCAK-512",
 *   "SHA-384",
 *   "SHA3-224",
 *   "SHA3-256",
 *   "SHA3-384",
 *   "SHA3-512",
 *   "SHAKE128",
 *   "SHAKE256",
 *   "TIGER",
 *   // insecure (length-extendable):
 *   "RIPEMD-160",
 *   "SHA-224",
 *   "SHA-256",
 *   "SHA-512",
 *   // insecure (collidable and length-extendable):
 *   "MD4",
 *   "MD5",
 *   "SHA-1",
 * ] as const;
 * ```
 *
 * @example
 * ```ts
 * import { crypto } from "https://deno.land/std@$STD_VERSION/crypto/mod.ts";
 *
 * // This will delegate to the runtime's WebCrypto implementation.
 * console.log(
 *   new Uint8Array(
 *     await crypto.subtle.digest(
 *       "SHA-384",
 *       new TextEncoder().encode("hello world"),
 *     ),
 *   ),
 * );
 *
 * // This will use a bundled Wasm/Rust implementation.
 * console.log(
 *   new Uint8Array(
 *     await crypto.subtle.digest(
 *       "BLAKE3",
 *       new TextEncoder().encode("hello world"),
 *     ),
 *   ),
 * );
 * ```
 *
 * @example Convert hash to a string
 *
 * ```ts
 * import {
 *   crypto,
 *   toHashString,
 * } from "https://deno.land/std@$STD_VERSION/crypto/mod.ts";
 *
 * const hash = await crypto.subtle.digest(
 *   "SHA-384",
 *   new TextEncoder().encode("You hear that Mr. Anderson?"),
 * );
 *
 * // Hex encoding by default
 * console.log(toHashString(hash));
 *
 * // Or with base64 encoding
 * console.log(toHashString(hash, "base64"));
 * ```
 *
 * @module
 */ import { digestAlgorithms as wasmDigestAlgorithms, instantiateWasm } from "./_wasm/mod.ts";
import { timingSafeEqual } from "./timing_safe_equal.ts";
import { fnv } from "./_fnv/mod.ts";
/**
 * A copy of the global WebCrypto interface, with methods bound so they're
 * safe to re-export.
 */ const webCrypto = ((crypto)=>({
    getRandomValues: crypto.getRandomValues?.bind(crypto),
    randomUUID: crypto.randomUUID?.bind(crypto),
    subtle: {
      decrypt: crypto.subtle?.decrypt?.bind(crypto.subtle),
      deriveBits: crypto.subtle?.deriveBits?.bind(crypto.subtle),
      deriveKey: crypto.subtle?.deriveKey?.bind(crypto.subtle),
      digest: crypto.subtle?.digest?.bind(crypto.subtle),
      encrypt: crypto.subtle?.encrypt?.bind(crypto.subtle),
      exportKey: crypto.subtle?.exportKey?.bind(crypto.subtle),
      generateKey: crypto.subtle?.generateKey?.bind(crypto.subtle),
      importKey: crypto.subtle?.importKey?.bind(crypto.subtle),
      sign: crypto.subtle?.sign?.bind(crypto.subtle),
      unwrapKey: crypto.subtle?.unwrapKey?.bind(crypto.subtle),
      verify: crypto.subtle?.verify?.bind(crypto.subtle),
      wrapKey: crypto.subtle?.wrapKey?.bind(crypto.subtle)
    }
  }))(globalThis.crypto);
const bufferSourceBytes = (data)=>{
  let bytes;
  if (data instanceof Uint8Array) {
    bytes = data;
  } else if (ArrayBuffer.isView(data)) {
    bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  } else if (data instanceof ArrayBuffer) {
    bytes = new Uint8Array(data);
  }
  return bytes;
};
/**
 * An wrapper for WebCrypto adding support for additional non-standard
 * algorithms, but delegating to the runtime WebCrypto implementation whenever
 * possible.
 */ const stdCrypto = ((x)=>x)({
  ...webCrypto,
  subtle: {
    ...webCrypto.subtle,
    /**
     * Polyfills stream support until the Web Crypto API does so:
     * @see {@link https://github.com/wintercg/proposal-webcrypto-streams}
     */ async digest (algorithm, data) {
      const { name, length } = normalizeAlgorithm(algorithm);
      const bytes = bufferSourceBytes(data);
      if (FNVAlgorithms.includes(name)) {
        return fnv(name, bytes);
      }
      // We delegate to WebCrypto whenever possible,
      if (// if the algorithm is supported by the WebCrypto standard,
      webCryptoDigestAlgorithms.includes(name) && // and the data is a single buffer,
      bytes) {
        return webCrypto.subtle.digest(algorithm, bytes);
      } else if (wasmDigestAlgorithms.includes(name)) {
        if (bytes) {
          // Otherwise, we use our bundled Wasm implementation via digestSync
          // if it supports the algorithm.
          return stdCrypto.subtle.digestSync(algorithm, bytes);
        } else if (data[Symbol.iterator]) {
          return stdCrypto.subtle.digestSync(algorithm, data);
        } else if (data[Symbol.asyncIterator]) {
          const wasmCrypto = instantiateWasm();
          const context = new wasmCrypto.DigestContext(name);
          for await (const chunk of data){
            const chunkBytes = bufferSourceBytes(chunk);
            if (!chunkBytes) {
              throw new TypeError("data contained chunk of the wrong type");
            }
            context.update(chunkBytes);
          }
          return context.digestAndDrop(length).buffer;
        } else {
          throw new TypeError("data must be a BufferSource or [Async]Iterable<BufferSource>");
        }
      } else if (webCrypto.subtle?.digest) {
        // (TypeScript type definitions prohibit this case.) If they're trying
        // to call an algorithm we don't recognize, pass it along to WebCrypto
        // in case it's a non-standard algorithm supported by the the runtime
        // they're using.
        return webCrypto.subtle.digest(algorithm, data);
      } else {
        throw new TypeError(`unsupported digest algorithm: ${algorithm}`);
      }
    },
    digestSync (algorithm, data) {
      algorithm = normalizeAlgorithm(algorithm);
      const bytes = bufferSourceBytes(data);
      if (FNVAlgorithms.includes(algorithm.name)) {
        return fnv(algorithm.name, bytes);
      }
      const wasmCrypto = instantiateWasm();
      if (bytes) {
        return wasmCrypto.digest(algorithm.name, bytes, algorithm.length).buffer;
      } else if (data[Symbol.iterator]) {
        const context = new wasmCrypto.DigestContext(algorithm.name);
        for (const chunk of data){
          const chunkBytes = bufferSourceBytes(chunk);
          if (!chunkBytes) {
            throw new TypeError("data contained chunk of the wrong type");
          }
          context.update(chunkBytes);
        }
        return context.digestAndDrop(algorithm.length).buffer;
      } else {
        throw new TypeError("data must be a BufferSource or Iterable<BufferSource>");
      }
    },
    // TODO(@kitsonk): rework when https://github.com/w3c/webcrypto/issues/270 resolved
    timingSafeEqual
  }
});
const FNVAlgorithms = [
  "FNV32",
  "FNV32A",
  "FNV64",
  "FNV64A"
];
/** Digest algorithms supported by WebCrypto. */ const webCryptoDigestAlgorithms = [
  "SHA-384",
  "SHA-256",
  "SHA-512",
  // insecure (length-extendable and collidable):
  "SHA-1"
];
const normalizeAlgorithm = (algorithm)=>typeof algorithm === "string" ? {
    name: algorithm.toUpperCase()
  } : {
    ...algorithm,
    name: algorithm.name.toUpperCase()
  };
export { stdCrypto as crypto };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL2NyeXB0by9jcnlwdG8udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBFeHRlbnNpb25zIHRvIHRoZVxuICogW1dlYiBDcnlwdG9dKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XZWJfQ3J5cHRvX0FQSSlcbiAqIHN1cHBvcnRpbmcgYWRkaXRpb25hbCBlbmNyeXB0aW9uIEFQSXMsIGJ1dCBhbHNvIGRlbGVnYXRpbmcgdG8gdGhlIGJ1aWx0LWluXG4gKiBBUElzIHdoZW4gcG9zc2libGUuXG4gKlxuICogUHJvdmlkZXMgYWRkaXRpb25hbCBkaWdlc3QgYWxnb3JpdGhtcyB0aGF0IGFyZSBub3QgcGFydCBvZiB0aGUgV2ViQ3J5cHRvXG4gKiBzdGFuZGFyZCBhcyB3ZWxsIGFzIGEgYHN1YnRsZS5kaWdlc3RgIGFuZCBgc3VidGxlLmRpZ2VzdFN5bmNgIG1ldGhvZHMuIEl0XG4gKiBhbHNvIHByb3ZpZGVzIGEgYHN1YnRsZS50aW1pbmdTYWZlRXF1YWwoKWAgbWV0aG9kIHRvIGNvbXBhcmUgYXJyYXkgYnVmZmVyc1xuICogb3IgZGF0YSB2aWV3cyBpbiBhIHdheSB0aGF0IGlzbid0IHByb25lIHRvIHRpbWluZyBiYXNlZCBhdHRhY2tzLlxuICpcbiAqIFRoZSBcInBvbHlmaWxsXCIgZGVsZWdhdGVzIHRvIGBXZWJDcnlwdG9gIHdoZXJlIHBvc3NpYmxlLlxuICpcbiAqIFRoZSB7QGxpbmtjb2RlIEtleVN0YWNrfSBleHBvcnQgaW1wbGVtZW50cyB0aGUge0BsaW5rY29kZSBLZXlSaW5nfSBpbnRlcmZhY2VcbiAqIGZvciBtYW5hZ2luZyByb3RhdGFibGUga2V5cyBmb3Igc2lnbmluZyBkYXRhIHRvIHByZXZlbnQgdGFtcGVyaW5nLCBsaWtlIHdpdGhcbiAqIEhUVFAgY29va2llcy5cbiAqXG4gKiAjIyBTdXBwb3J0ZWQgYWxnb3JpdGhtc1xuICpcbiAqIEhlcmUgaXMgYSBsaXN0IG9mIHN1cHBvcnRlZCBhbGdvcml0aG1zLiBJZiB0aGUgYWxnb3JpdGhtIG5hbWUgaW4gV2ViQ3J5cHRvXG4gKiBhbmQgV2FzbS9SdXN0IGlzIHRoZSBzYW1lLCB0aGlzIGxpYnJhcnkgcHJlZmVycyB0byB1c2UgYWxnb3JpdGhtcyB0aGF0IGFyZVxuICogc3VwcG9ydGVkIGJ5IFdlYkNyeXB0by5cbiAqXG4gKiBXZWJDcnlwdG9cbiAqXG4gKiBgYGB0c1xuICogLy8gaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL2NyeXB0by9jcnlwdG8udHNcbiAqIGNvbnN0IHdlYkNyeXB0b0RpZ2VzdEFsZ29yaXRobXMgPSBbXG4gKiAgIFwiU0hBLTM4NFwiLFxuICogICBcIlNIQS0yNTZcIixcbiAqICAgXCJTSEEtNTEyXCIsXG4gKiAgIC8vIGluc2VjdXJlIChsZW5ndGgtZXh0ZW5kYWJsZSBhbmQgY29sbGlkYWJsZSk6XG4gKiAgIFwiU0hBLTFcIixcbiAqIF0gYXMgY29uc3Q7XG4gKiBgYGBcbiAqXG4gKiBXYXNtL1J1c3RcbiAqXG4gKiBgYGB0c1xuICogLy8gaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL2NyeXB0by9fd2FzbS9tb2QudHNcbiAqIGV4cG9ydCBjb25zdCBkaWdlc3RBbGdvcml0aG1zID0gW1xuICogICBcIkJMQUtFMkItMjI0XCIsXG4gKiAgIFwiQkxBS0UyQi0yNTZcIixcbiAqICAgXCJCTEFLRTJCLTM4NFwiLFxuICogICBcIkJMQUtFMkJcIixcbiAqICAgXCJCTEFLRTJTXCIsXG4gKiAgIFwiQkxBS0UzXCIsXG4gKiAgIFwiS0VDQ0FLLTIyNFwiLFxuICogICBcIktFQ0NBSy0yNTZcIixcbiAqICAgXCJLRUNDQUstMzg0XCIsXG4gKiAgIFwiS0VDQ0FLLTUxMlwiLFxuICogICBcIlNIQS0zODRcIixcbiAqICAgXCJTSEEzLTIyNFwiLFxuICogICBcIlNIQTMtMjU2XCIsXG4gKiAgIFwiU0hBMy0zODRcIixcbiAqICAgXCJTSEEzLTUxMlwiLFxuICogICBcIlNIQUtFMTI4XCIsXG4gKiAgIFwiU0hBS0UyNTZcIixcbiAqICAgXCJUSUdFUlwiLFxuICogICAvLyBpbnNlY3VyZSAobGVuZ3RoLWV4dGVuZGFibGUpOlxuICogICBcIlJJUEVNRC0xNjBcIixcbiAqICAgXCJTSEEtMjI0XCIsXG4gKiAgIFwiU0hBLTI1NlwiLFxuICogICBcIlNIQS01MTJcIixcbiAqICAgLy8gaW5zZWN1cmUgKGNvbGxpZGFibGUgYW5kIGxlbmd0aC1leHRlbmRhYmxlKTpcbiAqICAgXCJNRDRcIixcbiAqICAgXCJNRDVcIixcbiAqICAgXCJTSEEtMVwiLFxuICogXSBhcyBjb25zdDtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgY3J5cHRvIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vY3J5cHRvL21vZC50c1wiO1xuICpcbiAqIC8vIFRoaXMgd2lsbCBkZWxlZ2F0ZSB0byB0aGUgcnVudGltZSdzIFdlYkNyeXB0byBpbXBsZW1lbnRhdGlvbi5cbiAqIGNvbnNvbGUubG9nKFxuICogICBuZXcgVWludDhBcnJheShcbiAqICAgICBhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdChcbiAqICAgICAgIFwiU0hBLTM4NFwiLFxuICogICAgICAgbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiaGVsbG8gd29ybGRcIiksXG4gKiAgICAgKSxcbiAqICAgKSxcbiAqICk7XG4gKlxuICogLy8gVGhpcyB3aWxsIHVzZSBhIGJ1bmRsZWQgV2FzbS9SdXN0IGltcGxlbWVudGF0aW9uLlxuICogY29uc29sZS5sb2coXG4gKiAgIG5ldyBVaW50OEFycmF5KFxuICogICAgIGF3YWl0IGNyeXB0by5zdWJ0bGUuZGlnZXN0KFxuICogICAgICAgXCJCTEFLRTNcIixcbiAqICAgICAgIG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcImhlbGxvIHdvcmxkXCIpLFxuICogICAgICksXG4gKiAgICksXG4gKiApO1xuICogYGBgXG4gKlxuICogQGV4YW1wbGUgQ29udmVydCBoYXNoIHRvIGEgc3RyaW5nXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7XG4gKiAgIGNyeXB0byxcbiAqICAgdG9IYXNoU3RyaW5nLFxuICogfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jcnlwdG8vbW9kLnRzXCI7XG4gKlxuICogY29uc3QgaGFzaCA9IGF3YWl0IGNyeXB0by5zdWJ0bGUuZGlnZXN0KFxuICogICBcIlNIQS0zODRcIixcbiAqICAgbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiWW91IGhlYXIgdGhhdCBNci4gQW5kZXJzb24/XCIpLFxuICogKTtcbiAqXG4gKiAvLyBIZXggZW5jb2RpbmcgYnkgZGVmYXVsdFxuICogY29uc29sZS5sb2codG9IYXNoU3RyaW5nKGhhc2gpKTtcbiAqXG4gKiAvLyBPciB3aXRoIGJhc2U2NCBlbmNvZGluZ1xuICogY29uc29sZS5sb2codG9IYXNoU3RyaW5nKGhhc2gsIFwiYmFzZTY0XCIpKTtcbiAqIGBgYFxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQge1xuICBEaWdlc3RBbGdvcml0aG0gYXMgV2FzbURpZ2VzdEFsZ29yaXRobSxcbiAgZGlnZXN0QWxnb3JpdGhtcyBhcyB3YXNtRGlnZXN0QWxnb3JpdGhtcyxcbiAgaW5zdGFudGlhdGVXYXNtLFxufSBmcm9tIFwiLi9fd2FzbS9tb2QudHNcIjtcbmltcG9ydCB7IHRpbWluZ1NhZmVFcXVhbCB9IGZyb20gXCIuL3RpbWluZ19zYWZlX2VxdWFsLnRzXCI7XG5pbXBvcnQgeyBmbnYgfSBmcm9tIFwiLi9fZm52L21vZC50c1wiO1xuXG4vKipcbiAqIEEgY29weSBvZiB0aGUgZ2xvYmFsIFdlYkNyeXB0byBpbnRlcmZhY2UsIHdpdGggbWV0aG9kcyBib3VuZCBzbyB0aGV5J3JlXG4gKiBzYWZlIHRvIHJlLWV4cG9ydC5cbiAqL1xuY29uc3Qgd2ViQ3J5cHRvID0gKChjcnlwdG8pID0+ICh7XG4gIGdldFJhbmRvbVZhbHVlczogY3J5cHRvLmdldFJhbmRvbVZhbHVlcz8uYmluZChjcnlwdG8pLFxuICByYW5kb21VVUlEOiBjcnlwdG8ucmFuZG9tVVVJRD8uYmluZChjcnlwdG8pLFxuICBzdWJ0bGU6IHtcbiAgICBkZWNyeXB0OiBjcnlwdG8uc3VidGxlPy5kZWNyeXB0Py5iaW5kKGNyeXB0by5zdWJ0bGUpLFxuICAgIGRlcml2ZUJpdHM6IGNyeXB0by5zdWJ0bGU/LmRlcml2ZUJpdHM/LmJpbmQoY3J5cHRvLnN1YnRsZSksXG4gICAgZGVyaXZlS2V5OiBjcnlwdG8uc3VidGxlPy5kZXJpdmVLZXk/LmJpbmQoY3J5cHRvLnN1YnRsZSksXG4gICAgZGlnZXN0OiBjcnlwdG8uc3VidGxlPy5kaWdlc3Q/LmJpbmQoY3J5cHRvLnN1YnRsZSksXG4gICAgZW5jcnlwdDogY3J5cHRvLnN1YnRsZT8uZW5jcnlwdD8uYmluZChjcnlwdG8uc3VidGxlKSxcbiAgICBleHBvcnRLZXk6IGNyeXB0by5zdWJ0bGU/LmV4cG9ydEtleT8uYmluZChjcnlwdG8uc3VidGxlKSxcbiAgICBnZW5lcmF0ZUtleTogY3J5cHRvLnN1YnRsZT8uZ2VuZXJhdGVLZXk/LmJpbmQoY3J5cHRvLnN1YnRsZSksXG4gICAgaW1wb3J0S2V5OiBjcnlwdG8uc3VidGxlPy5pbXBvcnRLZXk/LmJpbmQoY3J5cHRvLnN1YnRsZSksXG4gICAgc2lnbjogY3J5cHRvLnN1YnRsZT8uc2lnbj8uYmluZChjcnlwdG8uc3VidGxlKSxcbiAgICB1bndyYXBLZXk6IGNyeXB0by5zdWJ0bGU/LnVud3JhcEtleT8uYmluZChjcnlwdG8uc3VidGxlKSxcbiAgICB2ZXJpZnk6IGNyeXB0by5zdWJ0bGU/LnZlcmlmeT8uYmluZChjcnlwdG8uc3VidGxlKSxcbiAgICB3cmFwS2V5OiBjcnlwdG8uc3VidGxlPy53cmFwS2V5Py5iaW5kKGNyeXB0by5zdWJ0bGUpLFxuICB9LFxufSkpKGdsb2JhbFRoaXMuY3J5cHRvKTtcblxuY29uc3QgYnVmZmVyU291cmNlQnl0ZXMgPSAoZGF0YTogQnVmZmVyU291cmNlIHwgdW5rbm93bikgPT4ge1xuICBsZXQgYnl0ZXM6IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQ7XG4gIGlmIChkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgIGJ5dGVzID0gZGF0YTtcbiAgfSBlbHNlIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoZGF0YSkpIHtcbiAgICBieXRlcyA9IG5ldyBVaW50OEFycmF5KGRhdGEuYnVmZmVyLCBkYXRhLmJ5dGVPZmZzZXQsIGRhdGEuYnl0ZUxlbmd0aCk7XG4gIH0gZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgYnl0ZXMgPSBuZXcgVWludDhBcnJheShkYXRhKTtcbiAgfVxuICByZXR1cm4gYnl0ZXM7XG59O1xuXG4vKiogRXh0ZW5zaW9ucyB0byB0aGUgd2ViIHN0YW5kYXJkIGBTdWJ0bGVDcnlwdG9gIGludGVyZmFjZS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3RkU3VidGxlQ3J5cHRvIGV4dGVuZHMgU3VidGxlQ3J5cHRvIHtcbiAgLyoqXG4gICAqIFJldHVybnMgYSBuZXcgYFByb21pc2VgIG9iamVjdCB0aGF0IHdpbGwgZGlnZXN0IGBkYXRhYCB1c2luZyB0aGUgc3BlY2lmaWVkXG4gICAqIGBBbGdvcml0aG1JZGVudGlmaWVyYC5cbiAgICovXG4gIGRpZ2VzdChcbiAgICBhbGdvcml0aG06IERpZ2VzdEFsZ29yaXRobSxcbiAgICBkYXRhOiBCdWZmZXJTb3VyY2UgfCBBc3luY0l0ZXJhYmxlPEJ1ZmZlclNvdXJjZT4gfCBJdGVyYWJsZTxCdWZmZXJTb3VyY2U+LFxuICApOiBQcm9taXNlPEFycmF5QnVmZmVyPjtcblxuICAvKipcbiAgICogUmV0dXJucyBhIEFycmF5QnVmZmVyIHdpdGggdGhlIHJlc3VsdCBvZiBkaWdlc3RpbmcgYGRhdGFgIHVzaW5nIHRoZVxuICAgKiBzcGVjaWZpZWQgYEFsZ29yaXRobUlkZW50aWZpZXJgLlxuICAgKi9cbiAgZGlnZXN0U3luYyhcbiAgICBhbGdvcml0aG06IERpZ2VzdEFsZ29yaXRobSxcbiAgICBkYXRhOiBCdWZmZXJTb3VyY2UgfCBJdGVyYWJsZTxCdWZmZXJTb3VyY2U+LFxuICApOiBBcnJheUJ1ZmZlcjtcblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgKHdpbGwgYmUgcmVtb3ZlZCBpbiAwLjIwNy4wKSBJbXBvcnQgZnJvbSBgc3RkL2NyeXB0by90aW1pbmdfc2FmZV9lcXVhbC50c2AgaW5zdGVhZFxuICAgKlxuICAgKiBDb21wYXJlIHRvIGFycmF5IGJ1ZmZlcnMgb3IgZGF0YSB2aWV3cyBpbiBhIHdheSB0aGF0IHRpbWluZyBiYXNlZCBhdHRhY2tzXG4gICAqIGNhbm5vdCBnYWluIGluZm9ybWF0aW9uIGFib3V0IHRoZSBwbGF0Zm9ybS4gKi9cbiAgdGltaW5nU2FmZUVxdWFsKFxuICAgIGE6IEFycmF5QnVmZmVyTGlrZSB8IERhdGFWaWV3LFxuICAgIGI6IEFycmF5QnVmZmVyTGlrZSB8IERhdGFWaWV3LFxuICApOiBib29sZWFuO1xufVxuXG4vKiogRXh0ZW5zaW9ucyB0byB0aGUgV2ViIHtAbGlua2NvZGUgQ3J5cHRvfSBpbnRlcmZhY2UuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0ZENyeXB0byBleHRlbmRzIENyeXB0byB7XG4gIHJlYWRvbmx5IHN1YnRsZTogU3RkU3VidGxlQ3J5cHRvO1xufVxuXG4vKipcbiAqIEFuIHdyYXBwZXIgZm9yIFdlYkNyeXB0byBhZGRpbmcgc3VwcG9ydCBmb3IgYWRkaXRpb25hbCBub24tc3RhbmRhcmRcbiAqIGFsZ29yaXRobXMsIGJ1dCBkZWxlZ2F0aW5nIHRvIHRoZSBydW50aW1lIFdlYkNyeXB0byBpbXBsZW1lbnRhdGlvbiB3aGVuZXZlclxuICogcG9zc2libGUuXG4gKi9cbmNvbnN0IHN0ZENyeXB0bzogU3RkQ3J5cHRvID0gKCh4KSA9PiB4KSh7XG4gIC4uLndlYkNyeXB0byxcbiAgc3VidGxlOiB7XG4gICAgLi4ud2ViQ3J5cHRvLnN1YnRsZSxcblxuICAgIC8qKlxuICAgICAqIFBvbHlmaWxscyBzdHJlYW0gc3VwcG9ydCB1bnRpbCB0aGUgV2ViIENyeXB0byBBUEkgZG9lcyBzbzpcbiAgICAgKiBAc2VlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vd2ludGVyY2cvcHJvcG9zYWwtd2ViY3J5cHRvLXN0cmVhbXN9XG4gICAgICovXG4gICAgYXN5bmMgZGlnZXN0KFxuICAgICAgYWxnb3JpdGhtOiBEaWdlc3RBbGdvcml0aG0sXG4gICAgICBkYXRhOiBCdWZmZXJTb3VyY2UgfCBBc3luY0l0ZXJhYmxlPEJ1ZmZlclNvdXJjZT4gfCBJdGVyYWJsZTxCdWZmZXJTb3VyY2U+LFxuICAgICk6IFByb21pc2U8QXJyYXlCdWZmZXI+IHtcbiAgICAgIGNvbnN0IHsgbmFtZSwgbGVuZ3RoIH0gPSBub3JtYWxpemVBbGdvcml0aG0oYWxnb3JpdGhtKTtcbiAgICAgIGNvbnN0IGJ5dGVzID0gYnVmZmVyU291cmNlQnl0ZXMoZGF0YSk7XG5cbiAgICAgIGlmIChGTlZBbGdvcml0aG1zLmluY2x1ZGVzKG5hbWUpKSB7XG4gICAgICAgIHJldHVybiBmbnYobmFtZSwgYnl0ZXMpO1xuICAgICAgfVxuXG4gICAgICAvLyBXZSBkZWxlZ2F0ZSB0byBXZWJDcnlwdG8gd2hlbmV2ZXIgcG9zc2libGUsXG4gICAgICBpZiAoXG4gICAgICAgIC8vIGlmIHRoZSBhbGdvcml0aG0gaXMgc3VwcG9ydGVkIGJ5IHRoZSBXZWJDcnlwdG8gc3RhbmRhcmQsXG4gICAgICAgICh3ZWJDcnlwdG9EaWdlc3RBbGdvcml0aG1zIGFzIHJlYWRvbmx5IHN0cmluZ1tdKS5pbmNsdWRlcyhuYW1lKSAmJlxuICAgICAgICAvLyBhbmQgdGhlIGRhdGEgaXMgYSBzaW5nbGUgYnVmZmVyLFxuICAgICAgICBieXRlc1xuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB3ZWJDcnlwdG8uc3VidGxlLmRpZ2VzdChhbGdvcml0aG0sIGJ5dGVzKTtcbiAgICAgIH0gZWxzZSBpZiAod2FzbURpZ2VzdEFsZ29yaXRobXMuaW5jbHVkZXMobmFtZSBhcyBXYXNtRGlnZXN0QWxnb3JpdGhtKSkge1xuICAgICAgICBpZiAoYnl0ZXMpIHtcbiAgICAgICAgICAvLyBPdGhlcndpc2UsIHdlIHVzZSBvdXIgYnVuZGxlZCBXYXNtIGltcGxlbWVudGF0aW9uIHZpYSBkaWdlc3RTeW5jXG4gICAgICAgICAgLy8gaWYgaXQgc3VwcG9ydHMgdGhlIGFsZ29yaXRobS5cbiAgICAgICAgICByZXR1cm4gc3RkQ3J5cHRvLnN1YnRsZS5kaWdlc3RTeW5jKGFsZ29yaXRobSwgYnl0ZXMpO1xuICAgICAgICB9IGVsc2UgaWYgKChkYXRhIGFzIEl0ZXJhYmxlPEJ1ZmZlclNvdXJjZT4pW1N5bWJvbC5pdGVyYXRvcl0pIHtcbiAgICAgICAgICByZXR1cm4gc3RkQ3J5cHRvLnN1YnRsZS5kaWdlc3RTeW5jKFxuICAgICAgICAgICAgYWxnb3JpdGhtLFxuICAgICAgICAgICAgZGF0YSBhcyBJdGVyYWJsZTxCdWZmZXJTb3VyY2U+LFxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgKGRhdGEgYXMgQXN5bmNJdGVyYWJsZTxCdWZmZXJTb3VyY2U+KVtTeW1ib2wuYXN5bmNJdGVyYXRvcl1cbiAgICAgICAgKSB7XG4gICAgICAgICAgY29uc3Qgd2FzbUNyeXB0byA9IGluc3RhbnRpYXRlV2FzbSgpO1xuICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBuZXcgd2FzbUNyeXB0by5EaWdlc3RDb250ZXh0KG5hbWUpO1xuICAgICAgICAgIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2YgZGF0YSBhcyBBc3luY0l0ZXJhYmxlPEJ1ZmZlclNvdXJjZT4pIHtcbiAgICAgICAgICAgIGNvbnN0IGNodW5rQnl0ZXMgPSBidWZmZXJTb3VyY2VCeXRlcyhjaHVuayk7XG4gICAgICAgICAgICBpZiAoIWNodW5rQnl0ZXMpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImRhdGEgY29udGFpbmVkIGNodW5rIG9mIHRoZSB3cm9uZyB0eXBlXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dC51cGRhdGUoY2h1bmtCeXRlcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjb250ZXh0LmRpZ2VzdEFuZERyb3AobGVuZ3RoKS5idWZmZXI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgIFwiZGF0YSBtdXN0IGJlIGEgQnVmZmVyU291cmNlIG9yIFtBc3luY11JdGVyYWJsZTxCdWZmZXJTb3VyY2U+XCIsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh3ZWJDcnlwdG8uc3VidGxlPy5kaWdlc3QpIHtcbiAgICAgICAgLy8gKFR5cGVTY3JpcHQgdHlwZSBkZWZpbml0aW9ucyBwcm9oaWJpdCB0aGlzIGNhc2UuKSBJZiB0aGV5J3JlIHRyeWluZ1xuICAgICAgICAvLyB0byBjYWxsIGFuIGFsZ29yaXRobSB3ZSBkb24ndCByZWNvZ25pemUsIHBhc3MgaXQgYWxvbmcgdG8gV2ViQ3J5cHRvXG4gICAgICAgIC8vIGluIGNhc2UgaXQncyBhIG5vbi1zdGFuZGFyZCBhbGdvcml0aG0gc3VwcG9ydGVkIGJ5IHRoZSB0aGUgcnVudGltZVxuICAgICAgICAvLyB0aGV5J3JlIHVzaW5nLlxuICAgICAgICByZXR1cm4gd2ViQ3J5cHRvLnN1YnRsZS5kaWdlc3QoXG4gICAgICAgICAgYWxnb3JpdGhtLFxuICAgICAgICAgIChkYXRhIGFzIHVua25vd24pIGFzIFVpbnQ4QXJyYXksXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGB1bnN1cHBvcnRlZCBkaWdlc3QgYWxnb3JpdGhtOiAke2FsZ29yaXRobX1gKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZGlnZXN0U3luYyhcbiAgICAgIGFsZ29yaXRobTogRGlnZXN0QWxnb3JpdGhtLFxuICAgICAgZGF0YTogQnVmZmVyU291cmNlIHwgSXRlcmFibGU8QnVmZmVyU291cmNlPixcbiAgICApOiBBcnJheUJ1ZmZlciB7XG4gICAgICBhbGdvcml0aG0gPSBub3JtYWxpemVBbGdvcml0aG0oYWxnb3JpdGhtKTtcblxuICAgICAgY29uc3QgYnl0ZXMgPSBidWZmZXJTb3VyY2VCeXRlcyhkYXRhKTtcblxuICAgICAgaWYgKEZOVkFsZ29yaXRobXMuaW5jbHVkZXMoYWxnb3JpdGhtLm5hbWUpKSB7XG4gICAgICAgIHJldHVybiBmbnYoYWxnb3JpdGhtLm5hbWUsIGJ5dGVzKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgd2FzbUNyeXB0byA9IGluc3RhbnRpYXRlV2FzbSgpO1xuICAgICAgaWYgKGJ5dGVzKSB7XG4gICAgICAgIHJldHVybiB3YXNtQ3J5cHRvLmRpZ2VzdChhbGdvcml0aG0ubmFtZSwgYnl0ZXMsIGFsZ29yaXRobS5sZW5ndGgpXG4gICAgICAgICAgLmJ1ZmZlcjtcbiAgICAgIH0gZWxzZSBpZiAoKGRhdGEgYXMgSXRlcmFibGU8QnVmZmVyU291cmNlPilbU3ltYm9sLml0ZXJhdG9yXSkge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gbmV3IHdhc21DcnlwdG8uRGlnZXN0Q29udGV4dChhbGdvcml0aG0ubmFtZSk7XG4gICAgICAgIGZvciAoY29uc3QgY2h1bmsgb2YgZGF0YSBhcyBJdGVyYWJsZTxCdWZmZXJTb3VyY2U+KSB7XG4gICAgICAgICAgY29uc3QgY2h1bmtCeXRlcyA9IGJ1ZmZlclNvdXJjZUJ5dGVzKGNodW5rKTtcbiAgICAgICAgICBpZiAoIWNodW5rQnl0ZXMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJkYXRhIGNvbnRhaW5lZCBjaHVuayBvZiB0aGUgd3JvbmcgdHlwZVwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGV4dC51cGRhdGUoY2h1bmtCeXRlcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbnRleHQuZGlnZXN0QW5kRHJvcChhbGdvcml0aG0ubGVuZ3RoKS5idWZmZXI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgIFwiZGF0YSBtdXN0IGJlIGEgQnVmZmVyU291cmNlIG9yIEl0ZXJhYmxlPEJ1ZmZlclNvdXJjZT5cIixcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gVE9ETyhAa2l0c29uayk6IHJld29yayB3aGVuIGh0dHBzOi8vZ2l0aHViLmNvbS93M2Mvd2ViY3J5cHRvL2lzc3Vlcy8yNzAgcmVzb2x2ZWRcbiAgICB0aW1pbmdTYWZlRXF1YWwsXG4gIH0sXG59KTtcblxuY29uc3QgRk5WQWxnb3JpdGhtcyA9IFtcIkZOVjMyXCIsIFwiRk5WMzJBXCIsIFwiRk5WNjRcIiwgXCJGTlY2NEFcIl07XG5cbi8qKiBEaWdlc3QgYWxnb3JpdGhtcyBzdXBwb3J0ZWQgYnkgV2ViQ3J5cHRvLiAqL1xuY29uc3Qgd2ViQ3J5cHRvRGlnZXN0QWxnb3JpdGhtcyA9IFtcbiAgXCJTSEEtMzg0XCIsXG4gIFwiU0hBLTI1NlwiLFxuICBcIlNIQS01MTJcIixcbiAgLy8gaW5zZWN1cmUgKGxlbmd0aC1leHRlbmRhYmxlIGFuZCBjb2xsaWRhYmxlKTpcbiAgXCJTSEEtMVwiLFxuXSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgRk5WQWxnb3JpdGhtcyA9IFwiRk5WMzJcIiB8IFwiRk5WMzJBXCIgfCBcIkZOVjY0XCIgfCBcIkZOVjY0QVwiO1xuZXhwb3J0IHR5cGUgRGlnZXN0QWxnb3JpdGhtTmFtZSA9IFdhc21EaWdlc3RBbGdvcml0aG0gfCBGTlZBbGdvcml0aG1zO1xuXG5leHBvcnQgdHlwZSBEaWdlc3RBbGdvcml0aG1PYmplY3QgPSB7XG4gIG5hbWU6IERpZ2VzdEFsZ29yaXRobU5hbWU7XG4gIGxlbmd0aD86IG51bWJlcjtcbn07XG5cbmV4cG9ydCB0eXBlIERpZ2VzdEFsZ29yaXRobSA9IERpZ2VzdEFsZ29yaXRobU5hbWUgfCBEaWdlc3RBbGdvcml0aG1PYmplY3Q7XG5cbmNvbnN0IG5vcm1hbGl6ZUFsZ29yaXRobSA9IChhbGdvcml0aG06IERpZ2VzdEFsZ29yaXRobSkgPT5cbiAgKCh0eXBlb2YgYWxnb3JpdGhtID09PSBcInN0cmluZ1wiKSA/IHsgbmFtZTogYWxnb3JpdGhtLnRvVXBwZXJDYXNlKCkgfSA6IHtcbiAgICAuLi5hbGdvcml0aG0sXG4gICAgbmFtZTogYWxnb3JpdGhtLm5hbWUudG9VcHBlckNhc2UoKSxcbiAgfSkgYXMgRGlnZXN0QWxnb3JpdGhtT2JqZWN0O1xuXG5leHBvcnQgeyBzdGRDcnlwdG8gYXMgY3J5cHRvIH07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBcUhDLEdBRUQsU0FFRSxvQkFBb0Isb0JBQW9CLEVBQ3hDLGVBQWUsUUFDVixpQkFBaUI7QUFDeEIsU0FBUyxlQUFlLFFBQVEseUJBQXlCO0FBQ3pELFNBQVMsR0FBRyxRQUFRLGdCQUFnQjtBQUVwQzs7O0NBR0MsR0FDRCxNQUFNLFlBQVksQ0FBQyxDQUFDLFNBQVcsQ0FBQztJQUM5QixpQkFBaUIsT0FBTyxlQUFlLEVBQUUsS0FBSztJQUM5QyxZQUFZLE9BQU8sVUFBVSxFQUFFLEtBQUs7SUFDcEMsUUFBUTtNQUNOLFNBQVMsT0FBTyxNQUFNLEVBQUUsU0FBUyxLQUFLLE9BQU8sTUFBTTtNQUNuRCxZQUFZLE9BQU8sTUFBTSxFQUFFLFlBQVksS0FBSyxPQUFPLE1BQU07TUFDekQsV0FBVyxPQUFPLE1BQU0sRUFBRSxXQUFXLEtB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
// denoCacheMetadata=10713217977033579081,260992568132746493