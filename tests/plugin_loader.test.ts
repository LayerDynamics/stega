// tests/plugin_loader.test.ts
import { PluginLoader } from "../src/plugin_loader.ts";
import { CLI } from "../src/core/core.ts";
import { assertEquals } from "jsr:@std/assert@0.224.0";
import type { Plugin } from "../src/plugin.ts";
import { createTempFile } from "./test_utils.ts";

// Define interface for globalThis extension
interface CustomGlobalThis {
	import: (path: string) => Promise<{ default: Plugin }>;
}

Deno.test("PluginLoader - basic plugin loading", async () => {
	const cli = new CLI(undefined, true, true);
	const loader = new PluginLoader();

	const pluginContent = `
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

	const pluginPath = await createTempFile(pluginContent, true);

	await loader.loadPlugin(pluginPath, cli);
	const plugins = loader.listPlugins();
	assertEquals(plugins.length, 1);
	assertEquals(plugins[0].name, "TestPlugin");
});

Deno.test("PluginLoader - dependency handling", async () => {
	const cli = new CLI();
	const loader = new PluginLoader();

	const basePluginContent = `
        export default {
            metadata: {
                name: "BasePlugin",
                version: "1.0.0"
            },
            init: (cli) => {
                cli.register({
                    name: "base",
                    description: "Base command",
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
                dependencies: ["BasePlugin"]
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

	const basePluginPath = await createTempFile(basePluginContent, true);
	const dependentPluginPath = await createTempFile(
		dependentPluginContent,
		true,
	);

	await loader.loadPlugin(basePluginPath, cli);
	await loader.loadPlugin(dependentPluginPath, cli);

	const plugins = loader.listPlugins();
	assertEquals(plugins.length, 2);
	assertEquals(plugins[0].name, "BasePlugin");
	assertEquals(plugins[1].name, "DependentPlugin");
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
