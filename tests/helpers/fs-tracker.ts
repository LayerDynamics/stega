// test/helpers/fs-tracker.ts
import {logger} from "../../src/logger.ts";

export class FileSystemTracker {
	private static operations: Map<string,string[]>=new Map();
	private static originalRmSync=Deno.removeSync;
	private static originalRm=Deno.remove;

	static init() {
		// Track synchronous removals
		Deno.removeSync=function(path: string|URL,options?: Deno.RemoveOptions) {
			const pathStr=path.toString();
			FileSystemTracker.logOperation('removeSync',pathStr);
			if(pathStr.includes('/src')||pathStr.includes('\\src')) {
				logger.warn(`Attempted to remove src directory or file: ${pathStr}`);
				throw new Error(`Protected directory removal attempted: ${pathStr}`);
			}
			return FileSystemTracker.originalRmSync.call(Deno,path,options);
		};

		// Track asynchronous removals
		Deno.remove=function(path: string|URL,options?: Deno.RemoveOptions) {
			const pathStr=path.toString();
			FileSystemTracker.logOperation('remove',pathStr);
			if(pathStr.includes('/src')||pathStr.includes('\\src')) {
				logger.warn(`Attempted to remove src directory or file: ${pathStr}`);
				return Promise.reject(new Error(`Protected directory removal attempted: ${pathStr}`));
			}
			return FileSystemTracker.originalRm.call(Deno,path,options);
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
}
