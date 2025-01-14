// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * {@linkcode encodeBase64Url} and {@linkcode decodeBase64Url} for
 * [base64 URL safe](https://en.wikipedia.org/wiki/Base64#URL_applications) encoding.
 *
 * This module is browser compatible.
 *
 * @example
 * ```ts
 * import {
 *   decodeBase64Url,
 *   encodeBase64Url,
 * } from "https://deno.land/std@$STD_VERSION/encoding/base64url.ts";
 *
 * const binary = new TextEncoder().encode("foobar");
 * const encoded = encodeBase64Url(binary);
 * console.log(encoded);
 * // => "Zm9vYmFy"
 *
 * console.log(decodeBase64Url(encoded));
 * // => Uint8Array(6) [ 102, 111, 111, 98, 97, 114 ]
 * ```
 *
 * @module
 */ import * as base64 from "./base64.ts";
/*
 * Some variants allow or require omitting the padding '=' signs:
 * https://en.wikipedia.org/wiki/Base64#The_URL_applications
 * @param base64url
 */ function addPaddingToBase64url(base64url) {
  if (base64url.length % 4 === 2) return base64url + "==";
  if (base64url.length % 4 === 3) return base64url + "=";
  if (base64url.length % 4 === 1) {
    throw new TypeError("Illegal base64url string!");
  }
  return base64url;
}
function convertBase64urlToBase64(b64url) {
  if (!/^[-_A-Z0-9]*?={0,2}$/i.test(b64url)) {
    // Contains characters not part of base64url spec.
    throw new TypeError("Failed to decode base64url: invalid character");
  }
  return addPaddingToBase64url(b64url).replace(/\-/g, "+").replace(/_/g, "/");
}
function convertBase64ToBase64url(b64) {
  return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
/**
 * @deprecated (will be removed in 0.210.0) Use a `encodeBase64Url` instead.
 *
 * Encodes a given ArrayBuffer or string into a base64url representation
 * @param data
 */ export const encode = encodeBase64Url;
/**
 * @deprecated (will be removed in 0.210.0) Use a `decodeBase64Url` instead.
 *
 * Converts given base64url encoded data back to original
 * @param b64url
 */ export const decode = decodeBase64Url;
/**
 * Encodes a given ArrayBuffer or string into a base64url representation
 * @param data
 */ export function encodeBase64Url(data) {
  return convertBase64ToBase64url(base64.encodeBase64(data));
}
/**
 * Converts given base64url encoded data back to original
 * @param b64url
 */ export function decodeBase64Url(b64url) {
  return base64.decodeBase64(convertBase64urlToBase64(b64url));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL2VuY29kaW5nL2Jhc2U2NHVybC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIHtAbGlua2NvZGUgZW5jb2RlQmFzZTY0VXJsfSBhbmQge0BsaW5rY29kZSBkZWNvZGVCYXNlNjRVcmx9IGZvclxuICogW2Jhc2U2NCBVUkwgc2FmZV0oaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQmFzZTY0I1VSTF9hcHBsaWNhdGlvbnMpIGVuY29kaW5nLlxuICpcbiAqIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7XG4gKiAgIGRlY29kZUJhc2U2NFVybCxcbiAqICAgZW5jb2RlQmFzZTY0VXJsLFxuICogfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9lbmNvZGluZy9iYXNlNjR1cmwudHNcIjtcbiAqXG4gKiBjb25zdCBiaW5hcnkgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJmb29iYXJcIik7XG4gKiBjb25zdCBlbmNvZGVkID0gZW5jb2RlQmFzZTY0VXJsKGJpbmFyeSk7XG4gKiBjb25zb2xlLmxvZyhlbmNvZGVkKTtcbiAqIC8vID0+IFwiWm05dlltRnlcIlxuICpcbiAqIGNvbnNvbGUubG9nKGRlY29kZUJhc2U2NFVybChlbmNvZGVkKSk7XG4gKiAvLyA9PiBVaW50OEFycmF5KDYpIFsgMTAyLCAxMTEsIDExMSwgOTgsIDk3LCAxMTQgXVxuICogYGBgXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmltcG9ydCAqIGFzIGJhc2U2NCBmcm9tIFwiLi9iYXNlNjQudHNcIjtcblxuLypcbiAqIFNvbWUgdmFyaWFudHMgYWxsb3cgb3IgcmVxdWlyZSBvbWl0dGluZyB0aGUgcGFkZGluZyAnPScgc2lnbnM6XG4gKiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjQjVGhlX1VSTF9hcHBsaWNhdGlvbnNcbiAqIEBwYXJhbSBiYXNlNjR1cmxcbiAqL1xuZnVuY3Rpb24gYWRkUGFkZGluZ1RvQmFzZTY0dXJsKGJhc2U2NHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKGJhc2U2NHVybC5sZW5ndGggJSA0ID09PSAyKSByZXR1cm4gYmFzZTY0dXJsICsgXCI9PVwiO1xuICBpZiAoYmFzZTY0dXJsLmxlbmd0aCAlIDQgPT09IDMpIHJldHVybiBiYXNlNjR1cmwgKyBcIj1cIjtcbiAgaWYgKGJhc2U2NHVybC5sZW5ndGggJSA0ID09PSAxKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIklsbGVnYWwgYmFzZTY0dXJsIHN0cmluZyFcIik7XG4gIH1cbiAgcmV0dXJuIGJhc2U2NHVybDtcbn1cblxuZnVuY3Rpb24gY29udmVydEJhc2U2NHVybFRvQmFzZTY0KGI2NHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCEvXlstX0EtWjAtOV0qPz17MCwyfSQvaS50ZXN0KGI2NHVybCkpIHtcbiAgICAvLyBDb250YWlucyBjaGFyYWN0ZXJzIG5vdCBwYXJ0IG9mIGJhc2U2NHVybCBzcGVjLlxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGYWlsZWQgdG8gZGVjb2RlIGJhc2U2NHVybDogaW52YWxpZCBjaGFyYWN0ZXJcIik7XG4gIH1cbiAgcmV0dXJuIGFkZFBhZGRpbmdUb0Jhc2U2NHVybChiNjR1cmwpLnJlcGxhY2UoL1xcLS9nLCBcIitcIikucmVwbGFjZSgvXy9nLCBcIi9cIik7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCYXNlNjRUb0Jhc2U2NHVybChiNjQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBiNjQucmVwbGFjZSgvPS9nLCBcIlwiKS5yZXBsYWNlKC9cXCsvZywgXCItXCIpLnJlcGxhY2UoL1xcLy9nLCBcIl9cIik7XG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgKHdpbGwgYmUgcmVtb3ZlZCBpbiAwLjIxMC4wKSBVc2UgYSBgZW5jb2RlQmFzZTY0VXJsYCBpbnN0ZWFkLlxuICpcbiAqIEVuY29kZXMgYSBnaXZlbiBBcnJheUJ1ZmZlciBvciBzdHJpbmcgaW50byBhIGJhc2U2NHVybCByZXByZXNlbnRhdGlvblxuICogQHBhcmFtIGRhdGFcbiAqL1xuZXhwb3J0IGNvbnN0IGVuY29kZSA9IGVuY29kZUJhc2U2NFVybDtcblxuLyoqXG4gKiBAZGVwcmVjYXRlZCAod2lsbCBiZSByZW1vdmVkIGluIDAuMjEwLjApIFVzZSBhIGBkZWNvZGVCYXNlNjRVcmxgIGluc3RlYWQuXG4gKlxuICogQ29udmVydHMgZ2l2ZW4gYmFzZTY0dXJsIGVuY29kZWQgZGF0YSBiYWNrIHRvIG9yaWdpbmFsXG4gKiBAcGFyYW0gYjY0dXJsXG4gKi9cbmV4cG9ydCBjb25zdCBkZWNvZGUgPSBkZWNvZGVCYXNlNjRVcmw7XG5cbi8qKlxuICogRW5jb2RlcyBhIGdpdmVuIEFycmF5QnVmZmVyIG9yIHN0cmluZyBpbnRvIGEgYmFzZTY0dXJsIHJlcHJlc2VudGF0aW9uXG4gKiBAcGFyYW0gZGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlQmFzZTY0VXJsKFxuICBkYXRhOiBBcnJheUJ1ZmZlciB8IFVpbnQ4QXJyYXkgfCBzdHJpbmcsXG4pOiBzdHJpbmcge1xuICByZXR1cm4gY29udmVydEJhc2U2NFRvQmFzZTY0dXJsKGJhc2U2NC5lbmNvZGVCYXNlNjQoZGF0YSkpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGdpdmVuIGJhc2U2NHVybCBlbmNvZGVkIGRhdGEgYmFjayB0byBvcmlnaW5hbFxuICogQHBhcmFtIGI2NHVybFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlQmFzZTY0VXJsKGI2NHVybDogc3RyaW5nKTogVWludDhBcnJheSB7XG4gIHJldHVybiBiYXNlNjQuZGVjb2RlQmFzZTY0KGNvbnZlcnRCYXNlNjR1cmxUb0Jhc2U2NChiNjR1cmwpKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXVCQyxHQUVELFlBQVksWUFBWSxjQUFjO0FBRXRDOzs7O0NBSUMsR0FDRCxTQUFTLHNCQUFzQixTQUFpQjtFQUM5QyxJQUFJLFVBQVUsTUFBTSxHQUFHLE1BQU0sR0FBRyxPQUFPLFlBQVk7RUFDbkQsSUFBSSxVQUFVLE1BQU0sR0FBRyxNQUFNLEdBQUcsT0FBTyxZQUFZO0VBQ25ELElBQUksVUFBVSxNQUFNLEdBQUcsTUFBTSxHQUFHO0lBQzlCLE1BQU0sSUFBSSxVQUFVO0VBQ3RCO0VBQ0EsT0FBTztBQUNUO0FBRUEsU0FBUyx5QkFBeUIsTUFBYztFQUM5QyxJQUFJLENBQUMsd0JBQXdCLElBQUksQ0FBQyxTQUFTO0lBQ3pDLGtEQUFrRDtJQUNsRCxNQUFNLElBQUksVUFBVTtFQUN0QjtFQUNBLE9BQU8sc0JBQXNCLFFBQVEsT0FBTyxDQUFDLE9BQU8sS0FBSyxPQUFPLENBQUMsTUFBTTtBQUN6RTtBQUVBLFNBQVMseUJBQXlCLEdBQVc7RUFDM0MsT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLE9BQU8sS0FBSyxPQUFPLENBQUMsT0FBTztBQUNsRTtBQUVBOzs7OztDQUtDLEdBQ0QsT0FBTyxNQUFNLFNBQVMsZ0JBQWdCO0FBRXRDOzs7OztDQUtDLEdBQ0QsT0FBTyxNQUFNLFNBQVMsZ0JBQWdCO0FBRXRDOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxnQkFDZCxJQUF1QztFQUV2QyxPQUFPLHlCQUF5QixPQUFPLFlBQVksQ0FBQztBQUN0RDtBQUVBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxnQkFBZ0IsTUFBYztFQUM1QyxPQUFPLE9BQU8sWUFBWSxDQUFDLHlCQUF5QjtBQUN0RCJ9
// denoCacheMetadata=3487394656582092770,4403665536293099799