import { Plugin } from "../plugin.ts";
import { CLI, Command } from "../core/core.ts";

const templateCommand: Command = {
	name: "template",
	description: "A template command",
	options: [
		{
			name: "name",
			alias: "n",
			type: "string",
			description: "Name to greet",
			required: false,
			default: "World",
		},
	],
	action: (args) => {
		const name = args.flags.name as string;
		console.log(`Hello, ${name}! This is a template plugin command.`);
	},
};

const templatePlugin: Plugin = {
	metadata: {
		name: "TemplatePlugin",
		version: "1.0.0",
		description: "A template plugin for Stega",
	},
	init: (cli: CLI) => {
		cli.register(templateCommand);
		cli.logger.info("Template plugin initialized");
	},
	unload: (cli: CLI) => {
		cli.logger.info("Template plugin unloaded");
	},
};

export default templatePlugin;
