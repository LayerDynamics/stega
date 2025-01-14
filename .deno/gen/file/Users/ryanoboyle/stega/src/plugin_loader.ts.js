// src/plugin_loader.ts
import { logger } from "./logger.ts"; // Import logger
export class PluginLoader {
  loadedPlugins = new Map();
  loadingPromises = new Map();
  // ...existing code...
  /**
	 * Retrieves all loaded plugins.
	 * @returns An array of loaded plugins.
	 */ getLoadedPlugins() {
    return Array.from(this.loadedPlugins.values());
  }
  // ...existing methods...
  async loadPlugin(path, cli) {
    try {
      cli.logger.debug(`Loading plugin from path: ${path}`);
      const module = await import(path);
      const plugin = module.default;
      cli.logger.debug(`Loaded plugin module: ${JSON.stringify(plugin.metadata || {})}`);
      if (!plugin.metadata?.name) {
        throw new Error(`Invalid plugin: missing metadata.name in ${path}`);
      }
      if (this.loadedPlugins.has(plugin.metadata.name)) {
        cli.logger.warn(`Plugin '${plugin.metadata.name}' is already loaded`);
        return;
      }
      // Create initialization promise
      const initPromise = (async ()=>{
        try {
          cli.logger.debug(`Initializing plugin: ${plugin.metadata.name}`);
          await plugin.init?.(cli);
          cli.logger.info(`Loaded plugin: ${plugin.metadata.name} v${plugin.metadata.version}`);
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
  async unloadPlugin(name, cli) {
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
  listPlugins() {
    return Array.from(this.loadedPlugins.values()).map((p)=>p.metadata);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvcGx1Z2luX2xvYWRlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBzcmMvcGx1Z2luX2xvYWRlci50c1xuaW1wb3J0IHsgQ0xJIH0gZnJvbSBcIi4vY29yZS50c1wiOyAvLyBJbXBvcnQgQ0xJXG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tIFwiLi9sb2dnZXIudHNcIjsgLy8gSW1wb3J0IGxvZ2dlclxuaW1wb3J0IHsgUGx1Z2luLCBQbHVnaW5NZXRhZGF0YSB9IGZyb20gXCIuL3BsdWdpbi50c1wiOyAvLyBJbXBvcnQgUGx1Z2luIGludGVyZmFjZVxuXG5leHBvcnQgY2xhc3MgUGx1Z2luTG9hZGVyIHtcblx0cHJpdmF0ZSBsb2FkZWRQbHVnaW5zOiBNYXA8c3RyaW5nLCBQbHVnaW4+ID0gbmV3IE1hcCgpO1xuXHRwcml2YXRlIGxvYWRpbmdQcm9taXNlczogTWFwPHN0cmluZywgUHJvbWlzZTx2b2lkPj4gPSBuZXcgTWFwKCk7XG5cblx0Ly8gLi4uZXhpc3RpbmcgY29kZS4uLlxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgYWxsIGxvYWRlZCBwbHVnaW5zLlxuXHQgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBsb2FkZWQgcGx1Z2lucy5cblx0ICovXG5cdGdldExvYWRlZFBsdWdpbnMoKTogUGx1Z2luW10ge1xuXHRcdHJldHVybiBBcnJheS5mcm9tKHRoaXMubG9hZGVkUGx1Z2lucy52YWx1ZXMoKSk7XG5cdH1cblxuXHQvLyAuLi5leGlzdGluZyBtZXRob2RzLi4uXG5cblx0YXN5bmMgbG9hZFBsdWdpbihwYXRoOiBzdHJpbmcsIGNsaTogQ0xJKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGNsaS5sb2dnZXIuZGVidWcoYExvYWRpbmcgcGx1Z2luIGZyb20gcGF0aDogJHtwYXRofWApO1xuXG5cdFx0XHRjb25zdCBtb2R1bGUgPSBhd2FpdCBpbXBvcnQocGF0aCk7XG5cdFx0XHRjb25zdCBwbHVnaW46IFBsdWdpbiA9IG1vZHVsZS5kZWZhdWx0O1xuXG5cdFx0XHRjbGkubG9nZ2VyLmRlYnVnKFxuXHRcdFx0XHRgTG9hZGVkIHBsdWdpbiBtb2R1bGU6ICR7SlNPTi5zdHJpbmdpZnkocGx1Z2luLm1ldGFkYXRhIHx8IHt9KX1gLFxuXHRcdFx0KTtcblxuXHRcdFx0aWYgKCFwbHVnaW4ubWV0YWRhdGE/Lm5hbWUpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHBsdWdpbjogbWlzc2luZyBtZXRhZGF0YS5uYW1lIGluICR7cGF0aH1gKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHRoaXMubG9hZGVkUGx1Z2lucy5oYXMocGx1Z2luLm1ldGFkYXRhLm5hbWUpKSB7XG5cdFx0XHRcdGNsaS5sb2dnZXIud2FybihgUGx1Z2luICcke3BsdWdpbi5tZXRhZGF0YS5uYW1lfScgaXMgYWxyZWFkeSBsb2FkZWRgKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBDcmVhdGUgaW5pdGlhbGl6YXRpb24gcHJvbWlzZVxuXHRcdFx0Y29uc3QgaW5pdFByb21pc2UgPSAoYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGNsaS5sb2dnZXIuZGVidWcoYEluaXRpYWxpemluZyBwbHVnaW46ICR7cGx1Z2luLm1ldGFkYXRhLm5hbWV9YCk7XG5cdFx0XHRcdFx0YXdhaXQgcGx1Z2luLmluaXQ/LihjbGkpO1xuXHRcdFx0XHRcdGNsaS5sb2dnZXIuaW5mbyhcblx0XHRcdFx0XHRcdGBMb2FkZWQgcGx1Z2luOiAke3BsdWdpbi5tZXRhZGF0YS5uYW1lfSB2JHtwbHVnaW4ubWV0YWRhdGEudmVyc2lvbn1gLFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0Ly8gTWFyayBDTEkgYXMgcmVhZHkgYWZ0ZXIgcGx1Z2luIGluaXRpYWxpemF0aW9uXG5cdFx0XHRcdFx0Y2xpLm1hcmtBc1JlYWR5KCk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdGNsaS5sb2dnZXIuZXJyb3IoYFBsdWdpbiBpbml0aWFsaXphdGlvbiBmYWlsZWQ6ICR7ZXJyb3J9YCk7XG5cdFx0XHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0XHRcdH1cblx0XHRcdH0pKCk7XG5cblx0XHRcdHRoaXMubG9hZGluZ1Byb21pc2VzLnNldChwbHVnaW4ubWV0YWRhdGEubmFtZSwgaW5pdFByb21pc2UpO1xuXHRcdFx0dGhpcy5sb2FkZWRQbHVnaW5zLnNldChwbHVnaW4ubWV0YWRhdGEubmFtZSwgcGx1Z2luKTtcblxuXHRcdFx0Ly8gV2FpdCBmb3IgaW5pdGlhbGl6YXRpb24gdG8gY29tcGxldGVcblx0XHRcdGF3YWl0IGluaXRQcm9taXNlO1xuXHRcdFx0Y2xpLmxvZ2dlci5kZWJ1ZyhgUGx1Z2luICR7cGx1Z2luLm1ldGFkYXRhLm5hbWV9IGZ1bGx5IGxvYWRlZGApO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjbGkubG9nZ2VyLmVycm9yKGBGYWlsZWQgdG8gbG9hZCBwbHVnaW4gZnJvbSAke3BhdGh9OiAke2Vycm9yfWApO1xuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgdW5sb2FkUGx1Z2luKG5hbWU6IHN0cmluZywgY2xpOiBDTEkpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBwbHVnaW4gPSB0aGlzLmxvYWRlZFBsdWdpbnMuZ2V0KG5hbWUpO1xuXHRcdGlmICghcGx1Z2luKSB7XG5cdFx0XHRsb2dnZXIud2FybihgUGx1Z2luICcke25hbWV9JyBub3QgZm91bmRgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAocGx1Z2luLnVubG9hZCkge1xuXHRcdFx0YXdhaXQgcGx1Z2luLnVubG9hZChjbGkpO1xuXHRcdH1cblx0XHR0aGlzLmxvYWRlZFBsdWdpbnMuZGVsZXRlKG5hbWUpO1xuXHRcdGxvZ2dlci5pbmZvKGBVbmxvYWRlZCBwbHVnaW46ICR7bmFtZX1gKTtcblx0fVxuXG5cdGxpc3RQbHVnaW5zKCk6IFBsdWdpbk1ldGFkYXRhW10ge1xuXHRcdHJldHVybiBBcnJheS5mcm9tKHRoaXMubG9hZGVkUGx1Z2lucy52YWx1ZXMoKSkubWFwKChwKSA9PiBwLm1ldGFkYXRhKTtcblx0fVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHVCQUF1QjtBQUV2QixTQUFTLE1BQU0sUUFBUSxjQUFjLENBQUMsZ0JBQWdCO0FBR3RELE9BQU8sTUFBTTtFQUNKLGdCQUFxQyxJQUFJLE1BQU07RUFDL0Msa0JBQThDLElBQUksTUFBTTtFQUVoRSxzQkFBc0I7RUFFdEI7OztFQUdDLEdBQ0QsbUJBQTZCO0lBQzVCLE9BQU8sTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNO0VBQzVDO0VBRUEseUJBQXlCO0VBRXpCLE1BQU0sV0FBVyxJQUFZLEVBQUUsR0FBUSxFQUFpQjtJQUN2RCxJQUFJO01BQ0gsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsMEJBQTBCLEVBQUUsS0FBSyxDQUFDO01BRXBELE1BQU0sU0FBUyxNQUFNLE1BQU0sQ0FBQztNQUM1QixNQUFNLFNBQWlCLE9BQU8sT0FBTztNQUVyQyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQ2YsQ0FBQyxzQkFBc0IsRUFBRSxLQUFLLFNBQVMsQ0FBQyxPQUFPLFFBQVEsSUFBSSxDQUFDLEdBQUcsQ0FBQztNQUdqRSxJQUFJLENBQUMsT0FBTyxRQUFRLEVBQUUsTUFBTTtRQUMzQixNQUFNLElBQUksTUFBTSxDQUFDLHlDQUF5QyxFQUFFLEtBQUssQ0FBQztNQUNuRTtNQUVBLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsT0FBTyxRQUFRLENBQUMsSUFBSSxHQUFHO1FBQ2pELElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUM7UUFDcEU7TUFDRDtNQUVBLGdDQUFnQztNQUNoQyxNQUFNLGNBQWMsQ0FBQztRQUNwQixJQUFJO1VBQ0gsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMscUJBQXFCLEVBQUUsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7VUFDL0QsTUFBTSxPQUFPLElBQUksR0FBRztVQUNwQixJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQ2QsQ0FBQyxlQUFlLEVBQUUsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxPQUFPLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztVQUVyRSxnREFBZ0Q7VUFDaEQsSUFBSSxXQUFXO1VBQ2Y7UUFDRCxFQUFFLE9BQU8sT0FBTztVQUNmLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLDhCQUE4QixFQUFFLE1BQU0sQ0FBQztVQUN6RCxNQUFNO1FBQ1A7TUFDRCxDQUFDO01BRUQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsT0FBTyxRQUFRLENBQUMsSUFBSSxFQUFFO01BQy9DLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLE9BQU8sUUFBUSxDQUFDLElBQUksRUFBRTtNQUU3QyxzQ0FBc0M7TUFDdEMsTUFBTTtNQUNOLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sRUFBRSxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO0lBQy9ELEVBQUUsT0FBTyxPQUFPO01BQ2YsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsMkJBQTJCLEVBQUUsS0FBSyxFQUFFLEVBQUUsTUFBTSxDQUFDO01BQy9ELE1BQU07SUFDUDtFQUNEO0VBRUEsTUFBTSxhQUFhLElBQVksRUFBRSxHQUFRLEVBQWlCO0lBQ3pELE1BQU0sU0FBUyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQztJQUN0QyxJQUFJLENBQUMsUUFBUTtNQUNaLE9BQU8sSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLEtBQUssV0FBVyxDQUFDO01BQ3hDO0lBQ0Q7SUFFQSxJQUFJLE9BQU8sTUFBTSxFQUFFO01BQ2xCLE1BQU0sT0FBTyxNQUFNLENBQUM7SUFDckI7SUFDQSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQztJQUMxQixPQUFPLElBQUksQ0FBQyxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQztFQUN2QztFQUVBLGNBQWdDO0lBQy9CLE9BQU8sTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsSUFBTSxFQUFFLFFBQVE7RUFDckU7QUFDRCJ9
// denoCacheMetadata=11587395895520610470,1689812851085938359