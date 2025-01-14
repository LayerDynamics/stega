// src/commands/template_command.ts
import { BaseCommand } from "../types.ts";
import { Args, Command } from "../types.ts";
import { logger } from "../logger.ts";
import { CLI } from "../core.ts";

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
	private templates: Map<string, Template> = new Map();
	private config: Partial<TemplateConfig> = {};

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
				logger.error(
					`Validation failed for ${variableName}: Value does not match pattern`,
				);
			}
			return isValid;
		} catch (error) {
			const errorMessage = error instanceof Error
				? error.message
				: String(error);
			logger.error(`Validation error for ${variableName}: ${errorMessage}`);
			return false;
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

	private async generateFromTemplate(args: Args): Promise<void> {
		const templateName = args.flags.template as string;
		const outputPath = args.flags.output as string;
		// Correctly interpret 'force' as a boolean
		const force = typeof args.flags.force === "boolean"
			? args.flags.force
			: false;

		// Debug log to verify the force flag and all flags
		logger.debug(`Force flag value: ${force} (${typeof force})`);
		logger.debug(`All flags: ${JSON.stringify(args.flags)}`);

		const template = this.loadTemplate(templateName);
		if (!template) {
			throw new Error(`Template '${templateName}' not found`);
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

		// Merge with default variables
		if (this.config.defaultVariables) {
			variables = { ...this.config.defaultVariables, ...variables };
		}

		// Validate variables
		if (!(await this.validateVariables(template, variables))) {
			throw new Error("Variable validation failed");
		}

		// Render the template
		const content = await this.renderTemplate(
			template,
			variables as Record<string, string>,
		);

		// Optional validate hook
		if (template.hooks?.validate) {
			const isValid = await this.executeHook(template.hooks.validate, content);
			if (!isValid) {
				throw new Error("Template validation failed");
			}
		}

		// Write out the file
		try {
			const fileExists = await Deno.stat(outputPath)
				.then(() => true)
				.catch(() => false);

			if (!force && fileExists) {
				throw new Error(`Output file ${outputPath} already exists`);
			}
			await Deno.writeTextFile(outputPath, content);
			logger.info(`Generated content written to ${outputPath}`);
		} catch (error: unknown) {
			const errorMessage = error instanceof Error
				? error.message
				: String(error);
			throw new Error(`Failed to write output: ${errorMessage}`);
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

	private async addTemplate(args: Args): Promise<void> {
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
				config = JSON.parse(configContent);

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
