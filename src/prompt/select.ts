import { BasePrompt } from "./base.ts";
import { TTY } from "./tty.ts";
import type { KeyPressEvent, SelectOptions } from "./types.ts";

/**
 * A prompt that displays a list of selectable options and handles user interaction.
 *
 * @template T The type of the selected value.
 */

/**
 * Static method to display the selectable prompt.
 *
 * @param options - Configuration for the selectable prompt, including the message, options, and pointer.
 * @returns The value chosen by the user, or undefined if aborted.
 */

/**
 * Constructs a new Select instance.
 *
 * @param selectOptions - The configuration object for the selectable prompt.
 */

/**
 * Renders the prompt to the TTY, including the message, list of options, and optional search prompt.
 *
 * @remarks
 * This method is called whenever the prompt needs to be re-rendered, usually after user input.
 */

/**
 * Handles user keypress events to update the prompt state and selection.
 *
 * @param event - Contains details of the user keypress, including the pressed key.
 * @remarks
 * This method updates the selected index or filters options based on user input.
 */

/**
 * Filters the available selection options based on the current search term.
 *
 * @remarks
 * This resets the selection index to zero after filtering.
 */
export class Select extends BasePrompt<string> {
	private selectedIndex = 0;
	private searchTerm = "";
	private filteredOptions: Array<{ name: string; value: string }>;

	static async prompt(options: SelectOptions): Promise<string | undefined> {
		const prompt = new Select(options);
		return prompt.prompt();
	}

	constructor(private selectOptions: SelectOptions) {
		super(selectOptions);
		this.filteredOptions = [...selectOptions.options];
	}

	protected render(): void {
		TTY.clearLine();
		const message = `${
			this.selectOptions.prefix ?? "?"
		} ${this.selectOptions.message}\n`;
		const options = this.filteredOptions.map((opt, i) => {
			const pointer = i === this.selectedIndex
				? (this.selectOptions.pointer ?? "›")
				: " ";
			return `  ${pointer} ${opt.name}`;
		}).join("\n");

		const search = this.selectOptions.searchable
			? `\nSearch: ${this.searchTerm}`
			: "";

		TTY.write(`\r${message}${options}${search}`);

		// Move cursor back up
		const lines = this.filteredOptions.length +
			(this.selectOptions.searchable ? 1 : 0);
		TTY.moveCursor(0, -lines);
	}

	protected async handleKey(event: KeyPressEvent): Promise<void> {
		switch (true) {
			case event.ctrl && event.key === "c":
				this.state.aborted = true;
				this.state.done = true;
				break;

			case event.key === "return":
				this.state.value = this.filteredOptions[this.selectedIndex].value;
				this.state.done = true;
				break;

			case event.key === "up":
				this.selectedIndex = Math.max(0, this.selectedIndex - 1);
				break;

			case event.key === "down":
				this.selectedIndex = Math.min(
					this.filteredOptions.length - 1,
					this.selectedIndex + 1,
				);
				break;

			default:
				if (this.selectOptions.searchable && event.key.length === 1) {
					this.searchTerm += event.key;
					this.filterOptions();
				}
		}
	}

	private filterOptions(): void {
		if (this.searchTerm) {
			const searchTermLower = this.searchTerm.toLowerCase();
			this.filteredOptions = this.selectOptions.options.filter((opt) =>
				opt.name.toLowerCase().includes(searchTermLower)
			);
		} else {
			this.filteredOptions = [...this.selectOptions.options];
		}
		this.selectedIndex = 0;
	}
}
