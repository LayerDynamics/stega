// /src/compiler/logger.ts

/**
 * Simple logger utility for the compiler.
 * Provides standardized logging methods for info, warning, and error messages.
 */
export const logger = {
	info: (...args: unknown[]) => {
		console.log("[INFO]", ...args);
	},
	warn: (...args: unknown[]) => {
		console.warn("[WARN]", ...args);
	},
	error: (...args: unknown[]) => {
		console.error("[ERROR]", ...args);
	},
};
