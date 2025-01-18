import { BasePrompt } from "./base.ts";
import { TTY } from "./tty.ts";
import type { InputOptions, KeyPressEvent } from "./types.ts";

/**
 * Represents an input-based prompt that extends BasePrompt to collect user input.
 *
 * @typeParam T - The type of the prompt value, defaults to string.
 * @remarks
 * This class handles rendering a message, optionally masking user input,
 * and capturing keyboard events to build the final input value. It also
 * includes logic for managing a cursor position within the input.
 */

/**
 * Displays a new prompt for user input.
 *
 * @param options - A string or an InputOptions object that specifies the prompt message and configuration.
 * @returns A promise that resolves to the user's input, or undefined if the prompt was aborted.
 */

/**
 * Constructs a new Input instance with the specified InputOptions.
 *
 * @param inputOptions - An object containing various configurations for the input prompt.
 */

/**
 * Renders the current input prompt and masked/unmasked user input to the terminal.
 * Clears the current line, writes the prompt message, and repositions the cursor.
 *
 * @internal
 */

/**
 * Handles keyboard events during the input prompt flow.
 * Supports special keys such as Ctrl+C to abort, Enter to finish,
 * Backspace to delete characters, and arrow keys to navigate the cursor.
 *
 * @param event - The keyboard event containing the pressed key and modifier state.
 * @internal
 */
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
