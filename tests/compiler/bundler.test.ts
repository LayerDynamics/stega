// /src/tests/compiler/bundler.test.ts
import {assertEquals} from "https://deno.land/std@0.203.0/testing/asserts.ts";
import {Bundler} from "../../src/compiler/bundler.ts";
import {DependencyGraph} from "../../src/compiler/dependency-graph.ts";
import type {ModuleInfo} from "../../src/compiler/types.ts";
import {ts,Project} from "https://deno.land/x/ts_morph@17.0.1/mod.ts";
import * as pathModule from "https://deno.land/std@0.203.0/path/mod.ts";

/**
 * Mock ModuleInfo for testing.
 */
const mockModule=(path: string,code: string,dependencies: string[]): ModuleInfo => ({
	path,
	code,
	dependencies,
	ast: {} as unknown, // Replace with actual AST if necessary
});

/**
 * Mock parseModule function for testing.
 */
const mockParseModule=async (modulePath: string): Promise<ModuleInfo> => {
	const resolvedPath=pathModule.resolve(modulePath);
	const basePath=pathModule.resolve("/Users/ryanoboyle/stega");

	if(resolvedPath===pathModule.join(basePath,"a.ts")) {
		return mockModule(
			resolvedPath,
			"export const a = 'a';",
			[] // No dependencies
		);
	} else if(resolvedPath===pathModule.join(basePath,"b.ts")) {
		const dependencyPath=pathModule.join(basePath,"a.ts");
		return mockModule(
			resolvedPath,
			"import { a } from './a.ts'; export const b = a + 'b';",
			[dependencyPath] // Depends on a.ts
		);
	} else {
		throw new Error(`Unknown module path: ${modulePath}`);
	}
};

Deno.test("Bundler - bundles modules correctly",async () => {
	const graph=new DependencyGraph();

	const entryModule=mockModule(
		pathModule.join("/Users/ryanoboyle/stega","b.ts"),
		"import { a } from './a.ts'; export const b = a + 'b';",
		[pathModule.join("/Users/ryanoboyle/stega","a.ts")]
	);

	await graph.build(entryModule,{parseModule: mockParseModule});

	const bundler=new Bundler({
		entryPoint: pathModule.join("/Users/ryanoboyle/stega","b.ts"),
		outDir: "dist",
		sourceMaps: false,
		minify: false,
		target: ts.ScriptTarget.ES2020,
		plugins: [],
		module: ts.ModuleKind.ES2015,
		platform: "browser",
		externals: [],
		define: {},
		experimentalDecorators: false,
		treeshake: true,
		format: "es6",
	});

	const result=bundler.bundle(graph);

	assertEquals(typeof result.code,"string","Bundled code should be a string");
	assertEquals(result.modules.size,2,"Should contain two modules");

	// Check if bundled code includes both modules' code
	assertEquals(result.code.includes("export const a = 'a';"),true,"Bundled code should include module 'a.ts'");
	assertEquals(result.code.includes("export const b = a + 'b';"),true,"Bundled code should include module 'b.ts'");

	// Optionally, check if the preamble and postamble are present
	assertEquals(result.code.includes("__register"),true,"Bundled code should include __register function");
	assertEquals(result.code.includes("__require"),true,"Bundled code should include __require function");
});
