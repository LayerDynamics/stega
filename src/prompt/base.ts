import { TTY } from "./tty.ts";
import type { KeyPressEvent, PromptOptions, PromptState } from "./types.ts";

/**
 * An abstract base class for creating command line prompts. It maintains the prompt
 * state, handles user input, and allows rendering and key handling to be customized
 * by subclasses.
 *
 * @template T The type of the value that the prompt returns upon successful completion.
 */

/**
 * @protected
 * Stores the current state of the prompt, including the typed value and control flags.
 */

/**
 * @constructor
 * Creates a new instance of the prompt.
 * @param options - Configuration object for the prompt, including optional validation
 * and transformation functions.
 */

/**
 * Renders the current state of the prompt to the console. Must be implemented by subclasses.
 * @protected
 * @abstract
 */

/**
 * Handles individual keypress events. Must be implemented by subclasses to customize
 * how user input is processed.
 * @protected
 * @abstract
 * @param key - An object describing the pressed key, including control and shift indicators.
 */

/**
 * Starts the prompt in raw mode, continuously reading input until the prompt is complete
 * or aborted. Validates the final input if a validation function is provided.
 *
 * @returns The validated and (optionally) transformed user input, or undefined if aborted.
 * @throws If validation fails, an error will be thrown.
 * @async
 */

/**
 * Initializes the prompt rendering process.
 * @protected
 * @async
 */

/**
 * Applies a transformation function to the user's input if one is provided in the prompt options.
 *
 * @returns The transformed user input.
 * @protected
 * @async
 */

/**
 * Reads raw key sequences from the terminal in raw mode.
 *
 * @returns An object describing the pressed key sequence.
 * @private
 * @async
 */

/**
 * Parses a raw character sequence to determine the specific key pressed and whether any
 * modifier keys (control, shift, or meta) were involved.
 *
 * @param sequence - The raw sequence of characters from the terminal.
 * @returns A key event object describing the pressed key.
 * @private
 */
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
