// src/plugin_loader.ts
import { CLI } from "../core/core.ts"; // Import CLI
import { logger } from "../logger/logger.ts"; // Import logger
import { Plugin, PluginMetadata } from "./plugin.ts"; // Import Plugin interface
import { PLUGIN_REGISTRY, PluginKey } from "./registry.ts";

// Replace or define ValidationError:
export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ValidationError";
	}
}

interface PluginSource {
	type: "local" | "remote" | "jsr";
	path: string;
}

interface RemotePluginSource {
	type: "github" | "jsdelivr";
	owner: string;
	repo: string;
	path: string;
	ref?: string;
}

interface PluginModule {
	default: Plugin;
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
			const plugin = await this.loadPluginFromPath(normalizedPath, cli);

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

	private parsePluginSource(path: string): PluginSource {
		if (path.startsWith("https://") || path.startsWith("http://")) {
			return { type: "remote", path };
		}
		if (path.startsWith("jsr:")) {
			return { type: "jsr", path: path.replace("jsr:", "") };
		}
		return { type: "local", path };
	}

	private async resolvePluginSource(path: string): Promise<string> {
		const source = this.parsePluginSource(path);

		switch (source.type) {
			case "remote": {
				return source.path;
			}
			case "jsr": {
				return `https://jsr.io/${source.path}`;
			}
			case "local": {
				// Only allow specific directories for local plugins
				const allowedDirs = ["plugins/", "tests/plugins/"];
				const isAllowed = allowedDirs.some((dir) => source.path.includes(dir));
				if (!isAllowed) {
					throw new Error(
						"Local plugins must be in plugins/ or tests/plugins/ directory",
					);
				}
				return new URL(source.path, import.meta.url).href;
			}
		}
	}

	private parseRemoteUrl(url: URL): RemotePluginSource | null {
		if (
			url.hostname === "github.com" ||
			url.hostname === "raw.githubusercontent.com"
		) {
			const [_, owner, repo, ...pathParts] = url.pathname.split("/").filter(
				Boolean,
			);
			return {
				type: "github",
				owner,
				repo,
				path: pathParts.join("/"),
				ref: pathParts[0] === "blob" ? pathParts[1] : undefined,
			};
		}
		if (url.hostname === "cdn.jsdelivr.net") {
			const [service, owner, repo, ...pathParts] = url.pathname.split("/")
				.filter(Boolean);
			if (service === "gh") {
				return {
					type: "jsdelivr",
					owner,
					repo,
					path: pathParts.join("/"),
				};
			}
		}
		return null;
	}

	private async loadRemotePlugin(source: RemotePluginSource): Promise<Plugin> {
		const cdnUrl = source.type === "github"
			? `https://cdn.jsdelivr.net/gh/${source.owner}/${source.repo}/${source.path}`
			: `https://cdn.jsdelivr.net/${source.type}/${source.owner}/${source.repo}/${source.path}`;

		const response = await fetch(cdnUrl);
		if (!response.ok) {
			throw new Error(
				`Failed to fetch plugin from ${cdnUrl}: ${response.statusText}`,
			);
		}

		const code = await response.text();
		// Create typed moduleExports object
		const moduleExports = {} as PluginModule;

		try {
			const moduleFactory = new Function(
				"exports",
				"require",
				"module",
				`${code}\n if (typeof exports.default !== 'object') throw new Error('No default export found');`,
			);
			moduleFactory(moduleExports, undefined, { exports: moduleExports });
		} catch (error) {
			throw new Error(
				`Failed to load plugin: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}

		if (!moduleExports.default || typeof moduleExports.default !== "object") {
			throw new Error("Remote plugin must have a default export");
		}

		return moduleExports.default;
	}

	private async loadPluginModule(resolvedPath: string): Promise<Plugin> {
		let pluginModule;

		if (resolvedPath.startsWith("https://jsr.io/")) {
			// Handle JSR modules
			const moduleName = resolvedPath.replace("https://jsr.io/", "");
			if (this.isValidPluginKey(moduleName)) {
				pluginModule = await PLUGIN_REGISTRY[moduleName].import();
				// Extract the first export that matches the Plugin interface
				const pluginExport = Object.values(pluginModule)[0] as Plugin;
				if (!pluginExport || !pluginExport.metadata) {
					throw new Error("No valid plugin export found");
				}
				return pluginExport;
			}
			throw new Error(`Unknown JSR module: ${moduleName}`);
		}

		// Handle local modules
		if (
			resolvedPath.startsWith("file://") || resolvedPath.includes("/plugins/")
		) {
			const localPath = resolvedPath
				.replace("file://", "")
				.split("/plugins/")[1]
				?.replace(/\.(ts|js)$/, "");

			if (localPath) {
				try {
					pluginModule = await import(`./plugins/${localPath}.ts`);
				} catch {
					if (resolvedPath.includes("tests/plugins/")) {
						pluginModule = await import(`../../tests/plugins/${localPath}.ts`);
					} else {
						throw new Error(`Unable to load plugin: ${localPath}`);
					}
				}
				return pluginModule.default;
			}
		}

		// Handle remote modules
		try {
			const url = new URL(resolvedPath);
			const remoteSource = this.parseRemoteUrl(url);
			if (remoteSource) {
				return await this.loadRemotePlugin(remoteSource);
			}
			throw new Error(`Unsupported plugin source: ${resolvedPath}`);
		} catch (error) {
			throw new Error(`Invalid plugin URL: ${resolvedPath}`);
		}
	}

	// Add type guard for plugin keys
	private isValidPluginKey(key: string): key is PluginKey {
		return key in PLUGIN_REGISTRY;
	}

	private async loadPluginFromPath(path: string, cli: CLI): Promise<Plugin> {
		try {
			const resolvedPath = await this.resolvePluginSource(path);
			cli.logger.debug(`Loading plugin from URL: ${resolvedPath}`);

			return await this.loadPluginModule(resolvedPath);
		} catch (error: unknown) {
			const e = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to import plugin: ${e}`);
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
