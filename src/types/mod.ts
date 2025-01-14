// Export core types
export * from "../core/mod.ts";

// Plugin system types
export interface PluginMetadata {
	name: string;
	version: string;
	description?: string;
}

export interface StegaPlugin {
	metadata: PluginMetadata;
	encode(
		data: Uint8Array,
		options: Record<string, unknown>,
	): Promise<Uint8Array>;
	decode(
		data: Uint8Array,
		options: Record<string, unknown>,
	): Promise<Uint8Array>;
}
