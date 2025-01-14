import { Command } from "../core.ts";
import { logger } from "../logger.ts";

export const initCommand: Command = {
	name: "init",
	description: "Initialize the application",
	options: [
		{
			name: "log-level",
			alias: "l",
			type: "string",
			description: "Set the logging level (DEBUG, INFO, WARN, ERROR)",
			default: "INFO",
		},
	],
	action: (_args) => {
		logger.info("Initialization started.");
		// ... command logic
	},
};
