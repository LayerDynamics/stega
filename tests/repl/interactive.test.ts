// tests/repl/interactive.test.ts

import {
	assertEquals,
	assertExists,
	assert,
} from "@std/assert";
import {
	InteractiveREPL,
	createREPL,
} from "../../src/repl/interactive.ts";
import {CLI} from "../../src/core/core.ts";
import {
	HistoryStatistics,
	createCommandHistory,
} from "../../src/repl/history.ts";
import {
	createMockInput,
	createMockOutput,
	MockStreamReader,
	MockStreamWriter,
} from "../utils/mock_io.ts";

/**
 * Refactored runREPLTest to inject all commands via mockInput and enqueue Ctrl+D
 * @param repl The InteractiveREPL instance to test.
 * @param inputs An array of strings representing the injected commands.
 * @param mockInput The mock input stream.
 * @param mockOutput The mock output stream.
 * @param assertions Optional callback to perform assertions after REPL processing.
 * @param timeout Optional timeout in milliseconds.
 */
async function runREPLTest(
	repl: InteractiveREPL,
	inputs: string[],
	mockInput: MockStreamReader,
	mockOutput: MockStreamWriter,
	assertions?: () => void|Promise<void>,
	timeout=4000 // Optional: Increase if necessary
): Promise<void> {
	try {
		mockInput.setLines(inputs); // Inject commands

		const startPromise=repl.start();

		// Allow some time for the REPL to process the inputs
		await new Promise(resolve => setTimeout(resolve,1000)); // Increased delay

		// Terminate the REPL by injecting Ctrl+D
		mockInput.enqueueChar("\x04");

		// Await the startPromise to ensure 'start()' finishes
		await startPromise;

		if(assertions) {
			await assertions();
		}
	} catch(error) {
		throw error;
	} finally {
		mockOutput.clear();
	}
}

/**
 * Helper function to create and initialize a temporary history file.
 * @returns A Promise that resolves to the path of the temporary history file.
 */
async function createTempHistoryFile(): Promise<string> {
	const tempHistoryFile=await Deno.makeTempFile({
		suffix: ".json",
	});
	await Deno.writeTextFile(tempHistoryFile,"[]"); // Initialize with empty array
	return tempHistoryFile;
}

/**
 * Test: Basic Command Execution
 * Verifies that a simple command is executed and recorded correctly in history.
 */
Deno.test(
	"InteractiveREPL - basic command execution",
	async () => {
		// Initialize mockInput and mockOutput
		const mockInput=createMockInput([]);
		const mockOutput=createMockOutput();
		const cli=new CLI();
		let commandExecuted=false;

		// Create a temporary history file
		const tempHistoryFile=await createTempHistoryFile();

		// Instantiate InteractiveREPL with a custom 'test' command
		const repl=new InteractiveREPL(cli,{
			prompt: "> ",
			stdin: mockInput,
			stdout: mockOutput,
			historyFile: tempHistoryFile,
			commands: {
				test: {
					description: "Test command",
					usage: "test",
					examples: ["test"],
					action: () => {
						commandExecuted=true;
						return Promise.resolve();
					},
				},
			},
		});

		try {
			await runREPLTest(
				repl,
				["test\n"],
				mockInput,
				mockOutput,
				async () => {
					const statistics=repl.getStatistics();
					assertEquals(statistics.totalCommands,1);
					assertEquals(statistics.uniqueCommands,1);
					assertEquals(statistics.successRate,100);
					assert(
						statistics.averageDuration>=0
					); // Ensure duration is non-negative
					assertEquals(
						statistics.mostUsedCommands[0].command,
						"test"
					);
					assertEquals(
						statistics.mostUsedCommands[0].count,
						1
					);
					assert(
						mockOutput.output.some(out =>
							out.includes(">")
						)
					);
					assert(
						commandExecuted
					); // Ensure the command was executed
				},
				2000 // Optional: Increase timeout if needed
			);
		} catch(error) {
			console.error("Test failed:",error);
			throw error;
		} finally {
			await repl.close();
			await Deno.remove(tempHistoryFile);
		}
	}
);

