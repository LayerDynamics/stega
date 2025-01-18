// src/plugins/plugin_loader.ts
import { CLI } from "../core/core.ts";
import { logger } from "../logger/logger.ts";
import { Plugin, PluginMetadata } from "./plugin.ts";
import { PLUGIN_REGISTRY, PluginKey } from "./registry.ts";

export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ValidationError";
	}
}

export interface PluginSource {
	type: "local" | "remote" | "jsr";
	path: string;
}

export interface RemotePluginSource {
	type: "github" | "jsdelivr";
	owner: string;
	repo: string;
	path: string;
	ref?: string;
}

export interface PluginModule {
	default: Plugin;
}

/**
 * A class responsible for loading, managing, and unloading plugins in the application.
 * Supports loading plugins from local filesystem, remote URLs (GitHub, JSDelivr), and JSR registry.
 *
 * @class
 * @description
 * The PluginLoader handles:
 * - Loading plugins from various sources (local, remote, JSR)
 * - Validating plugin structure and dependencies
 * - Initializing plugins with CLI context
 * - Managing plugin lifecycle (load/unload)
 * - Tracking loaded plugins and their loading states
 *
 * @example
 * ```typescript
 * const loader = new PluginLoader();
 * await loader.loadPlugin('plugins/my-plugin.ts', cliInstance);
 * ```
 *
 * @property {Map<string, Plugin>} loadedPlugins - Map of loaded plugins keyed by plugin name
 * @property {Map<string, Promise<void>>} loadingPromises - Map of plugin loading promises
 * @property {string[]} allowedPaths - List of allowed paths for loading plugins
 *
 * @throws {ValidationError} When plugin loading or validation fails
 * @throws {Error} When plugin dependencies are missing or plugin structure is invalid
 */
export class PluginLoader {
	private loadedPlugins: Map<string, Plugin> = new Map();
	private loadingPromises: Map<string, Promise<void>> = new Map();
	private allowedPaths = [
		"src/",
		"tests/",
		"tests/fixtures/",
		"tests/plugins/",
	];

	/**
	 * Loads a plugin from the specified path and initializes it with the provided CLI instance.
	 *
	 * @param path - The file system path to the plugin
	 * @param cli - The CLI instance to be used for plugin initialization
	 * @throws {ValidationError} If the plugin fails to load, is invalid, or has missing dependencies
	 * @returns Promise that resolves when the plugin is successfully loaded and initialized
	 *
	 * The loading process includes:
	 * - Validating the plugin path
	 * - Loading the plugin module
	 * - Validating plugin structure and required fields
	 * - Checking for duplicate plugins
	 * - Validating plugin dependencies
	 * - Initializing the plugin
	 */
	async loadPlugin(path: string, cli: CLI): Promise<void> {
		const pluginName = this.getPluginName(path);
		try {
			cli.logger.debug(`Loading plugin from path: ${path}`);
			this.validatePluginPath(path);

			const normalizedPath = path.replace(/\\/g, "/");
			const plugin = await this.loadPluginFromPath(normalizedPath, cli);

			if (!this.validatePlugin(plugin)) {
				throw new Error(`Invalid plugin: missing required fields in ${path}`);
			}

			if (this.loadedPlugins.has(plugin.metadata.name)) {
				cli.logger.warn(`Plugin '${plugin.metadata.name}' is already loaded`);
				return;
			}

			await this.validateDependencies(plugin);
			await this.initializePlugin(plugin, cli);
		} catch (error: unknown) {
			const e = error instanceof Error ? error : new Error(String(error));
			throw new ValidationError(
				`Failed to load plugin ${pluginName}: ${e.message}`,
			);
		}
	}

	/**
	 * Type guard that validates if an unknown object is a valid Plugin.
	 *
	 * @param plugin - The object to validate as a Plugin
	 * @returns True if the object satisfies the Plugin interface requirements:
	 *          - Has a metadata object containing name and version properties
	 *          - Has an init method that is a function
	 */
	private validatePlugin(plugin: unknown): plugin is Plugin {
		return Boolean(
			plugin &&
				typeof plugin === "object" &&
				"metadata" in plugin &&
				typeof plugin.metadata === "object" &&
				plugin.metadata &&
				"name" in plugin.metadata &&
				"version" in plugin.metadata &&
				"init" in plugin &&
				typeof (plugin as Plugin).init === "function",
		);
	}

