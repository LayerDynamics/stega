// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Provides the {@linkcode KeyStack} class which implements the
 * {@linkcode KeyRing} interface for managing rotatable keys.
 *
 * @module
 */ var _computedKey, _computedKey1;
import { timingSafeEqual } from "../timing_safe_equal.ts";
import * as base64url from "../../encoding/base64url.ts";
const encoder = new TextEncoder();
function importKey(key) {
  if (typeof key === "string") {
    key = encoder.encode(key);
  } else if (Array.isArray(key)) {
    key = new Uint8Array(key);
  }
  return crypto.subtle.importKey("raw", key, {
    name: "HMAC",
    hash: {
      name: "SHA-256"
    }
  }, true, [
    "sign",
    "verify"
  ]);
}
function sign(data, key) {
  if (typeof data === "string") {
    data = encoder.encode(data);
  } else if (Array.isArray(data)) {
    data = Uint8Array.from(data);
  }
  return crypto.subtle.sign("HMAC", key, data);
}
/** Compare two strings, Uint8Arrays, ArrayBuffers, or arrays of numbers in a
 * way that avoids timing based attacks on the comparisons on the values.
 *
 * The function will return `true` if the values match, or `false`, if they
 * do not match.
 *
 * This was inspired by https://github.com/suryagh/tsscmp which provides a
 * timing safe string comparison to avoid timing attacks as described in
 * https://codahale.com/a-lesson-in-timing-attacks/.
 */ async function compare(a, b) {
  const key = new Uint8Array(32);
  globalThis.crypto.getRandomValues(key);
  const cryptoKey = await importKey(key);
  const ah = await sign(a, cryptoKey);
  const bh = await sign(b, cryptoKey);
  return timingSafeEqual(ah, bh);
}
_computedKey = Symbol.for("Deno.customInspect"), _computedKey1 = Symbol.for("nodejs.util.inspect.custom");
/** A cryptographic key chain which allows signing of data to prevent tampering,
 * but also allows for easy key rotation without needing to re-sign the data.
 *
 * Data is signed as SHA256 HMAC.
 *
 * This was inspired by [keygrip](https://github.com/crypto-utils/keygrip/).
 *
 * @example
 * ```ts
 * import { KeyStack } from "https://deno.land/std@$STD_VERSION/crypto/keystack.ts";
 *
 * const keyStack = new KeyStack(["hello", "world"]);
 * const digest = await keyStack.sign("some data");
 *
 * const rotatedStack = new KeyStack(["deno", "says", "hello", "world"]);
 * await rotatedStack.verify("some data", digest); // true
 * ```
 */ export class KeyStack {
  #cryptoKeys = new Map();
  #keys;
  async #toCryptoKey(key) {
    if (!this.#cryptoKeys.has(key)) {
      this.#cryptoKeys.set(key, await importKey(key));
    }
    return this.#cryptoKeys.get(key);
  }
  get length() {
    return this.#keys.length;
  }
  /** A class which accepts an array of keys that are used to sign and verify
   * data and allows easy key rotation without invalidation of previously signed
   * data.
   *
   * @param keys An iterable of keys, of which the index 0 will be used to sign
   *             data, but verification can happen against any key.
   */ constructor(keys){
    const values = Array.isArray(keys) ? keys : [
      ...keys
    ];
    if (!values.length) {
      throw new TypeError("keys must contain at least one value");
    }
    this.#keys = values;
  }
  /** Take `data` and return a SHA256 HMAC digest that uses the current 0 index
   * of the `keys` passed to the constructor.  This digest is in the form of a
   * URL safe base64 encoded string. */ async sign(data) {
    const key = await this.#toCryptoKey(this.#keys[0]);
    return base64url.encode(await sign(data, key));
  }
  /** Given `data` and a `digest`, verify that one of the `keys` provided the
   * constructor was used to generate the `digest`.  Returns `true` if one of
   * the keys was used, otherwise `false`. */ async verify(data, digest) {
    return await this.indexOf(data, digest) > -1;
  }
  /** Given `data` and a `digest`, return the current index of the key in the
   * `keys` passed the constructor that was used to generate the digest.  If no
   * key can be found, the method returns `-1`. */ async indexOf(data, digest) {
    for(let i = 0; i < this.#keys.length; i++){
      const cryptoKey = await this.#toCryptoKey(this.#keys[i]);
      if (await compare(digest, base64url.encode(await sign(data, cryptoKey)))) {
        return i;
      }
    }
    return -1;
  }
  [_computedKey](inspect) {
    const { length } = this;
    return `${this.constructor.name} ${inspect({
      length
    })}`;
  }
  [_computedKey1](depth, // deno-lint-ignore no-explicit-any
  options, inspect) {
    if (depth < 0) {
      return options.stylize(`[${this.constructor.name}]`, "special");
    }
    const newOptions = Object.assign({}, options, {
      depth: options.depth === null ? null : options.depth - 1
    });
    const { length } = this;
    return `${options.stylize(this.constructor.name, "special")} ${inspect({
      length
    }, newOptions)}`;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL2NyeXB0by91bnN0YWJsZS9rZXlzdGFjay50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIFByb3ZpZGVzIHRoZSB7QGxpbmtjb2RlIEtleVN0YWNrfSBjbGFzcyB3aGljaCBpbXBsZW1lbnRzIHRoZVxuICoge0BsaW5rY29kZSBLZXlSaW5nfSBpbnRlcmZhY2UgZm9yIG1hbmFnaW5nIHJvdGF0YWJsZSBrZXlzLlxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQgeyB0aW1pbmdTYWZlRXF1YWwgfSBmcm9tIFwiLi4vdGltaW5nX3NhZmVfZXF1YWwudHNcIjtcbmltcG9ydCAqIGFzIGJhc2U2NHVybCBmcm9tIFwiLi4vLi4vZW5jb2RpbmcvYmFzZTY0dXJsLnRzXCI7XG5cbi8qKiBUeXBlcyBvZiBkYXRhIHRoYXQgY2FuIGJlIHNpZ25lZCBjcnlwdG9ncmFwaGljYWxseS4gKi9cbmV4cG9ydCB0eXBlIERhdGEgPSBzdHJpbmcgfCBudW1iZXJbXSB8IEFycmF5QnVmZmVyIHwgVWludDhBcnJheTtcblxuLyoqIFR5cGVzIG9mIGtleXMgdGhhdCBjYW4gYmUgdXNlZCB0byBzaWduIGRhdGEuICovXG5leHBvcnQgdHlwZSBLZXkgPSBzdHJpbmcgfCBudW1iZXJbXSB8IEFycmF5QnVmZmVyIHwgVWludDhBcnJheTtcblxuY29uc3QgZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuXG5mdW5jdGlvbiBpbXBvcnRLZXkoa2V5OiBLZXkpOiBQcm9taXNlPENyeXB0b0tleT4ge1xuICBpZiAodHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGtleSA9IGVuY29kZXIuZW5jb2RlKGtleSk7XG4gIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShrZXkpKSB7XG4gICAga2V5ID0gbmV3IFVpbnQ4QXJyYXkoa2V5KTtcbiAgfVxuICByZXR1cm4gY3J5cHRvLnN1YnRsZS5pbXBvcnRLZXkoXG4gICAgXCJyYXdcIixcbiAgICBrZXksXG4gICAge1xuICAgICAgbmFtZTogXCJITUFDXCIsXG4gICAgICBoYXNoOiB7IG5hbWU6IFwiU0hBLTI1NlwiIH0sXG4gICAgfSxcbiAgICB0cnVlLFxuICAgIFtcInNpZ25cIiwgXCJ2ZXJpZnlcIl0sXG4gICk7XG59XG5cbmZ1bmN0aW9uIHNpZ24oZGF0YTogRGF0YSwga2V5OiBDcnlwdG9LZXkpOiBQcm9taXNlPEFycmF5QnVmZmVyPiB7XG4gIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGRhdGEgPSBlbmNvZGVyLmVuY29kZShkYXRhKTtcbiAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgZGF0YSA9IFVpbnQ4QXJyYXkuZnJvbShkYXRhKTtcbiAgfVxuICByZXR1cm4gY3J5cHRvLnN1YnRsZS5zaWduKFwiSE1BQ1wiLCBrZXksIGRhdGEpO1xufVxuXG4vKiogQ29tcGFyZSB0d28gc3RyaW5ncywgVWludDhBcnJheXMsIEFycmF5QnVmZmVycywgb3IgYXJyYXlzIG9mIG51bWJlcnMgaW4gYVxuICogd2F5IHRoYXQgYXZvaWRzIHRpbWluZyBiYXNlZCBhdHRhY2tzIG9uIHRoZSBjb21wYXJpc29ucyBvbiB0aGUgdmFsdWVzLlxuICpcbiAqIFRoZSBmdW5jdGlvbiB3aWxsIHJldHVybiBgdHJ1ZWAgaWYgdGhlIHZhbHVlcyBtYXRjaCwgb3IgYGZhbHNlYCwgaWYgdGhleVxuICogZG8gbm90IG1hdGNoLlxuICpcbiAqIFRoaXMgd2FzIGluc3BpcmVkIGJ5IGh0dHBzOi8vZ2l0aHViLmNvbS9zdXJ5YWdoL3Rzc2NtcCB3aGljaCBwcm92aWRlcyBhXG4gKiB0aW1pbmcgc2FmZSBzdHJpbmcgY29tcGFyaXNvbiB0byBhdm9pZCB0aW1pbmcgYXR0YWNrcyBhcyBkZXNjcmliZWQgaW5cbiAqIGh0dHBzOi8vY29kYWhhbGUuY29tL2EtbGVzc29uLWluLXRpbWluZy1hdHRhY2tzLy5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gY29tcGFyZShhOiBEYXRhLCBiOiBEYXRhKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGNvbnN0IGtleSA9IG5ldyBVaW50OEFycmF5KDMyKTtcbiAgZ2xvYmFsVGhpcy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKGtleSk7XG4gIGNvbnN0IGNyeXB0b0tleSA9IGF3YWl0IGltcG9ydEtleShrZXkpO1xuICBjb25zdCBhaCA9IGF3YWl0IHNpZ24oYSwgY3J5cHRvS2V5KTtcbiAgY29uc3QgYmggPSBhd2FpdCBzaWduKGIsIGNyeXB0b0tleSk7XG4gIHJldHVybiB0aW1pbmdTYWZlRXF1YWwoYWgsIGJoKTtcbn1cblxuLyoqIEEgY3J5cHRvZ3JhcGhpYyBrZXkgY2hhaW4gd2hpY2ggYWxsb3dzIHNpZ25pbmcgb2YgZGF0YSB0byBwcmV2ZW50IHRhbXBlcmluZyxcbiAqIGJ1dCBhbHNvIGFsbG93cyBmb3IgZWFzeSBrZXkgcm90YXRpb24gd2l0aG91dCBuZWVkaW5nIHRvIHJlLXNpZ24gdGhlIGRhdGEuXG4gKlxuICogRGF0YSBpcyBzaWduZWQgYXMgU0hBMjU2IEhNQUMuXG4gKlxuICogVGhpcyB3YXMgaW5zcGlyZWQgYnkgW2tleWdyaXBdKGh0dHBzOi8vZ2l0aHViLmNvbS9jcnlwdG8tdXRpbHMva2V5Z3JpcC8pLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgS2V5U3RhY2sgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9jcnlwdG8va2V5c3RhY2sudHNcIjtcbiAqXG4gKiBjb25zdCBrZXlTdGFjayA9IG5ldyBLZXlTdGFjayhbXCJoZWxsb1wiLCBcIndvcmxkXCJdKTtcbiAqIGNvbnN0IGRpZ2VzdCA9IGF3YWl0IGtleVN0YWNrLnNpZ24oXCJzb21lIGRhdGFcIik7XG4gKlxuICogY29uc3Qgcm90YXRlZFN0YWNrID0gbmV3IEtleVN0YWNrKFtcImRlbm9cIiwgXCJzYXlzXCIsIFwiaGVsbG9cIiwgXCJ3b3JsZFwiXSk7XG4gKiBhd2FpdCByb3RhdGVkU3RhY2sudmVyaWZ5KFwic29tZSBkYXRhXCIsIGRpZ2VzdCk7IC8vIHRydWVcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgS2V5U3RhY2sge1xuICAjY3J5cHRvS2V5cyA9IG5ldyBNYXA8S2V5LCBDcnlwdG9LZXk+KCk7XG4gICNrZXlzOiBLZXlbXTtcblxuICBhc3luYyAjdG9DcnlwdG9LZXkoa2V5OiBLZXkpOiBQcm9taXNlPENyeXB0b0tleT4ge1xuICAgIGlmICghdGhpcy4jY3J5cHRvS2V5cy5oYXMoa2V5KSkge1xuICAgICAgdGhpcy4jY3J5cHRvS2V5cy5zZXQoa2V5LCBhd2FpdCBpbXBvcnRLZXkoa2V5KSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiNjcnlwdG9LZXlzLmdldChrZXkpITtcbiAgfVxuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy4ja2V5cy5sZW5ndGg7XG4gIH1cblxuICAvKiogQSBjbGFzcyB3aGljaCBhY2NlcHRzIGFuIGFycmF5IG9mIGtleXMgdGhhdCBhcmUgdXNlZCB0byBzaWduIGFuZCB2ZXJpZnlcbiAgICogZGF0YSBhbmQgYWxsb3dzIGVhc3kga2V5IHJvdGF0aW9uIHdpdGhvdXQgaW52YWxpZGF0aW9uIG9mIHByZXZpb3VzbHkgc2lnbmVkXG4gICAqIGRhdGEuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlzIEFuIGl0ZXJhYmxlIG9mIGtleXMsIG9mIHdoaWNoIHRoZSBpbmRleCAwIHdpbGwgYmUgdXNlZCB0byBzaWduXG4gICAqICAgICAgICAgICAgIGRhdGEsIGJ1dCB2ZXJpZmljYXRpb24gY2FuIGhhcHBlbiBhZ2FpbnN0IGFueSBrZXkuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihrZXlzOiBJdGVyYWJsZTxLZXk+KSB7XG4gICAgY29uc3QgdmFsdWVzID0gQXJyYXkuaXNBcnJheShrZXlzKSA/IGtleXMgOiBbLi4ua2V5c107XG4gICAgaWYgKCEodmFsdWVzLmxlbmd0aCkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJrZXlzIG11c3QgY29udGFpbiBhdCBsZWFzdCBvbmUgdmFsdWVcIik7XG4gICAgfVxuICAgIHRoaXMuI2tleXMgPSB2YWx1ZXM7XG4gIH1cblxuICAvKiogVGFrZSBgZGF0YWAgYW5kIHJldHVybiBhIFNIQTI1NiBITUFDIGRpZ2VzdCB0aGF0IHVzZXMgdGhlIGN1cnJlbnQgMCBpbmRleFxuICAgKiBvZiB0aGUgYGtleXNgIHBhc3NlZCB0byB0aGUgY29uc3RydWN0b3IuICBUaGlzIGRpZ2VzdCBpcyBpbiB0aGUgZm9ybSBvZiBhXG4gICAqIFVSTCBzYWZlIGJhc2U2NCBlbmNvZGVkIHN0cmluZy4gKi9cbiAgYXN5bmMgc2lnbihkYXRhOiBEYXRhKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBrZXkgPSBhd2FpdCB0aGlzLiN0b0NyeXB0b0tleSh0aGlzLiNrZXlzWzBdKTtcbiAgICByZXR1cm4gYmFzZTY0dXJsLmVuY29kZShhd2FpdCBzaWduKGRhdGEsIGtleSkpO1xuICB9XG5cbiAgLyoqIEdpdmVuIGBkYXRhYCBhbmQgYSBgZGlnZXN0YCwgdmVyaWZ5IHRoYXQgb25lIG9mIHRoZSBga2V5c2AgcHJvdmlkZWQgdGhlXG4gICAqIGNvbnN0cnVjdG9yIHdhcyB1c2VkIHRvIGdlbmVyYXRlIHRoZSBgZGlnZXN0YC4gIFJldHVybnMgYHRydWVgIGlmIG9uZSBvZlxuICAgKiB0aGUga2V5cyB3YXMgdXNlZCwgb3RoZXJ3aXNlIGBmYWxzZWAuICovXG4gIGFzeW5jIHZlcmlmeShkYXRhOiBEYXRhLCBkaWdlc3Q6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5pbmRleE9mKGRhdGEsIGRpZ2VzdCkpID4gLTE7XG4gIH1cblxuICAvKiogR2l2ZW4gYGRhdGFgIGFuZCBhIGBkaWdlc3RgLCByZXR1cm4gdGhlIGN1cnJlbnQgaW5kZXggb2YgdGhlIGtleSBpbiB0aGVcbiAgICogYGtleXNgIHBhc3NlZCB0aGUgY29uc3RydWN0b3IgdGhhdCB3YXMgdXNlZCB0byBnZW5lcmF0ZSB0aGUgZGlnZXN0LiAgSWYgbm9cbiAgICoga2V5IGNhbiBiZSBmb3VuZCwgdGhlIG1ldGhvZCByZXR1cm5zIGAtMWAuICovXG4gIGFzeW5jIGluZGV4T2YoZGF0YTogRGF0YSwgZGlnZXN0OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy4ja2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgY3J5cHRvS2V5ID0gYXdhaXQgdGhpcy4jdG9DcnlwdG9LZXkodGhpcy4ja2V5c1tpXSk7XG4gICAgICBpZiAoXG4gICAgICAgIGF3YWl0IGNvbXBhcmUoZGlnZXN0LCBiYXNlNjR1cmwuZW5jb2RlKGF3YWl0IHNpZ24oZGF0YSwgY3J5cHRvS2V5KSkpXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIGk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gIFtTeW1ib2wuZm9yKFwiRGVuby5jdXN0b21JbnNwZWN0XCIpXShpbnNwZWN0OiAodmFsdWU6IHVua25vd24pID0+IHN0cmluZykge1xuICAgIGNvbnN0IHsgbGVuZ3RoIH0gPSB0aGlzO1xuICAgIHJldHVybiBgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9ICR7aW5zcGVjdCh7IGxlbmd0aCB9KX1gO1xuICB9XG5cbiAgW1N5bWJvbC5mb3IoXCJub2RlanMudXRpbC5pbnNwZWN0LmN1c3RvbVwiKV0oXG4gICAgZGVwdGg6IG51bWJlcixcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIG9wdGlvbnM6IGFueSxcbiAgICBpbnNwZWN0OiAodmFsdWU6IHVua25vd24sIG9wdGlvbnM/OiB1bmtub3duKSA9PiBzdHJpbmcsXG4gICkge1xuICAgIGlmIChkZXB0aCA8IDApIHtcbiAgICAgIHJldHVybiBvcHRpb25zLnN0eWxpemUoYFske3RoaXMuY29uc3RydWN0b3IubmFtZX1dYCwgXCJzcGVjaWFsXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IG5ld09wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLCB7XG4gICAgICBkZXB0aDogb3B0aW9ucy5kZXB0aCA9PT0gbnVsbCA/IG51bGwgOiBvcHRpb25zLmRlcHRoIC0gMSxcbiAgICB9KTtcbiAgICBjb25zdCB7IGxlbmd0aCB9ID0gdGhpcztcbiAgICByZXR1cm4gYCR7b3B0aW9ucy5zdHlsaXplKHRoaXMuY29uc3RydWN0b3IubmFtZSwgXCJzcGVjaWFsXCIpfSAke1xuICAgICAgaW5zcGVjdCh7IGxlbmd0aCB9LCBuZXdPcHRpb25zKVxuICAgIH1gO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQzs7Ozs7Q0FLQztBQUVELFNBQVMsZUFBZSxRQUFRLDBCQUEwQjtBQUMxRCxZQUFZLGVBQWUsOEJBQThCO0FBUXpELE1BQU0sVUFBVSxJQUFJO0FBRXBCLFNBQVMsVUFBVSxHQUFRO0VBQ3pCLElBQUksT0FBTyxRQUFRLFVBQVU7SUFDM0IsTUFBTSxRQUFRLE1BQU0sQ0FBQztFQUN2QixPQUFPLElBQUksTUFBTSxPQUFPLENBQUMsTUFBTTtJQUM3QixNQUFNLElBQUksV0FBVztFQUN2QjtFQUNBLE9BQU8sT0FBTyxNQUFNLENBQUMsU0FBUyxDQUM1QixPQUNBLEtBQ0E7SUFDRSxNQUFNO0lBQ04sTUFBTTtNQUFFLE1BQU07SUFBVTtFQUMxQixHQUNBLE1BQ0E7SUFBQztJQUFRO0dBQVM7QUFFdEI7QUFFQSxTQUFTLEtBQUssSUFBVSxFQUFFLEdBQWM7RUFDdEMsSUFBSSxPQUFPLFNBQVMsVUFBVTtJQUM1QixPQUFPLFFBQVEsTUFBTSxDQUFDO0VBQ3hCLE9B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
// denoCacheMetadata=735860112310841127,813019477162741463