// tests/e2e/scenarios/plugin_workflow.test.ts
import { assertEquals } from "@std/assert";
import { createTestCLI } from "../../test_utils.ts";
import type { CLI } from "../../../src/core/core.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts"; // or similar import
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";

Deno.test("E2E - Plugin and Workflow Integration", async (t) => {
	await t.step("loads plugin and executes workflow", async () => {
		const { cli, logger } = await createTestCLI();

		// Create plugin directory in tests folder
		const pluginsDir = join(Deno.cwd(), "tests", "plugins");
		await ensureDir(pluginsDir);

		const pluginContent = `
            import { CLI } from "${
			import.meta.resolve("../../../src/core.ts")
		}";
            
            const plugin = {
                metadata: {
                    name: "test-plugin",
                    version: "1.0.0"
                },
                init: async (cli: CLI) => {
                    cli.register({
                        name: "test-command",
                        action: () => {
                            console.log("Plugin command executed");
                        }
                    });
                    console.log("Plugin initialized");
                }
            };
            
            export default plugin;
        `;

		// Use a deterministic plugin path
		const pluginName = `test-plugin-${Date.now()}.ts`;
		const pluginPath = join(pluginsDir, pluginName);

		try {
			await Deno.writeTextFile(pluginPath, pluginContent);
			await cli.loadPlugins([pluginPath]);
			await cli.runCommand(["test-command"]);
			assertEquals(logger.getErrorCount(), 0, "Should have no errors");
		} finally {
			// Cleanup
			await Deno.remove(pluginPath).catch(() => {});
		}
	});
});
