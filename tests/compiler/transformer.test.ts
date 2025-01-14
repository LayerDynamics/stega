// tests/transformer.test.ts
import { assertEquals } from '@std/assert';
import { Transformer } from '../../src/compiler/transformer.ts';
import { Project, ts } from 'https://deno.land/x/ts_morph@17.0.1/mod.ts';

Deno.test('Transformer - removes TypeScript types', () => {
	const project = new Project({
		useInMemoryFileSystem: true,
	});

	const sourceFile = project.createSourceFile(
		'test.ts',
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
		entryPoint: '',
		outDir: '',
		sourceMaps: false,
		minify: false,
		target: ts.ScriptTarget.ES2020,
		plugins: [],
		module: ts.ModuleKind.ES2015,
		platform: 'browser',
		externals: [],
		define: {},
		treeshake: true,
		format: 'es6', // Add required format field
	});

	const result = transformer.transform({ ast: sourceFile, path: 'test.ts' });
	const transformedCode = result.ast.getText();

	assertEquals(transformedCode.includes('interface'), false);
	assertEquals(transformedCode.includes(': string'), false);
	assertEquals(transformedCode.includes(': void'), false);
});
