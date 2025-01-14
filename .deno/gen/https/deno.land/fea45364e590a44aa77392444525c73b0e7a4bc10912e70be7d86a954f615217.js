// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/**
 * A library of assertion functions.
 * If the assertion is false an `AssertionError` will be thrown which will
 * result in pretty-printed diff of failing assertion.
 *
 * This module is browser compatible, but do not rely on good formatting of
 * values for AssertionError messages in browsers.
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/mod.ts} instead.
 *
 * @module
 */ import * as asserts from "../assert/mod.ts";
/**
 * Make an assertion that `actual` and `expected` are almost equal numbers
 * through a given tolerance. It can be used to take into account IEEE-754
 * double-precision floating-point representation limitations. If the values
 * are not almost equal then throw.
 *
 * @example
 * ```ts
 * import { assertAlmostEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertAlmostEquals(0.01, 0.02, 0.1); // Doesn't throw
 * assertAlmostEquals(0.01, 0.02); // Throws
 * assertAlmostEquals(0.1 + 0.2, 0.3, 1e-16); // Doesn't throw
 * assertAlmostEquals(0.1 + 0.2, 0.3, 1e-17); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_almost_equals.ts} instead.
 */ export function assertAlmostEquals(actual, expected, tolerance = 1e-7, msg) {
  asserts.assertAlmostEquals(actual, expected, tolerance, msg);
}
/**
 * Make an assertion that `actual` includes the `expected` values. If not then
 * an error will be thrown.
 *
 * Type parameter can be specified to ensure values under comparison have the
 * same type.
 *
 * @example
 * ```ts
 * import { assertArrayIncludes } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertArrayIncludes([1, 2], [2]); // Doesn't throw
 * assertArrayIncludes([1, 2], [3]); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_array_includes.ts} instead.
 */ export function assertArrayIncludes(actual, expected, msg) {
  asserts.assertArrayIncludes(actual, expected, msg);
}
/**
 * Make an assertion that `actual` and `expected` are equal, deeply. If not
 * deeply equal, then throw.
 *
 * Type parameter can be specified to ensure values under comparison have the
 * same type.
 *
 * @example
 * ```ts
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertEquals("world", "world"); // Doesn't throw
 * assertEquals("hello", "world"); // Throws
 * ```
 *
 * Note: formatter option is experimental and may be removed in the future.
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_equals.ts} instead.
 */ export function assertEquals(actual, expected, msg, options = {}) {
  asserts.assertEquals(actual, expected, msg, options);
}
/**
 * Make an assertion that actual is not null or undefined.
 * If not then throw.
 *
 * @example
 * ```ts
 * import { assertExists } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertExists("something"); // Doesn't throw
 * assertExists(undefined); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_exists.ts} instead.
 */ export function assertExists(actual, msg) {
  asserts.assertExists(actual, msg);
}
/**
 * Make an assertion, error will be thrown if `expr` have truthy value.
 *
 * @example
 * ```ts
 * import { assertFalse } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertFalse(false); // Doesn't throw
 * assertFalse(true); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_false.ts} instead.
 */ export function assertFalse(expr, msg = "") {
  asserts.assertFalse(expr, msg);
}
/**
 * Make an assertion that `actual` is greater than or equal to `expected`.
 * If not then throw.
 *
 * @example
 * ```ts
 * import { assertGreaterOrEqual } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertGreaterOrEqual(2, 1); // Doesn't throw
 * assertGreaterOrEqual(1, 1); // Doesn't throw
 * assertGreaterOrEqual(0, 1); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_greater_or_equal.ts} instead.
 */ export function assertGreaterOrEqual(actual, expected, msg) {
  asserts.assertGreaterOrEqual(actual, expected, msg);
}
/**
 * Make an assertion that `actual` is greater than `expected`.
 * If not then throw.
 *
 * @example
 * ```ts
 * import { assertGreater } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertGreater(2, 1); // Doesn't throw
 * assertGreater(1, 1); // Throws
 * assertGreater(0, 1); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_greater.ts} instead.
 */ export function assertGreater(actual, expected, msg) {
  asserts.assertGreater(actual, expected, msg);
}
/**
 * Make an assertion that `obj` is an instance of `type`.
 * If not then throw.
 *
 * @example
 * ```ts
 * import { assertInstanceOf } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertInstanceOf(new Date(), Date); // Doesn't throw
 * assertInstanceOf(new Date(), Number); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_instance_of.ts} instead.
 */ export function assertInstanceOf(actual, expectedType, msg = "") {
  asserts.assertInstanceOf(actual, expectedType, msg);
}
/**
 * Make an assertion that `error` is an `Error`.
 * If not then an error will be thrown.
 * An error class and a string that should be included in the
 * error message can also be asserted.
 *
 * @example
 * ```ts
 * import { assertIsError } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertIsError(null); // Throws
 * assertIsError(new RangeError("Out of range")); // Doesn't throw
 * assertIsError(new RangeError("Out of range"), SyntaxError); // Throws
 * assertIsError(new RangeError("Out of range"), SyntaxError, "Out of range"); // Doesn't throw
 * assertIsError(new RangeError("Out of range"), SyntaxError, "Within range"); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_is_error.ts} instead.
 */ export function assertIsError(error, // deno-lint-ignore no-explicit-any
ErrorClass, msgMatches, msg) {
  asserts.assertIsError(error, ErrorClass, msgMatches, msg);
}
/**
 * Make an assertion that `actual` is less than or equal to `expected`.
 * If not then throw.
 *
 * @example
 * ```ts
 * import { assertLessOrEqual } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertLessOrEqual(1, 2); // Doesn't throw
 * assertLessOrEqual(1, 1); // Doesn't throw
 * assertLessOrEqual(1, 0); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_less_or_equal.ts} instead.
 */ export function assertLessOrEqual(actual, expected, msg) {
  asserts.assertLessOrEqual(actual, expected, msg);
}
/**
 * Make an assertion that `actual` is less than `expected`.
 * If not then throw.
 *
 * @example
 * ```ts
 * import { assertLess } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertLess(1, 2); // Doesn't throw
 * assertLess(2, 1); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_less.ts} instead.
 */ export function assertLess(actual, expected, msg) {
  asserts.assertLess(actual, expected, msg);
}
/**
 * Make an assertion that `actual` match RegExp `expected`. If not
 * then throw.
 *
 * @example
 * ```ts
 * import { assertMatch } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertMatch("Raptor", RegExp(/Raptor/)); // Doesn't throw
 * assertMatch("Denosaurus", RegExp(/Raptor/)); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_match.ts} instead.
 */ export function assertMatch(actual, expected, msg) {
  asserts.assertMatch(actual, expected, msg);
}
/**
 * Make an assertion that `actual` and `expected` are not equal, deeply.
 * If not then throw.
 *
 * Type parameter can be specified to ensure values under comparison have the same type.
 *
 * @example
 * ```ts
 * import { assertNotEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertNotEquals(1, 2); // Doesn't throw
 * assertNotEquals(1, 1); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_not_equals.ts} instead.
 */ export function assertNotEquals(actual, expected, msg) {
  asserts.assertNotEquals(actual, expected, msg);
}
/**
 * Make an assertion that `obj` is not an instance of `type`.
 * If so, then throw.
 *
 * @example
 * ```ts
 * import { assertNotInstanceOf } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertNotInstanceOf(new Date(), Number); // Doesn't throw
 * assertNotInstanceOf(new Date(), Date); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_not_instance_of.ts} instead.
 */ export function assertNotInstanceOf(actual, // deno-lint-ignore no-explicit-any
unexpectedType, msg) {
  asserts.assertNotInstanceOf(actual, unexpectedType, msg);
}
/**
 * Make an assertion that `actual` not match RegExp `expected`. If match
 * then throw.
 *
 * @example
 * ```ts
 * import { assertNotMatch } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertNotMatch("Denosaurus", RegExp(/Raptor/)); // Doesn't throw
 * assertNotMatch("Raptor", RegExp(/Raptor/)); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_not_match.ts} instead.
 */ export function assertNotMatch(actual, expected, msg) {
  asserts.assertNotMatch(actual, expected, msg);
}
/**
 * Make an assertion that `actual` and `expected` are not strictly equal.
 * If the values are strictly equal then throw.
 *
 * @example
 * ```ts
 * import { assertNotStrictEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertNotStrictEquals(1, 1); // Doesn't throw
 * assertNotStrictEquals(1, 2); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_not_strict_equals.ts} instead.
 */ export function assertNotStrictEquals(actual, expected, msg) {
  asserts.assertNotStrictEquals(actual, expected, msg);
}
/**
 * Make an assertion that `actual` object is a subset of `expected` object,
 * deeply. If not, then throw.
 *
 * @example
 * ```ts
 * import { assertObjectMatch } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertObjectMatch({ foo: "bar" }, { foo: "bar" }); // Doesn't throw
 * assertObjectMatch({ foo: "bar" }, { foo: "baz" }); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_object_match.ts} instead.
 */ export function assertObjectMatch(// deno-lint-ignore no-explicit-any
actual, expected, msg) {
  asserts.assertObjectMatch(actual, expected, msg);
}
export async function assertRejects(fn, errorClassOrMsg, msgIncludesOrMsg, msg) {
  return await asserts.assertRejects(fn, // deno-lint-ignore no-explicit-any
  errorClassOrMsg, msgIncludesOrMsg, msg);
}
/**
 * Make an assertion that `actual` and `expected` are strictly equal. If
 * not then throw.
 *
 * @example
 * ```ts
 * import { assertStrictEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const a = {};
 * const b = a;
 * assertStrictEquals(a, b); // Doesn't throw
 *
 * const c = {};
 * const d = {};
 * assertStrictEquals(c, d); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_strict_equals.ts} instead.
 */ export function assertStrictEquals(actual, expected, msg) {
  asserts.assertStrictEquals(actual, expected, msg);
}
/**
 * Make an assertion that actual includes expected. If not
 * then throw.
 *
 * @example
 * ```ts
 * import { assertStringIncludes } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertStringIncludes("Hello", "ello"); // Doesn't throw
 * assertStringIncludes("Hello", "world"); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert_string_includes.ts} instead.
 */ export function assertStringIncludes(actual, expected, msg) {
  asserts.assertStringIncludes(actual, expected, msg);
}
export function assertThrows(fn, errorClassOrMsg, msgIncludesOrMsg, msg) {
  return asserts.assertThrows(fn, // deno-lint-ignore no-explicit-any
  errorClassOrMsg, msgIncludesOrMsg, msg);
}
/**
 * Make an assertion, error will be thrown if `expr` does not have truthy value.
 *
 * @example
 * ```ts
 * import { assert } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assert("hello".includes("ello")); // Doesn't throw
 * assert("hello".includes("world")); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assert.ts} instead.
 */ export function assert(expr, msg = "") {
  asserts.assert(expr, msg);
}
/**
 * Error thrown when an assertion fails.
 *
 * @example
 * ```ts
 * import { AssertionError } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * throw new AssertionError("Assertion failed");
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/assertion_error.ts} instead.
 */ export class AssertionError extends Error {
  /** Constructs a new instance. */ constructor(message){
    super(message);
    this.name = "AssertionError";
  }
}
/**
 * Deep equality comparison used in assertions
 * @param c actual value
 * @param d expected value
 *
 * @example
 * ```ts
 * import { equal } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * equal({ foo: "bar" }, { foo: "bar" }); // Returns `true`
 * equal({ foo: "bar" }, { foo: "baz" }); // Returns `false
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/equal.ts} instead.
 */ export function equal(c, d) {
  return asserts.equal(c, d);
}
/**
 * Forcefully throws a failed assertion.
 *
 * @example
 * ```ts
 * import { fail } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * fail("Deliberately failed!"); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/fail.ts} instead.
 */ export function fail(msg) {
  asserts.fail(msg);
}
/**
 * Use this to stub out methods that will throw when invoked.
 *
 * @example
 * ```ts
 * import { unimplemented } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * unimplemented(); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/unimplemented.ts} instead.
 */ export function unimplemented(msg) {
  asserts.unimplemented(msg);
}
/**
 * Use this to assert unreachable code.
 *
 * @example
 * ```ts
 * import { unreachable } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * unreachable(); // Throws
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/assert/unreachable.ts} instead.
 */ export function unreachable() {
  asserts.unreachable();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyNC4wL3Rlc3RpbmcvYXNzZXJ0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG4vKipcbiAqIEEgbGlicmFyeSBvZiBhc3NlcnRpb24gZnVuY3Rpb25zLlxuICogSWYgdGhlIGFzc2VydGlvbiBpcyBmYWxzZSBhbiBgQXNzZXJ0aW9uRXJyb3JgIHdpbGwgYmUgdGhyb3duIHdoaWNoIHdpbGxcbiAqIHJlc3VsdCBpbiBwcmV0dHktcHJpbnRlZCBkaWZmIG9mIGZhaWxpbmcgYXNzZXJ0aW9uLlxuICpcbiAqIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZSwgYnV0IGRvIG5vdCByZWx5IG9uIGdvb2QgZm9ybWF0dGluZyBvZlxuICogdmFsdWVzIGZvciBBc3NlcnRpb25FcnJvciBtZXNzYWdlcyBpbiBicm93c2Vycy5cbiAqXG4gKiBAZGVwcmVjYXRlZCBUaGlzIHdpbGwgYmUgcmVtb3ZlZCBpbiAxLjAuMC4gSW1wb3J0IGZyb20ge0BsaW5rIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9hc3NlcnQvbW9kLnRzfSBpbnN0ZWFkLlxuICpcbiAqIEBtb2R1bGVcbiAqL1xuaW1wb3J0ICogYXMgYXNzZXJ0cyBmcm9tIFwiLi4vYXNzZXJ0L21vZC50c1wiO1xuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAgYXJlIGFsbW9zdCBlcXVhbCBudW1iZXJzXG4gKiB0aHJvdWdoIGEgZ2l2ZW4gdG9sZXJhbmNlLiBJdCBjYW4gYmUgdXNlZCB0byB0YWtlIGludG8gYWNjb3VudCBJRUVFLTc1NFxuICogZG91YmxlLXByZWNpc2lvbiBmbG9hdGluZy1wb2ludCByZXByZXNlbnRhdGlvbiBsaW1pdGF0aW9ucy4gSWYgdGhlIHZhbHVlc1xuICogYXJlIG5vdCBhbG1vc3QgZXF1YWwgdGhlbiB0aHJvdy5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGFzc2VydEFsbW9zdEVxdWFscyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIGFzc2VydEFsbW9zdEVxdWFscygwLjAxLCAwLjAyLCAwLjEpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnRBbG1vc3RFcXVhbHMoMC4wMSwgMC4wMik7IC8vIFRocm93c1xuICogYXNzZXJ0QWxtb3N0RXF1YWxzKDAuMSArIDAuMiwgMC4zLCAxZS0xNik7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydEFsbW9zdEVxdWFscygwLjEgKyAwLjIsIDAuMywgMWUtMTcpOyAvLyBUaHJvd3NcbiAqIGBgYFxuICpcbiAqIEBkZXByZWNhdGVkIFRoaXMgd2lsbCBiZSByZW1vdmVkIGluIDEuMC4wLiBJbXBvcnQgZnJvbSB7QGxpbmsgaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL2Fzc2VydC9hc3NlcnRfYWxtb3N0X2VxdWFscy50c30gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEFsbW9zdEVxdWFscyhcbiAgYWN0dWFsOiBudW1iZXIsXG4gIGV4cGVjdGVkOiBudW1iZXIsXG4gIHRvbGVyYW5jZSA9IDFlLTcsXG4gIG1zZz86IHN0cmluZyxcbikge1xuICBhc3NlcnRzLmFzc2VydEFsbW9zdEVxdWFscyhhY3R1YWwsIGV4cGVjdGVkLCB0b2xlcmFuY2UsIG1zZyk7XG59XG5cbi8qKlxuICogQW4gYXJyYXktbGlrZSBvYmplY3QgKGBBcnJheWAsIGBVaW50OEFycmF5YCwgYE5vZGVMaXN0YCwgZXRjLikgdGhhdCBpcyBub3QgYSBzdHJpbmcuXG4gKlxuICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIHJlbW92ZWQgaW4gMS4wLjAuIEltcG9ydCBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvYXNzZXJ0L2Fzc2VydF9hcnJheV9pbmNsdWRlcy50c30gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IHR5cGUgQXJyYXlMaWtlQXJnPFQ+ID0gQXJyYXlMaWtlPFQ+ICYgb2JqZWN0O1xuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgaW5jbHVkZXMgdGhlIGBleHBlY3RlZGAgdmFsdWVzLiBJZiBub3QgdGhlblxuICogYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24uXG4gKlxuICogVHlwZSBwYXJhbWV0ZXIgY2FuIGJlIHNwZWNpZmllZCB0byBlbnN1cmUgdmFsdWVzIHVuZGVyIGNvbXBhcmlzb24gaGF2ZSB0aGVcbiAqIHNhbWUgdHlwZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGFzc2VydEFycmF5SW5jbHVkZXMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBhc3NlcnRBcnJheUluY2x1ZGVzKFsxLCAyXSwgWzJdKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXNzZXJ0QXJyYXlJbmNsdWRlcyhbMSwgMl0sIFszXSk7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIHJlbW92ZWQgaW4gMS4wLjAuIEltcG9ydCBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvYXNzZXJ0L2Fzc2VydF9hcnJheV9pbmNsdWRlcy50c30gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEFycmF5SW5jbHVkZXM8VD4oXG4gIGFjdHVhbDogQXJyYXlMaWtlQXJnPFQ+LFxuICBleHBlY3RlZDogQXJyYXlMaWtlQXJnPFQ+LFxuICBtc2c/OiBzdHJpbmcsXG4pIHtcbiAgYXNzZXJ0cy5hc3NlcnRBcnJheUluY2x1ZGVzPFQ+KGFjdHVhbCwgZXhwZWN0ZWQsIG1zZyk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgZXF1YWwsIGRlZXBseS4gSWYgbm90XG4gKiBkZWVwbHkgZXF1YWwsIHRoZW4gdGhyb3cuXG4gKlxuICogVHlwZSBwYXJhbWV0ZXIgY2FuIGJlIHNwZWNpZmllZCB0byBlbnN1cmUgdmFsdWVzIHVuZGVyIGNvbXBhcmlzb24gaGF2ZSB0aGVcbiAqIHNhbWUgdHlwZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIGFzc2VydEVxdWFscyhcIndvcmxkXCIsIFwid29ybGRcIik7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydEVxdWFscyhcImhlbGxvXCIsIFwid29ybGRcIik7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogTm90ZTogZm9ybWF0dGVyIG9wdGlvbiBpcyBleHBlcmltZW50YWwgYW5kIG1heSBiZSByZW1vdmVkIGluIHRoZSBmdXR1cmUuXG4gKlxuICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIHJlbW92ZWQgaW4gMS4wLjAuIEltcG9ydCBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvYXNzZXJ0L2Fzc2VydF9lcXVhbHMudHN9IGluc3RlYWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRFcXVhbHM8VD4oXG4gIGFjdHVhbDogVCxcbiAgZXhwZWN0ZWQ6IFQsXG4gIG1zZz86IHN0cmluZyxcbiAgb3B0aW9uczogeyBmb3JtYXR0ZXI/OiAodmFsdWU6IHVua25vd24pID0+IHN0cmluZyB9ID0ge30sXG4pIHtcbiAgYXNzZXJ0cy5hc3NlcnRFcXVhbHM8VD4oYWN0dWFsLCBleHBlY3RlZCwgbXNnLCBvcHRpb25zKTtcbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGFjdHVhbCBpcyBub3QgbnVsbCBvciB1bmRlZmluZWQuXG4gKiBJZiBub3QgdGhlbiB0aHJvdy5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGFzc2VydEV4aXN0cyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIGFzc2VydEV4aXN0cyhcInNvbWV0aGluZ1wiKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXNzZXJ0RXhpc3RzKHVuZGVmaW5lZCk7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIHJlbW92ZWQgaW4gMS4wLjAuIEltcG9ydCBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvYXNzZXJ0L2Fzc2VydF9leGlzdHMudHN9IGluc3RlYWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRFeGlzdHM8VD4oXG4gIGFjdHVhbDogVCxcbiAgbXNnPzogc3RyaW5nLFxuKTogYXNzZXJ0cyBhY3R1YWwgaXMgTm9uTnVsbGFibGU8VD4ge1xuICBhc3NlcnRzLmFzc2VydEV4aXN0czxUPihhY3R1YWwsIG1zZyk7XG59XG5cbi8qKlxuICogQXNzZXJ0aW9uIGNvbmRpdGlvbiBmb3Ige0BsaW5rY29kZSBhc3NlcnRGYWxzZX0uXG4gKlxuICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIHJlbW92ZWQgaW4gMS4wLjAuIEltcG9ydCBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvYXNzZXJ0L2Fzc2VydF9mYWxzZS50c30gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IHR5cGUgRmFsc3kgPSBmYWxzZSB8IDAgfCAwbiB8IFwiXCIgfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uLCBlcnJvciB3aWxsIGJlIHRocm93biBpZiBgZXhwcmAgaGF2ZSB0cnV0aHkgdmFsdWUuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhc3NlcnRGYWxzZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIGFzc2VydEZhbHNlKGZhbHNlKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXNzZXJ0RmFsc2UodHJ1ZSk7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIHJlbW92ZWQgaW4gMS4wLjAuIEltcG9ydCBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvYXNzZXJ0L2Fzc2VydF9mYWxzZS50c30gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEZhbHNlKGV4cHI6IHVua25vd24sIG1zZyA9IFwiXCIpOiBhc3NlcnRzIGV4cHIgaXMgRmFsc3kge1xuICBhc3NlcnRzLmFzc2VydEZhbHNlKGV4cHIsIG1zZyk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gYGV4cGVjdGVkYC5cbiAqIElmIG5vdCB0aGVuIHRocm93LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0R3JlYXRlck9yRXF1YWwgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBhc3NlcnRHcmVhdGVyT3JFcXVhbCgyLCAxKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXNzZXJ0R3JlYXRlck9yRXF1YWwoMSwgMSk7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydEdyZWF0ZXJPckVxdWFsKDAsIDEpOyAvLyBUaHJvd3NcbiAqIGBgYFxuICpcbiAqIEBkZXByZWNhdGVkIFRoaXMgd2lsbCBiZSByZW1vdmVkIGluIDEuMC4wLiBJbXBvcnQgZnJvbSB7QGxpbmsgaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL2Fzc2VydC9hc3NlcnRfZ3JlYXRlcl9vcl9lcXVhbC50c30gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEdyZWF0ZXJPckVxdWFsPFQ+KFxuICBhY3R1YWw6IFQsXG4gIGV4cGVjdGVkOiBULFxuICBtc2c/OiBzdHJpbmcsXG4pIHtcbiAgYXNzZXJ0cy5hc3NlcnRHcmVhdGVyT3JFcXVhbDxUPihhY3R1YWwsIGV4cGVjdGVkLCBtc2cpO1xufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgaXMgZ3JlYXRlciB0aGFuIGBleHBlY3RlZGAuXG4gKiBJZiBub3QgdGhlbiB0aHJvdy5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGFzc2VydEdyZWF0ZXIgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBhc3NlcnRHcmVhdGVyKDIsIDEpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnRHcmVhdGVyKDEsIDEpOyAvLyBUaHJvd3NcbiAqIGFzc2VydEdyZWF0ZXIoMCwgMSk7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIHJlbW92ZWQgaW4gMS4wLjAuIEltcG9ydCBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvYXNzZXJ0L2Fzc2VydF9ncmVhdGVyLnRzfSBpbnN0ZWFkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0R3JlYXRlcjxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c/OiBzdHJpbmcpIHtcbiAgYXNzZXJ0cy5hc3NlcnRHcmVhdGVyPFQ+KGFjdHVhbCwgZXhwZWN0ZWQsIG1zZyk7XG59XG5cbi8qKlxuICogQW55IGNvbnN0cnVjdG9yXG4gKlxuICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIHJlbW92ZWQgaW4gMS4wLjAuIEltcG9ydCBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvYXNzZXJ0L2Fzc2VydF9pbnN0YW5jZV9vZi50c30gaW5zdGVhZC5cbiAqL1xuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmV4cG9ydCB0eXBlIEFueUNvbnN0cnVjdG9yID0gbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gYW55O1xuLyoqIEdldHMgY29uc3RydWN0b3IgdHlwZVxuICpcbiAqIEBkZXByZWNhdGVkIFRoaXMgd2lsbCBiZSByZW1vdmVkIGluIDEuMC4wLiBJbXBvcnQgZnJvbSB7QGxpbmsgaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL2Fzc2VydC9hc3NlcnRfaW5zdGFuY2Vfb2YudHN9IGluc3RlYWQuXG4gKi9cbmV4cG9ydCB0eXBlIEdldENvbnN0cnVjdG9yVHlwZTxUIGV4dGVuZHMgQW55Q29uc3RydWN0b3I+ID0gVCBleHRlbmRzIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5uZXcgKC4uLmFyZ3M6IGFueSkgPT4gaW5mZXIgQyA/IENcbiAgOiBuZXZlcjtcblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBvYmpgIGlzIGFuIGluc3RhbmNlIG9mIGB0eXBlYC5cbiAqIElmIG5vdCB0aGVuIHRocm93LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0SW5zdGFuY2VPZiB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIGFzc2VydEluc3RhbmNlT2YobmV3IERhdGUoKSwgRGF0ZSk7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydEluc3RhbmNlT2YobmV3IERhdGUoKSwgTnVtYmVyKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAZGVwcmVjYXRlZCBUaGlzIHdpbGwgYmUgcmVtb3ZlZCBpbiAxLjAuMC4gSW1wb3J0IGZyb20ge0BsaW5rIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9hc3NlcnQvYXNzZXJ0X2luc3RhbmNlX29mLnRzfSBpbnN0ZWFkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0SW5zdGFuY2VPZjxUIGV4dGVuZHMgQW55Q29uc3RydWN0b3I+KFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkVHlwZTogVCxcbiAgbXNnID0gXCJcIixcbik6IGFzc2VydHMgYWN0dWFsIGlzIEdldENvbnN0cnVjdG9yVHlwZTxUPiB7XG4gIGFzc2VydHMuYXNzZXJ0SW5zdGFuY2VPZjxUPihhY3R1YWwsIGV4cGVjdGVkVHlwZSwgbXNnKTtcbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBlcnJvcmAgaXMgYW4gYEVycm9yYC5cbiAqIElmIG5vdCB0aGVuIGFuIGVycm9yIHdpbGwgYmUgdGhyb3duLlxuICogQW4gZXJyb3IgY2xhc3MgYW5kIGEgc3RyaW5nIHRoYXQgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZVxuICogZXJyb3IgbWVzc2FnZSBjYW4gYWxzbyBiZSBhc3NlcnRlZC5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGFzc2VydElzRXJyb3IgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBhc3NlcnRJc0Vycm9yKG51bGwpOyAvLyBUaHJvd3NcbiAqIGFzc2VydElzRXJyb3IobmV3IFJhbmdlRXJyb3IoXCJPdXQgb2YgcmFuZ2VcIikpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnRJc0Vycm9yKG5ldyBSYW5nZUVycm9yKFwiT3V0IG9mIHJhbmdlXCIpLCBTeW50YXhFcnJvcik7IC8vIFRocm93c1xuICogYXNzZXJ0SXNFcnJvcihuZXcgUmFuZ2VFcnJvcihcIk91dCBvZiByYW5nZVwiKSwgU3ludGF4RXJyb3IsIFwiT3V0IG9mIHJhbmdlXCIpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnRJc0Vycm9yKG5ldyBSYW5nZUVycm9yKFwiT3V0IG9mIHJhbmdlXCIpLCBTeW50YXhFcnJvciwgXCJXaXRoaW4gcmFuZ2VcIik7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIHJlbW92ZWQgaW4gMS4wLjAuIEltcG9ydCBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvYXNzZXJ0L2Fzc2VydF9pc19lcnJvci50c30gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydElzRXJyb3I8RSBleHRlbmRzIEVycm9yID0gRXJyb3I+KFxuICBlcnJvcjogdW5rbm93bixcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgRXJyb3JDbGFzcz86IG5ldyAoLi4uYXJnczogYW55W10pID0+IEUsXG4gIG1zZ01hdGNoZXM/OiBzdHJpbmcgfCBSZWdFeHAsXG4gIG1zZz86IHN0cmluZyxcbik6IGFzc2VydHMgZXJyb3IgaXMgRSB7XG4gIGFzc2VydHMuYXNzZXJ0SXNFcnJvcjxFPihlcnJvciwgRXJyb3JDbGFzcywgbXNnTWF0Y2hlcywgbXNnKTtcbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byBgZXhwZWN0ZWRgLlxuICogSWYgbm90IHRoZW4gdGhyb3cuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhc3NlcnRMZXNzT3JFcXVhbCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIGFzc2VydExlc3NPckVxdWFsKDEsIDIpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnRMZXNzT3JFcXVhbCgxLCAxKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXNzZXJ0TGVzc09yRXF1YWwoMSwgMCk7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIHJlbW92ZWQgaW4gMS4wLjAuIEltcG9ydCBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvYXNzZXJ0L2Fzc2VydF9sZXNzX29yX2VxdWFsLnRzfSBpbnN0ZWFkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TGVzc09yRXF1YWw8VD4oXG4gIGFjdHVhbDogVCxcbiAgZXhwZWN0ZWQ6IFQsXG4gIG1zZz86IHN0cmluZyxcbikge1xuICBhc3NlcnRzLmFzc2VydExlc3NPckVxdWFsPFQ+KGFjdHVhbCwgZXhwZWN0ZWQsIG1zZyk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBpcyBsZXNzIHRoYW4gYGV4cGVjdGVkYC5cbiAqIElmIG5vdCB0aGVuIHRocm93LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0TGVzcyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIGFzc2VydExlc3MoMSwgMik7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydExlc3MoMiwgMSk7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIHJlbW92ZWQgaW4gMS4wLjAuIEltcG9ydCBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvYXNzZXJ0L2Fzc2VydF9sZXNzLnRzfSBpbnN0ZWFkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TGVzczxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c/OiBzdHJpbmcpIHtcbiAgYXNzZXJ0cy5hc3NlcnRMZXNzPFQ+KGFjdHVhbCwgZXhwZWN0ZWQsIG1zZyk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBtYXRjaCBSZWdFeHAgYGV4cGVjdGVkYC4gSWYgbm90XG4gKiB0aGVuIHRocm93LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0TWF0Y2ggfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBhc3NlcnRNYXRjaChcIlJhcHRvclwiLCBSZWdFeHAoL1JhcHRvci8pKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXNzZXJ0TWF0Y2goXCJEZW5vc2F1cnVzXCIsIFJlZ0V4cCgvUmFwdG9yLykpOyAvLyBUaHJvd3NcbiAqIGBgYFxuICpcbiAqIEBkZXByZWNhdGVkIFRoaXMgd2lsbCBiZSByZW1vdmVkIGluIDEuMC4wLiBJbXBvcnQgZnJvbSB7QGxpbmsgaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL2Fzc2VydC9hc3NlcnRfbWF0Y2gudHN9IGluc3RlYWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRNYXRjaChcbiAgYWN0dWFsOiBzdHJpbmcsXG4gIGV4cGVjdGVkOiBSZWdFeHAsXG4gIG1zZz86IHN0cmluZyxcbikge1xuICBhc3NlcnRzLmFzc2VydE1hdGNoKGFjdHVhbCwgZXhwZWN0ZWQsIG1zZyk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgbm90IGVxdWFsLCBkZWVwbHkuXG4gKiBJZiBub3QgdGhlbiB0aHJvdy5cbiAqXG4gKiBUeXBlIHBhcmFtZXRlciBjYW4gYmUgc3BlY2lmaWVkIHRvIGVuc3VyZSB2YWx1ZXMgdW5kZXIgY29tcGFyaXNvbiBoYXZlIHRoZSBzYW1lIHR5cGUuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhc3NlcnROb3RFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBhc3NlcnROb3RFcXVhbHMoMSwgMik7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydE5vdEVxdWFscygxLCAxKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAZGVwcmVjYXRlZCBUaGlzIHdpbGwgYmUgcmVtb3ZlZCBpbiAxLjAuMC4gSW1wb3J0IGZyb20ge0BsaW5rIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9hc3NlcnQvYXNzZXJ0X25vdF9lcXVhbHMudHN9IGluc3RlYWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3RFcXVhbHM8VD4oYWN0dWFsOiBULCBleHBlY3RlZDogVCwgbXNnPzogc3RyaW5nKSB7XG4gIGFzc2VydHMuYXNzZXJ0Tm90RXF1YWxzPFQ+KGFjdHVhbCwgZXhwZWN0ZWQsIG1zZyk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgb2JqYCBpcyBub3QgYW4gaW5zdGFuY2Ugb2YgYHR5cGVgLlxuICogSWYgc28sIHRoZW4gdGhyb3cuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhc3NlcnROb3RJbnN0YW5jZU9mIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogYXNzZXJ0Tm90SW5zdGFuY2VPZihuZXcgRGF0ZSgpLCBOdW1iZXIpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnROb3RJbnN0YW5jZU9mKG5ldyBEYXRlKCksIERhdGUpOyAvLyBUaHJvd3NcbiAqIGBgYFxuICpcbiAqIEBkZXByZWNhdGVkIFRoaXMgd2lsbCBiZSByZW1vdmVkIGluIDEuMC4wLiBJbXBvcnQgZnJvbSB7QGxpbmsgaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL2Fzc2VydC9hc3NlcnRfbm90X2luc3RhbmNlX29mLnRzfSBpbnN0ZWFkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90SW5zdGFuY2VPZjxBLCBUPihcbiAgYWN0dWFsOiBBLFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICB1bmV4cGVjdGVkVHlwZTogbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gVCxcbiAgbXNnPzogc3RyaW5nLFxuKTogYXNzZXJ0cyBhY3R1YWwgaXMgRXhjbHVkZTxBLCBUPiB7XG4gIGFzc2VydHMuYXNzZXJ0Tm90SW5zdGFuY2VPZjxBLCBUPihhY3R1YWwsIHVuZXhwZWN0ZWRUeXBlLCBtc2cpO1xufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgbm90IG1hdGNoIFJlZ0V4cCBgZXhwZWN0ZWRgLiBJZiBtYXRjaFxuICogdGhlbiB0aHJvdy5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGFzc2VydE5vdE1hdGNoIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogYXNzZXJ0Tm90TWF0Y2goXCJEZW5vc2F1cnVzXCIsIFJlZ0V4cCgvUmFwdG9yLykpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnROb3RNYXRjaChcIlJhcHRvclwiLCBSZWdFeHAoL1JhcHRvci8pKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAZGVwcmVjYXRlZCBUaGlzIHdpbGwgYmUgcmVtb3ZlZCBpbiAxLjAuMC4gSW1wb3J0IGZyb20ge0BsaW5rIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9hc3NlcnQvYXNzZXJ0X25vdF9tYXRjaC50c30gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdE1hdGNoKFxuICBhY3R1YWw6IHN0cmluZyxcbiAgZXhwZWN0ZWQ6IFJlZ0V4cCxcbiAgbXNnPzogc3RyaW5nLFxuKSB7XG4gIGFzc2VydHMuYXNzZXJ0Tm90TWF0Y2goYWN0dWFsLCBleHBlY3RlZCwgbXNnKTtcbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGFuZCBgZXhwZWN0ZWRgIGFyZSBub3Qgc3RyaWN0bHkgZXF1YWwuXG4gKiBJZiB0aGUgdmFsdWVzIGFyZSBzdHJpY3RseSBlcXVhbCB0aGVuIHRocm93LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0Tm90U3RyaWN0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogYXNzZXJ0Tm90U3RyaWN0RXF1YWxzKDEsIDEpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnROb3RTdHJpY3RFcXVhbHMoMSwgMik7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIHJlbW92ZWQgaW4gMS4wLjAuIEltcG9ydCBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvYXNzZXJ0L2Fzc2VydF9ub3Rfc3RyaWN0X2VxdWFscy50c30gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdFN0cmljdEVxdWFsczxUPihcbiAgYWN0dWFsOiBULFxuICBleHBlY3RlZDogVCxcbiAgbXNnPzogc3RyaW5nLFxuKSB7XG4gIGFzc2VydHMuYXNzZXJ0Tm90U3RyaWN0RXF1YWxzKGFjdHVhbCwgZXhwZWN0ZWQsIG1zZyk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBvYmplY3QgaXMgYSBzdWJzZXQgb2YgYGV4cGVjdGVkYCBvYmplY3QsXG4gKiBkZWVwbHkuIElmIG5vdCwgdGhlbiB0aHJvdy5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGFzc2VydE9iamVjdE1hdGNoIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogYXNzZXJ0T2JqZWN0TWF0Y2goeyBmb286IFwiYmFyXCIgfSwgeyBmb286IFwiYmFyXCIgfSk7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydE9iamVjdE1hdGNoKHsgZm9vOiBcImJhclwiIH0sIHsgZm9vOiBcImJhelwiIH0pOyAvLyBUaHJvd3NcbiAqIGBgYFxuICpcbiAqIEBkZXByZWNhdGVkIFRoaXMgd2lsbCBiZSByZW1vdmVkIGluIDEuMC4wLiBJbXBvcnQgZnJvbSB7QGxpbmsgaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL2Fzc2VydC9hc3NlcnRfb2JqZWN0X21hdGNoLnRzfSBpbnN0ZWFkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0T2JqZWN0TWF0Y2goXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGFjdHVhbDogUmVjb3JkPFByb3BlcnR5S2V5LCBhbnk+LFxuICBleHBlY3RlZDogUmVjb3JkPFByb3BlcnR5S2V5LCB1bmtub3duPixcbiAgbXNnPzogc3RyaW5nLFxuKSB7XG4gIGFzc2VydHMuYXNzZXJ0T2JqZWN0TWF0Y2goYWN0dWFsLCBleHBlY3RlZCwgbXNnKTtcbn1cblxuLyoqXG4gKiBFeGVjdXRlcyBhIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYSBwcm9taXNlLCBleHBlY3RpbmcgaXQgdG8gcmVqZWN0LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0UmVqZWN0cyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIGF3YWl0IGFzc2VydFJlamVjdHMoYXN5bmMgKCkgPT4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCkpKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXdhaXQgYXNzZXJ0UmVqZWN0cyhhc3luYyAoKSA9PiBjb25zb2xlLmxvZyhcIkhlbGxvIHdvcmxkXCIpKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAZGVwcmVjYXRlZCBUaGlzIHdpbGwgYmUgcmVtb3ZlZCBpbiAxLjAuMC4gSW1wb3J0IGZyb20ge0BsaW5rIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9hc3NlcnQvYXNzZXJ0X3JlamVjdHMudHN9IGluc3RlYWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRSZWplY3RzKFxuICBmbjogKCkgPT4gUHJvbWlzZUxpa2U8dW5rbm93bj4sXG4gIG1zZz86IHN0cmluZyxcbik6IFByb21pc2U8dW5rbm93bj47XG4vKipcbiAqIEV4ZWN1dGVzIGEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhIHByb21pc2UsIGV4cGVjdGluZyBpdCB0byByZWplY3QuXG4gKiBJZiBpdCBkb2VzIG5vdCwgdGhlbiBpdCB0aHJvd3MuIEFuIGVycm9yIGNsYXNzIGFuZCBhIHN0cmluZyB0aGF0IHNob3VsZCBiZVxuICogaW5jbHVkZWQgaW4gdGhlIGVycm9yIG1lc3NhZ2UgY2FuIGFsc28gYmUgYXNzZXJ0ZWQuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhc3NlcnRSZWplY3RzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogYXdhaXQgYXNzZXJ0UmVqZWN0cyhhc3luYyAoKSA9PiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoKSksIEVycm9yKTsgLy8gRG9lc24ndCB0aHJvd1xuICogYXdhaXQgYXNzZXJ0UmVqZWN0cyhhc3luYyAoKSA9PiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoKSksIFN5bnRheEVycm9yKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAZGVwcmVjYXRlZCBUaGlzIHdpbGwgYmUgcmVtb3ZlZCBpbiAxLjAuMC4gSW1wb3J0IGZyb20ge0BsaW5rIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9hc3NlcnQvYXNzZXJ0X3JlamVjdHMudHN9IGluc3RlYWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRSZWplY3RzPEUgZXh0ZW5kcyBFcnJvciA9IEVycm9yPihcbiAgZm46ICgpID0+IFByb21pc2VMaWtlPHVua25vd24+LFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBFcnJvckNsYXNzOiBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBFLFxuICBtc2dJbmNsdWRlcz86IHN0cmluZyxcbiAgbXNnPzogc3RyaW5nLFxuKTogUHJvbWlzZTxFPjtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhc3NlcnRSZWplY3RzPEUgZXh0ZW5kcyBFcnJvciA9IEVycm9yPihcbiAgZm46ICgpID0+IFByb21pc2VMaWtlPHVua25vd24+LFxuICBlcnJvckNsYXNzT3JNc2c/OlxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgfCAobmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gRSlcbiAgICB8IHN0cmluZyxcbiAgbXNnSW5jbHVkZXNPck1zZz86IHN0cmluZyxcbiAgbXNnPzogc3RyaW5nLFxuKTogUHJvbWlzZTxFIHwgRXJyb3IgfCB1bmtub3duPiB7XG4gIHJldHVybiBhd2FpdCBhc3NlcnRzLmFzc2VydFJlamVjdHM8RT4oXG4gICAgZm4sXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBlcnJvckNsYXNzT3JNc2cgYXMgbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gRSwgLy8gQ2FzdCBlcnJvckNsYXNzT3JNc2cgdG8gdGhlIGNvcnJlY3QgdHlwZVxuICAgIG1zZ0luY2x1ZGVzT3JNc2csXG4gICAgbXNnLFxuICApO1xufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAgYXJlIHN0cmljdGx5IGVxdWFsLiBJZlxuICogbm90IHRoZW4gdGhyb3cuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhc3NlcnRTdHJpY3RFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBjb25zdCBhID0ge307XG4gKiBjb25zdCBiID0gYTtcbiAqIGFzc2VydFN0cmljdEVxdWFscyhhLCBiKTsgLy8gRG9lc24ndCB0aHJvd1xuICpcbiAqIGNvbnN0IGMgPSB7fTtcbiAqIGNvbnN0IGQgPSB7fTtcbiAqIGFzc2VydFN0cmljdEVxdWFscyhjLCBkKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAZGVwcmVjYXRlZCBUaGlzIHdpbGwgYmUgcmVtb3ZlZCBpbiAxLjAuMC4gSW1wb3J0IGZyb20ge0BsaW5rIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9hc3NlcnQvYXNzZXJ0X3N0cmljdF9lcXVhbHMudHN9IGluc3RlYWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRTdHJpY3RFcXVhbHM8VD4oXG4gIGFjdHVhbDogdW5rbm93bixcbiAgZXhwZWN0ZWQ6IFQsXG4gIG1zZz86IHN0cmluZyxcbik6IGFzc2VydHMgYWN0dWFsIGlzIFQge1xuICBhc3NlcnRzLmFzc2VydFN0cmljdEVxdWFsczxUPihhY3R1YWwsIGV4cGVjdGVkLCBtc2cpO1xufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYWN0dWFsIGluY2x1ZGVzIGV4cGVjdGVkLiBJZiBub3RcbiAqIHRoZW4gdGhyb3cuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhc3NlcnRTdHJpbmdJbmNsdWRlcyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIGFzc2VydFN0cmluZ0luY2x1ZGVzKFwiSGVsbG9cIiwgXCJlbGxvXCIpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnRTdHJpbmdJbmNsdWRlcyhcIkhlbGxvXCIsIFwid29ybGRcIik7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIHJlbW92ZWQgaW4gMS4wLjAuIEltcG9ydCBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvYXNzZXJ0L2Fzc2VydF9zdHJpbmdfaW5jbHVkZXMudHN9IGluc3RlYWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRTdHJpbmdJbmNsdWRlcyhcbiAgYWN0dWFsOiBzdHJpbmcsXG4gIGV4cGVjdGVkOiBzdHJpbmcsXG4gIG1zZz86IHN0cmluZyxcbikge1xuICBhc3NlcnRzLmFzc2VydFN0cmluZ0luY2x1ZGVzKGFjdHVhbCwgZXhwZWN0ZWQsIG1zZyk7XG59XG5cbi8qKlxuICogRXhlY3V0ZXMgYSBmdW5jdGlvbiwgZXhwZWN0aW5nIGl0IHRvIHRocm93LiBJZiBpdCBkb2VzIG5vdCwgdGhlbiBpdFxuICogdGhyb3dzLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0VGhyb3dzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogYXNzZXJ0VGhyb3dzKCgpID0+IHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcImhlbGxvIHdvcmxkIVwiKTsgfSk7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydFRocm93cygoKSA9PiBjb25zb2xlLmxvZyhcImhlbGxvIHdvcmxkIVwiKSk7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIHJlbW92ZWQgaW4gMS4wLjAuIEltcG9ydCBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvYXNzZXJ0L2Fzc2VydF90aHJvd3MudHN9IGluc3RlYWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRUaHJvd3MoXG4gIGZuOiAoKSA9PiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB1bmtub3duO1xuLyoqXG4gKiBFeGVjdXRlcyBhIGZ1bmN0aW9uLCBleHBlY3RpbmcgaXQgdG8gdGhyb3cuIElmIGl0IGRvZXMgbm90LCB0aGVuIGl0XG4gKiB0aHJvd3MuIEFuIGVycm9yIGNsYXNzIGFuZCBhIHN0cmluZyB0aGF0IHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGVcbiAqIGVycm9yIG1lc3NhZ2UgY2FuIGFsc28gYmUgYXNzZXJ0ZWQuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhc3NlcnRUaHJvd3MgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBhc3NlcnRUaHJvd3MoKCkgPT4geyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiaGVsbG8gd29ybGQhXCIpOyB9LCBUeXBlRXJyb3IpOyAvLyBEb2Vzbid0IHRocm93XG4gKiBhc3NlcnRUaHJvd3MoKCkgPT4geyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiaGVsbG8gd29ybGQhXCIpOyB9LCBSYW5nZUVycm9yKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAZGVwcmVjYXRlZCBUaGlzIHdpbGwgYmUgcmVtb3ZlZCBpbiAxLjAuMC4gSW1wb3J0IGZyb20ge0BsaW5rIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9hc3NlcnQvYXNzZXJ0X3Rocm93cy50c30gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFRocm93czxFIGV4dGVuZHMgRXJyb3IgPSBFcnJvcj4oXG4gIGZuOiAoKSA9PiB1bmtub3duLFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBFcnJvckNsYXNzOiBuZXcgKC4uLmFyZ3M6IGFueVtdKSA9PiBFLFxuICBtc2dJbmNsdWRlcz86IHN0cmluZyxcbiAgbXNnPzogc3RyaW5nLFxuKTogRTtcbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRUaHJvd3M8RSBleHRlbmRzIEVycm9yID0gRXJyb3I+KFxuICBmbjogKCkgPT4gdW5rbm93bixcbiAgZXJyb3JDbGFzc09yTXNnPzpcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIHwgKG5ldyAoLi4uYXJnczogYW55W10pID0+IEUpXG4gICAgfCBzdHJpbmcsXG4gIG1zZ0luY2x1ZGVzT3JNc2c/OiBzdHJpbmcsXG4gIG1zZz86IHN0cmluZyxcbik6IEUgfCBFcnJvciB8IHVua25vd24ge1xuICByZXR1cm4gYXNzZXJ0cy5hc3NlcnRUaHJvd3M8RT4oXG4gICAgZm4sXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBlcnJvckNsYXNzT3JNc2cgYXMgbmV3ICguLi5hcmdzOiBhbnlbXSkgPT4gRSwgLy8gQ2FzdCBlcnJvckNsYXNzT3JNc2cgdG8gdGhlIGNvcnJlY3QgdHlwZVxuICAgIG1zZ0luY2x1ZGVzT3JNc2csXG4gICAgbXNnLFxuICApO1xufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uLCBlcnJvciB3aWxsIGJlIHRocm93biBpZiBgZXhwcmAgZG9lcyBub3QgaGF2ZSB0cnV0aHkgdmFsdWUuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBhc3NlcnQoXCJoZWxsb1wiLmluY2x1ZGVzKFwiZWxsb1wiKSk7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydChcImhlbGxvXCIuaW5jbHVkZXMoXCJ3b3JsZFwiKSk7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIHJlbW92ZWQgaW4gMS4wLjAuIEltcG9ydCBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvYXNzZXJ0L2Fzc2VydC50c30gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydChleHByOiB1bmtub3duLCBtc2cgPSBcIlwiKTogYXNzZXJ0cyBleHByIHtcbiAgYXNzZXJ0cy5hc3NlcnQoZXhwciwgbXNnKTtcbn1cblxuLyoqXG4gKiBFcnJvciB0aHJvd24gd2hlbiBhbiBhc3NlcnRpb24gZmFpbHMuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBBc3NlcnRpb25FcnJvciB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcIkFzc2VydGlvbiBmYWlsZWRcIik7XG4gKiBgYGBcbiAqXG4gKiBAZGVwcmVjYXRlZCBUaGlzIHdpbGwgYmUgcmVtb3ZlZCBpbiAxLjAuMC4gSW1wb3J0IGZyb20ge0BsaW5rIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9hc3NlcnQvYXNzZXJ0aW9uX2Vycm9yLnRzfSBpbnN0ZWFkLlxuICovXG5leHBvcnQgY2xhc3MgQXNzZXJ0aW9uRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIC8qKiBDb25zdHJ1Y3RzIGEgbmV3IGluc3RhbmNlLiAqL1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSBcIkFzc2VydGlvbkVycm9yXCI7XG4gIH1cbn1cblxuLyoqXG4gKiBEZWVwIGVxdWFsaXR5IGNvbXBhcmlzb24gdXNlZCBpbiBhc3NlcnRpb25zXG4gKiBAcGFyYW0gYyBhY3R1YWwgdmFsdWVcbiAqIEBwYXJhbSBkIGV4cGVjdGVkIHZhbHVlXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBlcXVhbCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIGVxdWFsKHsgZm9vOiBcImJhclwiIH0sIHsgZm9vOiBcImJhclwiIH0pOyAvLyBSZXR1cm5zIGB0cnVlYFxuICogZXF1YWwoeyBmb286IFwiYmFyXCIgfSwgeyBmb286IFwiYmF6XCIgfSk7IC8vIFJldHVybnMgYGZhbHNlXG4gKiBgYGBcbiAqXG4gKiBAZGVwcmVjYXRlZCBUaGlzIHdpbGwgYmUgcmVtb3ZlZCBpbiAxLjAuMC4gSW1wb3J0IGZyb20ge0BsaW5rIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9hc3NlcnQvZXF1YWwudHN9IGluc3RlYWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlcXVhbChjOiB1bmtub3duLCBkOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIHJldHVybiBhc3NlcnRzLmVxdWFsKGMsIGQpO1xufVxuXG4vKipcbiAqIEZvcmNlZnVsbHkgdGhyb3dzIGEgZmFpbGVkIGFzc2VydGlvbi5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGZhaWwgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBmYWlsKFwiRGVsaWJlcmF0ZWx5IGZhaWxlZCFcIik7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogQGRlcHJlY2F0ZWQgVGhpcyB3aWxsIGJlIHJlbW92ZWQgaW4gMS4wLjAuIEltcG9ydCBmcm9tIHtAbGluayBodHRwczovL2Rlbm8ubGFuZC9zdGQvYXNzZXJ0L2ZhaWwudHN9IGluc3RlYWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmYWlsKG1zZz86IHN0cmluZyk6IG5ldmVyIHtcbiAgYXNzZXJ0cy5mYWlsKG1zZyk7XG59XG5cbi8qKlxuICogVXNlIHRoaXMgdG8gc3R1YiBvdXQgbWV0aG9kcyB0aGF0IHdpbGwgdGhyb3cgd2hlbiBpbnZva2VkLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgdW5pbXBsZW1lbnRlZCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICpcbiAqIHVuaW1wbGVtZW50ZWQoKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAZGVwcmVjYXRlZCBUaGlzIHdpbGwgYmUgcmVtb3ZlZCBpbiAxLjAuMC4gSW1wb3J0IGZyb20ge0BsaW5rIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9hc3NlcnQvdW5pbXBsZW1lbnRlZC50c30gaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVuaW1wbGVtZW50ZWQobXNnPzogc3RyaW5nKTogbmV2ZXIge1xuICBhc3NlcnRzLnVuaW1wbGVtZW50ZWQobXNnKTtcbn1cblxuLyoqXG4gKiBVc2UgdGhpcyB0byBhc3NlcnQgdW5yZWFjaGFibGUgY29kZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IHVucmVhY2hhYmxlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG4gKlxuICogdW5yZWFjaGFibGUoKTsgLy8gVGhyb3dzXG4gKiBgYGBcbiAqXG4gKiBAZGVwcmVjYXRlZCBUaGlzIHdpbGwgYmUgcmVtb3ZlZCBpbiAxLjAuMC4gSW1wb3J0IGZyb20ge0BsaW5rIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9hc3NlcnQvdW5yZWFjaGFibGUudHN9IGluc3RlYWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bnJlYWNoYWJsZSgpOiBuZXZlciB7XG4gIGFzc2VydHMudW5yZWFjaGFibGUoKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFFMUU7Ozs7Ozs7Ozs7O0NBV0MsR0FDRCxZQUFZLGFBQWEsbUJBQW1CO0FBRTVDOzs7Ozs7Ozs7Ozs7Ozs7OztDQWlCQyxHQUNELE9BQU8sU0FBUyxtQkFDZCxNQUFjLEVBQ2QsUUFBZ0IsRUFDaEIsWUFBWSxJQUFJLEVBQ2hCLEdBQVk7RUFFWixRQUFRLGtCQUFrQixDQUFDLFFBQVEsVUFBVSxXQUFXO0FBQzFEO0FBU0E7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnQkMsR0FDRCxPQUFPLFNBQVMsb0JBQ2QsTUFBdUIsRUFDdkIsUUFBeUIsRUFDekIsR0FBWTtFQUVaLFFBQVEsbUJB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
// denoCacheMetadata=8621402091518370843,4179691110939230152