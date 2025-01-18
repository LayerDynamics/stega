// src/repl/interactive.ts

import { CLI } from "../core/core.ts";
import { CommandHistory, HistoryStatistics } from "./history.ts";

interface REPLStreamReader {
	read(p: Uint8Array): Promise<number | null>;
	setRaw?(mode: boolean): Promise<void>;
	close(): void;
}

interface REPLStreamWriter {
	write(p: Uint8Array): Promise<number>;
	close(): void;
}

interface REPLOptions {
	prompt?: string;
	historyFile?: string;
	maxHistorySize?: number;
	enableSuggestions?: boolean;
	commands?: Record<string, REPLCommand>;
	multiline?: boolean;
	debugMode?: boolean;
	stdin?: REPLStreamReader;
	stdout?: REPLStreamWriter;
	idleTimeout?: number;
}

interface REPLCommand {
	description: string;
	action: (args: string[]) => Promise<void> | void;
	usage?: string;
	examples?: string[];
}

export class InteractiveREPL extends EventTarget {
	private cli: CLI;
	private history: CommandHistory;
	private options: Required<REPLOptions>;
	private running = false;
	private currentLine = "";
	private cursorPos = 0;
	private historyIndex = -1;
	private tempLine = "";
	private multilineBuffer: string[] = [];
	private undoStack: string[] = [];
	private redoStack: string[] = [];

	private stdin: REPLStreamReader;
	private stdout: REPLStreamWriter;

	private eventListenersMap: Map<string, EventListener[]> = new Map();

	private static readonly ESCAPE_CODES = {
		CLEAR_LINE: "\x1b[2K",
		CURSOR_LEFT: "\x1b[D",
		CURSOR_RIGHT: "\x1b[C",
		CURSOR_START: "\r", // Revert to carriage return
		CLEAR_SCREEN: "\x1b[2J",
		SAVE_CURSOR: "\x1b[s",
		RESTORE_CURSOR: "\x1b[u",
	};

	private readonly builtinCommands: Record<string, REPLCommand> = {
		help: {
			description: "Show help information",
			usage: "help [command]",
			examples: ["help", "help history"],
			action: async (args) => {
				const commandName = args[0];
				if (typeof commandName === "string") {
					await this.showCommandHelp(commandName);
				} else {
					await this.showHelp();
				}
			},
		},
		exit: {
			description: "Exit the REPL",
			usage: "exit",
			action: () => this.close(),
		},
		clear: {
			description: "Clear the screen",
			usage: "clear",
			action: async () => {
				await this.writeOutput("\x1b[2J\x1b[H"); // Output clear sequence in one call
			},
		},
		history: {
			description: "Show command history",
			usage: "history [search-term]",
			examples: ["history", "history grep", "history --last=10"],
			action: (args) => this.showHistory(args[0] || ""),
		},
		debug: {
			description: "Toggle debug mode",
			usage: "debug [on|off]",
			action: (args) => {
				this.options.debugMode = args[0] === "on" || args[0] === "true";
				this.writeOutput(
					`Debug mode ${this.options.debugMode ? "enabled" : "disabled"}\n`,
				);
			},
		},
		testcommand: {
			description: "Test command with no dash",
			usage: "testcommand",
			examples: ["testcommand"],
			action: async () => {
				this.writeOutput("Testcommand executed\n");
			},
		},
		test: {
			description: "Test command",
			usage: "test",
			examples: ["test"],
			action: async () => {
				this.writeOutput("Test executed\n");
			},
		},
	};

	constructor(cli: CLI, options: REPLOptions = {}) {
		super();
		this.cli = cli;
		this.history = new CommandHistory({
			maxEntries: options.maxHistorySize || 1000,
			storageFilePath: options.historyFile?.trim() ||
				".stega/repl_history.json",
			excludeCommands: ["help", "exit", "clear", "history"],
		});

		const defaultOptions: Required<REPLOptions> = {
			prompt: "> ",
			historyFile: ".stega/repl_history.json",
			maxHistorySize: 1000,
			enableSuggestions: true,
			commands: {},
			multiline: false,
			debugMode: false,
			stdin: {
				read: async () => null,
				setRaw: async () => {},
				close: () => {},
			},
			stdout: {
				write: async () => 0,
				close: () => {},
			},
			idleTimeout: 2000,
		};

		this.options = { ...defaultOptions, ...options };
		this.options.commands = {
			...this.builtinCommands,
			...this.options.commands,
		};

		this.stdin = this.options.stdin!;
		this.stdout = this.options.stdout!;

		this.setupEventHandlers();
	}

