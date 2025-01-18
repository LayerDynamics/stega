import { CLI, Command, Option } from "../core/core.ts";
import { decodeBase64 } from "../utils/encode.ts";
import * as path from "jsr:@std/path";
import { PATH_SEPARATOR } from "../utils/path-constants.ts";


/**
 * A class that provides command and path completions. It supports:
 *   - Command completions
 *   - Command option completions
 *   - File and directory path completions
 *   - Fuzzy completions
 */

/**
 * Constructs a new instance of the CommandCompleter.
 * 
 * @param commands - An array of valid command strings for completion.
 * @param commandOptions - An optional record mapping a command to its possible option strings.
 */

/**
 * Retrieves an array of command completions that begin with the specified input.
 * 
 * @param input - The current input string to match commands against.
 * @returns An array of matching command strings.
 */

/**
 * Obtains an array of option completions for a given command based on the provided input.
 * 
 * @param command - The command for which to get completion options.
 * @param input - The current input string to match options against.
 * @returns An array of matching option strings.
 */

/**
 * Asynchronously fetches file and directory path completions based on the current path input.
 * 
 * @param pathInput - The current path input string.
 * @returns A Promise resolving to an array of matching file/directory path strings.
 */

/**
 * Generates fuzzy matched completions for the provided input.
 * 
 * @param input - The input string to match completions against using a fuzzy search approach.
 * @returns An array of fuzzy matched completions.
 */
export class CommandCompleter {
    private commands: string[];
    private commandOptions: Record<string, string[]>;

    constructor(commands: string[], commandOptions: Record<string, string[]> = {}) {
        this.commands = commands;
        this.commandOptions = commandOptions;
    }

    /**
     * Get a list of command completions that start with the given input.
     * @param input The current input string to match commands against.
     * @returns An array of matching command strings.
     */
    public getCompletions(input: string): string[] {
        if (!input || input.trim() === '') {
            return this.commands;
        }
        const lowerInput = input.toLowerCase();
        return this.commands.filter(cmd => cmd.toLowerCase().startsWith(lowerInput));
    }

    /**
     * Get a list of option completions for a specific command.
     * @param command The command for which to get options.
     * @param input The current input string to match options against.
     * @returns An array of matching option strings.
     */
    public getCommandOptions(command: string, input: string): string[] {
        if (!command) return [];
        const options = this.commandOptions[command] || [];
        if (!input || input.trim() === '') {
            return options;
        }
        const lowerInput = input.toLowerCase();
        return options.filter(opt => opt.toLowerCase().startsWith(lowerInput));
    }

    /**
     * Get file and directory path completions based on the current input.
     * @param pathInput The current path input string.
     * @returns An array of matching file and directory paths.
     */
    public async getPathCompletions(pathInput: string): Promise<string[]> {
        if (!pathInput || pathInput.trim() === '') {
            try {
                const entries: string[] = [];
                for await (const entry of Deno.readDir('.')) {
                    const fullPath = path.join('.', entry.name);
                    entries.push(entry.isDirectory ? `${fullPath}${PATH_SEPARATOR}` : fullPath);
                }
                return entries;
            } catch {
                return [];
            }
        }

        try {
            const dir = path.dirname(pathInput);
            const prefix = path.basename(pathInput);
            
            const entries: string[] = [];
            try {
                for await (const entry of Deno.readDir(dir)) {
                    if (entry.name.toLowerCase().startsWith(prefix.toLowerCase())) {
                        const fullPath = path.join(dir, entry.name);
                        entries.push(entry.isDirectory ? `${fullPath}${PATH_SEPARATOR}` : fullPath);
                    }
                }
                return entries;
            } catch (error) {
                console.warn(`Path completion error: ${error}`);
                return [];
            }
        } catch {
            return [];
        }
    }

    /**
     * Get fuzzy matched completions based on input.
     * @param input The input string to match completions against.
     * @returns An array of fuzzy matched completions.
     */
    public getFuzzyCompletions(input: string): string[] {
        // Simple fuzzy matching implementation
        const regex = new RegExp(input.split('').map(char => `(?=.*${char})`).join(''), 'i');
        return this.commands.filter(cmd => regex.test(cmd));
    }
}

/**
 * Factory function to create a CommandCompleter instance with command options.
 * @param cli The CLI instance to retrieve available commands and their options from.
 * @returns An instance of CommandCompleter.
 */
export function createCommandCompleter(cli: CLI): CommandCompleter {
    const commands = cli.getCommandRegistry().getCommands().map(cmd => cmd.name);
    const commandOptions: Record<string, string[]> = {};

    cli.getCommandRegistry().getCommands().forEach((cmd: Command) => {
        const cmdOptions = cmd.options || [];
        const formattedOptions = cmdOptions.map(opt => {
            // Handle both string and Option types
            const optName = typeof opt === 'string' ? opt : opt.name;
            return optName.startsWith('--') ? optName : `--${optName}`;
        });
        commandOptions[cmd.name] = formattedOptions;
    });

    return new CommandCompleter(commands, commandOptions);
}
