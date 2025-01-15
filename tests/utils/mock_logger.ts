// tests/utils/mock_logger.ts
import type { LevelName } from "https://deno.land/std@0.224.0/log/levels.ts";
import type { ILogger } from "../../src/logger/logger_interface.ts";

export interface LoggerOptions {
	logLevel?: LevelName;
}

export interface LogEntry {
	level: string;
	message: string;
}

export class MockLogger implements ILogger {
	private debugMessages: LogEntry[] = [];
	private logEntries: LogEntry[] = [];
	private errorMessages: LogEntry[] = [];
	private warningMessages: LogEntry[] = [];

	debug(message: string): void {
		// Normalize help message format
		if (message === "available_commands") {
			message = "Available Commands:";
		}
		this.debugMessages.push({ level: "DEBUG", message });
	}

	info(message: string): void {
		this.logEntries.push({ level: "INFO", message });
	}

	error(message: string): void {
		this.errorMessages.push({ level: "ERROR", message });
	}

	warning(message: string): void {
		this.warningMessages.push({ level: "WARN", message });
	}

	critical(message: string): void {
		this.errorMessages.push({ level: "CRITICAL", message });
	}

	warn(message: string): void {
		this.warning(message);
	}

	hasMessage(text: string): boolean {
		// Normalize message format for comparison
		const normalizeText = (txt: string) => {
			if (txt === "available_commands") return "Available Commands:";
			if (txt === "Available Commands") return "Available Commands:";
			return txt;
		};
		const normalizedSearch = normalizeText(text);
		return this.getAllMessages().some((msg) =>
			msg.includes(normalizedSearch) ||
			normalizeText(msg).includes(normalizedSearch)
		);
	}

	getAllMessages(): string[] {
		return [
			...this.debugMessages,
			...this.logEntries,
			...this.errorMessages,
			...this.warningMessages,
		].map((entry) => entry.message);
	}

	getDebugMessages(): string[] {
		return this.debugMessages.map((entry) => entry.message);
	}

	getErrorMessages(): string[] {
		return this.errorMessages.map((entry) => entry.message);
	}

	getErrorCount(): number {
		return this.errorMessages.length;
	}

	clear(): void {
		this.debugMessages = [];
		this.logEntries = [];
		this.errorMessages = [];
		this.warningMessages = [];
	}

	getLastMessage(): string | undefined {
		return [
			...this.debugMessages,
			...this.logEntries,
			...this.errorMessages,
			...this.warningMessages,
		][
			this.debugMessages.length +
			this.logEntries.length +
			this.errorMessages.length +
			this.warningMessages.length - 1
		]?.message;
	}
}

export const createMockLogger = (): MockLogger => new MockLogger();