/**
 * Test: Command History Navigation
 * Verifies that executed commands are correctly recorded and can be navigated.
 */
Deno.test(
	"InteractiveREPL - command history navigation",
	async () => {
		// Initialize mockInput and mockOutput
		const mockInput=createMockInput([]);
		const mockOutput=createMockOutput();
		const cli=new CLI();
		const tempHistoryFile=await createTempHistoryFile();

		// Instantiate InteractiveREPL with 'first' and 'second' commands
		const repl=new InteractiveREPL(cli,{
			stdin: mockInput,
			stdout: mockOutput,
			historyFile: tempHistoryFile,
			commands: {
				first: {
					description: "First command",
					usage: "first",
					examples: ["first"],
					action: () => Promise.resolve(),
				},
				second: {
					description: "Second command",
					usage: "second",
					examples: ["second"],
					action: () => Promise.resolve(),
				},
			},
		});

		await runREPLTest(
			repl,
			["first\n","second\n","history\n"], // Injected commands
			mockInput,
			mockOutput,
			async () => {
				const statistics=repl.getStatistics();
				assertEquals(statistics.totalCommands,2); // Only 'first' and 'second' are recorded
				assertEquals(statistics.uniqueCommands,2);
				assertEquals(statistics.successRate,100);
				assert(
					statistics.averageDuration>=0
				);
				assertEquals(
					statistics.mostUsedCommands.find(
						(cmd) => cmd.command==="first"
					)?.count,
					1
				);
				assertEquals(
					statistics.mostUsedCommands.find(
						(cmd) => cmd.command==="second"
					)?.count,
					1
				);
				// Verify history output contains 'first', 'second', and 'history'
				assert(
					mockOutput.output.some(out =>
						out.includes("first")
					)
				);
				assert(
					mockOutput.output.some(out =>
						out.includes("second")
					)
				);
				assert(
					mockOutput.output.some(out =>
						out.includes("history")
					)
				);
			},
			3000 // Increased timeout to allow all commands to be processed
		);
	}
);

/**
 * Test: Multiline Input
 * Verifies that multiline commands are handled and recorded correctly.
 */
Deno.test(
	"InteractiveREPL - multiline input",
	async () => {
		// Initialize mockInput and mockOutput
		const mockInput=createMockInput([]);
		const mockOutput=createMockOutput();
		const cli=new CLI();
		let multilineCommandExecuted=false;

		const tempHistoryFile=await createTempHistoryFile();

		// Instantiate InteractiveREPL with a custom 'multiline' command
		const repl=new InteractiveREPL(cli,{
			multiline: true,
			stdin: mockInput,
			stdout: mockOutput,
			historyFile: tempHistoryFile,
			commands: {
				multiline: {
					description: "Multiline test command",
					usage: "multiline",
					examples: ["multiline"],
					action: () => {
						multilineCommandExecuted=true;
						return Promise.resolve();
					},
				},
			},
		});

		await runREPLTest(
			repl,
			["multiline\n","line1\n","line2\n","\n"], // Injected commands
			mockInput,
			mockOutput,
			async () => {
				const statistics=repl.getStatistics();
				assertEquals(statistics.totalCommands,1); // Only 'multiline' is recorded
				assertEquals(statistics.uniqueCommands,1);
				assertEquals(statistics.successRate,100);
				assert(
					statistics.averageDuration>=0
				);
				assertEquals(
					statistics.mostUsedCommands[0].command,
					"multiline"
				);
				assertEquals(
					statistics.mostUsedCommands[0].count,
					1
				);
				// Verify that the multiline command was executed
				assert(
					multilineCommandExecuted
				);
			},
			3000 // Increased timeout
		);
	}
);

/**
 * Test: Tab Completion
 * Verifies that tab completion suggests and completes commands correctly.
 */
