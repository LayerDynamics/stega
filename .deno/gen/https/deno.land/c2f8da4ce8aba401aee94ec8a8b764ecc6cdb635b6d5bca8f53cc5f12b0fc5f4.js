// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { equal } from "./equal.ts";
import { buildMessage, diff, diffstr, format } from "../internal/mod.ts";
import { AssertionError } from "./assertion_error.ts";
import { red } from "../fmt/colors.ts";
import { CAN_NOT_DISPLAY } from "./_constants.ts";
/**
 * Make an assertion that `actual` and `expected` are equal, deeply. If not
 * deeply equal, then throw.
 *
 * Type parameter can be specified to ensure values under comparison have the
 * same type.
 *
 * @example
 * ```ts
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/assert/assert_equals.ts";
 *
 * assertEquals("world", "world"); // Doesn't throw
 * assertEquals("hello", "world"); // Throws
 * ```
 *
 * Note: formatter option is experimental and may be removed in the future.
 */ export function assertEquals(actual, expected, msg, options = {}) {
  if (equal(actual, expected)) {
    return;
  }
  const { formatter = format } = options;
  const msgSuffix = msg ? `: ${msg}` : ".";
  let message = `Values are not equal${msgSuffix}`;
  const actualString = formatter(actual);
  const expectedString = formatter(expected);
  try {
    const stringDiff = typeof actual === "string" && typeof expected === "string";
    const diffResult = stringDiff ? diffstr(actual, expected) : diff(actualString.split("\n"), expectedString.split("\n"));
    const diffMsg = buildMessage(diffResult, {
      stringDiff
    }).join("\n");
    message = `${message}\n${diffMsg}`;
  } catch  {
    message = `${message}\n${red(CAN_NOT_DISPLAY)} + \n\n`;
  }
  throw new AssertionError(message);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyNC4wL2Fzc2VydC9hc3NlcnRfZXF1YWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5pbXBvcnQgeyBlcXVhbCB9IGZyb20gXCIuL2VxdWFsLnRzXCI7XG5pbXBvcnQgeyBidWlsZE1lc3NhZ2UsIGRpZmYsIGRpZmZzdHIsIGZvcm1hdCB9IGZyb20gXCIuLi9pbnRlcm5hbC9tb2QudHNcIjtcbmltcG9ydCB7IEFzc2VydGlvbkVycm9yIH0gZnJvbSBcIi4vYXNzZXJ0aW9uX2Vycm9yLnRzXCI7XG5pbXBvcnQgeyByZWQgfSBmcm9tIFwiLi4vZm10L2NvbG9ycy50c1wiO1xuaW1wb3J0IHsgQ0FOX05PVF9ESVNQTEFZIH0gZnJvbSBcIi4vX2NvbnN0YW50cy50c1wiO1xuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAgYXJlIGVxdWFsLCBkZWVwbHkuIElmIG5vdFxuICogZGVlcGx5IGVxdWFsLCB0aGVuIHRocm93LlxuICpcbiAqIFR5cGUgcGFyYW1ldGVyIGNhbiBiZSBzcGVjaWZpZWQgdG8gZW5zdXJlIHZhbHVlcyB1bmRlciBjb21wYXJpc29uIGhhdmUgdGhlXG4gKiBzYW1lIHR5cGUuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9hc3NlcnQvYXNzZXJ0X2VxdWFscy50c1wiO1xuICpcbiAqIGFzc2VydEVxdWFscyhcIndvcmxkXCIsIFwid29ybGRcIik7IC8vIERvZXNuJ3QgdGhyb3dcbiAqIGFzc2VydEVxdWFscyhcImhlbGxvXCIsIFwid29ybGRcIik7IC8vIFRocm93c1xuICogYGBgXG4gKlxuICogTm90ZTogZm9ybWF0dGVyIG9wdGlvbiBpcyBleHBlcmltZW50YWwgYW5kIG1heSBiZSByZW1vdmVkIGluIHRoZSBmdXR1cmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRFcXVhbHM8VD4oXG4gIGFjdHVhbDogVCxcbiAgZXhwZWN0ZWQ6IFQsXG4gIG1zZz86IHN0cmluZyxcbiAgb3B0aW9uczogeyBmb3JtYXR0ZXI/OiAodmFsdWU6IHVua25vd24pID0+IHN0cmluZyB9ID0ge30sXG4pIHtcbiAgaWYgKGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHsgZm9ybWF0dGVyID0gZm9ybWF0IH0gPSBvcHRpb25zO1xuICBjb25zdCBtc2dTdWZmaXggPSBtc2cgPyBgOiAke21zZ31gIDogXCIuXCI7XG4gIGxldCBtZXNzYWdlID0gYFZhbHVlcyBhcmUgbm90IGVxdWFsJHttc2dTdWZmaXh9YDtcblxuICBjb25zdCBhY3R1YWxTdHJpbmcgPSBmb3JtYXR0ZXIoYWN0dWFsKTtcbiAgY29uc3QgZXhwZWN0ZWRTdHJpbmcgPSBmb3JtYXR0ZXIoZXhwZWN0ZWQpO1xuICB0cnkge1xuICAgIGNvbnN0IHN0cmluZ0RpZmYgPSAodHlwZW9mIGFjdHVhbCA9PT0gXCJzdHJpbmdcIikgJiZcbiAgICAgICh0eXBlb2YgZXhwZWN0ZWQgPT09IFwic3RyaW5nXCIpO1xuICAgIGNvbnN0IGRpZmZSZXN1bHQgPSBzdHJpbmdEaWZmXG4gICAgICA/IGRpZmZzdHIoYWN0dWFsIGFzIHN0cmluZywgZXhwZWN0ZWQgYXMgc3RyaW5nKVxuICAgICAgOiBkaWZmKGFjdHVhbFN0cmluZy5zcGxpdChcIlxcblwiKSwgZXhwZWN0ZWRTdHJpbmcuc3BsaXQoXCJcXG5cIikpO1xuICAgIGNvbnN0IGRpZmZNc2cgPSBidWlsZE1lc3NhZ2UoZGlmZlJlc3VsdCwgeyBzdHJpbmdEaWZmIH0pLmpvaW4oXCJcXG5cIik7XG4gICAgbWVzc2FnZSA9IGAke21lc3NhZ2V9XFxuJHtkaWZmTXNnfWA7XG4gIH0gY2F0Y2gge1xuICAgIG1lc3NhZ2UgPSBgJHttZXNzYWdlfVxcbiR7cmVkKENBTl9OT1RfRElTUExBWSl9ICsgXFxuXFxuYDtcbiAgfVxuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUNyQyxTQUFTLEtBQUssUUFBUSxhQUFhO0FBQ25DLFNBQVMsWUFBWSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxRQUFRLHFCQUFxQjtBQUN6RSxTQUFTLGNBQWMsUUFBUSx1QkFBdUI7QUFDdEQsU0FBUyxHQUFHLFFBQVEsbUJBQW1CO0FBQ3ZDLFNBQVMsZUFBZSxRQUFRLGtCQUFrQjtBQUVsRDs7Ozs7Ozs7Ozs7Ozs7OztDQWdCQyxHQUNELE9BQU8sU0FBUyxhQUNkLE1BQVMsRUFDVCxRQUFXLEVBQ1gsR0FBWSxFQUNaLFVBQXNELENBQUMsQ0FBQztFQUV4RCxJQUFJLE1BQU0sUUFBUSxXQUFXO0lBQzNCO0VBQ0Y7RUFDQSxNQUFNLEVBQUUsWUFBWSxNQUFNLEVBQUUsR0FBRztFQUMvQixNQUFNLFlBQVksTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsR0FBRztFQUNyQyxJQUFJLFVBQVUsQ0FBQyxvQkFBb0IsRUFBRSxVQUFVLENBQUM7RUFFaEQsTUFBTSxlQUFlLFVBQVU7RUFDL0IsTUFBTSxpQkFBaUIsVUFBVTtFQUNqQyxJQUFJO0lBQ0YsTUFBTSxhQUFhLEFBQUMsT0FBTyxXQUFXLFlBQ25DLE9BQU8sYUFBYTtJQUN2QixNQUFNLGFBQWEsYUFDZixRQUFRLFFBQWtCLFlBQzFCLEtBQUssYUFBYSxLQUFLLENBQUMsT0FBTyxlQUFlLEtBQUssQ0FBQztJQUN4RCxNQUFNLFVBQVUsYUFBYSxZQUFZO01BQUU7SUFBVyxHQUFHLElBQUksQ0FBQztJQUM5RCxVQUFVLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxRQUFRLENBQUM7RUFDcEMsRUFBRSxPQUFNO0lBQ04sVUFBVSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsSUFBSSxpQkFBaUIsT0FBTyxDQUFDO0VBQ3hEO0VBQ0EsTUFBTSxJQUFJLGVBQWU7QUFDM0IifQ==
// denoCacheMetadata=2096368929105211379,9213065940692458221