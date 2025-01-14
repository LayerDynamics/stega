// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assertArgs, lastPathSegment, stripSuffix } from "../_common/basename.ts";
import { CHAR_COLON } from "../_common/constants.ts";
import { stripTrailingSeparators } from "../_common/strip_trailing_separators.ts";
import { isPathSeparator, isWindowsDeviceRoot } from "./_util.ts";
/**
 * Return the last portion of a `path`.
 * Trailing directory separators are ignored, and optional suffix is removed.
 *
 * @example
 * ```ts
 * import { basename } from "https://deno.land/std@$STD_VERSION/path/basename.ts";
 *
 * basename("C:\\user\\Documents\\"); // "Documents"
 * basename("C:\\user\\Documents\\image.png"); // "image.png"
 * basename("C:\\user\\Documents\\image.png", ".png"); // "image"
 * ```
 *
 * @param path - path to extract the name from.
 * @param [suffix] - suffix to remove from extracted name.
 */ export function basename(path, suffix = "") {
  assertArgs(path, suffix);
  // Check for a drive letter prefix so as not to mistake the following
  // path separator as an extra separator at the end of the path that can be
  // disregarded
  let start = 0;
  if (path.length >= 2) {
    const drive = path.charCodeAt(0);
    if (isWindowsDeviceRoot(drive)) {
      if (path.charCodeAt(1) === CHAR_COLON) start = 2;
    }
  }
  const lastSegment = lastPathSegment(path, isPathSeparator, start);
  const strippedSegment = stripTrailingSeparators(lastSegment, isPathSeparator);
  return suffix ? stripSuffix(strippedSegment, suffix) : strippedSegment;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyNC4wL3BhdGgvd2luZG93cy9iYXNlbmFtZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQge1xuICBhc3NlcnRBcmdzLFxuICBsYXN0UGF0aFNlZ21lbnQsXG4gIHN0cmlwU3VmZml4LFxufSBmcm9tIFwiLi4vX2NvbW1vbi9iYXNlbmFtZS50c1wiO1xuaW1wb3J0IHsgQ0hBUl9DT0xPTiB9IGZyb20gXCIuLi9fY29tbW9uL2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgc3RyaXBUcmFpbGluZ1NlcGFyYXRvcnMgfSBmcm9tIFwiLi4vX2NvbW1vbi9zdHJpcF90cmFpbGluZ19zZXBhcmF0b3JzLnRzXCI7XG5pbXBvcnQgeyBpc1BhdGhTZXBhcmF0b3IsIGlzV2luZG93c0RldmljZVJvb3QgfSBmcm9tIFwiLi9fdXRpbC50c1wiO1xuXG4vKipcbiAqIFJldHVybiB0aGUgbGFzdCBwb3J0aW9uIG9mIGEgYHBhdGhgLlxuICogVHJhaWxpbmcgZGlyZWN0b3J5IHNlcGFyYXRvcnMgYXJlIGlnbm9yZWQsIGFuZCBvcHRpb25hbCBzdWZmaXggaXMgcmVtb3ZlZC5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGJhc2VuYW1lIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vcGF0aC9iYXNlbmFtZS50c1wiO1xuICpcbiAqIGJhc2VuYW1lKFwiQzpcXFxcdXNlclxcXFxEb2N1bWVudHNcXFxcXCIpOyAvLyBcIkRvY3VtZW50c1wiXG4gKiBiYXNlbmFtZShcIkM6XFxcXHVzZXJcXFxcRG9jdW1lbnRzXFxcXGltYWdlLnBuZ1wiKTsgLy8gXCJpbWFnZS5wbmdcIlxuICogYmFzZW5hbWUoXCJDOlxcXFx1c2VyXFxcXERvY3VtZW50c1xcXFxpbWFnZS5wbmdcIiwgXCIucG5nXCIpOyAvLyBcImltYWdlXCJcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBwYXRoIC0gcGF0aCB0byBleHRyYWN0IHRoZSBuYW1lIGZyb20uXG4gKiBAcGFyYW0gW3N1ZmZpeF0gLSBzdWZmaXggdG8gcmVtb3ZlIGZyb20gZXh0cmFjdGVkIG5hbWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiYXNlbmFtZShwYXRoOiBzdHJpbmcsIHN1ZmZpeCA9IFwiXCIpOiBzdHJpbmcge1xuICBhc3NlcnRBcmdzKHBhdGgsIHN1ZmZpeCk7XG5cbiAgLy8gQ2hlY2sgZm9yIGEgZHJpdmUgbGV0dGVyIHByZWZpeCBzbyBhcyBub3QgdG8gbWlzdGFrZSB0aGUgZm9sbG93aW5nXG4gIC8vIHBhdGggc2VwYXJhdG9yIGFzIGFuIGV4dHJhIHNlcGFyYXRvciBhdCB0aGUgZW5kIG9mIHRoZSBwYXRoIHRoYXQgY2FuIGJlXG4gIC8vIGRpc3JlZ2FyZGVkXG4gIGxldCBzdGFydCA9IDA7XG4gIGlmIChwYXRoLmxlbmd0aCA+PSAyKSB7XG4gICAgY29uc3QgZHJpdmUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XG4gICAgaWYgKGlzV2luZG93c0RldmljZVJvb3QoZHJpdmUpKSB7XG4gICAgICBpZiAocGF0aC5jaGFyQ29kZUF0KDEpID09PSBDSEFSX0NPTE9OKSBzdGFydCA9IDI7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgbGFzdFNlZ21lbnQgPSBsYXN0UGF0aFNlZ21lbnQocGF0aCwgaXNQYXRoU2VwYXJhdG9yLCBzdGFydCk7XG4gIGNvbnN0IHN0cmlwcGVkU2VnbWVudCA9IHN0cmlwVHJhaWxpbmdTZXBhcmF0b3JzKGxhc3RTZWdtZW50LCBpc1BhdGhTZXBhcmF0b3IpO1xuICByZXR1cm4gc3VmZml4ID8gc3RyaXBTdWZmaXgoc3RyaXBwZWRTZWdtZW50LCBzdWZmaXgpIDogc3RyaXBwZWRTZWdtZW50O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsU0FDRSxVQUFVLEVBQ1YsZUFBZSxFQUNmLFdBQVcsUUFDTix5QkFBeUI7QUFDaEMsU0FBUyxVQUFVLFFBQVEsMEJBQTBCO0FBQ3JELFNBQVMsdUJBQXVCLFFBQVEsMENBQTBDO0FBQ2xGLFNBQVMsZUFBZSxFQUFFLG1CQUFtQixRQUFRLGFBQWE7QUFFbEU7Ozs7Ozs7Ozs7Ozs7OztDQWVDLEdBQ0QsT0FBTyxTQUFTLFNBQVMsSUFBWSxFQUFFLFNBQVMsRUFBRTtFQUNoRCxXQUFXLE1BQU07RUFFakIscUVBQXFFO0VBQ3JFLDBFQUEwRTtFQUMxRSxjQUFjO0VBQ2QsSUFBSSxRQUFRO0VBQ1osSUFBSSxLQUFLLE1BQU0sSUFBSSxHQUFHO0lBQ3BCLE1BQU0sUUFBUSxLQUFLLFVBQVUsQ0FBQztJQUM5QixJQUFJLG9CQUFvQixRQUFRO01BQzlCLElBQUksS0FBSyxVQUFVLENBQUMsT0FBTyxZQUFZLFFBQVE7SUFDakQ7RUFDRjtFQUVBLE1BQU0sY0FBYyxnQkFBZ0IsTUFBTSxpQkFBaUI7RUFDM0QsTUFBTSxrQkFBa0Isd0JBQXdCLGFBQWE7RUFDN0QsT0FBTyxTQUFTLFlBQVksaUJBQWlCLFVBQVU7QUFDekQifQ==
// denoCacheMetadata=16642890505833039086,12699204390232041208