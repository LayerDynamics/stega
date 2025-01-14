// tests/utils/test_framework.ts
import { CLI } from "../../src/core.ts";
import { Command, CommandRegistry } from "../../src/command.ts";
import { ILogger } from "../../src/logger_interface.ts";
import { assertEquals, assertExists } from "@std/assert";

/**
 * Comprehensive test framework for Stega CLI testing
 */
export class TestFramework {
	private tempFiles: string[] = [];
	private tempDirs: string[] = [];
	private mocks: Map<string, unknown> = new Map();
	private cli: CLI;
	private logger: MockLogger;

	constructor() {
		this.logger = new MockLogger();
		this.cli = new CLI(undefined, true, true, this.logger);
	}

	/**
	 * Creates an isolated test environment
	 */
	public async createTestEnvironment(): Promise<TestEnvironment> {
		const baseDir = await Deno.makeTempDir();
		this.tempDirs.push(baseDir);

		return new TestEnvironment(baseDir, this);
	}

	/**
	 * Creates a file with given content for testing
	 */
	public async createTempFile(
		content: string,
		extension = ".txt",
	): Promise<string> {
		const filePath = await Deno.makeTempFile({ suffix: extension });
		await Deno.writeTextFile(filePath, content);
		this.tempFiles.push(filePath);
		return filePath;
	}

	/**
	 * Registers a mock for a specific dependency
	 */
	public registerMock<T>(identifier: string, mock: T): void {
		this.mocks.set(identifier, mock);
	}

	/**
	 * Retrieves a registered mock
	 */
	public getMock<T>(identifier: string): T {
		const mock = this.mocks.get(identifier);
		if (!mock) {
			throw new Error(`Mock not found: ${identifier}`);
		}
		return mock as T;
	}

	/**
	 * Verifies if a command exists
	 */
	public hasCommand(name: string): boolean {
		const cli = this.getCLI();
		// @ts-ignore - Accessing private registry for testing
		const registry: CommandRegistry = cli["registry"];
		const exists = registry.findCommand(name) !== undefined;
		this.logger.debug(
			`Command "${name}" ${exists ? "exists" : "not found"} in registry`,
		);
		if (!exists) {
			const commands = registry.getCommands().map((cmd) => cmd.name);
			this.logger.debug(`Available commands: ${commands.join(", ")}`);
		}
		return exists;
	}

	/**
	 * Lists all registered commands
	 */
	public getRegisteredCommands(): string[] {
		const cli = this.getCLI();
		// @ts-ignore - Accessing private registry for testing
		const registry: CommandRegistry = cli["registry"];
		const commands = registry.getCommands().map((cmd) => cmd.name);
		this.logger.debug(`Registered commands: ${commands.join(", ")}`);
		return commands;
	}

	/**
	 * Waits for command registration to complete
	 */
	public async waitForCLIReady(): Promise<void> {
		await this.cli.waitForReady();
	}

	/**
	 * Executes a command in the test environment
	 */
	public async executeCommand(args: string[]): Promise<CommandResult> {
		// Wait for CLI to be ready before executing commands
		await this.waitForCLIReady();

		const startTime = performance.now();
		let error: Error | undefined;

		this.logger.debug(`Executing command: ${args.join(" ")}`);
		const preCommands = this.getRegisteredCommands();
		this.logger.debug(
			`Available commands before execution: ${preCommands.join(", ")}`,
		);

		try {
			await this.cli.runCommand(args);
		} catch (e) {
			error = e instanceof Error ? e : new Error(String(e));
			this.logger.debug(`Command execution failed: ${error.message}`);
		}

		const endTime = performance.now();
		const postCommands = this.getRegisteredCommands();
		this.logger.debug(
			`Available commands after execution: ${postCommands.join(", ")}`,
		);

		const result = {
			duration: endTime - startTime,
			success: !error,
			error,
			logs: this.logger.getLogs(),
			errors: this.logger.getErrors(),
		};

		this.logger.debug(`Command result: ${JSON.stringify(result)}`);
		return result;
	}

