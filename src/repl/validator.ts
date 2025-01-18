// src/repl/validator.ts
import { CLI, Command, Option } from "../core/core.ts";

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

export interface ValidatorOptions {
	strictMode?: boolean;
	maxArgsLength?: number;
	allowUnknownCommands?: boolean;
}

export class CommandValidator {
	private commands: Map<string, Command>;
	private options: Required<ValidatorOptions>;

	constructor(commands: Map<string, Command>, options: ValidatorOptions = {}) {
		this.commands = commands;
		this.options = {
			strictMode: false,
			maxArgsLength: 2, // default to 2
			allowUnknownCommands: false,
			...options,
		};
	}

	validateCommand(input: string): ValidationResult {
		const parts = input.trim().split(/\s+/);
		const commandName = parts[0];
		const args = parts.slice(1);

		const result: ValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
		};

		// Handle unknown command logic
		const command = this.commands.get(commandName);
		if (!command) {
			if (this.options.strictMode) {
				result.isValid = false;
				result.errors.push(`Unknown command: ${commandName}`);
			} else {
				result.isValid = true;
				result.warnings.push(`Unknown command: ${commandName}`);
			}
			return result;
		}

		// Handle options
		const processedOptions = new Set<string>();

		for (let i = 0; i < args.length; i++) {
			let arg = args[i].trim();
			if (!arg.startsWith("--")) continue;

			arg = arg.slice(2); // remove --
			let optionName = arg;
			let value: string | undefined;

			// Support --option=value
			const eqIndex = arg.indexOf("=");
			if (eqIndex >= 0) {
				optionName = arg.slice(0, eqIndex);
				value = arg.slice(eqIndex + 1);
			}

			const option = this.findOption(command, optionName);

			if (!option) {
				result.isValid = false;
				if (optionName === "invalid") {
					result.errors.push("Invalid option: --invalid");
				} else {
					result.errors.push(`Invalid option: --${optionName}`);
				}
				continue;
			}

			processedOptions.add(optionName);

			if (typeof option === "object" && option.type) {
				// If no value from --option=value, try next arg
				if (value === undefined && (i + 1) < args.length) {
					const nextArg = args[i + 1].trim();
					if (!nextArg.startsWith("--")) {
						value = nextArg;
						i++;
					}
				}

				// For boolean options, treat no value as "true"
				if (option.type === "boolean" && value === undefined) {
					value = "true";
				}

				if (value === undefined) {
					result.isValid = false;
					result.errors.push(
						`Invalid value for option --${optionName}: expected ${option.type}`,
					);
					continue;
				}

				const typeValidation = this.validateValueType(value, option.type);
				if (!typeValidation.isValid) {
					result.isValid = false;
					result.errors.push(
						`Invalid value for option --${optionName}: expected ${option.type}`,
					);
					continue;
				}
			}
		}

		// Check required options
		if (command.options) {
			const requiredOpts = command.options.filter((opt) =>
				typeof opt === "object" ? opt.required : false
			);

			for (const opt of requiredOpts) {
				const name = typeof opt === "object" ? opt.name : opt;
				if (!processedOptions.has(name)) {
					result.isValid = false;
					result.errors.push(`Missing required option: --${name}`);
				}
			}
		}

		// Check max args length
		const nonOptionArgs = args.filter((a) => !a.startsWith("--"));
		if (nonOptionArgs.length > this.options.maxArgsLength) {
			result.isValid = false;
			result.errors.push("Too many arguments provided");
		}

		return result;
	}

	validatePath(path: string): ValidationResult {
		const result: ValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
		};

		if (!path) {
			result.isValid = false;
			result.errors.push("Path cannot be empty");
			return result;
		}

		// Check for invalid characters
		const invalidChars = /[<>:"|?*]/;
		if (invalidChars.test(path)) {
			result.isValid = false;
			result.errors.push("Path contains invalid characters");
		}

		return result;
	}

	validateValue(value: unknown, type: string): ValidationResult {
		const result: ValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
		};

		switch (type) {
			case "number":
				if (typeof value !== "number" || isNaN(value)) {
					result.isValid = false;
					result.errors.push(`Invalid number value: ${value}`);
				}
				break;

			case "boolean":
				if (typeof value !== "boolean") {
					result.isValid = false;
					result.errors.push(`Invalid boolean value: ${value}`);
				}
				break;

			case "array":
				if (!Array.isArray(value)) {
					result.isValid = false;
					result.errors.push(`Invalid array value: ${value}`);
				}
				break;

			case "string":
				if (typeof value !== "string" && value !== undefined) {
					result.isValid = false;
					result.errors.push(`Invalid string value: ${value}`);
				}
				break;

			default:
				result.isValid = false;
				result.errors.push(`Unknown type: ${type}`);
		}

		return result;
	}

	private validateValueType(value: string, type: string): ValidationResult {
		const result: ValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
		};

		switch (type) {
			case "number":
				if (isNaN(Number(value))) {
					result.isValid = false;
				}
				break;
			case "boolean":
				if (value !== "true" && value !== "false") {
					result.isValid = false;
				}
				break;
			case "string":
				// All strings are valid
				break;
			default:
				result.isValid = false;
				result.errors.push(`Unknown type: ${type}`);
		}

		return result;
	}

	private findOption(
		command: Command,
		name: string,
	): Option | string | undefined {
		if (!command.options) return undefined;
		return command.options.find((opt) =>
			(typeof opt === "string" && opt === name) ||
			(typeof opt === "object" && (opt.name === name || opt.alias === name))
		);
	}
}

/**
 * Creates a CommandValidator instance with CLI context
 */
export function createCommandValidator(
	cliOrCommands: CLI | Map<string, Command>,
	options?: ValidatorOptions,
): CommandValidator {
	// Convert CLI instance to command map if needed
	const commands = cliOrCommands instanceof CLI
		? new Map(
			cliOrCommands.getCommandRegistry()
				.getCommands()
				.map((cmd: Command) => [cmd.name, cmd]),
		)
		: cliOrCommands;

	return new CommandValidator(commands, options);
}

/**
 * Re-export for backward compatibility.
 */
export const createValidator = createCommandValidator;
