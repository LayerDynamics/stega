// src/middleware/logger.ts
import { MiddlewareFunction } from "./middleware.ts";
import { logger } from "../logger/logger.ts";

export const loggingMiddleware: MiddlewareFunction = (args, command) => {
	logger.info(`Executing command: ${command.name}`);
	if (Object.keys(args.flags).length > 0) {
		logger.debug(`Command flags: ${JSON.stringify(args.flags)}`);
	}
};
