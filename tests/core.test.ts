// tests/core.test.ts
import { CLI } from "../src/core/core.ts";
import { assert, assertEquals, assertRejects } from "@std/assert";
import {
	CommandNotFoundError,
	InvalidFlagValueError,
	MissingFlagError,
} from "../src/error.ts";

// Helper function to capture console output
async function captureOutput(
	fn: () => Promise<void>,
): Promise<{ stdout: string; stderr: string }> {
	const originalLog = console.log;
	const originalError = console.error;
	let stdout = "";
	let stderr = "";

	console.log = (...args: unknown[]) => {
		stdout += args.join(" ") + "\n";
	};
	console.error = (...args: unknown[]) => {
		stderr += args.join(" ") + "\n";
	};

	try {
		await fn();
	} finally {
		console.log = originalLog;
		console.error = originalError;
	}

	return { stdout, stderr };
}

// Test setup helper
function setupTestCLI(args: string[]) {
	const cli = new CLI(undefined, true, true);
	const originalArgs = Deno.args;
	Object.defineProperty(Deno, "args", { value: args });
	return {
		cli,
		restore: () => Object.defineProperty(Deno, "args", { value: originalArgs }),
	};
}

Deno.test("CLI - Basic command registration and execution", async () => {
	const { cli, restore } = setupTestCLI(["test", "--value=123"]);
	try {
		let executed = false;

		cli.register({
			name: "test",
			options: [{ name: "value", type: "number", required: true }],
			action: (args) => {
				executed = true;
				assertEquals(args.flags.value, 123);
			},
		});

		await cli.run();
		assert(executed, "Command should have executed");
	} finally {
		restore();
	}
});

Deno.test("CLI - Required flag validation", async () => {
	const { cli, restore } = setupTestCLI(["test"]);
	try {
		cli.register({
			name: "test",
			options: [{ name: "required", type: "string", required: true }],
			action: () => {},
		});

		await assertRejects(
			() => cli.run(),
			MissingFlagError,
			"Missing required flag: --required",
		);
	} finally {
		restore();
	}
});

Deno.test("CLI - Flag type validation", async () => {
	const { cli, restore } = setupTestCLI(["test", "--number=invalid"]);
	try {
		cli.register({
			name: "test",
			options: [{ name: "number", type: "number", required: true }],
			action: () => {},
		});

		await assertRejects(
			() => cli.run(),
			InvalidFlagValueError,
			"Invalid value for flag --number: expected a number",
		);
	} finally {
		restore();
	}
});

Deno.test("CLI - Help command", async () => {
	const { cli, restore } = setupTestCLI(["help"]);
	try {
		cli.register({
			name: "test",
			description: "Test command",
			action: () => {},
		});

		const { stdout } = await captureOutput(() => cli.run());
		assert(stdout.includes("Available Commands:"));
		assert(stdout.includes("test"));
		assert(stdout.includes("Test command"));
	} finally {
		restore();
	}
});

Deno.test("CLI - Subcommand handling", async () => {
	const { cli, restore } = setupTestCLI(["parent", "child", "--flag=value"]);
	try {
		let executed = false;

		cli.register({
			name: "parent",
			subcommands: [{
				name: "child",
				options: [{ name: "flag", type: "string", required: true }],
				action: (args) => {
					executed = true;
					assertEquals(args.flags.flag, "value");
				},
			}],
			action: () => {},
		});

		await cli.run();
		assert(executed, "Subcommand should have executed");
	} finally {
		restore();
	}
});

Deno.test("CLI - Unknown command handling", async () => {
	const { cli, restore } = setupTestCLI(["unknown"]);
	try {
		await assertRejects(
			() => cli.run(),
			CommandNotFoundError,
			'Command "unknown" not found',
		);
	} finally {
		restore();
	}
});

Deno.test("CLI - Flag aliases", async () => {
	const { cli, restore } = setupTestCLI(["test", "-v"]);
	try {
		let executed = false;

		cli.register({
			name: "test",
			options: [{
				name: "verbose",
				alias: "v",
				type: "boolean",
				default: false,
			}],
			action: (args) => {
				executed = true;
				assertEquals(args.flags.verbose, true);
			},
		});

		await cli.run();
		assert(executed, "Command should have executed");
	} finally {
		restore();
	}
});

Deno.test("CLI - Default values", async () => {
	const { cli, restore } = setupTestCLI(["test"]);
	try {
		let executed = false;

		cli.register({
			name: "test",
			options: [{
				name: "count",
				type: "number",
				default: 42,
			}],
			action: (args) => {
				executed = true;
				assertEquals(args.flags.count, 42);
			},
		});

		await cli.run();
		assert(executed, "Command should have executed");
	} finally {
		restore();
	}
});
