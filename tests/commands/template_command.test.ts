// tests/commands/template_command.test.ts
import {
	assertEquals,
	assertRejects,
} from 'https://deno.land/std@0.224.0/testing/asserts.ts';
import { createTemplateCommand } from '../../src/commands/template_command.ts';
import {
	cleanupTempFiles,
	createTempFile,
	createTestCLI,
} from '../test_utils.ts';

Deno.test({
	name: 'Template Command - Variable validation with invalid input',
	async fn() {
		const { cli, logger } = await createTestCLI();
		const command = createTemplateCommand(cli);
		cli.register(command);

		// Create test template and config files
		const templatePath = await createTempFile('Email: {{email}}');
		const configPath = await createTempFile(
			JSON.stringify({
				description: 'Test template with validation',
				variables: [
					{
						name: 'email',
						type: 'string',
						required: true,
						validation: '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$',
					},
				],
			}),
		);

		let outputPath1 = '';

		try {
			// Register the template
			await cli.runCommand([
				'template',
				'add',
				'--name=email-template',
				`--source=${templatePath}`,
				`--config=${configPath}`,
			]);

			// Test case: Invalid email
			outputPath1 = await createTempFile('Existing content');

			await assertRejects(
				async () => {
					await cli.runCommand([
						'template',
						'generate',
						'--template=email-template',
						`--output=${outputPath1}`,
						'--variables',
						JSON.stringify({ email: 'invalid-email' }),
						'--force', // Correctly passing --force without value
					]);
				},
				Error,
				'Variable validation failed',
			);

			// Optionally, verify that the error was logged
			// assert(logger.errors.includes("Validation failed for email: Value does not match pattern"));
		} finally {
			// Clean up all temporary files
			await cleanupTempFiles(templatePath, configPath, outputPath1);
		}
	},
});

Deno.test({
	name: 'Template Command - Variable validation with valid input',
	async fn() {
		const { cli, logger } = await createTestCLI();
		const command = createTemplateCommand(cli);
		cli.register(command);

		// Create test template and config files
		const templatePath = await createTempFile('Email: {{email}}');
		const configPath = await createTempFile(
			JSON.stringify({
				description: 'Test template with validation',
				variables: [
					{
						name: 'email',
						type: 'string',
						required: true,
						validation: '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$',
					},
				],
			}),
		);

		let outputPath2 = '';

		try {
			// Register the template
			await cli.runCommand([
				'template',
				'add',
				'--name=email-template-valid',
				`--source=${templatePath}`,
				`--config=${configPath}`,
			]);

			// Test case: Valid email
			outputPath2 = await createTempFile('Existing content');

			await cli.runCommand([
				'template',
				'generate',
				'--template=email-template-valid',
				`--output=${outputPath2}`,
				'--variables',
				JSON.stringify({ email: 'test@example.com' }),
				'--force', // Correctly passing --force without value
			]);

			const content = await Deno.readTextFile(outputPath2);
			assertEquals(content, 'Email: test@example.com');
		} finally {
			// Clean up all temporary files
			await cleanupTempFiles(templatePath, configPath, outputPath2);
		}
	},
});

Deno.test({
	name: 'Template Command - Template hooks',
	async fn() {
		const { cli, logger } = await createTestCLI();
		const command = createTemplateCommand(cli);
		cli.register(command);

		// Create test template and config files with hooks
		const templatePath = await createTempFile('Content: {{content}}');
		const configPath = await createTempFile(
			JSON.stringify({
				description: 'Test template with hooks',
				variables: [
					{
						name: 'content',
						type: 'string',
						required: true,
					},
				],
				hooks: {
					// Hooks manipulate context or content directly
					beforeRender: 'context.content = context.content.toUpperCase();',
					afterRender: "return context.replace('Content:', 'Modified:');",
					validate: "return context.includes('Modified:');",
				},
			}),
		);

		let outputPath = '';

		try {
			// Register the template
			await cli.runCommand([
				'template',
				'add',
				'--name=hook-template',
				`--source=${templatePath}`,
				`--config=${configPath}`,
			]);

			// Generate content using the template with hooks
			outputPath = await createTempFile('Existing content');

			await cli.runCommand([
				'template',
				'generate',
				'--template=hook-template',
				`--output=${outputPath}`,
				'--variables',
				JSON.stringify({ content: 'test content' }),
				'--force', // Correctly passing --force without value
			]);

			const result = await Deno.readTextFile(outputPath);
			assertEquals(result, 'Modified: TEST CONTENT');
		} finally {
			// Clean up all temporary files
			await cleanupTempFiles(templatePath, configPath, outputPath);
		}
	},
});

Deno.test({
	name: 'Template Command - File handling with nonexistent files',
	async fn() {
		const { cli, logger } = await createTestCLI();
		const command = createTemplateCommand(cli);
		cli.register(command);

		// 1) Test nonexistent file handling
		await assertRejects(
			async () => {
				await cli.runCommand([
					'template',
					'add',
					'--name=missing-template',
					'--source=nonexistent.txt',
					'--config=nonexistent.json',
				]);
			},
			Error,
			'No such file or directory',
		);

		// Optionally, verify that the error was logged
		// assert(logger.errors.includes("Failed to add template: No such file or directory: nonexistent.txt"));
	},
});

Deno.test({
	name: 'Template Command - File handling with existing files',
	async fn() {
		const { cli, logger } = await createTestCLI();
		const command = createTemplateCommand(cli);
		cli.register(command);

		// 2) Test with existing files
		const templatePath = await createTempFile('Test content');
		const configPath = await createTempFile(
			JSON.stringify({
				description: 'Test template for file handling',
				variables: [],
			}),
		);

		let outputPath = '';

		try {
			// Register the template
			await cli.runCommand([
				'template',
				'add',
				'--name=file-test',
				`--source=${templatePath}`,
				`--config=${configPath}`,
			]);

			// Test overwrite protection
			outputPath = await createTempFile('Existing content');

			// Should fail without --force
			await assertRejects(
				async () => {
					await cli.runCommand([
						'template',
						'generate',
						'--template=file-test',
						`--output=${outputPath}`,
						// No --force flag
					]);
				},
				Error,
				'Output file',
			);

			// Should succeed with --force
			await cli.runCommand([
				'template',
				'generate',
				'--template=file-test',
				`--output=${outputPath}`,
				'--force', // Correctly passing --force without value
			]);

			const result = await Deno.readTextFile(outputPath);
			assertEquals(result, 'Test content');
		} finally {
			// Clean up all temporary files
			await cleanupTempFiles(templatePath, configPath, outputPath);
		}
	},
});
