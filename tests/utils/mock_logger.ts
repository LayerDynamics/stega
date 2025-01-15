// tests/utils/mock_logger.ts
import type { LevelName } from "https://deno.land/std@0.224.0/log/levels.ts";
import type { ILogger } from "../../src/logger/logger_interface.ts";

export interface LoggerOptions {
	logLevel?: LevelName;
}

export interface TestLogger extends ILogger {
	logs: string[];
	errors: string[];
	debugs: string[];
	warns: string[];
	reset(): void;
	getMessages(): string[];
}

export class MockLogger implements ILogger {
	private logEntries: Array<{ level: string; message: string }> = [];
	private errorMessages: string[] = [];

	debug(message: string): void {
		this.logEntries.push({ level: "debug", message });
	}

	info(message: string): void {
		this.logEntries.push({ level: "info", message });
	}

	warn(message: string): void {
		this.logEntries.push({ level: "warn", message });
	}

	warning(message: string): void {
		this.warn(message); // Alias for warn
	}

	error(message: string): void {
		this.logEntries.push({ level: "error", message });
		this.errorMessages.push(message);
	}

	critical(message: string): void {
		this.logEntries.push({ level: "critical", message });
		this.errorMessages.push(message);
	}

	getLogs(): Array<{ level: string; message: string }> {
		return this.logEntries;
	}

	get errors(): string[] {
		return this.errorMessages;
	}

	clear(): void {
		this.logEntries = [];
		this.errorMessages = [];
	}
}

export const createMockLogger = (): MockLogger => new MockLogger();