	private setupEventHandlers(): void {
		this.addEventListener(
			"line",
			((event: CustomEvent<string>) => {
				const line = event.detail;
				if (this.options.debugMode) {
					this.writeOutput(`Debug: Processing line: ${line}\n`);
				}
			}) as EventListener,
		);

		this.addEventListener(
			"error",
			((event: CustomEvent<Error>) => {
				const error = event.detail;
				this.writeOutput(`REPL Error: ${error.message}\n`);
				if (this.options.debugMode) {
					this.writeOutput(`${error.stack}\n`);
				}
			}) as EventListener,
		);
	}

	/**
	 * Public method to write output to stdout.
	 * @param text The text to write.
	 */
	public async writeOutput(text: string): Promise<void> {
		const encoder = new TextEncoder();
		await this.stdout.write(encoder.encode(text));
	}

	/**
	 * Public getter to access the debugMode status.
	 * @returns A boolean indicating if debug mode is enabled.
	 */
	public getDebugMode(): boolean {
		return this.options.debugMode;
	}

	public async start(): Promise<void> {
		if (this.running) return;
		this.running = true;

		await this.history.loadHistory();
		await this.writeOutput(
			"Interactive REPL started. Type 'help' for available commands.\n",
		);
		this.dispatchEvent(new CustomEvent("start"));
		await this.readLoop();
	}

	private async readLoop(): Promise<void> {
		let lastActivity = Date.now();

		while (this.running) {
			try {
				const prompt = this.options.multiline && this.multilineBuffer.length > 0
					? "... "
					: this.options.prompt ?? "> ";
				await this.writeOutput(prompt);

				const line = await this.readLine();
				if (!line) {
					// Check idle timeout
					if (Date.now() - lastActivity > this.options.idleTimeout) {
						await this.writeOutput("Idle timeout reached. Exiting REPL.\n");
						await this.close();
						break;
					}
				} else {
					lastActivity = Date.now(); // Reset idle timer on actual input
				}

				if (this.options.multiline) {
					if (line.trim() === "") {
						const fullCommand = this.multilineBuffer.join("\n");
						if (fullCommand.trim()) {
							await this.eval(fullCommand);
						}
						this.multilineBuffer = [];
					} else {
						this.multilineBuffer.push(line);
					}
				} else if (line.trim()) {
					await this.eval(line);
				}
			} catch (error) {
				this.dispatchEvent(
					new CustomEvent("error", { detail: error }),
				);
			}
		}
	}

	private async handleKeypress(key: string): Promise<boolean> {
		// Special key combinations
		if (key === "\x03") {
			// Ctrl+C
			if (this.multilineBuffer.length > 0) {
				this.multilineBuffer = [];
				await this.stdout.write(new TextEncoder().encode("\n"));
				return true;
			}
			await this.close();
			return true;
		}

		if (key === "\x04") {
			// Ctrl+D
			if (this.currentLine.length === 0 && this.multilineBuffer.length === 0) {
				await this.close();
				return true;
			}
		}

		if (key === "\x1a") {
			// Ctrl+Z
			if (this.undoStack.length > 0) {
				this.redoStack.push(this.currentLine);
				this.currentLine = this.undoStack.pop()!;
				this.cursorPos = this.currentLine.length;
				await this.refreshLine();
				return true;
			}
			return true;
		}

		if (key === "\x19") {
			// Ctrl+Y
			if (this.redoStack.length > 0) {
				this.undoStack.push(this.currentLine);
				this.currentLine = this.redoStack.pop()!;
				this.cursorPos = this.currentLine.length;
				await this.refreshLine();
				return true;
			}
			return true;
		}

		// Handle regular keys and special characters
		switch (key) {
			case "\r":
			case "\n":
				await this.refreshLine();
				return true;

			case "\x7f": // Backspace
				if (this.cursorPos > 0) {
					this.undoStack.push(this.currentLine);
					this.currentLine = this.currentLine.slice(0, this.cursorPos - 1) +
						this.currentLine.slice(this.cursorPos);
					this.cursorPos--;
					await this.refreshLine();
				}
				return true;

			case "\x1b[A": // Up arrow
				await this.navigateHistory("up");
				return true;

			case "\x1b[B": // Down arrow
				await this.navigateHistory("down");
				return true;

			case "\x1b[C": // Right arrow
				if (this.cursorPos < this.currentLine.length) {
					this.cursorPos++;
					await this.refreshLine();
				}
				return true;

			case "\x1b[D": // Left arrow
				if (this.cursorPos > 0) {
					this.cursorPos--;
					await this.refreshLine();
				}
				return true;

			case "\t": // Tab completion
				await this.handleTabCompletion();
				return true;

			default:
				if (key.length === 1 && key >= " ") {
					this.undoStack.push(this.currentLine);
					this.currentLine = this.currentLine.slice(0, this.cursorPos) +
						key +
						this.currentLine.slice(this.cursorPos);
					this.cursorPos++;
					await this.refreshLine();
					return true;
				}
				return false;
		}
	}

