// tests/e2e/scenarios/plugin_workflow.test.ts
import { assertEquals } from '@std/assert';
import { createTestCLI } from '../../test_utils.ts';
import type { CLI } from '../../../src/core.ts';

Deno.test('E2E - Plugin and Workflow Integration', async (t) => {
	await t.step('loads plugin and executes workflow', async () => {
		const { cli, logger } = await createTestCLI();

		const pluginContent = `
            import { CLI } from "${
			import.meta.resolve('../../../src/core.ts')
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

		const pluginPath = await Deno.makeTempFile({ suffix: '.ts' });
		await Deno.writeTextFile(pluginPath, pluginContent);

		try {
			await cli.loadPlugins([pluginPath]);
			await cli.runCommand(['test-command']);
			assertEquals(logger.errors.length, 0, 'Should have no errors');
		} finally {
			await Deno.remove(pluginPath);
		}
	});
});
