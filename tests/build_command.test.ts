// tests/build_command.test.ts
import {assertEquals,assertRejects} from "@std/assert";
import {createBuildCommand} from "../src/commands/build.ts";
import {createTestCLI} from "./test_utils.ts";
import type {Plugin,BuildOptions} from "../src/plugin.ts";

// Mock Process class with proper interface implementation and error handling
class MockProcess implements Deno.ChildProcess {
	readonly pid=1234;
	private _killed=false;

	#stdin=new WritableStream<Uint8Array>();
	#stdout=new ReadableStream<Uint8Array>();
	#stderr=new ReadableStream<Uint8Array>();
	#status=Promise.resolve({success: true,code: 0,signal: null});

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
		if(this._killed) {
			return Promise.resolve({success: false,code: 1,signal: "SIGTERM"});
		}
		return this.#status;
	}

	async output(): Promise<Deno.CommandOutput> {
		const status=await this.status;
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

	kill(signo?: Deno.Signal): void {
		this._killed=true;
		if(signo&&!["SIGTERM","SIGKILL"].includes(signo)) {
			throw new Error(`Unsupported signal: ${signo}`);
		}

		// Cleanup streams
		this.#stdout.cancel();
		this.#stderr.cancel();
		const writer=this.#stdin.getWriter();
		writer.close();
	}

	async [Symbol.asyncDispose](): Promise<void> {
		if(!this._killed) {
			this.kill("SIGTERM");
		}
	}
}

// Mock Command class with improved argument tracking
class MockCommand implements Deno.Command {
	static #lastArgs: string[]=[];
	static #lastOptions: Deno.CommandOptions|undefined;

	constructor(cmd: string|URL,options?: Deno.CommandOptions) {
		MockCommand.#lastArgs=[cmd.toString(),...(options?.args??[])];
		MockCommand.#lastOptions=options;
	}

	spawn(): Deno.ChildProcess {
		return new MockProcess();
	}

	async output(): Promise<Deno.CommandOutput> {
		const process=this.spawn();
		return process.output();
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
		return this.#lastArgs;
	}

	static getLastOptions(): Deno.CommandOptions|undefined {
		return this.#lastOptions;
	}

	static reset(): void {
		this.#lastArgs=[];
		this.#lastOptions=undefined;
	}
}

// Test permissions configuration
const TEST_PERMISSIONS: Deno.PermissionOptions={
	env: true,
	read: true,
	write: true,
	run: true,
	net: false
};

// Helper function for temporary directory creation and cleanup
async function withTempDir<T>(
	fn: (dir: string) => Promise<T>
): Promise<T> {
	const tempDir=await Deno.makeTempDir({prefix: "build_test_"});
	try {
		return await fn(tempDir);
	} finally {
		try {
			await Deno.remove(tempDir,{recursive: true});
		} catch(error) {
			console.warn(`Failed to cleanup temp directory ${tempDir}:`,error);
		}
	}
}

// Main test suite
Deno.test({
	name: "Build Command Test Suite",
	permissions: TEST_PERMISSIONS,
	async fn(t) {
		// Basic build test
		await t.step("executes basic build command correctly",async () => {
			await withTempDir(async (tempDir) => {
				const {cli}=await createTestCLI();
				const buildCommand=createBuildCommand(cli);
				const testFilePath=`${tempDir}/test.ts`;

				const originalCommand=Deno.Command;
				try {
					await Deno.writeTextFile(testFilePath,"console.log('test');");

					// @ts-ignore: Mock implementation
					Deno.Command=MockCommand;
					MockCommand.reset();

					cli.register(buildCommand);
					await cli.runCommand([
						"build",
						"--output","test-bin",
						"--target","linux",
						"--entry",testFilePath,
					]);

					const lastArgs=MockCommand.getLastArgs();
					assertEquals(lastArgs[0],"deno");
					assertEquals(lastArgs[1],"compile");
					assertEquals(lastArgs.includes("--output=test-bin"),true);
					assertEquals(lastArgs.includes(testFilePath),true);
				} finally {
					// @ts-ignore: Restoration
					Deno.Command=originalCommand;
				}
			});
		});

		// Plugin hooks test
		await t.step("handles plugin hooks correctly",async () => {
			await withTempDir(async (tempDir) => {
				const {cli}=await createTestCLI();
				const hooksCalled={
					before: false,
					after: false,
					afterWithSuccess: false,
				};

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
					const testFilePath=`${tempDir}/test.ts`;
					await Deno.writeTextFile(testFilePath,"console.log('test');");

					// @ts-ignore: Mock implementation
					Deno.Command=MockCommand;
					cli.getLoadedPlugins=() => [mockPlugin];
					MockCommand.reset();

					const buildCommand=createBuildCommand(cli);
					cli.register(buildCommand);

					await cli.runCommand([
						"build",
						"--output","test-bin",
						"--target","linux",
						"--entry",testFilePath,
					]);

					assertEquals(hooksCalled.before,true,"beforeBuild hook should be called");
					assertEquals(hooksCalled.after,true,"afterBuild hook should be called");
					assertEquals(hooksCalled.afterWithSuccess,true,"afterBuild should indicate success");
				} finally {
					// @ts-ignore: Restoration
					Deno.Command=originalCommand;
					cli.getLoadedPlugins=originalGetPlugins;
				}
			});
		});

		// Plugin cancellation test
		await t.step("handles plugin cancellation",async () => {
			await withTempDir(async (tempDir) => {
				const {cli}=await createTestCLI();
				let buildAttempted=false;

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
					const testFilePath=`${tempDir}/test.ts`;
					await Deno.writeTextFile(testFilePath,"console.log('test');");

					// @ts-ignore: Mock implementation
					Deno.Command=MockCommand;
					cli.getLoadedPlugins=() => [mockPlugin];
					MockCommand.reset();

					const buildCommand=createBuildCommand(cli);
					cli.register(buildCommand);

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
				} finally {
					// @ts-ignore: Restoration
					Deno.Command=originalCommand;
					cli.getLoadedPlugins=originalGetPlugins;
				}
			});
		});
	}
});