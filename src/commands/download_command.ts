import type { Command } from "../core/core.ts";
import { logger } from "../logger/logger.ts";
import { ProgressBar } from "../progress.ts";
import type { Args } from "../types/types.ts";

export const downloadCommand: Command = {
	name: "download",
	description: "Download a file from a URL",
	options: [
		{
			name: "url",
			alias: "u",
			type: "string",
			description: "URL to download from",
			required: true,
		},
		{
			name: "output",
			alias: "o",
			type: "string",
			description: "Output file path",
			required: false,
		},
	],
	action: async (args: Args) => {
		const url = args.flags.url as string;
		const output = args.flags.output as string ||
			new URL(url).pathname.split("/").pop() || "download";

		logger.info(`Downloading ${url} to ${output}`);

		try {
			const response = await fetch(url);
			if (!response.ok || !response.body) {
				throw new Error(`Failed to download: ${response.statusText}`);
			}

			const total = Number(response.headers.get("content-length")) || 0;
			const progress = new ProgressBar({
				total,
				width: 40,
				complete: "=",
				incomplete: "-",
				format: "[:bar] :percent% :text",
			});

			const file = await Deno.open(output, { write: true, create: true });
			const writer = file.writable.getWriter();

			let downloaded = 0;
			const reader = response.body.getReader();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				await writer.write(value);
				downloaded += value.length;
				progress.update(downloaded, "Downloading...");
			}

			await writer.close();
			file.close();
			logger.info(`Download completed: ${output}`);
		} catch (error: unknown) {
			const errorMessage = error instanceof Error
				? error.message
				: String(error);
			logger.error(`Download failed: ${errorMessage}`);
			throw error;
		}
	},
};
