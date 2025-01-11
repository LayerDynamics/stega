// /src/compiler/codegen.ts

import {logger} from '../logger.ts';
import {
	SourceMapGenerator,
	SourceMapConsumer,
	RawSourceMap,
} from 'https://esm.sh/source-map@0.7.4';
import {
	Project as TsMorphProject,
	SourceFile,
	FunctionDeclaration,
	ClassDeclaration,
	VariableStatement,
	MethodDeclaration,
	PropertyDeclaration,
	ConstructorDeclaration,
	TypeParameterDeclaration,
	ParameterDeclaration,
	Node,
	SyntaxKind,
	Diagnostic,
	ts,
	ImportDeclaration,
	ExportDeclaration,
	OutputFile,
} from "https://deno.land/x/ts_morph@17.0.1/mod.ts";
import {minify as terserMinify} from "https://esm.sh/terser@5.14.2";

/**
 * Defines the possible module formats.
 */
export type ModuleFormat="es6"|"commonjs"|"umd"; // Added "esm" if needed

/**
 * Options for code generation and bundling output.
 */
export interface CodeGenOptions {
	sourceMaps: boolean;
	minify: boolean;
	target: string; // e.g., "es5", "es6", "es2020", etc.
	format?: ModuleFormat;
	platform?: "browser"|"node"|"deno";
	externals?: string[];
}

/**
 * Represents the final output from the code generator:
 * - code:   The generated/transformed code
 * - map:    The final source map (as a string)
 * - warnings: Any warnings produced
 * - assets: Additional assets keyed by file name
 */
export interface GeneratedOutput {
	code: string;
	map?: string;
	warnings: string[];
	assets: Map<string,Uint8Array>;
}

/**
 * Represents a single code fragment within the bundle.
 */
interface CodeFragment {
	code: string;
	line?: number;
	column?: number;
	sourceFile?: string;
}

/**
 * The CodeGenerator class is responsible for:
 * 1. Traversing the AST and extracting code fragments.
 * 2. Generating initial source maps from these fragments.
 * 3. Transforming the code (ES5, ES6, etc.) using TypeScript compiler features.
 * 4. Merging source maps from transformations (TypeScript) and minification (Terser).
 * 5. Wrapping code in different module formats (ES6, CommonJS, UMD).
 */
export class CodeGenerator {
	private warnings: string[]=[];
	private assets: Map<string,Uint8Array>=new Map();

	constructor(private options: {
		umdName?: string;
		target: ts.ScriptTarget;
		module: ts.ModuleKind;
		experimentalDecorators?: boolean;
		entryPoint: string;
		outDir: string;
		sourceMaps: boolean;
		minify: boolean;
		plugins: unknown[];
		platform: "browser"|"node"|"deno";
		externals: string[];
		define: Record<string,string>;
		treeshake: boolean;
		format: ModuleFormat;
		emitDecoratorMetadata?: boolean;
	}) {}

	/**
	 * Generates the final output code and source map from the bundled modules.
	 */
	public async generate(
		bundle: {ast: SourceFile; modules: Map<string,SourceFile>},
		genOptions: CodeGenOptions
	): Promise<GeneratedOutput> {
		this.warnings=[];
		this.assets.clear();

		try {
			// Step 1: Collect code fragments from AST
			const fragments=this.collectCodeFragments(bundle.ast,bundle.modules);

			// Step 2: Merge code fragments
			const mergedCode=this.mergeCodeFragments(fragments);

			// Step 3: Generate initial source map
			const initialSourceMap=genOptions.sourceMaps
				? this.generateInitialSourceMap(fragments)
				:undefined;

			// Step 4: Transform code if needed (ES5, etc.)
			const transformResult=await this.transformCode(
				mergedCode,
				initialSourceMap,
				genOptions.target,
				genOptions.sourceMaps
			);
			let transformedCode=transformResult.code;
			let currentSourceMap=transformResult.map;

			// Step 5: Minify if requested
			if(genOptions.minify) {
				const minifyResult=await this.minifyCode(
					transformedCode,
					currentSourceMap,
					genOptions.sourceMaps
				);
				transformedCode=minifyResult.code;
				if(genOptions.sourceMaps&&minifyResult.map) {
					currentSourceMap=minifyResult.map;
				}
			}

			// Step 6: Wrap code with the specified module format
			const finalCode=this.wrapCodeWithFormat(
				transformedCode,
				genOptions.format||"es6"
			);

			return {
				code: finalCode,
				map: currentSourceMap,
				warnings: this.warnings,
				assets: this.assets,
			};
		} catch(err: unknown) {
			const msg=err instanceof Error? err.message:String(err);
			logger.error(`Code generation failed: ${msg}`);
			throw err;
		}
	}

