// tests/parser.test.ts
import {Parser} from "../src/parser.ts";
import {assertEquals} from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { CLI } from "../src/core.ts";
import { ILogger } from "../src/logger_interface.ts";

// Mock logger for CLI instance
const mockLogger: ILogger = {
    info: () => {},
    error: () => {},
    debug: () => {},
    warn: () => {},
};

// Create a mock CLI instance for testing
const createMockCLI = () => {
    return new CLI(undefined, true, true, mockLogger);
};

const mockCLI = new CLI(undefined, true, true);

Deno.test("Parser should correctly parse commands and flags",() => {
	const parser=new Parser();
	const argv=["greet","--name=Alice","-v"];
	const args=parser.parse(argv, mockCLI);
	assertEquals(args.command,["greet"]);
	assertEquals(args.flags,{name: "Alice",v: true});
});

Deno.test("Parser should handle flags with separate values",() => {
	const parser=new Parser();
	const argv=["greet","--name","Bob","-o","output.txt"];
	const args=parser.parse(argv, mockCLI);
	assertEquals(args.command,["greet"]);
	assertEquals(args.flags,{name: "Bob",o: "output.txt"});
});

Deno.test("Parser should treat flags without values as boolean",() => {
	const parser=new Parser();
	const argv=["greet","--verbose","--dry-run"];
	const args=parser.parse(argv, mockCLI);
	assertEquals(args.command,["greet"]);
	assertEquals(args.flags,{verbose: true,"dry-run": true});
});

Deno.test("Parser should handle multiple commands",() => {
	const parser=new Parser();
	const argv=["user","add","--name=Charlie"];
	const args=parser.parse(argv, mockCLI);
	assertEquals(args.command,["user","add"]);
	assertEquals(args.flags,{name: "Charlie"});
});

Deno.test("Parser should handle grouped short flags",() => {
	const parser=new Parser();
	const argv=["command","-abc"];
	const args=parser.parse(argv, mockCLI);
	assertEquals(args.command,["command"]);
	assertEquals(args.flags,{a: true,b: true,c: true});
});

Deno.test("Parser should handle short flags with values",() => {
	const parser=new Parser();
	const argv=["command","-o","output.txt","-f"];
	const args=parser.parse(argv, mockCLI);
	assertEquals(args.command,["command"]);
	assertEquals(args.flags,{o: "output.txt",f: true});
});
