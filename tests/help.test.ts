import { assert } from "@std/assert";
import { CommandRegistry } from "../src/command.ts";
import { Help } from "../src/help.ts";
import { I18n } from "../src/i18n.ts";

// Helper function to capture output
function _captureOutput(fn: () => string): {stdout: string} {
    const originalLog = console.log;
    let stdout = "";
    console.log = (...args: unknown[]) => { stdout += args.join(" ") + "\n"; };
    
    try {
        const result = fn();
        return { stdout: result };
    } finally {
        console.log = originalLog;
    }
}

const mockI18n = new I18n({
    available_commands: "Available Commands",
    use_help: "Use \"help [command]\" for more information",
    command: "Command",
    options: "Options",
    default: "default"
});

Deno.test("Help - generates general help text", () => {
    const registry = new CommandRegistry();
    const help = new Help(registry, mockI18n);

    registry.register({
        name: "test",
        description: "Test command",
        action: () => {}
    });

    const helpText = help.generateHelp();
    assert(helpText.includes(mockI18n.t("available_commands")));
    assert(helpText.includes("test"));
    assert(helpText.includes("Test command"));
    assert(helpText.includes(mockI18n.t("use_help")));
});

Deno.test("Help - generates command-specific help", () => { // Remove async
    const registry = new CommandRegistry();
    const help = new Help(registry, mockI18n);

    const testCommand = {
        name: "test",
        description: "Test command",
        options: [{
            name: "flag",
            alias: "f",
            description: "Test flag",
            type: "boolean" as const,
            default: false
        }],
        action: () => {}
    };

    registry.register(testCommand);
    const command = registry.findCommand("test");
    const helpText = help.generateHelp(command);

    assert(helpText.includes("test"));
    assert(helpText.includes("Test command"));
    assert(helpText.includes("--flag"));
    assert(helpText.includes("-f"));
});

Deno.test("Help - generates subcommand help", () => {
    const registry = new CommandRegistry();
    const help = new Help(registry, mockI18n);

    const command = {
        name: "parent",
        description: "Parent command",
        subcommands: [{
            name: "child",
            description: "Child command",
            action: () => {}
        }],
        action: () => {}
    };

    const helpText = help.generateHelp(command);
    assert(helpText.includes("Subcommands:"));
    assert(helpText.includes("child"));
    assert(helpText.includes("Child command"));
    assert(helpText.includes("Usage:"));
    assert(helpText.includes("stega parent <subcommand>"));
});

