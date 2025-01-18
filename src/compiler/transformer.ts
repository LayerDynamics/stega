// /src/compiler/transformer.ts
import {
	ClassDeclaration,
	FunctionDeclaration,
	SourceFile,
	SyntaxKind,
} from "npm:ts-morph@17.0.1";
import type { CompilerOptions } from "./types.ts";
import { SourceMapGenerator } from "npm:source-map@0.7.4";
import { logger } from "./logger.ts";
import { ts } from "npm:ts-morph@17.0.1";

export interface TransformResult {
	ast: SourceFile;
	map?: string;
}

/**
 * Type definition for a transformation function.
 * @param sourceFile - The SourceFile to transform.
 */
type TransformFn = (sourceFile: SourceFile) => void;

/**
 * The Transformer class applies a series of transformations to TypeScript source files.
 */
/**
 * A class responsible for applying various AST transformations to TypeScript source files.
 * Handles decorators, TypeScript-specific syntax, module transformations, and dynamic imports.
 *
 * @example
 * ```typescript
 * const transformer = new Transformer(compilerOptions);
 * const result = transformer.transform({ ast: sourceFile, path: 'file.ts' });
 * ```
 *
 * @remarks
 * The transformer applies the following transformations in sequence:
 * - Decorators removal (when experimentalDecorators is enabled)
 * - TypeScript-specific syntax removal (types, interfaces, etc.)
 * - Module import/export transformations
 * - Dynamic import transformations
 *
 * Source maps are generated if enabled in the compiler options.
 *
 * @public
 */
export class Transformer {
	private transforms: Map<string, TransformFn>;

	/**
	 * Initializes the Transformer with compiler options and registers default transforms.
	 * @param options - CompilerOptions to guide transformation behaviors.
	 */
	constructor(private options: CompilerOptions) {
		this.transforms = new Map();
		this.registerDefaultTransforms();
	}

	/**
	 * Registers a transformation function under a specific name.
	 * @param name - The name of the transformation.
	 * @param transform - The transformation function to apply.
	 */
	public registerTransform(name: string, transform: TransformFn): void {
		this.transforms.set(name, transform);
	}

	/**
	 * Applies all registered transformations to the given module's AST.
	 * @param moduleAst - The module's AST and path.
	 * @returns The transformed AST and an optional source map.
	 */
	public transform(
		moduleAst: { ast: SourceFile; path: string },
	): TransformResult {
		const { ast, path } = moduleAst;

		// Apply all registered transformations in sequence
		for (const transform of this.transforms.values()) {
			transform(ast);
		}

		// Generate source map if needed
		const map = this.options.sourceMaps
			? this.generateSourceMap(ast, path)
			: undefined;

		return { ast, map };
	}

	/**
	 * Registers default transformation functions.
	 */
	private registerDefaultTransforms(): void {
		// Register built-in transformations
		this.registerTransform("decorators", this.transformDecorators.bind(this));
		this.registerTransform("typescript", this.transformTypeScript.bind(this));
		this.registerTransform("modules", this.transformModules.bind(this));
		this.registerTransform(
			"dynamic-imports",
			this.transformDynamicImports.bind(this),
		);
	}

	/**
	 * Transforms decorators within the source file by removing them.
	 * @param sourceFile - The SourceFile to transform.
	 */
	private transformDecorators(sourceFile: SourceFile): void {
		if (!this.options.experimentalDecorators) {
			return;
		}

		// Handle class decorators
		sourceFile.getClasses().forEach((cls: ClassDeclaration) => {
			// Find and remove class-level decorators
			sourceFile.getDescendantsOfKind(SyntaxKind.Decorator)
				.filter((dec) => dec.getParent() === cls)
				.forEach((dec) => dec.remove());

			// Remove method decorators
			cls.getMethods().forEach((method) => {
				sourceFile.getDescendantsOfKind(SyntaxKind.Decorator)
					.filter((dec) => dec.getParent() === method)
					.forEach((dec) => dec.remove());
			});

			// Remove property decorators
			cls.getProperties().forEach((prop) => {
				sourceFile.getDescendantsOfKind(SyntaxKind.Decorator)
					.filter((dec) => dec.getParent() === prop)
					.forEach((dec) => dec.remove());
			});
		});

		// Handle function decorators
		sourceFile.getFunctions().forEach((func: FunctionDeclaration) => {
			sourceFile.getDescendantsOfKind(SyntaxKind.Decorator)
				.filter((dec) => dec.getParent() === func)
				.forEach((dec) => dec.remove());
		});
	}

