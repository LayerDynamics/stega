// src/prompts.ts
import { readLines } from "./io.ts";
import type { BasePromptOptions, DatePromptOptions } from "./types.ts";
export { ProgressBar, Spinner } from "./progress.ts";

type SelectOption = {
	value: string;
	label?: string;
};

/**
 * Prompts the user for a string input.
 * @param message The message to display.
 * @returns The user's input.
 */
export async function promptString(message: string): Promise<string> {
	const encoder = new TextEncoder();
	await Deno.stdout.write(encoder.encode(message + " "));

	for await (const line of readLines(Deno.stdin)) {
		return line.trim();
	}
	return "";
}

/**
 * Prompts the user for confirmation.
 * @param message The message to display.
 * @returns True if confirmed, false otherwise.
 */
export async function promptConfirm(message: string): Promise<boolean> {
	const response = await promptString(message + " (y/n)");
	return response.toLowerCase() === "y" || response.toLowerCase() === "yes";
}

/**
 * Prompts the user for a number input.
 * @param message The message to display.
 * @param defaultValue Optional default value
 * @returns The parsed number or null if invalid
 */
export async function promptNumber(
	message: string,
	defaultValue?: number,
): Promise<number | null> {
	const response = await promptString(
		`${message}${defaultValue ? ` (default: ${defaultValue})` : ""}`,
	);
	if (!response && defaultValue !== undefined) return defaultValue;
	const num = Number(response);
	return isNaN(num) ? null : num;
}

/**
 * Prompts for password (input is hidden)
 * @param message The message to display
 * @returns The password string
 */
export async function promptPassword(message: string): Promise<string> {
	const encoder = new TextEncoder();
	await Deno.stdout.write(encoder.encode(message + " "));

	// Password mode
	await Deno.stdin.setRaw(true);
	const buf = new Uint8Array(1024);
	const n = await Deno.stdin.read(buf);
	await Deno.stdin.setRaw(false);

	const password = new TextDecoder().decode(buf.subarray(0, n || 0)).trim();
	console.log(); // New line after password
	return password;
}

/**
 * Prompts user to select from a list of options
 * @param message The message to display
 * @param options Array of options to choose from
 * @returns The selected option value
 */
export async function promptSelect(
	message: string,
	options: SelectOption[],
): Promise<string> {
	console.log(message);
	options.forEach((opt, i) => {
		console.log(`${i + 1}) ${opt.label || opt.value}`);
	});

	while (true) {
		const response = await promptString("Enter number: ");
		const index = parseInt(response) - 1;
		if (index >= 0 && index < options.length) {
			return options[index].value;
		}
		console.log("Invalid selection. Please try again.");
	}
}

/**
 * Prompts for multiple selections from a list
 * @param message The message to display
 * @param options Array of options to choose from
 * @returns Array of selected values
 */
export async function promptMultiSelect(
	message: string,
	options: SelectOption[],
): Promise<string[]> {
	console.log(message);
	console.log("(Enter comma-separated numbers)");
	options.forEach((opt, i) => {
		console.log(`${i + 1}) ${opt.label || opt.value}`);
	});

	while (true) {
		const response = await promptString("Enter numbers: ");
		const selections = response.split(",").map((s) => parseInt(s.trim()) - 1);

		if (selections.every((i) => i >= 0 && i < options.length)) {
			return selections.map((i) => options[i].value);
		}
		console.log("Invalid selection. Please try again.");
	}
}

/**
 * Prompts for a date input
 * @param options The prompt options
 * @returns The parsed date or null if invalid
 */
export async function promptDate(
	options: DatePromptOptions,
): Promise<Date | null> {
	const response = await promptString(
		`${options.message}${options.format ? ` (${options.format})` : ""}`,
	);

	if (!response && options.defaultValue) {
		return options.defaultValue as Date;
	}

	const date = new Date(response);
	if (isNaN(date.getTime())) return null;

	if (options.min && date < options.min) return null;
	if (options.max && date > options.max) return null;

	return date;
}

/**
 * Creates an enhanced prompt with validation and formatting
 * @param options The prompt options
 * @returns The validated input
 */
export async function createPrompt<T>(options: BasePromptOptions): Promise<T> {
	while (true) {
		const response = await promptString(options.message);

		if (!response && options.defaultValue !== undefined) {
			return options.defaultValue as T;
		}

		if (options.validate) {
			const validationResult = await options.validate(response);
			if (typeof validationResult === "string") {
				console.log(validationResult);
				continue;
			}
			if (!validationResult) {
				console.log("Invalid input");
				continue;
			}
		}

		return response as T;
	}
}
