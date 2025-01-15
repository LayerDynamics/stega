// src/plugins/registry.ts

export const PLUGIN_REGISTRY = {
	"@stega/core": {
		import: (): Promise<typeof import("../core/core.ts")> =>
			import("../core/core.ts"),
		version: "1.0.0",
	},
	"@stega/templates": {
		import: (): Promise<typeof import("../commands/template_command.ts")> =>
			import("../commands/template_command.ts"),
		version: "1.0.0",
	},
} as const;

export type PluginKey = keyof typeof PLUGIN_REGISTRY;
