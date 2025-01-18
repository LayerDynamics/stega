// src/repl/history.ts

import { crypto } from "jsr:@std/crypto@^0.224.0";
import { ensureDir } from "jsr:@std/fs@^0.224.0";
import { dirname, join } from "jsr:@std/path@^0.224.0";

export interface HistoryEntry {
	id: string;
	command: string;
	args: Record<string, unknown>;
	timestamp: number;
	success: boolean;
	duration: number;
	error?: string;
}

export interface HistoryOptions {
	maxEntries?: number;
	storageFilePath?: string;
	excludeCommands?: string[]; // Reverted to string[]
}

export interface HistoryStatistics {
	totalCommands: number;
	uniqueCommands: number;
	successRate: number;
	averageDuration: number;
	mostUsedCommands: Array<{ command: string; count: number }>;
}

/**
 * Represents a history of executed commands.
 * Manages adding, retrieving, clearing, and persisting command history.
 */
export class CommandHistory {
	private history: HistoryEntry[] = [];
	private options: Required<HistoryOptions>;
	private initialized = false;
	private initializing: Promise<void> | null = null; // Prevent concurrent initialization
	private excludeCommandsSet: Set<string>; // Internal Set for efficient lookups

	/**
	 * Creates a new instance of CommandHistory.
	 * @param options Configuration options for command history.
	 */
	constructor(options: HistoryOptions = {}) {
		const defaultPath = join(Deno.cwd(), ".stega", "history.json");
		const storagePath = options.storageFilePath || defaultPath;

		this.excludeCommandsSet = new Set(
			(options.excludeCommands || []).map((cmd) => cmd.toLowerCase()),
		);

		this.options = {
			maxEntries: options.maxEntries || 1000,
			storageFilePath: storagePath.trim() || defaultPath,
			// excludeCommands is now handled internally as excludeCommandsSet
			excludeCommands: options.excludeCommands || [],
		};
	}

	/**
	 * Initializes the history system by ensuring directory structure exists.
	 * @returns A Promise that resolves when initialization is complete.
	 */
	private async initialize(): Promise<void> {
		if (!this.initialized) {
			if (!this.initializing) {
				this.initializing = (async () => {
					const directory = dirname(this.options.storageFilePath);
					await ensureDir(directory);
					this.initialized = true;
					this.initializing = null;
				})();
			}
			return this.initializing;
		}
	}

	/**
	 * Generates a unique identifier for a history entry.
	 * @returns A Promise that resolves to a hexadecimal string representing the unique ID.
	 */
	private async generateId(): Promise<string> {
		const buffer = new Uint8Array(16);
		crypto.getRandomValues(buffer);
		return Array.from(buffer)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	}

	/**
	 * Checks if a command is excluded from history.
	 * @param command The command name to check.
	 * @returns A boolean indicating if the command is excluded.
	 */
	public isExcluded(command: string): boolean {
		return this.excludeCommandsSet.has(command.toLowerCase());
	}

	/**
	 * Adds a new command entry to the command history.
	 * If the command is listed in excludeCommands, it will not be added.
	 * @param entry The command data to add (excluding the ID).
	 * @returns A Promise that resolves after the history is updated and saved.
	 */
	public async addEntry(entry: Omit<HistoryEntry, "id">): Promise<void> {
		await this.initialize();

		const commandLower = entry.command.toLowerCase();

		if (this.excludeCommandsSet.has(commandLower)) {
			return;
		}

		const id = await this.generateId();
		const fullEntry: HistoryEntry = {
			id,
			...entry,
		};

		this.history.unshift(fullEntry);

		if (this.history.length > this.options.maxEntries) {
			this.history = this.history.slice(0, this.options.maxEntries);
		}

		await this.saveHistory();
	}

	/**
	 * Retrieves command history entries with optional filtering.
	 * @param options Filter and pagination options.
	 * @returns An array of filtered history entries.
	 */
	public getHistory(options?: {
		limit?: number;
		command?: string;
		fromDate?: Date;
		toDate?: Date;
		successOnly?: boolean;
	}): HistoryEntry[] {
		let filtered = [...this.history];

		if (options?.command) {
			const commandLower = options.command.toLowerCase();
			filtered = filtered.filter((entry) =>
				entry.command.toLowerCase() === commandLower
			);
		}

		if (options?.fromDate) {
			filtered = filtered.filter(
				(entry) => entry.timestamp >= options.fromDate!.getTime(),
			);
		}

		if (options?.toDate) {
			filtered = filtered.filter(
				(entry) => entry.timestamp <= options.toDate!.getTime(),
			);
		}

		if (options?.successOnly) {
			filtered = filtered.filter((entry) => entry.success);
		}

		if (options?.limit) {
			filtered = filtered.slice(0, options.limit);
		}

		return filtered;
	}

