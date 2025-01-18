// tests/repl/history.test.ts
import {assertEquals,assertExists} from "jsr:@std/assert@^0.224.0";
import {CommandHistory,createCommandHistory} from "../../src/repl/history.ts";
import {createMockInput,createMockOutput} from "../utils/mock_io.ts";
import {ensureDir} from "jsr:@std/fs@^0.224.0";
import {dirname} from "jsr:@std/path@^0.224.0";

async function createTempHistoryFile(): Promise<string> {
	const historyFile=await Deno.makeTempFile({suffix: ".json"});
	await ensureDir(dirname(historyFile));
	return historyFile;
}

async function cleanup(filePath: string) {
	try {
		await Deno.remove(filePath);
	} catch(error) {
		if(!(error instanceof Deno.errors.NotFound)) {
			console.error(`Failed to clean up test file: ${error}`);
		}
	}
}

Deno.test("CommandHistory - basic operations",async () => {
	const historyFile=await createTempHistoryFile();
	try {
		const history=new CommandHistory({
			maxEntries: 3,
			storageFilePath: historyFile
		});

		await history.addEntry({
			command: "test",
			args: {},
			timestamp: Date.now(),
			success: true,
			duration: 100
		});

		const entries=history.getHistory();
		assertEquals(entries.length,1);
		assertEquals(entries[0].command,"test");
	} finally {
		await cleanup(historyFile);
	}
});

Deno.test("CommandHistory - respects maxEntries",async () => {
	const historyFile=await createTempHistoryFile();
	try {
		const history=new CommandHistory({maxEntries: 2,storageFilePath: historyFile});

		await history.addEntry({
			command: "first",
			args: {},
			timestamp: Date.now(),
			success: true,
			duration: 100
		});

		await history.addEntry({
			command: "second",
			args: {},
			timestamp: Date.now(),
			success: true,
			duration: 100
		});

		await history.addEntry({
			command: "third",
			args: {},
			timestamp: Date.now(),
			success: true,
			duration: 100
		});

		const entries=history.getHistory();
		assertEquals(entries.length,2);
		assertEquals(entries[0].command,"third");
		assertEquals(entries[1].command,"second");
	} finally {
		await cleanup(historyFile);
	}
});

Deno.test("CommandHistory - persistence",async () => {
	const historyFile=await createTempHistoryFile();
	try {
		const history=new CommandHistory({storageFilePath: historyFile});

		await history.addEntry({
			command: "persistTest",
			args: {},
			timestamp: Date.now(),
			success: true,
			duration: 150
		});

		// Create a new instance with the same file
		const newHistory=new CommandHistory({storageFilePath: historyFile});
		await newHistory.loadHistory();

		const entries=newHistory.getHistory();
		assertEquals(entries.length,1);
		assertEquals(entries[0].command,"persistTest");
	} finally {
		await cleanup(historyFile);
	}
});

Deno.test("CommandHistory - filtering",async () => {
	const historyFile=await createTempHistoryFile();
	try {
		const history=new CommandHistory({storageFilePath: historyFile});

		await history.addEntry({
			command: "help",
			args: {},
			timestamp: Date.now(),
			success: true,
			duration: 10
		});

		await history.addEntry({
			command: "exit",
			args: {},
			timestamp: Date.now(),
			success: true,
			duration: 5
		});

		const filtered=history.getHistory({command: "help"});
		assertEquals(filtered.length,1);
		assertEquals(filtered[0].command,"help");
	} finally {
		await cleanup(historyFile);
	}
});

Deno.test("CommandHistory - search functionality",async () => {
	const historyFile=await createTempHistoryFile();
	try {
		const history=new CommandHistory({storageFilePath: historyFile});

		await history.addEntry({
			command: "searchTestCommand",
			args: {flag: "value"},
			timestamp: Date.now(),
			success: true,
			duration: 120
		});

		await history.addEntry({
			command: "anotherCommand",
			args: {option: "test"},
			timestamp: Date.now(),
			success: true,
			duration: 80
		});

		const searchResults=history.searchHistory("search flag");
		assertEquals(searchResults.length,1);
		assertEquals(searchResults[0].command,"searchTestCommand");
	} finally {
		await cleanup(historyFile);
	}
});

Deno.test("CommandHistory - statistics",async () => {
	const historyFile=await createTempHistoryFile();
	try {
		const history=new CommandHistory({storageFilePath: historyFile});

		await history.addEntry({
			command: "help",
			args: {},
			timestamp: Date.now(),
			success: true,
			duration: 10
		});

		await history.addEntry({
			command: "exit",
			args: {},
			timestamp: Date.now(),
			success: false,
			duration: 5,
			error: "Some error"
		});

		const stats=history.getStatistics();
		assertEquals(stats.totalCommands,2);
		assertEquals(stats.uniqueCommands,2);
		assertEquals(stats.successRate,50);
		assertEquals(stats.averageDuration,7.5);
		assertEquals(stats.mostUsedCommands.length,2);
	} finally {
		await cleanup(historyFile);
	}
});

Deno.test("createCommandHistory factory function",async () => {
	const historyFile=await createTempHistoryFile();
	try {
		const history=createCommandHistory({
			maxEntries: 5,
			storageFilePath: historyFile
		});

		assertExists(history);
		assertEquals(history instanceof CommandHistory,true);
	} finally {
		await cleanup(historyFile);
	}
});