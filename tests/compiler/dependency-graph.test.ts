// /src/tests/compiler/dependency-graph.test.ts
import {
	assertEquals,
	assertRejects,
} from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { DependencyGraph } from "../../src/compiler/dependency-graph.ts";
import type { ModuleInfo } from "../../src/compiler/types.ts";
import * as pathModule from "https://deno.land/std@0.203.0/path/mod.ts";

/**
 * Mock ModuleInfo for testing.
 */
const mockModule = (
	path: string,
	code: string,
	dependencies: string[],
): ModuleInfo => ({
	path,
	code,
	dependencies,
	ast: {} as unknown, // Replace with actual AST if necessary
});

// Cache resolved paths to avoid repeated path resolution
const resolvedPaths = new Map<string, string>();

// Reusable mock parse module function factory with memoization
const createMockParseModule = (moduleMap: Map<string, ModuleInfo>) => {
	const cache = new Map<string, Promise<ModuleInfo>>();

	return async (modulePath: string): Promise<ModuleInfo> => {
		if (cache.has(modulePath)) {
			return cache.get(modulePath)!;
		}

		const modulePromise = (async () => {
			const resolvedPath = resolvedPaths.get(modulePath) ||
				(() => {
					const resolved = pathModule.resolve(modulePath);
					resolvedPaths.set(modulePath, resolved);
					return resolved;
				})();

			const module = moduleMap.get(resolvedPath);
			if (!module) {
				throw new Error(`Unknown module path: ${modulePath}`);
			}
			return module;
		})();

		cache.set(modulePath, modulePromise);
		return modulePromise;
	};
};

Deno.test("DependencyGraph - builds graph correctly", async () => {
	const graph = new DependencyGraph();
	const moduleMap = new Map<string, ModuleInfo>();

	// Pre-resolve paths for better performance
	const entryPath = pathModule.resolve("entry.ts");
	const fooPath = pathModule.resolve("./foo.ts");

	const entryModule = mockModule(
		entryPath,
		"import { foo } from './foo.ts';",
		[fooPath],
	);
	const fooModule = mockModule(fooPath, "export const foo = 'foo';", []);

	moduleMap.set(entryPath, entryModule);
	moduleMap.set(fooPath, fooModule);

	await graph.build(entryModule, {
		parseModule: createMockParseModule(moduleMap),
	});

	assertEquals(
		graph.getModule(entryPath)?.dependencies.length,
		1,
		"Entry module should have one dependency",
	);
	assertEquals(
		graph.getModule(fooPath)?.dependencies.length,
		0,
		"Foo module should have no dependencies",
	);
});

Deno.test("DependencyGraph - detects cycles", async () => {
	const graph = new DependencyGraph();
	const moduleMap = new Map<string, ModuleInfo>();

	// Pre-resolve paths for better performance
	const aPath = pathModule.resolve("./a.ts");
	const bPath = pathModule.resolve("./b.ts");

	const moduleA = mockModule(aPath, "import { b } from './b.ts';", [bPath]);
	const moduleB = mockModule(bPath, "import { a } from './a.ts';", [aPath]);

	moduleMap.set(aPath, moduleA);
	moduleMap.set(bPath, moduleB);

	await graph.build(moduleA, {
		parseModule: createMockParseModule(moduleMap),
	});

	assertEquals(
		graph.hasCycle(),
		true,
		"DependencyGraph should detect a cycle between a.ts and b.ts",
	);
});
