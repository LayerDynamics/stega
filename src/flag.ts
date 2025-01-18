// src/flag.ts

// Core flag type definitions
export type FlagType = "string" | "number" | "boolean" | "array";
export type FlagValue = string | number | boolean | Array<string>;

/**
 * Converts a string value to the specified type.
 * @param value The string value to convert.
 * @param type The target type.
 * @returns The converted value.
 */
export function convertFlagValue(value: string, type: FlagType): FlagValue {
	switch (type) {
		case "boolean": {
			return value === "true" || value === "1";
		}
		case "number": {
			const num = Number(value);
			if (isNaN(num)) {
				throw new Error(`Invalid number value: ${value}`);
			}
			return num;
		}
		case "array": {
			return value.split(",");
		}
		case "string":
		default: {
			return value;
		}
	}
}
