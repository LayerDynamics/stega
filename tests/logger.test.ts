// tests/logger.test.ts
import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { logger } from "../src/logger/logger.ts";
import { LogLevels as _LogLevels } from "https://deno.land/std@0.224.0/log/mod.ts";

/* eslint-disable no-control-regex */
// Control characters are intentional in these regex patterns
const stripAnsi = (str: string) => str.replace(/\x1B\[\d+m/g, "");
const _stripEscapes = (str: string) =>
	str.replace(
		/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
		"",
	); // Prefixed with underscore
/* eslint-enable no-control-regex */

Deno.test("Logger should log messages at appropriate levels", () => {
	const logs: string[] = [];
	const originalConsole = {
		log: console.log,
		info: console.info,
		warn: console.warn,
		error: console.error,
	};

	// Mock console methods
	console.log = (msg: string) => logs.push(msg);
	console.info = (msg: string) => logs.push(msg);
	console.warn = (msg: string) => logs.push(msg);
	console.error = (msg: string) => logs.push(msg);

	try {
		// Clear any existing logs
		logs.length = 0;

		// Only log INFO and above
		logger.info("Info message");
		logger.warn("Warn message");
		logger.error("Error message");

		// Strip ANSI color codes and normalize whitespace
		const strippedLogs = logs.map((log) =>
			/* eslint-disable no-control-regex */
			stripAnsi(log)
				.replace(
					/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
					"",
				)
				.replace(/\s+/g, " ")
				.trim()
			/* eslint-enable no-control-regex */
		);

		assertEquals(strippedLogs, [
			"INFO Info message",
			"WARN Warn message",
			"ERROR Error message",
		]);
	} finally {
		Object.assign(console, originalConsole);
	}
});
