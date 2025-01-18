// tests/repl/pipeline.test.ts
import { assertEquals, assertRejects } from "@std/assert";
import {
	CommandPipeline,
	createPipelineEvaluator,
	StringOperator,
} from "../../src/repl/pipeline.ts";

Deno.test("CommandPipeline - basic command parsing", () => {
	const pipeline = new CommandPipeline();
	const stages = pipeline.parse('command1 "arg with spaces" | command2 arg2');

	assertEquals(stages.length, 2);
	assertEquals(stages[0].command, "command1");
	assertEquals(stages[0].args[0], "arg with spaces");
	assertEquals(stages[1].command, "command2");
	assertEquals(stages[1].args[0], "arg2");
});

Deno.test("CommandPipeline - command execution", async () => {
	const pipeline = new CommandPipeline();
	pipeline.parse('echo "hello" | .uppercase');

	const mockEval = async (command: string, args: string[], input?: string) => {
		if (command === "echo") {
			return args[0];
		}
		if (command === ".uppercase") {
			return input ? input.toUpperCase() : "";
		}
		throw new Error(`Unknown command: ${command}`);
	};

	const result = await pipeline.execute({ eval: mockEval });
	assertEquals(result.success, true);
	assertEquals(result.output, "HELLO");
});

Deno.test("CommandPipeline - error handling", async () => {
	const pipeline = new CommandPipeline();
	pipeline.parse("invalid command");

	const mockEval = async () => {
		throw new Error("Command not found");
	};

	const result = await pipeline.execute({ eval: mockEval });
	assertEquals(result.success, false);
	assertEquals(result.error, "Command not found");
});

Deno.test("StringOperator - transforms", async () => {
	// Test uppercase transform
	assertEquals(
		await StringOperator.transform("test", "uppercase", []),
		"TEST",
	);

	// Test lowercase transform
	assertEquals(
		await StringOperator.transform("TEST", "lowercase", []),
		"test",
	);

	// Test trim transform
	assertEquals(
		await StringOperator.transform("  test  ", "trim", []),
		"test",
	);

	// Test replace transform
	assertEquals(
		await StringOperator.transform("hello world", "replace", [
			"world",
			"there",
		]),
		"hello there",
	);

	// Test split transform
	assertEquals(
		await StringOperator.transform("a,b,c", "split", [","]),
		"a\nb\nc",
	);

	// Test join transform
	assertEquals(
		await StringOperator.transform("a\nb\nc", "join", [","]),
		"a,b,c",
	);

	// Test grep transform
	assertEquals(
		await StringOperator.transform("line1\nline2\ntest\nline3", "grep", [
			"test",
		]),
		"test",
	);

	// Test invalid operation
	await assertRejects(
		() => StringOperator.transform("test", "invalid", []),
		Error,
		"Unknown string operation: invalid",
	);
});

Deno.test("createPipelineEvaluator - basic functionality", async () => {
	const mockREPL = {
		eval: async (line: string) => {
			if (line.includes("success")) {
				return "success";
			}
			throw new Error("Command failed");
		},
	};

	const evaluator = createPipelineEvaluator(mockREPL);

	// Test successful command
	const successResult = await evaluator("success", [], undefined);
	assertEquals(successResult, "success");

	// Test failed command
	await assertRejects(
		() => evaluator("fail", [], undefined),
		Error,
		"Command failed",
	);

	// Test string operation
	const upperResult = await evaluator(".uppercase", [], "test");
	assertEquals(upperResult, "TEST");
});

Deno.test("CommandPipeline - complex pipeline", async () => {
	const pipeline = new CommandPipeline();
	pipeline.parse(
		'echo "Hello, World!" | .lowercase | .replace "world" "there" | .trim',
	);

	let currentInput = "";
	const mockEval = async (command: string, args: string[], input?: string) => {
		if (command === "echo") {
			return args[0];
		}
		currentInput = input || "";
		return StringOperator.transform(currentInput, command.slice(1), args);
	};

	const result = await pipeline.execute({ eval: mockEval });
	assertEquals(result.success, true);
	assertEquals(result.output, "hello, there!");
});

Deno.test("CommandPipeline - quoted arguments", () => {
	const pipeline = new CommandPipeline();
	const stages = pipeline.parse(
		"command \"arg with spaces\" 'another arg' | command2",
	);

	assertEquals(stages[0].args[0], "arg with spaces");
	assertEquals(stages[0].args[1], "another arg");
	assertEquals(stages[1].command, "command2");
});

Deno.test("StringOperator - complex transformations", async () => {
	// Test chained transformations
	const input = "  HELLO, World!  ";

	const result = await StringOperator.transform(
		await StringOperator.transform(
			await StringOperator.transform(input, "trim", []),
			"lowercase",
			[],
		),
		"replace",
		["world", "there"],
	);

	assertEquals(result, "hello, there!");
});
