// tests/build_command.test.ts
import { assertEquals, assertRejects } from "@std/assert";
import { createBuildCommand } from "../src/commands/build.ts";
import { createTestCLI } from "./test_utils.ts";
import type { BuildOptions, Plugin } from "../src/plugins/plugin.ts";
import { createTempDir } from "./utils/test_helpers.ts";

// Mock Process class with correct interface implementation
class MockProcess implements Deno.ChildProcess {
	readonly pid = 1234;
	private _killed = false;

	#stdin = new WritableStream<Uint8Array>();
	#stdout = new ReadableStream<Uint8Array>();
	#stderr = new ReadableStream<Uint8Array>();
	#status = Promise.resolve({ success: true, code: 0, signal: null });

	get stdin(): WritableStream<Uint8Array> {
		return this.#stdin;
	}

	get stdout(): ReadableStream<Uint8Array> {
		return this.#stdout;
	}

	get stderr(): ReadableStream<Uint8Array> {
		return this.#stderr;
	}

	get status(): Promise<Deno.CommandStatus> {
		if (this._killed) {
			return Promise.resolve({ success: false, code: 1, signal: "SIGTERM" });
		}
		return this.#status;
	}

	async output(): Promise<Deno.CommandOutput> {
		const status = await this.status;
		return {
			...status,
			stdout: new Uint8Array(),
			stderr: new Uint8Array(),
		};
	}

	async stderrOutput(): Promise<Uint8Array> {
		return new Uint8Array();
	}

	ref(): void {}
	unref(): void {}

	kill(signo?: Deno.Signal | number): void {
		this._killed = true;
		if (typeof signo === "string" && !["SIGTERM", "SIGKILL"].includes(signo)) {
			throw new Error(`Unsupported signal: ${signo}`);
		}
		this.#stdout.cancel();
		this.#stderr.cancel();
		const writer = this.#stdin.getWriter();
		writer.close();
	}

	async [Symbol.asyncDispose](): Promise<void> {
		if (!this._killed) {
			this.kill("SIGTERM");
		}
	}
}

// Mock Command class with improved tracking
class MockCommand {
	static lastArgs: string[] = [];

	constructor(cmd: string | URL, options?: Deno.CommandOptions) {
		MockCommand.lastArgs = [cmd.toString(), ...(options?.args ?? [])];
	}

	spawn(): Deno.ChildProcess {
		return new MockProcess();
	}

	static reset(): void {
		this.lastArgs = [];
	}
}

// Each test has its own permissions and is split into a separate Deno.test
Deno.test({
	name: "Basic build command execution",
	permissions: {
		read: true,
		write: true,
		env: true,
	},
	async fn() {
		const { cli } = await createTestCLI();
		const buildCommand = createBuildCommand(cli);

		const originalCommand = Deno.Command;
		try {
			// @ts-ignore: Mock implementation
			Deno.Command = MockCommand;
			MockCommand.reset();

			// Create temporary test file
			const tmpDir = await createTempDir();
			const testFile = `${tmpDir}/test.ts`;
			await Deno.writeTextFile(testFile, "console.log('test');");

			cli.register(buildCommand);
			await cli.runCommand([
				"build",
				"--output",
				"test-bin",
				"--target",
				"linux",
				"--entry",
				testFile,
			]);

			// Verify command
			assertEquals(MockCommand.lastArgs[0], "deno");
			assertEquals(MockCommand.lastArgs[1], "compile");
			assertEquals(
				MockCommand.lastArgs.includes("--output=test-bin"),
				true,
			);

			// Cleanup
			await Deno.remove(tmpDir, { recursive: true });
		} finally {
			// @ts-ignore: Restoration
			Deno.Command = originalCommand;
		}
	},
});

Deno.test({
	name: "Plugin hooks execution",
	permissions: {
		read: true,
		write: true,
		env: true,
	},
	async fn() {
		const { cli } = await createTestCLI();
		const hooksCalled = {
			before: false,
			after: false,
			afterWithSuccess: false,
		};

		const mockPlugin: Plugin = {
			metadata: {
				name: "test",
				version: "1.0.0",
			},
			init: () => {},
			beforeBuild: async (_options: BuildOptions) => {
				hooksCalled.before = true;
				return Promise.resolve();
			},
			afterBuild: async (_options: BuildOptions, success: boolean) => {
				hooksCalled.after = true;
				hooksCalled.afterWithSuccess = success;
				return Promise.resolve();
			},
		};

		const originalCommand = Deno.Command;
		const originalGetPlugins = cli.getLoadedPlugins;

		try {
			// @ts-ignore: Mock implementation
			Deno.Command = MockCommand;
			cli.getLoadedPlugins = () => [mockPlugin];

			// Create test file
			const tmpDir = await Deno.makeTempDir();
			const testFile = `${tmpDir}/test.ts`;
			await Deno.writeTextFile(testFile, "console.log('test');");

			// Execute build
			const buildCommand = createBuildCommand(cli);
			cli.register(buildCommand);
			await cli.runCommand([
				"build",
				"--output",
				"test-bin",
				"--target",
				"linux",
				"--entry",
				testFile,
			]);

			// Verify hooks
			assertEquals(
				hooksCalled.before,
				true,
				"beforeBuild hook should be called",
			);
			assertEquals(hooksCalled.after, true, "afterBuild hook should be called");
			assertEquals(
				hooksCalled.afterWithSuccess,
				true,
				"afterBuild should indicate success",
			);

			// Cleanup
			await Deno.remove(tmpDir, { recursive: true });
		} finally {
			// @ts-ignore: Restoration
			Deno.Command = originalCommand;
			cli.getLoadedPlugins = originalGetPlugins;
		}
	},
});

Deno.test({
	name: "Plugin build cancellation",
	permissions: {
		read: true,
		write: true,
		env: true,
	},
	async fn() {
		const { cli } = await createTestCLI();
		let buildAttempted = false;

		const mockPlugin: Plugin = {
			metadata: {
				name: "test",
				version: "1.0.0",
			},
			init: () => {},
			beforeBuild: async (_options: BuildOptions) => {
				buildAttempted = true;
				throw new Error("Build cancelled by plugin");
			},
			afterBuild: () => {
				throw new Error(
					"afterBuild should not be called when build is cancelled",
				);
			},
		};

		const originalCommand = Deno.Command;
		const originalGetPlugins = cli.getLoadedPlugins;

		try {
			// @ts-ignore: Mock implementation
			Deno.Command = MockCommand;
			cli.getLoadedPlugins = () => [mockPlugin];

			// Setup test file
			const tmpDir = await Deno.makeTempDir();
			const testFile = `${tmpDir}/test.ts`;
			await Deno.writeTextFile(testFile, "console.log('test');");

			const buildCommand = createBuildCommand(cli);
			cli.register(buildCommand);

			// Verify build cancellation
			await assertRejects(
				() =>
					cli.runCommand([
						"build",
						"--output",
						"test-bin",
						"--target",
						"linux",
						"--entry",
						testFile,
					]),
				Error,
				"Build cancelled by plugin",
			);

			assertEquals(
				buildAttempted,
				true,
				"Plugin should attempt to cancel build",
			);

			// Cleanup
			await Deno.remove(tmpDir, { recursive: true });
		} finally {
			// @ts-ignore: Restoration
			Deno.Command = originalCommand;
			cli.getLoadedPlugins = originalGetPlugins;
		}
	},
});
