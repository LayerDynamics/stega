import { BasePrompt } from "./base.ts";
import { TTY } from "./tty.ts";
import type { InputOptions, KeyPressEvent } from "./types.ts";

export class Input extends BasePrompt<string> {
	static async prompt(
		options: InputOptions | string,
	): Promise<string | undefined> {
		const opts = typeof options === "string" ? { message: options } : options;
		const prompt = new Input(opts);
		return prompt.prompt();
	}

	constructor(private inputOptions: InputOptions) {
		super(inputOptions);
	}

	protected render(): void {
		TTY.clearLine();
		const message = `${
			this.inputOptions.prefix ?? "?"
		} ${this.inputOptions.message} `;
		const value = this.inputOptions.secret
			? "•".repeat(this.state.value.length)
			: this.state.value;

		TTY.write(`\r${message}${value}`);

		// Move cursor to correct position
		if (this.state.cursorOffset > 0) {
			TTY.moveCursor(-this.state.cursorOffset, 0);
		}
	}

	protected async handleKey(event: KeyPressEvent): Promise<void> {
		switch (true) {
			case event.ctrl && event.key === "c":
				this.state.aborted = true;
				this.state.done = true;
				break;

			case event.key === "return":
				this.state.done = true;
				break;

			case event.key === "backspace":
				if (this.state.value.length > 0) {
					const pos = this.state.value.length - this.state.cursorOffset;
					this.state.value = this.state.value.slice(0, pos - 1) +
						this.state.value.slice(pos);
				}
				break;

			case event.key === "left":
				if (this.state.cursorOffset < this.state.value.length) {
					this.state.cursorOffset++;
				}
				break;

			case event.key === "right":
				if (this.state.cursorOffset > 0) {
					this.state.cursorOffset--;
				}
				break;

			default:
				if (event.key.length === 1) {
					const pos = this.state.value.length - this.state.cursorOffset;
					this.state.value = this.state.value.slice(0, pos) +
						event.key +
						this.state.value.slice(pos);
				}
		}
	}
}