	private async readLine(): Promise<string> {
		this.currentLine = "";
		this.cursorPos = 0;
		this.undoStack = [];
		this.redoStack = [];

		if (this.hasRawMode()) {
			await this.stdin.setRaw!(true);
		}

		try {
			while (true) {
				const buf = new Uint8Array(8);

				let n: number | null;
				try {
					n = await this.stdin.read(buf);
				} catch (e) {
					await this.close();
					throw e;
				}

				if (n === null) break;

				const decoder = new TextDecoder();
				const key = decoder.decode(buf.subarray(0, n));
				const handled = await this.handleKeypress(key);

				if (!handled && key.startsWith("\x1b")) {
					continue; // Skip unhandled escape sequences
				}

				if (key === "\r" || key === "\n") {
					const line = this.currentLine;
					this.currentLine = "";
					this.cursorPos = 0;
					await this.stdout.write(new TextEncoder().encode("\n"));
					return line;
				}
			}
		} finally {
			if (this.hasRawMode()) {
				await this.stdin.setRaw!(false);
			}
		}

		return this.currentLine;
	}

	private async refreshLine(): Promise<void> {
		const line = this.options.prompt + this.currentLine;
		const output = new TextEncoder().encode(
			InteractiveREPL.ESCAPE_CODES.CURSOR_START +
				InteractiveREPL.ESCAPE_CODES.CLEAR_LINE +
				line,
		);
		await this.stdout.write(output);

		if (this.cursorPos < this.currentLine.length) {
			const moveLeft = this.currentLine.length - this.cursorPos;
			await this.stdout.write(
				new TextEncoder().encode(`\x1b[${moveLeft}D`),
			);
		}
	}

	private async navigateHistory(direction: "up" | "down"): Promise<void> {
		const history = this.history.getHistory();

		if (direction === "up") {
			if (this.historyIndex === -1) {
				this.tempLine = this.currentLine;
			}
			if (this.historyIndex < history.length - 1) {
				this.historyIndex++;
				this.currentLine = history[this.historyIndex].command;
				this.cursorPos = this.currentLine.length;
				await this.refreshLine();
			}
		} else {
			if (this.historyIndex > -1) {
				this.historyIndex--;
				if (this.historyIndex === -1) {
					this.currentLine = this.tempLine;
				} else {
					this.currentLine = history[this.historyIndex].command;
				}
				this.cursorPos = this.currentLine.length;
				await this.refreshLine();
			}
		}
	}

	private async handleTabCompletion(): Promise<void> {
		const word = this.getCurrentWord();
		const completions = this.getCompletions(word);

		if (completions.length === 0) return;

		if (completions.length === 1) {
			const completion = completions[0];
			const beforeCursor = this.currentLine.slice(
				0,
				this.cursorPos - word.length,
			);
			const afterCursor = this.currentLine.slice(this.cursorPos);
			this.currentLine = beforeCursor + completion + afterCursor;
			this.cursorPos += completion.length - word.length;
			await this.refreshLine();
		} else {
			await this.writeOutput("\n");
			const commonPrefix = this.findCommonPrefix(completions);
			if (commonPrefix.length > word.length) {
				const beforeCursor = this.currentLine.slice(
					0,
					this.cursorPos - word.length,
				);
				const afterCursor = this.currentLine.slice(this.cursorPos);
				this.currentLine = beforeCursor + commonPrefix + afterCursor;
				this.cursorPos += commonPrefix.length - word.length;
			}

			// Display completions in columns
			const maxWidth = Math.max(...completions.map((c) => c.length));
			const columns = Math.floor(80 / (maxWidth + 2));
			const rows = Math.ceil(completions.length / columns);

			for (let row = 0; row < rows; row++) {
				const line: string[] = [];
				for (let col = 0; col < columns; col++) {
					const idx = col * rows + row;
					if (idx < completions.length) {
						line.push(completions[idx].padEnd(maxWidth + 2));
					}
				}
				this.writeOutput(line.join("") + "\n");
			}

			await this.refreshLine();
		}
	}

