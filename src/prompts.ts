// src/prompts.ts
import {
	Confirm,
	Input,
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/mod.ts";

/**
 * Prompts the user for a string input.
 * @param message The message to display.
 * @returns The user's input.
 */
export async function promptString(message: string): Promise<string> {
	return await Input.prompt(message);
}

/**
 * Prompts the user for confirmation.
 * @param message The message to display.
 * @returns True if confirmed, false otherwise.
 */
export async function promptConfirm(message: string): Promise<boolean> {
	return await Confirm.prompt(message);
}