Deno.test(
	"InteractiveREPL - tab completion",
	async () => {
		// Initialize mockInput and mockOutput
		const mockInput=createMockInput([]);
		const mockOutput=createMockOutput();
		const cli=new CLI();
		cli.register({
			name: "test-command",
			description: "Test command with hyphen",
			action: () => Promise.resolve(),
		});

		const tempHistoryFile=await createTempHistoryFile();

		// Instantiate InteractiveREPL with a custom 'test-command'
		const repl=new InteractiveREPL(cli,{
			enableSuggestions: true,
			stdin: mockInput,
			stdout: mockOutput,
			historyFile: tempHistoryFile,
			commands: {
				"test-command": {
					description: "Test command with hyphen",
					usage: "test-command",
					examples: ["test-command"],
					action: () => Promise.resolve(),
				},
			},
		});

		await runREPLTest(
			repl,
			["test\t","\n"], // Injected commands (test + tab + enter)
			mockInput,
			mockOutput,
			async () => {
				const statistics=repl.getStatistics();
				assertEquals(statistics.totalCommands,1); // Only 'test-command' is recorded
				assertEquals(statistics.uniqueCommands,1);
				assertEquals(statistics.successRate,100);
				assert(
					statistics.averageDuration>=0
				);
				assertEquals(
					statistics.mostUsedCommands[0].command,
					"test-command"
				);
				assertEquals(
					statistics.mostUsedCommands[0].count,
					1
				);
				// Verify that 'test-command' was offered as a completion
				assert(
					mockOutput.output.some(out =>
						out.includes("test-command")
					)
				);
			},
			2000
		);
	}
);

/**
 * Test: Error Handling
 * Verifies that commands throwing errors are handled and recorded correctly.
 */
Deno.test(
	"InteractiveREPL - error handling",
	async () => {
		// Initialize mockInput and mockOutput
		const mockInput=createMockInput([]);
		const mockOutput=createMockOutput();
		const cli=new CLI();
		cli.register({
			name: "error",
			description: "Command that throws an error",
			action: () => {
				throw new Error("Test error");
			},
		});

		const tempHistoryFile=await createTempHistoryFile();

		// Instantiate InteractiveREPL with a custom 'error' command
		const repl=new InteractiveREPL(cli,{
			stdin: mockInput,
			stdout: mockOutput,
			historyFile: tempHistoryFile,
			commands: {
				error: {
					description: "Command that throws an error",
					usage: "error",
					examples: ["error"],
					action: () => {
						throw new Error("Test error");
					},
				},
			},
		});

		await runREPLTest(
			repl,
			["error\n"], // Injected command
			mockInput,
			mockOutput,
			async () => {
				const statistics=repl.getStatistics();
				assertEquals(statistics.totalCommands,1); // Only 'error' is recorded
				assertEquals(statistics.uniqueCommands,1);
				assertEquals(statistics.successRate,0);
				assert(
					statistics.averageDuration>=0
				);
				assertEquals(
					statistics.mostUsedCommands[0].command,
					"error"
				);
				assertEquals(
					statistics.mostUsedCommands[0].count,
					1
				);
				// Verify that the error message was displayed
				assert(
					mockOutput.output.some(out =>
						out.includes("Test error")
					)
				);
			},
			2000
		);
	}
);

/**
 * Test: Custom Commands
 * Verifies that custom commands are executed and recorded correctly.
 */
