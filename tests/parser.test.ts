// tests/parser.test.ts

import { Parser } from "../src/parser.ts";
import {
	assertEquals,
	assertThrows,
} from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { CLI } from "../src/core.ts";
import { InvalidFlagValueError, MissingFlagError } from "../src/error.ts";
import { ILogger } from "../src/logger_interface.ts";

// Mock logger for CLI instance
const mockLogger: ILogger = {
	info: () => {},
	error: () => {},
	debug: () => {},
	warn: () => {},
};

// Create a mock CLI instance for testing
const createMockCLI = () => {
	const cli = new CLI(undefined, true, true, mockLogger);
	// Register some commands with flags for testing
	cli.register({
		name: "greet",
		description: "Greet a user",
		options: [
			{ name: "name", alias: "n", type: "string", required: true },
			{ name: "verbose", alias: "v", type: "boolean", required: false },
		],
		action: async (_args) => {
			// Action logic
		},
	});

	cli.register({
		name: "command",
		description: "A command with multiple flags",
		options: [
			{ name: "a", alias: "a", type: "string", required: true },
			{ name: "b", alias: "b", type: "boolean", required: false },
			{ name: "c", alias: "c", type: "number", required: false },
		],
		action: async (_args) => {
			// Action logic
		},
	});

	cli.register({
		name: "test",
		description: "Test command for short flags",
		options: [
			{ name: "f", alias: "f", type: "string", required: true },
			{ name: "o", alias: "o", type: "string", required: false },
		],
		action: async (_args) => {
			// Action logic
		},
	});

	// Register 'user' command with 'add' subcommand
	cli.register({
		name: "user",
		description: "User management commands",
		subcommands: [
			{
				name: "add",
				description: "Add a new user",
				options: [
					{ name: "name", alias: "n", type: "string", required: true },
				],
				action: async (_args) => {
					// Action logic
				},
			},
		],
		action: async (_args) => {
			// Action logic for 'user' command
		},
	});

	return cli;
};

Deno.test("Parser should correctly parse commands and flags", () => {
	const parser = new Parser();
	const cli = createMockCLI();
	const argv = ["greet", "--name=Alice", "-v"];
	const args = parser.parse(argv, cli);
	assertEquals(args.command, ["greet"]);
	assertEquals(args.flags, { name: "Alice", v: true });
});

Deno.test("Parser should handle flags with separate values", () => {
	const parser = new Parser();
	const cli = createMockCLI();
	const argv = ["greet", "--name", "Bob", "-o", "output.txt"];
	const args = parser.parse(argv, cli);
	assertEquals(args.command, ["greet"]);
	assertEquals(args.flags, { name: "Bob", o: "output.txt" });
});

Deno.test("Parser should treat flags without values as boolean", () => {
	const parser = new Parser();
	const cli = createMockCLI();
	const argv = ["greet", "--verbose", "--dry-run"];
	const args = parser.parse(argv, cli);
	assertEquals(args.command, ["greet"]);
	assertEquals(args.flags, { verbose: true, "dry-run": true });
});

Deno.test("Parser should handle multiple commands", () => {
	const parser = new Parser();
	const cli = createMockCLI();
	const argv = ["user", "add", "--name=Charlie"];
	const args = parser.parse(argv, cli);
	assertEquals(args.command, ["user", "add"]);
	assertEquals(args.flags, { name: "Charlie" });
});

Deno.test("Parser should handle grouped short flags", () => {
	const parser = new Parser();
	const cli = createMockCLI();
	const argv = ["command", "-abc"];
	// 'a' is required and expects a string, 'b' is boolean, 'c' is number
	// Since 'a' expects a string but is provided without a value, parser should throw MissingFlagError for 'a'

	assertThrows(
		() => {
			parser.parse(argv, cli);
		},
		MissingFlagError,
		"Missing required flag: -a. Expected type: string.",
	);
});

Deno.test("Parser should handle short flags with values", () => {
	const parser = new Parser();
	const cli = createMockCLI();
	const argv = ["test", "-o", "output.txt", "-f"];
	// 'f' is required and expects a string, but no value provided

	assertThrows(
		() => {
			parser.parse(argv, cli);
		},
		MissingFlagError,
		"Missing required flag: -f. Expected type: string.",
	);
});

Deno.test("Parser should throw InvalidFlagValueError for invalid number flag", () => {
	const parser = new Parser();
	const cli = createMockCLI();
	const argv = ["command", "-a", "value", "-c", "not-a-number"];
	assertThrows(
		() => {
			parser.parse(argv, cli);
		},
		InvalidFlagValueError,
		"Invalid value for flag -c: expected a number.",
	);
});
