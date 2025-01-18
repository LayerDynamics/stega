// tests/repl/completer.test.ts
import { assertEquals, assertExists, assert } from "@std/assert";
import { CommandCompleter, createCommandCompleter } from "../../src/repl/completer.ts";
import { CLI } from "../../src/core/core.ts";
import { Command, CommandRegistry } from "../../src/command.ts";

Deno.test("CommandCompleter - basic completion",async () => {
    const completer=new CommandCompleter(["help","hello","history"]);

    const completions=completer.getCompletions("h");
    assertEquals(completions.length,3);
    assertEquals(completions,["help","hello","history"]);

    const specificCompletions=completer.getCompletions("he");
    assertEquals(specificCompletions.length,2);
    assertEquals(specificCompletions,["help","hello"]);
});

Deno.test("CommandCompleter - command options",async () => {
    const completer=new CommandCompleter(
        ["test"],
        {"test": ["--verbose","--output","--force"]}
    );

    const options=completer.getCommandOptions("test","--v");
    assertEquals(options.length,1);
    assertEquals(options[0],"--verbose");
});

Deno.test("CommandCompleter - path completion",async () => {
    const completer=new CommandCompleter([]);

    // Create temporary test directory structure
    const tempDir=await Deno.makeTempDir();
    await Deno.mkdir(`${tempDir}/subdir`);
    await Deno.writeTextFile(`${tempDir}/file1.txt`,"");
    await Deno.writeTextFile(`${tempDir}/file2.txt`,"");

    try {
        const completions=await completer.getPathCompletions(`${tempDir}/f`);
        assertEquals(completions.length,2);
        assert(completions.includes(`${tempDir}/file1.txt`));
        assert(completions.includes(`${tempDir}/file2.txt`));
    } finally {
        await Deno.remove(tempDir,{recursive: true});
    }
});

Deno.test("CommandCompleter - fuzzy matching",async () => {
    const completer=new CommandCompleter([
        "install-plugin",
        "uninstall-plugin",
        "list-plugins"
    ]);

    const matches=completer.getFuzzyCompletions("plg");
    assertEquals(matches.length,3);
    assert(matches.includes("install-plugin"));
    assert(matches.includes("uninstall-plugin"));
    assert(matches.includes("list-plugins"));
});

Deno.test("createCommandCompleter factory function",async () => {
    const cli=new CLI();
    cli.register({
        name: "test",
        description: "Test command",
        options: [
            {name: "verbose",alias: "v",type: "boolean"},
            {name: "output",alias: "o",type: "string"}
        ],
        action: () => {}
    });

    const completer=createCommandCompleter(cli);
    assertExists(completer);

    const completions=completer.getCompletions("te");
    assertEquals(completions.length,1);
    assertEquals(completions[0],"test");

    const options=completer.getCommandOptions("test","--v");
    assertEquals(options.length,1);
    assertEquals(options[0],"--verbose");
});

Deno.test("CommandCompleter - getCompletions", () => {
    const cli = new CLI();
    const registry = new CommandRegistry();
    
    // Create commands without registering them directly to CLI
    const command1: Command = {
        name: "help",
        description: "Show help",
        action: () => {}
    };
    const command2: Command = {
        name: "exit",
        description: "Exit REPL",
        action: () => {}
    };

    // Register commands to our clean registry
    registry.register(command1);
    registry.register(command2);

    // Create completer with our controlled registry
    const completer = new CommandCompleter([command1.name, command2.name]);
    const completions = completer.getCompletions("he");
    assertEquals(completions, ["help"]);
});

Deno.test("CommandCompleter - getCommandOptions", () => {
    const cli = new CLI();
    const command: Command = {
        name: "test",
        description: "Test command",
        options: [
            { name: "force", type: "boolean" },
            { name: "verbose", type: "boolean", required: false }
        ],
        action: () => {}
    };
    cli.getCommandRegistry().register(command);

    const completer = createCommandCompleter(cli);
    const options = completer.getCommandOptions("test", "--v");
    assertEquals(options, ["--verbose"]);
});

Deno.test("CommandCompleter - getPathCompletions", async () => {
    const cli = new CLI();
    const completer = createCommandCompleter(cli);
    
    // Mock the file system or adjust the test to match existing directories
    const completions = await completer.getPathCompletions("src/");
    
    // Update assertions based on the actual or mocked directory structure
    assertEquals(completions.includes("src/repl/"), true);
    assertEquals(completions.includes("src/core/"), true);
});

Deno.test("CommandCompleter - getFuzzyCompletions", () => {
    const cli = new CLI();
    const command1: Command = {
        name: "commit",
        description: "Commit changes",
        action: () => {}
    };
    const command2: Command = {
        name: "checkout",
        description: "Switch branches",
        action: () => {}
    };
    const command3: Command = {
        name: "clone",
        description: "Clone repository",
        action: () => {}
    };
    cli.getCommandRegistry().register(command1);
    cli.getCommandRegistry().register(command2);
    cli.getCommandRegistry().register(command3);

    const completer = createCommandCompleter(cli);
    const fuzzyCompletions = completer.getFuzzyCompletions("cm");
    assertEquals(fuzzyCompletions, ["commit"]);
});