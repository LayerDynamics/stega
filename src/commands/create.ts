import { CLI, Command } from "../core.ts";
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
	action: async (args) => {
		const cli = args.cli as CLI;
		let projectName = args.flags.name as string;

		if (!projectName) {
			projectName = await promptString(cli.t("enter_project_name"));
		}

		const force = args.flags.force as boolean;

		if (!force) {
			const confirm = await promptConfirm(
				cli.t("confirm_create_project", { name: projectName }),
			);
			if (!confirm) {
				console.log(cli.t("project_creation_cancelled"));
				return;
			}
		}

		// Project creation logic here
		const result = { project: projectName, status: "created" };
		console.log(cli.formatOutput(result));
	},
};