Deno.test(
	"InteractiveREPL - custom commands",
	async () => {
		// Initialize mockInput and mockOutput
		const mockInput=createMockInput([]);
		const mockOutput=createMockOutput();
		const cli=new CLI();
		let customCommandExecuted=false;

		const tempHistoryFile=await createTempHistoryFile();

		// Instantiate InteractiveREPL with a custom 'custom' command
		const repl=createREPL(cli,{
			commands: {
				custom: {
					description: "Custom test command",
					usage: "custom",
					examples: ["custom"],
					action: async () => {
						customCommandExecuted=true;
						// Encode string to Uint8Array before writing
						await repl.writeOutput("Custom command executed\n");
					},
				},
			},
			stdin: mockInput,
			stdout: mockOutput,
			historyFile: tempHistoryFile,
		});

		try {
			await runREPLTest(
				repl,
				["custom\n","help custom\n"], // Injected commands
				mockInput,
				mockOutput,
				async () => {
					const statistics=repl.getStatistics();
					assertEquals(statistics.totalCommands,1); // Only 'custom' is recorded
					assertEquals(statistics.uniqueCommands,1);
					assertEquals(statistics.successRate,100);
					assert(
						statistics.averageDuration>=0
					);
					assertEquals(
						statistics.mostUsedCommands.find(
							(cmd: {command: string}) =>
								cmd.command==="custom"
						)?.count,
						1
					);
					assert(
						customCommandExecuted
					);
					assert(
						mockOutput.output.some(out =>
							out.includes("Custom command executed")
						)
					);
				},
				3000 // Increased timeout
			);
		} finally {
			await repl.close();
			await Deno.remove(tempHistoryFile);
		}
	}
);

/**
 * Test: Built-in Help Command
 * Verifies that built-in help commands are handled correctly and not recorded in history.
 */
Deno.test(
	"InteractiveREPL - built-in help command",
	async () => {
		// Initialize mockInput and mockOutput
		const mockInput=createMockInput([]);
		const mockOutput=createMockOutput();
		const cli=new CLI();
		cli.register({
			name: "test",
			description: "Test command",
			action: () => Promise.resolve(),
		});

		const tempHistoryFile=await createTempHistoryFile();

		// Instantiate InteractiveREPL with a custom 'test' command
		const repl=new InteractiveREPL(cli,{
			stdin: mockInput,
			stdout: mockOutput,
			historyFile: tempHistoryFile,
			commands: {
				test: {
					description: "Test command",
					usage: "test",
					examples: ["test"],
					action: () => Promise.resolve(),
				},
			},
		});

		await runREPLTest(
			repl,
			["help\n","help test\n"], // Injected commands
			mockInput,
			mockOutput,
			async () => {
				const statistics=repl.getStatistics();
				assertEquals(statistics.totalCommands,0); // 'help' commands are built-in and not recorded
				assertEquals(statistics.uniqueCommands,0);
				assertEquals(statistics.successRate,0); // Changed from 100 to 0
				assert(
					statistics.averageDuration>=0
				);
				// Verify help output
				assert(
					mockOutput.output.some(out =>
						out.includes("Available Commands:")
					)
				);
				assert(
					mockOutput.output.some(out =>
						out.includes("Test command")
					)
				);
			},
			3000 // Increased timeout
		);
	}
);

/**
 * Test: History Command
 * Verifies that the 'history' command displays previously executed commands correctly.
 */
Deno.test(
	"InteractiveREPL - history command",
	async () => {
		// Initialize mockInput and mockOutput
		const mockInput=createMockInput([]);
		const mockOutput=createMockOutput();
		const cli=new CLI();
		const tempHistoryFile=await createTempHistoryFile();

		// Instantiate InteractiveREPL with 'command1' and 'command2'
		const repl=new InteractiveREPL(cli,{
			stdin: mockInput,
			stdout: mockOutput,
			historyFile: tempHistoryFile,
			commands: {
				command1: {
					description: "First command",
					usage: "command1",
					examples: ["command1"],
					action: () => Promise.resolve(),
				},
				command2: {
					description: "Second command",
					usage: "command2",
					examples: ["command2"],
					action: () => Promise.resolve(),
				},
			},
		});

		await runREPLTest(
			repl,
			["command1\n","command2\n","history\n"], // Injected commands
			mockInput,
			mockOutput,
			async () => {
				const statistics=repl.getStatistics();
				assertEquals(statistics.totalCommands,2); // 'command1' and 'command2' are recorded
				assertEquals(statistics.uniqueCommands,2);
				assertEquals(statistics.successRate,100);
				assert(
					statistics.averageDuration>=0
				);
				assertEquals(
					statistics.mostUsedCommands.find(
						(cmd) => cmd.command==="command1"
					)?.count,
					1
				);
				assertEquals(
					statistics.mostUsedCommands.find(
						(cmd) => cmd.command==="command2"
					)?.count,
					1
				);
				// Verify history output contains 'command1', 'command2', and 'history'
				assert(
					mockOutput.output.some(out =>
						out.includes("command1")
					)
				);
				assert(
					mockOutput.output.some(out =>
						out.includes("command2")
					)
				);
				assert(
					mockOutput.output.some(out =>
						out.includes("history")
					)
				);
			},
			3000 // Increased timeout
		);
	}
);

