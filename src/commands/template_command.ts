// src/commands/template_command.ts
import { BaseCommand } from "../types/types.ts";
import { Args, Command } from "../types/types.ts";
import { logger } from "../logger/logger.ts";
import { CLI } from "../core/core.ts";

interface TemplateVariable {
	name: string;
	description?: string;
	default?: string;
	required?: boolean;
	type?: "string" | "number" | "boolean";
	validation?: string;
}

interface Template {
	name: string;
	description?: string;
	source: string;
	variables: TemplateVariable[];
	hooks?: {
		beforeRender?: string;
		afterRender?: string;
		validate?: string;
	};
}

interface TemplateConfig {
	templates: Template[];
	defaultVariables?: Record<string, string>;
	outputPath?: string;
}

export class TemplateCommand extends BaseCommand {
	protected templates: Map<string, Template> = new Map();
	protected config: Partial<TemplateConfig> = {};

	constructor() {
		super({
			name: "template",
			description: "Manage and generate from templates",
			category: "templates",
			permissions: ["read", "write"],
			subcommands: [
				{
					name: "generate",
					description: "Generate content from a template",
					options: [
						{
							name: "template",
							type: "string",
							required: true,
							description: "Template name",
						},
						{
							name: "output",
							type: "string",
							description: "Output file path",
							required: true,
						},
						{
							name: "variables",
							type: "string",
							description: "Variables in JSON format",
							required: false,
						},
						{
							name: "force",
							type: "boolean",
							description: "Overwrite existing files",
							default: false,
						},
					],
					action: (args: Args) => this.generateFromTemplate(args),
				},
				{
					name: "list",
					description: "List available templates",
					action: () => this.listTemplates(),
				},
				{
					name: "add",
					description: "Add a new template",
					options: [
						{
							name: "name",
							type: "string",
							required: true,
							description: "Template name",
						},
						{
							name: "source",
							type: "string",
							required: true,
							description: "Template source file path",
						},
						{
							name: "config",
							type: "string",
							required: false,
							description: "Template configuration file path",
						},
					],
					action: (args: Args) => this.addTemplate(args),
				},
			],
		});
	}

	async action(args: Args): Promise<void> {
		const subcommand = args.command[1];
		switch (subcommand) {
			case "generate":
				await this.generateFromTemplate(args);
				break;
			case "list":
				await this.listTemplates();
				break;
			case "add":
				await this.addTemplate(args);
				break;
			default:
				throw new Error(`Unknown subcommand: ${subcommand}`);
		}
	}

	private loadTemplate(name: string): Template | undefined {
		const template = this.templates.get(name);
		if (!template) {
			logger.error(`Template '${name}' not found`);
			return undefined;
		}
		return template;
	}

	private async validatePattern(pattern: string): Promise<RegExp> {
		try {
			// Handle /pattern/flags format
			if (pattern.startsWith("/") && pattern.match(/\/[gimsuy]*$/)) {
				const matches = pattern.match(/^\/(.+)\/([gimsuy]*)$/);
				if (matches) {
					return new RegExp(matches[1], matches[2]);
				}
			}
			// Otherwise, treat as a normal pattern
			return new RegExp(pattern);
		} catch (error) {
			const errorMessage = error instanceof Error
				? error.message
				: String(error);
			throw new Error(
				`Invalid regular expression pattern: ${errorMessage}`,
			);
		}
	}

	private async validateVariable(
		validation: string,
		value: string,
		variableName: string,
	): Promise<boolean> {
		try {
			const regex = await this.validatePattern(validation);
			const isValid = regex.test(value);
			if (!isValid) {
				throw new Error(`Validation failed for ${variableName}`);
			}
			return true;
		} catch (error) {
			const errorMessage = error instanceof Error
				? error.message
				: String(error);
			throw new Error(`Variable validation failed: ${errorMessage}`);
		}
	}

	private async validateVariables(
		template: Template,
		variables: Record<string, unknown>,
	): Promise<boolean> {
		for (const templateVar of template.variables) {
			const value = variables[templateVar.name];

			if (templateVar.required && value === undefined) {
				logger.error(`Missing required variable: ${templateVar.name}`);
				return false;
			}

			// If provided, validate the variable
			if (value !== undefined && templateVar.validation) {
				const isValid = await this.validateVariable(
					templateVar.validation,
					String(value),
					templateVar.name,
				);
				if (!isValid) {
					return false;
				}
			}
		}
		return true;
	}

	private createHookFunction(
		hookScript: string,
	): (context: unknown) => unknown {
		return new Function(
			"context",
			`"use strict";
      try {
        ${hookScript}
        return context;
      } catch (error) {
        throw new Error('Hook execution failed: ' + error.message);
      }`,
		) as (context: unknown) => unknown;
	}

	private async executeHook(
		hookScript: string | undefined,
		context: unknown,
	): Promise<unknown> {
		if (!hookScript) {
			return context;
		}

		try {
			const hookFn = this.createHookFunction(hookScript);
			const result = await Promise.resolve(hookFn(context));
			return result;
		} catch (error) {
			const errorMessage = error instanceof Error
				? error.message
				: String(error);
			throw new Error(`Hook execution failed: ${errorMessage}`);
		}
	}

