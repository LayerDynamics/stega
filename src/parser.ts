// src/parser.ts

import type {Args} from "./types.ts"; // Import Args type
import type {CLI} from "./core.ts"; // Import CLI
import type {Option} from "./command.ts"; // Import Option interface
import {
	InvalidFlagValueError,
	MissingFlagError,
} from "./error.ts"; // Import specific error types

export type FlagValue=string|number|boolean|string[];

/**
 * Simple CLI argument parser that interprets commands and flags.
 */
export class Parser {
	/**
	 * Parses the command-line arguments.
	 * @param argv The array of command-line arguments (e.g., Deno.args).
	 * @param cli The CLI instance to access command and flag definitions.
	 * @returns An Args object containing commands and flags.
	 */
	parse(argv: string[],cli: CLI): Args {
		const args: Args={
			command: [],
			flags: {},
			cli: cli, // Attach the CLI instance
		};

		let i=0;

		while(i<argv.length) {
			const arg=argv[i];

			if(arg.startsWith("--")) {
				// Handle long flags: --key or --key=value
				const eqIndex=arg.indexOf("=");
				if(eqIndex!==-1) {
					const key=arg.slice(2,eqIndex);
					const value=arg.slice(eqIndex+1);
					const flagType=this.getFlagType(key,cli);
					try {
						args.flags[key]=this.parseValue(value,flagType);
					} catch(_error) {
						throw new InvalidFlagValueError(key,flagType); // Passed flagType
					}
				} else {
					const key=arg.slice(2);
					const flagType=this.getFlagType(key,cli);
					const nextArg=argv[i+1];

					if(
						flagType!=="boolean"&&
						nextArg&&
						!nextArg.startsWith("-")
					) {
						// Flag expects a value and next argument is the value
						try {
							args.flags[key]=this.parseValue(nextArg,flagType);
							i++; // Skip the next argument as it's consumed as a value
						} catch(_error) {
							throw new InvalidFlagValueError(key,flagType); // Passed flagType
						}
					} else {
						// Boolean flag without an explicit value
						args.flags[key]=true;
					}
				}
			} else if(arg.startsWith("-")&&arg!=="-") {
				// Handle short flags: -k or grouped like -abc
				const flags=arg.slice(1).split("");
				for(let j=0;j<flags.length;j++) {
					const flag=flags[j];
					const flagType=this.getFlagType(flag,cli);
					if(flagType!=="boolean") {
						// Flag expects a value
						const value=argv[i+1];
						if(value&&!value.startsWith("-")) {
							try {
								args.flags[flag]=this.parseValue(value,flagType);
								i++; // Skip the next argument as it's consumed as a value
							} catch(_error) {
								throw new InvalidFlagValueError(flag,flagType); // Passed flagType
							}
						} else {
							throw new MissingFlagError(flag,flagType); // Passed flagType
						}
					} else {
						// Boolean flag
						args.flags[flag]=true;
					}
				}
			} else {
				// Positional argument (command or subcommand)
				args.command.push(arg);
			}

			i++;
		}

		return args;
	}

	/**
	 * Retrieves the type of a flag based on its definition in the CLI.
	 * @param key The flag name or alias.
	 * @param cli The CLI instance to access command definitions.
	 * @returns The type of the flag ("boolean" | "string" | "number" | "array") or "string" if not found.
	 */
	private getFlagType(key: string,cli: CLI): "boolean"|"string"|"number"|"array" {
		const flagDef=this.findFlagDefinition(key,cli);
		return flagDef?.type||"string"; // Default to "string" if not found
	}

	/**
	 * Parses a flag value based on its expected type.
	 * @param value The raw string value of the flag.
	 * @param type The expected type of the flag.
	 * @returns The parsed value in the correct type.
	 * @throws InvalidFlagValueError if parsing fails.
	 */
	private parseValue(value: string,type: "boolean"|"string"|"number"|"array"): FlagValue {
		switch(type) {
			case "boolean": {
				const bool=this.parseBoolean(value);
				// If value is not a recognized boolean string, throw an error
				if(
					!["true","false","1","0","yes","no","y","n"].includes(
						value.toLowerCase()
					)
				) {
					throw new Error(`Invalid boolean value: '${value}'.`);
				}
				return bool;
			}
			case "number": {
				const num=Number(value);
				if(isNaN(num)) {
					throw new Error(`Expected a number but received '${value}'.`);
				}
				return num;
			}
			case "array": {
				return value.split(","); // Assuming comma-separated values
			}
			case "string":
			default:
				return value;
		}
	}

	/**
	 * Parses a string into a boolean.
	 * @param value The string to parse.
	 * @returns The boolean representation.
	 */
	private parseBoolean(value: string): boolean {
		const normalized=value.toLowerCase();
		return ["true","1","yes","y"].includes(normalized);
	}

	/**
	 * Finds the definition of a flag by its name or alias within all commands and subcommands.
	 * @param key The flag name or alias.
	 * @param cli The CLI instance to access command definitions.
	 * @returns The OptionDefinition of the flag or undefined if not found.
	 */
	private findFlagDefinition(key: string,cli: CLI): Option|undefined {
		const commands=cli.getCommandRegistry().getCommands(); // Access all registered commands via getCommands()
		for(const cmd of commands) {
			// Check in main command options
			if(cmd.options) {
				for(const opt of cmd.options) {
					if(opt.name===key||opt.alias===key) {
						return opt;
					}
				}
			}

			// Check in subcommands
			if(cmd.subcommands) {
				for(const subcmd of cmd.subcommands) {
					if(subcmd.options) {
						for(const opt of subcmd.options) {
							if(opt.name===key||opt.alias===key) {
								return opt;
							}
						}
					}
				}
			}
		}
		return undefined;
	}
}
	