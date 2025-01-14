// src/commands/create.ts
import { Command } from "../command.ts";
import { CLI } from "../core.ts";
import { Args } from "../types.ts";
import { promptConfirm, promptString } from "../prompts.ts";

export const createCommand: Command = {
	name: "create",
	description: "Create a new project",
	options: [
		{ name: "name", alias: "n", type: "string", description: "Project name" },
		{
			name: "force",
			alias: "f",
			type: "boolean",
			description: "Force creation",
		},
		{
			name: "output",
			alias: "o",
			type: "string",
			description: "Output format",
		},
	],
	action: async (args: Args) => {
		const cli = args.cli as CLI;
		let projectName = args.flags.name as string;

		if (!projectName) {
			projectName = await promptString("Enter project name:");
		}

		const force = args.flags.force as boolean;

		if (!force) {
			const confirm = await promptConfirm(`Create project '${projectName}'?`);
			if (!confirm) {
				console.log("Project creation cancelled.");
				return;
			}
		}

		// Project creation logic here
		const result = { project: projectName, status: "created" };
		console.log(JSON.stringify(result, null, 2));
	},
};
