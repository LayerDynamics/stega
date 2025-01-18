import { EnhancedPlugin } from "./enhanced_plugin.ts";

const pluginRegistry = new Map<string, () => Promise<EnhancedPlugin>>();

export function registerPlugin(
	path: string,
	loader: () => Promise<EnhancedPlugin>,
): void {
	pluginRegistry.set(path, loader);
}

export function getPlugin(path: string): Promise<EnhancedPlugin> | undefined {
	const loader = pluginRegistry.get(path);
	return loader ? loader() : undefined;
}
