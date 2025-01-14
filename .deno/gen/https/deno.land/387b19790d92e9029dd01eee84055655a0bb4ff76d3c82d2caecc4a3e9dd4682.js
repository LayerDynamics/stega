// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assert } from "../assert/assert.ts";
/**
 * When checking the values of cryptographic hashes are equal, default
 * comparisons can be susceptible to timing based attacks, where attacker is
 * able to find out information about the host system by repeatedly checking
 * response times to equality comparisons of values.
 *
 * It is likely some form of timing safe equality will make its way to the
 * WebCrypto standard (see:
 * [w3c/webcrypto#270](https://github.com/w3c/webcrypto/issues/270)), but until
 * that time, `timingSafeEqual()` is provided:
 *
 * ```ts
 * import { timingSafeEqual } from "https://deno.land/std@$STD_VERSION/crypto/timing_safe_equal.ts";
 * import { assert } from "https://deno.land/std@$STD_VERSION/assert/assert.ts";
 *
 * const a = await crypto.subtle.digest(
 *   "SHA-384",
 *   new TextEncoder().encode("hello world"),
 * );
 * const b = await crypto.subtle.digest(
 *   "SHA-384",
 *   new TextEncoder().encode("hello world"),
 * );
 *
 * assert(timingSafeEqual(a, b));
 * ```
 */ export function timingSafeEqual(a, b) {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  if (!(a instanceof DataView)) {
    a = ArrayBuffer.isView(a) ? new DataView(a.buffer, a.byteOffset, a.byteLength) : new DataView(a);
  }
  if (!(b instanceof DataView)) {
    b = ArrayBuffer.isView(b) ? new DataView(b.buffer, b.byteOffset, b.byteLength) : new DataView(b);
  }
  assert(a instanceof DataView);
  assert(b instanceof DataView);
  const length = a.byteLength;
  let out = 0;
  let i = -1;
  while(++i < length){
    out |= a.getUint8(i) ^ b.getUint8(i);
  }
  return out === 0;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL2NyeXB0by90aW1pbmdfc2FmZV9lcXVhbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vYXNzZXJ0L2Fzc2VydC50c1wiO1xuXG4vKipcbiAqIFdoZW4gY2hlY2tpbmcgdGhlIHZhbHVlcyBvZiBjcnlwdG9ncmFwaGljIGhhc2hlcyBhcmUgZXF1YWwsIGRlZmF1bHRcbiAqIGNvbXBhcmlzb25zIGNhbiBiZSBzdXNjZXB0aWJsZSB0byB0aW1pbmcgYmFzZWQgYXR0YWNrcywgd2hlcmUgYXR0YWNrZXIgaXNcbiAqIGFibGUgdG8gZmluZCBvdXQgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGhvc3Qgc3lzdGVtIGJ5IHJlcGVhdGVkbHkgY2hlY2tpbmdcbiAqIHJlc3BvbnNlIHRpbWVzIHRvIGVxdWFsaXR5IGNvbXBhcmlzb25zIG9mIHZhbHVlcy5cbiAqXG4gKiBJdCBpcyBsaWtlbHkgc29tZSBmb3JtIG9mIHRpbWluZyBzYWZlIGVxdWFsaXR5IHdpbGwgbWFrZSBpdHMgd2F5IHRvIHRoZVxuICogV2ViQ3J5cHRvIHN0YW5kYXJkIChzZWU6XG4gKiBbdzNjL3dlYmNyeXB0byMyNzBdKGh0dHBzOi8vZ2l0aHViLmNvbS93M2Mvd2ViY3J5cHRvL2lzc3Vlcy8yNzApKSwgYnV0IHVudGlsXG4gKiB0aGF0IHRpbWUsIGB0aW1pbmdTYWZlRXF1YWwoKWAgaXMgcHJvdmlkZWQ6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHRpbWluZ1NhZmVFcXVhbCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2NyeXB0by90aW1pbmdfc2FmZV9lcXVhbC50c1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vYXNzZXJ0L2Fzc2VydC50c1wiO1xuICpcbiAqIGNvbnN0IGEgPSBhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdChcbiAqICAgXCJTSEEtMzg0XCIsXG4gKiAgIG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcImhlbGxvIHdvcmxkXCIpLFxuICogKTtcbiAqIGNvbnN0IGIgPSBhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdChcbiAqICAgXCJTSEEtMzg0XCIsXG4gKiAgIG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcImhlbGxvIHdvcmxkXCIpLFxuICogKTtcbiAqXG4gKiBhc3NlcnQodGltaW5nU2FmZUVxdWFsKGEsIGIpKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdGltaW5nU2FmZUVxdWFsKFxuICBhOiBBcnJheUJ1ZmZlclZpZXcgfCBBcnJheUJ1ZmZlckxpa2UgfCBEYXRhVmlldyxcbiAgYjogQXJyYXlCdWZmZXJWaWV3IHwgQXJyYXlCdWZmZXJMaWtlIHwgRGF0YVZpZXcsXG4pOiBib29sZWFuIHtcbiAgaWYgKGEuYnl0ZUxlbmd0aCAhPT0gYi5ieXRlTGVuZ3RoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICghKGEgaW5zdGFuY2VvZiBEYXRhVmlldykpIHtcbiAgICBhID0gQXJyYXlCdWZmZXIuaXNWaWV3KGEpXG4gICAgICA/IG5ldyBEYXRhVmlldyhhLmJ1ZmZlciwgYS5ieXRlT2Zmc2V0LCBhLmJ5dGVMZW5ndGgpXG4gICAgICA6IG5ldyBEYXRhVmlldyhhKTtcbiAgfVxuICBpZiAoIShiIGluc3RhbmNlb2YgRGF0YVZpZXcpKSB7XG4gICAgYiA9IEFycmF5QnVmZmVyLmlzVmlldyhiKVxuICAgICAgPyBuZXcgRGF0YVZpZXcoYi5idWZmZXIsIGIuYnl0ZU9mZnNldCwgYi5ieXRlTGVuZ3RoKVxuICAgICAgOiBuZXcgRGF0YVZpZXcoYik7XG4gIH1cbiAgYXNzZXJ0KGEgaW5zdGFuY2VvZiBEYXRhVmlldyk7XG4gIGFzc2VydChiIGluc3RhbmNlb2YgRGF0YVZpZXcpO1xuICBjb25zdCBsZW5ndGggPSBhLmJ5dGVMZW5ndGg7XG4gIGxldCBvdXQgPSAwO1xuICBsZXQgaSA9IC0xO1xuICB3aGlsZSAoKytpIDwgbGVuZ3RoKSB7XG4gICAgb3V0IHw9IGEuZ2V0VWludDgoaSkgXiBiLmdldFVpbnQ4KGkpO1xuICB9XG4gIHJldHVybiBvdXQgPT09IDA7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLE1BQU0sUUFBUSxzQkFBc0I7QUFFN0M7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBMEJDLEdBQ0QsT0FBTyxTQUFTLGdCQUNkLENBQStDLEVBQy9DLENBQStDO0VBRS9DLElBQUksRUFBRSxVQUFVLEtBQUssRUFBRSxVQUFVLEVBQUU7SUFDakMsT0FBTztFQUNUO0VBQ0EsSUFBSSxDQUFDLENBQUMsYUFBYSxRQUFRLEdBQUc7SUFDNUIsSUFBSSxZQUFZLE1BQU0sQ0FBQyxLQUNuQixJQUFJLFNBQVMsRUFBRSxNQUFNLEVBQUUsRUFBRSxVQUFVLEVBQUUsRUFBRSxVQUFVLElBQ2pELElBQUksU0FBUztFQUNuQjtFQUNBLElBQUksQ0FBQyxDQUFDLGFBQWEsUUFBUSxHQUFHO0lBQzVCLElBQUksWUFBWSxNQUFNLENBQUMsS0FDbkIsSUFBSSxTQUFTLEVBQUUsTUFBTSxFQUFFLEVBQUUsVUFBVSxFQUFFLEVBQUUsVUFBVSxJQUNqRCxJQUFJLFNBQVM7RUFDbkI7RUFDQSxPQUFPLGFBQWE7RUFDcEIsT0FBTyxhQUFhO0VBQ3BCLE1BQU0sU0FBUyxFQUFFLFVBQVU7RUFDM0IsSUFBSSxNQUFNO0VBQ1YsSUFBSSxJQUFJLENBQUM7RUFDVCxNQUFPLEVBQUUsSUFBSSxPQUFRO0lBQ25CLE9BQU8sRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQztFQUNwQztFQUNBLE9BQU8sUUFBUTtBQUNqQiJ9
// denoCacheMetadata=15126620760810699122,15170306307979631011