	/**
	 * Collect code fragments from the main AST + each module's AST.
	 */
	private collectCodeFragments(
		ast: SourceFile,
		modules: Map<string,SourceFile>
	): CodeFragment[] {
		const fragments: CodeFragment[]=[];

		const handleAST=(source: SourceFile) => {
			this.traverseNode(source,{
				onNode: (node: Node) => {
					const fragment=this.generateNodeCode(node);
					if(fragment) fragments.push(fragment);
				},
				onError: (msg: string) => {
					this.warnings.push(msg);
				},
			});
		};

		// Main AST
		handleAST(ast);

		// Each module
		for(const moduleAST of modules.values()) {
			handleAST(moduleAST);
		}

		return fragments;
	}

	/**
	 * Recursively traverse an AST, applying the node/error handlers.
	 */
	private traverseNode(
		node: Node,
		handlers: {onNode: (node: Node) => void; onError: (msg: string) => void}
	): void {
		try {
			handlers.onNode(node);
			node.forEachChild(child => this.traverseNode(child,handlers));
		} catch(err: unknown) {
			const msg=err instanceof Error? err.message:String(err);
			handlers.onError(msg);
		}
	}

	/**
	 * Generates a CodeFragment from a given Node.
	 */
	private generateNodeCode(node: Node): CodeFragment|null {
		const sourceFile=node.getSourceFile();
		const {line,column}=sourceFile.getLineAndColumnAtPos(node.getStart());
		const code=this.generateCodeForNode(node);
		if(!code) return null;

		return {
			code,
			line: line+1,
			column: column+1,
			sourceFile: sourceFile.getFilePath(),
		};
	}

	/**
	 * Decide how to generate code for specific node kinds. Otherwise, fallback to getText().
	 */
	private generateCodeForNode(node: Node): string|null {
		switch(node.getKind()) {
			case SyntaxKind.ImportDeclaration:
				return this.generateImport(node as ImportDeclaration);
			case SyntaxKind.ExportDeclaration:
				return this.generateExport(node as ExportDeclaration);
			case SyntaxKind.FunctionDeclaration:
				return this.generateFunction(node as FunctionDeclaration);
			case SyntaxKind.ClassDeclaration:
				return this.generateClass(node as ClassDeclaration);
			case SyntaxKind.VariableStatement:
				return this.generateVariable(node as VariableStatement);
			default:
				return node.getText();
		}
	}

	// --------------------------------------------------------------------------
	//  Node-specific code generation
	// --------------------------------------------------------------------------

	private generateImport(node: ImportDeclaration): string {
		const importClause=node.getImportClause();
		if(!importClause) return "";
		let importStatement="import ";
		const namespaceImport=importClause.getNamespaceImport();

		if(namespaceImport) {
			// Get namespace name via getText() instead of getName()
			const namespaceName=namespaceImport.getText();
			importStatement+=`* as ${namespaceName} from "${node.getModuleSpecifierValue()}";`;
		} else {
			const namedImports=importClause.getNamedImports();
			const defaultImport=importClause.getDefaultImport();
			const defaultImportText=defaultImport?.getText()||"";

			if(defaultImportText&&namedImports.length>0) {
				const namedList=namedImports.map(spec => {
					const name=spec.getName();
					const aliasNode=spec.getAliasNode();
					const aliasText=aliasNode? aliasNode.getText():"";
					return aliasText? `${name} as ${aliasText}`:name;
				}).join(", ");
				importStatement+=`${defaultImportText}, { ${namedList} } from "${node.getModuleSpecifierValue()}";`;
			} else if(defaultImportText) {
				importStatement+=`${defaultImportText} from "${node.getModuleSpecifierValue()}";`;
			} else if(namedImports.length>0) {
				const namedList=namedImports.map(spec => {
					const name=spec.getName();
					const aliasNode=spec.getAliasNode();
					const aliasText=aliasNode? aliasNode.getText():"";
					return aliasText? `${name} as ${aliasText}`:name;
				}).join(", ");
				importStatement+=`{ ${namedList} } from "${node.getModuleSpecifierValue()}";`;
			}
		}

		return importStatement;
	}

