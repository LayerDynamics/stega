// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/** Options for {@linkcode exists} and {@linkcode existsSync.} */ /**
 * Asynchronously test whether or not the given path exists by checking with
 * the file system.
 *
 * Note: Do not use this function if performing a check before another operation
 * on that file. Doing so creates a race condition. Instead, perform the actual
 * file operation directly. This function is not recommended for this use case.
 * See the recommended method below.
 *
 * @see https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use
 *
 * @param path The path to the file or directory, as a string or URL.
 * @param options Additional options for the check.
 * @returns A promise that resolves with `true` if the path exists, `false`
 * otherwise.
 *
 * @example Recommended method
 * ```ts
 * // Notice no use of exists
 * try {
 *   await Deno.remove("./foo", { recursive: true });
 * } catch (error) {
 *   if (!(error instanceof Deno.errors.NotFound)) {
 *     throw error;
 *   }
 *   // Do nothing...
 * }
 * ```
 *
 * Notice that `exists()` is not used in the above example. Doing so avoids a
 * possible race condition. See the above section for details.
 *
 * @example Basic usage
 * ```ts
 * import { exists } from "https://deno.land/std@$STD_VERSION/fs/exists.ts";
 *
 * await exists("./exists"); // true
 * await exists("./does_not_exist"); // false
 * ```
 *
 * @example Check if a path is readable
 * ```ts
 * import { exists } from "https://deno.land/std@$STD_VERSION/fs/exists.ts";
 *
 * await exists("./readable", { isReadable: true }); // true
 * await exists("./not_readable", { isReadable: true }); // false
 * ```
 *
 * @example Check if a path is a directory
 * ```ts
 * import { exists } from "https://deno.land/std@$STD_VERSION/fs/exists.ts";
 *
 * await exists("./directory", { isDirectory: true }); // true
 * await exists("./file", { isDirectory: true }); // false
 * ```
 *
 * @example Check if a path is a file
 * ```ts
 * import { exists } from "https://deno.land/std@$STD_VERSION/fs/exists.ts";
 *
 * await exists("./file", { isFile: true }); // true
 * await exists("./directory", { isFile: true }); // false
 * ```
 *
 * @example Check if a path is a readable directory
 * ```ts
 * import { exists } from "https://deno.land/std@$STD_VERSION/fs/exists.ts";
 *
 * await exists("./readable_directory", { isReadable: true, isDirectory: true }); // true
 * await exists("./not_readable_directory", { isReadable: true, isDirectory: true }); // false
 * ```
 *
 * @example Check if a path is a readable file
 * ```ts
 * import { exists } from "https://deno.land/std@$STD_VERSION/fs/exists.ts";
 *
 * await exists("./readable_file", { isReadable: true, isFile: true }); // true
 * await exists("./not_readable_file", { isReadable: true, isFile: true }); // false
 * ```
 */ export async function exists(path, options) {
  try {
    const stat = await Deno.stat(path);
    if (options && (options.isReadable || options.isDirectory || options.isFile)) {
      if (options.isDirectory && options.isFile) {
        throw new TypeError("ExistsOptions.options.isDirectory and ExistsOptions.options.isFile must not be true together.");
      }
      if (options.isDirectory && !stat.isDirectory || options.isFile && !stat.isFile) {
        return false;
      }
      if (options.isReadable) {
        if (stat.mode === null) {
          return true; // Exclusive on Non-POSIX systems
        }
        if (Deno.uid() === stat.uid) {
          return (stat.mode & 0o400) === 0o400; // User is owner and can read?
        } else if (Deno.gid() === stat.gid) {
          return (stat.mode & 0o040) === 0o040; // User group is owner and can read?
        }
        return (stat.mode & 0o004) === 0o004; // Others can read?
      }
    }
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    if (error instanceof Deno.errors.PermissionDenied) {
      if ((await Deno.permissions.query({
        name: "read",
        path
      })).state === "granted") {
        // --allow-read not missing
        return !options?.isReadable; // PermissionDenied was raised by file system, so the item exists, but can't be read
      }
    }
    throw error;
  }
}
/**
 * Synchronously test whether or not the given path exists by checking with
 * the file system.
 *
 * Note: Do not use this function if performing a check before another operation
 * on that file. Doing so creates a race condition. Instead, perform the actual
 * file operation directly. This function is not recommended for this use case.
 * See the recommended method below.
 *
 * @see https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use
 *
 * @param path The path to the file or directory, as a string or URL.
 * @param options Additional options for the check.
 * @returns `true` if the path exists, `false` otherwise.
 *
 * @example Recommended method
 * ```ts
 * // Notice no use of exists
 * try {
 *   Deno.removeSync("./foo", { recursive: true });
 * } catch (error) {
 *   if (!(error instanceof Deno.errors.NotFound)) {
 *     throw error;
 *   }
 *   // Do nothing...
 * }
 * ```
 *
 * Notice that `existsSync()` is not used in the above example. Doing so avoids
 * a possible race condition. See the above section for details.
 *
 * @example Basic usage
 * ```ts
 * import { existsSync } from "https://deno.land/std@$STD_VERSION/fs/exists.ts";
 *
 * existsSync("./exists"); // true
 * existsSync("./does_not_exist"); // false
 * ```
 *
 * @example Check if a path is readable
 * ```ts
 * import { existsSync } from "https://deno.land/std@$STD_VERSION/fs/exists.ts";
 *
 * existsSync("./readable", { isReadable: true }); // true
 * existsSync("./not_readable", { isReadable: true }); // false
 * ```
 *
 * @example Check if a path is a directory
 * ```ts
 * import { existsSync } from "https://deno.land/std@$STD_VERSION/fs/exists.ts";
 *
 * existsSync("./directory", { isDirectory: true }); // true
 * existsSync("./file", { isDirectory: true }); // false
 * ```
 *
 * @example Check if a path is a file
 * ```ts
 * import { existsSync } from "https://deno.land/std@$STD_VERSION/fs/exists.ts";
 *
 * existsSync("./file", { isFile: true }); // true
 * existsSync("./directory", { isFile: true }); // false
 * ```
 *
 * @example Check if a path is a readable directory
 * ```ts
 * import { existsSync } from "https://deno.land/std@$STD_VERSION/fs/exists.ts";
 *
 * existsSync("./readable_directory", { isReadable: true, isDirectory: true }); // true
 * existsSync("./not_readable_directory", { isReadable: true, isDirectory: true }); // false
 * ```
 *
 * @example Check if a path is a readable file
 * ```ts
 * import { existsSync } from "https://deno.land/std@$STD_VERSION/fs/exists.ts";
 *
 * existsSync("./readable_file", { isReadable: true, isFile: true }); // true
 * existsSync("./not_readable_file", { isReadable: true, isFile: true }); // false
 * ```
 */ export function existsSync(path, options) {
  try {
    const stat = Deno.statSync(path);
    if (options && (options.isReadable || options.isDirectory || options.isFile)) {
      if (options.isDirectory && options.isFile) {
        throw new TypeError("ExistsOptions.options.isDirectory and ExistsOptions.options.isFile must not be true together.");
      }
      if (options.isDirectory && !stat.isDirectory || options.isFile && !stat.isFile) {
        return false;
      }
      if (options.isReadable) {
        if (stat.mode === null) {
          return true; // Exclusive on Non-POSIX systems
        }
        if (Deno.uid() === stat.uid) {
          return (stat.mode & 0o400) === 0o400; // User is owner and can read?
        } else if (Deno.gid() === stat.gid) {
          return (stat.mode & 0o040) === 0o040; // User group is owner and can read?
        }
        return (stat.mode & 0o004) === 0o004; // Others can read?
      }
    }
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    if (error instanceof Deno.errors.PermissionDenied) {
      if (Deno.permissions.querySync({
        name: "read",
        path
      }).state === "granted") {
        // --allow-read not missing
        return !options?.isReadable; // PermissionDenied was raised by file system, so the item exists, but can't be read
      }
    }
    throw error;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyNC4wL2ZzL2V4aXN0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG4vKiogT3B0aW9ucyBmb3Ige0BsaW5rY29kZSBleGlzdHN9IGFuZCB7QGxpbmtjb2RlIGV4aXN0c1N5bmMufSAqL1xuZXhwb3J0IGludGVyZmFjZSBFeGlzdHNPcHRpb25zIHtcbiAgLyoqXG4gICAqIFdoZW4gYHRydWVgLCB3aWxsIGNoZWNrIGlmIHRoZSBwYXRoIGlzIHJlYWRhYmxlIGJ5IHRoZSB1c2VyIGFzIHdlbGwuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtmYWxzZX1cbiAgICovXG4gIGlzUmVhZGFibGU/OiBib29sZWFuO1xuICAvKipcbiAgICogV2hlbiBgdHJ1ZWAsIHdpbGwgY2hlY2sgaWYgdGhlIHBhdGggaXMgYSBkaXJlY3RvcnkgYXMgd2VsbC4gRGlyZWN0b3J5XG4gICAqIHN5bWxpbmtzIGFyZSBpbmNsdWRlZC5cbiAgICpcbiAgICogQGRlZmF1bHQge2ZhbHNlfVxuICAgKi9cbiAgaXNEaXJlY3Rvcnk/OiBib29sZWFuO1xuICAvKipcbiAgICogV2hlbiBgdHJ1ZWAsIHdpbGwgY2hlY2sgaWYgdGhlIHBhdGggaXMgYSBmaWxlIGFzIHdlbGwuIEZpbGUgc3ltbGlua3MgYXJlXG4gICAqIGluY2x1ZGVkLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7ZmFsc2V9XG4gICAqL1xuICBpc0ZpbGU/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIEFzeW5jaHJvbm91c2x5IHRlc3Qgd2hldGhlciBvciBub3QgdGhlIGdpdmVuIHBhdGggZXhpc3RzIGJ5IGNoZWNraW5nIHdpdGhcbiAqIHRoZSBmaWxlIHN5c3RlbS5cbiAqXG4gKiBOb3RlOiBEbyBub3QgdXNlIHRoaXMgZnVuY3Rpb24gaWYgcGVyZm9ybWluZyBhIGNoZWNrIGJlZm9yZSBhbm90aGVyIG9wZXJhdGlvblxuICogb24gdGhhdCBmaWxlLiBEb2luZyBzbyBjcmVhdGVzIGEgcmFjZSBjb25kaXRpb24uIEluc3RlYWQsIHBlcmZvcm0gdGhlIGFjdHVhbFxuICogZmlsZSBvcGVyYXRpb24gZGlyZWN0bHkuIFRoaXMgZnVuY3Rpb24gaXMgbm90IHJlY29tbWVuZGVkIGZvciB0aGlzIHVzZSBjYXNlLlxuICogU2VlIHRoZSByZWNvbW1lbmRlZCBtZXRob2QgYmVsb3cuXG4gKlxuICogQHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9UaW1lLW9mLWNoZWNrX3RvX3RpbWUtb2YtdXNlXG4gKlxuICogQHBhcmFtIHBhdGggVGhlIHBhdGggdG8gdGhlIGZpbGUgb3IgZGlyZWN0b3J5LCBhcyBhIHN0cmluZyBvciBVUkwuXG4gKiBAcGFyYW0gb3B0aW9ucyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIHRoZSBjaGVjay5cbiAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggYHRydWVgIGlmIHRoZSBwYXRoIGV4aXN0cywgYGZhbHNlYFxuICogb3RoZXJ3aXNlLlxuICpcbiAqIEBleGFtcGxlIFJlY29tbWVuZGVkIG1ldGhvZFxuICogYGBgdHNcbiAqIC8vIE5vdGljZSBubyB1c2Ugb2YgZXhpc3RzXG4gKiB0cnkge1xuICogICBhd2FpdCBEZW5vLnJlbW92ZShcIi4vZm9vXCIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICogfSBjYXRjaCAoZXJyb3IpIHtcbiAqICAgaWYgKCEoZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkpIHtcbiAqICAgICB0aHJvdyBlcnJvcjtcbiAqICAgfVxuICogICAvLyBEbyBub3RoaW5nLi4uXG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBOb3RpY2UgdGhhdCBgZXhpc3RzKClgIGlzIG5vdCB1c2VkIGluIHRoZSBhYm92ZSBleGFtcGxlLiBEb2luZyBzbyBhdm9pZHMgYVxuICogcG9zc2libGUgcmFjZSBjb25kaXRpb24uIFNlZSB0aGUgYWJvdmUgc2VjdGlvbiBmb3IgZGV0YWlscy5cbiAqXG4gKiBAZXhhbXBsZSBCYXNpYyB1c2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGV4aXN0cyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2ZzL2V4aXN0cy50c1wiO1xuICpcbiAqIGF3YWl0IGV4aXN0cyhcIi4vZXhpc3RzXCIpOyAvLyB0cnVlXG4gKiBhd2FpdCBleGlzdHMoXCIuL2RvZXNfbm90X2V4aXN0XCIpOyAvLyBmYWxzZVxuICogYGBgXG4gKlxuICogQGV4YW1wbGUgQ2hlY2sgaWYgYSBwYXRoIGlzIHJlYWRhYmxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXhpc3RzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZnMvZXhpc3RzLnRzXCI7XG4gKlxuICogYXdhaXQgZXhpc3RzKFwiLi9yZWFkYWJsZVwiLCB7IGlzUmVhZGFibGU6IHRydWUgfSk7IC8vIHRydWVcbiAqIGF3YWl0IGV4aXN0cyhcIi4vbm90X3JlYWRhYmxlXCIsIHsgaXNSZWFkYWJsZTogdHJ1ZSB9KTsgLy8gZmFsc2VcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIENoZWNrIGlmIGEgcGF0aCBpcyBhIGRpcmVjdG9yeVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGV4aXN0cyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2ZzL2V4aXN0cy50c1wiO1xuICpcbiAqIGF3YWl0IGV4aXN0cyhcIi4vZGlyZWN0b3J5XCIsIHsgaXNEaXJlY3Rvcnk6IHRydWUgfSk7IC8vIHRydWVcbiAqIGF3YWl0IGV4aXN0cyhcIi4vZmlsZVwiLCB7IGlzRGlyZWN0b3J5OiB0cnVlIH0pOyAvLyBmYWxzZVxuICogYGBgXG4gKlxuICogQGV4YW1wbGUgQ2hlY2sgaWYgYSBwYXRoIGlzIGEgZmlsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGV4aXN0cyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2ZzL2V4aXN0cy50c1wiO1xuICpcbiAqIGF3YWl0IGV4aXN0cyhcIi4vZmlsZVwiLCB7IGlzRmlsZTogdHJ1ZSB9KTsgLy8gdHJ1ZVxuICogYXdhaXQgZXhpc3RzKFwiLi9kaXJlY3RvcnlcIiwgeyBpc0ZpbGU6IHRydWUgfSk7IC8vIGZhbHNlXG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZSBDaGVjayBpZiBhIHBhdGggaXMgYSByZWFkYWJsZSBkaXJlY3RvcnlcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBleGlzdHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9mcy9leGlzdHMudHNcIjtcbiAqXG4gKiBhd2FpdCBleGlzdHMoXCIuL3JlYWRhYmxlX2RpcmVjdG9yeVwiLCB7IGlzUmVhZGFibGU6IHRydWUsIGlzRGlyZWN0b3J5OiB0cnVlIH0pOyAvLyB0cnVlXG4gKiBhd2FpdCBleGlzdHMoXCIuL25vdF9yZWFkYWJsZV9kaXJlY3RvcnlcIiwgeyBpc1JlYWRhYmxlOiB0cnVlLCBpc0RpcmVjdG9yeTogdHJ1ZSB9KTsgLy8gZmFsc2VcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIENoZWNrIGlmIGEgcGF0aCBpcyBhIHJlYWRhYmxlIGZpbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBleGlzdHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9mcy9leGlzdHMudHNcIjtcbiAqXG4gKiBhd2FpdCBleGlzdHMoXCIuL3JlYWRhYmxlX2ZpbGVcIiwgeyBpc1JlYWRhYmxlOiB0cnVlLCBpc0ZpbGU6IHRydWUgfSk7IC8vIHRydWVcbiAqIGF3YWl0IGV4aXN0cyhcIi4vbm90X3JlYWRhYmxlX2ZpbGVcIiwgeyBpc1JlYWRhYmxlOiB0cnVlLCBpc0ZpbGU6IHRydWUgfSk7IC8vIGZhbHNlXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4aXN0cyhcbiAgcGF0aDogc3RyaW5nIHwgVVJMLFxuICBvcHRpb25zPzogRXhpc3RzT3B0aW9ucyxcbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICB0cnkge1xuICAgIGNvbnN0IHN0YXQgPSBhd2FpdCBEZW5vLnN0YXQocGF0aCk7XG4gICAgaWYgKFxuICAgICAgb3B0aW9ucyAmJlxuICAgICAgKG9wdGlvbnMuaXNSZWFkYWJsZSB8fCBvcHRpb25zLmlzRGlyZWN0b3J5IHx8IG9wdGlvbnMuaXNGaWxlKVxuICAgICkge1xuICAgICAgaWYgKG9wdGlvbnMuaXNEaXJlY3RvcnkgJiYgb3B0aW9ucy5pc0ZpbGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICBcIkV4aXN0c09wdGlvbnMub3B0aW9ucy5pc0RpcmVjdG9yeSBhbmQgRXhpc3RzT3B0aW9ucy5vcHRpb25zLmlzRmlsZSBtdXN0IG5vdCBiZSB0cnVlIHRvZ2V0aGVyLlwiLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKFxuICAgICAgICAob3B0aW9ucy5pc0RpcmVjdG9yeSAmJiAhc3RhdC5pc0RpcmVjdG9yeSkgfHxcbiAgICAgICAgKG9wdGlvbnMuaXNGaWxlICYmICFzdGF0LmlzRmlsZSlcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucy5pc1JlYWRhYmxlKSB7XG4gICAgICAgIGlmIChzdGF0Lm1vZGUgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gRXhjbHVzaXZlIG9uIE5vbi1QT1NJWCBzeXN0ZW1zXG4gICAgICAgIH1cbiAgICAgICAgaWYgKERlbm8udWlkKCkgPT09IHN0YXQudWlkKSB7XG4gICAgICAgICAgcmV0dXJuIChzdGF0Lm1vZGUgJiAwbzQwMCkgPT09IDBvNDAwOyAvLyBVc2VyIGlzIG93bmVyIGFuZCBjYW4gcmVhZD9cbiAgICAgICAgfSBlbHNlIGlmIChEZW5vLmdpZCgpID09PSBzdGF0LmdpZCkge1xuICAgICAgICAgIHJldHVybiAoc3RhdC5tb2RlICYgMG8wNDApID09PSAwbzA0MDsgLy8gVXNlciBncm91cCBpcyBvd25lciBhbmQgY2FuIHJlYWQ/XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChzdGF0Lm1vZGUgJiAwbzAwNCkgPT09IDBvMDA0OyAvLyBPdGhlcnMgY2FuIHJlYWQ/XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLlBlcm1pc3Npb25EZW5pZWQpIHtcbiAgICAgIGlmIChcbiAgICAgICAgKGF3YWl0IERlbm8ucGVybWlzc2lvbnMucXVlcnkoeyBuYW1lOiBcInJlYWRcIiwgcGF0aCB9KSkuc3RhdGUgPT09XG4gICAgICAgICAgXCJncmFudGVkXCJcbiAgICAgICkge1xuICAgICAgICAvLyAtLWFsbG93LXJlYWQgbm90IG1pc3NpbmdcbiAgICAgICAgcmV0dXJuICFvcHRpb25zPy5pc1JlYWRhYmxlOyAvLyBQZXJtaXNzaW9uRGVuaWVkIHdhcyByYWlzZWQgYnkgZmlsZSBzeXN0ZW0sIHNvIHRoZSBpdGVtIGV4aXN0cywgYnV0IGNhbid0IGJlIHJlYWRcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHRlc3Qgd2hldGhlciBvciBub3QgdGhlIGdpdmVuIHBhdGggZXhpc3RzIGJ5IGNoZWNraW5nIHdpdGhcbiAqIHRoZSBmaWxlIHN5c3RlbS5cbiAqXG4gKiBOb3RlOiBEbyBub3QgdXNlIHRoaXMgZnVuY3Rpb24gaWYgcGVyZm9ybWluZyBhIGNoZWNrIGJlZm9yZSBhbm90aGVyIG9wZXJhdGlvblxuICogb24gdGhhdCBmaWxlLiBEb2luZyBzbyBjcmVhdGVzIGEgcmFjZSBjb25kaXRpb24uIEluc3RlYWQsIHBlcmZvcm0gdGhlIGFjdHVhbFxuICogZmlsZSBvcGVyYXRpb24gZGlyZWN0bHkuIFRoaXMgZnVuY3Rpb24gaXMgbm90IHJlY29tbWVuZGVkIGZvciB0aGlzIHVzZSBjYXNlLlxuICogU2VlIHRoZSByZWNvbW1lbmRlZCBtZXRob2QgYmVsb3cuXG4gKlxuICogQHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9UaW1lLW9mLWNoZWNrX3RvX3RpbWUtb2YtdXNlXG4gKlxuICogQHBhcmFtIHBhdGggVGhlIHBhdGggdG8gdGhlIGZpbGUgb3IgZGlyZWN0b3J5LCBhcyBhIHN0cmluZyBvciBVUkwuXG4gKiBAcGFyYW0gb3B0aW9ucyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIHRoZSBjaGVjay5cbiAqIEByZXR1cm5zIGB0cnVlYCBpZiB0aGUgcGF0aCBleGlzdHMsIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICpcbiAqIEBleGFtcGxlIFJlY29tbWVuZGVkIG1ldGhvZFxuICogYGBgdHNcbiAqIC8vIE5vdGljZSBubyB1c2Ugb2YgZXhpc3RzXG4gKiB0cnkge1xuICogICBEZW5vLnJlbW92ZVN5bmMoXCIuL2Zvb1wiLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAqIH0gY2F0Y2ggKGVycm9yKSB7XG4gKiAgIGlmICghKGVycm9yIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuTm90Rm91bmQpKSB7XG4gKiAgICAgdGhyb3cgZXJyb3I7XG4gKiAgIH1cbiAqICAgLy8gRG8gbm90aGluZy4uLlxuICogfVxuICogYGBgXG4gKlxuICogTm90aWNlIHRoYXQgYGV4aXN0c1N5bmMoKWAgaXMgbm90IHVzZWQgaW4gdGhlIGFib3ZlIGV4YW1wbGUuIERvaW5nIHNvIGF2b2lkc1xuICogYSBwb3NzaWJsZSByYWNlIGNvbmRpdGlvbi4gU2VlIHRoZSBhYm92ZSBzZWN0aW9uIGZvciBkZXRhaWxzLlxuICpcbiAqIEBleGFtcGxlIEJhc2ljIHVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2ZzL2V4aXN0cy50c1wiO1xuICpcbiAqIGV4aXN0c1N5bmMoXCIuL2V4aXN0c1wiKTsgLy8gdHJ1ZVxuICogZXhpc3RzU3luYyhcIi4vZG9lc19ub3RfZXhpc3RcIik7IC8vIGZhbHNlXG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZSBDaGVjayBpZiBhIHBhdGggaXMgcmVhZGFibGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBleGlzdHNTeW5jIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vZnMvZXhpc3RzLnRzXCI7XG4gKlxuICogZXhpc3RzU3luYyhcIi4vcmVhZGFibGVcIiwgeyBpc1JlYWRhYmxlOiB0cnVlIH0pOyAvLyB0cnVlXG4gKiBleGlzdHNTeW5jKFwiLi9ub3RfcmVhZGFibGVcIiwgeyBpc1JlYWRhYmxlOiB0cnVlIH0pOyAvLyBmYWxzZVxuICogYGBgXG4gKlxuICogQGV4YW1wbGUgQ2hlY2sgaWYgYSBwYXRoIGlzIGEgZGlyZWN0b3J5XG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2ZzL2V4aXN0cy50c1wiO1xuICpcbiAqIGV4aXN0c1N5bmMoXCIuL2RpcmVjdG9yeVwiLCB7IGlzRGlyZWN0b3J5OiB0cnVlIH0pOyAvLyB0cnVlXG4gKiBleGlzdHNTeW5jKFwiLi9maWxlXCIsIHsgaXNEaXJlY3Rvcnk6IHRydWUgfSk7IC8vIGZhbHNlXG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZSBDaGVjayBpZiBhIHBhdGggaXMgYSBmaWxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2ZzL2V4aXN0cy50c1wiO1xuICpcbiAqIGV4aXN0c1N5bmMoXCIuL2ZpbGVcIiwgeyBpc0ZpbGU6IHRydWUgfSk7IC8vIHRydWVcbiAqIGV4aXN0c1N5bmMoXCIuL2RpcmVjdG9yeVwiLCB7IGlzRmlsZTogdHJ1ZSB9KTsgLy8gZmFsc2VcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIENoZWNrIGlmIGEgcGF0aCBpcyBhIHJlYWRhYmxlIGRpcmVjdG9yeVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGV4aXN0c1N5bmMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9mcy9leGlzdHMudHNcIjtcbiAqXG4gKiBleGlzdHNTeW5jKFwiLi9yZWFkYWJsZV9kaXJlY3RvcnlcIiwgeyBpc1JlYWRhYmxlOiB0cnVlLCBpc0RpcmVjdG9yeTogdHJ1ZSB9KTsgLy8gdHJ1ZVxuICogZXhpc3RzU3luYyhcIi4vbm90X3JlYWRhYmxlX2RpcmVjdG9yeVwiLCB7IGlzUmVhZGFibGU6IHRydWUsIGlzRGlyZWN0b3J5OiB0cnVlIH0pOyAvLyBmYWxzZVxuICogYGBgXG4gKlxuICogQGV4YW1wbGUgQ2hlY2sgaWYgYSBwYXRoIGlzIGEgcmVhZGFibGUgZmlsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGV4aXN0c1N5bmMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9mcy9leGlzdHMudHNcIjtcbiAqXG4gKiBleGlzdHNTeW5jKFwiLi9yZWFkYWJsZV9maWxlXCIsIHsgaXNSZWFkYWJsZTogdHJ1ZSwgaXNGaWxlOiB0cnVlIH0pOyAvLyB0cnVlXG4gKiBleGlzdHNTeW5jKFwiLi9ub3RfcmVhZGFibGVfZmlsZVwiLCB7IGlzUmVhZGFibGU6IHRydWUsIGlzRmlsZTogdHJ1ZSB9KTsgLy8gZmFsc2VcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZXhpc3RzU3luYyhcbiAgcGF0aDogc3RyaW5nIHwgVVJMLFxuICBvcHRpb25zPzogRXhpc3RzT3B0aW9ucyxcbik6IGJvb2xlYW4ge1xuICB0cnkge1xuICAgIGNvbnN0IHN0YXQgPSBEZW5vLnN0YXRTeW5jKHBhdGgpO1xuICAgIGlmIChcbiAgICAgIG9wdGlvbnMgJiZcbiAgICAgIChvcHRpb25zLmlzUmVhZGFibGUgfHwgb3B0aW9ucy5pc0RpcmVjdG9yeSB8fCBvcHRpb25zLmlzRmlsZSlcbiAgICApIHtcbiAgICAgIGlmIChvcHRpb25zLmlzRGlyZWN0b3J5ICYmIG9wdGlvbnMuaXNGaWxlKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgXCJFeGlzdHNPcHRpb25zLm9wdGlvbnMuaXNEaXJlY3RvcnkgYW5kIEV4aXN0c09wdGlvbnMub3B0aW9ucy5pc0ZpbGUgbXVzdCBub3QgYmUgdHJ1ZSB0b2dldGhlci5cIixcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmIChcbiAgICAgICAgKG9wdGlvbnMuaXNEaXJlY3RvcnkgJiYgIXN0YXQuaXNEaXJlY3RvcnkpIHx8XG4gICAgICAgIChvcHRpb25zLmlzRmlsZSAmJiAhc3RhdC5pc0ZpbGUpXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMuaXNSZWFkYWJsZSkge1xuICAgICAgICBpZiAoc3RhdC5tb2RlID09PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7IC8vIEV4Y2x1c2l2ZSBvbiBOb24tUE9TSVggc3lzdGVtc1xuICAgICAgICB9XG4gICAgICAgIGlmIChEZW5vLnVpZCgpID09PSBzdGF0LnVpZCkge1xuICAgICAgICAgIHJldHVybiAoc3RhdC5tb2RlICYgMG80MDApID09PSAwbzQwMDsgLy8gVXNlciBpcyBvd25lciBhbmQgY2FuIHJlYWQ/XG4gICAgICAgIH0gZWxzZSBpZiAoRGVuby5naWQoKSA9PT0gc3RhdC5naWQpIHtcbiAgICAgICAgICByZXR1cm4gKHN0YXQubW9kZSAmIDBvMDQwKSA9PT0gMG8wNDA7IC8vIFVzZXIgZ3JvdXAgaXMgb3duZXIgYW5kIGNhbiByZWFkP1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoc3RhdC5tb2RlICYgMG8wMDQpID09PSAwbzAwNDsgLy8gT3RoZXJzIGNhbiByZWFkP1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5QZXJtaXNzaW9uRGVuaWVkKSB7XG4gICAgICBpZiAoXG4gICAgICAgIERlbm8ucGVybWlzc2lvbnMucXVlcnlTeW5jKHsgbmFtZTogXCJyZWFkXCIsIHBhdGggfSkuc3RhdGUgPT09IFwiZ3JhbnRlZFwiXG4gICAgICApIHtcbiAgICAgICAgLy8gLS1hbGxvdy1yZWFkIG5vdCBtaXNzaW5nXG4gICAgICAgIHJldHVybiAhb3B0aW9ucz8uaXNSZWFkYWJsZTsgLy8gUGVybWlzc2lvbkRlbmllZCB3YXMgcmFpc2VkIGJ5IGZpbGUgc3lzdGVtLCBzbyB0aGUgaXRlbSBleGlzdHMsIGJ1dCBjYW4ndCBiZSByZWFkXG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IGVycm9yO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBRTFFLCtEQUErRCxHQXdCL0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0ErRUMsR0FDRCxPQUFPLGVBQWUsT0FDcEIsSUFBa0IsRUFDbEIsT0FBdUI7RUFFdkIsSUFBSTtJQUNGLE1BQU0sT0FBTyxNQUFNLEtBQUssSUFBSSxDQUFDO0lBQzdCLElBQ0UsV0FDQSxDQUFDLFFBQVEsVUFBVSxJQUFJLFFBQVEsV0FBVyxJQUFJLFFBQVEsTUFBTSxHQUM1RDtNQUNBLElBQUksUUFBUSxXQUFXLElBQUks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
// denoCacheMetadata=5260811471372349388,12647984220313808161