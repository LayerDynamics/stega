// tests/utils/mock_logger.ts
import type { LevelName } from "https://deno.land/std@0.224.0/log/levels.ts";
import type { ILogger } from "../../src/logger_interface.ts";

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

export class MockLogger implements TestLogger {
	public logs: string[]=[];
	public errors: string[]=[];
	public debugs: string[]=[];
	public warns: string[]=[];
	protected logLevel: LevelName;

	constructor(options: LoggerOptions={}) {
		this.logLevel=options.logLevel||"INFO";
	}

	info(message: string): void {
		this.logs.push(message);
	}

	error(message: string): void {
		this.errors.push(message);
	}

	debug(message: string): void {
		this.debugs.push(message);
	}

	warn(message: string): void {
		this.warns.push(message);
	}

	reset(): void {
		this.logs=[];
		this.errors=[];
		this.debugs=[];
		this.warns=[];
	}

	getMessages(): string[] {
		return [
			...this.logs,
			...this.errors,
			...this.debugs,
			...this.warns
		];
	}
}

export const createMockLogger=(options?: LoggerOptions): MockLogger => new MockLogger(options);
