import { assertEquals, assertRejects } from "@std/assert";
import { TemplateCommand } from "../../src/commands/template_command.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { CLI } from "../../src/core/core.ts";
import type { Args, Command } from "../../src/types/types.ts";
import { ConsoleLogger } from "../../src/logger/logger.ts";
import { createMockCLI } from "../test_utils.ts";

// Test subclass to access protected methods
class TestTemplateCommand extends TemplateCommand {
	public async testGenerate(args: Args): Promise<void> {
		return this.generateFromTemplate(args);
	}

	public async testAddTemplate(args: Args): Promise<void> {
		return this.addTemplate(args);
	}

	public getTemplates() {
		return this.templates;
	}
}

Deno.test("Template Command Tests", async (t) => {
	const outputDir = "./tests/fixtures/tmp";
	await ensureDir(outputDir);

	// Use test utils to create a properly mocked CLI instance
	const mockCli = await createMockCLI();

	await t.step("Variable validation with invalid input", async () => {
		const command = new TestTemplateCommand();
		const template = {
			name: "email-template",
			source: "Email: {{email}}",
			variables: [{
				name: "email",
				required: true,
				validation: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
			}],
		};
		command["templates"].set(template.name, template);

		const output = `${outputDir}/invalid-email.txt`;
		await assertRejects(
			() =>
				command.testGenerate({
					flags: {
						template: template.name,
						variables: JSON.stringify({ email: "invalid-email" }),
						output,
						force: true,
					},
					command: ["template", "generate"],
					cli: mockCli,
				}),
			Error,
			"Validation failed",
		);
	});

	await t.step("Variable validation with valid input", async () => {
		const command = new TestTemplateCommand();
		const template = {
			name: "email-template-valid",
			source: "Email: {{email}}",
			variables: [{
				name: "email",
				required: true,
				validation: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
			}],
		};
		command["templates"].set(template.name, template);

		const output = `${outputDir}/valid-email.txt`;
		await command.testGenerate({
			flags: {
				template: template.name,
				variables: JSON.stringify({ email: "test@example.com" }),
				output,
				force: true,
			},
			command: ["template", "generate"],
			cli: mockCli,
		});

		const content = await Deno.readTextFile(output);
		assertEquals(content, "Email: test@example.com");
	});

	await t.step("Template hooks", async () => {
		const command = new TestTemplateCommand();
		const template = {
			name: "hook-template",
			source: "Content: {{content}}",
			variables: [{
				name: "content",
				required: true,
			}],
			hooks: {
				beforeRender: "context.content = context.content.toUpperCase();",
				afterRender: "return context.replace('Content:', 'Modified:');",
				validate: "return context.includes('Modified:');",
			},
		};
		command["templates"].set(template.name, template);

		const output = `${outputDir}/hooks.txt`;
		await command.testGenerate({
			flags: {
				template: template.name,
				variables: JSON.stringify({ content: "test content" }),
				output,
				force: true,
			},
			command: ["template", "generate"],
			cli: mockCli,
		});

		const result = await Deno.readTextFile(output);
		assertEquals(result, "Modified: TEST CONTENT");
	});

	await t.step("File handling with nonexistent files", async () => {
		const command = new TestTemplateCommand();

		await assertRejects(
			() =>
				command.testAddTemplate({
					flags: {
						name: "missing-template",
						source: "nonexistent.txt",
						config: "nonexistent.json",
					},
					command: ["template", "add"],
					cli: mockCli,
				}),
			Error,
			"No such file or directory",
		);
	});

	await t.step("File handling with existing files", async () => {
		const command = new TestTemplateCommand();
		const template = {
			name: "file-test",
			source: "Test content",
			variables: [],
		};
		command["templates"].set(template.name, template);

		const output = `${outputDir}/existing.txt`;
		await assertRejects(
			() =>
				command.testGenerate({
					flags: {
						template: template.name,
						output,
					},
					command: ["template", "generate"],
					cli: mockCli,
				}),
			Error,
			"Output file",
		);

		await command.testGenerate({
			flags: {
				template: template.name,
				output,
				force: true,
			},
			command: ["template", "generate"],
			cli: mockCli,
		});

		const result = await Deno.readTextFile(output);
		assertEquals(result, "Test content");
	});
});