	/**
	 * Removes TypeScript-specific syntax like type annotations and interface declarations.
	 * @param sourceFile - The SourceFile to transform.
	 */
	private transformTypeScript(sourceFile: SourceFile): void {
		// Remove type annotations from function parameters and return types
		sourceFile.getFunctions().forEach((func) => {
			func.getParameters().forEach((param) => {
				param.removeType();
			});
			func.removeReturnType();
		});

		// Remove type annotations from class properties and methods
		sourceFile.getClasses().forEach((cls) => {
			cls.getProperties().forEach((prop) => {
				prop.removeType();
			});
			cls.getMethods().forEach((method) => {
				method.getParameters().forEach((param) => {
					param.removeType();
				});
				method.removeReturnType();
			});
		});

		// Remove all interface declarations
		sourceFile.getInterfaces().forEach((iface) => {
			iface.remove();
		});

		// Remove type aliases
		sourceFile.getTypeAliases().forEach((alias) => {
			alias.remove();
		});

		// Remove enums
		sourceFile.getEnums().forEach((enm) => {
			enm.remove();
		});
	}

	/**
	 * Performs module-specific transformations, such as altering import/export syntax.
	 * @param sourceFile - The SourceFile to transform.
	 */
	private transformModules(sourceFile: SourceFile): void {
		// Transform Import Declarations
		sourceFile.getImportDeclarations().forEach((importDecl) => {
			const moduleSpecifier = importDecl.getModuleSpecifierValue();

			// Ensure import paths are relative
			let newModuleSpecifier = moduleSpecifier;
			if (
				!moduleSpecifier.startsWith(".") && !moduleSpecifier.startsWith("/")
			) {
				newModuleSpecifier = `./${moduleSpecifier}`;
			}

			// Remove .ts extension from import paths
			if (newModuleSpecifier.endsWith(".ts")) {
				newModuleSpecifier = newModuleSpecifier.slice(0, -3);
			}

			// Update the module specifier
			importDecl.setModuleSpecifier(newModuleSpecifier);
		});

		// Transform Export Declarations
		sourceFile.getExportDeclarations().forEach((exportDecl) => {
			const namedExports = exportDecl.getNamedExports();
			const namespaceExport = exportDecl.getNamespaceExport();
			const moduleSpecifier = exportDecl.getModuleSpecifierValue();

			if (namedExports.length === 1) {
				const [singleExport] = namedExports;
				const exportName = singleExport.getName();
				if (exportName) {
					exportDecl.replaceWithText(`export default ${exportName};`);
				}
			} else if (
				namedExports.length === 0 && exportDecl.isNamespaceExport() &&
				namespaceExport
			) {
				const namespaceName = namespaceExport.getName();
				if (namespaceName && moduleSpecifier) {
					exportDecl.replaceWithText(
						`import * as ${namespaceName} from "${moduleSpecifier}";\nexport { ${namespaceName} };`,
					);
				}
			}
		});
	}

	/**
	 * Transforms dynamic import() expressions to static imports or other strategies based on target format.
	 * @param sourceFile - The SourceFile to transform.
	 */
	private transformDynamicImports(sourceFile: SourceFile): void {
		sourceFile.getDescendantsOfKind(ts.SyntaxKind.CallExpression).forEach(
			(callExpr) => {
				const expr = callExpr.getExpression();
				if (expr.getKind() === ts.SyntaxKind.ImportKeyword) {
					const args = callExpr.getArguments();
					if (args.length === 1) {
						const modulePath = args[0].getText().replace(/['"]/g, "");
						callExpr.replaceWithText(`__require("${modulePath}")`);
					}
				}
			},
		);
	}

	/**
	 * Generates a source map for the transformed AST.
	 * @param sourceFile - The transformed SourceFile.
	 * @param path - The file path.
	 * @returns The generated source map as a string.
	 */
	private generateSourceMap(sourceFile: SourceFile, path: string): string {
		try {
			const generator = new SourceMapGenerator({ file: "bundle.js" });

			// Map function declarations
			sourceFile.getFunctions().forEach((func) => {
				const nameNode = func.getNameNode();
				if (nameNode) {
					const name = func.getName();
					const pos = nameNode.getStart();
					const location = sourceFile.getLineAndColumnAtPos(pos);
					if (name && location) {
						generator.addMapping({
							generated: { line: location.line + 1, column: location.column },
							original: { line: location.line + 1, column: location.column },
							source: path,
							name: name,
						});
					}
				}
			});

			// Map class declarations
			sourceFile.getClasses().forEach((cls) => {
				const nameNode = cls.getNameNode();
				if (nameNode) {
					const name = cls.getName();
					const pos = nameNode.getStart();
					const location = sourceFile.getLineAndColumnAtPos(pos);
					if (name && location) {
						generator.addMapping({
							generated: { line: location.line + 1, column: location.column },
							original: { line: location.line + 1, column: location.column },
							source: path,
							name: name,
						});
					}
				}
			});

			generator.setSourceContent(path, sourceFile.getFullText());
			return generator.toString();
		} catch (error) {
			logger.error(`Source map generation failed for ${path}:`, error);
			return "";
		}
	}
}
