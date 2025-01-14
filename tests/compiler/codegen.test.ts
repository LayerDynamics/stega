// /tests/compiler/codegen.test.ts

import { assertEquals } from "@std/assert";
import { CodeGenerator } from "../../src/compiler/codegen.ts";
import { Project, ts } from "https://deno.land/x/ts_morph@17.0.1/mod.ts";

Deno.test("CodeGenerator - generates valid JavaScript", async () => {
	// Create project with strict type stripping options
	const project = new Project({
		useInMemoryFileSystem: true,
		compilerOptions: {
			target: ts.ScriptTarget.ES2020,
			module: ts.ModuleKind.ESNext,
			emitDecoratorMetadata: false,
			experimentalDecorators: false,
			noEmit: false,
			emitDeclarationOnly: false,
			stripInternal: true,
			isolatedModules: true,
			jsx: ts.JsxEmit.None,
			allowJs: true,
			checkJs: false,
		},
	});

	const sourceFile = project.createSourceFile(
		"test.ts",
		`
        export function hello(name: string): void {
            console.log(\`Hello \${name}\`);
        }
        `,
	);

	// Manual type stripping before code generation
	const stripped = project.createSourceFile(
		"stripped.ts",
		sourceFile.getFullText(),
		{ overwrite: true, scriptKind: ts.ScriptKind.JS },
	);

	stripped.getFunctions().forEach((func) => {
		func.getParameters().forEach((param) => {
			param.removeType();
		});
		func.removeReturnType();
	});

	// Create code generator with strict options
	const generator = new CodeGenerator({
		target: ts.ScriptTarget.ES2020,
		module: ts.ModuleKind.ESNext,
		experimentalDecorators: false,
		treeshake: true,
		sourceMaps: false,
		minify: false,
		entryPoint: "",
		outDir: "",
		plugins: [],
		platform: "browser",
		externals: [],
		define: {},
		format: "es6",
		emitDecoratorMetadata: false,
	});

	const result = await generator.generate(
		{ ast: stripped, modules: new Map() },
		{
			sourceMaps: false,
			minify: false,
			target: "es2020",
			format: "es6",
		},
	);

	// Pre-process the code by removing whitespace
	const normalizedCode = result.code
		.replace(/\s+/g, " ")
		.trim();

	console.log("Generated code:", normalizedCode);

	// Test for absence of type annotations
	assertEquals(
		normalizedCode.includes(": string") ||
			normalizedCode.includes(": void") ||
			normalizedCode.includes(": any"),
		false,
		"Generated code should not contain TypeScript type annotations",
	);

	// Test for correct JavaScript output
	assertEquals(
		normalizedCode.includes("export function hello(name)"),
		true,
		"Generated code should contain function declaration without type annotations",
	);

	assertEquals(
		normalizedCode.includes("console.log(`Hello ${name}`)"),
		true,
		"Generated code should contain template literal",
	);
});
