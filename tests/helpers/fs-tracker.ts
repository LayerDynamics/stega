// tests/helpers/fs-tracker.ts

import {logger} from "../../src/logger.ts";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import {SEPARATOR} from "https://deno.land/std@0.224.0/path/separator.ts";

export class FileSystemTracker {
	private static operations: Map<string,string[]>=new Map();
	private static originalRmSync=Deno.removeSync;
	private static originalRm=Deno.remove;

	// List of protected directories
	private static protectedDirs: string[]=[
		path.resolve("src"),
		path.resolve("/src"),
		// Add other directories you want to protect
	];

	static init() {
		// Track synchronous removals
		Deno.removeSync=function(pathToRemove: string|URL,options?: Deno.RemoveOptions) {
			const resolvedPath=path.resolve(pathToRemove.toString());
			FileSystemTracker.logOperation('removeSync',resolvedPath);

			if(FileSystemTracker.isProtectedPath(resolvedPath)) {
				logger.warn(`Attempted to remove protected directory or file: ${resolvedPath}`);
				throw new Error(`Protected directory removal attempted: ${resolvedPath}`);
			}

			return FileSystemTracker.originalRmSync.call(Deno,pathToRemove,options);
		};

		// Track asynchronous removals
		Deno.remove = function(pathToRemove: string|URL, options?: Deno.RemoveOptions): Promise<void> {
			const resolvedPath = path.resolve(pathToRemove.toString());
			FileSystemTracker.logOperation('remove', resolvedPath);

			if(FileSystemTracker.isProtectedPath(resolvedPath)) {
				logger.warn(`Attempted to remove protected directory or file: ${resolvedPath}`);
				return Promise.reject(new Error(`Protected directory removal attempted: ${resolvedPath}`));
			}

			return FileSystemTracker.originalRm.call(Deno, pathToRemove, options);
		};
	}

	static reset() {
		// Restore original functions
		Deno.removeSync=FileSystemTracker.originalRmSync;
		Deno.remove=FileSystemTracker.originalRm;
		FileSystemTracker.operations.clear();
	}

	private static logOperation(operation: string,path: string) {
		const ops=FileSystemTracker.operations.get(operation)||[];
		ops.push(path);
		FileSystemTracker.operations.set(operation,ops);
	}

	static getOperations(): Record<string,string[]> {
		return Object.fromEntries(FileSystemTracker.operations);
	}

	static printOperations() {
		console.log('\nFile System Operations:');
		for(const [op,paths] of FileSystemTracker.operations) {
			console.log(`\n${op}:`);
			paths.forEach(path => console.log(`  - ${path}`));
		}
	}

	private static isProtectedPath(resolvedPath: string): boolean {
		return FileSystemTracker.protectedDirs.some(protectedPath => {
			return resolvedPath === protectedPath || resolvedPath.startsWith(protectedPath + SEPARATOR);
		});
	}
}
