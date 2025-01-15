// tests/integration/plugin_lifecycle.test.ts
import { assertEquals } from "jsr:@std/assert@0.224.0";
import { CLI } from "../../src/core/core.ts";
import { PluginLoader } from "../../src/plugins/plugin_loader.ts";
import { createTempFile } from "../test_utils.ts";

Deno.test("Plugin Lifecycle Integration Tests", async (t) => {
	await t.step("plugin load and unload cycle", async () => {
		const cli = new CLI();
		const loader = new PluginLoader();

		const pluginPath = await createTempFile(
			`
      export default {
        metadata: {
          name: "test-plugin",
          version: "1.0.0"
        },
        init: async (cli) => {
          cli.register({
            name: "test",
            action: () => console.log("Test executed")
          });
        },
        unload: async (cli) => {
          console.log("Plugin unloaded");
        }
      };
    `,
			true,
		);

		try {
			await loader.loadPlugin(pluginPath, cli);
			const plugins = loader.listPlugins();
			assertEquals(plugins.length, 1);
			assertEquals(plugins[0].name, "test-plugin");
			await loader.unloadPlugin("test-plugin", cli);
		} finally {
			await Deno.remove(pluginPath).catch(() => {});
		}
	});
});
