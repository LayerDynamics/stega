// src/plugins/enhanced-plugin.ts

import { CLI } from "../core/core.ts";
import { crypto } from "jsr:@std/crypto@0.224.0";
import * as path from "jsr:@std/path@0.224.0";
import { getPlugin } from "./plugin_registry.ts";

// Custom event types
interface PluginEvent extends Event {
	detail: {
		pluginName: string;
		error?: Error;
		config?: Record<string, unknown>;
	};
}

export interface EnhancedPluginMetadata {
	name: string;
	version: string;
	description?: string;
	author?: string;
	homepage?: string;
	repository?: string;
	dependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	engines?: {
		deno?: string;
		node?: string;
	};
	configuration?: {
		schema: Record<string, unknown>;
		default?: Record<string, unknown>;
	};
}

export interface EnhancedPlugin {
	metadata: EnhancedPluginMetadata;
	init: (cli: CLI, config?: Record<string, unknown>) => Promise<void> | void;
	unload?: (cli: CLI) => Promise<void> | void;
	reload?: (cli: CLI) => Promise<void> | void;
	onConfigChange?: (newConfig: Record<string, unknown>) => Promise<void> | void;
}

export class PluginManager extends EventTarget {
	private plugins: Map<string, {
		instance: EnhancedPlugin;
		path: string;
		watcher?: Deno.FsWatcher;
	}> = new Map();

	private pluginConfigs: Map<string, Record<string, unknown>> = new Map();
	private pluginStates: Map<string, boolean> = new Map(); // true = enabled
	private cli: CLI;

	constructor(cli: CLI) {
		super();
		this.cli = cli;
	}

	private dispatchPluginEvent(
		type: string,
		pluginName: string,
		error?: Error,
		config?: Record<string, unknown>,
	): void {
		this.dispatchEvent(
			new CustomEvent<PluginEvent["detail"]>(type, {
				detail: {
					pluginName,
					error,
					config,
				},
			}),
		);
	}