	private findCommonPrefix(strings: string[]): string {
		if (strings.length === 0) return "";
		const firstStr = strings[0];
		let prefix = "";
		for (let i = 0; i < firstStr.length; i++) {
			const char = firstStr[i];
			if (strings.every((str) => str[i] === char)) {
				prefix += char;
			} else {
				break;
			}
		}
		return prefix;
	}

	private getCompletions(word: string): string[] {
		const commands = this.options.commands ?? {};
		const cliCommands = this.cli
			.getCommandRegistry()
			.getCommands()
			.map((cmd) => cmd.name);

		const allCommands = [
			...Object.keys(commands),
			...cliCommands,
		];

		const matches = allCommands.filter((cmd) =>
			cmd.toLowerCase().startsWith(word.toLowerCase())
		);

		// First try exact matches for longer commands
		const exactMatches = matches.filter((cmd) =>
			cmd.toLowerCase().startsWith(word.toLowerCase()) &&
			cmd.includes("-")
		);

		return exactMatches.length > 0 ? exactMatches : matches;
	}

	private getCurrentWord(): string {
		const before = this.currentLine.slice(0, this.cursorPos);
		const words = before.split(/\s+/);
		return words[words.length - 1] || "";
	}

	/**
	 * Evaluate and execute a line of input
	 */
	private async eval(line: string): Promise<void> {
		const startTime = performance.now();
		let success = false;
		let error: Error | undefined;

		try {
			const [command, ...args] = line.trim().toLowerCase().split(/\s+/);

			if (this.options.debugMode) {
				this.writeOutput(
					`Debug: Executing command: ${command} with args: ${
						args.join(
							" ",
						)
					}\n`,
				);
			}

			const commands = this.options.commands ?? {};
			const cmd = commands[command];
			if (cmd) {
				await cmd.action(args);
				success = true; // Ensure success is set to true here
			} else {
				await this.cli.runCommand([command, ...args]);
				success = true; // Ensure success is set to true here
			}
		} catch (e) {
			error = e instanceof Error ? e : new Error(String(e));
			this.writeOutput(`Error: ${error.message}\n`);
			this.dispatchEvent(
				new CustomEvent("error", { detail: error }),
			);
		} finally {
			// Add to history regardless of exclusion; CommandHistory handles exclusion
			const commandName = line.trim().split(/\s+/)[0].toLowerCase();
			await this.history.addEntry({
				command: commandName, // Record only the command name
				args: this.parseArgs(line),
				timestamp: Date.now(),
				success,
				duration: performance.now() - startTime,
				error: error?.message,
			});
		}
	}

	/**
	 * Parse arguments from the command line.
	 * This is a simple parser; consider using a more robust solution if needed.
	 */
	private parseArgs(line: string): Record<string, unknown> {
		const args: Record<string, unknown> = {};
		const tokens = line.trim().split(/\s+/);
		// Simple parsing: key=value or standalone arguments
		for (let i = 1; i < tokens.length; i++) {
			const token = tokens[i];
			const [key, value] = token.split("=");
			if (value !== undefined) {
				args[key] = value;
			} else {
				args[`arg${i}`] = token;
			}
		}
		return args;
	}

	/**
	 * Show help for a specific command
	 */
	private async showCommandHelp(commandName: string): Promise<void> {
		const commands = this.options.commands ?? {};
		const command = commands[commandName];
		if (!command) {
			this.writeOutput(`No help available for '${commandName}'\n`);
			return;
		}

		this.writeOutput(`\nCommand: ${commandName}\n`);
		this.writeOutput(`${command.description}\n`);

		if (command.usage) {
			this.writeOutput(`\nUsage: ${command.usage}\n`);
		}

		if (command.examples?.length) {
			this.writeOutput("\nExamples:\n");
			for (const example of command.examples) {
				this.writeOutput(`  ${example}\n`);
			}
		}

		this.writeOutput("\n");
	}