	/**
	 * Measures performance of a specific operation
	 */
	public async measurePerformance(
		operation: () => Promise<void>,
		iterations = 1,
	): Promise<PerformanceMetrics> {
		const durations: number[] = [];
		const memoryUsage: number[] = [];

		for (let i = 0; i < iterations; i++) {
			const startMemory = Deno.memoryUsage().heapUsed;
			const startTime = performance.now();

			await operation();

			const endTime = performance.now();
			const endMemory = Deno.memoryUsage().heapUsed;

			durations.push(endTime - startTime);
			memoryUsage.push(endMemory - startMemory);
		}

		return {
			averageDuration: durations.reduce((a, b) => a + b, 0) / iterations,
			minDuration: Math.min(...durations),
			maxDuration: Math.max(...durations),
			averageMemoryUsage: memoryUsage.reduce((a, b) => a + b, 0) / iterations,
			peakMemoryUsage: Math.max(...memoryUsage),
		};
	}

	/**
	 * Cleans up all test resources
	 */
	public async cleanup(): Promise<void> {
		for (const file of this.tempFiles) {
			try {
				await Deno.remove(file);
			} catch (error) {
				console.warn(`Failed to remove temp file ${file}:`, error);
			}
		}

		for (const dir of this.tempDirs) {
			try {
				await Deno.remove(dir, { recursive: true });
			} catch (error) {
				console.warn(`Failed to remove temp directory ${dir}:`, error);
			}
		}

		this.tempFiles = [];
		this.tempDirs = [];
		this.mocks.clear();
	}

	/**
	 * Gets the CLI instance
	 */
	public getCLI(): CLI {
		return this.cli;
	}

	/**
	 * Gets the logger instance
	 */
	public getLogger(): MockLogger {
		return this.logger;
	}
}

/**
 * Represents an isolated test environment
 */
export class TestEnvironment {
	constructor(
		private baseDir: string,
		private framework: TestFramework,
	) {}

	/**
	 * Creates a file within the test environment
	 */
	public async createFile(
		relativePath: string,
		content: string,
	): Promise<string> {
		const fullPath = `${this.baseDir}/${relativePath}`;
		await Deno.mkdir(new URL(".", "file://" + fullPath).pathname, {
			recursive: true,
		});
		await Deno.writeTextFile(fullPath, content);
		return fullPath;
	}

	/**
	 * Reads a file from the test environment
	 */
	public async readFile(relativePath: string): Promise<string> {
		return await Deno.readTextFile(`${this.baseDir}/${relativePath}`);
	}

	/**
	 * Gets the base directory of the test environment
	 */
	public getBaseDir(): string {
		return this.baseDir;
	}

	/**
	 * Resolves a path relative to the source directory
	 */
	public resolveSrcPath(path: string): string {
		return new URL(`../../src/${path}`, import.meta.url).pathname;
	}

	/**
	 * Creates a plugin file with correct import paths
	 */
	public async createPluginFile(
		name: string,
		content: string,
	): Promise<string> {
		const corePath = this.resolveSrcPath("core.ts");
		const pluginPath = this.resolveSrcPath("plugin.ts");

		const pluginContent = content
			.replace("../../src/core.ts", corePath)
			.replace("../../src/plugin.ts", pluginPath);

		return await this.createFile(name, pluginContent);
	}

	/**
	 * Cleans up the test environment
	 */
	public async cleanup(): Promise<void> {
		try {
			await Deno.remove(this.baseDir, { recursive: true });
		} catch (error) {
			console.warn(
				`Failed to cleanup test environment at ${this.baseDir}:`,
				error,
			);
		}
	}
}

/**
 * Represents the result of a command execution
 */
export interface CommandResult {
	duration: number;
	success: boolean;
	error?: Error;
	logs: string[];
	errors: string[];
}

/**
 * Represents performance metrics
 */
export interface PerformanceMetrics {
	averageDuration: number;
	minDuration: number;
	maxDuration: number;
	averageMemoryUsage: number;
	peakMemoryUsage: number;
}

/**
 * Mock logger for testing
 */
export class MockLogger implements ILogger {
	private logs: string[] = [];
	private errors: string[] = [];
	private debugs: string[] = [];
	private warns: string[] = [];

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

	getLogs(): string[] {
		return [...this.logs];
	}

	getErrors(): string[] {
		return [...this.errors];
	}

	getDebugs(): string[] {
		return [...this.debugs];
	}

	getWarns(): string[] {
		return [...this.warns];
	}

	clear(): void {
		this.logs = [];
		this.errors = [];
		this.debugs = [];
		this.warns = [];
	}
}
