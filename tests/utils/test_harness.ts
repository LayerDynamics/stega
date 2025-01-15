// tests/utils/test_harness.ts
import { CLI } from "../../src/core/core.ts";
import { Command } from "../../src/command.ts";
import { ILogger } from "../../src/logger/logger_interface.ts";
import { MockLogger } from "./mock_logger.ts";

interface TestContext {
	cleanup: () => Promise<void>;
}

export class TestHarness {
	private contexts: TestContext[] = [];
	private cli: CLI;
	private mockLogger: MockLogger;

	constructor() {
		this.mockLogger = new MockLogger();
		this.cli = new CLI(undefined, true, true, this.mockLogger);
	}

	public getCLI(): CLI {
		return this.cli;
	}

	public getLogger(): MockLogger {
		return this.mockLogger;
	}

	public async createTempDir(): Promise<string> {
		const dir = await Deno.makeTempDir();
		this.contexts.push({
			cleanup: async () => {
				await Deno.remove(dir, { recursive: true });
			},
		});
		return dir;
	}

	public async createTempFile(content: string): Promise<string> {
		const file = await Deno.makeTempFile();
		await Deno.writeTextFile(file, content);
		this.contexts.push({
			cleanup: async () => {
				await Deno.remove(file);
			},
		});
		return file;
	}

	public async cleanup(): Promise<void> {
		for (const context of this.contexts.reverse()) {
			await context.cleanup();
		}
		this.contexts = [];
	}

	public mockCommand(name: string, action: (args: unknown) => void): Command {
		return {
			name,
			action,
		};
	}
}
