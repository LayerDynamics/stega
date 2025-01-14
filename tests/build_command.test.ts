// tests/build_command.test.ts
import {assertEquals,assertRejects} from "https://deno.land/std@0.224.0/testing/asserts.ts";
import {createBuildCommand} from "../src/commands/build.ts";
import {createTestCLI} from "./test_utils.ts";
import type {Plugin,BuildOptions} from "../src/plugin.ts";

// Mock Process class for testing
class MockProcess implements Deno.ChildProcess {
	pid=1234;
	stdin: WritableStream<Uint8Array>;
	stdout: ReadableStream<Uint8Array>;
	stderr: ReadableStream<Uint8Array>;
	status: Promise<Deno.CommandStatus>;

	constructor() {
		this.stdin=new WritableStream();
		this.stdout=new ReadableStream();
		this.stderr=new ReadableStream();
		this.status=Promise.resolve({success: true,code: 0,signal: null});
	}

	output(): Promise<Deno.CommandOutput> {
		return Promise.resolve({
			code: 0,
			success: true,
			stdout: new Uint8Array(),
			stderr: new Uint8Array(),
			signal: null,
		});
	}

	async stderrOutput(): Promise<Uint8Array> {
		return new Uint8Array();
	}

	ref(): void {
		// Implementation
	}

	unref(): void {
		// Implementation
	}

	kill(signo?: Deno.Signal): void {
		if(this.stdout instanceof ReadableStream) {
			const reader=this.stdout.getReader();
			reader.cancel();
		}
		if(this.stderr instanceof ReadableStream) {
			const reader=this.stderr.getReader();
			reader.cancel();
		}
	}

	async [Symbol.asyncDispose](): Promise<void> {
		this.kill();
	}
}

// Mock Command class for testing
class MockCommand implements Deno.Command {
	private static lastArgs: string[]=[];

	constructor(cmd: string|URL,options?: Deno.CommandOptions) {
		MockCommand.lastArgs=[cmd.toString(),...(options?.args??[])];
	}

	spawn(): Deno.ChildProcess {
		return new MockProcess();
	}

	output(): Promise<Deno.CommandOutput> {
		return Promise.resolve({
			code: 0,
			success: true,
			stdout: new Uint8Array(),
			stderr: new Uint8Array(),
			signal: null,
		});
	}

	outputSync(): Deno.CommandOutput {
		return {
			code: 0,
			success: true,
			stdout: new Uint8Array(),
			stderr: new Uint8Array(),
			signal: null,
		};
	}

	static getLastArgs(): string[] {
		return this.lastArgs;
	}
}

// Consolidate test permissions into a constant
const BUILD_TEST_PERMISSIONS: Deno.PermissionOptions = {
	env: true,
	read: true,
	write: true,
	run: true,
	net: false // Explicitly deny network access
};

// Update basic build test with permissions
Deno.test({
	name: "Build Command",
	permissions: BUILD_TEST_PERMISSIONS,
	async fn(t) {
		await t.step("basic build",async () => {
			const {cli}=await createTestCLI();
			const buildCommand=createBuildCommand(cli);

			const originalCommand=Deno.Command;
			try {
				// @ts-ignore: Mock implementation
				Deno.Command=MockCommand;

				// Create temporary test environment
				const tempDir=await Deno.makeTempDir({prefix: "build_test_"});
				const testFilePath=`${tempDir}/test.ts`;
				await Deno.writeTextFile(testFilePath,"console.log('test');");

				// Register and run build command
				cli.register(buildCommand);
				await cli.runCommand([
					"build",
					"--output","test-bin",
					"--target","linux",
					"--entry",testFilePath,
				]);

				// Verify command construction
				const lastArgs=MockCommand.getLastArgs();
				assertEquals(lastArgs[0],"deno","First argument should be deno");
				assertEquals(lastArgs[1],"compile","Second argument should be compile");
				assertEquals(
					lastArgs.includes("--output=test-bin"),
					true,
					"Should include output path"
				);
				assertEquals(
					lastArgs.includes(testFilePath),
					true,
					"Should include entry file"
				);

				// Cleanup
				await Deno.remove(tempDir,{recursive: true});
			} finally {
				// Restore original Deno.Command
				// @ts-ignore: Restoration
				Deno.Command=originalCommand;
			}
		});
	}
});