	/**
	 * Load a plugin with configuration
	 */
	public async loadPlugin(
		path: string,
		config?: Record<string, unknown>,
	): Promise<void> {
		try {
			const plugin = await this.importPlugin(path);
			await this.validatePlugin(plugin);

			// Check version compatibility
			if (!this.checkVersionCompatibility(plugin.metadata)) {
				throw new Error(
					`Plugin ${plugin.metadata.name} is not compatible with current runtime`,
				);
			}

			// Check dependencies
			await this.checkDependencies(plugin.metadata);

			// Store config
			if (config) {
				await this.validateConfig(plugin, config);
				this.pluginConfigs.set(plugin.metadata.name, config);
			}

			// Initialize plugin
			await plugin.init(this.cli, config);

			// Setup hot reloading if in development mode
			if (Deno.env.get("DENO_ENV") === "development") {
				await this.setupHotReload(plugin, path);
			}

			this.plugins.set(plugin.metadata.name, {
				instance: plugin,
				path,
			});

			this.pluginStates.set(plugin.metadata.name, true);
			this.dispatchPluginEvent("pluginLoaded", plugin.metadata.name);
		} catch (error) {
			throw new Error(
				`Failed to load plugin from ${path}: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	}

	/**
	 * Import plugin module
	 */
	private async importPlugin(pluginPath: string): Promise<EnhancedPlugin> {
		// Validate and normalize the path
		const normalizedPath = path.normalize(pluginPath);

		// Validate file extension
		if (!normalizedPath.endsWith(".ts") && !normalizedPath.endsWith(".js")) {
			throw new Error("Plugin files must have .ts or .js extension");
		}

		const plugin = await getPlugin(normalizedPath);
		if (!plugin) {
			throw new Error(`Plugin at ${pluginPath} is not registered`);
		}

		return plugin;
	}

	/**
	 * Validate plugin structure and requirements
	 */
	private async validatePlugin(plugin: EnhancedPlugin): Promise<void> {
		if (!plugin.metadata?.name || !plugin.metadata?.version) {
			throw new Error("Plugin metadata must include name and version");
		}

		if (this.plugins.has(plugin.metadata.name)) {
			throw new Error(`Plugin ${plugin.metadata.name} is already loaded`);
		}

		if (plugin.metadata.configuration?.schema) {
			await this.validateConfigSchema(plugin.metadata.configuration.schema);
		}
	}

	/**
	 * Check version compatibility
	 */
	private checkVersionCompatibility(metadata: EnhancedPluginMetadata): boolean {
		if (!metadata.engines) return true;

		if (metadata.engines.deno) {
			// Compare Deno version
			const currentVersion = Deno.version.deno;
			// Implement semver comparison here
		}

		return true;
	}

	/**
	 * Check plugin dependencies
	 */
	private async checkDependencies(
		metadata: EnhancedPluginMetadata,
	): Promise<void> {
		if (!metadata.dependencies) return;

		for (const [name, version] of Object.entries(metadata.dependencies)) {
			const dep = this.plugins.get(name);
			if (!dep) {
				throw new Error(`Missing dependency: ${name}@${version}`);
			}
			// Implement version comparison here
		}
	}

	/**
	 * Validate plugin configuration
	 */
	private async validateConfig(
		plugin: EnhancedPlugin,
		config: Record<string, unknown>,
	): Promise<void> {
		if (!plugin.metadata.configuration?.schema) return;

		// Implement JSON schema validation here
	}

	/**
	 * Validate configuration schema
	 */
	private async validateConfigSchema(
		schema: Record<string, unknown>,
	): Promise<void> {
		// Implement JSON schema validation here
	}

	/**
	 * Setup hot reloading for development
	 */
	private async setupHotReload(
		plugin: EnhancedPlugin,
		pluginPath: string,
	): Promise<void> {
		const watcher = Deno.watchFs(pluginPath);

		const pluginInfo = this.plugins.get(plugin.metadata.name);
		if (pluginInfo) {
			pluginInfo.watcher = watcher;
		}

		(async () => {
			for await (const event of watcher) {
				if (event.kind === "modify") {
					await this.reloadPlugin(plugin.metadata.name);
				}
			}
		})();
	}

	/**
	 * Reload a plugin
	 */
	public async reloadPlugin(name: string): Promise<void> {
		const pluginInfo = this.plugins.get(name);
		if (!pluginInfo) {
			throw new Error(`Plugin ${name} not found`);
		}

		try {
			// Call plugin's unload if available
			if (pluginInfo.instance.unload) {
				await pluginInfo.instance.unload(this.cli);
			}

			// Import updated plugin
			const newPlugin = await this.importPlugin(pluginInfo.path);
			await this.validatePlugin(newPlugin);

			// Get existing config
			const config = this.pluginConfigs.get(name);

			// Initialize new instance
			await newPlugin.init(this.cli, config);

			// Update plugin instance
			pluginInfo.instance = newPlugin;
			this.dispatchPluginEvent("pluginReloaded", name);
		} catch (error) {
			this.dispatchPluginEvent("pluginReloadError", name, error as Error);
			throw error;
		}
	}

	/**
	 * Enable/disable a plugin
	 */
	public async setPluginState(name: string, enabled: boolean): Promise<void> {
		const plugin = this.plugins.get(name);
		if (!plugin) {
			throw new Error(`Plugin ${name} not found`);
		}

		if (enabled === this.pluginStates.get(name)) return;

		if (enabled) {
			const config = this.pluginConfigs.get(name);
			await plugin.instance.init(this.cli, config);
		} else {
			if (plugin.instance.unload) {
				await plugin.instance.unload(this.cli);
			}
		}

		this.pluginStates.set(name, enabled);
		this.dispatchPluginEvent("pluginStateChanged", name);
	}

	/**
	 * Update plugin configuration
	 */
	public async updatePluginConfig(
		name: string,
		config: Record<string, unknown>,
	): Promise<void> {
		const plugin = this.plugins.get(name);
		if (!plugin) {
			throw new Error(`Plugin ${name} not found`);
		}

		await this.validateConfig(plugin.instance, config);
		this.pluginConfigs.set(name, config);

		if (plugin.instance.onConfigChange) {
			await plugin.instance.onConfigChange(config);
		}

		this.dispatchPluginEvent("pluginConfigChanged", name, undefined, config);
	}

	/**
	 * Get plugin status
	 */
	public getPluginStatus(name: string): {
		loaded: boolean;
		enabled: boolean;
		metadata?: EnhancedPluginMetadata;
		config?: Record<string, unknown>;
	} {
		const plugin = this.plugins.get(name);
		const enabled = this.pluginStates.get(name);
		const config = this.pluginConfigs.get(name);

		return {
			loaded: !!plugin,
			enabled: !!enabled,
			metadata: plugin?.instance.metadata,
			config,
		};
	}

	/**
	 * Get all plugins status
	 */
	public getAllPluginsStatus(): Record<
		string,
		ReturnType<typeof this.getPluginStatus>
	> {
		const status: Record<string, ReturnType<typeof this.getPluginStatus>> = {};
		for (const [name] of this.plugins) {
			status[name] = this.getPluginStatus(name);
		}
		return status;
	}

	/**
	 * Cleanup and unload all plugins
	 */
	public async dispose(): Promise<void> {
		for (const [name, plugin] of this.plugins) {
			try {
				if (plugin.instance.unload) {
					await plugin.instance.unload(this.cli);
				}
				if (plugin.watcher) {
					plugin.watcher.close();
				}
			} catch (error) {
				this.dispatchPluginEvent("pluginUnloadError", name, error as Error);
			}
		}

		this.plugins.clear();
		this.pluginConfigs.clear();
		this.pluginStates.clear();

		// Remove all event listeners
		const clone = new EventTarget();
		Object.setPrototypeOf(this, EventTarget.prototype);
		Object.setPrototypeOf(this, clone);
	}
}

// Factory function
export function createPluginManager(cli: CLI): PluginManager {
	return new PluginManager(cli);
}
