// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { format } from "./_format.ts";
import { AssertionError } from "./assertion_error.ts";
import { buildMessage, diff, diffstr } from "./_diff.ts";
import { CAN_NOT_DISPLAY } from "./_constants.ts";
import { red } from "../fmt/colors.ts";
/**
 * Make an assertion that `actual` and `expected` are strictly equal. If
 * not then throw.
 *
 * @example
 * ```ts
 * import { assertStrictEquals } from "https://deno.land/std@$STD_VERSION/assert/assert_strict_equals.ts";
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
 */ export function assertStrictEquals(actual, expected, msg) {
  if (Object.is(actual, expected)) {
    return;
  }
  const msgSuffix = msg ? `: ${msg}` : ".";
  let message;
  const actualString = format(actual);
  const expectedString = format(expected);
  if (actualString === expectedString) {
    const withOffset = actualString.split("\n").map((l)=>`    ${l}`).join("\n");
    message = `Values have the same structure but are not reference-equal${msgSuffix}\n\n${red(withOffset)}\n`;
  } else {
    try {
      const stringDiff = typeof actual === "string" && typeof expected === "string";
      const diffResult = stringDiff ? diffstr(actual, expected) : diff(actualString.split("\n"), expectedString.split("\n"));
      const diffMsg = buildMessage(diffResult, {
        stringDiff
      }).join("\n");
      message = `Values are not strictly equal${msgSuffix}\n${diffMsg}`;
    } catch  {
      message = `\n${red(CAN_NOT_DISPLAY)} + \n\n`;
    }
  }
  throw new AssertionError(message);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL2Fzc2VydC9hc3NlcnRfc3RyaWN0X2VxdWFscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHsgZm9ybWF0IH0gZnJvbSBcIi4vX2Zvcm1hdC50c1wiO1xuaW1wb3J0IHsgQXNzZXJ0aW9uRXJyb3IgfSBmcm9tIFwiLi9hc3NlcnRpb25fZXJyb3IudHNcIjtcbmltcG9ydCB7IGJ1aWxkTWVzc2FnZSwgZGlmZiwgZGlmZnN0ciB9IGZyb20gXCIuL19kaWZmLnRzXCI7XG5pbXBvcnQgeyBDQU5fTk9UX0RJU1BMQVkgfSBmcm9tIFwiLi9fY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyByZWQgfSBmcm9tIFwiLi4vZm10L2NvbG9ycy50c1wiO1xuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAgYXJlIHN0cmljdGx5IGVxdWFsLiBJZlxuICogbm90IHRoZW4gdGhyb3cuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhc3NlcnRTdHJpY3RFcXVhbHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9hc3NlcnQvYXNzZXJ0X3N0cmljdF9lcXVhbHMudHNcIjtcbiAqXG4gKiBEZW5vLnRlc3QoXCJpc1N0cmljdGx5RXF1YWxcIiwgZnVuY3Rpb24gKCk6IHZvaWQge1xuICogICBjb25zdCBhID0ge307XG4gKiAgIGNvbnN0IGIgPSBhO1xuICogICBhc3NlcnRTdHJpY3RFcXVhbHMoYSwgYik7XG4gKiB9KTtcbiAqXG4gKiAvLyBUaGlzIHRlc3QgZmFpbHNcbiAqIERlbm8udGVzdChcImlzTm90U3RyaWN0bHlFcXVhbFwiLCBmdW5jdGlvbiAoKTogdm9pZCB7XG4gKiAgIGNvbnN0IGEgPSB7fTtcbiAqICAgY29uc3QgYiA9IHt9O1xuICogICBhc3NlcnRTdHJpY3RFcXVhbHMoYSwgYik7XG4gKiB9KTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0U3RyaWN0RXF1YWxzPFQ+KFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkOiBULFxuICBtc2c/OiBzdHJpbmcsXG4pOiBhc3NlcnRzIGFjdHVhbCBpcyBUIHtcbiAgaWYgKE9iamVjdC5pcyhhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG1zZ1N1ZmZpeCA9IG1zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIjtcbiAgbGV0IG1lc3NhZ2U6IHN0cmluZztcblxuICBjb25zdCBhY3R1YWxTdHJpbmcgPSBmb3JtYXQoYWN0dWFsKTtcbiAgY29uc3QgZXhwZWN0ZWRTdHJpbmcgPSBmb3JtYXQoZXhwZWN0ZWQpO1xuXG4gIGlmIChhY3R1YWxTdHJpbmcgPT09IGV4cGVjdGVkU3RyaW5nKSB7XG4gICAgY29uc3Qgd2l0aE9mZnNldCA9IGFjdHVhbFN0cmluZ1xuICAgICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgICAubWFwKChsKSA9PiBgICAgICR7bH1gKVxuICAgICAgLmpvaW4oXCJcXG5cIik7XG4gICAgbWVzc2FnZSA9XG4gICAgICBgVmFsdWVzIGhhdmUgdGhlIHNhbWUgc3RydWN0dXJlIGJ1dCBhcmUgbm90IHJlZmVyZW5jZS1lcXVhbCR7bXNnU3VmZml4fVxcblxcbiR7XG4gICAgICAgIHJlZCh3aXRoT2Zmc2V0KVxuICAgICAgfVxcbmA7XG4gIH0gZWxzZSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHN0cmluZ0RpZmYgPSAodHlwZW9mIGFjdHVhbCA9PT0gXCJzdHJpbmdcIikgJiZcbiAgICAgICAgKHR5cGVvZiBleHBlY3RlZCA9PT0gXCJzdHJpbmdcIik7XG4gICAgICBjb25zdCBkaWZmUmVzdWx0ID0gc3RyaW5nRGlmZlxuICAgICAgICA/IGRpZmZzdHIoYWN0dWFsIGFzIHN0cmluZywgZXhwZWN0ZWQgYXMgc3RyaW5nKVxuICAgICAgICA6IGRpZmYoYWN0dWFsU3RyaW5nLnNwbGl0KFwiXFxuXCIpLCBleHBlY3RlZFN0cmluZy5zcGxpdChcIlxcblwiKSk7XG4gICAgICBjb25zdCBkaWZmTXNnID0gYnVpbGRNZXNzYWdlKGRpZmZSZXN1bHQsIHsgc3RyaW5nRGlmZiB9KS5qb2luKFwiXFxuXCIpO1xuICAgICAgbWVzc2FnZSA9IGBWYWx1ZXMgYXJlIG5vdCBzdHJpY3RseSBlcXVhbCR7bXNnU3VmZml4fVxcbiR7ZGlmZk1zZ31gO1xuICAgIH0gY2F0Y2gge1xuICAgICAgbWVzc2FnZSA9IGBcXG4ke3JlZChDQU5fTk9UX0RJU1BMQVkpfSArIFxcblxcbmA7XG4gICAgfVxuICB9XG5cbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1lc3NhZ2UpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxTQUFTLE1BQU0sUUFBUSxlQUFlO0FBQ3RDLFNBQVMsY0FBYyxRQUFRLHVCQUF1QjtBQUN0RCxTQUFTLFlBQVksRUFBRSxJQUFJLEVBQUUsT0FBTyxRQUFRLGFBQWE7QUFDekQsU0FBUyxlQUFlLFFBQVEsa0JBQWtCO0FBQ2xELFNBQVMsR0FBRyxRQUFRLG1CQUFtQjtBQUV2Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBcUJDLEdBQ0QsT0FBTyxTQUFTLG1CQUNkLE1BQWUsRUFDZixRQUFXLEVBQ1gsR0FBWTtFQUVaLElBQUksT0FBTyxFQUFFLENBQUMsUUFBUSxXQUFXO0lBQy9CO0VBQ0Y7RUFFQSxNQUFNLFlBQVksTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsR0FBRztFQUNyQyxJQUFJO0VBRUosTUFBTSxlQUFlLE9BQU87RUFDNUIsTUFBTSxpQkFBaUIsT0FBTztFQUU5QixJQUFJLGlCQUFpQixnQkFBZ0I7SUFDbkMsTUFBTSxhQUFhLGFBQ2hCLEtBQUssQ0FBQyxNQUNOLEdBQUcsQ0FBQyxDQUFDLElBQU0sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQ3JCLElBQUksQ0FBQztJQUNSLFVBQ0UsQ0FBQywwREFBMEQsRUFBRSxVQUFVLElBQUksRUFDekUsSUFBSSxZQUNMLEVBQUUsQ0FBQztFQUNSLE9BQU87SUFDTCxJQUFJO01BQ0YsTUFBTSxhQUFhLEFBQUMsT0FBTyxXQUFXLFlBQ25DLE9BQU8sYUFBYTtNQUN2QixNQUFNLGFBQWEsYUFDZixRQUFRLFFBQWtCLFlBQzFCLEtBQUssYUFBYSxLQUFLLENBQUMsT0FBTyxlQUFlLEtBQUssQ0FBQztNQUN4RCxNQUFNLFVBQVUsYUFBYSxZQUFZO1FBQUU7TUFBVyxHQUFHLElBQUksQ0FBQztNQUM5RCxVQUFVLENBQUMsNkJBQTZCLEVBQUUsVUFBVSxFQUFFLEVBQUUsUUFBUSxDQUFDO0lBQ25FLEVBQUUsT0FBTTtNQUNOLFVBQVUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxpQkFBaUIsT0FBTyxDQUFDO0lBQzlDO0VBQ0Y7RUFFQSxNQUFNLElBQUksZUFBZTtBQUMzQiJ9
// denoCacheMetadata=11665775432689796169,15602627183543470966