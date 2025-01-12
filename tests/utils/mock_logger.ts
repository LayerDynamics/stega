// tests/utils/mock_logger.ts
import type {LevelName} from "https://deno.land/std@0.224.0/log/levels.ts";
import type {ILogger} from "../../src/logger_interface.ts";

export class MockLogger implements ILogger {
	public logs: string[]=[];
	public errors: string[]=[];
	public debugs: string[]=[];
	public warns: string[]=[];

	constructor(private logLevel: LevelName="INFO") {}

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

	getAllMessages(): string[] {
		return [
			...this.logs,
			...this.errors,
			...this.debugs,
			...this.warns
		];
	}
}

export const createMockLogger=(): MockLogger => new MockLogger();
