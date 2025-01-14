import { Command } from '../core.ts';
import { logger } from '../logger.ts';
import ProgressBar from 'https://deno.land/x/progress@v1.3.8/mod.ts';

export const downloadCommand: Command = {
	name: 'download',
	description: 'Download a file from a URL',
	options: [
		{
			name: 'url',
			alias: 'u',
			type: 'string',
			description: 'URL to download from',
			required: true,
		},
		{
			name: 'output',
			alias: 'o',
			type: 'string',
			description: 'Output file path',
			required: false,
		},
	],
	action: async (args) => {
		const url = args.flags.url as string;
		const output = args.flags.output as string ||
			new URL(url).pathname.split('/').pop() || 'download';

		logger.info(`Downloading ${url} to ${output}`);

		try {
			const response = await fetch(url);
			if (!response.ok || !response.body) {
				throw new Error(`Failed to download: ${response.statusText}`);
			}

			const total = Number(response.headers.get('content-length')) || 0;
			const progress = new ProgressBar({
				title: 'Downloading',
				total,
				complete: '=',
				incomplete: '-',
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
				progress.render(downloaded);
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
