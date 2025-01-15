import type { CLI } from "../../src/core/core.ts";

export default {
	metadata: {
		name: "BasePlugin",
		version: "1.0.0",
	},
	init: (cli: CLI) => {
		cli.register({
			name: "base",
			description: "Base command",
			action: () => {},
		});
	},
};
