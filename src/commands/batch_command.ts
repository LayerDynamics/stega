import { Command } from "../command.ts";
import { CLI } from "../core.ts";
import { FlagValue } from "../flag.ts";
import { CommandNotFoundError } from "../error.ts";
import type { Args } from "../types.ts";

interface CommandExecutionResult {
    command: string;
    success: boolean;
    error?: Error;
}

export function createBatchCommand(cli: CLI): Command {
    return {
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
            const commandsInput = args.flags.commands as string;
            const isParallel = args.flags.parallel === true;
            const commandNames = commandsInput
                .split(",")
                .map((name) => name.trim())
                .filter(Boolean);

            if (!commandNames.length) {
                throw new Error("No valid commands provided for batch execution");
            }

            cli.logger.info(
                `Executing ${commandNames.length} command(s) ${isParallel ? "in parallel" : "sequentially"}`
            );

            const results: CommandExecutionResult[] = [];

            const executeCommand = async (cmdName: string): Promise<CommandExecutionResult> => {
                const cmd = cli.findCommand(cmdName);
                if (!cmd) {
                    const error = new CommandNotFoundError(cmdName);
                    cli.logger.error(`Command "${cmdName}" not found.`);
                    return { command: cmdName, success: false, error };
                }

                const cmdArgs = {
                    command: [cmdName],
                    flags: {},
                    cli: cli,
                };

                try {
                    await Promise.resolve(cmd.action(cmdArgs));
                    cli.logger.info(`Command "${cmdName}" executed successfully`);
                    return { command: cmdName, success: true };
                } catch (error) {
                    const execError = error instanceof Error ? error : new Error(String(error));
                    cli.logger.error(`Command "${cmdName}" failed: ${execError.message}`);
                    return { command: cmdName, success: false, error: execError };
                }
            };

            try {
                if (isParallel) {
                    const executions = await Promise.all(
                        commandNames.map((cmdName) => executeCommand(cmdName))
                    );
                    results.push(...executions);
                } else {
                    for (const cmdName of commandNames) {
                        const result = await executeCommand(cmdName);
                        results.push(result);
                        if (!result.success) break;
                    }
                }

                const failedCommands = results.filter(r => !r.success);
                if (failedCommands.length > 0) {
                    const firstFailure = failedCommands[0];
                    if (firstFailure.error instanceof CommandNotFoundError) {
                        throw firstFailure.error;
                    }
                    throw new Error(`Batch execution failed: ${firstFailure.error?.message || 'Unknown error'}`);
                }

                cli.logger.info("Batch execution completed successfully");
            } catch (error) {
                if (error instanceof CommandNotFoundError) {
                    throw error;
                }
                throw new Error(
                    `Batch execution failed: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }
    };
}