/**
 * Test: Clear Command
 * Verifies that the 'clear' command clears the screen and is not recorded in history.
 */
Deno.test(
	"InteractiveREPL - clear command",
	async () => {
		// Initialize mockInput and mockOutput
		const mockInput=createMockInput([]);
		const mockOutput=createMockOutput();
		const cli=new CLI();
		const tempHistoryFile=await createTempHistoryFile();

		// Instantiate InteractiveREPL with a custom 'echo' command
		const repl=new InteractiveREPL(cli,{
			stdin: mockInput, // Corrected 'stdin'
			stdout: mockOutput,
			historyFile: tempHistoryFile,
			commands: {
				echo: {
					description: "Echo command",
					usage: "echo <message>",
					examples: ["echo test"],
					action: async (args: string[]) => {
						await repl.writeOutput(args.join(" ")+"\n");
					},
				},
			},
		});

		await runREPLTest(
			repl,
			["echo test\n","clear\n"], // Injected commands
			mockInput,
			mockOutput,
			async () => {
				const statistics=repl.getStatistics();
				assertEquals(statistics.totalCommands,1); // Only 'echo' is recorded
				assertEquals(statistics.uniqueCommands,1);
				assertEquals(statistics.successRate,100);
				assert(
					statistics.averageDuration>=0
				);
				assertEquals(
					statistics.mostUsedCommands.find(
						(cmd) => cmd.command==="clear"
					),
					undefined // 'clear' is built-in and not recorded
				);
				// Verify clear screen sequence was sent
				assert(
					mockOutput.output.some(out =>
						out.includes("\x1b[2J\x1b[H")
					)
				);
				// Verify echo output
				assert(
					mockOutput.output.some(out =>
						out.includes("test")
					)
				);
			},
			3000 // Increased timeout
		);
	}
);

/**
 * Test: Debug Command
 * Verifies that the 'debug' command toggles debug mode correctly.
 */
Deno.test(
	"InteractiveREPL - debug command",
	async () => {
		// Initialize mockInput and mockOutput
		const mockInput=createMockInput([]);
		const mockOutput=createMockOutput();
		const cli=new CLI();

		const tempHistoryFile=await createTempHistoryFile();

		// Instantiate InteractiveREPL without initial debug mode
		const repl=new InteractiveREPL(cli,{
			historyFile: tempHistoryFile,
			maxHistorySize: 100,
			debugMode: false,
			prompt: "test> ",
			stdin: mockInput, // Inject mock stdin
			stdout: mockOutput, // Inject mock stdout
		});

		try {
			await runREPLTest(
				repl,
				["debug on\n","exit\n"], // Injected commands
				mockInput,
				mockOutput,
				async () => {
					// Retrieve statistics or any other assertions as needed
					const statistics: HistoryStatistics=repl.getStatistics();

					// Example assertion to check if debug mode was enabled
					assertEquals(
						repl.getDebugMode(),
						true
					);
					// Verify that debug mode was toggled in the output
					assert(
						mockOutput.output.some((out: string) =>
							out.includes("Debug mode enabled")
						)
					);
				},
				3000 // Increased timeout
			);
		} finally {
			await repl.close();
			await Deno.remove(tempHistoryFile);
		}
	}
);

