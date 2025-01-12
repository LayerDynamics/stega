// src/command.ts
import {FlagValue} from "./flag.ts"; // Import FlagValue
import type {Args} from "./types.ts"; // Import Args from types.ts

/**
 * Represents an option for a command.
 */
export interface Option {
	name: string;
	alias?: string;
	description?: string;
	type: 'boolean'|'string'|'number'|'array';
	default?: FlagValue;
	required?: boolean;
}

/**
 * Represents a command in the CLI.
 */
export interface Command {
	name: string;
	description?: string;
	options?: Option[];
	subcommands?: Command[];
	action: (args: Args) => void|Promise<void>;
	aliases?: string[];
}

export class CommandRegistry {
	private commands: Command[]=[];

	/**
	 * Registers a new command.
	 * @param command The command to register.
	 */
	register(command: Command) {
		this.commands.push(command);
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
	findCommand(name: string): Command|undefined {
		return this.commands.find(
			(cmd) => cmd.name===name||(cmd.aliases&&cmd.aliases.includes(name))
		);
	}

	/**
	 * Recursively finds a subcommand within a command hierarchy.
	 * @param command The root command to search within.
	 * @param subcommandPath An array representing the path of subcommands.
	 * @returns The found subcommand or undefined.
	 */
	findSubcommand(command: Command,subcommandPath: string[]): Command|undefined {
		let currentCommand=command;

		for(const subName of subcommandPath) {
			if(!currentCommand.subcommands) {
				return undefined;
			}
			const subcommand=currentCommand.subcommands.find(
				(cmd) => cmd.name===subName||(cmd.aliases&&cmd.aliases.includes(subName))
			);
			if(!subcommand) {
				return undefined;
			}
			currentCommand=subcommand;
		}

		return currentCommand;
	}
}

// Removed the following line to prevent duplicate exports
// export { Command };
