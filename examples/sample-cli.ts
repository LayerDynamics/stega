// examples/sample-cli.ts
import { CLI, Command } from "../src/core.ts";

const cli = new CLI();

const greetCommand: Command = {
	name: "greet",
	description: "Greet the user",
	options: [
		{
			name: "name",
			alias: "n",
			description: "Name of the user",
			type: "string",
			required: true,
		},
		{
			name: "verbose",
			alias: "v",
			description: "Enable verbose output",
			type: "boolean",
			default: false,
		},
		{
			name: "times",
			alias: "t",
			description: "Number of times to greet",
			type: "number",
			default: 1,
		},
	],
	subcommands: [
		{
			name: "formal",
			description: "Send a formal greeting",
			options: [
				{
					name: "title",
					alias: "T",
					description: "Title of the user",
					type: "string",
					required: true,
				},
			],
			action: (args) => {
				const name = args.flags.name as string;
				const title = args.flags.title as string;
				const times = Number(args.flags.times);

				for (let i = 0; i < times; i++) {
					console.log(`Good day, ${title} ${name}. It is a pleasure to meet you.`);
				}
			},
		},
	],
	action: (args) => {
		const name = args.flags.name as string;
		const verbose = Boolean(args.flags.verbose);
		const times = Number(args.flags.times);

		if (name.toLowerCase() === "error") {
			throw new Error("Simulated command error.");
		}

		for (let i = 0; i < times; i++) {
			if (verbose) {
				console.log(`Hello, ${name}! Welcome to Stega CLI Framework.`);
			} else {
				console.log(`Hello, ${name}!`);
			}
		}
	},
};

cli.register(greetCommand);

await cli.run();