	/**
	 * Show help information
	 */
	private async showHelp(): Promise<void> {
		this.writeOutput("\nAvailable Commands:\n");

		// Show built-in and custom commands
		const commands = this.options.commands ?? {};
		for (const [name, cmd] of Object.entries(commands)) {
			this.writeOutput(`  ${name.padEnd(15)} ${cmd.description}\n`);
		}

		// Show CLI commands
		this.writeOutput("\nCLI Commands:\n");
		const cliCommands = this.cli
			.getCommandRegistry()
			.getCommands();
		for (const cmd of cliCommands) {
			this.writeOutput(
				`  ${cmd.name.padEnd(15)} ${cmd.description || ""}\n`,
			);
		}

		this.writeOutput("\nSpecial Keys:\n");
		this.writeOutput("  Ctrl+C         Exit REPL\n");
		this.writeOutput("  Ctrl+D         Exit when line is empty\n");
		this.writeOutput("  Ctrl+Z         Undo\n");
		this.writeOutput("  Ctrl+Y         Redo\n");
		this.writeOutput("  Up/Down        Navigate history\n");
		this.writeOutput("  Tab            Command completion\n");
		if (this.options.multiline) {
			this.writeOutput(
				"  Empty line     End multiline input\n",
			);
		}
		this.writeOutput("\n");
	}

	/**
	 * Show command history with optional search term
	 */
	private async showHistory(
		searchTerm: string,
	): Promise<void> {
		let history = this.history.getHistory();

		if (searchTerm) {
			history = history.filter((entry) =>
				entry.command.toLowerCase().includes(searchTerm.toLowerCase())
			);
			if (history.length === 0) {
				this.writeOutput(
					`No commands found matching '${searchTerm}'\n`,
				);
				return;
			}
		}

		if (history.length === 0) {
			this.writeOutput("No command history\n");
			return;
		}

		this.writeOutput("\nCommand History:\n");
		for (const entry of history) {
			const timestamp = new Date(
				entry.timestamp,
			).toLocaleString();
			const duration = entry.duration.toFixed(2);
			const status = entry.success ? "✓" : "✗";
			this.writeOutput(
				`  ${timestamp} ${status} ${duration}ms ${entry.command}\n`,
			);
			if (!entry.success && entry.error) {
				this.writeOutput(
					`    Error: ${entry.error}\n`,
				);
			}
		}
		this.writeOutput("\n");
	}

	/**
	 * Close the REPL and remove all event listeners.
	 */
	public async close(): Promise<void> {
		if (!this.running) return;
		this.running = false;
		await this.writeOutput("\n");
		this.dispatchEvent(
			new CustomEvent<void>("exit"),
		);
		this.removeAllEventListeners();
	}

	// Override addEventListener to track listeners
	public override addEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject | null,
		options?: boolean | AddEventListenerOptions,
	): void {
		super.addEventListener(type, listener, options);
		if (listener && typeof listener === "function") {
			if (!this.eventListenersMap.has(type)) {
				this.eventListenersMap.set(type, []);
			}
			this.eventListenersMap.get(type)!.push(listener);
		}
	}

	// Override removeEventListener to update the tracking map
	public override removeEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject | null,
		options?: boolean | EventListenerOptions,
	): void {
		super.removeEventListener(type, listener, options);
		if (listener && typeof listener === "function") {
			const listeners = this.eventListenersMap.get(type);
			if (listeners) {
				const index = listeners.indexOf(listener);
				if (index !== -1) {
					listeners.splice(index, 1);
				}
				if (listeners.length === 0) {
					this.eventListenersMap.delete(type);
				}
			}
		}
	}

	// Implement the listeners method to retrieve tracked listeners
	public listeners(type: string): EventListener[] {
		return this.eventListenersMap.get(type) || [];
	}

	// Update removeAllEventListeners to use the new listeners method
	private removeAllEventListeners(): void {
		const types = Array.from(this.eventListenersMap.keys());
		for (const type of types) {
			const listeners = Array.from(this.listeners(type));
			listeners.forEach((listener) => this.removeEventListener(type, listener));
		}
	}

	// Add the getStatistics method to retrieve command history statistics
	public getStatistics(): HistoryStatistics {
		return this.history.getStatistics();
	}

	/**
	 * Check if stdin has setRaw method (raw mode)
	 */
	private hasRawMode(): boolean {
		return "setRaw" in this.stdin && typeof this.stdin.setRaw === "function";
	}
}

/**
 * Factory function to create a new InteractiveREPL instance.
 * @param cli The CLI instance to associate with the REPL.
 * @param options Optional REPLOptions to customize the REPL behavior.
 * @returns A new InteractiveREPL instance.
 */
export function createREPL(
	cli: CLI,
	options?: REPLOptions,
): InteractiveREPL {
	return new InteractiveREPL(cli, options);
}
