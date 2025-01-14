// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/**
 * @deprecated (will be removed after 1.0.0) Import from `std/assert/mod.ts` instead.
 *
 * A library of assertion functions.
 * If the assertion is false an `AssertionError` will be thrown which will
 * result in pretty-printed diff of failing assertion.
 *
 * This module is browser compatible, but do not rely on good formatting of
 * values for AssertionError messages in browsers.
 *
 * @module
 */ export { /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/assert.ts` instead.
   *
   * Make an assertion, error will be thrown if `expr` does not have truthy value.
   */ assert, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/assert_almost_equals.ts` instead.
   *
   * Make an assertion that `actual` and `expected` are almost equal numbers through
   * a given tolerance. It can be used to take into account IEEE-754 double-precision
   * floating-point representation limitations.
   * If the values are not almost equal then throw.
   *
   * @example
   * ```ts
   * import { assertAlmostEquals, assertThrows } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
   *
   * assertAlmostEquals(0.1, 0.2);
   *
   * // Using a custom tolerance value
   * assertAlmostEquals(0.1 + 0.2, 0.3, 1e-16);
   * assertThrows(() => assertAlmostEquals(0.1 + 0.2, 0.3, 1e-17));
   * ```
   */ assertAlmostEquals, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/assert_array_includes.ts` instead.
   *
   * Make an assertion that `actual` includes the `expected` values.
   * If not then an error will be thrown.
   *
   * Type parameter can be specified to ensure values under comparison have the same type.
   *
   * @example
   * ```ts
   * import { assertArrayIncludes } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
   *
   * assertArrayIncludes<number>([1, 2], [2])
   * ```
   */ assertArrayIncludes, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/assert_equals.ts` instead.
   *
   * Make an assertion that `actual` and `expected` are equal, deeply. If not
   * deeply equal, then throw.
   *
   * Type parameter can be specified to ensure values under comparison have the same type.
   *
   * @example
   * ```ts
   * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
   *
   * Deno.test("example", function (): void {
   *   assertEquals("world", "world");
   *   assertEquals({ hello: "world" }, { hello: "world" });
   * });
   * ```
   */ assertEquals, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/assert_exists.ts` instead.
   *
   * Make an assertion that actual is not null or undefined.
   * If not then throw.
   */ assertExists, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/assert_false.ts` instead.
   *
   * Make an assertion, error will be thrown if `expr` have truthy value.
   */ assertFalse, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/assert_instance_of.ts` instead.
   *
   * Make an assertion that `obj` is an instance of `type`.
   * If not then throw.
   */ assertInstanceOf, /** @deprecated (will be removed after 1.0.0) Import from `std/assert/assertion_error.ts` instead. */ AssertionError, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/assert_is_error.ts` instead.
   *
   * Make an assertion that `error` is an `Error`.
   * If not then an error will be thrown.
   * An error class and a string that should be included in the
   * error message can also be asserted.
   */ assertIsError, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/assert_match.ts` instead.
   *
   * Make an assertion that `actual` match RegExp `expected`. If not
   * then throw.
   */ assertMatch, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/assert_not_equals.ts` instead.
   *
   * Make an assertion that `actual` and `expected` are not equal, deeply.
   * If not then throw.
   *
   * Type parameter can be specified to ensure values under comparison have the same type.
   *
   * @example
   * ```ts
   * import { assertNotEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
   *
   * assertNotEquals<number>(1, 2)
   * ```
   */ assertNotEquals, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/assert_not_instance_of.ts` instead.
   *
   * Make an assertion that `obj` is not an instance of `type`.
   * If so, then throw.
   */ assertNotInstanceOf, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/assert_not_match.ts` instead.
   *
   * Make an assertion that `actual` object is a subset of `expected` object, deeply.
   * If not, then throw.
   */ assertNotMatch, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/assert_not_strict_equals.ts` instead.
   *
   * Make an assertion that `actual` and `expected` are not strictly equal.
   * If the values are strictly equal then throw.
   *
   * ```ts
   * import { assertNotStrictEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
   *
   * assertNotStrictEquals(1, 1)
   * ```
   */ assertNotStrictEquals, /**
   * Make an assertion that `actual` object is a subset of `expected` object, deeply.
   * If not, then throw.
   */ assertObjectMatch, /**
   * Executes a function which returns a promise, expecting it to reject.
   * If it does not, then it throws. An error class and a string that should be
   * included in the error message can also be asserted.
   *
   * @example
   * ```ts
   * import { assertRejects } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
   *
   * Deno.test("doesThrow", async function () {
   *   await assertRejects(async () => {
   *     throw new TypeError("hello world!");
   *   }, TypeError);
   *   await assertRejects(
   *     async () => {
   *       throw new TypeError("hello world!");
   *     },
   *     TypeError,
   *     "hello",
   *   );
   * });
   *
   * // This test will not pass.
   * Deno.test("fails", async function () {
   *   await assertRejects(
   *     async () => {
   *       console.log("Hello world");
   *     },
   *   );
   * });
   * ```
   *
   *  * @example
   * ```ts
   * import { assertRejects } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
   *
   * Deno.test("doesThrow", async function () {
   *   await assertRejects(
   *     async () => {
   *       throw new TypeError("hello world!");
   *     },
   *   );
   *   await assertRejects(
   *     async () => {
   *       return Promise.reject(new Error());
   *     },
   *   );
   * });
   *
   * // This test will not pass.
   * Deno.test("fails", async function () {
   *   await assertRejects(
   *     async () => {
   *       console.log("Hello world");
   *     },
   *   );
   * });
   * ```
   */ assertRejects, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/assert_strict_equals.ts` instead.
   *
   * Make an assertion that `actual` and `expected` are strictly equal. If
   * not then throw.
   *
   * @example
   * ```ts
   * import { assertStrictEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
   *
   * Deno.test("isStrictlyEqual", function (): void {
   *   const a = {};
   *   const b = a;
   *   assertStrictEquals(a, b);
   * });
   *
   * // This test fails
   * Deno.test("isNotStrictlyEqual", function (): void {
   *   const a = {};
   *   const b = {};
   *   assertStrictEquals(a, b);
   * });
   * ```
   */ assertStrictEquals, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/assert_string_includes.ts` instead.
   *
   * Make an assertion that actual includes expected. If not
   * then throw.
   */ assertStringIncludes, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/assert_throws.ts` instead.
   *
   * Executes a function, expecting it to throw. If it does not, then it
   * throws. An error class and a string that should be included in the
   * error message can also be asserted.
   *
   * @example
   * ```ts
   * import { assertThrows } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
   *
   * Deno.test("doesThrow", function (): void {
   *   assertThrows((): void => {
   *     throw new TypeError("hello world!");
   *   }, TypeError);
   *   assertThrows(
   *     (): void => {
   *       throw new TypeError("hello world!");
   *     },
   *     TypeError,
   *     "hello",
   *   );
   * });
   *
   * // This test will not pass.
   * Deno.test("fails", function (): void {
   *   assertThrows((): void => {
   *     console.log("Hello world");
   *   });
   * });
   * ```
   *
   * @example
   * ```ts
   * import { assertThrows } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
   *
   * Deno.test("doesThrow", function (): void {
   *   assertThrows((): void => {
   *     throw new TypeError("hello world!");
   *   });
   * });
   *
   * // This test will not pass.
   * Deno.test("fails", function (): void {
   *   assertThrows((): void => {
   *     console.log("Hello world");
   *   });
   * });
   * ```
   */ assertThrows, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/equal.ts` instead.
   *
   * Deep equality comparison used in assertions
   * @param c actual value
   * @param d expected value
   */ equal, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/fail.ts` instead.
   *
   * Forcefully throws a failed assertion
   */ fail, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/unimplemented.ts` instead.
   *
   * Use this to stub out methods that will throw when invoked.
   */ unimplemented, /**
   * @deprecated (will be removed after 1.0.0) Import from `std/assert/unreachable.ts` instead.
   *
   * Use this to assert unreachable code.
   */ unreachable } from "../assert/mod.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL3Rlc3RpbmcvYXNzZXJ0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG4vKipcbiAqIEBkZXByZWNhdGVkICh3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgMS4wLjApIEltcG9ydCBmcm9tIGBzdGQvYXNzZXJ0L21vZC50c2AgaW5zdGVhZC5cbiAqXG4gKiBBIGxpYnJhcnkgb2YgYXNzZXJ0aW9uIGZ1bmN0aW9ucy5cbiAqIElmIHRoZSBhc3NlcnRpb24gaXMgZmFsc2UgYW4gYEFzc2VydGlvbkVycm9yYCB3aWxsIGJlIHRocm93biB3aGljaCB3aWxsXG4gKiByZXN1bHQgaW4gcHJldHR5LXByaW50ZWQgZGlmZiBvZiBmYWlsaW5nIGFzc2VydGlvbi5cbiAqXG4gKiBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUsIGJ1dCBkbyBub3QgcmVseSBvbiBnb29kIGZvcm1hdHRpbmcgb2ZcbiAqIHZhbHVlcyBmb3IgQXNzZXJ0aW9uRXJyb3IgbWVzc2FnZXMgaW4gYnJvd3NlcnMuXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmV4cG9ydCB7XG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCAod2lsbCBiZSByZW1vdmVkIGFmdGVyIDEuMC4wKSBJbXBvcnQgZnJvbSBgc3RkL2Fzc2VydC9hc3NlcnQudHNgIGluc3RlYWQuXG4gICAqXG4gICAqIE1ha2UgYW4gYXNzZXJ0aW9uLCBlcnJvciB3aWxsIGJlIHRocm93biBpZiBgZXhwcmAgZG9lcyBub3QgaGF2ZSB0cnV0aHkgdmFsdWUuXG4gICAqL1xuICBhc3NlcnQsXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCAod2lsbCBiZSByZW1vdmVkIGFmdGVyIDEuMC4wKSBJbXBvcnQgZnJvbSBgc3RkL2Fzc2VydC9hc3NlcnRfYWxtb3N0X2VxdWFscy50c2AgaW5zdGVhZC5cbiAgICpcbiAgICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgYWxtb3N0IGVxdWFsIG51bWJlcnMgdGhyb3VnaFxuICAgKiBhIGdpdmVuIHRvbGVyYW5jZS4gSXQgY2FuIGJlIHVzZWQgdG8gdGFrZSBpbnRvIGFjY291bnQgSUVFRS03NTQgZG91YmxlLXByZWNpc2lvblxuICAgKiBmbG9hdGluZy1wb2ludCByZXByZXNlbnRhdGlvbiBsaW1pdGF0aW9ucy5cbiAgICogSWYgdGhlIHZhbHVlcyBhcmUgbm90IGFsbW9zdCBlcXVhbCB0aGVuIHRocm93LlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQgeyBhc3NlcnRBbG1vc3RFcXVhbHMsIGFzc2VydFRocm93cyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICAgKlxuICAgKiBhc3NlcnRBbG1vc3RFcXVhbHMoMC4xLCAwLjIpO1xuICAgKlxuICAgKiAvLyBVc2luZyBhIGN1c3RvbSB0b2xlcmFuY2UgdmFsdWVcbiAgICogYXNzZXJ0QWxtb3N0RXF1YWxzKDAuMSArIDAuMiwgMC4zLCAxZS0xNik7XG4gICAqIGFzc2VydFRocm93cygoKSA9PiBhc3NlcnRBbG1vc3RFcXVhbHMoMC4xICsgMC4yLCAwLjMsIDFlLTE3KSk7XG4gICAqIGBgYFxuICAgKi9cbiAgYXNzZXJ0QWxtb3N0RXF1YWxzLFxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgKHdpbGwgYmUgcmVtb3ZlZCBhZnRlciAxLjAuMCkgSW1wb3J0IGZyb20gYHN0ZC9hc3NlcnQvYXNzZXJ0X2FycmF5X2luY2x1ZGVzLnRzYCBpbnN0ZWFkLlxuICAgKlxuICAgKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGluY2x1ZGVzIHRoZSBgZXhwZWN0ZWRgIHZhbHVlcy5cbiAgICogSWYgbm90IHRoZW4gYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24uXG4gICAqXG4gICAqIFR5cGUgcGFyYW1ldGVyIGNhbiBiZSBzcGVjaWZpZWQgdG8gZW5zdXJlIHZhbHVlcyB1bmRlciBjb21wYXJpc29uIGhhdmUgdGhlIHNhbWUgdHlwZS5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgYXNzZXJ0QXJyYXlJbmNsdWRlcyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICAgKlxuICAgKiBhc3NlcnRBcnJheUluY2x1ZGVzPG51bWJlcj4oWzEsIDJdLCBbMl0pXG4gICAqIGBgYFxuICAgKi9cbiAgYXNzZXJ0QXJyYXlJbmNsdWRlcyxcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkICh3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgMS4wLjApIEltcG9ydCBmcm9tIGBzdGQvYXNzZXJ0L2Fzc2VydF9lcXVhbHMudHNgIGluc3RlYWQuXG4gICAqXG4gICAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAgYXJlIGVxdWFsLCBkZWVwbHkuIElmIG5vdFxuICAgKiBkZWVwbHkgZXF1YWwsIHRoZW4gdGhyb3cuXG4gICAqXG4gICAqIFR5cGUgcGFyYW1ldGVyIGNhbiBiZSBzcGVjaWZpZWQgdG8gZW5zdXJlIHZhbHVlcyB1bmRlciBjb21wYXJpc29uIGhhdmUgdGhlIHNhbWUgdHlwZS5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gICAqXG4gICAqIERlbm8udGVzdChcImV4YW1wbGVcIiwgZnVuY3Rpb24gKCk6IHZvaWQge1xuICAgKiAgIGFzc2VydEVxdWFscyhcIndvcmxkXCIsIFwid29ybGRcIik7XG4gICAqICAgYXNzZXJ0RXF1YWxzKHsgaGVsbG86IFwid29ybGRcIiB9LCB7IGhlbGxvOiBcIndvcmxkXCIgfSk7XG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICovXG4gIGFzc2VydEVxdWFscyxcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkICh3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgMS4wLjApIEltcG9ydCBmcm9tIGBzdGQvYXNzZXJ0L2Fzc2VydF9leGlzdHMudHNgIGluc3RlYWQuXG4gICAqXG4gICAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYWN0dWFsIGlzIG5vdCBudWxsIG9yIHVuZGVmaW5lZC5cbiAgICogSWYgbm90IHRoZW4gdGhyb3cuXG4gICAqL1xuICBhc3NlcnRFeGlzdHMsXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCAod2lsbCBiZSByZW1vdmVkIGFmdGVyIDEuMC4wKSBJbXBvcnQgZnJvbSBgc3RkL2Fzc2VydC9hc3NlcnRfZmFsc2UudHNgIGluc3RlYWQuXG4gICAqXG4gICAqIE1ha2UgYW4gYXNzZXJ0aW9uLCBlcnJvciB3aWxsIGJlIHRocm93biBpZiBgZXhwcmAgaGF2ZSB0cnV0aHkgdmFsdWUuXG4gICAqL1xuICBhc3NlcnRGYWxzZSxcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkICh3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgMS4wLjApIEltcG9ydCBmcm9tIGBzdGQvYXNzZXJ0L2Fzc2VydF9pbnN0YW5jZV9vZi50c2AgaW5zdGVhZC5cbiAgICpcbiAgICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgb2JqYCBpcyBhbiBpbnN0YW5jZSBvZiBgdHlwZWAuXG4gICAqIElmIG5vdCB0aGVuIHRocm93LlxuICAgKi9cbiAgYXNzZXJ0SW5zdGFuY2VPZixcbiAgLyoqIEBkZXByZWNhdGVkICh3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgMS4wLjApIEltcG9ydCBmcm9tIGBzdGQvYXNzZXJ0L2Fzc2VydGlvbl9lcnJvci50c2AgaW5zdGVhZC4gKi9cbiAgQXNzZXJ0aW9uRXJyb3IsXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCAod2lsbCBiZSByZW1vdmVkIGFmdGVyIDEuMC4wKSBJbXBvcnQgZnJvbSBgc3RkL2Fzc2VydC9hc3NlcnRfaXNfZXJyb3IudHNgIGluc3RlYWQuXG4gICAqXG4gICAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGVycm9yYCBpcyBhbiBgRXJyb3JgLlxuICAgKiBJZiBub3QgdGhlbiBhbiBlcnJvciB3aWxsIGJlIHRocm93bi5cbiAgICogQW4gZXJyb3IgY2xhc3MgYW5kIGEgc3RyaW5nIHRoYXQgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZVxuICAgKiBlcnJvciBtZXNzYWdlIGNhbiBhbHNvIGJlIGFzc2VydGVkLlxuICAgKi9cbiAgYXNzZXJ0SXNFcnJvcixcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkICh3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgMS4wLjApIEltcG9ydCBmcm9tIGBzdGQvYXNzZXJ0L2Fzc2VydF9tYXRjaC50c2AgaW5zdGVhZC5cbiAgICpcbiAgICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBtYXRjaCBSZWdFeHAgYGV4cGVjdGVkYC4gSWYgbm90XG4gICAqIHRoZW4gdGhyb3cuXG4gICAqL1xuICBhc3NlcnRNYXRjaCxcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkICh3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgMS4wLjApIEltcG9ydCBmcm9tIGBzdGQvYXNzZXJ0L2Fzc2VydF9ub3RfZXF1YWxzLnRzYCBpbnN0ZWFkLlxuICAgKlxuICAgKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGFuZCBgZXhwZWN0ZWRgIGFyZSBub3QgZXF1YWwsIGRlZXBseS5cbiAgICogSWYgbm90IHRoZW4gdGhyb3cuXG4gICAqXG4gICAqIFR5cGUgcGFyYW1ldGVyIGNhbiBiZSBzcGVjaWZpZWQgdG8gZW5zdXJlIHZhbHVlcyB1bmRlciBjb21wYXJpc29uIGhhdmUgdGhlIHNhbWUgdHlwZS5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgYXNzZXJ0Tm90RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gICAqXG4gICAqIGFzc2VydE5vdEVxdWFsczxudW1iZXI+KDEsIDIpXG4gICAqIGBgYFxuICAgKi9cbiAgYXNzZXJ0Tm90RXF1YWxzLFxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgKHdpbGwgYmUgcmVtb3ZlZCBhZnRlciAxLjAuMCkgSW1wb3J0IGZyb20gYHN0ZC9hc3NlcnQvYXNzZXJ0X25vdF9pbnN0YW5jZV9vZi50c2AgaW5zdGVhZC5cbiAgICpcbiAgICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgb2JqYCBpcyBub3QgYW4gaW5zdGFuY2Ugb2YgYHR5cGVgLlxuICAgKiBJZiBzbywgdGhlbiB0aHJvdy5cbiAgICovXG4gIGFzc2VydE5vdEluc3RhbmNlT2YsXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCAod2lsbCBiZSByZW1vdmVkIGFmdGVyIDEuMC4wKSBJbXBvcnQgZnJvbSBgc3RkL2Fzc2VydC9hc3NlcnRfbm90X21hdGNoLnRzYCBpbnN0ZWFkLlxuICAgKlxuICAgKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIG9iamVjdCBpcyBhIHN1YnNldCBvZiBgZXhwZWN0ZWRgIG9iamVjdCwgZGVlcGx5LlxuICAgKiBJZiBub3QsIHRoZW4gdGhyb3cuXG4gICAqL1xuICBhc3NlcnROb3RNYXRjaCxcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkICh3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgMS4wLjApIEltcG9ydCBmcm9tIGBzdGQvYXNzZXJ0L2Fzc2VydF9ub3Rfc3RyaWN0X2VxdWFscy50c2AgaW5zdGVhZC5cbiAgICpcbiAgICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgbm90IHN0cmljdGx5IGVxdWFsLlxuICAgKiBJZiB0aGUgdmFsdWVzIGFyZSBzdHJpY3RseSBlcXVhbCB0aGVuIHRocm93LlxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQgeyBhc3NlcnROb3RTdHJpY3RFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAgICpcbiAgICogYXNzZXJ0Tm90U3RyaWN0RXF1YWxzKDEsIDEpXG4gICAqIGBgYFxuICAgKi9cbiAgYXNzZXJ0Tm90U3RyaWN0RXF1YWxzLFxuICAvKipcbiAgICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBvYmplY3QgaXMgYSBzdWJzZXQgb2YgYGV4cGVjdGVkYCBvYmplY3QsIGRlZXBseS5cbiAgICogSWYgbm90LCB0aGVuIHRocm93LlxuICAgKi9cbiAgYXNzZXJ0T2JqZWN0TWF0Y2gsXG4gIC8qKlxuICAgKiBFeGVjdXRlcyBhIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYSBwcm9taXNlLCBleHBlY3RpbmcgaXQgdG8gcmVqZWN0LlxuICAgKiBJZiBpdCBkb2VzIG5vdCwgdGhlbiBpdCB0aHJvd3MuIEFuIGVycm9yIGNsYXNzIGFuZCBhIHN0cmluZyB0aGF0IHNob3VsZCBiZVxuICAgKiBpbmNsdWRlZCBpbiB0aGUgZXJyb3IgbWVzc2FnZSBjYW4gYWxzbyBiZSBhc3NlcnRlZC5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgYXNzZXJ0UmVqZWN0cyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICAgKlxuICAgKiBEZW5vLnRlc3QoXCJkb2VzVGhyb3dcIiwgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgKiAgIGF3YWl0IGFzc2VydFJlamVjdHMoYXN5bmMgKCkgPT4ge1xuICAgKiAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImhlbGxvIHdvcmxkIVwiKTtcbiAgICogICB9LCBUeXBlRXJyb3IpO1xuICAgKiAgIGF3YWl0IGFzc2VydFJlamVjdHMoXG4gICAqICAgICBhc3luYyAoKSA9PiB7XG4gICAqICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJoZWxsbyB3b3JsZCFcIik7XG4gICAqICAgICB9LFxuICAgKiAgICAgVHlwZUVycm9yLFxuICAgKiAgICAgXCJoZWxsb1wiLFxuICAgKiAgICk7XG4gICAqIH0pO1xuICAgKlxuICAgKiAvLyBUaGlzIHRlc3Qgd2lsbCBub3QgcGFzcy5cbiAgICogRGVuby50ZXN0KFwiZmFpbHNcIiwgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgKiAgIGF3YWl0IGFzc2VydFJlamVjdHMoXG4gICAqICAgICBhc3luYyAoKSA9PiB7XG4gICAqICAgICAgIGNvbnNvbGUubG9nKFwiSGVsbG8gd29ybGRcIik7XG4gICAqICAgICB9LFxuICAgKiAgICk7XG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogICogQGV4YW1wbGVcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgYXNzZXJ0UmVqZWN0cyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICAgKlxuICAgKiBEZW5vLnRlc3QoXCJkb2VzVGhyb3dcIiwgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgKiAgIGF3YWl0IGFzc2VydFJlamVjdHMoXG4gICAqICAgICBhc3luYyAoKSA9PiB7XG4gICAqICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJoZWxsbyB3b3JsZCFcIik7XG4gICAqICAgICB9LFxuICAgKiAgICk7XG4gICAqICAgYXdhaXQgYXNzZXJ0UmVqZWN0cyhcbiAgICogICAgIGFzeW5jICgpID0+IHtcbiAgICogICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcigpKTtcbiAgICogICAgIH0sXG4gICAqICAgKTtcbiAgICogfSk7XG4gICAqXG4gICAqIC8vIFRoaXMgdGVzdCB3aWxsIG5vdCBwYXNzLlxuICAgKiBEZW5vLnRlc3QoXCJmYWlsc1wiLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAqICAgYXdhaXQgYXNzZXJ0UmVqZWN0cyhcbiAgICogICAgIGFzeW5jICgpID0+IHtcbiAgICogICAgICAgY29uc29sZS5sb2coXCJIZWxsbyB3b3JsZFwiKTtcbiAgICogICAgIH0sXG4gICAqICAgKTtcbiAgICogfSk7XG4gICAqIGBgYFxuICAgKi9cbiAgYXNzZXJ0UmVqZWN0cyxcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkICh3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgMS4wLjApIEltcG9ydCBmcm9tIGBzdGQvYXNzZXJ0L2Fzc2VydF9zdHJpY3RfZXF1YWxzLnRzYCBpbnN0ZWFkLlxuICAgKlxuICAgKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGFuZCBgZXhwZWN0ZWRgIGFyZSBzdHJpY3RseSBlcXVhbC4gSWZcbiAgICogbm90IHRoZW4gdGhyb3cuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHRzXG4gICAqIGltcG9ydCB7IGFzc2VydFN0cmljdEVxdWFscyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICAgKlxuICAgKiBEZW5vLnRlc3QoXCJpc1N0cmljdGx5RXF1YWxcIiwgZnVuY3Rpb24gKCk6IHZvaWQge1xuICAgKiAgIGNvbnN0IGEgPSB7fTtcbiAgICogICBjb25zdCBiID0gYTtcbiAgICogICBhc3NlcnRTdHJpY3RFcXVhbHMoYSwgYik7XG4gICAqIH0pO1xuICAgKlxuICAgKiAvLyBUaGlzIHRlc3QgZmFpbHNcbiAgICogRGVuby50ZXN0KFwiaXNOb3RTdHJpY3RseUVxdWFsXCIsIGZ1bmN0aW9uICgpOiB2b2lkIHtcbiAgICogICBjb25zdCBhID0ge307XG4gICAqICAgY29uc3QgYiA9IHt9O1xuICAgKiAgIGFzc2VydFN0cmljdEVxdWFscyhhLCBiKTtcbiAgICogfSk7XG4gICAqIGBgYFxuICAgKi9cbiAgYXNzZXJ0U3RyaWN0RXF1YWxzLFxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgKHdpbGwgYmUgcmVtb3ZlZCBhZnRlciAxLjAuMCkgSW1wb3J0IGZyb20gYHN0ZC9hc3NlcnQvYXNzZXJ0X3N0cmluZ19pbmNsdWRlcy50c2AgaW5zdGVhZC5cbiAgICpcbiAgICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBhY3R1YWwgaW5jbHVkZXMgZXhwZWN0ZWQuIElmIG5vdFxuICAgKiB0aGVuIHRocm93LlxuICAgKi9cbiAgYXNzZXJ0U3RyaW5nSW5jbHVkZXMsXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCAod2lsbCBiZSByZW1vdmVkIGFmdGVyIDEuMC4wKSBJbXBvcnQgZnJvbSBgc3RkL2Fzc2VydC9hc3NlcnRfdGhyb3dzLnRzYCBpbnN0ZWFkLlxuICAgKlxuICAgKiBFeGVjdXRlcyBhIGZ1bmN0aW9uLCBleHBlY3RpbmcgaXQgdG8gdGhyb3cuIElmIGl0IGRvZXMgbm90LCB0aGVuIGl0XG4gICAqIHRocm93cy4gQW4gZXJyb3IgY2xhc3MgYW5kIGEgc3RyaW5nIHRoYXQgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZVxuICAgKiBlcnJvciBtZXNzYWdlIGNhbiBhbHNvIGJlIGFzc2VydGVkLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQgeyBhc3NlcnRUaHJvd3MgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAgICpcbiAgICogRGVuby50ZXN0KFwiZG9lc1Rocm93XCIsIGZ1bmN0aW9uICgpOiB2b2lkIHtcbiAgICogICBhc3NlcnRUaHJvd3MoKCk6IHZvaWQgPT4ge1xuICAgKiAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImhlbGxvIHdvcmxkIVwiKTtcbiAgICogICB9LCBUeXBlRXJyb3IpO1xuICAgKiAgIGFzc2VydFRocm93cyhcbiAgICogICAgICgpOiB2b2lkID0+IHtcbiAgICogICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImhlbGxvIHdvcmxkIVwiKTtcbiAgICogICAgIH0sXG4gICAqICAgICBUeXBlRXJyb3IsXG4gICAqICAgICBcImhlbGxvXCIsXG4gICAqICAgKTtcbiAgICogfSk7XG4gICAqXG4gICAqIC8vIFRoaXMgdGVzdCB3aWxsIG5vdCBwYXNzLlxuICAgKiBEZW5vLnRlc3QoXCJmYWlsc1wiLCBmdW5jdGlvbiAoKTogdm9pZCB7XG4gICAqICAgYXNzZXJ0VGhyb3dzKCgpOiB2b2lkID0+IHtcbiAgICogICAgIGNvbnNvbGUubG9nKFwiSGVsbG8gd29ybGRcIik7XG4gICAqICAgfSk7XG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgYXNzZXJ0VGhyb3dzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gICAqXG4gICAqIERlbm8udGVzdChcImRvZXNUaHJvd1wiLCBmdW5jdGlvbiAoKTogdm9pZCB7XG4gICAqICAgYXNzZXJ0VGhyb3dzKCgpOiB2b2lkID0+IHtcbiAgICogICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJoZWxsbyB3b3JsZCFcIik7XG4gICAqICAgfSk7XG4gICAqIH0pO1xuICAgKlxuICAgKiAvLyBUaGlzIHRlc3Qgd2lsbCBub3QgcGFzcy5cbiAgICogRGVuby50ZXN0KFwiZmFpbHNcIiwgZnVuY3Rpb24gKCk6IHZvaWQge1xuICAgKiAgIGFzc2VydFRocm93cygoKTogdm9pZCA9PiB7XG4gICAqICAgICBjb25zb2xlLmxvZyhcIkhlbGxvIHdvcmxkXCIpO1xuICAgKiAgIH0pO1xuICAgKiB9KTtcbiAgICogYGBgXG4gICAqL1xuICBhc3NlcnRUaHJvd3MsXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCAod2lsbCBiZSByZW1vdmVkIGFmdGVyIDEuMC4wKSBJbXBvcnQgZnJvbSBgc3RkL2Fzc2VydC9lcXVhbC50c2AgaW5zdGVhZC5cbiAgICpcbiAgICogRGVlcCBlcXVhbGl0eSBjb21wYXJpc29uIHVzZWQgaW4gYXNzZXJ0aW9uc1xuICAgKiBAcGFyYW0gYyBhY3R1YWwgdmFsdWVcbiAgICogQHBhcmFtIGQgZXhwZWN0ZWQgdmFsdWVcbiAgICovXG4gIGVxdWFsLFxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgKHdpbGwgYmUgcmVtb3ZlZCBhZnRlciAxLjAuMCkgSW1wb3J0IGZyb20gYHN0ZC9hc3NlcnQvZmFpbC50c2AgaW5zdGVhZC5cbiAgICpcbiAgICogRm9yY2VmdWxseSB0aHJvd3MgYSBmYWlsZWQgYXNzZXJ0aW9uXG4gICAqL1xuICBmYWlsLFxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgKHdpbGwgYmUgcmVtb3ZlZCBhZnRlciAxLjAuMCkgSW1wb3J0IGZyb20gYHN0ZC9hc3NlcnQvdW5pbXBsZW1lbnRlZC50c2AgaW5zdGVhZC5cbiAgICpcbiAgICogVXNlIHRoaXMgdG8gc3R1YiBvdXQgbWV0aG9kcyB0aGF0IHdpbGwgdGhyb3cgd2hlbiBpbnZva2VkLlxuICAgKi9cbiAgdW5pbXBsZW1lbnRlZCxcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkICh3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgMS4wLjApIEltcG9ydCBmcm9tIGBzdGQvYXNzZXJ0L3VucmVhY2hhYmxlLnRzYCBpbnN0ZWFkLlxuICAgKlxuICAgKiBVc2UgdGhpcyB0byBhc3NlcnQgdW5yZWFjaGFibGUgY29kZS5cbiAgICovXG4gIHVucmVhY2hhYmxlLFxufSBmcm9tIFwiLi4vYXNzZXJ0L21vZC50c1wiO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUUxRTs7Ozs7Ozs7Ozs7Q0FXQyxHQUVELFNBQ0U7Ozs7R0FJQyxHQUNELE1BQU0sRUFDTjs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBa0JDLEdBQ0Qsa0JBQWtCLEVBQ2xCOzs7Ozs7Ozs7Ozs7OztHQWNDLEdBQ0QsbUJBQW1CLEVBQ25COzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCQyxHQUNELFlBQVksRUFDWjs7Ozs7R0FLQyxHQUNELFlBQVksRUFDWjs7OztHQUlDLEdBQ0QsV0FBVyxFQUNYOzs7OztHQUtDLEdBQ0QsZ0JBQWdCLEVBQ2hCLG1HQUFtRyxHQUNuRyxjQUFjLEVBQ2Q7Ozs7Ozs7R0FPQyxHQUNELGFBQWEsRUFDYjs7Ozs7R0FLQyxHQUNELFdBQVcsRUFDWDs7Ozs7Ozs7Ozs7Ozs7R0FjQyxHQUNELGVBQWUsRUFDZjs7Ozs7R0FLQyxHQUNELG1CQUFtQixFQUNuQjs7Ozs7R0FLQyxHQUNELGNBQWMsRUFDZDs7Ozs7Ozs7Ozs7R0FXQyxHQUNELHFCQUFxQixFQUNyQjs7O0dBR0MsR0FDRCxpQkFBaUIsRUFDakI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EwREMsR0FDRCxhQUFhLEVBQ2I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBdUJDLEdBQ0Qsa0JBQWtCLEVBQ2xCOzs7OztHQUtDLEdBQ0Qsb0JBQW9CLEVBQ3BCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaURDLEdBQ0QsWUFBWSxFQUNaOzs7Ozs7R0FNQyxHQUNELEtBQUssRUFDTDs7OztHQUlDLEdBQ0QsSUFBSSxFQUNKOzs7O0dBSUMsR0FDRCxhQUFhLEVBQ2I7Ozs7R0FJQyxHQUNELFdBQVcsUUFDTixtQkFBbUIifQ==
// denoCacheMetadata=13872998593750314884,10403183655524514082