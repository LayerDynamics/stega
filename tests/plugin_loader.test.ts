// tests/plugin_loader.test.ts
import { PluginLoader } from "../src/plugin_loader.ts";
import { CLI } from "../src/core.ts";
import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import type { Plugin } from "../src/plugin.ts";

// Define interface for globalThis extension
interface CustomGlobalThis {
	import: (path: string) => Promise<{ default: Plugin }>;
}

Deno.test("PluginLoader - basic plugin loading", async () => {
	const cli = new CLI(undefined, true, true);
	const loader = new PluginLoader();

	// Mock plugin as a URL string to avoid filesystem access
	const mockUrl = "data:text/javascript;base64," + btoa(`
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
    `);

	await loader.loadPlugin(mockUrl, cli);
	const plugins = loader.listPlugins();
	assertEquals(plugins.length, 1);
	assertEquals(plugins[0].name, "TestPlugin");
});

Deno.test("PluginLoader - dependency handling", async () => {
	const cli = new CLI();
	const loader = new PluginLoader();

	const basePluginUrl = "data:text/javascript;base64," + btoa(`
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
    `);

	const dependentPluginUrl = "data:text/javascript;base64," + btoa(`
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
    `);

	await loader.loadPlugin(basePluginUrl, cli);
	await loader.loadPlugin(dependentPluginUrl, cli);

	const plugins = loader.listPlugins();
	assertEquals(plugins.length, 2);
	assertEquals(plugins[0].name, "BasePlugin");
	assertEquals(plugins[1].name, "DependentPlugin");
});

Deno.test("PluginLoader should handle dependencies correctly", async () => {
	const cli = new CLI();
	const pluginLoader = new PluginLoader();

	// Define mock plugins as data URLs
	const testPluginUrl = "data:text/javascript;base64," + btoa(`
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
    `);

	const dependentPluginUrl = "data:text/javascript;base64," + btoa(`
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
    `);

	// Load TestPlugin first
	await pluginLoader.loadPlugin(testPluginUrl, cli);
	// Then load DependentPlugin
	await pluginLoader.loadPlugin(dependentPluginUrl, cli);
	// Attempt to load DependentPlugin again to test idempotency
	await pluginLoader.loadPlugin(dependentPluginUrl, cli);

	const plugins = pluginLoader.listPlugins();
	assertEquals(plugins.length, 2);
	assertEquals(plugins[0].name, "TestPlugin");
	assertEquals(plugins[1].name, "DependentPlugin");
});
