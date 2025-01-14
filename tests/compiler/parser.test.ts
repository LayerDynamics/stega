// tests/compiler/parserf.test.ts
import { assertEquals } from "@std/assert";
import { Parser } from "../../src/compiler/parser.ts";

Deno.test("Parser - parses TypeScript code correctly", () => {
	const parser = new Parser();
	const code = `
        import { foo } from './bar';
        
        export function hello(): void {
            console.log('Hello');
        }
    `;

	const result = parser.parse(code, "test.ts");
	// Import './bar' will cause an error since the file doesn't exist
	assertEquals(result.errors.length, 1);
	assertEquals(result.dependencies.length, 1);
	assertEquals(result.dependencies[0], "./bar");
});

Deno.test("Parser - handles syntax errors", () => {
	const parser = new Parser();
	const invalidCode = `
        import { foo from './bar';  // Missing closing brace
        
        export function hello(): void {
            console.log('Hello');
        }
    `;

	const result = parser.parse(invalidCode, "test.ts");
	assertEquals(result.errors.length > 0, true);
});
