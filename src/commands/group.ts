// src/command/group.ts

import type { Command } from "../command.ts";
import type { Args } from "../types/types.ts";
import { CommandHistory } from "./history.ts";

export interface CommandGroupOptions {
	name: string;
	description?: string;
	commands: Command[];
	middleware?: CommandGroupMiddleware[];
	aliases?: string[];
	history?: boolean;
}

export interface CommandGroupMiddleware {
	before?: (args: Args) => Promise<void> | void;
	after?: (args: Args) => Promise<void> | void;
	onError?: (error: Error, args: Args) => Promise<void> | void;
}

export class CommandGroup {
	private commands: Map<string, Command> = new Map();
	private middleware: CommandGroupMiddleware[] = [];
	private history?: CommandHistory;

	constructor(private options: CommandGroupOptions) {
		this.registerCommands(options.commands);
		if (options.middleware) {
			this.middleware = options.middleware;
		}
		if (options.history) {
			this.history = new CommandHistory();
		}
	}

	private registerCommands(commands: Command[]): void {
		for (const command of commands) {
			// Add group prefix to command name
			const prefixedCommand = this.prefixCommand(command);
			this.commands.set(prefixedCommand.name, prefixedCommand);

			// Handle aliases
			if (prefixedCommand.aliases) {
				for (const alias of prefixedCommand.aliases) {
					this.commands.set(this.options.name + ":" + alias, prefixedCommand);
				}
			}
		}
	}

	private prefixCommand(command: Command): Command {
		return {
			...command,
			name: `${this.options.name}:${command.name}`,
			aliases: command.aliases?.map((alias) => `${this.options.name}:${alias}`),
		};
	}

	public async executeCommand(command: string, args: Args): Promise<void> {
		const cmd = this.commands.get(command);
		if (!cmd) {
			throw new Error(
				`Command '${command}' not found in group '${this.options.name}'`,
			);
		}

		const startTime = performance.now();
		let success = false;
		let error: string | undefined;

		try {
			// Execute before middleware
			for (const mw of this.middleware) {
				if (mw.before) {
					await mw.before(args);
				}
			}

			// Execute command
			await cmd.action(args);
			success = true;

			// Execute after middleware
			for (const mw of this.middleware) {
				if (mw.after) {
					await mw.after(args);
				}
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			// Execute error middleware
			for (const mw of this.middleware) {
				if (mw.onError && e instanceof Error) {
					await mw.onError(e, args);
				}
			}
			throw e;
		} finally {
			if (this.history) {
				const duration = performance.now() - startTime;
				// Convert Args to Record<string, unknown>
				const argsRecord: Record<string, unknown> = Object.fromEntries(
					Object.entries(args).filter(([_, v]) => v !== undefined),
				);

				await this.history.addEntry({
					command,
					args: argsRecord,
					timestamp: Date.now(),
					success,
					duration,
					error,
				});
			}
		}
	}

	public getCommands(): Command[] {
		return Array.from(this.commands.values());
	}

	public getName(): string {
		return this.options.name;
	}

	public getDescription(): string | undefined {
		return this.options.description;
	}

	public hasCommand(name: string): boolean {
		return this.commands.has(name);
	}

	public getCommandByName(name: string): Command | undefined {
		return this.commands.get(name);
	}

	public getAliases(): string[] {
		return this.options.aliases || [];
	}

	public getHistory() {
		return this.history;
	}
}

export function createCommandGroup(options: CommandGroupOptions): CommandGroup {
	return new CommandGroup(options);
}
