import { TTY } from "./tty.ts";
import type { KeyPressEvent, PromptOptions, PromptState } from "./types.ts";

export abstract class BasePrompt<T> {
	protected state: PromptState = {
		value: "",
		cursorOffset: 0,
		done: false,
		aborted: false,
	};

	constructor(protected options: PromptOptions) {}

	protected abstract render(): void;
	protected abstract handleKey(key: KeyPressEvent): Promise<void>;

	async prompt(): Promise<T | undefined> {
		try {
			await TTY.setRawMode(true);
			await this.startPrompt();

			while (!this.state.done) {
				const key = await this.readKey();
				await this.handleKey(key);
				if (!this.state.done) {
					this.render();
				}
			}

			if (this.state.aborted) {
				return undefined;
			}

			const value = await this.formatValue();
			if (this.options.validate) {
				const valid = await this.options.validate(String(value));
				if (valid !== true) {
					throw new Error(typeof valid === "string" ? valid : "Invalid input");
				}
			}

			return value as T;
		} finally {
			await TTY.restore();
			console.log(); // New line after prompt
		}
	}

	protected async startPrompt(): Promise<void> {
		this.render();
	}

	protected async formatValue(): Promise<unknown> {
		let value = this.state.value;
		if (this.options.transform) {
			value = await this.options.transform(value);
		}
		return value;
	}

	private async readKey(): Promise<KeyPressEvent> {
		const sequence = await TTY.read();
		return this.parseKey(sequence);
	}

	private parseKey(sequence: string): KeyPressEvent {
		/* eslint-disable-next-line no-control-regex */
		const key = sequence.replace(/[\x00-\x1F\x7F]/g, ""); // Updated regex to avoid control characters
		return {
			key,
			ctrl: sequence.charCodeAt(0) < 32,
			meta: false,
			shift: /[A-Z]/.test(key),
			sequence,
		};
	}
}