	/**
	 * Clears the entire command history.
	 * @returns A Promise that resolves after the history is cleared and saved.
	 */
	public async clearHistory(): Promise<void> {
		await this.initialize();
		this.history = [];
		await this.saveHistory();
	}

	/**
	 * Saves the current command history to persistent storage atomically.
	 * Logs an error if saving fails.
	 * @returns A Promise that resolves after the file write is attempted.
	 */
	private async saveHistory(): Promise<void> {
		try {
			await this.initialize();
			const historyJson = JSON.stringify(this.history, null, 2);
			const tempFilePath = this.options.storageFilePath + ".tmp";
			await Deno.writeFile(
				tempFilePath,
				new TextEncoder().encode(historyJson),
			);
			await Deno.rename(tempFilePath, this.options.storageFilePath);
		} catch (error) {
			console.error(`Failed to save command history: ${error}`);
		}
	}

	/**
	 * Loads command history from persistent storage.
	 * Initializes an empty history if the file does not exist or is corrupted.
	 * @returns A Promise that resolves after the file read is attempted.
	 */
	public async loadHistory(): Promise<void> {
		try {
			await this.initialize();
			const historyJson = await Deno.readTextFile(this.options.storageFilePath);
			this.history = JSON.parse(historyJson);
			// Validate that history is an array
			if (!Array.isArray(this.history)) {
				throw new SyntaxError("History file is not an array");
			}
		} catch (error) {
			if (error instanceof Deno.errors.NotFound) {
				// File does not exist, start with empty history
				this.history = [];
			} else if (error instanceof SyntaxError) {
				console.error(`Failed to parse command history: ${error.message}`);
				this.history = [];
				await this.saveHistory(); // Overwrite corrupted history file
			} else {
				console.error(`Failed to load command history: ${error}`);
				this.history = [];
			}
		}
	}

	/**
	 * Searches the command history for entries matching all given terms.
	 * @param query A space-separated string of terms to match.
	 * @returns An array of entries whose command or args contain all search terms.
	 */
	public searchHistory(query: string): HistoryEntry[] {
		const searchTerms = query.toLowerCase().split(" ");
		return this.history.filter((entry) => {
			const entryText = `${entry.command} ${JSON.stringify(entry.args)}`
				.toLowerCase();
			return searchTerms.every((term) => entryText.includes(term));
		});
	}

	/**
	 * Provides usage statistics for the command history.
	 * @returns An object containing statistics about command usage.
	 */
	public getStatistics(): HistoryStatistics {
		const filteredHistory = this.history.filter(
			(e) => !this.excludeCommandsSet.has(e.command.toLowerCase()),
		);
		if (filteredHistory.length === 0) {
			return {
				totalCommands: 0,
				uniqueCommands: 0,
				successRate: 0, // Return 0 for no non-excluded commands
				averageDuration: 0,
				mostUsedCommands: [],
			};
		}

		const successful = filteredHistory.filter((e) => e.success).length;
		const successRate = parseFloat(
			((successful / filteredHistory.length) * 100).toFixed(2),
		);

		const totalDuration = filteredHistory.reduce(
			(sum, e) => sum + e.duration,
			0,
		);
		const averageDuration = parseFloat(
			(totalDuration / filteredHistory.length).toFixed(2),
		);

		const commandCounts = new Map<string, number>();
		for (const entry of filteredHistory) {
			const count = commandCounts.get(entry.command) || 0;
			commandCounts.set(entry.command, count + 1);
		}

		const mostUsedCommands = Array.from(commandCounts.entries())
			.map(([command, count]) => ({ command, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		return {
			totalCommands: filteredHistory.length,
			uniqueCommands: commandCounts.size,
			successRate,
			averageDuration,
			mostUsedCommands,
		};
	}
}

/**
 * Creates a new CommandHistory instance with the provided options.
 * @param options Configuration options for the command history.
 * @returns A new CommandHistory instance.
 */
export function createCommandHistory(options?: HistoryOptions): CommandHistory {
	return new CommandHistory(options);
}
