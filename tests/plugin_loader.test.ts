// tests/plugin_loader.test.ts
import { PluginLoader } from "../src/plugins/plugin_loader.ts";
import { CLI } from "../src/core/core.ts";
import { assertEquals } from "jsr:@std/assert@0.224.0";
import type { Plugin } from "../src/plugins/plugin.ts";
import { createTempFile } from "./test_utils.ts";

// Define interface for globalThis extension
interface CustomGlobalThis {
	import: (path: string) => Promise<{ default: Plugin }>;
}

Deno.test("PluginLoader - basic plugin loading", async () => {
	const cli = new CLI(undefined, true, true);
	const loader = new PluginLoader();

	const pluginPath = await createTempFile(
		`
    export default {
      metadata: {
        name: "test-plugin",
        version: "1.0.0"
      },
      init: () => {}
    };
  `,
		true,
	);

	try {
		await loader.loadPlugin(pluginPath, cli);
		const plugins = loader.listPlugins();
		assertEquals(plugins.length, 1);
		assertEquals(plugins[0].name, "test-plugin");
	} finally {
		await Deno.remove(pluginPath).catch(() => {});
	}
});

Deno.test("PluginLoader - dependency handling", async () => {
	const cli = new CLI();
	const loader = new PluginLoader();

	const basePluginContent = `
    export default {
      metadata: {
        name: "base-plugin",
        version: "1.0.0"
      },
      init: () => {}
    };
  `;

	const dependentPluginContent = `
    export default {
      metadata: {
        name: "dependent-plugin",
        version: "1.0.0",
        dependencies: ["base-plugin"]
      },
      init: () => {}
    };
  `;

	const basePath = await createTempFile(basePluginContent, true);
	const dependentPath = await createTempFile(dependentPluginContent, true);

	try {
		await loader.loadPlugin(basePath, cli);
		await loader.loadPlugin(dependentPath, cli);
		const plugins = loader.listPlugins();
		assertEquals(plugins.length, 2);
		assertEquals(plugins[0].name, "base-plugin");
		assertEquals(plugins[1].name, "dependent-plugin");
	} finally {
		await Deno.remove(basePath);
		await Deno.remove(dependentPath);
	}
});

Deno.test("PluginLoader should handle dependencies correctly", async () => {
	const cli = new CLI();
	const pluginLoader = new PluginLoader();

	const testPluginContent = `
        export default {
            metadata: {
                name: "TestPlugin",
                version: "1.0.0",
                description: "A test plugin",
                dependencies: []
            },
            init: (cli) => {
                cli.register({
                    name: "test",
                    description: "Test command",
                    action: () => {}
                });
            }
        };
    `;

	const dependentPluginContent = `
        export default {
            metadata: {
                name: "DependentPlugin",
                version: "1.0.0",
                description: "A plugin that depends on TestPlugin",
                dependencies: ["TestPlugin"]
            },
            init: (cli) => {
                cli.register({
                    name: "dependent",
                    description: "Dependent command",
                    action: () => {}
                });
            }
        };
    `;

	const testPluginPath = await createTempFile(testPluginContent, true);
	const dependentPluginPath = await createTempFile(
		dependentPluginContent,
		true,
	);

	// Load TestPlugin first
	await pluginLoader.loadPlugin(testPluginPath, cli);
	// Then load DependentPlugin
	await pluginLoader.loadPlugin(dependentPluginPath, cli);
	// Attempt to load DependentPlugin again to test idempotency
	await pluginLoader.loadPlugin(dependentPluginPath, cli);

	const plugins = pluginLoader.listPlugins();
	assertEquals(plugins.length, 2);
	assertEquals(plugins[0].name, "TestPlugin");
	assertEquals(plugins[1].name, "DependentPlugin");
});
