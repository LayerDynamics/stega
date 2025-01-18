// /src/compiler/parser.ts
import { Diagnostic, Project, SourceFile, ts } from "npm:ts-morph@17.0.1";
import type { CompilerOptions } from "./types.ts";
import { logger } from "./logger.ts";

/**
 * Represents the result of parsing a module, including its AST, dependencies, and any errors.
 */
export interface ParseResult {
	ast: SourceFile;
	dependencies: string[];
	errors: string[];
}


/**
 * A TypeScript parser that processes source files and manages dependencies.
 * Uses the ts-morph Project API to handle TypeScript source files and AST operations.
 * 
 * @remarks
 * The Parser class provides functionality to:
 * - Parse TypeScript source files into AST
 * - Collect module dependencies from import and export declarations
 * - Handle and report TypeScript diagnostics
 * 
 * @example
 * ```typescript
 * const parser = new Parser({ target: ts.ScriptTarget.ES2020 });
 * const result = parser.parse(sourceCode, 'file.ts');
 * console.log(result.dependencies);
 * ```
 */
export class Parser {
	private project: Project;

	/**
	 * Initializes the Parser with compiler options.
	 * @param options - Partial CompilerOptions to customize the parsing behavior.
	 */
	constructor(options: Partial<CompilerOptions> = {}) {
		this.project = new Project({
			compilerOptions: {
				target: options.target ?? ts.ScriptTarget.ESNext,
				module: options.module ?? ts.ModuleKind.ESNext,
				experimentalDecorators: options.experimentalDecorators ?? true,
				sourceMap: options.sourceMaps ?? true,
				declaration: false,
				strict: true,
				esModuleInterop: true,
				skipLibCheck: true,
				moduleResolution: ts.ModuleResolutionKind.NodeJs,
			},
			useInMemoryFileSystem: false,
		});
	}

	/**
	 * Parses the given contents of a file and returns the AST, dependencies, and any errors.
	 * @param contents - The contents of the file to parse.
	 * @param path - The file path.
	 * @returns The ParseResult containing the AST, dependencies, and errors.
	 */
	public parse(contents: string, path: string): ParseResult {
		const sourceFile = this.project.createSourceFile(path, contents, {
			overwrite: true,
		});
		const dependencies = this.collectDependencies(sourceFile);
		const diagnostics = sourceFile.getPreEmitDiagnostics();

		const errors = diagnostics.map((diag) => diag.getMessageText().toString());

		if (diagnostics.length > 0) {
			// Use ts.Diagnostic instead of TsMorph diagnostic
			diagnostics.forEach((diag) =>
				this.logDiagnostic(diag as unknown as ts.Diagnostic)
			);
		}

		return {
			ast: sourceFile,
			dependencies,
			errors,
		};
	}

	/**
	 * Collects all module dependencies from import and export declarations.
	 * @param sourceFile - The SourceFile object.
	 * @returns An array of dependency module specifiers.
	 */
	private collectDependencies(sourceFile: SourceFile): string[] {
		const deps: Set<string> = new Set();

		sourceFile.getImportDeclarations().forEach((importDecl) => {
			const moduleSpecifier = importDecl.getModuleSpecifierValue();
			deps.add(moduleSpecifier);
		});

		sourceFile.getExportDeclarations().forEach((exportDecl) => {
			const moduleSpecifier = exportDecl.getModuleSpecifierValue();
			if (moduleSpecifier) {
				deps.add(moduleSpecifier);
			}
		});

		return Array.from(deps);
	}

	/**
	 * Logs TypeScript diagnostics to the console.
	 * @param diagnostic - The TypeScript diagnostic to log.
	 */
	private logDiagnostic(diagnostic: ts.Diagnostic): void {
		const message = ts.flattenDiagnosticMessageText(
			diagnostic.messageText,
			"\n",
		);
		const sourceFile = diagnostic.file;
		const pos = diagnostic.start;

		if (sourceFile && pos !== undefined) {
			const { line, character } = sourceFile.getLineAndCharacterOfPosition(pos);
			logger.error(
				`${sourceFile.fileName} (${line + 1},${character + 1}): ${message}`,
			);
		} else {
			logger.error(message);
		}
	}
}