/**
 * Test: Factory Function `createREPL`
 * Verifies that the factory function creates an InteractiveREPL instance correctly.
 */
Deno.test(
	"createREPL factory function",
	async () => {
		const cli=new CLI();
		// Initialize mockInput and mockOutput
		const mockInput=createMockInput([]);
		const mockOutput=createMockOutput();
		const tempHistoryFile=await createTempHistoryFile();

		// Create REPL using factory function
		const repl=createREPL(cli,{
			prompt: "test> ",
			multiline: true,
			historyFile: tempHistoryFile,
			stdin: mockInput,
			stdout: mockOutput,
		});

		assertExists(repl);
		assertEquals(
			repl instanceof InteractiveREPL,
			true
		);

		// Inject Ctrl+D to terminate the REPL
		await runREPLTest(
			repl,
			["\x04"], // Injected termination command
			mockInput,
			mockOutput,
			async () => {
				// No additional assertions needed for factory function
			},
			2000
		);

		await Deno.remove(tempHistoryFile);
	}
);

/**
 * Test: Statistics Retrieval
 * Verifies that statistics are accurately retrieved from command history.
 */
Deno.test(
	"InteractiveREPL - statistics",
	async () => {
		// Initialize mockInput and mockOutput
		const mockInput=createMockInput([]);
		const mockOutput=createMockOutput();
		const cli=new CLI();

		const tempHistoryFile=await createTempHistoryFile();

		// Instantiate InteractiveREPL with a custom 'testCommand'
		const repl=new InteractiveREPL(cli,{
			historyFile: tempHistoryFile,
			maxHistorySize: 100,
			debugMode: true,
			prompt: "test> ",
			stdin: mockInput, // Inject mock stdin
			stdout: mockOutput, // Inject mock stdout
			commands: {
				testCommand: {
					description: "Test command",
					usage: "testCommand",
					examples: ["testCommand"],
					action: () => Promise.resolve(),
				},
			},
		});

		await runREPLTest(
			repl,
			["testCommand\n","exit\n"], // Injected commands
			mockInput,
			mockOutput,
			async () => {
				// Retrieve statistics
				const statistics: HistoryStatistics=repl.getStatistics();

				// Assertions
				assertEquals(
					statistics.totalCommands,
					1
				);
				assertEquals(
					statistics.uniqueCommands,
					1
				);
				assertEquals(
					statistics.successRate,
					100
				);
				assert(
					statistics.averageDuration>=0
				);
				assertEquals(
					statistics.mostUsedCommands[0].command,
					"testcommand" // Commands are stored in lowercase
				);
				assertEquals(
					statistics.mostUsedCommands[0].count,
					1
				);
			},
			3000 // Increased timeout
		);

		await repl.close();
		await Deno.remove(tempHistoryFile);
	}
);

/**
 * Test: Handling Corrupted History File
 * Verifies that a corrupted history file is handled gracefully.
 */
Deno.test(
	"CommandHistory - handle corrupted history file",
	async () => {
		const tempFile=await Deno.makeTempFile({
			suffix: ".json",
		});
		await Deno.writeTextFile(
			tempFile,
			"{ invalid json"
		);

		const history=createCommandHistory({
			storageFilePath: tempFile,
		});

		await history.loadHistory();
		const statistics=history.getStatistics();

		assertEquals(statistics.totalCommands,0);
		assertEquals(statistics.uniqueCommands,0);
		assertEquals(statistics.successRate,0); // Changed from 100 to 0
		assertEquals(statistics.averageDuration,0);
		assertEquals(statistics.mostUsedCommands.length,0);

		// Ensure that the corrupted file was overwritten with an empty array
		const fileContent=await Deno.readTextFile(tempFile);
		assertEquals(fileContent.trim(),"[]");
	}
);
