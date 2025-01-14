// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { equal } from "./equal.ts";
import { format } from "./_format.ts";
import { AssertionError } from "./assertion_error.ts";
import { red } from "../fmt/colors.ts";
import { buildMessage, diff, diffstr } from "./_diff.ts";
import { CAN_NOT_DISPLAY } from "./_constants.ts";
/**
 * Make an assertion that `actual` and `expected` are equal, deeply. If not
 * deeply equal, then throw.
 *
 * Type parameter can be specified to ensure values under comparison have the same type.
 *
 * @example
 * ```ts
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/assert/assert_equals.ts";
 *
 * Deno.test("example", function (): void {
 *   assertEquals("world", "world");
 *   assertEquals({ hello: "world" }, { hello: "world" });
 * });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL2Fzc2VydC9hc3NlcnRfZXF1YWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjMgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgeyBlcXVhbCB9IGZyb20gXCIuL2VxdWFsLnRzXCI7XG5pbXBvcnQgeyBmb3JtYXQgfSBmcm9tIFwiLi9fZm9ybWF0LnRzXCI7XG5pbXBvcnQgeyBBc3NlcnRpb25FcnJvciB9IGZyb20gXCIuL2Fzc2VydGlvbl9lcnJvci50c1wiO1xuaW1wb3J0IHsgcmVkIH0gZnJvbSBcIi4uL2ZtdC9jb2xvcnMudHNcIjtcbmltcG9ydCB7IGJ1aWxkTWVzc2FnZSwgZGlmZiwgZGlmZnN0ciB9IGZyb20gXCIuL19kaWZmLnRzXCI7XG5pbXBvcnQgeyBDQU5fTk9UX0RJU1BMQVkgfSBmcm9tIFwiLi9fY29uc3RhbnRzLnRzXCI7XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgZXF1YWwsIGRlZXBseS4gSWYgbm90XG4gKiBkZWVwbHkgZXF1YWwsIHRoZW4gdGhyb3cuXG4gKlxuICogVHlwZSBwYXJhbWV0ZXIgY2FuIGJlIHNwZWNpZmllZCB0byBlbnN1cmUgdmFsdWVzIHVuZGVyIGNvbXBhcmlzb24gaGF2ZSB0aGUgc2FtZSB0eXBlLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vYXNzZXJ0L2Fzc2VydF9lcXVhbHMudHNcIjtcbiAqXG4gKiBEZW5vLnRlc3QoXCJleGFtcGxlXCIsIGZ1bmN0aW9uICgpOiB2b2lkIHtcbiAqICAgYXNzZXJ0RXF1YWxzKFwid29ybGRcIiwgXCJ3b3JsZFwiKTtcbiAqICAgYXNzZXJ0RXF1YWxzKHsgaGVsbG86IFwid29ybGRcIiB9LCB7IGhlbGxvOiBcIndvcmxkXCIgfSk7XG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIE5vdGU6IGZvcm1hdHRlciBvcHRpb24gaXMgZXhwZXJpbWVudGFsIGFuZCBtYXkgYmUgcmVtb3ZlZCBpbiB0aGUgZnV0dXJlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RXF1YWxzPFQ+KFxuICBhY3R1YWw6IFQsXG4gIGV4cGVjdGVkOiBULFxuICBtc2c/OiBzdHJpbmcsXG4gIG9wdGlvbnM6IHsgZm9ybWF0dGVyPzogKHZhbHVlOiB1bmtub3duKSA9PiBzdHJpbmcgfSA9IHt9LFxuKSB7XG4gIGlmIChlcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB7IGZvcm1hdHRlciA9IGZvcm1hdCB9ID0gb3B0aW9ucztcbiAgY29uc3QgbXNnU3VmZml4ID0gbXNnID8gYDogJHttc2d9YCA6IFwiLlwiO1xuICBsZXQgbWVzc2FnZSA9IGBWYWx1ZXMgYXJlIG5vdCBlcXVhbCR7bXNnU3VmZml4fWA7XG5cbiAgY29uc3QgYWN0dWFsU3RyaW5nID0gZm9ybWF0dGVyKGFjdHVhbCk7XG4gIGNvbnN0IGV4cGVjdGVkU3RyaW5nID0gZm9ybWF0dGVyKGV4cGVjdGVkKTtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdHJpbmdEaWZmID0gKHR5cGVvZiBhY3R1YWwgPT09IFwic3RyaW5nXCIpICYmXG4gICAgICAodHlwZW9mIGV4cGVjdGVkID09PSBcInN0cmluZ1wiKTtcbiAgICBjb25zdCBkaWZmUmVzdWx0ID0gc3RyaW5nRGlmZlxuICAgICAgPyBkaWZmc3RyKGFjdHVhbCBhcyBzdHJpbmcsIGV4cGVjdGVkIGFzIHN0cmluZylcbiAgICAgIDogZGlmZihhY3R1YWxTdHJpbmcuc3BsaXQoXCJcXG5cIiksIGV4cGVjdGVkU3RyaW5nLnNwbGl0KFwiXFxuXCIpKTtcbiAgICBjb25zdCBkaWZmTXNnID0gYnVpbGRNZXNzYWdlKGRpZmZSZXN1bHQsIHsgc3RyaW5nRGlmZiB9KS5qb2luKFwiXFxuXCIpO1xuICAgIG1lc3NhZ2UgPSBgJHttZXNzYWdlfVxcbiR7ZGlmZk1zZ31gO1xuICB9IGNhdGNoIHtcbiAgICBtZXNzYWdlID0gYCR7bWVzc2FnZX1cXG4ke3JlZChDQU5fTk9UX0RJU1BMQVkpfSArIFxcblxcbmA7XG4gIH1cbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1lc3NhZ2UpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxTQUFTLEtBQUssUUFBUSxhQUFhO0FBQ25DLFNBQVMsTUFBTSxRQUFRLGVBQWU7QUFDdEMsU0FBUyxjQUFjLFFBQVEsdUJBQXVCO0FBQ3RELFNBQVMsR0FBRyxRQUFRLG1CQUFtQjtBQUN2QyxTQUFTLFlBQVksRUFBRSxJQUFJLEVBQUUsT0FBTyxRQUFRLGFBQWE7QUFDekQsU0FBUyxlQUFlLFFBQVEsa0JBQWtCO0FBRWxEOzs7Ozs7Ozs7Ozs7Ozs7OztDQWlCQyxHQUNELE9BQU8sU0FBUyxhQUNkLE1BQVMsRUFDVCxRQUFXLEVBQ1gsR0FBWSxFQUNaLFVBQXNELENBQUMsQ0FBQztFQUV4RCxJQUFJLE1BQU0sUUFBUSxXQUFXO0lBQzNCO0VBQ0Y7RUFDQSxNQUFNLEVBQUUsWUFBWSxNQUFNLEVBQUUsR0FBRztFQUMvQixNQUFNLFlBQVksTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsR0FBRztFQUNyQyxJQUFJLFVBQVUsQ0FBQyxvQkFBb0IsRUFBRSxVQUFVLENBQUM7RUFFaEQsTUFBTSxlQUFlLFVBQVU7RUFDL0IsTUFBTSxpQkFBaUIsVUFBVTtFQUNqQyxJQUFJO0lBQ0YsTUFBTSxhQUFhLEFBQUMsT0FBTyxXQUFXLFlBQ25DLE9BQU8sYUFBYTtJQUN2QixNQUFNLGFBQWEsYUFDZixRQUFRLFFBQWtCLFlBQzFCLEtBQUssYUFBYSxLQUFLLENBQUMsT0FBTyxlQUFlLEtBQUssQ0FBQztJQUN4RCxNQUFNLFVBQVUsYUFBYSxZQUFZO01BQUU7SUFBVyxHQUFHLElBQUksQ0FBQztJQUM5RCxVQUFVLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxRQUFRLENBQUM7RUFDcEMsRUFBRSxPQUFNO0lBQ04sVUFBVSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsSUFBSSxpQkFBaUIsT0FBTyxDQUFDO0VBQ3hEO0VBQ0EsTUFBTSxJQUFJLGVBQWU7QUFDM0IifQ==
// denoCacheMetadata=17327882962179847271,3070844740509698244