	private async validateDependencies(plugin: Plugin): Promise<void> {
		if (!plugin.metadata.dependencies?.length) {
			return;
		}

		for (const dep of plugin.metadata.dependencies) {
			if (!this.loadedPlugins.has(dep)) {
				throw new Error(`Missing dependency: ${dep}`);
			}
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
			case "remote":
				return source.path;
			case "jsr":
				return `https://jsr.io/${source.path}`;
			case "local": {
				const allowedDirs = ["plugins/", "tests/plugins/"];
				const isAllowed = allowedDirs.some((dir) => source.path.includes(dir));
				if (!isAllowed) {
					throw new Error(
						"Local plugins must be in plugins/ or tests/plugins/ directory",
					);
				}
				// Return the path directly without URL conversion
				return source.path;
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

		if (!moduleExports.default || !this.validatePlugin(moduleExports.default)) {
			throw new Error("Remote plugin must have a valid default export");
		}

		return moduleExports.default;
	}

	private isValidPluginKey(key: string): key is PluginKey {
		return key in PLUGIN_REGISTRY;
	}

	private async loadPluginModule(resolvedPath: string): Promise<Plugin> {
		// Handle test environment paths
		if (resolvedPath.includes("tests/plugins/")) {
			try {
				const cleanPath = resolvedPath.replace(/^file:\/\//, "");
				const relativePath = cleanPath.split("tests/plugins/")[1]?.replace(
					/\.(ts|js)$/,
					"",
				);

				if (!relativePath) {
					throw new Error("Invalid plugin path format");
				}

				// Use a static path that can be analyzed
				const module = await import(`../../tests/plugins/${relativePath}.ts`);

				if (!this.validatePlugin(module.default)) {
					throw new Error("Invalid plugin format");
				}
				return module.default;
			} catch (error) {
				throw new Error(`Unable to load plugin: ${error}`);
			}
		}

		// Handle JSR modules
		if (resolvedPath.startsWith("https://jsr.io/")) {
			const moduleName = resolvedPath.replace("https://jsr.io/", "");
			if (this.isValidPluginKey(moduleName)) {
				const pluginModule = await PLUGIN_REGISTRY[moduleName].import();
				const pluginExport = Object.values(pluginModule)[0] as Plugin;
				if (!this.validatePlugin(pluginExport)) {
					throw new Error("No valid plugin export found");
				}
				return pluginExport;
			}
			throw new Error(`Unknown JSR module: ${moduleName}`);
		}

		// Handle local plugins
		if (
			resolvedPath.startsWith("file://") || resolvedPath.includes("/plugins/")
		) {
			const normalizedPath = resolvedPath
				.replace("file://", "")
				.replace(/\\/g, "/");

			// Split into test and regular plugins
			if (normalizedPath.includes("/tests/plugins/")) {
				const localPath = normalizedPath
					.split("tests/plugins/")[1]
					?.replace(/\.(ts|js)$/, "");
				try {
					const module = await import(`../../tests/plugins/${localPath}.ts`);
					if (!this.validatePlugin(module.default)) {
						throw new Error("Invalid plugin format");
					}
					return module.default;
				} catch (error) {
					throw new Error(`Unable to load plugin from tests/plugins: ${error}`);
				}
			} else {
				const localPath = normalizedPath
					.split("/plugins/")[1]
					?.replace(/\.(ts|js)$/, "");
				try {
					const module = await import(`../plugins/${localPath}.ts`);
					if (!this.validatePlugin(module.default)) {
						throw new Error("Invalid plugin format");
					}
					return module.default;
				} catch (error) {
					throw new Error(`Unable to load plugin from plugins/: ${error}`);
				}
			}
		}

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

	getLoadedPlugins(): Plugin[] {
		return Array.from(this.loadedPlugins.values());
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

	private validatePluginPath(path: string): void {
		const normalizedPath = path.replace(/\\/g, "/");

		// Add support for test fixtures and temp files during tests
		const allowedPaths = [
			"plugins/",
			"tests/plugins/",
			"tests/fixtures/",
			"tests/fixtures/tmp/",
			"/tmp/",
		];

		const isValidPath = allowedPaths.some((prefix) =>
			normalizedPath.toLowerCase().includes(prefix.toLowerCase())
		);

		if (!isValidPath) {
			throw new Error(
				`Invalid plugin path: ${path}. Plugins must be in: ${
					allowedPaths.join(", ")
				}`,
			);
		}
	}
}
