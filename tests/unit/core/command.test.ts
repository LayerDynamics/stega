// tests/unit/core/command.test.ts
import { assertEquals, assertRejects } from "@std/assert";
import { Command, CommandRegistry } from "../../../src/command.ts";
import { TestHarness } from "../../utils/test_harness.ts";

Deno.test("CommandRegistry - comprehensive command management", async (t) => {
	const harness = new TestHarness();

	await t.step("registration and retrieval", async () => {
		const registry = new CommandRegistry();
		const command: Command = {
			name: "test",
			description: "Test command",
			options: [{
				name: "flag",
				type: "string",
				required: true,
			}],
			action: () => {},
		};

		registry.register(command);
		const retrieved = registry.findCommand("test");
		assertEquals(retrieved?.name, command.name);
		assertEquals(retrieved?.description, command.description);
	});

	await t.step("subcommand handling", async () => {
		const registry = new CommandRegistry();
		const command: Command = {
			name: "parent",
			subcommands: [{
				name: "child",
				action: () => {},
			}],
			action: () => {},
		};

		registry.register(command);
		const subcommand = registry.findSubcommand(command, ["child"]);
		assertEquals(subcommand?.name, "child");
	});

	await t.step("alias resolution", async () => {
		const registry = new CommandRegistry();
		const command: Command = {
			name: "test",
			aliases: ["t", "tst"],
			action: () => {},
		};

		registry.register(command);
		const byAlias1 = registry.findCommand("t");
		const byAlias2 = registry.findCommand("tst");
		assertEquals(byAlias1?.name, command.name);
		assertEquals(byAlias2?.name, command.name);
	});

	await harness.cleanup();
});
