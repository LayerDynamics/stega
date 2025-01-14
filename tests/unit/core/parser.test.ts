// tests/unit/core/parser.test.ts
import { Parser } from "../../../src/parser.ts";
import { TestHarness } from "../../utils/test_harness.ts";
import { assertEquals, assertRejects } from "@std/assert";
import { MissingFlagError } from "../../../src/error.ts";
import { createTestCLI } from "../../test_utils.ts";

Deno.test("Parser - comprehensive argument parsing", async (t) => {
	const harness = new TestHarness();
	const { cli, logger } = await createTestCLI();

	await t.step("handles complex flag combinations", async () => {
		const parser = new Parser();
		cli.register({
			name: "test",
			options: [
				{ name: "string", type: "string", required: true },
				{ name: "number", type: "number" },
				{ name: "boolean", type: "boolean" },
				{ name: "array", type: "array" },
			],
			action: () => {},
		});

		const args = parser.parse([
			"test",
			"--string=value",
			"--number=42",
			"--boolean",
			"--array=a,b,c",
		], cli); // Pass CLI instance directly

		assertEquals(args.command, ["test"]);
		assertEquals(args.flags.string, "value");
		assertEquals(args.flags.number, 42);
		assertEquals(args.flags.boolean, true);
		assertEquals(args.flags.array, ["a", "b", "c"]);
	});

	await t.step("validates required flags", async () => {
		const parser = new Parser();

		// Register command with required flag
		cli.register({
			name: "validate-test",
			options: [{
				name: "required",
				type: "string",
				required: true,
			}],
			action: () => {},
		});

		// Should throw MissingFlagError
		await assertRejects(
			async () => {
				await cli.runCommand(["validate-test"]);
			},
			MissingFlagError,
			"Missing required flag: --required",
		);
	});

	await harness.cleanup();
});
