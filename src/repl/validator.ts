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
            maxArgsLength: Infinity,
            allowUnknownCommands: false,
            ...options
        };
    }

    validateCommand(commandName: string, args: string[] = []): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: []
        };

        const command = this.commands.get(commandName);
        if (!command) {
            if (this.options.strictMode) {
                result.isValid = false;
                result.errors.push(`Invalid option: --${commandName}`);
            } else {
                result.warnings.push(`Unknown option: --${commandName}`);
            }
            return result;
        }

        // Validate non-flag arguments
        const nonFlagArgs = args.filter(arg => !arg.startsWith('--'));
        if (nonFlagArgs.length > this.options.maxArgsLength) {
            result.isValid = false;
            result.errors.push(`Too many arguments. Maximum allowed: ${this.options.maxArgsLength}`);
        }

        // Check required options
        if (command.options) {
            const requiredOptions = command.options.filter(opt => 
                typeof opt === 'object' && opt.required
            );
            
            for (const required of requiredOptions) {
                const optName = typeof required === 'string' ? required : required.name;
                const flag = `--${optName}`;
                if (!args.includes(flag)) {
                    result.isValid = false;
                    result.errors.push(`Missing required flag: ${flag}`);
                }
            }

            // Validate option values
            for (const arg of args) {
                if (!arg.startsWith('--')) continue;
                const optName = arg.slice(2).split('=')[0];
                const option = this.findOption(command, optName);

                if (!option) {
                    if (this.options.strictMode) {
                        result.isValid = false;
                        result.errors.push(`Invalid option: ${arg}`);
                    } else {
                        result.warnings.push(`Unknown option: ${arg}`);
                    }
                    continue;
                }

                if (typeof option === 'object') {
                    const value = args[args.indexOf(arg) + 1];
                    if (!value || value.startsWith('--')) {
                        result.isValid = false;
                        result.errors.push(`Missing value for flag '${arg}'`);
                    } else if (!this.validateValueType(value, option.type).isValid) {
                        result.isValid = false;
                        result.errors.push(`Invalid value for flag '${arg}': Invalid ${option.type} value: ${value}`);
                    }
                }
            }
        }

        return result;
    }

    validatePath(path: string): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: []
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
            warnings: []
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
        const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

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
            case "array":
                try {
                    JSON.parse(value);
                    result.isValid = Array.isArray(JSON.parse(value));
                } catch {
                    result.isValid = false;
                }
                break;
        }

        return result;
    }

    private findOption(command: Command, name: string): Option | string | undefined {
        if (!command.options) return undefined;
        return command.options.find(opt => 
            (typeof opt === 'string' && opt === name) ||
            (typeof opt === 'object' && (opt.name === name || opt.alias === name))
        );
    }
}

/**
 * Creates a CommandValidator instance with CLI context
 */
export function createCommandValidator(
    cliOrCommands: CLI | Map<string, Command>,
    options?: ValidatorOptions
): CommandValidator {
    // Convert CLI instance to command map if needed
    const commands = cliOrCommands instanceof CLI
        ? new Map(
            cliOrCommands.getCommandRegistry()
                .getCommands()
                .map((cmd: Command) => [cmd.name, cmd])
          )
        : cliOrCommands;

    return new CommandValidator(commands, options);
}

// Re-export for backward compatibility
export const createValidator = createCommandValidator;
