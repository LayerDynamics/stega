import { createWorkflowCommand } from '../../src/commands/workflow_command.ts';
import type { Command } from '../../src/command.ts';
import { createTempFile, createTestCLI } from '../utils/test_helpers.ts';

Deno.test('Workflow Command - Add and run workflow', async () => {
	const cli = createTestCLI();
	const command = createWorkflowCommand(cli) as Command;
	cli.register(command);

	const config = {
		steps: [{ name: 'step1', command: 'echo test' }],
	};

	const configPath = await createTempFile(JSON.stringify(config));

	await cli.runCommand([
		'workflow',
		'add',
		'--name=test-workflow',
		`--config=${configPath}`,
	]);

	await cli.runCommand([
		'workflow',
		'run',
		'--name=test-workflow',
	]);

	await Deno.remove(configPath);
});

// ...rest of workflow tests...
