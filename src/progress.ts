import type { ProgressBarOptions, SpinnerOptions } from "./types.ts";

export class ProgressBar {
	private current = 0;
	private options: Required<ProgressBarOptions>;

	constructor(options: ProgressBarOptions) {
		this.options = {
			width: 40,
			complete: "=",
			incomplete: "-",
			format: "[:bar] :percent% :text",
			...options,
		};
	}

	update(current: number, text = ""): void {
		this.current = current;
		const percent = Math.min(
			Math.floor((current / this.options.total) * 100),
			100,
		);
		const completeLength = Math.round(
			(this.options.width * current) / this.options.total,
		);
		const bar = this.options.complete.repeat(completeLength) +
			this.options.incomplete.repeat(
				Math.max(0, this.options.width - completeLength),
			);

		const output = this.options.format
			.replace(":bar", bar)
			.replace(":percent", percent.toString())
			.replace(":text", text);

		Deno.stdout.writeSync(new TextEncoder().encode(`\r${output}`));
	}
}

export class Spinner {
	private frameIndex = 0;
	private interval!: number; // Use definite assignment assertion
	private running = false;
	private readonly defaultFrames = [
		"⠋",
		"⠙",
		"⠹",
		"⠸",
		"⠼",
		"⠴",
		"⠦",
		"⠧",
		"⠇",
		"⠏",
	];
	private readonly defaultInterval = 80;

	constructor(private options: SpinnerOptions = {}) {
		this.options.frames = this.options.frames ?? this.defaultFrames;
		this.options.interval = this.options.interval ?? this.defaultInterval;
	}

	start(text?: string): void {
		this.running = true;
		this.render(text);
	}

	stop(): void {
		this.running = false;
		Deno.stdout.writeSync(new TextEncoder().encode("\r\x1b[K"));
	}

	private render(text = ""): void {
		if (!this.running) return;
		const frame = this.options.frames![this.frameIndex];
		Deno.stdout.writeSync(new TextEncoder().encode(`\r${frame} ${text}`));
		this.frameIndex = (this.frameIndex + 1) % this.options.frames!.length;
		setTimeout(() => this.render(text), this.options.interval);
	}
}
