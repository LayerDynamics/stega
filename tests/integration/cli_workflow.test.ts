// cli_workflow.test.ts
import { CLI } from '../../src/core.ts';
import { Plugin } from '../../src/plugin.ts';
import { type CommandResult, TestFramework } from '../utils/test_framework.ts';
import { assertEquals } from '@std/assert';

export async function setupCliWorkflowTest(t: Deno.TestContext) {
	const framework = new TestFramework();
	const cli = framework.getCLI();

	await t.step('complete command workflow', async () => {
		const env = await framework.createTestEnvironment();

		// Create plugin with proper module exports and types
		const pluginPath = await env.createFile(
			'plugin.ts',
			`
            import type { CLI } from "../../src/core.ts";
            import type { Plugin } from "../../src/plugin.ts";

            const plugin: Plugin = {
                metadata: {
                    name: "test-plugin",
                    version: "1.0.0"
                },
                init: async (cli: CLI) => {
                    cli.register({
                        name: "plugin-command",
                        action: async () => {
                            console.log("Plugin command executed");
                        }
                    });
                    console.log("Plugin initialized");
                }
            };

            export default plugin;
        `,
		);

		try {
			// Load plugin and verify success
			const loadResult = await framework.executeCommand([
				'plugin',
				'load',
				'--path',
				pluginPath,
			]);
			assertEquals(loadResult.success, true, 'Plugin should load successfully');
			assertEquals(
				loadResult.error,
				undefined,
				'Should not have loading errors',
			);

			// Wait for plugin initialization
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Execute plugin command
			const execResult = await framework.executeCommand(['plugin-command']);
			assertEquals(
				execResult.success,
				true,
				'Plugin command should execute successfully',
			);
			assertEquals(
				execResult.error,
				undefined,
				'Should not have execution errors',
			);

			// Verify logs contain initialization message
			const logs = framework.getLogger().getLogs();
			assertEquals(
				logs.some((log) => log.includes('Plugin initialized')),
				true,
				'Should show plugin initialization message',
			);

			// Test help command
			const helpResult = await framework.executeCommand(['help']);
			assertEquals(
				helpResult.success,
				true,
				'Help command should work after plugin operations',
			);
			assertEquals(
				helpResult.error,
				undefined,
				'Help command should not have errors',
			);
		} catch (error) {
			const errorMessage = error instanceof Error
				? error.message
				: String(error);
			console.error('Test failed:', errorMessage);
			throw error;
		} finally {
			await env.cleanup?.();
			await framework.cleanup();
		}
	});
}

export async function setupPluginLifecycleTest(t: Deno.TestContext) {
	const framework = new TestFramework();

	await t.step('plugin load and unload cycle', async () => {
		const env = await framework.createTestEnvironment();
		framework.getLogger().clear();

		const pluginPath = await env.createFile(
			'lifecycle-plugin.ts',
			`
            import type { CLI } from "../../src/core.ts";
            import type { Plugin } from "../../src/plugin.ts";

            const plugin: Plugin = {
                metadata: {
                    name: "lifecycle-test-plugin",
                    version: "1.0.0"
                },
                init: async (cli: CLI) => {
                    try {
                        cli.register({
                            name: "test-command",
                            description: "Test command",
                            action: async () => {
                                console.log("Test command executed");
                            }
                        });
                        await new Promise(resolve => setTimeout(resolve, 100));
                        console.log("Plugin initialized");
                    } catch (error) {
                        console.error("Failed to register command:", error);
                        throw error;
                    }
                },
                unload: async (cli: CLI) => {
                    // @ts-ignore - Accessing private registry for cleanup
                    cli['registry'].remove("test-command");
                    console.log("Plugin destroyed");
                }
            };

            export default plugin;
        `,
		);

		try {
			// Load plugin
			const loadResult = await framework.executeCommand([
				'plugin',
				'load',
				'--path',
				pluginPath,
				'--debug',
			]);
			assertEquals(loadResult.success, true, 'Plugin should load successfully');

			// Wait for CLI to be ready
			await framework.waitForCLIReady();

			// Verify command registration
			const commands = framework.getRegisteredCommands();
			console.log('Available commands:', commands);

			const commandExists = framework.hasCommand('test-command');
			assertEquals(
				commandExists,
				true,
				`test-command should be registered. Available commands: ${
					commands.join(', ')
				}`,
			);

			// Rest of the test remains the same...
			// ...existing code...
		} catch (error) {
			console.error('Test failed:', error);
			console.log('Debug state:', {
				commands: framework.getRegisteredCommands(),
				logs: framework.getLogger().getLogs(),
				debugLogs: framework.getLogger().getDebugs(),
				errors: framework.getLogger().getErrors(),
			});
			throw error;
		} finally {
			await env.cleanup();
			await framework.cleanup();
		}
	});
}
