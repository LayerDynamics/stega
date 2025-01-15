import type { CLI } from "../../src/core/core.ts";

export default {
	metadata: {
		name: "DependentPlugin",
		version: "1.0.0",
		dependencies: ["BasePlugin"],
	},
	init: (cli: CLI) => {
		cli.register({
			name: "dependent",
			description: "Dependent command",
			action: () => {},
		});
	},
};
