// tests/integration/plugin_lifecycle.test.ts
import { TestFramework } from "../utils/test_framework.ts";
import { assertEquals } from "@std/assert";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";

Deno.test("Plugin Lifecycle Integration Tests", async (t) => {
	const framework = new TestFramework();

	await t.step("plugin load and unload cycle", async () => {
		const env = await framework.createTestEnvironment();
		const pluginDir = `${env.getBaseDir()}/tests/plugins`;
		await ensureDir(pluginDir);
		framework.getLogger().clear();

		// Create plugin with corrected error handling
		const pluginPath = await env.createPluginFile(
			"tests/plugins/lifecycle-plugin.ts",
			`
            import type { CLI } from "${env.resolveSrcPath("core.ts")}";
            import type { Plugin } from "${env.resolveSrcPath("plugin.ts")}";

            const plugin: Plugin = {
                metadata: {
                    name: "lifecycle-test-plugin",
                    version: "1.0.0",
                    description: "Test plugin for lifecycle management"
                },
                init: async (cli: CLI) => {
                    try {
                        cli.register({
                            name: "test-command",
                            description: "Test command",
                            action: async () => {
                                cli.logger.info("Test command executed");
                            }
                        });
                        cli.logger.info("Plugin initialized");
                    } catch (error) {
                        // Format error message correctly
                        cli.logger.error(\`Failed to initialize plugin: \${error instanceof Error ? error.message : String(error)}\`);
                        throw error;
                    }
                },
                unload: async (cli: CLI) => {
                    // @ts-ignore - Accessing private registry for cleanup
                    const registry = cli['registry'];
                    const removed = registry.remove("test-command");
                    cli.logger.info("Plugin destroyed");
                }
            };

            export default plugin;
        `,
		);

		try {
			// Log test environment details
			framework.getLogger().debug(
				`Test environment base dir: ${env.getBaseDir()}`,
			);
			framework.getLogger().debug(`Plugin path: ${pluginPath}`);

			// Load plugin with debug logging
			const loadResult = await framework.executeCommand([
				"plugin",
				"load",
				"--path",
				pluginPath,
				"--debug",
			]);

			assertEquals(
				loadResult.success,
				true,
				`Plugin failed to load: ${loadResult.error?.message}`,
			);

			// Wait for CLI and plugin initialization
			await framework.waitForCLIReady();
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Debug available commands
			const commands = framework.getRegisteredCommands();
			framework.getLogger().debug(`Available commands: ${commands.join(", ")}`);

			// Check command registration
			const execResult = await framework.executeCommand(["test-command"]);
			assertEquals(
				execResult.success,
				true,
				`Plugin command should be available. Commands: ${commands.join(", ")}`,
			);

			// Unload plugin
			const unloadResult = await framework.executeCommand([
				"plugin",
				"unload",
				"--name",
				"lifecycle-test-plugin",
			]);
			assertEquals(
				unloadResult.success,
				true,
				"Plugin should unload successfully",
			);

			// Verify command is no longer available
			const postUnloadResult = await framework.executeCommand(["test-command"]);
			assertEquals(
				postUnloadResult.success,
				false,
				"Command should not be available after unload",
			);
		} catch (error) {
			console.error("Test failed:", error);
			console.log("Debug state:", {
				baseDir: env.getBaseDir(),
				pluginPath,
				srcPath: env.resolveSrcPath("core.ts"),
				commands: framework.getRegisteredCommands(),
				logs: framework.getLogger().getLogs(),
				debugLogs: framework.getLogger().getDebugs(),
				errors: framework.getLogger().getErrors(),
			});
			throw error;
		} finally {
			await env.cleanup();
		}
	});

	// Clean up framework after all tests
	await t.step("cleanup", async () => {
		await framework.cleanup();
	});
});
