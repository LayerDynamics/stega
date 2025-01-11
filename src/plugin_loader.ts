// src/plugin_loader.ts
import { CLI } from "./core.ts"; // Import CLI
import { logger } from "./logger.ts"; // Import logger
import { Plugin, PluginMetadata } from "./plugin.ts"; // Import Plugin interface

export class PluginLoader {
    private loadedPlugins: Map<string, Plugin> = new Map();

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
            const module = await import(path);
            const plugin: Plugin = module.default;

            if (!plugin || !plugin.init || !plugin.metadata) {
                logger.warn(`Invalid plugin structure at ${path}`);
                return;
            }

            if (this.loadedPlugins.has(plugin.metadata.name)) {
                logger.warn(`Plugin '${plugin.metadata.name}' is already loaded`);
                return;
            }

            // Check dependencies
            if (plugin.metadata.dependencies?.length) {
                for (const dep of plugin.metadata.dependencies) {
                    if (!this.loadedPlugins.has(dep)) {
                        logger.warn(`Missing dependency: ${dep}`);
                        return;
                    }
                }
            }

            await plugin.init(cli);
            this.loadedPlugins.set(plugin.metadata.name, plugin);
            logger.info(`Loaded plugin: ${plugin.metadata.name} v${plugin.metadata.version}`);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Failed to load plugin: ${errorMessage}`);
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
        return Array.from(this.loadedPlugins.values()).map(p => p.metadata);
    }
}
