// src/commands/init.ts
import { Command } from "../command.ts";
import { Args } from "../types.ts";
import { logger, setup } from "../logger.ts";
import { ConfigLoader } from "../config.ts";
import { I18n } from "../i18n.ts";
import type { LevelName } from "https://deno.land/std@0.224.0/log/levels.ts";

interface InitConfig {
	logLevel: string;
	configPath?: string;
	pluginsDir?: string;
	localeDir?: string;
	defaultLocale?: string;
}

export const initCommand: Command = {
	name: "init",
	description: "Initialize the application environment",
	options: [
		{
			name: "log-level",
			alias: "l",
			type: "string",
			description: "Set logging level (DEBUG, INFO, WARN, ERROR)",
			default: "INFO",
		},
		{
			name: "config",
			alias: "c",
			type: "string",
			description: "Path to config file",
		},
		{
			name: "plugins-dir",
			alias: "p",
			type: "string",
			description: "Directory containing plugins",
			default: "./plugins",
		},
		{
			name: "locale-dir",
			alias: "i",
			type: "string",
			description: "Directory containing locale files",
			default: "./locales",
		},
		{
			name: "default-locale",
			alias: "d",
			type: "string",
			description: "Default locale to use",
			default: "en",
		},
	],
	action: async (args: Args) => {
		try {
			logger.info("Starting initialization process...");

			// Extract configuration
			const config: InitConfig = {
				logLevel: (args.flags["log-level"] as string || "INFO").toUpperCase(),
				configPath: args.flags.config as string | undefined,
				pluginsDir: (args.flags["plugins-dir"] as string) || "./plugins",
				localeDir: (args.flags["locale-dir"] as string) || "./locales",
				defaultLocale: (args.flags["default-locale"] as string) || "en",
			};

			// Validate log level
			const validLogLevels = ["DEBUG", "INFO", "WARN", "ERROR"];
			if (!validLogLevels.includes(config.logLevel)) {
				throw new Error(
					`Invalid log level: ${config.logLevel}. Valid values are: ${
						validLogLevels.join(", ")
					}`,
				);
			}

			// Setup logging
			await setup({
				loggers: {
					default: {
						level: config.logLevel as LevelName,
						handlers: ["console"],
					},
				},
			});
			logger.info(`Logging configured at ${config.logLevel} level`);

			// Load configuration if provided
			if (config.configPath) {
				logger.info(`Loading configuration from ${config.configPath}`);
				const configLoader = new ConfigLoader(config.configPath);
				await configLoader.load();
			}

			// Set up locale directory
			try {
				const localeDir = config.localeDir || "./locales"; // Ensure non-null
				await Deno.mkdir(localeDir, { recursive: true });
				logger.info(`Locale directory ensured at ${localeDir}`);

				// Create default locale file if it doesn't exist
				const defaultLocalePath = `${localeDir}/${
					config.defaultLocale || "en"
				}.json`;
				try {
					await Deno.stat(defaultLocalePath);
				} catch {
					logger.info(`Creating default locale file at ${defaultLocalePath}`);
					const defaultLocale = {
						available_commands: "Available Commands:",
						use_help: "Use '{command} --help' for more information",
						command_not_found: 'Command "{command}" not found.',
						missing_required_flag: "Missing required flag: {flag}",
						invalid_flag_value: "Invalid value for flag '{flag}': {value}",
						command: "Command",
						options: "Options",
						help_text: "Shows help information",
						default: "default",
					};
					await Deno.writeTextFile(
						defaultLocalePath,
						JSON.stringify(defaultLocale, null, 2),
					);
				}
			} catch (error) {
				logger.error(
					`Failed to set up locale directory: ${
						error instanceof Error ? error.message : String(error)
					}`,
				);
				throw error;
			}

			// Set up plugins directory
			try {
				const pluginsDir = config.pluginsDir || "./plugins"; // Ensure non-null
				await Deno.mkdir(pluginsDir, { recursive: true });
				logger.info(`Plugins directory ensured at ${pluginsDir}`);
			} catch (error) {
				logger.error(
					`Failed to set up plugins directory: ${
						error instanceof Error ? error.message : String(error)
					}`,
				);
				throw error;
			}

			// Load plugins if any exist
			const cli = args.cli;
			try {
				const pluginFiles = [];
				const pluginsDir = config.pluginsDir || "./plugins"; // Ensure non-null

				for await (const entry of Deno.readDir(pluginsDir)) {
					if (
						entry.isFile &&
						(entry.name.endsWith(".ts") || entry.name.endsWith(".js"))
					) {
						pluginFiles.push(`${pluginsDir}/${entry.name}`);
					}
				}

				if (pluginFiles.length > 0) {
					logger.info(`Found ${pluginFiles.length} plugin(s)`);
					await cli.loadPlugins(pluginFiles);
				} else {
					logger.info("No plugins found");
				}
			} catch (error) {
				// Don't throw on plugin loading errors, just log them
				logger.warn(
					`Failed to load plugins: ${
						error instanceof Error ? error.message : String(error)
					}`,
				);
			}

			logger.info("Initialization completed successfully");
		} catch (error) {
			logger.error(
				`Initialization failed: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
			throw error;
		}
	},
};
