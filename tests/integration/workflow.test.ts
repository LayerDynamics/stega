// tests/integration/workflow.test.ts
import {TestHarness} from "../utils/test_harness.ts";
import {assertEquals} from "@std/assert";

Deno.test("Workflow Integration - command chaining",async (t) => {
	const harness=new TestHarness();
	const cli=harness.getCLI();
	const logger=harness.getLogger();

	const executed: string[]=[];

	// Register test commands
	cli.register({
		name: "first",
		action: () => {
			executed.push("first");
		}
	});

	cli.register({
		name: "second",
		action: () => {
			executed.push("second");
		}
	});

	await t.step("executes commands in sequence",async () => {
		await cli.runCommand(["first"]);
		await cli.runCommand(["second"]);

		assertEquals(executed,["first","second"]);
		assertEquals(logger.errors.length,0);
	});

	await harness.cleanup();
});