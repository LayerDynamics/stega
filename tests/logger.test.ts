import { assertEquals } from "@std/assert";
import { logger } from "../src/logger/logger.ts";

/**
 * Helper functions to strip ANSI color codes and control characters.
 * Control characters are intentional in these regex patterns and
 * necessary for proper terminal output handling.
 */
/* eslint-disable no-control-regex */
const stripAnsi = (str: string): string => str.replace(/\x1B\[[0-9;]*m/g, "");
const stripEscapes = (str: string): string =>
	str.replace(
		/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
		"",
	);
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

		// Log messages at different levels
		logger.info("Info message");
		logger.warn("Warn message");
		logger.error("Error message");

		// Process logs: strip control characters and normalize whitespace
		const normalizedLogs = logs.map((log) =>
			stripAnsi(stripEscapes(log))
				.replace(/\s+/g, " ")
				.trim()
		);

		assertEquals(normalizedLogs, [
			"INFO Info message",
			"WARN Warn message",
			"ERROR Error message",
		]);
	} finally {
		Object.assign(console, originalConsole);
	}
});
