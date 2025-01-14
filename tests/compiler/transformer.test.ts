// tests/transformer.test.ts
import { assertEquals } from "jsr:@std/assert@0.224.0";
import { Transformer } from "../../src/compiler/transformer.ts";
import { Project, ts } from "npm:ts-morph@17.0.1";

Deno.test({
	name: "Transformer - removes TypeScript types",
	permissions: {
		read: true,
		write: true,
		sys: true,
		env: true,
	},
	async fn() {
		const project = new Project({
			useInMemoryFileSystem: true,
			compilerOptions: {
				target: ts.ScriptTarget.ES2020,
				module: ts.ModuleKind.ES2015,
			},
		});

		const sourceFile = project.createSourceFile(
			"test.ts",
			`
        interface Test {
            foo: string;
        }
        
        function hello(name: string): void {
            console.log(name);
        }
        `,
		);

		const transformer = new Transformer({
			experimentalDecorators: false,
			entryPoint: "",
			outDir: "",
			sourceMaps: false,
			minify: false,
			target: ts.ScriptTarget.ES2020,
			plugins: [],
			module: ts.ModuleKind.ES2015,
			platform: "browser",
			externals: [],
			define: {},
			treeshake: true,
			format: "es6",
		});

		const result = transformer.transform({ ast: sourceFile, path: "test.ts" });
		const transformedCode = result.ast.getText();

		assertEquals(transformedCode.includes("interface"), false);
		assertEquals(transformedCode.includes(": string"), false);
		assertEquals(transformedCode.includes(": void"), false);
	},
});
