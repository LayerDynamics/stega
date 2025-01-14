import { TestFramework } from "../utils/test_framework.ts";
import { assertEquals, assertExists } from "@std/assert";
import { createTestCLI } from "../test_utils.ts";

Deno.test("Resource Management Integration Tests", async (t) => {
	const { cli, logger } = await createTestCLI();
	let tempPath: string;

	try {
		await t.step("file resource handling", async () => {
			tempPath = await Deno.makeTempFile();
			await Deno.writeTextFile(tempPath, "test content");

			cli.register({
				name: "read-file",
				action: async () => {
					const content = await Deno.readTextFile(tempPath);
					console.log(content);
					// Don't return anything
				},
			});

			await cli.runCommand(["read-file"]);
			assertEquals(logger.errors.length, 0);
		});
	} finally {
		await Deno.remove(tempPath!);
	}
});
