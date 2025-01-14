// src/commands/build.ts
import { Command } from "../command.ts";
import { CLI } from "../core.ts";
import { FlagValue } from "../flag.ts";
import { CommandNotFoundError } from "../error.ts";
import type { Args, BuildOptions } from "../types.ts"; // Correct import
import { logger } from "../logger.ts";
import {
	Input,
	Select,
} from "jsr:@cliffy/prompt@1.0.0-rc.3";
import type { Plugin } from "../plugin.ts";

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
			const output = args.flags.output as string;
			let target = args.flags.target as string;
			const allowPermissions = args.flags.allow as string[];
			const entry = args.flags.entry as string;

			if (!output) {
				// If output not provided, prompt the user
				// This requires 'cliffy' or similar for interactive prompts
				// For simplicity, let's set a default
			}

			if (!target) {
				target = await Select.prompt({
					message: "Select target platform:",
					options: [
						{ name: "Linux", value: "linux" },
						{ name: "Windows", value: "windows" },
						{ name: "macOS", value: "darwin" },
					],
				});
			}

			if (target in targetAliases) {
				target = targetAliases[target];
				logger.info(`Using target: ${target}`);
			}

			if (!supportedTargets.includes(target)) {
				logger.error(`Unsupported target: ${target}`);
				throw new Error(`Unsupported target: ${target}`);
			}

			for (const perm of allowPermissions) {
				if (!validPermissions.includes(perm)) {
					logger.warn(`Unrecognized permission: --allow-${perm}`);
				}
			}

			const buildOptions: BuildOptions = {
				output,
				target,
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
