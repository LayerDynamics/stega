// src/plugin_loader.ts
import { CLI } from "./core.ts"; // Import CLI
import { logger } from "./logger.ts"; // Import logger
import { Plugin, PluginMetadata } from "./plugin.ts"; // Import Plugin interface

// Replace or define ValidationError:
export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ValidationError";
	}
}

export class PluginLoader {
	private loadedPlugins: Map<string, Plugin> = new Map();
	private loadingPromises: Map<string, Promise<void>> = new Map();

	/**
	 * Loads a plugin from a file path
	 */
	async loadPlugin(path: string, cli: CLI): Promise<void> {
		const pluginName = this.getPluginName(path);
		try {
			cli.logger.debug(`Loading plugin from path: ${path}`);

			// Normalize the path to handle test fixtures
			const normalizedPath = path.replace(/\\/g, "/");
			const plugin = await this.loadPluginFromPath(normalizedPath);

			if (!plugin?.metadata?.name) {
				throw new Error(`Invalid plugin: missing metadata.name in ${path}`);
			}

			if (this.loadedPlugins.has(plugin.metadata.name)) {
				cli.logger.warn(`Plugin '${plugin.metadata.name}' is already loaded`);
				return;
			}

			await this.initializePlugin(plugin, cli);
		} catch (error: unknown) {
			const e = error instanceof Error ? error : new Error(String(error));
			throw new ValidationError(
				`Failed to load plugin ${pluginName}: ${e.message}`,
			);
		}
	}

	private getPluginName(path: string): string {
		return path.split("/").pop()?.replace(/\.(ts|js)$/, "") ?? "unknown";
	}

	private async loadPluginFromPath(path: string): Promise<Plugin> {
		try {
			let importPath = path;

			// Handle test fixture paths
			if (path.includes("/fixtures/tmp/")) {
				importPath = `file://${Deno.cwd()}/tests/fixtures/tmp/${
					path.split("/").pop()
				}`;
			}

			const module = await import(importPath);
			return module.default;
		} catch (error: unknown) {
			const e = error instanceof Error ? error : new Error(String(error));
			throw new Error(`Failed to import plugin: ${e.message}`);
		}
	}

	private async initializePlugin(plugin: Plugin, cli: CLI): Promise<void> {
		const initPromise = (async () => {
			try {
				cli.logger.debug(`Initializing plugin: ${plugin.metadata.name}`);
				await plugin.init?.(cli);
				cli.logger.info(
					`Loaded plugin: ${plugin.metadata.name} v${plugin.metadata.version}`,
				);
				cli.markAsReady();
			} catch (error) {
				cli.logger.error(`Plugin initialization failed: ${error}`);
				throw error;
			}
		})();

		this.loadingPromises.set(plugin.metadata.name, initPromise);
		this.loadedPlugins.set(plugin.metadata.name, plugin);
		await initPromise;
		cli.logger.debug(`Plugin ${plugin.metadata.name} fully loaded`);
	}

	/**
	 * Retrieves all loaded plugins.
	 * @returns An array of loaded plugins.
	 */
	getLoadedPlugins(): Plugin[] {
		return Array.from(this.loadedPlugins.values());
	}

	// ...existing methods...

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

	private validatePluginPath(path: string): void {
		const normalizedPath = path.replace(/\\/g, "/");
		const validPaths = ["src/", "tests/", "tests/fixtures/", "tests/plugins/"];
		const isValidPath = validPaths.some((prefix) =>
			normalizedPath.includes(prefix)
		);

		if (!isValidPath) {
			throw new Error(
				`Invalid plugin path: ${path}. Plugins must be in src/ or tests/ directory`,
			);
		}
	}
}
