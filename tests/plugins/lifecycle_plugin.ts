import type { CLI } from "../../src/core/core.ts";

export default {
	metadata: {
		name: "lifecycle-plugin",
		version: "1.0.0",
	},
	init: async (cli: CLI) => {
		cli.register({
			name: "lifecycle-test",
			action: () => {
				console.log("Lifecycle plugin executed");
			},
		});
	},
	unload: async (cli: CLI) => {
		console.log("Plugin unloaded");
	},
};
