// tests/repl/validator.test.ts
import { assertEquals, assert, assertRejects } from "@std/assert";
import { CommandValidator, createCommandValidator, ValidationResult } from "../../src/repl/validator.ts";
import { CLI } from "../../src/core/core.ts";
import { Command } from "../../src/command.ts";
import type { Args } from "../../src/types/types.ts"; // Import Args from the correct path

// Define mock commands for testing with the required 'action' property
const mockCommands = new Map<string, Command>([
    ["test", { 
        name: "test", 
        description: "Test command", 
        options: [], 
        action: (args: Args) => { /* mock action implementation */ } 
    }],
    // Add other necessary mock commands with 'action'
]);

Deno.test("CommandValidator - basic command validation",() => {
	const commands=new Map<string,Command>();
	commands.set("test",{
		name: "test",
		options: [
			{name: "flag",type: "boolean",required: true}
		],
		action: () => {}
	});

	const validator=new CommandValidator(commands);
	const result=validator.validateCommand("test --flag=true");

	assertEquals(result.isValid,true);
	assertEquals(result.errors.length,0);
});

Deno.test("CommandValidator - missing required flag",() => {
	const commands=new Map<string,Command>();
	commands.set("test",{
		name: "test",
		options: [
			{name: "required",type: "string",required: true}
		],
		action: () => {}
	});

	const validator=new CommandValidator(commands);
	const result=validator.validateCommand("test");

	assertEquals(result.isValid,false);
	assertEquals(result.errors[0],"Missing required flag: --required");
});

Deno.test("CommandValidator - invalid flag value", () => {
    const validator = new CommandValidator(mockCommands);
    const result = validator.validateCommand("test --number notanumber");
    assertEquals(result.isValid, false);
    assertEquals(result.errors[0], "Invalid value for option --number: expected number");
});

Deno.test("CommandValidator - unknown command handling", () => {
    const validator = new CommandValidator(mockCommands);
    const result = validator.validateCommand("unknowncmd");
    assertEquals(result.isValid, false);
    assertEquals(result.errors[0], "Unknown command: unknowncmd");
});

Deno.test("CommandValidator - path validation",() => {
	const validator=new CommandValidator(new Map());

	// Test valid path
	const validResult=validator.validatePath("path/to/file.txt");
	assertEquals(validResult.isValid,true);

	// Test invalid characters
	const invalidResult=validator.validatePath("path/to/file?.txt");
	assertEquals(invalidResult.isValid,false);
	assertEquals(invalidResult.errors[0],"Path contains invalid characters");

	// Test empty path
	const emptyResult=validator.validatePath("");
	assertEquals(emptyResult.isValid,false);
	assertEquals(emptyResult.errors[0],"Path cannot be empty");
});

Deno.test("CommandValidator - value type validation", () => {
    const validator = new CommandValidator(mockCommands);
    const result = validator.validateCommand("test --flag notabool");
    assertEquals(result.isValid, false);
    assertEquals(result.errors[0], "Invalid value for option --flag: expected boolean");
});

Deno.test("CommandValidator - strict mode", () => {
    // Removed 'strict' since it's not defined in ValidatorOptions
    const validator = new CommandValidator(mockCommands);
    const result = validator.validateCommand("test --unknown");
    assertEquals(result.isValid, false);
    assertEquals(result.errors[0], "Invalid option: --unknown");
});

Deno.test("CommandValidator - max args length", () => {
    // Removed 'maxArgs' since it's not defined in ValidatorOptions
    const validator = new CommandValidator(mockCommands);
    const result = validator.validateCommand("test arg1 arg2 arg3");
    assertEquals(result.isValid, false);
    assertEquals(result.errors[0], "Too many arguments provided");
});

Deno.test("CommandValidator - required options", () => {
    // Removed 'requiredOptions' since it's not defined in ValidatorOptions
    const validator = new CommandValidator(mockCommands);
    const result = validator.validateCommand("test");
    assertEquals(result.isValid, false);
    assertEquals(result.errors[0], "Missing required option: --requiredOption");
});

Deno.test("CommandValidator - factory function", () => {
    const cli = new CLI();
    cli.register({
        name: "test",
        options: [{ name: "flag", type: "boolean" }],
        action: () => {}
    });

    const validator = createCommandValidator(cli);
    const result = validator.validateCommand("test --flag");
    
    assertEquals(result.isValid, true);
    assertEquals(result.errors.length, 0);
});

Deno.test("CommandValidator - complex command validation", () => {
    const validator = new CommandValidator(mockCommands);
    const result = validator.validateCommand("test --valid --invalid");
    assertEquals(result.isValid, false);
    assertEquals(result.errors[0], "Invalid option: --invalid");
});

Deno.test("CommandValidator - valid command", () => {
    const validator = new CommandValidator(mockCommands);
    const result = validator.validateCommand("test --number 42");
    assertEquals(result.isValid, true);
    assertEquals(result.errors.length, 0);
});

Deno.test("CommandValidator - invalid command in strict mode", () => {
    const cli = new CLI();
    const commands = new Map<string, Command>();
    const validator = createCommandValidator(commands, { strictMode: true });

    const result: ValidationResult = validator.validateCommand("invalidCommand");
    assertEquals(result.isValid, false);
    assertEquals(result.errors, ["Invalid option: --invalidCommand"]);
    assertEquals(result.warnings.length, 0);
});

Deno.test("CommandValidator - unknown command in non-strict mode", () => {
    const cli = new CLI();
    const commands = new Map<string, Command>();
    const validator = createCommandValidator(commands, { strictMode: false });

    const result: ValidationResult = validator.validateCommand("unknownCommand");
    assertEquals(result.isValid, true);
    assertEquals(result.errors.length, 0);
    assertEquals(result.warnings, ["Unknown option: --unknownCommand"]);
});