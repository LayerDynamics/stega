// tests/setup.ts

import { FileSystemTracker } from "./helpers/fs-tracker.ts";

// Run before all tests
Deno.test({
	name: "test setup",
	fn: () => {
		// Initialize the file system tracker
		FileSystemTracker.init();
	},
	sanitizeResources: false,
	sanitizeOps: false,
});

// Run after all tests
Deno.test({
	name: "test cleanup",
	fn: () => {
		// Print all file system operations that occurred during tests
		FileSystemTracker.printOperations();
		// Reset the tracker
		FileSystemTracker.reset();
	},
	sanitizeResources: false,
	sanitizeOps: false,
});
