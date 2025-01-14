// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { basename as posixBasename } from "./posix/basename.ts";
import { basename as windowsBasename } from "./windows/basename.ts";
/**
 * Return the last portion of a `path`.
 * Trailing directory separators are ignored, and optional suffix is removed.
 *
 * @example
 * ```ts
 * import { basename } from "https://deno.land/std@$STD_VERSION/path/basename.ts";
 *
 * basename("/home/user/Documents/"); // "Documents"
 * basename("C:\\user\\Documents\\image.png"); // "image.png"
 * basename("/home/user/Documents/image.png", ".png"); // "image"
 * ```
 *
 * @param path - path to extract the name from.
 * @param [suffix] - suffix to remove from extracted name.
 */ export function basename(path, suffix = "") {
  return isWindows ? windowsBasename(path, suffix) : posixBasename(path, suffix);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyNC4wL3BhdGgvYmFzZW5hbWUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSBcIi4vX29zLnRzXCI7XG5pbXBvcnQgeyBiYXNlbmFtZSBhcyBwb3NpeEJhc2VuYW1lIH0gZnJvbSBcIi4vcG9zaXgvYmFzZW5hbWUudHNcIjtcbmltcG9ydCB7IGJhc2VuYW1lIGFzIHdpbmRvd3NCYXNlbmFtZSB9IGZyb20gXCIuL3dpbmRvd3MvYmFzZW5hbWUudHNcIjtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGxhc3QgcG9ydGlvbiBvZiBhIGBwYXRoYC5cbiAqIFRyYWlsaW5nIGRpcmVjdG9yeSBzZXBhcmF0b3JzIGFyZSBpZ25vcmVkLCBhbmQgb3B0aW9uYWwgc3VmZml4IGlzIHJlbW92ZWQuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBiYXNlbmFtZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3BhdGgvYmFzZW5hbWUudHNcIjtcbiAqXG4gKiBiYXNlbmFtZShcIi9ob21lL3VzZXIvRG9jdW1lbnRzL1wiKTsgLy8gXCJEb2N1bWVudHNcIlxuICogYmFzZW5hbWUoXCJDOlxcXFx1c2VyXFxcXERvY3VtZW50c1xcXFxpbWFnZS5wbmdcIik7IC8vIFwiaW1hZ2UucG5nXCJcbiAqIGJhc2VuYW1lKFwiL2hvbWUvdXNlci9Eb2N1bWVudHMvaW1hZ2UucG5nXCIsIFwiLnBuZ1wiKTsgLy8gXCJpbWFnZVwiXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gcGF0aCAtIHBhdGggdG8gZXh0cmFjdCB0aGUgbmFtZSBmcm9tLlxuICogQHBhcmFtIFtzdWZmaXhdIC0gc3VmZml4IHRvIHJlbW92ZSBmcm9tIGV4dHJhY3RlZCBuYW1lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmFzZW5hbWUocGF0aDogc3RyaW5nLCBzdWZmaXggPSBcIlwiKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlzV2luZG93c1xuICAgID8gd2luZG93c0Jhc2VuYW1lKHBhdGgsIHN1ZmZpeClcbiAgICA6IHBvc2l4QmFzZW5hbWUocGF0aCwgc3VmZml4KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsU0FBUyxRQUFRLFdBQVc7QUFDckMsU0FBUyxZQUFZLGFBQWEsUUFBUSxzQkFBc0I7QUFDaEUsU0FBUyxZQUFZLGVBQWUsUUFBUSx3QkFBd0I7QUFFcEU7Ozs7Ozs7Ozs7Ozs7OztDQWVDLEdBQ0QsT0FBTyxTQUFTLFNBQVMsSUFBWSxFQUFFLFNBQVMsRUFBRTtFQUNoRCxPQUFPLFlBQ0gsZ0JBQWdCLE1BQU0sVUFDdEIsY0FBYyxNQUFNO0FBQzFCIn0=
// denoCacheMetadata=2246862110536259559,17555885448430761513