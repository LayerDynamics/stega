// tests/e2e/scenarios/plugin_workflow.test.ts
import { assertEquals } from "@std/assert";
import { createTestCLI, createTestPluginFile } from "../../test_utils.ts";

Deno.test("E2E - Plugin and Workflow Integration", async (t) => {
	await t.step("loads plugin and executes workflow", async () => {
		const { cli, logger } = await createTestCLI();

		const pluginContent = `
            import type { CLI } from "../../src/plugins/mod.ts";
            
            const plugin = {
                metadata: {
                    name: "test-plugin",
                    version: "1.0.0"
                },
                init: async (cli: CLI) => {
                    cli.register({
                        name: "test-command",
                        description: "Test command",
                        action: () => {
                            cli.logger.info("Plugin command executed");
                        }
                    });
                }
            };
            
            export default plugin;
        `;

		const pluginPath = await createTestPluginFile(pluginContent);

		try {
			await cli.loadPlugins([pluginPath]);
			await cli.runCommand(["test-command"]);

			assertEquals(logger.getErrorCount(), 0, "Should have no errors");
			assertEquals(
				logger.getLastMessage()?.includes("Plugin command executed"),
				true,
				"Should log command execution",
			);
		} finally {
			await Deno.remove(pluginPath).catch(() => {});
		}
	});
});
