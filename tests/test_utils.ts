// tests/test_utils.ts
import { CLI } from "../src/core/core.ts";
import { ILogger } from "../src/logger/logger_interface.ts";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts"; // Updated import statement
import { MockLogger } from "./utils/mock_logger.ts";
import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts"; // Ensure assert is also imported correctly
import { ConsoleLogger } from "../src/logger/logger.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";

export { MockLogger };

export interface TestContext {
	cli: CLI;
	logger: MockLogger;
	cleanup: () => Promise<void>;
}

export async function createTestContext(): Promise<TestContext> {
	const logger = new MockLogger();
	const cli = new CLI(undefined, true, true, logger);

	// Initialize core components
	await cli.waitForReady();

	return {
		cli,
		logger,
		cleanup: async () => {
			logger.clear();
		},
	};
}

export async function mockDenoEnv(
	envVars: Record<string, string>,
): Promise<() => void> {
	const originalEnv = { ...Deno.env.toObject() };
	Object.entries(envVars).forEach(([key, value]) => {
		Deno.env.set(key, value);
	});

	return () => {
		// Restore original environment
		Object.keys(Deno.env.toObject()).forEach((key) => {
			if (key in originalEnv) {
				Deno.env.set(key, originalEnv[key]);
			} else {
				Deno.env.delete(key);
			}
		});
	};
}

export async function mockDenoArgs(args: string[]): Promise<() => void> {
	const originalArgs = Deno.args;
	Object.defineProperty(Deno, "args", { value: args });
	return () => Object.defineProperty(Deno, "args", { value: originalArgs });
}

export interface TestCLI {
	cli: CLI;
	logger: MockLogger;
}

export interface TestFixture {
	name: string;
	path: string;
}

/**
 * Create a test CLI instance with a mock logger
 * @returns The CLI instance and its associated logger
 */
export async function createTestCLI(): Promise<TestCLI> {
	const logger = new MockLogger();
	const cli = new CLI(undefined, true, true, logger);
	// Initialize CLI without arguments
	await cli.run();
	return { cli, logger };
}

export async function createMockCLI(): Promise<CLI> {
	const logger = new ConsoleLogger();
	const cli = new CLI(undefined, true, true, logger);
	// Initialize CLI
	await cli.run();
	return cli;
}

/**
 * Helper function to create temporary files in the test fixtures directory
 */
export async function createTempFile(
	content: string,
	isPlugin = false,
): Promise<string> {
	const filename = crypto.randomUUID() + ".ts";
	let filepath;

	if (isPlugin) {
		const pluginsDir = join("tests", "plugins");
		await ensureDir(pluginsDir);
		filepath = join(pluginsDir, filename);
	} else {
		const tmpDir = join("tests", "fixtures", "tmp");
		await ensureDir(tmpDir);
		filepath = join(tmpDir, filename);
	}

	await Deno.writeTextFile(filepath, content);
	return filepath;
}

export async function createTempDir(prefix = "test"): Promise<string> {
	const tempDir = "./tests/fixtures/tmp";
	await Deno.mkdir(tempDir, { recursive: true });

	const dirPath = `${tempDir}/${prefix}-${crypto.randomUUID()}`;
	await Deno.mkdir(dirPath, { recursive: true });
	return dirPath;
}

/**
 * Helper function to clean up temporary files
 * @param paths Array of file paths to remove
 */
export async function cleanupTempFiles(...paths: string[]): Promise<void> {
	for (const filePath of paths) {
		try {
			await Deno.remove(filePath);
		} catch (error) {
			// Ignore errors if file doesn't exist or cannot be removed
			if (
				!(error instanceof Deno.errors.NotFound) &&
				!(error instanceof Deno.errors.PermissionDenied)
			) {
				throw error;
			}
		}
	}
}

/**
 * Gets the project root directory
 * @returns The absolute path to the project root
 */
export function getProjectRoot(): string {
	// Assumes test_utils.ts is in the tests directory at project root
	return path.resolve(path.dirname(path.fromFileUrl(import.meta.url)), "..");
}

/**
 * Resolves a path relative to the project root
 * @param relativePath The relative path to resolve
 * @returns The absolute path resolved from the project root
 */
export function resolveProjectPath(relativePath: string): string {
	return path.resolve(getProjectRoot(), relativePath);
} /**
 * Helper to import a source file relative to project root
 * @param relativePath The relative path to the source file
 * @returns The imported module
 */

export async function importSourceFile(relativePath: string): Promise<unknown> {
	const fullPath = resolveProjectPath(relativePath);
	// Use a more direct import approach
	if (relativePath.startsWith("src/")) {
		return import(`../src/${relativePath.slice(4)}`);
	}
	throw new Error(`Invalid import path: ${relativePath}`);
}

/**
 * Mock fetch implementation with abort support
 * @param status The HTTP status code to return
 * @param data The JSON data to return in the response
 * @param delay The delay in milliseconds before resolving the response
 * @returns A mock fetch function
 */
export function mockFetchWithAbort(
	status = 200,
	data: Record<string, unknown> = { success: true },
	delay = 200, // default delay in ms
): (input: string | URL | Request, init?: RequestInit) => Promise<Response> {
	return (input: string | URL | Request, init?: RequestInit) => {
		return new Promise<Response>((resolve, reject) => {
			const timer = setTimeout(() => {
				resolve(new Response(JSON.stringify(data), { status }));
			}, delay);

			if (init?.signal) {
				init.signal.addEventListener("abort", () => {
					clearTimeout(timer);
					reject(new DOMException("Aborted", "AbortError"));
				});
			}
		});
	};
}

/**
 * Load a test fixture
 * @param fixtureName The name of the fixture to load
 * @returns The loaded test fixture
 */
export async function loadTestFixture(
	fixtureName: string,
): Promise<TestFixture> {
	const fixturesDir = "./tests/fixtures";
	const fullPath = path.join(fixturesDir, fixtureName);

	// Use static path resolution
	try {
		const fixture = {
			name: fixtureName,
			path: fullPath,
		};
		assert(await Deno.stat(fullPath), "Fixture must exist");
		return fixture;
	} catch (error: unknown) {
		const e = error as Error;
		throw new Error(
			`Failed to load test fixture ${fixtureName}: ${e.message}`,
		);
	}
}
