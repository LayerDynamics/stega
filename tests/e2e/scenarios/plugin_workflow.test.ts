// tests/e2e/scenarios/plugin_workflow.test.ts
import { assertEquals } from "@std/assert";
import { createTestCLI } from "../../test_utils.ts";

Deno.test("E2E - Plugin and Workflow Integration", async (t) => {
    await t.step("loads plugin and executes workflow", async () => {
        const { cli, logger } = await createTestCLI();
        
        const pluginContent = `
            export default {
                metadata: {
                    name: "test-plugin",
                    version: "1.0.0"
                },
                init: (cli) => {
                    cli.register({
                        name: "test-command",
                        action: () => {}
                    });
                }
            };
        `;
        
        const pluginPath = await Deno.makeTempFile({ suffix: ".ts" });
        await Deno.writeTextFile(pluginPath, pluginContent);
        
        await cli.loadPlugins([pluginPath]); // Use loadPlugins instead of loadPlugin
        
        await cli.runCommand(["test-command"]); // Remove result.success check
        assertEquals(logger.errors.length, 0); // Check for errors instead
        
        await Deno.remove(pluginPath);
    });
});
