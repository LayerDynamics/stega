// tests/cli.test.ts
import { CLI } from "../src/core/core.ts"; // Import CLI from core.ts
import { Command } from "../src/command.ts"; // Import Command from command.ts
import { Args } from "../src/types/types.ts"; // Import Args from types.ts
import {
	assert,
	assertEquals,
} from "https://deno.land/std@0.203.0/testing/asserts.ts";

// Helper function to capture console output
async function captureConsoleOutput(
	func: () => void | Promise<void>,
): Promise<{ stdout: string; stderr: string }> {
	const originalLog = console.log;
	const originalError = console.error;
	let stdout = "";
	let stderr = "";

	console.log = (msg: unknown): void => {
		stdout += String(msg) + "\n";
	};

	console.error = (msg: unknown): void => {
		stderr += String(msg) + "\n";
	};

	try {
		const result = func();
		if (result instanceof Promise) {
			await result;
		}
	} finally {
		console.log = originalLog;
		console.error = originalError;
	}

	return { stdout, stderr };
}

Deno.test("CLI should execute the greet command correctly", async () => {
	const cli = new CLI(undefined, true, true); // Enable test mode

	let output = "";

	const greetCommand: Command = {
		name: "greet",
		description: "Greet the user",
		options: [
			{ name: "name", alias: "n", type: "string", required: true },
			{ name: "verbose", alias: "v", type: "boolean", default: false },
		],
		action: (args: Args) => {
			const name = args.flags.name;
			const verbose = args.flags.verbose;
			output = verbose ? `Hello, ${name}!` : `Hi, ${name}!`;
		},
	};

	cli.register(greetCommand);

	// Mock Deno.args
	const originalArgs = Deno.args;
	Object.defineProperty(Deno, "args", {
		value: ["greet", "--name=Tester", "--verbose"],
	});

	await cli.run();

	// Restore Deno.args
	Object.defineProperty(Deno, "args", { value: originalArgs });

	assertEquals(output, "Hello, Tester!");
});

Deno.test("CLI should handle missing required flags", async () => {
	const cli = new CLI(undefined, true, true); // Enable test mode

	const greetCommand: Command = {
		name: "greet",
		description: "Greet the user",
		options: [
			{ name: "name", alias: "n", type: "string", required: true },
		],
		action: () => {},
	};

	cli.register(greetCommand);

	// Mock Deno.args
	const originalArgs = Deno.args;
	Object.defineProperty(Deno, "args", { value: ["greet"] });

	let error: Error | undefined;
	const { stdout } = await captureConsoleOutput(async () => {
		try {
			await cli.run();
		} catch (e) {
			error = e as Error;
		}
	});

	// Restore Deno.args
	Object.defineProperty(Deno, "args", { value: originalArgs });

	assert(error?.message.includes("Missing required flag: --name"));
	assert(stdout.includes("Available Commands:"));
});

Deno.test("CLI should handle invalid flag values", async () => {
	const cli = new CLI(undefined, true, true); // Enable test mode

	const greetCommand: Command = {
		name: "greet",
		description: "Greet the user",
		options: [
			{ name: "name", alias: "n", type: "string", required: true },
			{ name: "times", alias: "t", type: "number", default: 1 },
		],
		action: () => {},
	};

	cli.register(greetCommand);

	// Mock Deno.args
	const originalArgs = Deno.args;
	Object.defineProperty(Deno, "args", {
		value: ["greet", "--name=Bob", "--times=abc"],
	});

	let error: Error | undefined;
	const { stdout } = await captureConsoleOutput(async () => {
		try {
			await cli.run();
		} catch (e) {
			error = e as Error;
		}
	});

	// Restore Deno.args
	Object.defineProperty(Deno, "args", { value: originalArgs });

	assert(
		error?.message.includes(
			"Invalid value for flag --times: expected a number.",
		),
	);
	assert(stdout.includes("Available Commands:"));
});

Deno.test("CLI should handle unknown commands", async () => {
	const cli = new CLI(undefined, true, true); // Enable test mode

	// Mock Deno.args
	const originalArgs = Deno.args;
	Object.defineProperty(Deno, "args", { value: ["unknown"] });

	let error: Error | undefined;
	const { stdout } = await captureConsoleOutput(async () => {
		try {
			await cli.run();
		} catch (e) {
			error = e as Error;
		}
	});

	// Restore Deno.args
	Object.defineProperty(Deno, "args", { value: originalArgs });

	assert(error?.message.includes('Command "unknown" not found.'));
	assert(stdout.includes("Available Commands:"));
});

Deno.test("CLI should handle unknown subcommands", async () => {
	const cli = new CLI(undefined, true, true); // Enable test mode

	const userCommand: Command = {
		name: "user",
		description: "User management commands",
		subcommands: [
			{
				name: "add",
				description: "Add a new user",
				action: () => {},
			},
			{
				name: "remove",
				description: "Remove an existing user",
				action: () => {},
			},
		],
		action: () => {},
	};

	cli.register(userCommand);

	// Mock Deno.args
	const originalArgs = Deno.args;
	Object.defineProperty(Deno, "args", { value: ["user", "update"] });

	let error: Error | undefined;
	const { stdout } = await captureConsoleOutput(async () => {
		try {
			await cli.run();
		} catch (e) {
			error = e as Error;
		}
	});

	// Restore Deno.args
	Object.defineProperty(Deno, "args", { value: originalArgs });

	assert(error?.message.includes('Subcommand "update" not found.'));
	assert(stdout.includes("Available Commands:"));
});

Deno.test("CLI should display general help when no command is provided", async () => {
	const cli = new CLI(undefined, true, true); // Enable test mode

	// Mock Deno.args
	const originalArgs = Deno.args;
	Object.defineProperty(Deno, "args", { value: [] });

	const { stdout } = await captureConsoleOutput(async () => {
		await cli.run();
	});

	// Restore Deno.args

	Object.defineProperty(Deno, "args", { value: originalArgs });

	assert(stdout.includes("Available Commands:"));
});
