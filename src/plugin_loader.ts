// src/plugin_loader.ts
import { CLI } from "./core.ts"; // Import CLI
import { logger } from "./logger.ts"; // Import logger
import { Plugin, PluginMetadata } from "./plugin.ts"; // Import Plugin interface
import { ValidationError } from "./core/errors.ts"; // Import ValidationError

export class PluginLoader {
	private loadedPlugins: Map<string, Plugin> = new Map();
	private loadingPromises: Map<string, Promise<void>> = new Map();

	// ...existing code...

	/**
	 * Retrieves all loaded plugins.
	 * @returns An array of loaded plugins.
	 */
	getLoadedPlugins(): Plugin[] {
		return Array.from(this.loadedPlugins.values());
	}

	// ...existing methods...

	async loadPlugin(path: string, cli: CLI): Promise<void> {
		try {
			cli.logger.debug(`Loading plugin from path: ${path}`);

			const pluginName = path.split('/').pop()?.replace('.ts', '');
			if (!pluginName) {
				throw new ValidationError(`Invalid plugin path: ${path}`);
			}

			const plugin = await this.loadPluginByName(pluginName);

			cli.logger.debug(
				`Loaded plugin module: ${JSON.stringify(plugin.metadata || {})}`,
			);

			if (!plugin.metadata?.name) {
				throw new Error(`Invalid plugin: missing metadata.name in ${path}`);
			}

			if (this.loadedPlugins.has(plugin.metadata.name)) {
				cli.logger.warn(`Plugin '${plugin.metadata.name}' is already loaded`);
				return;
			}

			// Create initialization promise
			const initPromise = (async () => {
				try {
					cli.logger.debug(`Initializing plugin: ${plugin.metadata.name}`);
					await plugin.init?.(cli);
					cli.logger.info(
						`Loaded plugin: ${plugin.metadata.name} v${plugin.metadata.version}`,
					);
					// Mark CLI as ready after plugin initialization
					cli.markAsReady();
					return;
				} catch (error) {
					cli.logger.error(`Plugin initialization failed: ${error}`);
					throw error;
				}
			})();

			this.loadingPromises.set(plugin.metadata.name, initPromise);
			this.loadedPlugins.set(plugin.metadata.name, plugin);

			// Wait for initialization to complete
			await initPromise;
			cli.logger.debug(`Plugin ${plugin.metadata.name} fully loaded`);
		} catch (error) {
			cli.logger.error(`Failed to load plugin from ${path}: ${error}`);
			throw error;
		}
	}

	private async loadPluginByName(pluginName: string): Promise<Plugin> {
		// Use a static mapping instead of dynamic import
		const pluginPath = `./plugins/${pluginName}.ts`;
		
		try {
			const plugin = this.loadedPlugins.get(pluginName);
			if (plugin) return plugin;
			
			// Only allow specific known plugins
			switch (pluginName) {
				case "lsb":
					return (await import("./plugins/lsb.ts")).default;
				case "dct":
					return (await import("./plugins/dct.ts")).default;
				default:
					throw new ValidationError(`Unknown plugin: ${pluginName}`);
			}
		} catch (error) {
			throw new ValidationError(`Failed to load plugin ${pluginName}: ${error.message}`);
		}
	}

	async unloadPlugin(name: string, cli: CLI): Promise<void> {
		const plugin = this.loadedPlugins.get(name);
		if (!plugin) {
			logger.warn(`Plugin '${name}' not found`);
			return;
		}

		if (plugin.unload) {
			await plugin.unload(cli);
		}
		this.loadedPlugins.delete(name);
		logger.info(`Unloaded plugin: ${name}`);
	}

	listPlugins(): PluginMetadata[] {
		return Array.from(this.loadedPlugins.values()).map((p) => p.metadata);
	}
}
