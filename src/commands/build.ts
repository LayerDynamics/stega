// src/commands/build.ts
import {Command} from "../core.ts";
import {CLI} from "../core.ts";
import {logger} from "../logger.ts";
import {Args} from "../core.ts";
import {Input,Select} from "https://deno.land/x/cliffy@v0.25.7/prompt/mod.ts";
import type {Plugin as _Plugin,BuildOptions} from "../plugin.ts";

// Constants for supported targets and permissions
const supportedTargets=[
	"x86_64-unknown-linux-gnu",
	"x86_64-pc-windows-msvc",
	"x86_64-apple-darwin",
	"aarch64-unknown-linux-gnu",
	"aarch64-pc-windows-msvc",
	"aarch64-apple-darwin",
];

const validPermissions=[
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

const targetAliases: Record<string,string>={
	linux: "x86_64-unknown-linux-gnu",
	windows: "x86_64-pc-windows-msvc",
	darwin: "x86_64-apple-darwin",
};

export const buildCommand: Command={
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
		const cli=args.cli as CLI;
		if(!cli) throw new Error("CLI instance is required");

		let output=args.flags.output as string;
		let target=args.flags.target as string;
		const allowPermissions=args.flags.allow as string[];
		const entry=args.flags.entry as string;

		// Handle interactive input if needed
		if(!output) {
			output=await Input.prompt({
				message: "Enter output binary path:",
				default: "./stega",
			});
		}

		if(!target) {
			target=await Select.prompt({
				message: "Select target platform:",
				options: [
					{name: "Linux",value: "linux"},
					{name: "Windows",value: "windows"},
					{name: "macOS",value: "darwin"},
				],
			});
		}

		// Resolve target alias
		if(target in targetAliases) {
			target=targetAliases[target];
			logger.info(`Using target: ${target}`);
		}

		// Validate target
		if(!supportedTargets.includes(target)) {
			logger.error(`Unsupported target: ${target}`);
			logger.info(`Supported targets: ${supportedTargets.join(", ")}`);
			Deno.exit(1);
		}

		// Validate permissions
		for(const perm of allowPermissions) {
			if(!validPermissions.includes(perm)) {
				logger.warn(`Unrecognized permission: --allow-${perm}`);
			}
		}

		const buildOptions: BuildOptions={
			output,
			target,
			allowPermissions,
			entry,
		};

		try {
			const plugins=cli.getLoadedPlugins?.()||[];

			// Execute beforeBuild hooks
			for(const plugin of plugins) {
				if(plugin.beforeBuild) {
					const result=await plugin.beforeBuild(buildOptions);
					// undefined (void) means continue, only explicit false cancels
					if(result!==undefined&&result===false) {
						throw new Error("Build cancelled by plugin");
					}
				}
			}

			// Execute build
			const success=await executeBuild(buildOptions);

			// Execute afterBuild hooks
			await Promise.all(
				plugins.map(async (plugin) => {
					if(plugin.afterBuild) {
						await plugin.afterBuild(buildOptions,success);
					}
				})
			);

			if(!success) {
				Deno.exit(1);
			}
		} catch(error) {
			logger.error(
				`Build failed: ${error instanceof Error? error.message:String(error)
				}`
			);
			// Call plugin afterBuild hooks with failure
			const plugins=cli.getLoadedPlugins?.()||[];
			await Promise.all(
				plugins.map(async (plugin) => {
					if(plugin.afterBuild) {
						await plugin.afterBuild(buildOptions,false);
					}
				})
			);
			throw error;
		}
	},
};

async function executeBuild(options: BuildOptions): Promise<boolean> {
	const commandArgs=[
		"compile",
		...options.allowPermissions.map((p) => `--allow-${p}`),
		`--target=${options.target}`,
		`--output=${options.output}`,
		options.entry,
	];

	const commandOptions: Deno.CommandOptions={
		args: commandArgs,
		stdout: "inherit",
		stderr: "inherit",
	};

	const command=new Deno.Command("deno",commandOptions);

	const process=command.spawn();
	const status=await process.status;

	if(status.success) {
		logger.info(`Successfully created binary: ${options.output}`);
	} else {
		logger.error("Build failed");
	}

	return status.success;
}
