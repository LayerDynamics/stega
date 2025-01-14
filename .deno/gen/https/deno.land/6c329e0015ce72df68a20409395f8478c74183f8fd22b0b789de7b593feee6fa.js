// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported mostly from https://github.com/browserify/path-browserify/
// This module is browser compatible.
/**
 * Utilities for working with OS-specific file paths.
 *
 * Functions from this module will automatically switch to support the path style
 * of the current OS, either `windows` for Microsoft Windows, or `posix` for
 * every other operating system, eg. Linux, MacOS, BSD etc.
 *
 * To use functions for a specific path style regardless of the current OS
 * import the modules from the platform sub directory instead.
 *
 * Example, for `posix`:
 *
 * ```ts
 * import { fromFileUrl } from "https://deno.land/std@$STD_VERSION/path/posix/from_file_url.ts";
 * const p = fromFileUrl("file:///home/foo");
 * console.log(p); // "/home/foo"
 * ```
 *
 * or, for `windows`:
 *
 * ```ts
 * import { fromFileUrl } from "https://deno.land/std@$STD_VERSION/path/windows/from_file_url.ts";
 * const p = fromFileUrl("file:///home/foo");
 * console.log(p); // "\\home\\foo"
 * ```
 *
 * This module is browser compatible.
 *
 * @module
 */ import * as _windows from "./windows/mod.ts";
