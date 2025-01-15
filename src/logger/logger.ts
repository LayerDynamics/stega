import {
	ConsoleHandler,
	LogRecord,
	setup as logSetup,
} from "jsr:@std/log@0.224.0";
import type { LevelName } from "jsr:@std/log@0.224.0/levels";
import type { ILogger } from "./logger_interface.ts";

export interface LogConfig {
	loggers?: {
		default: {
			level: LevelName;
			handlers: string[];
		};
	};
}

// Export ConsoleLogger implementation
export class ConsoleLogger implements ILogger {
	protected logLevel: LevelName;

	constructor(logLevel: LevelName = "INFO") {
		this.logLevel = logLevel;
	}

	private formatMessage(level: string, message: string): string {
		return `${level} ${message}`;
	}

	info(message: string): void {
		const formattedMessage = this.formatMessage("INFO", message);
		console.log(formattedMessage);
	}

	error(message: string): void {
		const formattedMessage = this.formatMessage("ERROR", message);
		console.error(formattedMessage);
	}

	debug(message: string): void {
		const formattedMessage = this.formatMessage("DEBUG", message);
		console.debug(formattedMessage);
	}

	warn(message: string): void {
		const formattedMessage = this.formatMessage("WARN", message);
		console.warn(formattedMessage);
	}
}

// Export logger instance with explicit type
export const logger: ILogger = new ConsoleLogger();

// Export setup function with explicit return type
export const setup = async (options?: LogConfig): Promise<void> => {
	const defaultConfig = {
		handlers: {
			console: new ConsoleHandler("DEBUG" as LevelName, {
				formatter: (logRecord: LogRecord) => {
					return `${logRecord.levelName} ${logRecord.msg}`;
				},
			}),
		},
		loggers: {
			default: {
				level: "DEBUG" as LevelName,
				handlers: ["console"],
			},
		},
	};

	await logSetup(options ?? defaultConfig);
};

// Export middleware with explicit types
export const loggingMiddleware = (
	args: Record<string, unknown>,
	command: { name: string },
): void => {
	logger.info(`Executing command: ${command.name}`);
	if (Object.keys(args).length > 0) {
		logger.debug(`Command arguments: ${JSON.stringify(args)}`);
	}
};

// Re-export types
export type { LevelName };
