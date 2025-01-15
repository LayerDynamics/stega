export const PLUGIN_REGISTRY = {
	"@stega/core": {
		import: () => import("../core/core.ts"),
		version: "1.0.0",
	},
	"@stega/templates": {
		import: () => import("../commands/template_command.ts"),
		version: "1.0.0",
	},
} as const;

export type PluginKey = keyof typeof PLUGIN_REGISTRY;
