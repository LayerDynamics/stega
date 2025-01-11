// tests/command.test.ts
import {CommandRegistry,Command} from "../src/command.ts";
import {assertEquals,assert} from "https://deno.land/std@0.203.0/testing/asserts.ts";

Deno.test("CommandRegistry should register and retrieve commands",() => {
	const registry=new CommandRegistry();

	const greetCommand: Command={
		name: "greet",
		action: () => {},
	};

	registry.register(greetCommand);

	const retrieved=registry.findCommand("greet");
	assert(retrieved);
	assertEquals(retrieved?.name,"greet");
});

Deno.test("CommandRegistry should handle aliases",() => {
	const registry=new CommandRegistry();

	const listCommand: Command={
		name: "list",
		aliases: ["ls","dir"],
		action: () => {},
	};

	registry.register(listCommand);

	assert(registry.findCommand("ls"));
	assert(registry.findCommand("dir"));
	assert(registry.findCommand("list"));
	assert(!registry.findCommand("unknown"));
});

Deno.test("CommandRegistry should find subcommands correctly",() => {
	const registry=new CommandRegistry();

	const userCommand: Command={
		name: "user",
		description: "User management commands",
		subcommands: [
			{
				name: "add",
				description: "Add a new user",
				action: () => {},
			},
			{
				name: "remove",
				description: "Remove an existing user",
				action: () => {},
			},
		],
		action: () => {},
	};

	registry.register(userCommand);

	const subAdd=registry.findSubcommand(userCommand,["add"]);
	assert(subAdd);
	assertEquals(subAdd?.name,"add");

	const subRemove=registry.findSubcommand(userCommand,["remove"]);
	assert(subRemove);
	assertEquals(subRemove?.name,"remove");

	const subUnknown=registry.findSubcommand(userCommand,["update"]);
	assertEquals(subUnknown,undefined);
});
