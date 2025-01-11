// src/parser.ts
import { Args } from "./core.ts";
import type { CLI } from "./core.ts"; // Import CLI

export class Parser {
    /**
     * Parses the command-line arguments.
     * @param argv The array of command-line arguments.
     * @param cli The CLI instance to attach to Args.
     * @returns An Args object containing commands and flags.
     */
    parse(argv: string[], cli: CLI): Args {
        const args: Args = {
            command: [],
            flags: {},
            cli: cli, // Use the provided CLI instance
        };
        let i = 0;

        while (i < argv.length) {
            const arg = argv[i];

            if (arg.startsWith('--')) {
                const [key, value] = arg.slice(2).split('=');
                if (value !== undefined) {
                    args.flags[key] = value;
                } else {
                    // Check if next argument is a value or another flag
                    const nextArg = argv[i + 1];
                    if (nextArg && !nextArg.startsWith('-')) {
                        args.flags[key] = nextArg;
                        i++;
                    } else {
                        args.flags[key] = true;
                    }
                }
            } else if (arg.startsWith('-') && arg !== '-') {
                const flags = arg.slice(1).split('');
                for (const flag of flags) {
                    const nextArg = argv[i + 1];
                    if (nextArg && !nextArg.startsWith('-')) {
                        args.flags[flag] = nextArg;
                        i++;
                    } else {
                        args.flags[flag] = true;
                    }
                }
            } else {
                args.command.push(arg);
            }

            i++;
        }

        return args;
    }
}
