// src/command/history.ts

import { crypto } from "jsr:@std/crypto@0.224.0";

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
	excludeCommands?: string[];
}

export class CommandHistory {
	private history: HistoryEntry[] = [];
	private options: Required<HistoryOptions>;

	constructor(options: HistoryOptions = {}) {
		this.options = {
			maxEntries: 1000,
			storageFilePath: ".stega/history.json",
			excludeCommands: ["history"],
			...options,
		};
	}

	/**
	 * Generate a unique ID for history entries
	 */
	private async generateId(): Promise<string> {
		const buffer = new Uint8Array(16);
		crypto.getRandomValues(buffer);
		return Array.from(buffer)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	}

	/**
	 * Add a command to history
	 */
	public async addEntry(entry: Omit<HistoryEntry, "id">): Promise<void> {
		if (this.options.excludeCommands.includes(entry.command)) {
			return;
		}

		const id = await this.generateId();
		const fullEntry: HistoryEntry = {
			id,
			...entry,
		};

		this.history.unshift(fullEntry);

		// Trim history if it exceeds maxEntries
		if (this.history.length > this.options.maxEntries) {
			this.history = this.history.slice(0, this.options.maxEntries);
		}

		await this.saveHistory();
	}

	/**
	 * Get history entries with optional filtering
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
			filtered = filtered.filter((entry) => entry.command === options.command);
		}

		if (options?.fromDate) {
			filtered = filtered.filter((entry) =>
				entry.timestamp >= options.fromDate!.getTime()
			);
		}

		if (options?.toDate) {
			filtered = filtered.filter((entry) =>
				entry.timestamp <= options.toDate!.getTime()
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
	 * Clear history
	 */
	public async clearHistory(): Promise<void> {
		this.history = [];
		await this.saveHistory();
	}

	/**
	 * Save history to storage
	 */
	private async saveHistory(): Promise<void> {
		try {
			const historyJson = JSON.stringify(this.history, null, 2);
			await Deno.writeTextFile(this.options.storageFilePath, historyJson);
		} catch (error) {
			console.error(`Failed to save command history: ${error}`);
		}
	}

	/**
	 * Load history from storage
	 */
	public async loadHistory(): Promise<void> {
		try {
			const historyJson = await Deno.readTextFile(this.options.storageFilePath);
			this.history = JSON.parse(historyJson);
		} catch (error) {
			if (!(error instanceof Deno.errors.NotFound)) {
				console.error(`Failed to load command history: ${error}`);
			}
			// Initialize empty history if file doesn't exist
			this.history = [];
		}
	}

	/**
	 * Search history
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
	 * Get statistics about command usage
	 */
	public getStatistics(): {
		totalCommands: number;
		uniqueCommands: number;
		successRate: number;
		averageDuration: number;
		mostUsedCommands: Array<{ command: string; count: number }>;
	} {
		const total = this.history.length;
		const successful = this.history.filter((e) => e.success).length;
		const totalDuration = this.history.reduce((sum, e) => sum + e.duration, 0);

		const commandCounts = this.history.reduce((acc, entry) => {
			acc[entry.command] = (acc[entry.command] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		const mostUsed = Object.entries(commandCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5)
			.map(([command, count]) => ({ command, count }));

		return {
			totalCommands: total,
			uniqueCommands: Object.keys(commandCounts).length,
			successRate: total ? (successful / total) * 100 : 0,
			averageDuration: total ? totalDuration / total : 0,
			mostUsedCommands: mostUsed,
		};
	}
}

// Factory function
export function createCommandHistory(options?: HistoryOptions): CommandHistory {
	return new CommandHistory(options);
}