	private generateExport(node: ExportDeclaration): string {
		// Remove explicit ExportSpecifier type
		const namedExports=node.getNamedExports();
		const namespaceExport=node.getNamespaceExport();

		if(namedExports.length>0) {
			const exportsList=namedExports.map(spec => {
				const name=spec.getName();
				const alias=spec.getAliasNode()?.getText();
				return alias? `${name} as ${alias}`:name;
			}).join(", ");
			return `export { ${exportsList} } from "${node.getModuleSpecifierValue()}";`;
		} else if(namespaceExport) {
			const namespaceName=namespaceExport.getName();
			return `export * as ${namespaceName} from "${node.getModuleSpecifierValue()}";`;
		}
		return "export {};";
	}

	private generateFunction(node: FunctionDeclaration): string {
		const name=node.getName()??"";
		const typeParams=this.generateTypeParameters(node.getTypeParameters()||[]);
		const params=node.getParameters().map(p => this.generateParameter(p)).join(", ");
		const returnType=node.getReturnTypeNode()
			? `: ${node.getReturnTypeNode()!.getText()}`
			:"";
		const body=node.getBody()? node.getBody()!.getText():"{}";
		return `function ${name}${typeParams}(${params})${returnType} ${body}`;
	}

	private generateClass(node: ClassDeclaration): string {
		const name=node.getName()??"";
		const typeParams=this.generateTypeParameters(node.getTypeParameters()||[]);
		const heritage=this.generateHeritage(node);
		const members=node.getMembers().map(m => this.generateClassMember(m)).join("\n");
		return `class ${name}${typeParams}${heritage} {\n${members}\n}`;
	}

	private generateVariable(node: VariableStatement): string {
		const declarationList=node.getDeclarationList();
		const declarations=declarationList.getDeclarations().map(decl => {
			const variableName=decl.getName();
			const typeNode=decl.getTypeNode();
			const typeText=typeNode? `: ${typeNode.getText()}`:"";
			const initializer=decl.getInitializer()?.getText()||"";
			return initializer
				? `${variableName}${typeText} = ${initializer}`
				:`${variableName}${typeText}`;
		});
		const flags=declarationList.getFlags();
		let keyword="var";
		if(flags&ts.NodeFlags.Const) keyword="const";
		else if(flags&ts.NodeFlags.Let) keyword="let";
		return `${keyword} ${declarations.join(", ")};`;
	}

	private generateTypeParameters(
		typeParams: TypeParameterDeclaration[]
	): string {
		if(!typeParams.length) return "";
		const params=typeParams.map(tp => {
			const constraint=tp.getConstraint()
				? ` extends ${tp.getConstraint()!.getText()}`
				:"";
			const defaultType=tp.getDefault()
				? ` = ${tp.getDefault()!.getText()}`
				:"";
			return `${tp.getName()}${constraint}${defaultType}`;
		}).join(", ");
		return `<${params}>`;
	}

	private generateParameter(param: ParameterDeclaration): string {
		const name=param.getName();
		const isOptional=param.isOptional()? "?":"";
		const typeNode=param.getTypeNode();
		const typeText=typeNode? `: ${typeNode.getText()}`:"";
		const initializer=param.getInitializer()?.getText()||"";
		const initText=initializer? ` = ${initializer}`:"";
		return `${name}${isOptional}${typeText}${initText}`;
	}

	private generateHeritage(node: ClassDeclaration): string {
		let extendsText="";
		let implementsText="";
		node.getHeritageClauses().forEach(clause => {
			if(clause.getToken()===SyntaxKind.ExtendsKeyword) {
				const types=clause.getTypeNodes().map(t => t.getText()).join(", ");
				extendsText=` extends ${types}`;
			} else if(clause.getToken()===SyntaxKind.ImplementsKeyword) {
				const types=clause.getTypeNodes().map(t => t.getText()).join(", ");
				implementsText=` implements ${types}`;
			}
		});
		return `${extendsText}${implementsText}`;
	}

