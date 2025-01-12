// tests/build_command.test.ts

import {
	assertEquals,
	assertExists,
	assertRejects,
} from "https://deno.land/std@0.203.0/testing/asserts.ts";
import {CLI} from "../src/core.ts";
import {createBuildCommand} from "../src/commands/build.ts";
import type {Plugin,BuildOptions} from "../src/plugin.ts";

/**
 * Mock Logger to intercept log messages during tests.
 */
class MockLogger {
	logs: string[]=[];
	errors: string[]=[];
	debugs: string[]=[];
	warns: string[]=[];

	info(message: string) {
		this.logs.push(message);
	}

	error(message: string) {
		this.errors.push(message);
	}

	debug(message: string) {
		this.debugs.push(message);
	}

	warn(message: string) {
		this.warns.push(message);
	}
}

/**
 * Helper function to create a fresh test CLI instance with a mock logger.
 */
const createTestCLI=(): CLI => {
	const mockLogger=new MockLogger();
	const cli=new CLI(undefined,true,true,mockLogger);
	return cli;
};

/**
 * Deno.test for Build command - constructs correct compile command
 */
Deno.test({
	name: "Build command constructs correct compile command",
	permissions: {
		run: true,
		env: true,
		read: true,
		write: true,
	},
	async fn() {
		const cli=new CLI();
		let capturedArgs: string[]|null=null;

		const originalCommand=Deno.Command;
		const originalExit=Deno.exit;

		try {
			class MockCommand implements Deno.Command {
				#cmd: string;
				#options: Deno.CommandOptions;

				constructor(cmd: string|URL,options?: Deno.CommandOptions) {
					this.#cmd=cmd.toString();
					this.#options=options??{args: []};
					capturedArgs=[this.#cmd,...(this.#options.args??[])];
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

				spawn(): Deno.ChildProcess {
					return {
						pid: 1234,
						stdin: new WritableStream<Uint8Array>(),
						stdout: new ReadableStream<Uint8Array>(),
						stderr: new ReadableStream<Uint8Array>(),
						status: Promise.resolve({success: true,code: 0,signal: null}),
						output: () => this.output(),
						ref() {},
						unref() {},
						kill(_signal?: Deno.Signal) {},
						async [Symbol.asyncDispose]() {},
					};
				}
			}

			(Deno as unknown as {Command: typeof Deno.Command}).Command=MockCommand;

			Deno.exit=() => {
				throw new Error("Build failed");
			};

			// Use a temporary directory instead of 'src'
			const tempDir=await Deno.makeTempDir({prefix: "build_test_"});
			const testFilePath=`${tempDir}/test.ts`;

			// Ensure the temporary directory exists before writing the file
			await Deno.mkdir(tempDir,{recursive: true});
			await Deno.writeTextFile(testFilePath,"console.log('test');");

			const buildCommand=createBuildCommand(cli);
			cli.register(buildCommand);
			await cli.runCommand([
				"build",
				"--output",
				"test-bin",
				"--target",
				"linux",
				"--entry",
				testFilePath,
			]);

			assertExists(capturedArgs);
			assertEquals(capturedArgs![0],"deno");
			assertEquals(capturedArgs![1],"compile");
			// Additional assertions can be added here to check the rest of the command args

			// Clean up the temporary directory
			await Deno.remove(tempDir,{recursive: true});
		} finally {
			(Deno as unknown as {Command: typeof Deno.Command}).Command=originalCommand;
			Deno.exit=originalExit;
			// No need to remove 'src' as we used a temporary directory
		}
	},
});

/**
 * Deno.test for Build command - handles plugin hooks correctly
 */
Deno.test({
	name: "Build command handles plugin hooks correctly",
	permissions: {
		run: true,
		env: true,
		read: true,
		write: true,
	},
	async fn() {
		const cli=createTestCLI();
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
			beforeBuild: async (_options: BuildOptions): Promise<void> => {
				hooksCalled.before=true;
				return;
			},
			afterBuild: async (_options: BuildOptions,success: boolean): Promise<void> => {
				hooksCalled.after=true;
				hooksCalled.afterWithSuccess=success;
			},
		};

		// Mock Command implementation
		const originalCommand=Deno.Command;
		const originalGetPlugins=cli.getLoadedPlugins.bind(cli) as typeof cli.getLoadedPlugins;
		class MockCommand implements Deno.Command {
			constructor(_cmd: string|URL,_options?: Deno.CommandOptions) {}

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

			spawn(): Deno.ChildProcess {
				return {
					pid: 1234,
					stdin: new WritableStream<Uint8Array>(),
					stdout: new ReadableStream<Uint8Array>(),
					stderr: new ReadableStream<Uint8Array>(),
					status: Promise.resolve({success: true,code: 0,signal: null}),
					output: () => this.output(),
					ref() {},
					unref() {},
					kill(_signal?: Deno.Signal) {},
					async [Symbol.asyncDispose]() {},
				};
			}
		}

		(Deno as unknown as {Command: typeof Deno.Command}).Command=MockCommand;

		try {
			// Mock plugin loader using the public method with proper typing
			cli.getLoadedPlugins=() => [mockPlugin];

			const buildCommand=createBuildCommand(cli);
			cli.register(buildCommand);

			// Use a temporary directory instead of 'src'
			const tempDir=await Deno.makeTempDir({prefix: "build_test_plugin_"});
			const testFilePath=`${tempDir}/test.ts`;

			// Ensure the temporary directory exists before writing the file
			await Deno.mkdir(tempDir,{recursive: true});
			await Deno.writeTextFile(testFilePath,"console.log('test');");

			await cli.runCommand([
				"build",
				"--output",
				"test-bin",
				"--target",
				"linux",
				"--entry",
				testFilePath,
			]);

			assertEquals(hooksCalled.before,true,"beforeBuild hook should be called");
			assertEquals(hooksCalled.after,true,"afterBuild hook should be called");
			assertEquals(hooksCalled.afterWithSuccess,true,"afterBuild should be called with success=true");

			// Clean up the temporary directory
			await Deno.remove(tempDir,{recursive: true});
		} finally {
			// Restore original methods
			cli.getLoadedPlugins=originalGetPlugins;
			(Deno as unknown as {Command: typeof Deno.Command}).Command=originalCommand;
			// No need to remove 'src' as we used a temporary directory
		}
	},
});

/**
 * Deno.test for Build command - handles plugin cancellation
 */
Deno.test({
	name: "Build command handles plugin cancellation",
	permissions: {
		run: true,
		env: true,
		read: true,
		write: true,
	},
	async fn() {
		const cli=createTestCLI();
		let buildAttempted=false;

		const mockPlugin: Plugin={
			metadata: {
				name: "test",
				version: "1.0.0",
			},
			init: () => {},
			beforeBuild: async (_options: BuildOptions): Promise<void> => {
				buildAttempted=true;
				throw new Error("Build cancelled by plugin");
			},
			afterBuild: async () => {
				throw new Error("afterBuild should not be called when build is cancelled");
			},
		};

		// Mock Command implementation
		const originalCommand=Deno.Command;
		const originalGetPlugins=cli.getLoadedPlugins.bind(cli) as typeof cli.getLoadedPlugins;
		class MockCommand implements Deno.Command {
			constructor(_cmd: string|URL,_options?: Deno.CommandOptions) {
				buildAttempted=true;
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

			spawn(): Deno.ChildProcess {
				return {
					pid: 1234,
					stdin: new WritableStream<Uint8Array>(),
					stdout: new ReadableStream<Uint8Array>(),
					stderr: new ReadableStream<Uint8Array>(),
					status: Promise.resolve({success: true,code: 0,signal: null}),
					output: () => this.output(),
					ref() {},
					unref() {},
					kill(_signal?: Deno.Signal) {},
					async [Symbol.asyncDispose]() {},
				};
			}
		}

		(Deno as unknown as {Command: typeof Deno.Command}).Command=MockCommand;

		try {
			// Mock plugin loader using the public method with proper typing
			cli.getLoadedPlugins=() => [mockPlugin];

			const buildCommand=createBuildCommand(cli);
			cli.register(buildCommand);

			// Use a temporary directory instead of 'src'
			const tempDir=await Deno.makeTempDir({prefix: "build_test_cancel_"});
			const testFilePath=`${tempDir}/test.ts`;

			// Ensure the temporary directory exists before writing the file
			await Deno.mkdir(tempDir,{recursive: true});
			await Deno.writeTextFile(testFilePath,"console.log('test');");

			await assertRejects(
				async () => {
					await cli.runCommand([
						"build",
						"--output",
						"test-bin",
						"--target",
						"linux",
						"--entry",
						testFilePath,
					]);
				},
				Error,
				"Build cancelled by plugin",
				"Build should be cancelled by plugin"
			);

			assertEquals(buildAttempted,true,"Build should have been attempted and then cancelled by plugin");

			// Clean up the temporary directory
			await Deno.remove(tempDir,{recursive: true});
		} finally {
			// Restore original methods
			cli.getLoadedPlugins=originalGetPlugins;
			(Deno as unknown as {Command: typeof Deno.Command}).Command=originalCommand;
			// No need to remove 'src' as we used a temporary directory
		}
	},
});
