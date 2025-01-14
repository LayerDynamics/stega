// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
export { DigestContext, instantiate as instantiateWasm } from "./lib/deno_std_wasm_crypto.generated.mjs";
/**
 * All cryptographic hash/digest algorithms supported by std/crypto/_wasm.
 *
 * For algorithms that are supported by WebCrypto, the name here must match the
 * one used by WebCrypto. Otherwise we should prefer the formatting used in the
 * official specification. All names are uppercase to facilitate case-insensitive
 * comparisons required by the WebCrypto spec.
 */ export const digestAlgorithms = [
  "BLAKE2B-224",
  "BLAKE2B-256",
  "BLAKE2B-384",
  "BLAKE2B",
  "BLAKE2S",
  "BLAKE3",
  "KECCAK-224",
  "KECCAK-256",
  "KECCAK-384",
  "KECCAK-512",
  "SHA-384",
  "SHA3-224",
  "SHA3-256",
  "SHA3-384",
  "SHA3-512",
  "SHAKE128",
  "SHAKE256",
  "TIGER",
  // insecure (length-extendable):
  "RIPEMD-160",
  "SHA-224",
  "SHA-256",
  "SHA-512",
  // insecure (collidable and length-extendable):
  "MD4",
  "MD5",
  "SHA-1"
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL2NyeXB0by9fd2FzbS9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmV4cG9ydCB7XG4gIERpZ2VzdENvbnRleHQsXG4gIGluc3RhbnRpYXRlIGFzIGluc3RhbnRpYXRlV2FzbSxcbn0gZnJvbSBcIi4vbGliL2Rlbm9fc3RkX3dhc21fY3J5cHRvLmdlbmVyYXRlZC5tanNcIjtcblxuLyoqXG4gKiBBbGwgY3J5cHRvZ3JhcGhpYyBoYXNoL2RpZ2VzdCBhbGdvcml0aG1zIHN1cHBvcnRlZCBieSBzdGQvY3J5cHRvL193YXNtLlxuICpcbiAqIEZvciBhbGdvcml0aG1zIHRoYXQgYXJlIHN1cHBvcnRlZCBieSBXZWJDcnlwdG8sIHRoZSBuYW1lIGhlcmUgbXVzdCBtYXRjaCB0aGVcbiAqIG9uZSB1c2VkIGJ5IFdlYkNyeXB0by4gT3RoZXJ3aXNlIHdlIHNob3VsZCBwcmVmZXIgdGhlIGZvcm1hdHRpbmcgdXNlZCBpbiB0aGVcbiAqIG9mZmljaWFsIHNwZWNpZmljYXRpb24uIEFsbCBuYW1lcyBhcmUgdXBwZXJjYXNlIHRvIGZhY2lsaXRhdGUgY2FzZS1pbnNlbnNpdGl2ZVxuICogY29tcGFyaXNvbnMgcmVxdWlyZWQgYnkgdGhlIFdlYkNyeXB0byBzcGVjLlxuICovXG5leHBvcnQgY29uc3QgZGlnZXN0QWxnb3JpdGhtcyA9IFtcbiAgXCJCTEFLRTJCLTIyNFwiLFxuICBcIkJMQUtFMkItMjU2XCIsXG4gIFwiQkxBS0UyQi0zODRcIixcbiAgXCJCTEFLRTJCXCIsXG4gIFwiQkxBS0UyU1wiLFxuICBcIkJMQUtFM1wiLFxuICBcIktFQ0NBSy0yMjRcIixcbiAgXCJLRUNDQUstMjU2XCIsXG4gIFwiS0VDQ0FLLTM4NFwiLFxuICBcIktFQ0NBSy01MTJcIixcbiAgXCJTSEEtMzg0XCIsXG4gIFwiU0hBMy0yMjRcIixcbiAgXCJTSEEzLTI1NlwiLFxuICBcIlNIQTMtMzg0XCIsXG4gIFwiU0hBMy01MTJcIixcbiAgXCJTSEFLRTEyOFwiLFxuICBcIlNIQUtFMjU2XCIsXG4gIFwiVElHRVJcIixcbiAgLy8gaW5zZWN1cmUgKGxlbmd0aC1leHRlbmRhYmxlKTpcbiAgXCJSSVBFTUQtMTYwXCIsXG4gIFwiU0hBLTIyNFwiLFxuICBcIlNIQS0yNTZcIixcbiAgXCJTSEEtNTEyXCIsXG4gIC8vIGluc2VjdXJlIChjb2xsaWRhYmxlIGFuZCBsZW5ndGgtZXh0ZW5kYWJsZSk6XG4gIFwiTUQ0XCIsXG4gIFwiTUQ1XCIsXG4gIFwiU0hBLTFcIixcbl0gYXMgY29uc3Q7XG5cbi8qKiBBbiBhbGdvcml0aG0gbmFtZSBzdXBwb3J0ZWQgYnkgc3RkL2NyeXB0by9fd2FzbS4gKi9cbmV4cG9ydCB0eXBlIERpZ2VzdEFsZ29yaXRobSA9IHR5cGVvZiBkaWdlc3RBbGdvcml0aG1zW251bWJlcl07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLFNBQ0UsYUFBYSxFQUNiLGVBQWUsZUFBZSxRQUN6QiwyQ0FBMkM7QUFFbEQ7Ozs7Ozs7Q0FPQyxHQUNELE9BQU8sTUFBTSxtQkFBbUI7RUFDOUI7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0EsZ0NBQWdDO0VBQ2hDO0VBQ0E7RUFDQTtFQUNBO0VBQ0EsK0NBQStDO0VBQy9DO0VBQ0E7RUFDQTtDQUNELENBQVUifQ==
// denoCacheMetadata=859005109544886180,7656605260054551085