	private async renderTemplate(
		template: Template,
		variables: Record<string, string>,
	): Promise<string> {
		let content = template.source;

		// beforeRender hook
		if (template.hooks?.beforeRender) {
			await this.executeHook(template.hooks.beforeRender, variables);
		}

		// Replace all variables in the template
		for (const [key, value] of Object.entries(variables)) {
			const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
			content = content.replace(regex, value);
		}

		// afterRender hook
		if (template.hooks?.afterRender) {
			const result = await this.executeHook(
				template.hooks.afterRender,
				content,
			);
			content = String(result);
		}

		return content;
	}

	private async verifySourceFile(filePath: string): Promise<void> {
		try {
			const stat = await Deno.stat(filePath);
			if (!stat.isFile) {
				throw new Error("Source path is not a file");
			}
		} catch (error) {
			if (error instanceof Deno.errors.NotFound) {
				throw new Error(`No such file or directory: ${filePath}`);
			}
			throw error;
		}
	}

	protected async generateFromTemplate(args: Args): Promise<void> {
		const templateName = args.flags.template as string;
		const outputPath = args.flags.output as string;
		const force = Boolean(args.flags.force);

		const template = this.loadTemplate(templateName);
		if (!template) {
			throw new Error(`Template '${templateName}' not found`);
		}

		// Explicitly check file existence with proper error handling
		try {
			await Deno.lstat(outputPath);
			// If we get here, the file exists
			if (!force) {
				throw new Error(`Output file ${outputPath} already exists`);
			}
		} catch (error) {
			// Only proceed if the error is NotFound
			if (!(error instanceof Deno.errors.NotFound)) {
				// If it's any other error, rethrow it
				throw error;
			}
			// NotFound error means the file doesn't exist, which is what we want
		}

		let variables: Record<string, unknown> = {};
		if (args.flags.variables) {
			try {
				variables = JSON.parse(args.flags.variables as string);
			} catch (error: unknown) {
				const errorMessage = error instanceof Error
					? error.message
					: String(error);
				throw new Error(`Invalid variables JSON: ${errorMessage}`);
			}
		}

		// Validate variables
		for (const templateVar of template.variables) {
			const value = variables[templateVar.name];

			if (templateVar.required && value === undefined) {
				throw new Error(`Missing required variable: ${templateVar.name}`);
			}

			if (value !== undefined && templateVar.validation) {
				await this.validateVariable(
					templateVar.validation,
					String(value),
					templateVar.name,
				);
			}
		}

		let content: string;
		try {
			content = await this.renderTemplate(
				template,
				variables as Record<string, string>,
			);
		} catch (error: unknown) {
			const errorMessage = error instanceof Error
				? error.message
				: String(error);
			throw new Error(`Failed to render template: ${errorMessage}`);
		}

		try {
			await Deno.writeTextFile(outputPath, content);
			args.cli.logger.info(`Generated content written to ${outputPath}`);
		} catch (error: unknown) {
			const errorMessage = error instanceof Error
				? error.message
				: String(error);
			throw new Error(`Failed to write output file: ${errorMessage}`);
		}
	}

	private listTemplates(): void {
		if (this.templates.size === 0) {
			console.log("No templates available");
			return;
		}

		console.log("\nAvailable Templates:");
		console.log("===================");

		for (const [name, template] of this.templates) {
			console.log(`\nName: ${name}`);
			if (template.description) {
				console.log(`Description: ${template.description}`);
			}
			if (template.variables.length > 0) {
				console.log("Variables:");
				template.variables.forEach((variable) => {
					console.log(
						`  - ${variable.name}${variable.required ? " (required)" : ""}${
							variable.description ? `: ${variable.description}` : ""
						}`,
					);
				});
			}
		}
	}

	protected async addTemplate(args: Args): Promise<void> {
		const name = args.flags.name as string;
		const sourcePath = args.flags.source as string;
		const configPath = args.flags.config as string;

		if (this.templates.has(name)) {
			throw new Error(`Template '${name}' already exists`);
		}

		try {
			// Verify the main source file
			await this.verifySourceFile(sourcePath);
			const source = await Deno.readTextFile(sourcePath);

			// Optionally load config
			let config: Partial<Template> = {};
			if (configPath) {
				await this.verifySourceFile(configPath);
				const configContent = await Deno.readTextFile(configPath);
				if (configContent.trim()) {
					config = JSON.parse(configContent);
				}

				// Validate any regex patterns in variables
				if (config.variables) {
					for (const variable of config.variables) {
						if (variable.validation) {
							await this.validatePattern(variable.validation);
						}
					}
				}

				// Validate hooks
				if (config.hooks) {
					for (
						const [hookName, hookScript] of Object.entries(
							config.hooks,
						)
					) {
						if (hookScript) {
							try {
								this.createHookFunction(hookScript);
							} catch (error) {
								const errorMessage = error instanceof Error
									? error.message
									: String(error);
								throw new Error(
									`Invalid ${hookName} hook: ${errorMessage}`,
								);
							}
						}
					}
				}
			}

			// Build the final template
			const template: Template = {
				name,
				description: config.description,
				source,
				variables: config.variables || [],
				hooks: config.hooks,
			};

			this.templates.set(name, template);
			logger.info(`Template '${name}' added successfully`);
		} catch (error: unknown) {
			const errorMessage = error instanceof Error
				? error.message
				: String(error);
			throw new Error(`Failed to add template: ${errorMessage}`);
		}
	}
}

export function createTemplateCommand(_cli: CLI): Command {
	return new TemplateCommand();
}
