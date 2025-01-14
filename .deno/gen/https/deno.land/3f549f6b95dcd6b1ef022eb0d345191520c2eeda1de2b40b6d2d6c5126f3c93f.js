// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/**
 * Logging library with the support for terminal and file outputs. Also provides
 * interfaces for building custom loggers.
 *
 * ## Loggers
 *
 * Loggers are objects that you interact with. When you use a logger method it
 * constructs a `LogRecord` and passes it down to its handlers for output. To
 * create custom loggers, specify them in `loggers` when calling `log.setup`.
 *
 * ## Custom message format
 *
 * If you want to override default format of message you can define `formatter`
 * option for handler. It can a function that takes `LogRecord`
 * as argument and outputs string.
 *
 * The default log format is `{levelName} {msg}`.
 *
 * ### Logging Structured JSON Lines
 *
 * To output logs in a structured JSON format you can configure most handlers
 * with a formatter that produces a JSON string. Either use the premade
 * `log.formatters.jsonFormatter` or write your own function that takes a
 * {@linkcode LogRecord} and returns a JSON.stringify'd object.
 * If you want the log to go to stdout then use {@linkcode ConsoleHandler} with
 * the configuration `useColors: false` to turn off the ANSI terminal colours.
 *
 * ```ts
 * import * as log from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 *
 * log.setup({
 *   handlers: {
 *     default: new log.ConsoleHandler("DEBUG", {
 *       formatter: log.formatters.jsonFormatter,
 *       useColors: false,
 *     }),
 *   },
 * });
 * ```
 *
 * The first argument passed to a log function is always treated as the
 * message and will be stringified differently. To have arguments JSON.stringify'd
 * you must pass them after the first.
 *
 * ```ts
 * import * as log from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 *
 * log.info("This is the message", { thisWillBe: "JSON.stringify'd"});
 * // {"level":"INFO","datetime":1702501580505,"message":"This is the message","args":{"thisWillBe":"JSON.stringify'd"}}
 *
 * log.info({ thisWontBe: "JSON.stringify'd"}, "This is an argument");
 * // {"level":"INFO","datetime":1702501580505,"message":"{\"thisWontBe\":\"JSON.stringify'd\"}","args":"This is an argument"}
 * ```
 *
 * ## Inline Logging
 *
 * Log functions return the data passed in the `msg` parameter. Data is returned
 * regardless if the logger actually logs it.
 *
 * ## Lazy Log Evaluation
 *
 * Some log statements are expensive to compute. In these cases, you can use
 * lazy log evaluation to prevent the computation taking place if the logger
 * won't log the message.
 *
 * > NOTE: When using lazy log evaluation, `undefined` will be returned if the
 * > resolver function is not called because the logger won't log it. It is an
 * > antipattern use lazy evaluation with inline logging because the return value
 * > depends on the current log level.
 *
 * ## For module authors
 *
 * The authors of public modules can let the users display the internal logs of the
 * module by using a custom logger:
 *
 * ```ts
 * import { getLogger } from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 *
 * function logger() {
 *   return getLogger("my-awesome-module");
 * }
 *
 * export function sum(a: number, b: number) {
 *   logger().debug(`running ${a} + ${b}`);
 *   return a + b;
 * }
 *
 * export function mult(a: number, b: number) {
 *   logger().debug(`running ${a} * ${b}`);
 *   return a * b;
 * }
 * ```
 *
 * The user of the module can then display the internal logs with:
 *
 * ```ts, ignore
 * import * as log from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 * import { sum } from "<the-awesome-module>/mod.ts";
 *
 * log.setup({
 *   handlers: {
 *     console: new log.ConsoleHandler("DEBUG"),
 *   },
 *
 *   loggers: {
 *     "my-awesome-module": {
 *       level: "DEBUG",
 *       handlers: ["console"],
 *     },
 *   },
 * });
 *
 * sum(1, 2); // prints "running 1 + 2" to the console
 * ```
 *
 * Please note that, due to the order of initialization of the loggers, the
 * following won't work:
 *
 * ```ts
 * import { getLogger } from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 *
 * const logger = getLogger("my-awesome-module");
 *
 * export function sum(a: number, b: number) {
 *   logger.debug(`running ${a} + ${b}`); // no message will be logged, because getLogger() was called before log.setup()
 *   return a + b;
 * }
 * ```
 *
 * @example
 * ```ts
 * import * as log from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 *
 * // Simple default logger out of the box. You can customize it
 * // by overriding logger and handler named "default", or providing
 * // additional logger configurations. You can log any data type.
 * log.debug("Hello world");
 * log.info(123456);
 * log.warn(true);
 * log.error({ foo: "bar", fizz: "bazz" });
 * log.critical("500 Internal server error");
 *
 * // custom configuration with 2 loggers (the default and `tasks` loggers).
 * log.setup({
 *   handlers: {
 *     console: new log.ConsoleHandler("DEBUG"),
 *
 *     file: new log.FileHandler("WARN", {
 *       filename: "./log.txt",
 *       // you can change format of output message using any keys in `LogRecord`.
 *       formatter: (record) => `${record.levelName} ${record.msg}`,
 *     }),
 *   },
 *
 *   loggers: {
 *     // configure default logger available via short-hand methods above.
 *     default: {
 *       level: "DEBUG",
 *       handlers: ["console", "file"],
 *     },
 *
 *     tasks: {
 *       level: "ERROR",
 *       handlers: ["console"],
 *     },
 *   },
 * });
 *
 * let logger;
 *
 * // get default logger.
 * logger = log.getLogger();
 * logger.debug("fizz"); // logs to `console`, because `file` handler requires "WARN" level.
 * logger.warn(41256); // logs to both `console` and `file` handlers.
 *
 * // get custom logger
 * logger = log.getLogger("tasks");
 * logger.debug("fizz"); // won't get output because this logger has "ERROR" level.
 * logger.error({ productType: "book", value: "126.11" }); // log to `console`.
 *
 * // if you try to use a logger that hasn't been configured
 * // you're good to go, it gets created automatically with level set to 0
 * // so no message is logged.
 * const unknownLogger = log.getLogger("mystery");
 * unknownLogger.info("foobar"); // no-op
 * ```
 *
 * @example
 * Custom message format example
 * ```ts
 * import * as log from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 *
 * log.setup({
 *   handlers: {
 *     stringFmt: new log.ConsoleHandler("DEBUG", {
 *       formatter: (record) => `[${record.levelName}] ${record.msg}`,
 *     }),
 *
 *     functionFmt: new log.ConsoleHandler("DEBUG", {
 *       formatter: (logRecord) => {
 *         let msg = `${logRecord.level} ${logRecord.msg}`;
 *
 *         logRecord.args.forEach((arg, index) => {
 *           msg += `, arg${index}: ${arg}`;
 *         });
 *
 *         return msg;
 *       },
 *     }),
 *
 *     anotherFmt: new log.ConsoleHandler("DEBUG", {
 *       formatter: (record) => `[${record.loggerName}] - ${record.levelName} ${record.msg}`,
 *     }),
 *   },
 *
 *   loggers: {
 *     default: {
 *       level: "DEBUG",
 *       handlers: ["stringFmt", "functionFmt"],
 *     },
 *     dataLogger: {
 *       level: "INFO",
 *       handlers: ["anotherFmt"],
 *     },
 *   },
 * });
 *
 * // calling:
 * log.debug("Hello, world!", 1, "two", [3, 4, 5]);
 * // results in: [DEBUG] Hello, world!
 * // output from "stringFmt" handler.
 * // 10 Hello, world!, arg0: 1, arg1: two, arg3: [3, 4, 5] // output from "functionFmt" formatter.
 *
 * // calling:
 * log.getLogger("dataLogger").error("oh no!");
 * // results in:
 * // [dataLogger] - ERROR oh no! // output from anotherFmt handler.
 * ```

 *
 * @example
 * JSON to stdout with no color example
 * ```ts
 * import * as log from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 *
 * log.setup({
 *   handlers: {
 *     jsonStdout: new log.ConsoleHandler("DEBUG", {
 *       formatter: log.formatters.jsonFormatter,
 *       useColors: false,
 *     }),
 *   },
 *
 *   loggers: {
 *     default: {
 *       level: "DEBUG",
 *       handlers: ["jsonStdout"],
 *     },
 *   },
 * });
 *
 * // calling:
 * log.info("Hey");
 * // results in:
 * // {"level":"INFO","datetime":1702481922294,"message":"Hey"}
 *
 * // calling:
 * log.info("Hey", { product: "nail" });
 * // results in:
 * // {"level":"INFO","datetime":1702484111115,"message":"Hey","args":{"product":"nail"}}
 *
 * // calling:
 * log.info("Hey", 1, "two", [3, 4, 5]);
 * // results in:
 * // {"level":"INFO","datetime":1702481922294,"message":"Hey","args":[1,"two",[3,4,5]]}
 * ```
 *
 * @example
 * Custom JSON example
 * ```ts
 * import * as log from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 *
 * log.setup({
 *   handlers: {
 *     customJsonFmt: new log.ConsoleHandler("DEBUG", {
 *       formatter: (record) => JSON.stringify({
 *         lvl: record.level,
 *         msg: record.msg,
 *         time: record.datetime.toISOString(),
 *         name: record.loggerName,
 *       }),
 *       useColors: false,
 *     }),
 *   },
 *
 *   loggers: {
 *     default: {
 *       level: "DEBUG",
 *       handlers: ["customJsonFmt"],
 *     },
 *   },
 * });
 *
 * // calling:
 * log.info("complete");
 * // results in:
 * // {"lvl":20,"msg":"complete","time":"2023-12-13T16:38:27.328Z","name":"default"}
 * ```
 *
 * @example
 * Inline Logging
 * ```ts
 * import * as logger from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 *
 * const stringData: string = logger.debug("hello world");
 * const booleanData: boolean = logger.debug(true, 1, "abc");
 * const fn = (): number => {
 *   return 123;
 * };
 * const resolvedFunctionData: number = logger.debug(fn());
 * console.log(stringData); // 'hello world'
 * console.log(booleanData); // true
 * console.log(resolvedFunctionData); // 123
 * ```
 *
 * @example
 * Lazy Log Evaluation
 * ```ts
 * import * as log from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 *
 * log.setup({
 *   handlers: {
 *     console: new log.ConsoleHandler("DEBUG"),
 *   },
 *
 *   loggers: {
 *     tasks: {
 *       level: "ERROR",
 *       handlers: ["console"],
 *     },
 *   },
 * });
 *
 * function someExpensiveFn(num: number, bool: boolean) {
 *   // do some expensive computation
 * }
 *
 * // not logged, as debug < error.
 * const data = log.debug(() => someExpensiveFn(5, true));
 * console.log(data); // undefined
 * ```
 *
 * Handlers are responsible for actual output of log messages. When a handler is
 * called by a logger, it firstly checks that {@linkcode LogRecord}'s level is
 * not lower than level of the handler. If level check passes, handlers formats
 * log record into string and outputs it to target.
 *
 * ## Custom handlers
 *
 * Custom handlers can be implemented by subclassing {@linkcode BaseHandler} or
 * {@linkcode WriterHandler}.
 *
 * {@linkcode BaseHandler} is bare-bones handler that has no output logic at all,
 *
 * {@linkcode WriterHandler} is an abstract class that supports any target with
 * `Writer` interface.
 *
 * During setup async hooks `setup` and `destroy` are called, you can use them
 * to open and close file/HTTP connection or any other action you might need.
 *
 * For examples check source code of {@linkcode FileHandler}`
 * and {@linkcode TestHandler}.
 *
 * @module
 */ export * from "./base_handler.ts";
export * from "./console_handler.ts";
export * from "./file_handler.ts";
export * from "./rotating_file_handler.ts";
export * from "./levels.ts";
export * from "./logger.ts";
export * from "./formatters.ts";
export * from "./critical.ts";
export * from "./debug.ts";
export * from "./error.ts";
export * from "./get_logger.ts";
export * from "./info.ts";
export * from "./setup.ts";
export * from "./warn.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyNC4wL2xvZy9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuLyoqXG4gKiBMb2dnaW5nIGxpYnJhcnkgd2l0aCB0aGUgc3VwcG9ydCBmb3IgdGVybWluYWwgYW5kIGZpbGUgb3V0cHV0cy4gQWxzbyBwcm92aWRlc1xuICogaW50ZXJmYWNlcyBmb3IgYnVpbGRpbmcgY3VzdG9tIGxvZ2dlcnMuXG4gKlxuICogIyMgTG9nZ2Vyc1xuICpcbiAqIExvZ2dlcnMgYXJlIG9iamVjdHMgdGhhdCB5b3UgaW50ZXJhY3Qgd2l0aC4gV2hlbiB5b3UgdXNlIGEgbG9nZ2VyIG1ldGhvZCBpdFxuICogY29uc3RydWN0cyBhIGBMb2dSZWNvcmRgIGFuZCBwYXNzZXMgaXQgZG93biB0byBpdHMgaGFuZGxlcnMgZm9yIG91dHB1dC4gVG9cbiAqIGNyZWF0ZSBjdXN0b20gbG9nZ2Vycywgc3BlY2lmeSB0aGVtIGluIGBsb2dnZXJzYCB3aGVuIGNhbGxpbmcgYGxvZy5zZXR1cGAuXG4gKlxuICogIyMgQ3VzdG9tIG1lc3NhZ2UgZm9ybWF0XG4gKlxuICogSWYgeW91IHdhbnQgdG8gb3ZlcnJpZGUgZGVmYXVsdCBmb3JtYXQgb2YgbWVzc2FnZSB5b3UgY2FuIGRlZmluZSBgZm9ybWF0dGVyYFxuICogb3B0aW9uIGZvciBoYW5kbGVyLiBJdCBjYW4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIGBMb2dSZWNvcmRgXG4gKiBhcyBhcmd1bWVudCBhbmQgb3V0cHV0cyBzdHJpbmcuXG4gKlxuICogVGhlIGRlZmF1bHQgbG9nIGZvcm1hdCBpcyBge2xldmVsTmFtZX0ge21zZ31gLlxuICpcbiAqICMjIyBMb2dnaW5nIFN0cnVjdHVyZWQgSlNPTiBMaW5lc1xuICpcbiAqIFRvIG91dHB1dCBsb2dzIGluIGEgc3RydWN0dXJlZCBKU09OIGZvcm1hdCB5b3UgY2FuIGNvbmZpZ3VyZSBtb3N0IGhhbmRsZXJzXG4gKiB3aXRoIGEgZm9ybWF0dGVyIHRoYXQgcHJvZHVjZXMgYSBKU09OIHN0cmluZy4gRWl0aGVyIHVzZSB0aGUgcHJlbWFkZVxuICogYGxvZy5mb3JtYXR0ZXJzLmpzb25Gb3JtYXR0ZXJgIG9yIHdyaXRlIHlvdXIgb3duIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYVxuICoge0BsaW5rY29kZSBMb2dSZWNvcmR9IGFuZCByZXR1cm5zIGEgSlNPTi5zdHJpbmdpZnknZCBvYmplY3QuXG4gKiBJZiB5b3Ugd2FudCB0aGUgbG9nIHRvIGdvIHRvIHN0ZG91dCB0aGVuIHVzZSB7QGxpbmtjb2RlIENvbnNvbGVIYW5kbGVyfSB3aXRoXG4gKiB0aGUgY29uZmlndXJhdGlvbiBgdXNlQ29sb3JzOiBmYWxzZWAgdG8gdHVybiBvZmYgdGhlIEFOU0kgdGVybWluYWwgY29sb3Vycy5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0ICogYXMgbG9nIGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2xvZy9tb2QudHNcIjtcbiAqXG4gKiBsb2cuc2V0dXAoe1xuICogICBoYW5kbGVyczoge1xuICogICAgIGRlZmF1bHQ6IG5ldyBsb2cuQ29uc29sZUhhbmRsZXIoXCJERUJVR1wiLCB7XG4gKiAgICAgICBmb3JtYXR0ZXI6IGxvZy5mb3JtYXR0ZXJzLmpzb25Gb3JtYXR0ZXIsXG4gKiAgICAgICB1c2VDb2xvcnM6IGZhbHNlLFxuICogICAgIH0pLFxuICogICB9LFxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBUaGUgZmlyc3QgYXJndW1lbnQgcGFzc2VkIHRvIGEgbG9nIGZ1bmN0aW9uIGlzIGFsd2F5cyB0cmVhdGVkIGFzIHRoZVxuICogbWVzc2FnZSBhbmQgd2lsbCBiZSBzdHJpbmdpZmllZCBkaWZmZXJlbnRseS4gVG8gaGF2ZSBhcmd1bWVudHMgSlNPTi5zdHJpbmdpZnknZFxuICogeW91IG11c3QgcGFzcyB0aGVtIGFmdGVyIHRoZSBmaXJzdC5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0ICogYXMgbG9nIGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2xvZy9tb2QudHNcIjtcbiAqXG4gKiBsb2cuaW5mbyhcIlRoaXMgaXMgdGhlIG1lc3NhZ2VcIiwgeyB0aGlzV2lsbEJlOiBcIkpTT04uc3RyaW5naWZ5J2RcIn0pO1xuICogLy8ge1wibGV2ZWxcIjpcIklORk9cIixcImRhdGV0aW1lXCI6MTcwMjUwMTU4MDUwNSxcIm1lc3NhZ2VcIjpcIlRoaXMgaXMgdGhlIG1lc3NhZ2VcIixcImFyZ3NcIjp7XCJ0aGlzV2lsbEJlXCI6XCJKU09OLnN0cmluZ2lmeSdkXCJ9fVxuICpcbiAqIGxvZy5pbmZvKHsgdGhpc1dvbnRCZTogXCJKU09OLnN0cmluZ2lmeSdkXCJ9LCBcIlRoaXMgaXMgYW4gYXJndW1lbnRcIik7XG4gKiAvLyB7XCJsZXZlbFwiOlwiSU5GT1wiLFwiZGF0ZXRpbWVcIjoxNzAyNTAxNTgwNTA1LFwibWVzc2FnZVwiOlwie1xcXCJ0aGlzV29udEJlXFxcIjpcXFwiSlNPTi5zdHJpbmdpZnknZFxcXCJ9XCIsXCJhcmdzXCI6XCJUaGlzIGlzIGFuIGFyZ3VtZW50XCJ9XG4gKiBgYGBcbiAqXG4gKiAjIyBJbmxpbmUgTG9nZ2luZ1xuICpcbiAqIExvZyBmdW5jdGlvbnMgcmV0dXJuIHRoZSBkYXRhIHBhc3NlZCBpbiB0aGUgYG1zZ2AgcGFyYW1ldGVyLiBEYXRhIGlzIHJldHVybmVkXG4gKiByZWdhcmRsZXNzIGlmIHRoZSBsb2dnZXIgYWN0dWFsbHkgbG9ncyBpdC5cbiAqXG4gKiAjIyBMYXp5IExvZyBFdmFsdWF0aW9uXG4gKlxuICogU29tZSBsb2cgc3RhdGVtZW50cyBhcmUgZXhwZW5zaXZlIHRvIGNvbXB1dGUuIEluIHRoZXNlIGNhc2VzLCB5b3UgY2FuIHVzZVxuICogbGF6eSBsb2cgZXZhbHVhdGlvbiB0byBwcmV2ZW50IHRoZSBjb21wdXRhdGlvbiB0YWtpbmcgcGxhY2UgaWYgdGhlIGxvZ2dlclxuICogd29uJ3QgbG9nIHRoZSBtZXNzYWdlLlxuICpcbiAqID4gTk9URTogV2hlbiB1c2luZyBsYXp5IGxvZyBldmFsdWF0aW9uLCBgdW5kZWZpbmVkYCB3aWxsIGJlIHJldHVybmVkIGlmIHRoZVxuICogPiByZXNvbHZlciBmdW5jdGlvbiBpcyBub3QgY2FsbGVkIGJlY2F1c2UgdGhlIGxvZ2dlciB3b24ndCBsb2cgaXQuIEl0IGlzIGFuXG4gKiA+IGFudGlwYXR0ZXJuIHVzZSBsYXp5IGV2YWx1YXRpb24gd2l0aCBpbmxpbmUgbG9nZ2luZyBiZWNhdXNlIHRoZSByZXR1cm4gdmFsdWVcbiAqID4gZGVwZW5kcyBvbiB0aGUgY3VycmVudCBsb2cgbGV2ZWwuXG4gKlxuICogIyMgRm9yIG1vZHVsZSBhdXRob3JzXG4gKlxuICogVGhlIGF1dGhvcnMgb2YgcHVibGljIG1vZHVsZXMgY2FuIGxldCB0aGUgdXNlcnMgZGlzcGxheSB0aGUgaW50ZXJuYWwgbG9ncyBvZiB0aGVcbiAqIG1vZHVsZSBieSB1c2luZyBhIGN1c3RvbSBsb2dnZXI6XG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGdldExvZ2dlciB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2xvZy9tb2QudHNcIjtcbiAqXG4gKiBmdW5jdGlvbiBsb2dnZXIoKSB7XG4gKiAgIHJldHVybiBnZXRMb2dnZXIoXCJteS1hd2Vzb21lLW1vZHVsZVwiKTtcbiAqIH1cbiAqXG4gKiBleHBvcnQgZnVuY3Rpb24gc3VtKGE6IG51bWJlciwgYjogbnVtYmVyKSB7XG4gKiAgIGxvZ2dlcigpLmRlYnVnKGBydW5uaW5nICR7YX0gKyAke2J9YCk7XG4gKiAgIHJldHVybiBhICsgYjtcbiAqIH1cbiAqXG4gKiBleHBvcnQgZnVuY3Rpb24gbXVsdChhOiBudW1iZXIsIGI6IG51bWJlcikge1xuICogICBsb2dnZXIoKS5kZWJ1ZyhgcnVubmluZyAke2F9ICogJHtifWApO1xuICogICByZXR1cm4gYSAqIGI7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBUaGUgdXNlciBvZiB0aGUgbW9kdWxlIGNhbiB0aGVuIGRpc3BsYXkgdGhlIGludGVybmFsIGxvZ3Mgd2l0aDpcbiAqXG4gKiBgYGB0cywgaWdub3JlXG4gKiBpbXBvcnQgKiBhcyBsb2cgZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vbG9nL21vZC50c1wiO1xuICogaW1wb3J0IHsgc3VtIH0gZnJvbSBcIjx0aGUtYXdlc29tZS1tb2R1bGU+L21vZC50c1wiO1xuICpcbiAqIGxvZy5zZXR1cCh7XG4gKiAgIGhhbmRsZXJzOiB7XG4gKiAgICAgY29uc29sZTogbmV3IGxvZy5Db25zb2xlSGFuZGxlcihcIkRFQlVHXCIpLFxuICogICB9LFxuICpcbiAqICAgbG9nZ2Vyczoge1xuICogICAgIFwibXktYXdlc29tZS1tb2R1bGVcIjoge1xuICogICAgICAgbGV2ZWw6IFwiREVCVUdcIixcbiAqICAgICAgIGhhbmRsZXJzOiBbXCJjb25zb2xlXCJdLFxuICogICAgIH0sXG4gKiAgIH0sXG4gKiB9KTtcbiAqXG4gKiBzdW0oMSwgMik7IC8vIHByaW50cyBcInJ1bm5pbmcgMSArIDJcIiB0byB0aGUgY29uc29sZVxuICogYGBgXG4gKlxuICogUGxlYXNlIG5vdGUgdGhhdCwgZHVlIHRvIHRoZSBvcmRlciBvZiBpbml0aWFsaXphdGlvbiBvZiB0aGUgbG9nZ2VycywgdGhlXG4gKiBmb2xsb3dpbmcgd29uJ3Qgd29yazpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZ2V0TG9nZ2VyIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vbG9nL21vZC50c1wiO1xuICpcbiAqIGNvbnN0IGxvZ2dlciA9IGdldExvZ2dlcihcIm15LWF3ZXNvbWUtbW9kdWxlXCIpO1xuICpcbiAqIGV4cG9ydCBmdW5jdGlvbiBzdW0oYTogbnVtYmVyLCBiOiBudW1iZXIpIHtcbiAqICAgbG9nZ2VyLmRlYnVnKGBydW5uaW5nICR7YX0gKyAke2J9YCk7IC8vIG5vIG1lc3NhZ2Ugd2lsbCBiZSBsb2dnZWQsIGJlY2F1c2UgZ2V0TG9nZ2VyKCkgd2FzIGNhbGxlZCBiZWZvcmUgbG9nLnNldHVwKClcbiAqICAgcmV0dXJuIGEgKyBiO1xuICogfVxuICogYGBgXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgKiBhcyBsb2cgZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vbG9nL21vZC50c1wiO1xuICpcbiAqIC8vIFNpbXBsZSBkZWZhdWx0IGxvZ2dlciBvdXQgb2YgdGhlIGJveC4gWW91IGNhbiBjdXN0b21pemUgaXRcbiAqIC8vIGJ5IG92ZXJyaWRpbmcgbG9nZ2VyIGFuZCBoYW5kbGVyIG5hbWVkIFwiZGVmYXVsdFwiLCBvciBwcm92aWRpbmdcbiAqIC8vIGFkZGl0aW9uYWwgbG9nZ2VyIGNvbmZpZ3VyYXRpb25zLiBZb3UgY2FuIGxvZyBhbnkgZGF0YSB0eXBlLlxuICogbG9nLmRlYnVnKFwiSGVsbG8gd29ybGRcIik7XG4gKiBsb2cuaW5mbygxMjM0NTYpO1xuICogbG9nLndhcm4odHJ1ZSk7XG4gKiBsb2cuZXJyb3IoeyBmb286IFwiYmFyXCIsIGZpeno6IFwiYmF6elwiIH0pO1xuICogbG9nLmNyaXRpY2FsKFwiNTAwIEludGVybmFsIHNlcnZlciBlcnJvclwiKTtcbiAqXG4gKiAvLyBjdXN0b20gY29uZmlndXJhdGlvbiB3aXRoIDIgbG9nZ2VycyAodGhlIGRlZmF1bHQgYW5kIGB0YXNrc2AgbG9nZ2VycykuXG4gKiBsb2cuc2V0dXAoe1xuICogICBoYW5kbGVyczoge1xuICogICAgIGNvbnNvbGU6IG5ldyBsb2cuQ29uc29sZUhhbmRsZXIoXCJERUJVR1wiKSxcbiAqXG4gKiAgICAgZmlsZTogbmV3IGxvZy5GaWxlSGFuZGxlcihcIldBUk5cIiwge1xuICogICAgICAgZmlsZW5hbWU6IFwiLi9sb2cudHh0XCIsXG4gKiAgICAgICAvLyB5b3UgY2FuIGNoYW5nZSBmb3JtYXQgb2Ygb3V0cHV0IG1lc3NhZ2UgdXNpbmcgYW55IGtleXMgaW4gYExvZ1JlY29yZGAuXG4gKiAgICAgICBmb3JtYXR0ZXI6IChyZWNvcmQpID0+IGAke3JlY29yZC5sZXZlbE5hbWV9ICR7cmVjb3JkLm1zZ31gLFxuICogICAgIH0pLFxuICogICB9LFxuICpcbiAqICAgbG9nZ2Vyczoge1xuICogICAgIC8vIGNvbmZpZ3VyZSBkZWZhdWx0IGxvZ2dlciBhdmFpbGFibGUgdmlhIHNob3J0LWhhbmQgbWV0aG9kcyBhYm92ZS5cbiAqICAgICBkZWZhdWx0OiB7XG4gKiAgICAgICBsZXZlbDogXCJERUJVR1wiLFxuICogICAgICAgaGFuZGxlcnM6IFtcImNvbnNvbGVcIiwgXCJmaWxlXCJdLFxuICogICAgIH0sXG4gKlxuICogICAgIHRhc2tzOiB7XG4gKiAgICAgICBsZXZlbDogXCJFUlJPUlwiLFxuICogICAgICAgaGFuZGxlcnM6IFtcImNvbnNvbGVcIl0sXG4gKiAgICAgfSxcbiAqICAgfSxcbiAqIH0pO1xuICpcbiAqIGxldCBsb2dnZXI7XG4gKlxuICogLy8gZ2V0IGRlZmF1bHQgbG9nZ2VyLlxuICogbG9nZ2VyID0gbG9nLmdldExvZ2dlcigpO1xuICogbG9nZ2VyLmRlYnVnKFwiZml6elwiKTsgLy8gbG9ncyB0byBgY29uc29sZWAsIGJlY2F1c2UgYGZpbGVgIGhhbmRsZXIgcmVxdWlyZXMgXCJXQVJOXCIgbGV2ZWwuXG4gKiBsb2dnZXIud2Fybig0MTI1Nik7IC8vIGxvZ3MgdG8gYm90aCBgY29uc29sZWAgYW5kIGBmaWxlYCBoYW5kbGVycy5cbiAqXG4gKiAvLyBnZXQgY3VzdG9tIGxvZ2dlclxuICogbG9nZ2VyID0gbG9nLmdldExvZ2dlcihcInRhc2tzXCIpO1xuICogbG9nZ2VyLmRlYnVnKFwiZml6elwiKTsgLy8gd29uJ3QgZ2V0IG91dHB1dCBiZWNhdXNlIHRoaXMgbG9nZ2VyIGhhcyBcIkVSUk9SXCIgbGV2ZWwuXG4gKiBsb2dnZXIuZXJyb3IoeyBwcm9kdWN0VHlwZTogXCJib29rXCIsIHZhbHVlOiBcIjEyNi4xMVwiIH0pOyAvLyBsb2cgdG8gYGNvbnNvbGVgLlxuICpcbiAqIC8vIGlmIHlvdSB0cnkgdG8gdXNlIGEgbG9nZ2VyIHRoYXQgaGFzbid0IGJlZW4gY29uZmlndXJlZFxuICogLy8geW91J3JlIGdvb2QgdG8gZ28sIGl0IGdldHMgY3JlYXRlZCBhdXRvbWF0aWNhbGx5IHdpdGggbGV2ZWwgc2V0IHRvIDBcbiAqIC8vIHNvIG5vIG1lc3NhZ2UgaXMgbG9nZ2VkLlxuICogY29uc3QgdW5rbm93bkxvZ2dlciA9IGxvZy5nZXRMb2dnZXIoXCJteXN0ZXJ5XCIpO1xuICogdW5rbm93bkxvZ2dlci5pbmZvKFwiZm9vYmFyXCIpOyAvLyBuby1vcFxuICogYGBgXG4gKlxuICogQGV4YW1wbGVcbiAqIEN1c3RvbSBtZXNzYWdlIGZvcm1hdCBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0ICogYXMgbG9nIGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2xvZy9tb2QudHNcIjtcbiAqXG4gKiBsb2cuc2V0dXAoe1xuICogICBoYW5kbGVyczoge1xuICogICAgIHN0cmluZ0ZtdDogbmV3IGxvZy5Db25zb2xlSGFuZGxlcihcIkRFQlVHXCIsIHtcbiAqICAgICAgIGZvcm1hdHRlcjogKHJlY29yZCkgPT4gYFske3JlY29yZC5sZXZlbE5hbWV9XSAke3JlY29yZC5tc2d9YCxcbiAqICAgICB9KSxcbiAqXG4gKiAgICAgZnVuY3Rpb25GbXQ6IG5ldyBsb2cuQ29uc29sZUhhbmRsZXIoXCJERUJVR1wiLCB7XG4gKiAgICAgICBmb3JtYXR0ZXI6IChsb2dSZWNvcmQpID0+IHtcbiAqICAgICAgICAgbGV0IG1zZyA9IGAke2xvZ1JlY29yZC5sZXZlbH0gJHtsb2dSZWNvcmQubXNnfWA7XG4gKlxuICogICAgICAgICBsb2dSZWNvcmQuYXJncy5mb3JFYWNoKChhcmcsIGluZGV4KSA9PiB7XG4gKiAgICAgICAgICAgbXNnICs9IGAsIGFyZyR7aW5kZXh9OiAke2FyZ31gO1xuICogICAgICAgICB9KTtcbiAqXG4gKiAgICAgICAgIHJldHVybiBtc2c7XG4gKiAgICAgICB9LFxuICogICAgIH0pLFxuICpcbiAqICAgICBhbm90aGVyRm10OiBuZXcgbG9nLkNvbnNvbGVIYW5kbGVyKFwiREVCVUdcIiwge1xuICogICAgICAgZm9ybWF0dGVyOiAocmVjb3JkKSA9PiBgWyR7cmVjb3JkLmxvZ2dlck5hbWV9XSAtICR7cmVjb3JkLmxldmVsTmFtZX0gJHtyZWNvcmQubXNnfWAsXG4gKiAgICAgfSksXG4gKiAgIH0sXG4gKlxuICogICBsb2dnZXJzOiB7XG4gKiAgICAgZGVmYXVsdDoge1xuICogICAgICAgbGV2ZWw6IFwiREVCVUdcIixcbiAqICAgICAgIGhhbmRsZXJzOiBbXCJzdHJpbmdGbXRcIiwgXCJmdW5jdGlvbkZtdFwiXSxcbiAqICAgICB9LFxuICogICAgIGRhdGFMb2dnZXI6IHtcbiAqICAgICAgIGxldmVsOiBcIklORk9cIixcbiAqICAgICAgIGhhbmRsZXJzOiBbXCJhbm90aGVyRm10XCJdLFxuICogICAgIH0sXG4gKiAgIH0sXG4gKiB9KTtcbiAqXG4gKiAvLyBjYWxsaW5nOlxuICogbG9nLmRlYnVnKFwiSGVsbG8sIHdvcmxkIVwiLCAxLCBcInR3b1wiLCBbMywgNCwgNV0pO1xuICogLy8gcmVzdWx0cyBpbjogW0RFQlVHXSBIZWxsbywgd29ybGQhXG4gKiAvLyBvdXRwdXQgZnJvbSBcInN0cmluZ0ZtdFwiIGhhbmRsZXIuXG4gKiAvLyAxMCBIZWxsbywgd29ybGQhLCBhcmcwOiAxLCBhcmcxOiB0d28sIGFyZzM6IFszLCA0LCA1XSAvLyBvdXRwdXQgZnJvbSBcImZ1bmN0aW9uRm10XCIgZm9ybWF0dGVyLlxuICpcbiAqIC8vIGNhbGxpbmc6XG4gKiBsb2cuZ2V0TG9nZ2VyKFwiZGF0YUxvZ2dlclwiKS5lcnJvcihcIm9oIG5vIVwiKTtcbiAqIC8vIHJlc3VsdHMgaW46XG4gKiAvLyBbZGF0YUxvZ2dlcl0gLSBFUlJPUiBvaCBubyEgLy8gb3V0cHV0IGZyb20gYW5vdGhlckZtdCBoYW5kbGVyLlxuICogYGBgXG5cbiAqXG4gKiBAZXhhbXBsZVxuICogSlNPTiB0byBzdGRvdXQgd2l0aCBubyBjb2xvciBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0ICogYXMgbG9nIGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2xvZy9tb2QudHNcIjtcbiAqXG4gKiBsb2cuc2V0dXAoe1xuICogICBoYW5kbGVyczoge1xuICogICAgIGpzb25TdGRvdXQ6IG5ldyBsb2cuQ29uc29sZUhhbmRsZXIoXCJERUJVR1wiLCB7XG4gKiAgICAgICBmb3JtYXR0ZXI6IGxvZy5mb3JtYXR0ZXJzLmpzb25Gb3JtYXR0ZXIsXG4gKiAgICAgICB1c2VDb2xvcnM6IGZhbHNlLFxuICogICAgIH0pLFxuICogICB9LFxuICpcbiAqICAgbG9nZ2Vyczoge1xuICogICAgIGRlZmF1bHQ6IHtcbiAqICAgICAgIGxldmVsOiBcIkRFQlVHXCIsXG4gKiAgICAgICBoYW5kbGVyczogW1wianNvblN0ZG91dFwiXSxcbiAqICAgICB9LFxuICogICB9LFxuICogfSk7XG4gKlxuICogLy8gY2FsbGluZzpcbiAqIGxvZy5pbmZvKFwiSGV5XCIpO1xuICogLy8gcmVzdWx0cyBpbjpcbiAqIC8vIHtcImxldmVsXCI6XCJJTkZPXCIsXCJkYXRldGltZVwiOjE3MDI0ODE5MjIyOTQsXCJtZXNzYWdlXCI6XCJIZXlcIn1cbiAqXG4gKiAvLyBjYWxsaW5nOlxuICogbG9nLmluZm8oXCJIZXlcIiwgeyBwcm9kdWN0OiBcIm5haWxcIiB9KTtcbiAqIC8vIHJlc3VsdHMgaW46XG4gKiAvLyB7XCJsZXZlbFwiOlwiSU5GT1wiLFwiZGF0ZXRpbWVcIjoxNzAyNDg0MTExMTE1LFwibWVzc2FnZVwiOlwiSGV5XCIsXCJhcmdzXCI6e1wicHJvZHVjdFwiOlwibmFpbFwifX1cbiAqXG4gKiAvLyBjYWxsaW5nOlxuICogbG9nLmluZm8oXCJIZXlcIiwgMSwgXCJ0d29cIiwgWzMsIDQsIDVdKTtcbiAqIC8vIHJlc3VsdHMgaW46XG4gKiAvLyB7XCJsZXZlbFwiOlwiSU5GT1wiLFwiZGF0ZXRpbWVcIjoxNzAyNDgxOTIyMjk0LFwibWVzc2FnZVwiOlwiSGV5XCIsXCJhcmdzXCI6WzEsXCJ0d29cIixbMyw0LDVdXX1cbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlXG4gKiBDdXN0b20gSlNPTiBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0ICogYXMgbG9nIGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2xvZy9tb2QudHNcIjtcbiAqXG4gKiBsb2cuc2V0dXAoe1xuICogICBoYW5kbGVyczoge1xuICogICAgIGN1c3RvbUpzb25GbXQ6IG5ldyBsb2cuQ29uc29sZUhhbmRsZXIoXCJERUJVR1wiLCB7XG4gKiAgICAgICBmb3JtYXR0ZXI6IChyZWNvcmQpID0+IEpTT04uc3RyaW5naWZ5KHtcbiAqICAgICAgICAgbHZsOiByZWNvcmQubGV2ZWwsXG4gKiAgICAgICAgIG1zZzogcmVjb3JkLm1zZyxcbiAqICAgICAgICAgdGltZTogcmVjb3JkLmRhdGV0aW1lLnRvSVNPU3RyaW5nKCksXG4gKiAgICAgICAgIG5hbWU6IHJlY29yZC5sb2dnZXJOYW1lLFxuICogICAgICAgfSksXG4gKiAgICAgICB1c2VDb2xvcnM6IGZhbHNlLFxuICogICAgIH0pLFxuICogICB9LFxuICpcbiAqICAgbG9nZ2Vyczoge1xuICogICAgIGRlZmF1bHQ6IHtcbiAqICAgICAgIGxldmVsOiBcIkRFQlVHXCIsXG4gKiAgICAgICBoYW5kbGVyczogW1wiY3VzdG9tSnNvbkZtdFwiXSxcbiAqICAgICB9LFxuICogICB9LFxuICogfSk7XG4gKlxuICogLy8gY2FsbGluZzpcbiAqIGxvZy5pbmZvKFwiY29tcGxldGVcIik7XG4gKiAvLyByZXN1bHRzIGluOlxuICogLy8ge1wibHZsXCI6MjAsXCJtc2dcIjpcImNvbXBsZXRlXCIsXCJ0aW1lXCI6XCIyMDIzLTEyLTEzVDE2OjM4OjI3LjMyOFpcIixcIm5hbWVcIjpcImRlZmF1bHRcIn1cbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlXG4gKiBJbmxpbmUgTG9nZ2luZ1xuICogYGBgdHNcbiAqIGltcG9ydCAqIGFzIGxvZ2dlciBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9sb2cvbW9kLnRzXCI7XG4gKlxuICogY29uc3Qgc3RyaW5nRGF0YTogc3RyaW5nID0gbG9nZ2VyLmRlYnVnKFwiaGVsbG8gd29ybGRcIik7XG4gKiBjb25zdCBib29sZWFuRGF0YTogYm9vbGVhbiA9IGxvZ2dlci5kZWJ1Zyh0cnVlLCAxLCBcImFiY1wiKTtcbiAqIGNvbnN0IGZuID0gKCk6IG51bWJlciA9PiB7XG4gKiAgIHJldHVybiAxMjM7XG4gKiB9O1xuICogY29uc3QgcmVzb2x2ZWRGdW5jdGlvbkRhdGE6IG51bWJlciA9IGxvZ2dlci5kZWJ1ZyhmbigpKTtcbiAqIGNvbnNvbGUubG9nKHN0cmluZ0RhdGEpOyAvLyAnaGVsbG8gd29ybGQnXG4gKiBjb25zb2xlLmxvZyhib29sZWFuRGF0YSk7IC8vIHRydWVcbiAqIGNvbnNvbGUubG9nKHJlc29sdmVkRnVuY3Rpb25EYXRhKTsgLy8gMTIzXG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZVxuICogTGF6eSBMb2cgRXZhbHVhdGlvblxuICogYGBgdHNcbiAqIGltcG9ydCAqIGFzIGxvZyBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9sb2cvbW9kLnRzXCI7XG4gKlxuICogbG9nLnNldHVwKHtcbiAqICAgaGFuZGxlcnM6IHtcbiAqICAgICBjb25zb2xlOiBuZXcgbG9nLkNvbnNvbGVIYW5kbGVyKFwiREVCVUdcIiksXG4gKiAgIH0sXG4gKlxuICogICBsb2dnZXJzOiB7XG4gKiAgICAgdGFza3M6IHtcbiAqICAgICAgIGxldmVsOiBcIkVSUk9SXCIsXG4gKiAgICAgICBoYW5kbGVyczogW1wiY29uc29sZVwiXSxcbiAqICAgICB9LFxuICogICB9LFxuICogfSk7XG4gKlxuICogZnVuY3Rpb24gc29tZUV4cGVuc2l2ZUZuKG51bTogbnVtYmVyLCBib29sOiBib29sZWFuKSB7XG4gKiAgIC8vIGRvIHNvbWUgZXhwZW5zaXZlIGNvbXB1dGF0aW9uXG4gKiB9XG4gKlxuICogLy8gbm90IGxvZ2dlZCwgYXMgZGVidWcgPCBlcnJvci5cbiAqIGNvbnN0IGRhdGEgPSBsb2cuZGVidWcoKCkgPT4gc29tZUV4cGVuc2l2ZUZuKDUsIHRydWUpKTtcbiAqIGNvbnNvbGUubG9nKGRhdGEpOyAvLyB1bmRlZmluZWRcbiAqIGBgYFxuICpcbiAqIEhhbmRsZXJzIGFyZSByZXNwb25zaWJsZSBmb3IgYWN0dWFsIG91dHB1dCBvZiBsb2cgbWVzc2FnZXMuIFdoZW4gYSBoYW5kbGVyIGlzXG4gKiBjYWxsZWQgYnkgYSBsb2dnZXIsIGl0IGZpcnN0bHkgY2hlY2tzIHRoYXQge0BsaW5rY29kZSBMb2dSZWNvcmR9J3MgbGV2ZWwgaXNcbiAqIG5vdCBsb3dlciB0aGFuIGxldmVsIG9mIHRoZSBoYW5kbGVyLiBJZiBsZXZlbCBjaGVjayBwYXNzZXMsIGhhbmRsZXJzIGZvcm1hdHNcbiAqIGxvZyByZWNvcmQgaW50byBzdHJpbmcgYW5kIG91dHB1dHMgaXQgdG8gdGFyZ2V0LlxuICpcbiAqICMjIEN1c3RvbSBoYW5kbGVyc1xuICpcbiAqIEN1c3RvbSBoYW5kbGVycyBjYW4gYmUgaW1wbGVtZW50ZWQgYnkgc3ViY2xhc3Npbmcge0BsaW5rY29kZSBCYXNlSGFuZGxlcn0gb3JcbiAqIHtAbGlua2NvZGUgV3JpdGVySGFuZGxlcn0uXG4gKlxuICoge0BsaW5rY29kZSBCYXNlSGFuZGxlcn0gaXMgYmFyZS1ib25lcyBoYW5kbGVyIHRoYXQgaGFzIG5vIG91dHB1dCBsb2dpYyBhdCBhbGwsXG4gKlxuICoge0BsaW5rY29kZSBXcml0ZXJIYW5kbGVyfSBpcyBhbiBhYnN0cmFjdCBjbGFzcyB0aGF0IHN1cHBvcnRzIGFueSB0YXJnZXQgd2l0aFxuICogYFdyaXRlcmAgaW50ZXJmYWNlLlxuICpcbiAqIER1cmluZyBzZXR1cCBhc3luYyBob29rcyBgc2V0dXBgIGFuZCBgZGVzdHJveWAgYXJlIGNhbGxlZCwgeW91IGNhbiB1c2UgdGhlbVxuICogdG8gb3BlbiBhbmQgY2xvc2UgZmlsZS9IVFRQIGNvbm5lY3Rpb24gb3IgYW55IG90aGVyIGFjdGlvbiB5b3UgbWlnaHQgbmVlZC5cbiAqXG4gKiBGb3IgZXhhbXBsZXMgY2hlY2sgc291cmNlIGNvZGUgb2Yge0BsaW5rY29kZSBGaWxlSGFuZGxlcn1gXG4gKiBhbmQge0BsaW5rY29kZSBUZXN0SGFuZGxlcn0uXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmV4cG9ydCAqIGZyb20gXCIuL2Jhc2VfaGFuZGxlci50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vY29uc29sZV9oYW5kbGVyLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9maWxlX2hhbmRsZXIudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3JvdGF0aW5nX2ZpbGVfaGFuZGxlci50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vbGV2ZWxzLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9sb2dnZXIudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2Zvcm1hdHRlcnMudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2NyaXRpY2FsLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9kZWJ1Zy50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZXJyb3IudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2dldF9sb2dnZXIudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2luZm8udHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3NldHVwLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi93YXJuLnRzXCI7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBRTFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXNYQyxHQUVELGNBQWMsb0JBQW9CO0FBQ2xDLGNBQWMsdUJBQXVCO0FBQ3JDLGNBQWMsb0JBQW9CO0FBQ2xDLGNBQWMsNkJBQTZCO0FBQzNDLGNBQWMsY0FBYztBQUM1QixjQUFjLGNBQWM7QUFDNUIsY0FBYyxrQkFBa0I7QUFDaEMsY0FBYyxnQkFBZ0I7QUFDOUIsY0FBYyxhQUFhO0FBQzNCLGNBQWMsYUFBYTtBQUMzQixjQUFjLGtCQUFrQjtBQUNoQyxjQUFjLFlBQVk7QUFDMUIsY0FBYyxhQUFhO0FBQzNCLGNBQWMsWUFBWSJ9
// denoCacheMetadata=15390175321883690431,17768584732899640549