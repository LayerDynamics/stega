// tests/batch_command.test.ts
import {
	assertEquals,
	assertRejects,
} from "https://deno.land/std@0.203.0/testing/asserts.ts";
import {CLI} from "../src/core.ts"; // Correct import path
import {batchCommand} from "../src/commands/batch_command.ts"; // Correct import path
import {CommandNotFoundError} from "../src/error.ts"; // Ensure this path is correct

/**
 * Mock Logger to intercept log messages during tests.
 */
class MockLogger {
	logs: string[]=[];
	errors: string[]=[];
	debugs: string[]=[];
	warns: string[]=[]; // Added 'warns' array

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
 * Deno.test for Batch command - parallel execution
 */
Deno.test("Batch command - parallel execution",async () => {
	const cli=createTestCLI();
	const executed=new Set<string>();
	const mockLogger=(cli.logger) as MockLogger;

	// Register commands with execution tracking
	cli.register(batchCommand);
	cli.register({
		name: "cmd1",
		description: "First test command",
		action: () => {
			executed.add("cmd1");
		},
	});
	cli.register({
		name: "cmd2",
		description: "Second test command",
		action: () => {
			executed.add("cmd2");
		},
	});

	// Execute batch command in parallel with separate flag arguments
	await cli.runCommand([
		"batch",
		"--commands",
		"cmd1,cmd2",
		"--parallel",
		"true",
	]);

	// Assertions
	assertEquals(
		executed.size,
		2,
		"Both cmd1 and cmd2 should have been executed"
	);
	assertEquals(executed.has("cmd1"),true,"cmd1 should have been executed");
	assertEquals(executed.has("cmd2"),true,"cmd2 should have been executed");

	// Verify logs
	assertEquals(
		mockLogger.logs.includes("Executing 2 command(s) in parallel"),
		true
	);
	assertEquals(
		mockLogger.logs.includes("Batch execution completed successfully"),
		true
	);
});

/**
 * Deno.test for Batch command - sequential execution
 */
Deno.test("Batch command - sequential execution",async () => {
	const cli=createTestCLI();
	const executed: string[]=[];
	const mockLogger=(cli.logger) as MockLogger;

	// Register commands with execution tracking
	cli.register(batchCommand);
	cli.register({
		name: "cmd1",
		description: "First test command",
		action: () => {
			executed.push("cmd1");
		},
	});
	cli.register({
		name: "cmd2",
		description: "Second test command",
		action: () => {
			executed.push("cmd2");
		},
	});

	// Execute batch command sequentially with separate flag arguments
	await cli.runCommand(["batch","--commands","cmd1,cmd2"]);

	// Assertions
	assertEquals(
		executed.length,
		2,
		"Both cmd1 and cmd2 should have been executed"
	);
	assertEquals(executed[0],"cmd1","cmd1 should have been executed first");
	assertEquals(executed[1],"cmd2","cmd2 should have been executed second");

	// Verify logs
	assertEquals(
		mockLogger.logs.includes("Executing 2 command(s) sequentially"),
		true
	);
	assertEquals(
		mockLogger.logs.includes("Batch execution completed successfully"),
		true
	);
});

/**
 * Deno.test for Batch command - error handling with missing command
 */
Deno.test("Batch command - error handling with missing command",async () => {
	const cli=createTestCLI();
	const errorMessage=`Command "nonexistent" not found.`;
	const mockLogger=(cli.logger) as MockLogger;

	// Register only batchCommand without registering 'nonexistent'
	cli.register(batchCommand);

	// Execute batch command with a non-existent command
	await assertRejects(
		async () => {
			await cli.runCommand(["batch","--commands","nonexistent"]);
		},
		CommandNotFoundError,
		errorMessage,
		'Should throw CommandNotFoundError when "nonexistent" is not registered'
	);

	// Verify error logs
	assertEquals(
		mockLogger.errors.includes(`Command "nonexistent" not found.`),
		true
	);
});

/**
 * Deno.test for Batch command - single command execution
 */
Deno.test("Batch command - single command execution",async () => {
	const cli=createTestCLI();
	let executed=false;
	const mockLogger=(cli.logger) as MockLogger;

	// Register batchCommand and a single command
	cli.register(batchCommand);
	cli.register({
		name: "single-cmd",
		description: "Single test command",
		action: () => {
			executed=true;
		},
	});

	// Execute batch command with a single command
	await cli.runCommand(["batch","--commands","single-cmd"]);

	// Assertions
	assertEquals(executed,true,"single-cmd should have been executed");

	// Verify logs
	assertEquals(
		mockLogger.logs.includes("Executing 1 command(s) sequentially"),
		true
	);
	assertEquals(
		mockLogger.logs.includes("Batch execution completed successfully"),
		true
	);
});
