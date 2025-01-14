// tests/performance/startup.test.ts
import { TestHarness } from "../utils/test_harness.ts";
import { assert, assertEquals } from "@std/assert";

Deno.test("Performance - CLI Startup", async (t) => {
	const harness = new TestHarness();

	await t.step("measures startup time", async () => {
		const start = performance.now();
		const cli = harness.getCLI();
		const end = performance.now();

		const startupTime = end - start;
		assert(
			startupTime < 100,
			`Startup time (${startupTime}ms) exceeds 100ms threshold`,
		);
	});

	await t.step("measures command registration overhead", async () => {
		const cli = harness.getCLI();
		const start = performance.now();

		// Register test commands
		for (let i = 0; i < 100; i++) {
			cli.register({
				name: `test-${i}`,
				action: () => {},
			});
		}

		const end = performance.now();
		const registrationTime = end - start;
		assert(
			registrationTime < 50,
			`Registration time (${registrationTime}ms) exceeds 50ms threshold`,
		);
	});

	await harness.cleanup();
});