import * as _posix from "./posix/mod.ts";
/** @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/path/windows/mod.ts} instead. */ export const win32 = _windows;
/** @deprecated This will be removed in 1.0.0. Import from {@link https://deno.land/std/path/posix/mod.ts} instead. */ export const posix = _posix;
export * from "./basename.ts";
export * from "./constants.ts";
export * from "./dirname.ts";
export * from "./extname.ts";
export * from "./format.ts";
export * from "./from_file_url.ts";
export * from "./is_absolute.ts";
export * from "./join.ts";
export * from "./normalize.ts";
export * from "./parse.ts";
export * from "./relative.ts";
export * from "./resolve.ts";
export * from "./to_file_url.ts";
export * from "./to_namespaced_path.ts";
export * from "./common.ts";
export * from "./_interface.ts";
export * from "./glob_to_regexp.ts";
export * from "./is_glob.ts";
export * from "./join_globs.ts";
export * from "./normalize_glob.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyNC4wL3BhdGgvbW9kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgdGhlIEJyb3dzZXJpZnkgYXV0aG9ycy4gTUlUIExpY2Vuc2UuXG4vLyBQb3J0ZWQgbW9zdGx5IGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2Jyb3dzZXJpZnkvcGF0aC1icm93c2VyaWZ5L1xuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIFV0aWxpdGllcyBmb3Igd29ya2luZyB3aXRoIE9TLXNwZWNpZmljIGZpbGUgcGF0aHMuXG4gKlxuICogRnVuY3Rpb25zIGZyb20gdGhpcyBtb2R1bGUgd2lsbCBhdXRvbWF0aWNhbGx5IHN3aXRjaCB0byBzdXBwb3J0IHRoZSBwYXRoIHN0eWxlXG4gKiBvZiB0aGUgY3VycmVudCBPUywgZWl0aGVyIGB3aW5kb3dzYCBmb3IgTWljcm9zb2Z0IFdpbmRvd3MsIG9yIGBwb3NpeGAgZm9yXG4gKiBldmVyeSBvdGhlciBvcGVyYXRpbmcgc3lzdGVtLCBlZy4gTGludXgsIE1hY09TLCBCU0QgZXRjLlxuICpcbiAqIFRvIHVzZSBmdW5jdGlvbnMgZm9yIGEgc3BlY2lmaWMgcGF0aCBzdHlsZSByZWdhcmRsZXNzIG9mIHRoZSBjdXJyZW50IE9TXG4gKiBpbXBvcnQgdGhlIG1vZHVsZXMgZnJvbSB0aGUgcGxhdGZvcm0gc3ViIGRpcmVjdG9yeSBpbnN0ZWFkLlxuICpcbiAqIEV4YW1wbGUsIGZvciBgcG9zaXhgOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBmcm9tRmlsZVVybCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL3BhdGgvcG9zaXgvZnJvbV9maWxlX3VybC50c1wiO1xuICogY29uc3QgcCA9IGZyb21GaWxlVXJsKFwiZmlsZTovLy9ob21lL2Zvb1wiKTtcbiAqIGNvbnNvbGUubG9nKHApOyAvLyBcIi9ob21lL2Zvb1wiXG4gKiBgYGBcbiAqXG4gKiBvciwgZm9yIGB3aW5kb3dzYDpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZnJvbUZpbGVVcmwgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9wYXRoL3dpbmRvd3MvZnJvbV9maWxlX3VybC50c1wiO1xuICogY29uc3QgcCA9IGZyb21GaWxlVXJsKFwiZmlsZTovLy9ob21lL2Zvb1wiKTtcbiAqIGNvbnNvbGUubG9nKHApOyAvLyBcIlxcXFxob21lXFxcXGZvb1wiXG4gKiBgYGBcbiAqXG4gKiBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmltcG9ydCAqIGFzIF93aW5kb3dzIGZyb20gXCIuL3dpbmRvd3MvbW9kLnRzXCI7XG5pbXBvcnQgKiBhcyBfcG9zaXggZnJvbSBcIi4vcG9zaXgvbW9kLnRzXCI7XG5cbi8qKiBAZGVwcmVjYXRlZCBUaGlzIHdpbGwgYmUgcmVtb3ZlZCBpbiAxLjAuMC4gSW1wb3J0IGZyb20ge0BsaW5rIGh0dHBzOi8vZGVuby5sYW5kL3N0ZC9wYXRoL3dpbmRvd3MvbW9kLnRzfSBpbnN0ZWFkLiAqL1xuZXhwb3J0IGNvbnN0IHdpbjMyOiB0eXBlb2YgX3dpbmRvd3MgPSBfd2luZG93cztcblxuLyoqIEBkZXByZWNhdGVkIFRoaXMgd2lsbCBiZSByZW1vdmVkIGluIDEuMC4wLiBJbXBvcnQgZnJvbSB7QGxpbmsgaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL3BhdGgvcG9zaXgvbW9kLnRzfSBpbnN0ZWFkLiAqL1xuZXhwb3J0IGNvbnN0IHBvc2l4OiB0eXBlb2YgX3Bvc2l4ID0gX3Bvc2l4O1xuXG5leHBvcnQgKiBmcm9tIFwiLi9iYXNlbmFtZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vY29uc3RhbnRzLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9kaXJuYW1lLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9leHRuYW1lLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9mb3JtYXQudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2Zyb21fZmlsZV91cmwudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2lzX2Fic29sdXRlLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9qb2luLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9ub3JtYWxpemUudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3BhcnNlLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9yZWxhdGl2ZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vcmVzb2x2ZS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vdG9fZmlsZV91cmwudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3RvX25hbWVzcGFjZWRfcGF0aC50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vY29tbW9uLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9faW50ZXJmYWNlLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9nbG9iX3RvX3JlZ2V4cC50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vaXNfZ2xvYi50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vam9pbl9nbG9icy50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vbm9ybWFsaXplX2dsb2IudHNcIjtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUsaURBQWlEO0FBQ2pELG9FQUFvRTtBQUNwRSxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBNkJDLEdBRUQsWUFBWSxjQUFjLG1CQUFtQjtBQUM3QyxZQUFZLFlBQVksaUJBQWlCO0FBRXpDLHNIQUFzSCxHQUN0SCxPQUFPLE1BQU0sUUFBeUIsU0FBUztBQUUvQyxvSEFBb0gsR0FDcEgsT0FBTyxNQUFNLFFBQXVCLE9BQU87QUFFM0MsY0FBYyxnQkFBZ0I7QUFDOUIsY0FBYyxpQkFBaUI7QUFDL0IsY0FBYyxlQUFlO0FBQzdCLGNBQWMsZUFBZTtBQUM3QixjQUFjLGNBQWM7QUFDNUIsY0FBYyxxQkFBcUI7QUFDbkMsY0FBYyxtQkFBbUI7QUFDakMsY0FBYyxZQUFZO0FBQzFCLGNBQWMsaUJBQWlCO0FBQy9CLGNBQWMsYUFBYTtBQUMzQixjQUFjLGdCQUFnQjtBQUM5QixjQUFjLGVBQWU7QUFDN0IsY0FBYyxtQkFBbUI7QUFDakMsY0FBYywwQkFBMEI7QUFDeEMsY0FBYyxjQUFjO0FBQzVCLGNBQWMsa0JBQWtCO0FBQ2hDLGNBQWMsc0JBQXNCO0FBQ3BDLGNBQWMsZUFBZTtBQUM3QixjQUFjLGtCQUFrQjtBQUNoQyxjQUFjLHNCQUFzQiJ9
// denoCacheMetadata=16873816947962341371,2735679392397502580