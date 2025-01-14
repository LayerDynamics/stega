// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { buildMessage, diff, diffstr, format } from "../internal/mod.ts";
import { AssertionError } from "./assertion_error.ts";
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
 * const a = {};
 * const b = a;
 * assertStrictEquals(a, b); // Doesn't throw
 *
 * const c = {};
 * const d = {};
 * assertStrictEquals(c, d); // Throws
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyNC4wL2Fzc2VydC9hc3NlcnRfc3RyaWN0X2VxdWFscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuaW1wb3J0IHsgYnVpbGRNZXNzYWdlLCBkaWZmLCBkaWZmc3RyLCBmb3JtYXQgfSBmcm9tIFwiLi4vaW50ZXJuYWwvbW9kLnRzXCI7XG5pbXBvcnQgeyBBc3NlcnRpb25FcnJvciB9IGZyb20gXCIuL2Fzc2VydGlvbl9lcnJvci50c1wiO1xuaW1wb3J0IHsgQ0FOX05PVF9ESVNQTEFZIH0gZnJvbSBcIi4vX2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgcmVkIH0gZnJvbSBcIi4uL2ZtdC9jb2xvcnMudHNcIjtcblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGFuZCBgZXhwZWN0ZWRgIGFyZSBzdHJpY3RseSBlcXVhbC4gSWZcbiAqIG5vdCB0aGVuIHRocm93LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0U3RyaWN0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vYXNzZXJ0L2Fzc2VydF9zdHJpY3RfZXF1YWxzLnRzXCI7XG4gKlxuICogY29uc3QgYSA9IHt9O1xuICogY29uc3QgYiA9IGE7XG4gKiBhc3NlcnRTdHJpY3RFcXVhbHMoYSwgYik7IC8vIERvZXNuJ3QgdGhyb3dcbiAqXG4gKiBjb25zdCBjID0ge307XG4gKiBjb25zdCBkID0ge307XG4gKiBhc3NlcnRTdHJpY3RFcXVhbHMoYywgZCk7IC8vIFRocm93c1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRTdHJpY3RFcXVhbHM8VD4oXG4gIGFjdHVhbDogdW5rbm93bixcbiAgZXhwZWN0ZWQ6IFQsXG4gIG1zZz86IHN0cmluZyxcbik6IGFzc2VydHMgYWN0dWFsIGlzIFQge1xuICBpZiAoT2JqZWN0LmlzKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbXNnU3VmZml4ID0gbXNnID8gYDogJHttc2d9YCA6IFwiLlwiO1xuICBsZXQgbWVzc2FnZTogc3RyaW5nO1xuXG4gIGNvbnN0IGFjdHVhbFN0cmluZyA9IGZvcm1hdChhY3R1YWwpO1xuICBjb25zdCBleHBlY3RlZFN0cmluZyA9IGZvcm1hdChleHBlY3RlZCk7XG5cbiAgaWYgKGFjdHVhbFN0cmluZyA9PT0gZXhwZWN0ZWRTdHJpbmcpIHtcbiAgICBjb25zdCB3aXRoT2Zmc2V0ID0gYWN0dWFsU3RyaW5nXG4gICAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAgIC5tYXAoKGwpID0+IGAgICAgJHtsfWApXG4gICAgICAuam9pbihcIlxcblwiKTtcbiAgICBtZXNzYWdlID1cbiAgICAgIGBWYWx1ZXMgaGF2ZSB0aGUgc2FtZSBzdHJ1Y3R1cmUgYnV0IGFyZSBub3QgcmVmZXJlbmNlLWVxdWFsJHttc2dTdWZmaXh9XFxuXFxuJHtcbiAgICAgICAgcmVkKHdpdGhPZmZzZXQpXG4gICAgICB9XFxuYDtcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3RyaW5nRGlmZiA9ICh0eXBlb2YgYWN0dWFsID09PSBcInN0cmluZ1wiKSAmJlxuICAgICAgICAodHlwZW9mIGV4cGVjdGVkID09PSBcInN0cmluZ1wiKTtcbiAgICAgIGNvbnN0IGRpZmZSZXN1bHQgPSBzdHJpbmdEaWZmXG4gICAgICAgID8gZGlmZnN0cihhY3R1YWwgYXMgc3RyaW5nLCBleHBlY3RlZCBhcyBzdHJpbmcpXG4gICAgICAgIDogZGlmZihhY3R1YWxTdHJpbmcuc3BsaXQoXCJcXG5cIiksIGV4cGVjdGVkU3RyaW5nLnNwbGl0KFwiXFxuXCIpKTtcbiAgICAgIGNvbnN0IGRpZmZNc2cgPSBidWlsZE1lc3NhZ2UoZGlmZlJlc3VsdCwgeyBzdHJpbmdEaWZmIH0pLmpvaW4oXCJcXG5cIik7XG4gICAgICBtZXNzYWdlID0gYFZhbHVlcyBhcmUgbm90IHN0cmljdGx5IGVxdWFsJHttc2dTdWZmaXh9XFxuJHtkaWZmTXNnfWA7XG4gICAgfSBjYXRjaCB7XG4gICAgICBtZXNzYWdlID0gYFxcbiR7cmVkKENBTl9OT1RfRElTUExBWSl9ICsgXFxuXFxuYDtcbiAgICB9XG4gIH1cblxuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUNyQyxTQUFTLFlBQVksRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sUUFBUSxxQkFBcUI7QUFDekUsU0FBUyxjQUFjLFFBQVEsdUJBQXVCO0FBQ3RELFNBQVMsZUFBZSxRQUFRLGtCQUFrQjtBQUNsRCxTQUFTLEdBQUcsUUFBUSxtQkFBbUI7QUFFdkM7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnQkMsR0FDRCxPQUFPLFNBQVMsbUJBQ2QsTUFBZSxFQUNmLFFBQVcsRUFDWCxHQUFZO0VBRVosSUFBSSxPQUFPLEVBQUUsQ0FBQyxRQUFRLFdBQVc7SUFDL0I7RUFDRjtFQUVBLE1BQU0sWUFBWSxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxHQUFHO0VBQ3JDLElBQUk7RUFFSixNQUFNLGVBQWUsT0FBTztFQUM1QixNQUFNLGlCQUFpQixPQUFPO0VBRTlCLElBQUksaUJBQWlCLGdCQUFnQjtJQUNuQyxNQUFNLGFBQWEsYUFDaEIsS0FBSyxDQUFDLE1BQ04sR0FBRyxDQUFDLENBQUMsSUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsRUFDckIsSUFBSSxDQUFDO0lBQ1IsVUFDRSxDQUFDLDBEQUEwRCxFQUFFLFVBQVUsSUFBSSxFQUN6RSxJQUFJLFlBQ0wsRUFBRSxDQUFDO0VBQ1IsT0FBTztJQUNMLElBQUk7TUFDRixNQUFNLGFBQWEsQUFBQyxPQUFPLFdBQVcsWUFDbkMsT0FBTyxhQUFhO01BQ3ZCLE1BQU0sYUFBYSxhQUNmLFFBQVEsUUFBa0IsWUFDMUIsS0FBSyxhQUFhLEtBQUssQ0FBQyxPQUFPLGVBQWUsS0FBSyxDQUFDO01BQ3hELE1BQU0sVUFBVSxhQUFhLFlBQVk7UUFBRTtNQUFXLEdBQUcsSUFBSSxDQUFDO01BQzlELFVBQVUsQ0FBQyw2QkFBNkIsRUFBRSxVQUFVLEVBQUUsRUFBRSxRQUFRLENBQUM7SUFDbkUsRUFBRSxPQUFNO01BQ04sVUFBVSxDQUFDLEVBQUUsRUFBRSxJQUFJLGlCQUFpQixPQUFPLENBQUM7SUFDOUM7RUFDRjtFQUVBLE1BQU0sSUFBSSxlQUFlO0FBQzNCIn0=
// denoCacheMetadata=12633996431560930439,7625621564214331160