	private generateClassMember(member: Node): string {
		switch(member.getKind()) {
			case SyntaxKind.MethodDeclaration:
				return this.generateMethod(member as MethodDeclaration);
			case SyntaxKind.PropertyDeclaration:
				return this.generateProperty(member as PropertyDeclaration);
			case SyntaxKind.Constructor:
				return this.generateConstructor(member as ConstructorDeclaration);
			default:
				return member.getText();
		}
	}

	private generateMethod(method: MethodDeclaration): string {
		const nameNode=method.getNameNode();
		let methodName="[anonymous]";

		if(nameNode&&nameNode.getKind()===SyntaxKind.Identifier) {
			methodName=(nameNode as Node).getText()||"[anonymous]";
		} else {
			methodName=method.getName()||"[anonymous]";
		}

		const typeParams=this.generateTypeParameters(method.getTypeParameters()||[]);
		const params=method.getParameters().map(p => this.generateParameter(p)).join(", ");
		const returnType=method.getReturnTypeNode()
			? `: ${method.getReturnTypeNode()!.getText()}`
			:"";
		const body=method.getBody()? method.getBody()!.getText():"{}";
		return `${methodName}${typeParams}(${params})${returnType} ${body}`;
	}

	private generateProperty(prop: PropertyDeclaration): string {
		const name=prop.getName();
		const typeNode=prop.getTypeNode();
		const typeText=typeNode? `: ${typeNode.getText()}`:"";
		const initializer=prop.getInitializer()?.getText()||"";
		const initText=initializer? ` = ${initializer}`:"";
		return `${name}${typeText}${initText};`;
	}

	private generateConstructor(ctor: ConstructorDeclaration): string {
		const params=ctor.getParameters().map(p => this.generateParameter(p)).join(", ");
		const body=ctor.getBody()? ctor.getBody()!.getText():"{}";
		return `constructor(${params}) ${body}`;
	}

	// --------------------------------------------------------------------------
	//  Merge Code + Source Map
	// --------------------------------------------------------------------------

	private mergeCodeFragments(fragments: CodeFragment[]): string {
		return fragments
			.filter(f => f.code)
			.map(f => f.code)
			.join("\n");
	}

	private generateInitialSourceMap(fragments: CodeFragment[]): RawSourceMap {
		const map=new SourceMapGenerator({file: "bundle.js"});

		let generatedLine=1;
		let generatedColumn=0;

		for(const frag of fragments) {
			if(frag.sourceFile&&frag.line&&frag.column) {
				map.addMapping({
					generated: {line: generatedLine,column: generatedColumn},
					original: {line: frag.line,column: frag.column},
					source: frag.sourceFile,
				});
			}

			const lines=frag.code.split("\n");
			if(lines.length>1) {
				generatedLine+=lines.length-1;
				generatedColumn=lines[lines.length-1].length;
			} else {
				generatedColumn+=lines[0].length;
			}
		}

		// Add source content
		const uniqueSources=new Set(
			fragments.map(f => f.sourceFile).filter((s): s is string => !!s)
		);
		for(const sourceFilePath of uniqueSources) {
			try {
				const fileContent=Deno.readTextFileSync(sourceFilePath);
				map.setSourceContent(sourceFilePath,fileContent);
			} catch {
				// skip
			}
		}

		return map.toJSON();
	}

	// --------------------------------------------------------------------------
	//  Transforms + Source Map
	// --------------------------------------------------------------------------

	private async transformCode(
		code: string,
		inputMap: RawSourceMap|undefined,
		target: string,
		withSourceMap: boolean
	): Promise<{code: string; map?: string}> {
		let tsTarget: ts.ScriptTarget;
		switch(target.toLowerCase()) {
			case "es5":
				tsTarget=ts.ScriptTarget.ES5;
				break;
			case "es6":
			case "es2015":
				tsTarget=ts.ScriptTarget.ES2015;
				break;
			default:
				tsTarget=ts.ScriptTarget.ES2020;
				break;
		}

		const project=new TsMorphProject({
			useInMemoryFileSystem: true,
			compilerOptions: {
				target: tsTarget,
				sourceMap: withSourceMap,
				declaration: false,
			},
		});

		const filePath="in-memory.ts";
		const sourceFile=project.createSourceFile(filePath,code,{overwrite: true});
		const emitOutput=sourceFile.getEmitOutput();

		const outputFiles: OutputFile[] = emitOutput.getOutputFiles();
		let transformedCode=code;
		let transformedMap: string|undefined;

		for(const outFile of outputFiles) {
			if(outFile.getFilePath().endsWith(".js")) {
				transformedCode=outFile.getText();
			} else if(outFile.getFilePath().endsWith(".js.map")) {
				transformedMap=outFile.getText();
			}
		}

		// Merge source maps
		if(withSourceMap&&transformedMap&&inputMap) {
			const mergedMap=await this.mergeSourceMaps(
				JSON.stringify(inputMap),
				transformedMap
			);
			return {code: transformedCode,map: mergedMap};
		}

		return {code: transformedCode,map: transformedMap};
	}

