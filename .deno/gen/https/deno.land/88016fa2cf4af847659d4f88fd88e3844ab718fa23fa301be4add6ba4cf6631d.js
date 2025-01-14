// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows } from "./_os.ts";
import { parse as posixParse } from "./posix/parse.ts";
import { parse as windowsParse } from "./windows/parse.ts";
/**
 * Return a `ParsedPath` object of the `path`. Use `format` to reverse the result.
 *
 * @example
 * ```ts
 * import { parse } from "https://deno.land/std@$STD_VERSION/path/mod.ts";
 *
 * const parsedPathObj = parse("/path/to/dir/script.ts");
 * parsedPathObj.root; // "/"
 * parsedPathObj.dir; // "/path/to/dir"
 * parsedPathObj.base; // "script.ts"
 * parsedPathObj.ext; // ".ts"
 * parsedPathObj.name; // "script"
 * ```
 * @param path to process
 */ export function parse(path) {
  return isWindows ? windowsParse(path) : posixParse(path);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyNC4wL3BhdGgvcGFyc2UudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSBcIi4vX29zLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFBhcnNlZFBhdGggfSBmcm9tIFwiLi9faW50ZXJmYWNlLnRzXCI7XG5pbXBvcnQgeyBwYXJzZSBhcyBwb3NpeFBhcnNlIH0gZnJvbSBcIi4vcG9zaXgvcGFyc2UudHNcIjtcbmltcG9ydCB7IHBhcnNlIGFzIHdpbmRvd3NQYXJzZSB9IGZyb20gXCIuL3dpbmRvd3MvcGFyc2UudHNcIjtcblxuZXhwb3J0IHR5cGUgeyBQYXJzZWRQYXRoIH0gZnJvbSBcIi4vX2ludGVyZmFjZS50c1wiO1xuXG4vKipcbiAqIFJldHVybiBhIGBQYXJzZWRQYXRoYCBvYmplY3Qgb2YgdGhlIGBwYXRoYC4gVXNlIGBmb3JtYXRgIHRvIHJldmVyc2UgdGhlIHJlc3VsdC5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IHBhcnNlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vcGF0aC9tb2QudHNcIjtcbiAqXG4gKiBjb25zdCBwYXJzZWRQYXRoT2JqID0gcGFyc2UoXCIvcGF0aC90by9kaXIvc2NyaXB0LnRzXCIpO1xuICogcGFyc2VkUGF0aE9iai5yb290OyAvLyBcIi9cIlxuICogcGFyc2VkUGF0aE9iai5kaXI7IC8vIFwiL3BhdGgvdG8vZGlyXCJcbiAqIHBhcnNlZFBhdGhPYmouYmFzZTsgLy8gXCJzY3JpcHQudHNcIlxuICogcGFyc2VkUGF0aE9iai5leHQ7IC8vIFwiLnRzXCJcbiAqIHBhcnNlZFBhdGhPYmoubmFtZTsgLy8gXCJzY3JpcHRcIlxuICogYGBgXG4gKiBAcGFyYW0gcGF0aCB0byBwcm9jZXNzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShwYXRoOiBzdHJpbmcpOiBQYXJzZWRQYXRoIHtcbiAgcmV0dXJuIGlzV2luZG93cyA/IHdpbmRvd3NQYXJzZShwYXRoKSA6IHBvc2l4UGFyc2UocGF0aCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyxTQUFTLFNBQVMsUUFBUSxXQUFXO0FBRXJDLFNBQVMsU0FBUyxVQUFVLFFBQVEsbUJBQW1CO0FBQ3ZELFNBQVMsU0FBUyxZQUFZLFFBQVEscUJBQXFCO0FBSTNEOzs7Ozs7Ozs7Ozs7Ozs7Q0FlQyxHQUNELE9BQU8sU0FBUyxNQUFNLElBQVk7RUFDaEMsT0FBTyxZQUFZLGFBQWEsUUFBUSxXQUFXO0FBQ3JEIn0=
// denoCacheMetadata=16274036899495718382,2766767946466650058