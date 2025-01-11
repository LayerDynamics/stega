// src/commands/batch_command.ts
import {Command} from "../core.ts";
import {CLI} from "../core.ts";
import {FlagValue} from "../flag.ts";
import {CommandNotFoundError} from "../error.ts";

export interface Args {
    command: string[];
    flags: Record<string,FlagValue>;
    cli: CLI;
}

export const batchCommand: Command={
    name: "batch",
    description: "Execute multiple commands in sequence or parallel",
    options: [
        {
            name: "commands",
            alias: "c",
            type: "string",
            description: "Comma-separated list of commands to execute",
            required: true,
        },
        {
            name: "parallel",
            alias: "p",
            type: "boolean",
            description: "Execute commands in parallel",
            default: false,
        },
    ],
    action: async (args: Args): Promise<void> => {
        const commandsInput=args.flags.commands as string;
        const isParallel=args.flags.parallel===true;
        const commandNames=commandsInput
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean);

        if(!commandNames.length) {
            throw new Error("No valid commands provided for batch execution");
        }

        args.cli.logger.info(
            `Executing ${commandNames.length} command(s) ${isParallel? "in parallel":"sequentially"
            }`
        );

        const executeCommand=async (cmdName: string): Promise<void> => {
            const cmd=args.cli.findCommand(cmdName);
            if(!cmd) {
                args.cli.logger.error(`Command "${cmdName}" not found.`);
                throw new CommandNotFoundError(cmdName);
            }

            // Create a new args object for the command
            const cmdArgs={
                command: [cmdName],
                flags: {},
                cli: args.cli,
            };

            await cmd.action(cmdArgs);
        };

        try {
            if(isParallel) {
                const promises=commandNames.map((cmdName) => executeCommand(cmdName));
                const results=await Promise.allSettled(promises);
                const failures=results.filter(
                    (r): r is PromiseRejectedResult => r.status==="rejected"
                );

                if(failures.length>0) {
                    for(const failure of failures) {
                        if(failure.reason instanceof CommandNotFoundError) {
                            throw failure.reason;
                        }
                    }
                    throw failures[0].reason;
                }
            } else {
                for(const cmdName of commandNames) {
                    await executeCommand(cmdName);
                }
            }

            args.cli.logger.info("Batch execution completed successfully");
        } catch(error: unknown) {
            if(error instanceof CommandNotFoundError) {
                throw error;
            }
            throw new Error(
                `Batch execution failed: ${error instanceof Error? error.message:String(error)
                }`
            );
        }
    },
};