	private async mergeSourceMaps(
		existingMap: string,
		newMap: string
	): Promise<string> {
		const consumerOld=await new SourceMapConsumer(existingMap);
		const consumerNew=await new SourceMapConsumer(newMap);
		const generator=SourceMapGenerator.fromSourceMap(consumerNew);

		// Instead of any, cast to unknown then SourceMapConsumer
		generator.applySourceMap(consumerOld as unknown as SourceMapConsumer);

		consumerOld.destroy();
		consumerNew.destroy();

		return generator.toString();
	}

	// --------------------------------------------------------------------------
	//  Minification + Source Map
	// --------------------------------------------------------------------------

	private async minifyCode(
		code: string,
		inputMap: string|undefined,
		withSourceMap: boolean
	): Promise<{code: string; map?: string}> {
		try {
			const terserOptions: {
				compress: boolean;
				mangle: boolean;
				sourceMap?: {
					content: string;
					filename: string;
					url: string;
				};
			}={
				compress: true,
				mangle: true,
			};

			if(withSourceMap&&inputMap) {
				terserOptions.sourceMap={
					content: inputMap,
					filename: "bundle.js",
					url: "bundle.js.map",
				};
			}

			const terserResult=await terserMinify(code,terserOptions);
			if(!terserResult.code) {
				throw new Error("Terser failed to generate code.");
			}

			let finalMap: string|undefined;
			if(withSourceMap&&terserResult.map) {
				// If Terser returns map as an object, convert to string
				if(typeof terserResult.map==="string") {
					finalMap=terserResult.map;
				} else {
					finalMap=JSON.stringify(terserResult.map);
				}
			}

			return {
				code: terserResult.code,
				map: finalMap,
			};
		} catch(err: unknown) {
			const msg=err instanceof Error? err.message:String(err);
			this.warnings.push(`Minification failed: ${msg}`);
			logger.warn(`Minification failed: ${msg}`);

			return {code};
		}
	}

	// --------------------------------------------------------------------------
	//  Module Format Wrappers
	// --------------------------------------------------------------------------

	private wrapCodeWithFormat(code: string,format: ModuleFormat): string {
		switch(format) {
			case "commonjs":
				return this.wrapCommonJS(code);
			case "umd":
				return this.wrapUMD(code);
			case "es6":
			default:
				return code;
		}
	}

	private wrapCommonJS(code: string): string {
		return `
"use strict";
${code}

Object.defineProperty(exports, "__esModule", { value: true });

// Handle default export compatibility
if (typeof module.exports.default === 'undefined') {
    Object.defineProperty(module.exports, "default", {
        enumerable: true,
        value: module.exports
    });
}
`;
	}

	private wrapUMD(code: string): string {
		const name=this.options.umdName||"bundle";
		return `
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof exports === 'object' && typeof module !== 'undefined') {
    // CommonJS
    module.exports = factory();
  } else {
    // Browser globals
    root["${name}"] = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  "use strict";

  var exports = {};
  var module = { exports: exports };

  ${code}

  return module.exports;
});
`;
	}

	// --------------------------------------------------------------------------
	//  Helpers + Diagnostics
	// --------------------------------------------------------------------------

	private logDiagnostic(diagnostic: Diagnostic): void {
		const message=diagnostic.getMessageText();
		const messageText=
			typeof message==="string"? message:message.getMessageText();
		const sourceFile=diagnostic.getSourceFile();
		const pos=diagnostic.getStart();

		if(sourceFile&&pos!==undefined) {
			const lineAndChar=sourceFile.getLineAndColumnAtPos(pos);
			logger.error(
				`${sourceFile.getFilePath()} (${lineAndChar.line+1},${lineAndChar.column+1}): ${messageText}`
			);
		} else {
			logger.error(messageText);
		}
	}
}
