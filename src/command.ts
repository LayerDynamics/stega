import { FlagValue } from "./flag.ts";
import type { Args } from "./types/types.ts";

// Define interfaces first with export type
export interface Option {
	name: string;
	alias?: string;
	description?: string;
	type: "boolean" | "string" | "number" | "array";
	default?: FlagValue;
	required?: boolean;
}

export interface Command {
	name: string;
	description?: string;
	options?: Option[];
	subcommands?: Command[];
	action: (args: Args) => void | Promise<void>;
	aliases?: string[];
}

// Define and export the class
export class CommandRegistry {
	private commands: Command[] = [];

	/**
	 * Registers a new command.
	 * @param command The command to register.
	 */
	register(command: Command) {
		// Check for existing command
		const existing = this.findCommand(command.name);
		if (existing) {
			throw new Error(`Command "${command.name}" is already registered`);
		}
		this.commands.push(command);
	}

	/**
	 * Removes a command by name.
	 * @param name The name of the command to remove.
	 * @returns true if command was removed, false if not found
	 */
	remove(name: string): boolean {
		const index = this.commands.findIndex((cmd) => cmd.name === name);
		if (index !== -1) {
			this.commands.splice(index, 1);
			return true;
		}
		return false;
	}

	/**
	 * Clears all registered commands.
	 */
	clear(): void {
		this.commands = [];
	}

	/**
	 * Retrieves all registered commands.
	 * @returns An array of registered commands.
	 */
	getCommands(): Command[] {
		return this.commands;
	}

	/**
	 * Finds a command by name or alias.
	 * @param name The name or alias of the command.
	 * @returns The found command or undefined.
	 */
	findCommand(name: string): Command | undefined {
		return this.commands.find(
			(cmd) => cmd.name === name || (cmd.aliases && cmd.aliases.includes(name)),
		);
	}

	/**
	 * Recursively finds a subcommand within a command hierarchy.
	 * @param command The root command to search within.
	 * @param subcommandPath An array representing the path of subcommands.
	 * @returns The found subcommand or undefined.
	 */
	findSubcommand(
		command: Command,
		subcommandPath: string[],
	): Command | undefined {
		let currentCommand = command;

		for (const subName of subcommandPath) {
			if (!currentCommand.subcommands) {
				return undefined;
			}
			const subcommand = currentCommand.subcommands.find(
				(cmd) =>
					cmd.name === subName ||
					(cmd.aliases && cmd.aliases.includes(subName)),
			);
			if (!subcommand) {
				return undefined;
			}
			currentCommand = subcommand;
		}

		return currentCommand;
	}
}

// Define and export the function
export function createCommand(
    name: string,
    options: Omit<Command, 'name'> & { action?: Command['action'] }
): Command {
    return {
        name,
        description: options.description || '',
        options: options.options || [],
        subcommands: options.subcommands || [],
        action: options.action || (() => {}),
        aliases: options.aliases || [],
    };
}

// Remove redundant exports at the end
// export type { Command, Option };
// export { createCommand, CommandRegistry };
