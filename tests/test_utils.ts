// tests/test_utils.ts
// Import assertions and testing utilities
export {
	assertEquals,
	assertExists,
	assertThrows,
	assertArrayIncludes
} from "https://deno.land/std@0.224.0/assert/mod.ts";

// Import project types and classes
import type {ILogger} from "../src/logger_interface.ts";
import {CLI} from "../src/core.ts";

// Re-export imported types and classes
export type {ILogger};
export {CLI};

// Standard mock logger implementation
export const mockLogger: ILogger={
	info: () => {},
	error: () => {},
	debug: () => {},
	warn: () => {},
};

// Helper function to create mock CLI instances
export function createMockCLI(): CLI {
	return new CLI(undefined,true,true,mockLogger);
}