// Update plugin hooks test with permissions
Deno.test({
	name: "Build command handles plugin hooks correctly",
	permissions: BUILD_TEST_PERMISSIONS,
	async fn() {
		const {cli}=await createTestCLI();
		const hooksCalled={
			before: false,
			after: false,
			afterWithSuccess: false,
		};

		// Create mock plugin
		const mockPlugin: Plugin={
			metadata: {
				name: "test",
				version: "1.0.0",
			},
			init: () => {},
			beforeBuild: async (_options: BuildOptions) => {
				hooksCalled.before=true;
				return Promise.resolve();
			},
			afterBuild: async (_options: BuildOptions,success: boolean) => {
				hooksCalled.after=true;
				hooksCalled.afterWithSuccess=success;
				return Promise.resolve();
			},
		};

		const originalCommand=Deno.Command;
		const originalGetPlugins=cli.getLoadedPlugins;
		try {
			// @ts-ignore: Mock implementation
			Deno.Command=MockCommand;
			cli.getLoadedPlugins=() => [mockPlugin];

			// Create temporary test environment
			const tempDir=await Deno.makeTempDir({prefix: "build_test_"});
			const testFilePath=`${tempDir}/test.ts`;
			await Deno.writeTextFile(testFilePath,"console.log('test');");

			// Register and run build command
			const buildCommand=createBuildCommand(cli);
			cli.register(buildCommand);
			await cli.runCommand([
				"build",
				"--output","test-bin",
				"--target","linux",
				"--entry",testFilePath,
			]);

			// Verify plugin hooks were called
			assertEquals(hooksCalled.before,true,"beforeBuild hook should be called");
			assertEquals(hooksCalled.after,true,"afterBuild hook should be called");
			assertEquals(hooksCalled.afterWithSuccess,true,"afterBuild should indicate success");

			// Cleanup
			await Deno.remove(tempDir,{recursive: true});
		} finally {
			// Restore original implementations
			// @ts-ignore: Restoration
			Deno.Command=originalCommand;
			cli.getLoadedPlugins=originalGetPlugins;
		}
	},
});

// Update plugin cancellation test with permissions
Deno.test({
	name: "Build command handles plugin cancellation",
	permissions: BUILD_TEST_PERMISSIONS,
	async fn() {
		const {cli}=await createTestCLI();
		let buildAttempted=false;

		// Create mock plugin that cancels the build
		const mockPlugin: Plugin={
			metadata: {
				name: "test",
				version: "1.0.0",
			},
			init: () => {},
			beforeBuild: async (_options: BuildOptions) => {
				buildAttempted=true;
				throw new Error("Build cancelled by plugin");
			},
			afterBuild: () => {
				throw new Error("afterBuild should not be called when build is cancelled");
			},
		};

		const originalCommand=Deno.Command;
		const originalGetPlugins=cli.getLoadedPlugins;
		try {
			// @ts-ignore: Mock implementation
			Deno.Command=MockCommand;
			cli.getLoadedPlugins=() => [mockPlugin];

			// Create temporary test environment
			const tempDir=await Deno.makeTempDir({prefix: "build_test_"});
			const testFilePath=`${tempDir}/test.ts`;
			await Deno.writeTextFile(testFilePath,"console.log('test');");

			// Register build command
			const buildCommand=createBuildCommand(cli);
			cli.register(buildCommand);

			// Attempt to run build command - should be cancelled by plugin
			await assertRejects(
				() => cli.runCommand([
					"build",
					"--output","test-bin",
					"--target","linux",
					"--entry",testFilePath,
				]),
				Error,
				"Build cancelled by plugin"
			);

			assertEquals(buildAttempted,true,"Plugin should attempt to cancel build");

			// Cleanup
			await Deno.remove(tempDir,{recursive: true});
		} finally {
			// Restore original implementations
			// @ts-ignore: Restoration
			Deno.Command=originalCommand;
			cli.getLoadedPlugins=originalGetPlugins;
		}
	},
});