// src/commands/build.ts
import { Command } from "../command.ts";
import { CLI } from "../core/core.ts";
import { convertFlagValue, FlagValue } from "../flag.ts";
import { CommandNotFoundError } from "../error.ts";
import type { Args, BuildOptions } from "../types/types.ts"; // Correct import
import { logger } from "../logger/logger.ts";
import { promptSelect } from "../prompts.ts";
import type { Plugin } from "../plugins/plugin.ts"; // Updated import path

const supportedTargets = [
	"x86_64-unknown-linux-gnu",
	"x86_64-pc-windows-msvc",
	"x86_64-apple-darwin",
];

const validPermissions = [
	"read",
	"write",
	"net",
	"env",
	"run",
	"ffi",
	"hrtime",
	"plugin",
	"unstable",
];

const targetAliases: Record<string, string> = {
	linux: "x86_64-unknown-linux-gnu",
	windows: "x86_64-pc-windows-msvc",
	darwin: "x86_64-apple-darwin",
};

async function runPluginHooks(
	plugins: Plugin[],
	hookName: "beforeBuild" | "afterBuild",
	buildOptions: BuildOptions,
	success?: boolean,
): Promise<boolean> {
	for (const plugin of plugins) {
		try {
			if (hookName === "beforeBuild" && plugin.beforeBuild) {
				const result = await plugin.beforeBuild(buildOptions);
				if (result === false) {
					logger.info(`Build cancelled by plugin: ${plugin.metadata.name}`);
					return false;
				}
			} else if (hookName === "afterBuild" && plugin.afterBuild) {
				await plugin.afterBuild(buildOptions, success ?? false);
			}
		} catch (error) {
			logger.error(
				`Plugin ${plugin.metadata.name} ${hookName} hook failed: ${error}`,
			);
			if (hookName === "beforeBuild") return false;
		}
	}
	return true;
}

/**
 * Factory function to create the build command with access to the CLI instance.
 * @param cli The CLI instance.
 * @returns A Command object.
 */
export function createBuildCommand(cli: CLI): Command {
	return {
		name: "build",
		description: "Compile the CLI into a standalone binary executable",
		options: [
			{
				name: "output",
				alias: "o",
				type: "string",
				description: "Path for the output binary",
				required: false,
				default: "./stega",
			},
			{
				name: "target",
				alias: "t",
				type: "string",
				description: "Target platform (linux, windows, darwin)",
				required: false,
			},
			{
				name: "allow",
				alias: "A",
				type: "array",
				description: "Permissions to embed (read, write, net, etc.)",
				required: false,
				default: [],
			},
			{
				name: "entry",
				alias: "e",
				type: "string",
				description: "Entry point file",
				required: false,
				default: "src/main.ts",
			},
		],
		action: async (args: Args): Promise<void> => {
			// Convert flag values with proper type casting
			const output = String(args.flags.output ?? "./stega");
			let targetValue = String(args.flags.target ?? "");
			const allowPermissions = Array.isArray(args.flags.allow)
				? args.flags.allow.map(String)
				: [];
			const entry = String(args.flags.entry ?? "src/main.ts");

			// Validate values
			if (!output) {
				throw new Error("Output flag must not be empty");
			}

			if (!targetValue) {
				targetValue = await promptSelect("Select target platform:", [
					{ value: "linux", label: "Linux" },
					{ value: "windows", label: "Windows" },
					{ value: "darwin", label: "macOS" },
				]) || "linux";
			}

			// Validate array contents
			if (
				!Array.isArray(allowPermissions) ||
				!allowPermissions.every((p) => typeof p === "string")
			) {
				throw new Error("Allow permissions must be an array of strings");
			}

			if (typeof entry !== "string") {
				throw new Error("Entry flag must be a string");
			}

			if (targetValue in targetAliases) {
				targetValue = targetAliases[targetValue];
				logger.info(`Using target: ${targetValue}`);
			}

			if (!supportedTargets.includes(targetValue)) {
				logger.error(`Unsupported target: ${targetValue}`);
				throw new Error(`Unsupported target: ${targetValue}`);
			}

			for (const perm of allowPermissions) {
				if (!validPermissions.includes(perm)) {
					logger.warn(`Unrecognized permission: --allow-${perm}`);
				}
			}

			const buildOptions: BuildOptions = {
				output,
				target: targetValue,
				allowPermissions,
				entry,
			};

			const plugins = cli.getLoadedPlugins?.() || [];

			try {
				// Execute beforeBuild hooks
				const shouldContinue = await runPluginHooks(
					plugins,
					"beforeBuild",
					buildOptions,
				);
				if (!shouldContinue) {
					throw new Error("Build cancelled by plugin");
				}

				const success = await executeBuild(buildOptions);

				// Execute afterBuild hooks
				await runPluginHooks(plugins, "afterBuild", buildOptions, success);

				if (!success) {
					throw new Error("Build failed");
				}
			} catch (error) {
				logger.error(
					`Build failed: ${
						error instanceof Error ? error.message : String(error)
					}`,
				);

				// Call plugin afterBuild hooks with failure
				await runPluginHooks(plugins, "afterBuild", buildOptions, false);

				throw error;
			}
		},
	};
}

async function executeBuild(options: BuildOptions): Promise<boolean> {
	const commandArgs = [
		"compile",
		...options.allowPermissions.map((p: string) => `--allow-${p}`),
		`--target=${options.target}`,
		`--output=${options.output}`,
		options.entry,
	];

	const commandOptions: Deno.CommandOptions = {
		args: commandArgs,
		stdout: "inherit",
		stderr: "inherit",
	};

	const command = new Deno.Command("deno", commandOptions);
	const process = command.spawn();
	const status = await process.status;

	if (status.success) {
		logger.info(`Successfully created binary: ${options.output}`);
	} else {
		logger.error("Build failed");
	}

	return status.success;
}
