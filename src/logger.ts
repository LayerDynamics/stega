// src/logger.ts
import { getLogger, setup as logSetup, ConsoleHandler, LogRecord, Logger } from "https://deno.land/std@0.224.0/log/mod.ts";
import type { Command } from "./core.ts"; // Import only if necessary
import type { LogLevel } from "https://deno.land/std@0.224.0/log/levels.ts";
import { ILogger } from "./logger_interface.ts";

export interface Args {
    flags: Record<string, unknown>;
}

export { type LogLevel }; // Re-export the standard LogLevel type

class ConsoleLogger implements ILogger {
    info(message: string): void {
        console.info(message);
    }
    error(message: string): void {
        console.error(message);
    }
    debug(message: string): void {
        console.debug(message);
    }
    warn(message: string): void { // Implemented warn method
        console.warn(message);
    }
}

export const logger: ILogger = new ConsoleLogger();

export const loggingMiddleware = (args: Args, command: Command) => {
    logger.info(`Executing command: ${command.name}`);
    if (Object.keys(args.flags).length > 0) {
        logger.debug(`Command flags: ${JSON.stringify(args.flags)}`);
    }
};

export const setup = logSetup;

await setup({
    handlers: {
        console: new ConsoleHandler("DEBUG", {
            formatter: (logRecord: LogRecord) => {
                return `${logRecord.levelName} ${logRecord.msg}`;
            },
        }),
    },
    loggers: {
        default: {
            level: "DEBUG",
            handlers: ["console"],
        },
    },
});
