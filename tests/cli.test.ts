import { assert, assertEquals, assertRejects } from "jsr:@std/assert@0.224.0";
import { createTestContext, mockDenoArgs } from "./test_utils.ts";
import { Command } from "../src/command.ts";
import { Args } from "../src/types/types.ts";
import {
	CommandNotFoundError,
	InvalidFlagValueError,
	MissingFlagError,
	SubcommandNotFoundError,
} from "../src/error.ts";

Deno.test("CLI Tests", async (t) => {
	await t.step("executes greet command correctly", async () => {
		const { cli, logger, cleanup } = await createTestContext();
		let output = "";

		const greetCommand: Command = {
			name: "greet",
			description: "Greet the user",
			options: [
				{ name: "name", alias: "n", type: "string", required: true },
				{ name: "verbose", alias: "v", type: "boolean", default: false },
			],
			action: (args: Args) => {
				const name = args.flags.name as string;
				const verbose = args.flags.verbose as boolean;
				output = verbose ? `Hello, ${name}!` : `Hi, ${name}!`;
			},
		};

		cli.register(greetCommand);
		const restore = await mockDenoArgs(["greet", "--name=Tester", "--verbose"]);

		try {
			await cli.run();
			assertEquals(output, "Hello, Tester!");
		} finally {
			restore();
			await cleanup();
		}
	});

	await t.step("handles missing required flags", async () => {
		const { cli, logger, cleanup } = await createTestContext();

		const greetCommand: Command = {
			name: "greet",
			description: "Greet the user",
			options: [
				{ name: "name", alias: "n", type: "string", required: true },
			],
			action: () => {},
		};

		cli.register(greetCommand);
		const restore = await mockDenoArgs(["greet"]);

		try {
			await assertRejects(
				() => cli.run(),
				MissingFlagError,
				"Missing required flag: --name",
			);
			assert(logger.hasMessage("Available Commands:"));
		} finally {
			restore();
			await cleanup();
		}
	});

	await t.step("handles invalid flag values", async () => {
		const { cli, logger, cleanup } = await createTestContext();

		const countCommand: Command = {
			name: "count",
			description: "Count something",
			options: [
				{ name: "times", alias: "t", type: "number", required: true },
			],
			action: () => {},
		};

		cli.register(countCommand);
		const restore = await mockDenoArgs(["count", "--times=invalid"]);

		try {
			await assertRejects(
				() => cli.run(),
				InvalidFlagValueError,
				"Invalid value for flag --times: expected a number",
			);
			assert(logger.hasMessage("Available Commands:"));
		} finally {
			restore();
			await cleanup();
		}
	});

	await t.step("handles unknown commands", async () => {
		const { cli, logger, cleanup } = await createTestContext();
		const restore = await mockDenoArgs(["unknown"]);

		try {
			await assertRejects(
				() => cli.run(),
				CommandNotFoundError,
				'Command "unknown" not found',
			);
			assert(logger.hasMessage("Available Commands:"));
		} finally {
			restore();
			await cleanup();
		}
	});

	await t.step("handles unknown subcommands", async () => {
		const { cli, logger, cleanup } = await createTestContext();

		const userCommand: Command = {
			name: "user",
			description: "User management",
			subcommands: [
				{
					name: "add",
					description: "Add a user",
					action: () => {},
				},
			],
			action: () => {},
		};

		cli.register(userCommand);
		const restore = await mockDenoArgs(["user", "unknown"]);

		try {
			await assertRejects(
				() => cli.run(),
				SubcommandNotFoundError,
				'Subcommand "unknown" not found',
			);
			assert(logger.hasMessage("Available Commands:"));
		} finally {
			restore();
			await cleanup();
		}
	});

	await t.step("displays general help when no command provided", async () => {
		const { cli, logger, cleanup } = await createTestContext();
		const restore = await mockDenoArgs([]);

		try {
			await cli.run();
			assert(logger.hasMessage("Available Commands:"));
		} finally {
			restore();
			await cleanup();
		}
	});
});
