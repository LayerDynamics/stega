// src/logger.ts
import {setup as logSetup,ConsoleHandler,LogRecord} from "https://deno.land/std@0.224.0/log/mod.ts";
import type {LevelName} from "https://deno.land/std@0.224.0/log/levels.ts";
import {ILogger} from "./logger_interface.ts";

export interface LogConfig {
	loggers?: {
		default: {
			level: LevelName;
			handlers: string[];
		}
	}
}

export class ConsoleLogger implements ILogger {
	protected logLevel: LevelName;

	constructor(logLevel: LevelName="INFO") {
		this.logLevel=logLevel;
	}

	private formatMessage(level: string,message: string): string {
		return `${level} ${message}`;
	}

	info(message: string): void {
		const formattedMessage=this.formatMessage("INFO",message);
		console.log(formattedMessage);
	}

	error(message: string): void {
		const formattedMessage=this.formatMessage("ERROR",message);
		console.error(formattedMessage);
	}

	debug(message: string): void {
		const formattedMessage=this.formatMessage("DEBUG",message);
		console.debug(formattedMessage);
	}

	warn(message: string): void {
		const formattedMessage=this.formatMessage("WARN",message);
		console.warn(formattedMessage);
	}
}

export const logger=new ConsoleLogger();

export const setup=async (options?: LogConfig) => {
	const defaultConfig={
		handlers: {
			console: new ConsoleHandler("DEBUG" as LevelName,{
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

	await logSetup(options??defaultConfig);
};

export const loggingMiddleware=(args: Record<string,unknown>,command: {name: string}) => {
	logger.info(`Executing command: ${command.name}`);
	if(Object.keys(args).length>0) {
		logger.debug(`Command arguments: ${JSON.stringify(args)}`);
	}
};

export type {LevelName};
