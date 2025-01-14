// Copyright 2009 The Go Authors. All rights reserved.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { validateBinaryLike } from "./_util.ts";
/** Port of the Go
 * [encoding/hex](https://github.com/golang/go/blob/go1.12.5/src/encoding/hex/hex.go)
 * library.
 *
 * This module is browser compatible.
 *
 * @example
 * ```ts
 * import {
 *   decodeHex,
 *   encodeHex,
 * } from "https://deno.land/std@$STD_VERSION/encoding/hex.ts";
 *
 * const binary = new TextEncoder().encode("abc");
 * const encoded = encodeHex(binary);
 * console.log(encoded);
 * // => "616263"
 *
 * console.log(decodeHex(encoded));
 * // => Uint8Array(3) [ 97, 98, 99 ]
 * ```
 *
 * @module
 */ const hexTable = new TextEncoder().encode("0123456789abcdef");
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
function errInvalidByte(byte) {
  return new TypeError(`Invalid byte '${String.fromCharCode(byte)}'`);
}
function errLength() {
  return new RangeError("Odd length hex string");
}
/** Converts a hex character into its value. */ function fromHexChar(byte) {
  // '0' <= byte && byte <= '9'
  if (48 <= byte && byte <= 57) return byte - 48;
  // 'a' <= byte && byte <= 'f'
  if (97 <= byte && byte <= 102) return byte - 97 + 10;
  // 'A' <= byte && byte <= 'F'
  if (65 <= byte && byte <= 70) return byte - 65 + 10;
  throw errInvalidByte(byte);
}
/**
 * @deprecated (will be removed in 0.210.0) Use a `encodeHex` instead.
 *
 * Encodes `src` into `src.length * 2` bytes.
 */ export function encode(src) {
  const dst = new Uint8Array(src.length * 2);
  for(let i = 0; i < dst.length; i++){
    const v = src[i];
    dst[i * 2] = hexTable[v >> 4];
    dst[i * 2 + 1] = hexTable[v & 0x0f];
  }
  return dst;
}
/** Encodes the source into hex string. */ export function encodeHex(src) {
  const u8 = validateBinaryLike(src);
  const dst = new Uint8Array(u8.length * 2);
  for(let i = 0; i < dst.length; i++){
    const v = u8[i];
    dst[i * 2] = hexTable[v >> 4];
    dst[i * 2 + 1] = hexTable[v & 0x0f];
  }
  return textDecoder.decode(dst);
}
/**
 * @deprecated (will be removed in 0.210.0) Use a `decodeHex` instead.
 *
 * Decodes `src` into `src.length / 2` bytes.
 * If the input is malformed, an error will be thrown.
 */ export function decode(src) {
  const dst = new Uint8Array(src.length / 2);
  for(let i = 0; i < dst.length; i++){
    const a = fromHexChar(src[i * 2]);
    const b = fromHexChar(src[i * 2 + 1]);
    dst[i] = a << 4 | b;
  }
  if (src.length % 2 === 1) {
    // Check for invalid char before reporting bad length,
    // since the invalid char (if present) is an earlier problem.
    fromHexChar(src[dst.length * 2]);
    throw errLength();
  }
  return dst;
}
/** Decodes the given hex string to Uint8Array.
 * If the input is malformed, an error will be thrown. */ export function decodeHex(src) {
  const u8 = textEncoder.encode(src);
  const dst = new Uint8Array(u8.length / 2);
  for(let i = 0; i < dst.length; i++){
    const a = fromHexChar(u8[i * 2]);
    const b = fromHexChar(u8[i * 2 + 1]);
    dst[i] = a << 4 | b;
  }
  if (u8.length % 2 === 1) {
    // Check for invalid char before reporting bad length,
    // since the invalid char (if present) is an earlier problem.
    fromHexChar(u8[dst.length * 2]);
    throw errLength();
  }
  return dst;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL2VuY29kaW5nL2hleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAwOSBUaGUgR28gQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb2xhbmcvZ28vYmxvYi9tYXN0ZXIvTElDRU5TRVxuLy8gQ29weXJpZ2h0IDIwMTgtMjAyMyB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgdmFsaWRhdGVCaW5hcnlMaWtlIH0gZnJvbSBcIi4vX3V0aWwudHNcIjtcblxuLyoqIFBvcnQgb2YgdGhlIEdvXG4gKiBbZW5jb2RpbmcvaGV4XShodHRwczovL2dpdGh1Yi5jb20vZ29sYW5nL2dvL2Jsb2IvZ28xLjEyLjUvc3JjL2VuY29kaW5nL2hleC9oZXguZ28pXG4gKiBsaWJyYXJ5LlxuICpcbiAqIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7XG4gKiAgIGRlY29kZUhleCxcbiAqICAgZW5jb2RlSGV4LFxuICogfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9lbmNvZGluZy9oZXgudHNcIjtcbiAqXG4gKiBjb25zdCBiaW5hcnkgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJhYmNcIik7XG4gKiBjb25zdCBlbmNvZGVkID0gZW5jb2RlSGV4KGJpbmFyeSk7XG4gKiBjb25zb2xlLmxvZyhlbmNvZGVkKTtcbiAqIC8vID0+IFwiNjE2MjYzXCJcbiAqXG4gKiBjb25zb2xlLmxvZyhkZWNvZGVIZXgoZW5jb2RlZCkpO1xuICogLy8gPT4gVWludDhBcnJheSgzKSBbIDk3LCA5OCwgOTkgXVxuICogYGBgXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmNvbnN0IGhleFRhYmxlID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiMDEyMzQ1Njc4OWFiY2RlZlwiKTtcbmNvbnN0IHRleHRFbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG5jb25zdCB0ZXh0RGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpO1xuXG5mdW5jdGlvbiBlcnJJbnZhbGlkQnl0ZShieXRlOiBudW1iZXIpIHtcbiAgcmV0dXJuIG5ldyBUeXBlRXJyb3IoYEludmFsaWQgYnl0ZSAnJHtTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGUpfSdgKTtcbn1cblxuZnVuY3Rpb24gZXJyTGVuZ3RoKCkge1xuICByZXR1cm4gbmV3IFJhbmdlRXJyb3IoXCJPZGQgbGVuZ3RoIGhleCBzdHJpbmdcIik7XG59XG5cbi8qKiBDb252ZXJ0cyBhIGhleCBjaGFyYWN0ZXIgaW50byBpdHMgdmFsdWUuICovXG5mdW5jdGlvbiBmcm9tSGV4Q2hhcihieXRlOiBudW1iZXIpOiBudW1iZXIge1xuICAvLyAnMCcgPD0gYnl0ZSAmJiBieXRlIDw9ICc5J1xuICBpZiAoNDggPD0gYnl0ZSAmJiBieXRlIDw9IDU3KSByZXR1cm4gYnl0ZSAtIDQ4O1xuICAvLyAnYScgPD0gYnl0ZSAmJiBieXRlIDw9ICdmJ1xuICBpZiAoOTcgPD0gYnl0ZSAmJiBieXRlIDw9IDEwMikgcmV0dXJuIGJ5dGUgLSA5NyArIDEwO1xuICAvLyAnQScgPD0gYnl0ZSAmJiBieXRlIDw9ICdGJ1xuICBpZiAoNjUgPD0gYnl0ZSAmJiBieXRlIDw9IDcwKSByZXR1cm4gYnl0ZSAtIDY1ICsgMTA7XG5cbiAgdGhyb3cgZXJySW52YWxpZEJ5dGUoYnl0ZSk7XG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgKHdpbGwgYmUgcmVtb3ZlZCBpbiAwLjIxMC4wKSBVc2UgYSBgZW5jb2RlSGV4YCBpbnN0ZWFkLlxuICpcbiAqIEVuY29kZXMgYHNyY2AgaW50byBgc3JjLmxlbmd0aCAqIDJgIGJ5dGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlKHNyYzogVWludDhBcnJheSk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBkc3QgPSBuZXcgVWludDhBcnJheShzcmMubGVuZ3RoICogMik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZHN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdiA9IHNyY1tpXTtcbiAgICBkc3RbaSAqIDJdID0gaGV4VGFibGVbdiA+PiA0XTtcbiAgICBkc3RbaSAqIDIgKyAxXSA9IGhleFRhYmxlW3YgJiAweDBmXTtcbiAgfVxuICByZXR1cm4gZHN0O1xufVxuXG4vKiogRW5jb2RlcyB0aGUgc291cmNlIGludG8gaGV4IHN0cmluZy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVIZXgoc3JjOiBzdHJpbmcgfCBVaW50OEFycmF5IHwgQXJyYXlCdWZmZXIpOiBzdHJpbmcge1xuICBjb25zdCB1OCA9IHZhbGlkYXRlQmluYXJ5TGlrZShzcmMpO1xuXG4gIGNvbnN0IGRzdCA9IG5ldyBVaW50OEFycmF5KHU4Lmxlbmd0aCAqIDIpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRzdC5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHYgPSB1OFtpXTtcbiAgICBkc3RbaSAqIDJdID0gaGV4VGFibGVbdiA+PiA0XTtcbiAgICBkc3RbaSAqIDIgKyAxXSA9IGhleFRhYmxlW3YgJiAweDBmXTtcbiAgfVxuICByZXR1cm4gdGV4dERlY29kZXIuZGVjb2RlKGRzdCk7XG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgKHdpbGwgYmUgcmVtb3ZlZCBpbiAwLjIxMC4wKSBVc2UgYSBgZGVjb2RlSGV4YCBpbnN0ZWFkLlxuICpcbiAqIERlY29kZXMgYHNyY2AgaW50byBgc3JjLmxlbmd0aCAvIDJgIGJ5dGVzLlxuICogSWYgdGhlIGlucHV0IGlzIG1hbGZvcm1lZCwgYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGUoc3JjOiBVaW50OEFycmF5KTogVWludDhBcnJheSB7XG4gIGNvbnN0IGRzdCA9IG5ldyBVaW50OEFycmF5KHNyYy5sZW5ndGggLyAyKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkc3QubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhID0gZnJvbUhleENoYXIoc3JjW2kgKiAyXSk7XG4gICAgY29uc3QgYiA9IGZyb21IZXhDaGFyKHNyY1tpICogMiArIDFdKTtcbiAgICBkc3RbaV0gPSAoYSA8PCA0KSB8IGI7XG4gIH1cblxuICBpZiAoc3JjLmxlbmd0aCAlIDIgPT09IDEpIHtcbiAgICAvLyBDaGVjayBmb3IgaW52YWxpZCBjaGFyIGJlZm9yZSByZXBvcnRpbmcgYmFkIGxlbmd0aCxcbiAgICAvLyBzaW5jZSB0aGUgaW52YWxpZCBjaGFyIChpZiBwcmVzZW50KSBpcyBhbiBlYXJsaWVyIHByb2JsZW0uXG4gICAgZnJvbUhleENoYXIoc3JjW2RzdC5sZW5ndGggKiAyXSk7XG4gICAgdGhyb3cgZXJyTGVuZ3RoKCk7XG4gIH1cblxuICByZXR1cm4gZHN0O1xufVxuXG4vKiogRGVjb2RlcyB0aGUgZ2l2ZW4gaGV4IHN0cmluZyB0byBVaW50OEFycmF5LlxuICogSWYgdGhlIGlucHV0IGlzIG1hbGZvcm1lZCwgYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24uICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlSGV4KHNyYzogc3RyaW5nKTogVWludDhBcnJheSB7XG4gIGNvbnN0IHU4ID0gdGV4dEVuY29kZXIuZW5jb2RlKHNyYyk7XG4gIGNvbnN0IGRzdCA9IG5ldyBVaW50OEFycmF5KHU4Lmxlbmd0aCAvIDIpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRzdC5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGEgPSBmcm9tSGV4Q2hhcih1OFtpICogMl0pO1xuICAgIGNvbnN0IGIgPSBmcm9tSGV4Q2hhcih1OFtpICogMiArIDFdKTtcbiAgICBkc3RbaV0gPSAoYSA8PCA0KSB8IGI7XG4gIH1cblxuICBpZiAodTgubGVuZ3RoICUgMiA9PT0gMSkge1xuICAgIC8vIENoZWNrIGZvciBpbnZhbGlkIGNoYXIgYmVmb3JlIHJlcG9ydGluZyBiYWQgbGVuZ3RoLFxuICAgIC8vIHNpbmNlIHRoZSBpbnZhbGlkIGNoYXIgKGlmIHByZXNlbnQpIGlzIGFuIGVhcmxpZXIgcHJvYmxlbS5cbiAgICBmcm9tSGV4Q2hhcih1OFtkc3QubGVuZ3RoICogMl0pO1xuICAgIHRocm93IGVyckxlbmd0aCgpO1xuICB9XG5cbiAgcmV0dXJuIGRzdDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxzREFBc0Q7QUFDdEQsbURBQW1EO0FBQ25ELDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FBUyxrQkFBa0IsUUFBUSxhQUFhO0FBRWhEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXVCQyxHQUVELE1BQU0sV0FBVyxJQUFJLGNBQWMsTUFBTSxDQUFDO0FBQzFDLE1BQU0sY0FBYyxJQUFJO0FBQ3hCLE1BQU0sY0FBYyxJQUFJO0FBRXhCLFNBQVMsZUFBZSxJQUFZO0VBQ2xDLE9BQU8sSUFBSSxVQUFVLENBQUMsY0FBYyxFQUFFLE9BQU8sWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3BFO0FBRUEsU0FBUztFQUNQLE9BQU8sSUFBSSxXQUFXO0FBQ3hCO0FBRUEsNkNBQTZDLEdBQzdDLFNBQVMsWUFBWSxJQUFZO0VBQy9CLDZCQUE2QjtFQUM3QixJQUFJLE1BQU0sUUFBUSxRQUFRLElBQUksT0FBTyxPQUFPO0VBQzVDLDZCQUE2QjtFQUM3QixJQUFJLE1BQU0sUUFBUSxRQUFRLEtBQUssT0FBTyxPQUFPLEtBQUs7RUFDbEQsNkJBQTZCO0VBQzdCLElBQUksTUFBTSxRQUFRLFFBQVEsSUFBSSxPQUFPLE9BQU8sS0FBSztFQUVqRCxNQUFNLGVBQWU7QUFDdkI7QUFFQTs7OztDQUlDLEdBQ0QsT0FBTyxTQUFTLE9BQU8sR0FBZTtFQUNwQyxNQUFNLE1BQU0sSUFBSSxXQUFXLElBQUksTUFBTSxHQUFHO0VBQ3hDLElBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLE1BQU0sRUFBRSxJQUFLO0lBQ25DLE1BQU0sSUFBSSxHQUFHLENBQUMsRUFBRTtJQUNoQixHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRTtJQUM3QixHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsR0FBRyxRQUFRLENBQUMsSUFBSSxLQUFLO0VBQ3JDO0VBQ0EsT0FBTztBQUNUO0FBRUEsd0NBQXdDLEdBQ3hDLE9BQU8sU0FBUyxVQUFVLEdBQXNDO0VBQzlELE1BQU0sS0FBSyxtQkFBbUI7RUFFOUIsTUFBTSxNQUFNLElBQUksV0FBVyxHQUFHLE1BQU0sR0FBRztFQUN2QyxJQUFLLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxNQUFNLEVBQUUsSUFBSztJQUNuQyxNQUFNLElBQUksRUFBRSxDQUFDLEVBQUU7SUFDZixHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRTtJQUM3QixHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsR0FBRyxRQUFRLENBQUMsSUFBSSxLQUFLO0VBQ3JDO0VBQ0EsT0FBTyxZQUFZLE1BQU0sQ0FBQztBQUM1QjtBQUVBOzs7OztDQUtDLEdBQ0QsT0FBTyxTQUFTLE9BQU8sR0FBZTtFQUNwQyxNQUFNLE1BQU0sSUFBSSxXQUFXLElBQUksTUFBTSxHQUFHO0VBQ3hDLElBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLE1BQU0sRUFBRSxJQUFLO0lBQ25DLE1BQU0sSUFBSSxZQUFZLEdBQUcsQ0FBQyxJQUFJLEVBQUU7SUFDaEMsTUFBTSxJQUFJLFlBQVksR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFO0lBQ3BDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQUFBQyxLQUFLLElBQUs7RUFDdEI7RUFFQSxJQUFJLElBQUksTUFBTSxHQUFHLE1BQU0sR0FBRztJQUN4QixzREFBc0Q7SUFDdEQsNkRBQTZEO0lBQzdELFlBQVksR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLEVBQUU7SUFDL0IsTUFBTTtFQUNSO0VBRUEsT0FBTztBQUNUO0FBRUE7dURBQ3VELEdBQ3ZELE9BQU8sU0FBUyxVQUFVLEdBQVc7RUFDbkMsTUFBTSxLQUFLLFlBQVksTUFBTSxDQUFDO0VBQzlCLE1BQU0sTUFBTSxJQUFJLFdBQVcsR0FBRyxNQUFNLEdBQUc7RUFDdkMsSUFBSyxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksTUFBTSxFQUFFLElBQUs7SUFDbkMsTUFBTSxJQUFJLFlBQVksRUFBRSxDQUFDLElBQUksRUFBRTtJQUMvQixNQUFNLElBQUksWUFBWSxFQUFFLENBQUMsSUFBSSxJQUFJLEVBQUU7SUFDbkMsR0FBRyxDQUFDLEVBQUUsR0FBRyxBQUFDLEtBQUssSUFBSztFQUN0QjtFQUVBLElBQUksR0FBRyxNQUFNLEdBQUcsTUFBTSxHQUFHO0lBQ3ZCLHNEQUFzRDtJQUN0RCw2REFBNkQ7SUFDN0QsWUFBWSxFQUFFLENBQUMsSUFBSSxNQUFNLEdBQUcsRUFBRTtJQUM5QixNQUFNO0VBQ1I7RUFFQSxPQUFPO0FBQ1QifQ==
// denoCacheMetadata=1883996447365595875,8842825599332933298