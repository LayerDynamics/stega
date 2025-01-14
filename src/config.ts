// src/config.ts
import type { FlagValue } from "./flag.ts";

export interface Config {
	[key: string]: FlagValue | undefined;
}

export class ConfigLoader {
	private config: Config = {};

	constructor(private configPath: string = "./config.json") {}

	/**
	 * Loads the configuration from the config file and environment variables.
	 * @returns The loaded configuration object.
	 */
	async load(): Promise<Config> {
		try {
			const data = await Deno.readTextFile(this.configPath);
			this.config = JSON.parse(data);
		} catch (error) {
			// If the config file doesn't exist, proceed with empty config
			if (error instanceof Deno.errors.NotFound) {
				this.config = {};
			} else {
				throw error;
			}
		}

		// Override with environment variables if present
		for (const key in Deno.env.toObject()) {
			const lowerKey = key.toLowerCase();
			if (lowerKey in this.config) {
				this.config[lowerKey] = Deno.env.get(key);
			}
		}

		return this.config;
	}

	/**
	 * Retrieves a configuration value by key.
	 * @param key The configuration key.
	 * @returns The configuration value.
	 */
	get(key: string): FlagValue | undefined {
		return this.config[key];
	}
}
