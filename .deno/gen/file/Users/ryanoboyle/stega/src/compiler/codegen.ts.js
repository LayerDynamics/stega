// /src/compiler/codegen.ts
import { logger } from "../logger.ts";
import { SourceMapConsumer, SourceMapGenerator } from "https://esm.sh/source-map@0.7.4";
import { Project as TsMorphProject, SyntaxKind, ts } from "https://deno.land/x/ts_morph@17.0.1/mod.ts";
import { minify as terserMinify } from "https://esm.sh/terser@5.14.2";
/**
 * The CodeGenerator class is responsible for:
 * 1. Traversing the AST and extracting code fragments.
 * 2. Generating initial source maps from these fragments.
 * 3. Transforming the code (ES5, ES6, etc.) using TypeScript compiler features.
 * 4. Merging source maps from transformations (TypeScript) and minification (Terser).
 * 5. Wrapping code in different module formats (ES6, CommonJS, UMD).
 */ export class CodeGenerator {
  options;
  warnings;
  assets;
  constructor(options){
    this.options = options;
    this.warnings = [];
    this.assets = new Map();
  }
  /**
	 * Generates the final output code and source map from the bundled modules.
	 */ async generate(bundle, genOptions) {
    this.warnings = [];
    this.assets.clear();
    try {
      // Step 1: Collect code fragments from AST
      const fragments = this.collectCodeFragments(bundle.ast, bundle.modules);
      // Step 2: Merge code fragments
      const mergedCode = this.mergeCodeFragments(fragments);
      // Step 3: Generate initial source map
      const initialSourceMap = genOptions.sourceMaps ? this.generateInitialSourceMap(fragments) : undefined;
      // Step 4: Transform code if needed (ES5, etc.)
      const transformResult = await this.transformCode(mergedCode, initialSourceMap, genOptions.target, genOptions.sourceMaps);
      let transformedCode = transformResult.code;
      let currentSourceMap = transformResult.map;
      // Step 5: Minify if requested
      if (genOptions.minify) {
        const minifyResult = await this.minifyCode(transformedCode, currentSourceMap, genOptions.sourceMaps);
        transformedCode = minifyResult.code;
        if (genOptions.sourceMaps && minifyResult.map) {
          currentSourceMap = minifyResult.map;
        }
      }
      // Step 6: Wrap code with the specified module format
      const finalCode = this.wrapCodeWithFormat(transformedCode, genOptions.format || "es6");
      return {
        code: finalCode,
        map: currentSourceMap,
        warnings: this.warnings,
        assets: this.assets
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Code generation failed: ${msg}`);
      throw err;
    }
  }
  /**
	 * Collect code fragments from the main AST + each module's AST.
	 */ collectCodeFragments(ast, modules) {
    const fragments = [];
    const handleAST = (source)=>{
      this.traverseNode(source, {
        onNode: (node)=>{
          const fragment = this.generateNodeCode(node);
          if (fragment) fragments.push(fragment);
        },
        onError: (msg)=>{
          this.warnings.push(msg);
        }
      });
    };
    // Main AST
    handleAST(ast);
    // Each module
    for (const moduleAST of modules.values()){
      handleAST(moduleAST);
    }
    return fragments;
  }
  /**
	 * Recursively traverse an AST, applying the node/error handlers.
	 */ traverseNode(node, handlers) {
    try {
      handlers.onNode(node);
      node.forEachChild((child)=>this.traverseNode(child, handlers));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      handlers.onError(msg);
    }
  }
  /**
	 * Generates a CodeFragment from a given Node.
	 */ generateNodeCode(node) {
    const sourceFile = node.getSourceFile();
    const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());
    const code = this.generateCodeForNode(node);
    if (!code) return null;
    return {
      code,
      line: line + 1,
      column: column + 1,
      sourceFile: sourceFile.getFilePath()
    };
  }
  /**
	 * Decide how to generate code for specific node kinds. Otherwise, fallback to getText().
	 */ generateCodeForNode(node) {
    switch(node.getKind()){
      case SyntaxKind.ImportDeclaration:
        return this.generateImport(node);
      case SyntaxKind.ExportDeclaration:
        return this.generateExport(node);
      case SyntaxKind.FunctionDeclaration:
        return this.generateFunction(node);
      case SyntaxKind.ClassDeclaration:
        return this.generateClass(node);
      case SyntaxKind.VariableStatement:
        return this.generateVariable(node);
      default:
        return node.getText();
    }
  }
  // --------------------------------------------------------------------------
  //  Node-specific code generation
  // --------------------------------------------------------------------------
  generateImport(node) {
    const importClause = node.getImportClause();
    if (!importClause) return "";
    let importStatement = "import ";
    const namespaceImport = importClause.getNamespaceImport();
    if (namespaceImport) {
      // Get namespace name via getText() instead of getName()
      const namespaceName = namespaceImport.getText();
      importStatement += `* as ${namespaceName} from "${node.getModuleSpecifierValue()}";`;
    } else {
      const namedImports = importClause.getNamedImports();
      const defaultImport = importClause.getDefaultImport();
      const defaultImportText = defaultImport?.getText() || "";
      if (defaultImportText && namedImports.length > 0) {
        const namedList = namedImports.map((spec)=>{
          const name = spec.getName();
          const aliasNode = spec.getAliasNode();
          const aliasText = aliasNode ? aliasNode.getText() : "";
          return aliasText ? `${name} as ${aliasText}` : name;
        }).join(", ");
        importStatement += `${defaultImportText}, { ${namedList} } from "${node.getModuleSpecifierValue()}";`;
      } else if (defaultImportText) {
        importStatement += `${defaultImportText} from "${node.getModuleSpecifierValue()}";`;
      } else if (namedImports.length > 0) {
        const namedList = namedImports.map((spec)=>{
          const name = spec.getName();
          const aliasNode = spec.getAliasNode();
          const aliasText = aliasNode ? aliasNode.getText() : "";
          return aliasText ? `${name} as ${aliasText}` : name;
        }).join(", ");
        importStatement += `{ ${namedList} } from "${node.getModuleSpecifierValue()}";`;
      }
    }
    return importStatement;
  }
  generateExport(node) {
    // Remove explicit ExportSpecifier type
    const namedExports = node.getNamedExports();
    const namespaceExport = node.getNamespaceExport();
    if (namedExports.length > 0) {
      const exportsList = namedExports.map((spec)=>{
        const name = spec.getName();
        const alias = spec.getAliasNode()?.getText();
        return alias ? `${name} as ${alias}` : name;
      }).join(", ");
      return `export { ${exportsList} } from "${node.getModuleSpecifierValue()}";`;
    } else if (namespaceExport) {
      const namespaceName = namespaceExport.getName();
      return `export * as ${namespaceName} from "${node.getModuleSpecifierValue()}";`;
    }
    return "export {};";
  }
  generateFunction(node) {
    const name = node.getName() ?? "";
    const typeParams = this.generateTypeParameters(node.getTypeParameters() || []);
    const params = node.getParameters().map((p)=>this.generateParameter(p)).join(", ");
    const returnType = node.getReturnTypeNode() ? `: ${node.getReturnTypeNode().getText()}` : "";
    const body = node.getBody() ? node.getBody().getText() : "{}";
    return `function ${name}${typeParams}(${params})${returnType} ${body}`;
  }
  generateClass(node) {
    const name = node.getName() ?? "";
    const typeParams = this.generateTypeParameters(node.getTypeParameters() || []);
    const heritage = this.generateHeritage(node);
    const members = node.getMembers().map((m)=>this.generateClassMember(m)).join("\n");
    return `class ${name}${typeParams}${heritage} {\n${members}\n}`;
  }
  generateVariable(node) {
    const declarationList = node.getDeclarationList();
    const declarations = declarationList.getDeclarations().map((decl)=>{
      const variableName = decl.getName();
      const typeNode = decl.getTypeNode();
      const typeText = typeNode ? `: ${typeNode.getText()}` : "";
      const initializer = decl.getInitializer()?.getText() || "";
      return initializer ? `${variableName}${typeText} = ${initializer}` : `${variableName}${typeText}`;
    });
    const flags = declarationList.getFlags();
    let keyword = "var";
    if (flags & ts.NodeFlags.Const) keyword = "const";
    else if (flags & ts.NodeFlags.Let) keyword = "let";
    return `${keyword} ${declarations.join(", ")};`;
  }
  generateTypeParameters(typeParams) {
    if (!typeParams.length) return "";
    const params = typeParams.map((tp)=>{
      const constraint = tp.getConstraint() ? ` extends ${tp.getConstraint().getText()}` : "";
      const defaultType = tp.getDefault() ? ` = ${tp.getDefault().getText()}` : "";
      return `${tp.getName()}${constraint}${defaultType}`;
    }).join(", ");
    return `<${params}>`;
  }
  generateParameter(param) {
    const name = param.getName();
    const isOptional = param.isOptional() ? "?" : "";
    const typeNode = param.getTypeNode();
    const typeText = typeNode ? `: ${typeNode.getText()}` : "";
    const initializer = param.getInitializer()?.getText() || "";
    const initText = initializer ? ` = ${initializer}` : "";
    return `${name}${isOptional}${typeText}${initText}`;
  }
  generateHeritage(node) {
    let extendsText = "";
    let implementsText = "";
    node.getHeritageClauses().forEach((clause)=>{
      if (clause.getToken() === SyntaxKind.ExtendsKeyword) {
        const types = clause.getTypeNodes().map((t)=>t.getText()).join(", ");
        extendsText = ` extends ${types}`;
      } else if (clause.getToken() === SyntaxKind.ImplementsKeyword) {
        const types = clause.getTypeNodes().map((t)=>t.getText()).join(", ");
        implementsText = ` implements ${types}`;
      }
    });
    return `${extendsText}${implementsText}`;
  }
  generateClassMember(member) {
    switch(member.getKind()){
      case SyntaxKind.MethodDeclaration:
        return this.generateMethod(member);
      case SyntaxKind.PropertyDeclaration:
        return this.generateProperty(member);
      case SyntaxKind.Constructor:
        return this.generateConstructor(member);
      default:
        return member.getText();
    }
  }
  generateMethod(method) {
    const nameNode = method.getNameNode();
    let methodName = "[anonymous]";
    if (nameNode && nameNode.getKind() === SyntaxKind.Identifier) {
      methodName = nameNode.getText() || "[anonymous]";
    } else {
      methodName = method.getName() || "[anonymous]";
    }
    const typeParams = this.generateTypeParameters(method.getTypeParameters() || []);
    const params = method.getParameters().map((p)=>this.generateParameter(p)).join(", ");
    const returnType = method.getReturnTypeNode() ? `: ${method.getReturnTypeNode().getText()}` : "";
    const body = method.getBody() ? method.getBody().getText() : "{}";
    return `${methodName}${typeParams}(${params})${returnType} ${body}`;
  }
  generateProperty(prop) {
    const name = prop.getName();
    const typeNode = prop.getTypeNode();
    const typeText = typeNode ? `: ${typeNode.getText()}` : "";
    const initializer = prop.getInitializer()?.getText() || "";
    const initText = initializer ? ` = ${initializer}` : "";
    return `${name}${typeText}${initText};`;
  }
  generateConstructor(ctor) {
    const params = ctor.getParameters().map((p)=>this.generateParameter(p)).join(", ");
    const body = ctor.getBody() ? ctor.getBody().getText() : "{}";
    return `constructor(${params}) ${body}`;
  }
  // --------------------------------------------------------------------------
  //  Merge Code + Source Map
  // --------------------------------------------------------------------------
  mergeCodeFragments(fragments) {
    return fragments.filter((f)=>f.code).map((f)=>f.code).join("\n");
  }
  generateInitialSourceMap(fragments) {
    const map = new SourceMapGenerator({
      file: "bundle.js"
    });
    let generatedLine = 1;
    let generatedColumn = 0;
    for (const frag of fragments){
      if (frag.sourceFile && frag.line && frag.column) {
        map.addMapping({
          generated: {
            line: generatedLine,
            column: generatedColumn
          },
          original: {
            line: frag.line,
            column: frag.column
          },
          source: frag.sourceFile
        });
      }
      const lines = frag.code.split("\n");
      if (lines.length > 1) {
        generatedLine += lines.length - 1;
        generatedColumn = lines[lines.length - 1].length;
      } else {
        generatedColumn += lines[0].length;
      }
    }
    // Add source content
    const uniqueSources = new Set(fragments.map((f)=>f.sourceFile).filter((s)=>!!s));
    for (const sourceFilePath of uniqueSources){
      try {
        const fileContent = Deno.readTextFileSync(sourceFilePath);
        map.setSourceContent(sourceFilePath, fileContent);
      } catch  {
      // skip
      }
    }
    return map.toJSON();
  }
  // --------------------------------------------------------------------------
  //  Transforms + Source Map
  // --------------------------------------------------------------------------
  async transformCode(code, inputMap, target, withSourceMap) {
    let tsTarget;
    switch(target.toLowerCase()){
      case "es5":
        tsTarget = ts.ScriptTarget.ES5;
        break;
      case "es6":
      case "es2015":
        tsTarget = ts.ScriptTarget.ES2015;
        break;
      default:
        tsTarget = ts.ScriptTarget.ES2020;
        break;
    }
    const project = new TsMorphProject({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: tsTarget,
        sourceMap: withSourceMap,
        declaration: false
      }
    });
    const filePath = "in-memory.ts";
    const sourceFile = project.createSourceFile(filePath, code, {
      overwrite: true
    });
    const emitOutput = sourceFile.getEmitOutput();
    const outputFiles = emitOutput.getOutputFiles();
    let transformedCode = code;
    let transformedMap;
    for (const outFile of outputFiles){
      if (outFile.getFilePath().endsWith(".js")) {
        transformedCode = outFile.getText();
      } else if (outFile.getFilePath().endsWith(".js.map")) {
        transformedMap = outFile.getText();
      }
    }
    // Merge source maps
    if (withSourceMap && transformedMap && inputMap) {
      const mergedMap = await this.mergeSourceMaps(JSON.stringify(inputMap), transformedMap);
      return {
        code: transformedCode,
        map: mergedMap
      };
    }
    return {
      code: transformedCode,
      map: transformedMap
    };
  }
  async mergeSourceMaps(existingMap, newMap) {
    const consumerOld = await new SourceMapConsumer(existingMap);
    const consumerNew = await new SourceMapConsumer(newMap);
    const generator = SourceMapGenerator.fromSourceMap(consumerNew);
    // Instead of any, cast to unknown then SourceMapConsumer
    generator.applySourceMap(consumerOld);
    consumerOld.destroy();
    consumerNew.destroy();
    return generator.toString();
  }
  // --------------------------------------------------------------------------
  //  Minification + Source Map
  // --------------------------------------------------------------------------
  async minifyCode(code, inputMap, withSourceMap) {
    try {
      const terserOptions = {
        compress: true,
        mangle: true
      };
      if (withSourceMap && inputMap) {
        terserOptions.sourceMap = {
          content: inputMap,
          filename: "bundle.js",
          url: "bundle.js.map"
        };
      }
      const terserResult = await terserMinify(code, terserOptions);
      if (!terserResult.code) {
        throw new Error("Terser failed to generate code.");
      }
      let finalMap;
      if (withSourceMap && terserResult.map) {
        // If Terser returns map as an object, convert to string
        if (typeof terserResult.map === "string") {
          finalMap = terserResult.map;
        } else {
          finalMap = JSON.stringify(terserResult.map);
        }
      }
      return {
        code: terserResult.code,
        map: finalMap
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.warnings.push(`Minification failed: ${msg}`);
      logger.warn(`Minification failed: ${msg}`);
      return {
        code
      };
    }
  }
  // --------------------------------------------------------------------------
  //  Module Format Wrappers
  // --------------------------------------------------------------------------
  wrapCodeWithFormat(code, format) {
    switch(format){
      case "commonjs":
        return this.wrapCommonJS(code);
      case "umd":
        return this.wrapUMD(code);
      case "es6":
      default:
        return code;
    }
  }
  wrapCommonJS(code) {
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
  wrapUMD(code) {
    const name = this.options.umdName || "bundle";
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
  logDiagnostic(diagnostic) {
    const message = diagnostic.getMessageText();
    const messageText = typeof message === "string" ? message : message.getMessageText();
    const sourceFile = diagnostic.getSourceFile();
    const pos = diagnostic.getStart();
    if (sourceFile && pos !== undefined) {
      const lineAndChar = sourceFile.getLineAndColumnAtPos(pos);
      logger.error(`${sourceFile.getFilePath()} (${lineAndChar.line + 1},${lineAndChar.column + 1}): ${messageText}`);
    } else {
      logger.error(messageText);
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29tcGlsZXIvY29kZWdlbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyAvc3JjL2NvbXBpbGVyL2NvZGVnZW4udHNcblxuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSBcIi4uL2xvZ2dlci50c1wiO1xuaW1wb3J0IHtcblx0UmF3U291cmNlTWFwLFxuXHRTb3VyY2VNYXBDb25zdW1lcixcblx0U291cmNlTWFwR2VuZXJhdG9yLFxufSBmcm9tIFwiaHR0cHM6Ly9lc20uc2gvc291cmNlLW1hcEAwLjcuNFwiO1xuaW1wb3J0IHtcblx0Q2xhc3NEZWNsYXJhdGlvbixcblx0Q29uc3RydWN0b3JEZWNsYXJhdGlvbixcblx0RGlhZ25vc3RpYyxcblx0RXhwb3J0RGVjbGFyYXRpb24sXG5cdEZ1bmN0aW9uRGVjbGFyYXRpb24sXG5cdEltcG9ydERlY2xhcmF0aW9uLFxuXHRNZXRob2REZWNsYXJhdGlvbixcblx0Tm9kZSxcblx0T3V0cHV0RmlsZSxcblx0UGFyYW1ldGVyRGVjbGFyYXRpb24sXG5cdFByb2plY3QgYXMgVHNNb3JwaFByb2plY3QsXG5cdFByb3BlcnR5RGVjbGFyYXRpb24sXG5cdFNvdXJjZUZpbGUsXG5cdFN5bnRheEtpbmQsXG5cdHRzLFxuXHRUeXBlUGFyYW1ldGVyRGVjbGFyYXRpb24sXG5cdFZhcmlhYmxlU3RhdGVtZW50LFxufSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC90c19tb3JwaEAxNy4wLjEvbW9kLnRzXCI7XG5pbXBvcnQgeyBtaW5pZnkgYXMgdGVyc2VyTWluaWZ5IH0gZnJvbSBcImh0dHBzOi8vZXNtLnNoL3RlcnNlckA1LjE0LjJcIjtcblxuLyoqXG4gKiBEZWZpbmVzIHRoZSBwb3NzaWJsZSBtb2R1bGUgZm9ybWF0cy5cbiAqL1xuZXhwb3J0IHR5cGUgTW9kdWxlRm9ybWF0ID0gXCJlczZcIiB8IFwiY29tbW9uanNcIiB8IFwidW1kXCI7IC8vIEFkZGVkIFwiZXNtXCIgaWYgbmVlZGVkXG5cbi8qKlxuICogT3B0aW9ucyBmb3IgY29kZSBnZW5lcmF0aW9uIGFuZCBidW5kbGluZyBvdXRwdXQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29kZUdlbk9wdGlvbnMge1xuXHRzb3VyY2VNYXBzOiBib29sZWFuO1xuXHRtaW5pZnk6IGJvb2xlYW47XG5cdHRhcmdldDogc3RyaW5nOyAvLyBlLmcuLCBcImVzNVwiLCBcImVzNlwiLCBcImVzMjAyMFwiLCBldGMuXG5cdGZvcm1hdD86IE1vZHVsZUZvcm1hdDtcblx0cGxhdGZvcm0/OiBcImJyb3dzZXJcIiB8IFwibm9kZVwiIHwgXCJkZW5vXCI7XG5cdGV4dGVybmFscz86IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIGZpbmFsIG91dHB1dCBmcm9tIHRoZSBjb2RlIGdlbmVyYXRvcjpcbiAqIC0gY29kZTogICBUaGUgZ2VuZXJhdGVkL3RyYW5zZm9ybWVkIGNvZGVcbiAqIC0gbWFwOiAgICBUaGUgZmluYWwgc291cmNlIG1hcCAoYXMgYSBzdHJpbmcpXG4gKiAtIHdhcm5pbmdzOiBBbnkgd2FybmluZ3MgcHJvZHVjZWRcbiAqIC0gYXNzZXRzOiBBZGRpdGlvbmFsIGFzc2V0cyBrZXllZCBieSBmaWxlIG5hbWVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBHZW5lcmF0ZWRPdXRwdXQge1xuXHRjb2RlOiBzdHJpbmc7XG5cdG1hcD86IHN0cmluZztcblx0d2FybmluZ3M6IHN0cmluZ1tdO1xuXHRhc3NldHM6IE1hcDxzdHJpbmcsIFVpbnQ4QXJyYXk+O1xufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBzaW5nbGUgY29kZSBmcmFnbWVudCB3aXRoaW4gdGhlIGJ1bmRsZS5cbiAqL1xuaW50ZXJmYWNlIENvZGVGcmFnbWVudCB7XG5cdGNvZGU6IHN0cmluZztcblx0bGluZT86IG51bWJlcjtcblx0Y29sdW1uPzogbnVtYmVyO1xuXHRzb3VyY2VGaWxlPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIFRoZSBDb2RlR2VuZXJhdG9yIGNsYXNzIGlzIHJlc3BvbnNpYmxlIGZvcjpcbiAqIDEuIFRyYXZlcnNpbmcgdGhlIEFTVCBhbmQgZXh0cmFjdGluZyBjb2RlIGZyYWdtZW50cy5cbiAqIDIuIEdlbmVyYXRpbmcgaW5pdGlhbCBzb3VyY2UgbWFwcyBmcm9tIHRoZXNlIGZyYWdtZW50cy5cbiAqIDMuIFRyYW5zZm9ybWluZyB0aGUgY29kZSAoRVM1LCBFUzYsIGV0Yy4pIHVzaW5nIFR5cGVTY3JpcHQgY29tcGlsZXIgZmVhdHVyZXMuXG4gKiA0LiBNZXJnaW5nIHNvdXJjZSBtYXBzIGZyb20gdHJhbnNmb3JtYXRpb25zIChUeXBlU2NyaXB0KSBhbmQgbWluaWZpY2F0aW9uIChUZXJzZXIpLlxuICogNS4gV3JhcHBpbmcgY29kZSBpbiBkaWZmZXJlbnQgbW9kdWxlIGZvcm1hdHMgKEVTNiwgQ29tbW9uSlMsIFVNRCkuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb2RlR2VuZXJhdG9yIHtcblx0cHJpdmF0ZSB3YXJuaW5nczogc3RyaW5nW10gPSBbXTtcblx0cHJpdmF0ZSBhc3NldHM6IE1hcDxzdHJpbmcsIFVpbnQ4QXJyYXk+ID0gbmV3IE1hcCgpO1xuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgb3B0aW9uczoge1xuXHRcdFx0dW1kTmFtZT86IHN0cmluZztcblx0XHRcdHRhcmdldDogdHMuU2NyaXB0VGFyZ2V0O1xuXHRcdFx0bW9kdWxlOiB0cy5Nb2R1bGVLaW5kO1xuXHRcdFx0ZXhwZXJpbWVudGFsRGVjb3JhdG9ycz86IGJvb2xlYW47XG5cdFx0XHRlbnRyeVBvaW50OiBzdHJpbmc7XG5cdFx0XHRvdXREaXI6IHN0cmluZztcblx0XHRcdHNvdXJjZU1hcHM6IGJvb2xlYW47XG5cdFx0XHRtaW5pZnk6IGJvb2xlYW47XG5cdFx0XHRwbHVnaW5zOiB1bmtub3duW107XG5cdFx0XHRwbGF0Zm9ybTogXCJicm93c2VyXCIgfCBcIm5vZGVcIiB8IFwiZGVub1wiO1xuXHRcdFx0ZXh0ZXJuYWxzOiBzdHJpbmdbXTtcblx0XHRcdGRlZmluZTogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblx0XHRcdHRyZWVzaGFrZTogYm9vbGVhbjtcblx0XHRcdGZvcm1hdDogTW9kdWxlRm9ybWF0O1xuXHRcdFx0ZW1pdERlY29yYXRvck1ldGFkYXRhPzogYm9vbGVhbjtcblx0XHR9LFxuXHQpIHt9XG5cblx0LyoqXG5cdCAqIEdlbmVyYXRlcyB0aGUgZmluYWwgb3V0cHV0IGNvZGUgYW5kIHNvdXJjZSBtYXAgZnJvbSB0aGUgYnVuZGxlZCBtb2R1bGVzLlxuXHQgKi9cblx0cHVibGljIGFzeW5jIGdlbmVyYXRlKFxuXHRcdGJ1bmRsZTogeyBhc3Q6IFNvdXJjZUZpbGU7IG1vZHVsZXM6IE1hcDxzdHJpbmcsIFNvdXJjZUZpbGU+IH0sXG5cdFx0Z2VuT3B0aW9uczogQ29kZUdlbk9wdGlvbnMsXG5cdCk6IFByb21pc2U8R2VuZXJhdGVkT3V0cHV0PiB7XG5cdFx0dGhpcy53YXJuaW5ncyA9IFtdO1xuXHRcdHRoaXMuYXNzZXRzLmNsZWFyKCk7XG5cblx0XHR0cnkge1xuXHRcdFx0Ly8gU3RlcCAxOiBDb2xsZWN0IGNvZGUgZnJhZ21lbnRzIGZyb20gQVNUXG5cdFx0XHRjb25zdCBmcmFnbWVudHMgPSB0aGlzLmNvbGxlY3RDb2RlRnJhZ21lbnRzKGJ1bmRsZS5hc3QsIGJ1bmRsZS5tb2R1bGVzKTtcblxuXHRcdFx0Ly8gU3RlcCAyOiBNZXJnZSBjb2RlIGZyYWdtZW50c1xuXHRcdFx0Y29uc3QgbWVyZ2VkQ29kZSA9IHRoaXMubWVyZ2VDb2RlRnJhZ21lbnRzKGZyYWdtZW50cyk7XG5cblx0XHRcdC8vIFN0ZXAgMzogR2VuZXJhdGUgaW5pdGlhbCBzb3VyY2UgbWFwXG5cdFx0XHRjb25zdCBpbml0aWFsU291cmNlTWFwID0gZ2VuT3B0aW9ucy5zb3VyY2VNYXBzXG5cdFx0XHRcdD8gdGhpcy5nZW5lcmF0ZUluaXRpYWxTb3VyY2VNYXAoZnJhZ21lbnRzKVxuXHRcdFx0XHQ6IHVuZGVmaW5lZDtcblxuXHRcdFx0Ly8gU3RlcCA0OiBUcmFuc2Zvcm0gY29kZSBpZiBuZWVkZWQgKEVTNSwgZXRjLilcblx0XHRcdGNvbnN0IHRyYW5zZm9ybVJlc3VsdCA9IGF3YWl0IHRoaXMudHJhbnNmb3JtQ29kZShcblx0XHRcdFx0bWVyZ2VkQ29kZSxcblx0XHRcdFx0aW5pdGlhbFNvdXJjZU1hcCxcblx0XHRcdFx0Z2VuT3B0aW9ucy50YXJnZXQsXG5cdFx0XHRcdGdlbk9wdGlvbnMuc291cmNlTWFwcyxcblx0XHRcdCk7XG5cdFx0XHRsZXQgdHJhbnNmb3JtZWRDb2RlID0gdHJhbnNmb3JtUmVzdWx0LmNvZGU7XG5cdFx0XHRsZXQgY3VycmVudFNvdXJjZU1hcCA9IHRyYW5zZm9ybVJlc3VsdC5tYXA7XG5cblx0XHRcdC8vIFN0ZXAgNTogTWluaWZ5IGlmIHJlcXVlc3RlZFxuXHRcdFx0aWYgKGdlbk9wdGlvbnMubWluaWZ5KSB7XG5cdFx0XHRcdGNvbnN0IG1pbmlmeVJlc3VsdCA9IGF3YWl0IHRoaXMubWluaWZ5Q29kZShcblx0XHRcdFx0XHR0cmFuc2Zvcm1lZENvZGUsXG5cdFx0XHRcdFx0Y3VycmVudFNvdXJjZU1hcCxcblx0XHRcdFx0XHRnZW5PcHRpb25zLnNvdXJjZU1hcHMsXG5cdFx0XHRcdCk7XG5cdFx0XHRcdHRyYW5zZm9ybWVkQ29kZSA9IG1pbmlmeVJlc3VsdC5jb2RlO1xuXHRcdFx0XHRpZiAoZ2VuT3B0aW9ucy5zb3VyY2VNYXBzICYmIG1pbmlmeVJlc3VsdC5tYXApIHtcblx0XHRcdFx0XHRjdXJyZW50U291cmNlTWFwID0gbWluaWZ5UmVzdWx0Lm1hcDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBTdGVwIDY6IFdyYXAgY29kZSB3aXRoIHRoZSBzcGVjaWZpZWQgbW9kdWxlIGZvcm1hdFxuXHRcdFx0Y29uc3QgZmluYWxDb2RlID0gdGhpcy53cmFwQ29kZVdpdGhGb3JtYXQoXG5cdFx0XHRcdHRyYW5zZm9ybWVkQ29kZSxcblx0XHRcdFx0Z2VuT3B0aW9ucy5mb3JtYXQgfHwgXCJlczZcIixcblx0XHRcdCk7XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGNvZGU6IGZpbmFsQ29kZSxcblx0XHRcdFx0bWFwOiBjdXJyZW50U291cmNlTWFwLFxuXHRcdFx0XHR3YXJuaW5nczogdGhpcy53YXJuaW5ncyxcblx0XHRcdFx0YXNzZXRzOiB0aGlzLmFzc2V0cyxcblx0XHRcdH07XG5cdFx0fSBjYXRjaCAoZXJyOiB1bmtub3duKSB7XG5cdFx0XHRjb25zdCBtc2cgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycik7XG5cdFx0XHRsb2dnZXIuZXJyb3IoYENvZGUgZ2VuZXJhdGlvbiBmYWlsZWQ6ICR7bXNnfWApO1xuXHRcdFx0dGhyb3cgZXJyO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBDb2xsZWN0IGNvZGUgZnJhZ21lbnRzIGZyb20gdGhlIG1haW4gQVNUICsgZWFjaCBtb2R1bGUncyBBU1QuXG5cdCAqL1xuXHRwcml2YXRlIGNvbGxlY3RDb2RlRnJhZ21lbnRzKFxuXHRcdGFzdDogU291cmNlRmlsZSxcblx0XHRtb2R1bGVzOiBNYXA8c3RyaW5nLCBTb3VyY2VGaWxlPixcblx0KTogQ29kZUZyYWdtZW50W10ge1xuXHRcdGNvbnN0IGZyYWdtZW50czogQ29kZUZyYWdtZW50W10gPSBbXTtcblxuXHRcdGNvbnN0IGhhbmRsZUFTVCA9IChzb3VyY2U6IFNvdXJjZUZpbGUpID0+IHtcblx0XHRcdHRoaXMudHJhdmVyc2VOb2RlKHNvdXJjZSwge1xuXHRcdFx0XHRvbk5vZGU6IChub2RlOiBOb2RlKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgZnJhZ21lbnQgPSB0aGlzLmdlbmVyYXRlTm9kZUNvZGUobm9kZSk7XG5cdFx0XHRcdFx0aWYgKGZyYWdtZW50KSBmcmFnbWVudHMucHVzaChmcmFnbWVudCk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uRXJyb3I6IChtc2c6IHN0cmluZykgPT4ge1xuXHRcdFx0XHRcdHRoaXMud2FybmluZ3MucHVzaChtc2cpO1xuXHRcdFx0XHR9LFxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdC8vIE1haW4gQVNUXG5cdFx0aGFuZGxlQVNUKGFzdCk7XG5cblx0XHQvLyBFYWNoIG1vZHVsZVxuXHRcdGZvciAoY29uc3QgbW9kdWxlQVNUIG9mIG1vZHVsZXMudmFsdWVzKCkpIHtcblx0XHRcdGhhbmRsZUFTVChtb2R1bGVBU1QpO1xuXHRcdH1cblxuXHRcdHJldHVybiBmcmFnbWVudHM7XG5cdH1cblxuXHQvKipcblx0ICogUmVjdXJzaXZlbHkgdHJhdmVyc2UgYW4gQVNULCBhcHBseWluZyB0aGUgbm9kZS9lcnJvciBoYW5kbGVycy5cblx0ICovXG5cdHByaXZhdGUgdHJhdmVyc2VOb2RlKFxuXHRcdG5vZGU6IE5vZGUsXG5cdFx0aGFuZGxlcnM6IHsgb25Ob2RlOiAobm9kZTogTm9kZSkgPT4gdm9pZDsgb25FcnJvcjogKG1zZzogc3RyaW5nKSA9PiB2b2lkIH0sXG5cdCk6IHZvaWQge1xuXHRcdHRyeSB7XG5cdFx0XHRoYW5kbGVycy5vbk5vZGUobm9kZSk7XG5cdFx0XHRub2RlLmZvckVhY2hDaGlsZCgoY2hpbGQpID0+IHRoaXMudHJhdmVyc2VOb2RlKGNoaWxkLCBoYW5kbGVycykpO1xuXHRcdH0gY2F0Y2ggKGVycjogdW5rbm93bikge1xuXHRcdFx0Y29uc3QgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuXHRcdFx0aGFuZGxlcnMub25FcnJvcihtc2cpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBHZW5lcmF0ZXMgYSBDb2RlRnJhZ21lbnQgZnJvbSBhIGdpdmVuIE5vZGUuXG5cdCAqL1xuXHRwcml2YXRlIGdlbmVyYXRlTm9kZUNvZGUobm9kZTogTm9kZSk6IENvZGVGcmFnbWVudCB8IG51bGwge1xuXHRcdGNvbnN0IHNvdXJjZUZpbGUgPSBub2RlLmdldFNvdXJjZUZpbGUoKTtcblx0XHRjb25zdCB7IGxpbmUsIGNvbHVtbiB9ID0gc291cmNlRmlsZS5nZXRMaW5lQW5kQ29sdW1uQXRQb3Mobm9kZS5nZXRTdGFydCgpKTtcblx0XHRjb25zdCBjb2RlID0gdGhpcy5nZW5lcmF0ZUNvZGVGb3JOb2RlKG5vZGUpO1xuXHRcdGlmICghY29kZSkgcmV0dXJuIG51bGw7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29kZSxcblx0XHRcdGxpbmU6IGxpbmUgKyAxLFxuXHRcdFx0Y29sdW1uOiBjb2x1bW4gKyAxLFxuXHRcdFx0c291cmNlRmlsZTogc291cmNlRmlsZS5nZXRGaWxlUGF0aCgpLFxuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogRGVjaWRlIGhvdyB0byBnZW5lcmF0ZSBjb2RlIGZvciBzcGVjaWZpYyBub2RlIGtpbmRzLiBPdGhlcndpc2UsIGZhbGxiYWNrIHRvIGdldFRleHQoKS5cblx0ICovXG5cdHByaXZhdGUgZ2VuZXJhdGVDb2RlRm9yTm9kZShub2RlOiBOb2RlKTogc3RyaW5nIHwgbnVsbCB7XG5cdFx0c3dpdGNoIChub2RlLmdldEtpbmQoKSkge1xuXHRcdFx0Y2FzZSBTeW50YXhLaW5kLkltcG9ydERlY2xhcmF0aW9uOlxuXHRcdFx0XHRyZXR1cm4gdGhpcy5nZW5lcmF0ZUltcG9ydChub2RlIGFzIEltcG9ydERlY2xhcmF0aW9uKTtcblx0XHRcdGNhc2UgU3ludGF4S2luZC5FeHBvcnREZWNsYXJhdGlvbjpcblx0XHRcdFx0cmV0dXJuIHRoaXMuZ2VuZXJhdGVFeHBvcnQobm9kZSBhcyBFeHBvcnREZWNsYXJhdGlvbik7XG5cdFx0XHRjYXNlIFN5bnRheEtpbmQuRnVuY3Rpb25EZWNsYXJhdGlvbjpcblx0XHRcdFx0cmV0dXJuIHRoaXMuZ2VuZXJhdGVGdW5jdGlvbihub2RlIGFzIEZ1bmN0aW9uRGVjbGFyYXRpb24pO1xuXHRcdFx0Y2FzZSBTeW50YXhLaW5kLkNsYXNzRGVjbGFyYXRpb246XG5cdFx0XHRcdHJldHVybiB0aGlzLmdlbmVyYXRlQ2xhc3Mobm9kZSBhcyBDbGFzc0RlY2xhcmF0aW9uKTtcblx0XHRcdGNhc2UgU3ludGF4S2luZC5WYXJpYWJsZVN0YXRlbWVudDpcblx0XHRcdFx0cmV0dXJuIHRoaXMuZ2VuZXJhdGVWYXJpYWJsZShub2RlIGFzIFZhcmlhYmxlU3RhdGVtZW50KTtcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiBub2RlLmdldFRleHQoKTtcblx0XHR9XG5cdH1cblxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQvLyAgTm9kZS1zcGVjaWZpYyBjb2RlIGdlbmVyYXRpb25cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRwcml2YXRlIGdlbmVyYXRlSW1wb3J0KG5vZGU6IEltcG9ydERlY2xhcmF0aW9uKTogc3RyaW5nIHtcblx0XHRjb25zdCBpbXBvcnRDbGF1c2UgPSBub2RlLmdldEltcG9ydENsYXVzZSgpO1xuXHRcdGlmICghaW1wb3J0Q2xhdXNlKSByZXR1cm4gXCJcIjtcblx0XHRsZXQgaW1wb3J0U3RhdGVtZW50ID0gXCJpbXBvcnQgXCI7XG5cdFx0Y29uc3QgbmFtZXNwYWNlSW1wb3J0ID0gaW1wb3J0Q2xhdXNlLmdldE5hbWVzcGFjZUltcG9ydCgpO1xuXG5cdFx0aWYgKG5hbWVzcGFjZUltcG9ydCkge1xuXHRcdFx0Ly8gR2V0IG5hbWVzcGFjZSBuYW1lIHZpYSBnZXRUZXh0KCkgaW5zdGVhZCBvZiBnZXROYW1lKClcblx0XHRcdGNvbnN0IG5hbWVzcGFjZU5hbWUgPSBuYW1lc3BhY2VJbXBvcnQuZ2V0VGV4dCgpO1xuXHRcdFx0aW1wb3J0U3RhdGVtZW50ICs9XG5cdFx0XHRcdGAqIGFzICR7bmFtZXNwYWNlTmFtZX0gZnJvbSBcIiR7bm9kZS5nZXRNb2R1bGVTcGVjaWZpZXJWYWx1ZSgpfVwiO2A7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IG5hbWVkSW1wb3J0cyA9IGltcG9ydENsYXVzZS5nZXROYW1lZEltcG9ydHMoKTtcblx0XHRcdGNvbnN0IGRlZmF1bHRJbXBvcnQgPSBpbXBvcnRDbGF1c2UuZ2V0RGVmYXVsdEltcG9ydCgpO1xuXHRcdFx0Y29uc3QgZGVmYXVsdEltcG9ydFRleHQgPSBkZWZhdWx0SW1wb3J0Py5nZXRUZXh0KCkgfHwgXCJcIjtcblxuXHRcdFx0aWYgKGRlZmF1bHRJbXBvcnRUZXh0ICYmIG5hbWVkSW1wb3J0cy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdGNvbnN0IG5hbWVkTGlzdCA9IG5hbWVkSW1wb3J0cy5tYXAoKHNwZWMpID0+IHtcblx0XHRcdFx0XHRjb25zdCBuYW1lID0gc3BlYy5nZXROYW1lKCk7XG5cdFx0XHRcdFx0Y29uc3QgYWxpYXNOb2RlID0gc3BlYy5nZXRBbGlhc05vZGUoKTtcblx0XHRcdFx0XHRjb25zdCBhbGlhc1RleHQgPSBhbGlhc05vZGUgPyBhbGlhc05vZGUuZ2V0VGV4dCgpIDogXCJcIjtcblx0XHRcdFx0XHRyZXR1cm4gYWxpYXNUZXh0ID8gYCR7bmFtZX0gYXMgJHthbGlhc1RleHR9YCA6IG5hbWU7XG5cdFx0XHRcdH0pLmpvaW4oXCIsIFwiKTtcblx0XHRcdFx0aW1wb3J0U3RhdGVtZW50ICs9XG5cdFx0XHRcdFx0YCR7ZGVmYXVsdEltcG9ydFRleHR9LCB7ICR7bmFtZWRMaXN0fSB9IGZyb20gXCIke25vZGUuZ2V0TW9kdWxlU3BlY2lmaWVyVmFsdWUoKX1cIjtgO1xuXHRcdFx0fSBlbHNlIGlmIChkZWZhdWx0SW1wb3J0VGV4dCkge1xuXHRcdFx0XHRpbXBvcnRTdGF0ZW1lbnQgKz1cblx0XHRcdFx0XHRgJHtkZWZhdWx0SW1wb3J0VGV4dH0gZnJvbSBcIiR7bm9kZS5nZXRNb2R1bGVTcGVjaWZpZXJWYWx1ZSgpfVwiO2A7XG5cdFx0XHR9IGVsc2UgaWYgKG5hbWVkSW1wb3J0cy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdGNvbnN0IG5hbWVkTGlzdCA9IG5hbWVkSW1wb3J0cy5tYXAoKHNwZWMpID0+IHtcblx0XHRcdFx0XHRjb25zdCBuYW1lID0gc3BlYy5nZXROYW1lKCk7XG5cdFx0XHRcdFx0Y29uc3QgYWxpYXNOb2RlID0gc3BlYy5nZXRBbGlhc05vZGUoKTtcblx0XHRcdFx0XHRjb25zdCBhbGlhc1RleHQgPSBhbGlhc05vZGUgPyBhbGlhc05vZGUuZ2V0VGV4dCgpIDogXCJcIjtcblx0XHRcdFx0XHRyZXR1cm4gYWxpYXNUZXh0ID8gYCR7bmFtZX0gYXMgJHthbGlhc1RleHR9YCA6IG5hbWU7XG5cdFx0XHRcdH0pLmpvaW4oXCIsIFwiKTtcblx0XHRcdFx0aW1wb3J0U3RhdGVtZW50ICs9XG5cdFx0XHRcdFx0YHsgJHtuYW1lZExpc3R9IH0gZnJvbSBcIiR7bm9kZS5nZXRNb2R1bGVTcGVjaWZpZXJWYWx1ZSgpfVwiO2A7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGltcG9ydFN0YXRlbWVudDtcblx0fVxuXG5cdHByaXZhdGUgZ2VuZXJhdGVFeHBvcnQobm9kZTogRXhwb3J0RGVjbGFyYXRpb24pOiBzdHJpbmcge1xuXHRcdC8vIFJlbW92ZSBleHBsaWNpdCBFeHBvcnRTcGVjaWZpZXIgdHlwZVxuXHRcdGNvbnN0IG5hbWVkRXhwb3J0cyA9IG5vZGUuZ2V0TmFtZWRFeHBvcnRzKCk7XG5cdFx0Y29uc3QgbmFtZXNwYWNlRXhwb3J0ID0gbm9kZS5nZXROYW1lc3BhY2VFeHBvcnQoKTtcblxuXHRcdGlmIChuYW1lZEV4cG9ydHMubGVuZ3RoID4gMCkge1xuXHRcdFx0Y29uc3QgZXhwb3J0c0xpc3QgPSBuYW1lZEV4cG9ydHMubWFwKChzcGVjKSA9PiB7XG5cdFx0XHRcdGNvbnN0IG5hbWUgPSBzcGVjLmdldE5hbWUoKTtcblx0XHRcdFx0Y29uc3QgYWxpYXMgPSBzcGVjLmdldEFsaWFzTm9kZSgpPy5nZXRUZXh0KCk7XG5cdFx0XHRcdHJldHVybiBhbGlhcyA/IGAke25hbWV9IGFzICR7YWxpYXN9YCA6IG5hbWU7XG5cdFx0XHR9KS5qb2luKFwiLCBcIik7XG5cdFx0XHRyZXR1cm4gYGV4cG9ydCB7ICR7ZXhwb3J0c0xpc3R9IH0gZnJvbSBcIiR7bm9kZS5nZXRNb2R1bGVTcGVjaWZpZXJWYWx1ZSgpfVwiO2A7XG5cdFx0fSBlbHNlIGlmIChuYW1lc3BhY2VFeHBvcnQpIHtcblx0XHRcdGNvbnN0IG5hbWVzcGFjZU5hbWUgPSBuYW1lc3BhY2VFeHBvcnQuZ2V0TmFtZSgpO1xuXHRcdFx0cmV0dXJuIGBleHBvcnQgKiBhcyAke25hbWVzcGFjZU5hbWV9IGZyb20gXCIke25vZGUuZ2V0TW9kdWxlU3BlY2lmaWVyVmFsdWUoKX1cIjtgO1xuXHRcdH1cblx0XHRyZXR1cm4gXCJleHBvcnQge307XCI7XG5cdH1cblxuXHRwcml2YXRlIGdlbmVyYXRlRnVuY3Rpb24obm9kZTogRnVuY3Rpb25EZWNsYXJhdGlvbik6IHN0cmluZyB7XG5cdFx0Y29uc3QgbmFtZSA9IG5vZGUuZ2V0TmFtZSgpID8/IFwiXCI7XG5cdFx0Y29uc3QgdHlwZVBhcmFtcyA9IHRoaXMuZ2VuZXJhdGVUeXBlUGFyYW1ldGVycyhcblx0XHRcdG5vZGUuZ2V0VHlwZVBhcmFtZXRlcnMoKSB8fCBbXSxcblx0XHQpO1xuXHRcdGNvbnN0IHBhcmFtcyA9IG5vZGUuZ2V0UGFyYW1ldGVycygpLm1hcCgocCkgPT4gdGhpcy5nZW5lcmF0ZVBhcmFtZXRlcihwKSlcblx0XHRcdC5qb2luKFwiLCBcIik7XG5cdFx0Y29uc3QgcmV0dXJuVHlwZSA9IG5vZGUuZ2V0UmV0dXJuVHlwZU5vZGUoKVxuXHRcdFx0PyBgOiAke25vZGUuZ2V0UmV0dXJuVHlwZU5vZGUoKSEuZ2V0VGV4dCgpfWBcblx0XHRcdDogXCJcIjtcblx0XHRjb25zdCBib2R5ID0gbm9kZS5nZXRCb2R5KCkgPyBub2RlLmdldEJvZHkoKSEuZ2V0VGV4dCgpIDogXCJ7fVwiO1xuXHRcdHJldHVybiBgZnVuY3Rpb24gJHtuYW1lfSR7dHlwZVBhcmFtc30oJHtwYXJhbXN9KSR7cmV0dXJuVHlwZX0gJHtib2R5fWA7XG5cdH1cblxuXHRwcml2YXRlIGdlbmVyYXRlQ2xhc3Mobm9kZTogQ2xhc3NEZWNsYXJhdGlvbik6IHN0cmluZyB7XG5cdFx0Y29uc3QgbmFtZSA9IG5vZGUuZ2V0TmFtZSgpID8/IFwiXCI7XG5cdFx0Y29uc3QgdHlwZVBhcmFtcyA9IHRoaXMuZ2VuZXJhdGVUeXBlUGFyYW1ldGVycyhcblx0XHRcdG5vZGUuZ2V0VHlwZVBhcmFtZXRlcnMoKSB8fCBbXSxcblx0XHQpO1xuXHRcdGNvbnN0IGhlcml0YWdlID0gdGhpcy5nZW5lcmF0ZUhlcml0YWdlKG5vZGUpO1xuXHRcdGNvbnN0IG1lbWJlcnMgPSBub2RlLmdldE1lbWJlcnMoKS5tYXAoKG0pID0+IHRoaXMuZ2VuZXJhdGVDbGFzc01lbWJlcihtKSlcblx0XHRcdC5qb2luKFwiXFxuXCIpO1xuXHRcdHJldHVybiBgY2xhc3MgJHtuYW1lfSR7dHlwZVBhcmFtc30ke2hlcml0YWdlfSB7XFxuJHttZW1iZXJzfVxcbn1gO1xuXHR9XG5cblx0cHJpdmF0ZSBnZW5lcmF0ZVZhcmlhYmxlKG5vZGU6IFZhcmlhYmxlU3RhdGVtZW50KTogc3RyaW5nIHtcblx0XHRjb25zdCBkZWNsYXJhdGlvbkxpc3QgPSBub2RlLmdldERlY2xhcmF0aW9uTGlzdCgpO1xuXHRcdGNvbnN0IGRlY2xhcmF0aW9ucyA9IGRlY2xhcmF0aW9uTGlzdC5nZXREZWNsYXJhdGlvbnMoKS5tYXAoKGRlY2wpID0+IHtcblx0XHRcdGNvbnN0IHZhcmlhYmxlTmFtZSA9IGRlY2wuZ2V0TmFtZSgpO1xuXHRcdFx0Y29uc3QgdHlwZU5vZGUgPSBkZWNsLmdldFR5cGVOb2RlKCk7XG5cdFx0XHRjb25zdCB0eXBlVGV4dCA9IHR5cGVOb2RlID8gYDogJHt0eXBlTm9kZS5nZXRUZXh0KCl9YCA6IFwiXCI7XG5cdFx0XHRjb25zdCBpbml0aWFsaXplciA9IGRlY2wuZ2V0SW5pdGlhbGl6ZXIoKT8uZ2V0VGV4dCgpIHx8IFwiXCI7XG5cdFx0XHRyZXR1cm4gaW5pdGlhbGl6ZXJcblx0XHRcdFx0PyBgJHt2YXJpYWJsZU5hbWV9JHt0eXBlVGV4dH0gPSAke2luaXRpYWxpemVyfWBcblx0XHRcdFx0OiBgJHt2YXJpYWJsZU5hbWV9JHt0eXBlVGV4dH1gO1xuXHRcdH0pO1xuXHRcdGNvbnN0IGZsYWdzID0gZGVjbGFyYXRpb25MaXN0LmdldEZsYWdzKCk7XG5cdFx0bGV0IGtleXdvcmQgPSBcInZhclwiO1xuXHRcdGlmIChmbGFncyAmIHRzLk5vZGVGbGFncy5Db25zdCkga2V5d29yZCA9IFwiY29uc3RcIjtcblx0XHRlbHNlIGlmIChmbGFncyAmIHRzLk5vZGVGbGFncy5MZXQpIGtleXdvcmQgPSBcImxldFwiO1xuXHRcdHJldHVybiBgJHtrZXl3b3JkfSAke2RlY2xhcmF0aW9ucy5qb2luKFwiLCBcIil9O2A7XG5cdH1cblxuXHRwcml2YXRlIGdlbmVyYXRlVHlwZVBhcmFtZXRlcnMoXG5cdFx0dHlwZVBhcmFtczogVHlwZVBhcmFtZXRlckRlY2xhcmF0aW9uW10sXG5cdCk6IHN0cmluZyB7XG5cdFx0aWYgKCF0eXBlUGFyYW1zLmxlbmd0aCkgcmV0dXJuIFwiXCI7XG5cdFx0Y29uc3QgcGFyYW1zID0gdHlwZVBhcmFtcy5tYXAoKHRwKSA9PiB7XG5cdFx0XHRjb25zdCBjb25zdHJhaW50ID0gdHAuZ2V0Q29uc3RyYWludCgpXG5cdFx0XHRcdD8gYCBleHRlbmRzICR7dHAuZ2V0Q29uc3RyYWludCgpIS5nZXRUZXh0KCl9YFxuXHRcdFx0XHQ6IFwiXCI7XG5cdFx0XHRjb25zdCBkZWZhdWx0VHlwZSA9IHRwLmdldERlZmF1bHQoKVxuXHRcdFx0XHQ/IGAgPSAke3RwLmdldERlZmF1bHQoKSEuZ2V0VGV4dCgpfWBcblx0XHRcdFx0OiBcIlwiO1xuXHRcdFx0cmV0dXJuIGAke3RwLmdldE5hbWUoKX0ke2NvbnN0cmFpbnR9JHtkZWZhdWx0VHlwZX1gO1xuXHRcdH0pLmpvaW4oXCIsIFwiKTtcblx0XHRyZXR1cm4gYDwke3BhcmFtc30+YDtcblx0fVxuXG5cdHByaXZhdGUgZ2VuZXJhdGVQYXJhbWV0ZXIocGFyYW06IFBhcmFtZXRlckRlY2xhcmF0aW9uKTogc3RyaW5nIHtcblx0XHRjb25zdCBuYW1lID0gcGFyYW0uZ2V0TmFtZSgpO1xuXHRcdGNvbnN0IGlzT3B0aW9uYWwgPSBwYXJhbS5pc09wdGlvbmFsKCkgPyBcIj9cIiA6IFwiXCI7XG5cdFx0Y29uc3QgdHlwZU5vZGUgPSBwYXJhbS5nZXRUeXBlTm9kZSgpO1xuXHRcdGNvbnN0IHR5cGVUZXh0ID0gdHlwZU5vZGUgPyBgOiAke3R5cGVOb2RlLmdldFRleHQoKX1gIDogXCJcIjtcblx0XHRjb25zdCBpbml0aWFsaXplciA9IHBhcmFtLmdldEluaXRpYWxpemVyKCk/LmdldFRleHQoKSB8fCBcIlwiO1xuXHRcdGNvbnN0IGluaXRUZXh0ID0gaW5pdGlhbGl6ZXIgPyBgID0gJHtpbml0aWFsaXplcn1gIDogXCJcIjtcblx0XHRyZXR1cm4gYCR7bmFtZX0ke2lzT3B0aW9uYWx9JHt0eXBlVGV4dH0ke2luaXRUZXh0fWA7XG5cdH1cblxuXHRwcml2YXRlIGdlbmVyYXRlSGVyaXRhZ2Uobm9kZTogQ2xhc3NEZWNsYXJhdGlvbik6IHN0cmluZyB7XG5cdFx0bGV0IGV4dGVuZHNUZXh0ID0gXCJcIjtcblx0XHRsZXQgaW1wbGVtZW50c1RleHQgPSBcIlwiO1xuXHRcdG5vZGUuZ2V0SGVyaXRhZ2VDbGF1c2VzKCkuZm9yRWFjaCgoY2xhdXNlKSA9PiB7XG5cdFx0XHRpZiAoY2xhdXNlLmdldFRva2VuKCkgPT09IFN5bnRheEtpbmQuRXh0ZW5kc0tleXdvcmQpIHtcblx0XHRcdFx0Y29uc3QgdHlwZXMgPSBjbGF1c2UuZ2V0VHlwZU5vZGVzKCkubWFwKCh0KSA9PiB0LmdldFRleHQoKSkuam9pbihcIiwgXCIpO1xuXHRcdFx0XHRleHRlbmRzVGV4dCA9IGAgZXh0ZW5kcyAke3R5cGVzfWA7XG5cdFx0XHR9IGVsc2UgaWYgKGNsYXVzZS5nZXRUb2tlbigpID09PSBTeW50YXhLaW5kLkltcGxlbWVudHNLZXl3b3JkKSB7XG5cdFx0XHRcdGNvbnN0IHR5cGVzID0gY2xhdXNlLmdldFR5cGVOb2RlcygpLm1hcCgodCkgPT4gdC5nZXRUZXh0KCkpLmpvaW4oXCIsIFwiKTtcblx0XHRcdFx0aW1wbGVtZW50c1RleHQgPSBgIGltcGxlbWVudHMgJHt0eXBlc31gO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiBgJHtleHRlbmRzVGV4dH0ke2ltcGxlbWVudHNUZXh0fWA7XG5cdH1cblxuXHRwcml2YXRlIGdlbmVyYXRlQ2xhc3NNZW1iZXIobWVtYmVyOiBOb2RlKTogc3RyaW5nIHtcblx0XHRzd2l0Y2ggKG1lbWJlci5nZXRLaW5kKCkpIHtcblx0XHRcdGNhc2UgU3ludGF4S2luZC5NZXRob2REZWNsYXJhdGlvbjpcblx0XHRcdFx0cmV0dXJuIHRoaXMuZ2VuZXJhdGVNZXRob2QobWVtYmVyIGFzIE1ldGhvZERlY2xhcmF0aW9uKTtcblx0XHRcdGNhc2UgU3ludGF4S2luZC5Qcm9wZXJ0eURlY2xhcmF0aW9uOlxuXHRcdFx0XHRyZXR1cm4gdGhpcy5nZW5lcmF0ZVByb3BlcnR5KG1lbWJlciBhcyBQcm9wZXJ0eURlY2xhcmF0aW9uKTtcblx0XHRcdGNhc2UgU3ludGF4S2luZC5Db25zdHJ1Y3Rvcjpcblx0XHRcdFx0cmV0dXJuIHRoaXMuZ2VuZXJhdGVDb25zdHJ1Y3RvcihtZW1iZXIgYXMgQ29uc3RydWN0b3JEZWNsYXJhdGlvbik7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRyZXR1cm4gbWVtYmVyLmdldFRleHQoKTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGdlbmVyYXRlTWV0aG9kKG1ldGhvZDogTWV0aG9kRGVjbGFyYXRpb24pOiBzdHJpbmcge1xuXHRcdGNvbnN0IG5hbWVOb2RlID0gbWV0aG9kLmdldE5hbWVOb2RlKCk7XG5cdFx0bGV0IG1ldGhvZE5hbWUgPSBcIlthbm9ueW1vdXNdXCI7XG5cblx0XHRpZiAobmFtZU5vZGUgJiYgbmFtZU5vZGUuZ2V0S2luZCgpID09PSBTeW50YXhLaW5kLklkZW50aWZpZXIpIHtcblx0XHRcdG1ldGhvZE5hbWUgPSAobmFtZU5vZGUgYXMgTm9kZSkuZ2V0VGV4dCgpIHx8IFwiW2Fub255bW91c11cIjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bWV0aG9kTmFtZSA9IG1ldGhvZC5nZXROYW1lKCkgfHwgXCJbYW5vbnltb3VzXVwiO1xuXHRcdH1cblxuXHRcdGNvbnN0IHR5cGVQYXJhbXMgPSB0aGlzLmdlbmVyYXRlVHlwZVBhcmFtZXRlcnMoXG5cdFx0XHRtZXRob2QuZ2V0VHlwZVBhcmFtZXRlcnMoKSB8fCBbXSxcblx0XHQpO1xuXHRcdGNvbnN0IHBhcmFtcyA9IG1ldGhvZC5nZXRQYXJhbWV0ZXJzKCkubWFwKChwKSA9PiB0aGlzLmdlbmVyYXRlUGFyYW1ldGVyKHApKVxuXHRcdFx0LmpvaW4oXCIsIFwiKTtcblx0XHRjb25zdCByZXR1cm5UeXBlID0gbWV0aG9kLmdldFJldHVyblR5cGVOb2RlKClcblx0XHRcdD8gYDogJHttZXRob2QuZ2V0UmV0dXJuVHlwZU5vZGUoKSEuZ2V0VGV4dCgpfWBcblx0XHRcdDogXCJcIjtcblx0XHRjb25zdCBib2R5ID0gbWV0aG9kLmdldEJvZHkoKSA/IG1ldGhvZC5nZXRCb2R5KCkhLmdldFRleHQoKSA6IFwie31cIjtcblx0XHRyZXR1cm4gYCR7bWV0aG9kTmFtZX0ke3R5cGVQYXJhbXN9KCR7cGFyYW1zfSkke3JldHVyblR5cGV9ICR7Ym9keX1gO1xuXHR9XG5cblx0cHJpdmF0ZSBnZW5lcmF0ZVByb3BlcnR5KHByb3A6IFByb3BlcnR5RGVjbGFyYXRpb24pOiBzdHJpbmcge1xuXHRcdGNvbnN0IG5hbWUgPSBwcm9wLmdldE5hbWUoKTtcblx0XHRjb25zdCB0eXBlTm9kZSA9IHByb3AuZ2V0VHlwZU5vZGUoKTtcblx0XHRjb25zdCB0eXBlVGV4dCA9IHR5cGVOb2RlID8gYDogJHt0eXBlTm9kZS5nZXRUZXh0KCl9YCA6IFwiXCI7XG5cdFx0Y29uc3QgaW5pdGlhbGl6ZXIgPSBwcm9wLmdldEluaXRpYWxpemVyKCk/LmdldFRleHQoKSB8fCBcIlwiO1xuXHRcdGNvbnN0IGluaXRUZXh0ID0gaW5pdGlhbGl6ZXIgPyBgID0gJHtpbml0aWFsaXplcn1gIDogXCJcIjtcblx0XHRyZXR1cm4gYCR7bmFtZX0ke3R5cGVUZXh0fSR7aW5pdFRleHR9O2A7XG5cdH1cblxuXHRwcml2YXRlIGdlbmVyYXRlQ29uc3RydWN0b3IoY3RvcjogQ29uc3RydWN0b3JEZWNsYXJhdGlvbik6IHN0cmluZyB7XG5cdFx0Y29uc3QgcGFyYW1zID0gY3Rvci5nZXRQYXJhbWV0ZXJzKCkubWFwKChwKSA9PiB0aGlzLmdlbmVyYXRlUGFyYW1ldGVyKHApKVxuXHRcdFx0LmpvaW4oXCIsIFwiKTtcblx0XHRjb25zdCBib2R5ID0gY3Rvci5nZXRCb2R5KCkgPyBjdG9yLmdldEJvZHkoKSEuZ2V0VGV4dCgpIDogXCJ7fVwiO1xuXHRcdHJldHVybiBgY29uc3RydWN0b3IoJHtwYXJhbXN9KSAke2JvZHl9YDtcblx0fVxuXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdC8vICBNZXJnZSBDb2RlICsgU291cmNlIE1hcFxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdHByaXZhdGUgbWVyZ2VDb2RlRnJhZ21lbnRzKGZyYWdtZW50czogQ29kZUZyYWdtZW50W10pOiBzdHJpbmcge1xuXHRcdHJldHVybiBmcmFnbWVudHNcblx0XHRcdC5maWx0ZXIoKGYpID0+IGYuY29kZSlcblx0XHRcdC5tYXAoKGYpID0+IGYuY29kZSlcblx0XHRcdC5qb2luKFwiXFxuXCIpO1xuXHR9XG5cblx0cHJpdmF0ZSBnZW5lcmF0ZUluaXRpYWxTb3VyY2VNYXAoZnJhZ21lbnRzOiBDb2RlRnJhZ21lbnRbXSk6IFJhd1NvdXJjZU1hcCB7XG5cdFx0Y29uc3QgbWFwID0gbmV3IFNvdXJjZU1hcEdlbmVyYXRvcih7IGZpbGU6IFwiYnVuZGxlLmpzXCIgfSk7XG5cblx0XHRsZXQgZ2VuZXJhdGVkTGluZSA9IDE7XG5cdFx0bGV0IGdlbmVyYXRlZENvbHVtbiA9IDA7XG5cblx0XHRmb3IgKGNvbnN0IGZyYWcgb2YgZnJhZ21lbnRzKSB7XG5cdFx0XHRpZiAoZnJhZy5zb3VyY2VGaWxlICYmIGZyYWcubGluZSAmJiBmcmFnLmNvbHVtbikge1xuXHRcdFx0XHRtYXAuYWRkTWFwcGluZyh7XG5cdFx0XHRcdFx0Z2VuZXJhdGVkOiB7IGxpbmU6IGdlbmVyYXRlZExpbmUsIGNvbHVtbjogZ2VuZXJhdGVkQ29sdW1uIH0sXG5cdFx0XHRcdFx0b3JpZ2luYWw6IHsgbGluZTogZnJhZy5saW5lLCBjb2x1bW46IGZyYWcuY29sdW1uIH0sXG5cdFx0XHRcdFx0c291cmNlOiBmcmFnLnNvdXJjZUZpbGUsXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBsaW5lcyA9IGZyYWcuY29kZS5zcGxpdChcIlxcblwiKTtcblx0XHRcdGlmIChsaW5lcy5sZW5ndGggPiAxKSB7XG5cdFx0XHRcdGdlbmVyYXRlZExpbmUgKz0gbGluZXMubGVuZ3RoIC0gMTtcblx0XHRcdFx0Z2VuZXJhdGVkQ29sdW1uID0gbGluZXNbbGluZXMubGVuZ3RoIC0gMV0ubGVuZ3RoO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Z2VuZXJhdGVkQ29sdW1uICs9IGxpbmVzWzBdLmxlbmd0aDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBBZGQgc291cmNlIGNvbnRlbnRcblx0XHRjb25zdCB1bmlxdWVTb3VyY2VzID0gbmV3IFNldChcblx0XHRcdGZyYWdtZW50cy5tYXAoKGYpID0+IGYuc291cmNlRmlsZSkuZmlsdGVyKChzKTogcyBpcyBzdHJpbmcgPT4gISFzKSxcblx0XHQpO1xuXHRcdGZvciAoY29uc3Qgc291cmNlRmlsZVBhdGggb2YgdW5pcXVlU291cmNlcykge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgZmlsZUNvbnRlbnQgPSBEZW5vLnJlYWRUZXh0RmlsZVN5bmMoc291cmNlRmlsZVBhdGgpO1xuXHRcdFx0XHRtYXAuc2V0U291cmNlQ29udGVudChzb3VyY2VGaWxlUGF0aCwgZmlsZUNvbnRlbnQpO1xuXHRcdFx0fSBjYXRjaCB7XG5cdFx0XHRcdC8vIHNraXBcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gbWFwLnRvSlNPTigpO1xuXHR9XG5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0Ly8gIFRyYW5zZm9ybXMgKyBTb3VyY2UgTWFwXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0cHJpdmF0ZSBhc3luYyB0cmFuc2Zvcm1Db2RlKFxuXHRcdGNvZGU6IHN0cmluZyxcblx0XHRpbnB1dE1hcDogUmF3U291cmNlTWFwIHwgdW5kZWZpbmVkLFxuXHRcdHRhcmdldDogc3RyaW5nLFxuXHRcdHdpdGhTb3VyY2VNYXA6IGJvb2xlYW4sXG5cdCk6IFByb21pc2U8eyBjb2RlOiBzdHJpbmc7IG1hcD86IHN0cmluZyB9PiB7XG5cdFx0bGV0IHRzVGFyZ2V0OiB0cy5TY3JpcHRUYXJnZXQ7XG5cdFx0c3dpdGNoICh0YXJnZXQudG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0Y2FzZSBcImVzNVwiOlxuXHRcdFx0XHR0c1RhcmdldCA9IHRzLlNjcmlwdFRhcmdldC5FUzU7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcImVzNlwiOlxuXHRcdFx0Y2FzZSBcImVzMjAxNVwiOlxuXHRcdFx0XHR0c1RhcmdldCA9IHRzLlNjcmlwdFRhcmdldC5FUzIwMTU7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dHNUYXJnZXQgPSB0cy5TY3JpcHRUYXJnZXQuRVMyMDIwO1xuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cblx0XHRjb25zdCBwcm9qZWN0ID0gbmV3IFRzTW9ycGhQcm9qZWN0KHtcblx0XHRcdHVzZUluTWVtb3J5RmlsZVN5c3RlbTogdHJ1ZSxcblx0XHRcdGNvbXBpbGVyT3B0aW9uczoge1xuXHRcdFx0XHR0YXJnZXQ6IHRzVGFyZ2V0LFxuXHRcdFx0XHRzb3VyY2VNYXA6IHdpdGhTb3VyY2VNYXAsXG5cdFx0XHRcdGRlY2xhcmF0aW9uOiBmYWxzZSxcblx0XHRcdH0sXG5cdFx0fSk7XG5cblx0XHRjb25zdCBmaWxlUGF0aCA9IFwiaW4tbWVtb3J5LnRzXCI7XG5cdFx0Y29uc3Qgc291cmNlRmlsZSA9IHByb2plY3QuY3JlYXRlU291cmNlRmlsZShmaWxlUGF0aCwgY29kZSwge1xuXHRcdFx0b3ZlcndyaXRlOiB0cnVlLFxuXHRcdH0pO1xuXHRcdGNvbnN0IGVtaXRPdXRwdXQgPSBzb3VyY2VGaWxlLmdldEVtaXRPdXRwdXQoKTtcblxuXHRcdGNvbnN0IG91dHB1dEZpbGVzOiBPdXRwdXRGaWxlW10gPSBlbWl0T3V0cHV0LmdldE91dHB1dEZpbGVzKCk7XG5cdFx0bGV0IHRyYW5zZm9ybWVkQ29kZSA9IGNvZGU7XG5cdFx0bGV0IHRyYW5zZm9ybWVkTWFwOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cblx0XHRmb3IgKGNvbnN0IG91dEZpbGUgb2Ygb3V0cHV0RmlsZXMpIHtcblx0XHRcdGlmIChvdXRGaWxlLmdldEZpbGVQYXRoKCkuZW5kc1dpdGgoXCIuanNcIikpIHtcblx0XHRcdFx0dHJhbnNmb3JtZWRDb2RlID0gb3V0RmlsZS5nZXRUZXh0KCk7XG5cdFx0XHR9IGVsc2UgaWYgKG91dEZpbGUuZ2V0RmlsZVBhdGgoKS5lbmRzV2l0aChcIi5qcy5tYXBcIikpIHtcblx0XHRcdFx0dHJhbnNmb3JtZWRNYXAgPSBvdXRGaWxlLmdldFRleHQoKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBNZXJnZSBzb3VyY2UgbWFwc1xuXHRcdGlmICh3aXRoU291cmNlTWFwICYmIHRyYW5zZm9ybWVkTWFwICYmIGlucHV0TWFwKSB7XG5cdFx0XHRjb25zdCBtZXJnZWRNYXAgPSBhd2FpdCB0aGlzLm1lcmdlU291cmNlTWFwcyhcblx0XHRcdFx0SlNPTi5zdHJpbmdpZnkoaW5wdXRNYXApLFxuXHRcdFx0XHR0cmFuc2Zvcm1lZE1hcCxcblx0XHRcdCk7XG5cdFx0XHRyZXR1cm4geyBjb2RlOiB0cmFuc2Zvcm1lZENvZGUsIG1hcDogbWVyZ2VkTWFwIH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHsgY29kZTogdHJhbnNmb3JtZWRDb2RlLCBtYXA6IHRyYW5zZm9ybWVkTWFwIH07XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIG1lcmdlU291cmNlTWFwcyhcblx0XHRleGlzdGluZ01hcDogc3RyaW5nLFxuXHRcdG5ld01hcDogc3RyaW5nLFxuXHQpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRcdGNvbnN0IGNvbnN1bWVyT2xkID0gYXdhaXQgbmV3IFNvdXJjZU1hcENvbnN1bWVyKGV4aXN0aW5nTWFwKTtcblx0XHRjb25zdCBjb25zdW1lck5ldyA9IGF3YWl0IG5ldyBTb3VyY2VNYXBDb25zdW1lcihuZXdNYXApO1xuXHRcdGNvbnN0IGdlbmVyYXRvciA9IFNvdXJjZU1hcEdlbmVyYXRvci5mcm9tU291cmNlTWFwKGNvbnN1bWVyTmV3KTtcblxuXHRcdC8vIEluc3RlYWQgb2YgYW55LCBjYXN0IHRvIHVua25vd24gdGhlbiBTb3VyY2VNYXBDb25zdW1lclxuXHRcdGdlbmVyYXRvci5hcHBseVNvdXJjZU1hcChjb25zdW1lck9sZCBhcyB1bmtub3duIGFzIFNvdXJjZU1hcENvbnN1bWVyKTtcblxuXHRcdGNvbnN1bWVyT2xkLmRlc3Ryb3koKTtcblx0XHRjb25zdW1lck5ldy5kZXN0cm95KCk7XG5cblx0XHRyZXR1cm4gZ2VuZXJhdG9yLnRvU3RyaW5nKCk7XG5cdH1cblxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQvLyAgTWluaWZpY2F0aW9uICsgU291cmNlIE1hcFxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdHByaXZhdGUgYXN5bmMgbWluaWZ5Q29kZShcblx0XHRjb2RlOiBzdHJpbmcsXG5cdFx0aW5wdXRNYXA6IHN0cmluZyB8IHVuZGVmaW5lZCxcblx0XHR3aXRoU291cmNlTWFwOiBib29sZWFuLFxuXHQpOiBQcm9taXNlPHsgY29kZTogc3RyaW5nOyBtYXA/OiBzdHJpbmcgfT4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCB0ZXJzZXJPcHRpb25zOiB7XG5cdFx0XHRcdGNvbXByZXNzOiBib29sZWFuO1xuXHRcdFx0XHRtYW5nbGU6IGJvb2xlYW47XG5cdFx0XHRcdHNvdXJjZU1hcD86IHtcblx0XHRcdFx0XHRjb250ZW50OiBzdHJpbmc7XG5cdFx0XHRcdFx0ZmlsZW5hbWU6IHN0cmluZztcblx0XHRcdFx0XHR1cmw6IHN0cmluZztcblx0XHRcdFx0fTtcblx0XHRcdH0gPSB7XG5cdFx0XHRcdGNvbXByZXNzOiB0cnVlLFxuXHRcdFx0XHRtYW5nbGU6IHRydWUsXG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAod2l0aFNvdXJjZU1hcCAmJiBpbnB1dE1hcCkge1xuXHRcdFx0XHR0ZXJzZXJPcHRpb25zLnNvdXJjZU1hcCA9IHtcblx0XHRcdFx0XHRjb250ZW50OiBpbnB1dE1hcCxcblx0XHRcdFx0XHRmaWxlbmFtZTogXCJidW5kbGUuanNcIixcblx0XHRcdFx0XHR1cmw6IFwiYnVuZGxlLmpzLm1hcFwiLFxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB0ZXJzZXJSZXN1bHQgPSBhd2FpdCB0ZXJzZXJNaW5pZnkoY29kZSwgdGVyc2VyT3B0aW9ucyk7XG5cdFx0XHRpZiAoIXRlcnNlclJlc3VsdC5jb2RlKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIlRlcnNlciBmYWlsZWQgdG8gZ2VuZXJhdGUgY29kZS5cIik7XG5cdFx0XHR9XG5cblx0XHRcdGxldCBmaW5hbE1hcDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXHRcdFx0aWYgKHdpdGhTb3VyY2VNYXAgJiYgdGVyc2VyUmVzdWx0Lm1hcCkge1xuXHRcdFx0XHQvLyBJZiBUZXJzZXIgcmV0dXJucyBtYXAgYXMgYW4gb2JqZWN0LCBjb252ZXJ0IHRvIHN0cmluZ1xuXHRcdFx0XHRpZiAodHlwZW9mIHRlcnNlclJlc3VsdC5tYXAgPT09IFwic3RyaW5nXCIpIHtcblx0XHRcdFx0XHRmaW5hbE1hcCA9IHRlcnNlclJlc3VsdC5tYXA7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZmluYWxNYXAgPSBKU09OLnN0cmluZ2lmeSh0ZXJzZXJSZXN1bHQubWFwKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRjb2RlOiB0ZXJzZXJSZXN1bHQuY29kZSxcblx0XHRcdFx0bWFwOiBmaW5hbE1hcCxcblx0XHRcdH07XG5cdFx0fSBjYXRjaCAoZXJyOiB1bmtub3duKSB7XG5cdFx0XHRjb25zdCBtc2cgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycik7XG5cdFx0XHR0aGlzLndhcm5pbmdzLnB1c2goYE1pbmlmaWNhdGlvbiBmYWlsZWQ6ICR7bXNnfWApO1xuXHRcdFx0bG9nZ2VyLndhcm4oYE1pbmlmaWNhdGlvbiBmYWlsZWQ6ICR7bXNnfWApO1xuXG5cdFx0XHRyZXR1cm4geyBjb2RlIH07XG5cdFx0fVxuXHR9XG5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0Ly8gIE1vZHVsZSBGb3JtYXQgV3JhcHBlcnNcblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRwcml2YXRlIHdyYXBDb2RlV2l0aEZvcm1hdChjb2RlOiBzdHJpbmcsIGZvcm1hdDogTW9kdWxlRm9ybWF0KTogc3RyaW5nIHtcblx0XHRzd2l0Y2ggKGZvcm1hdCkge1xuXHRcdFx0Y2FzZSBcImNvbW1vbmpzXCI6XG5cdFx0XHRcdHJldHVybiB0aGlzLndyYXBDb21tb25KUyhjb2RlKTtcblx0XHRcdGNhc2UgXCJ1bWRcIjpcblx0XHRcdFx0cmV0dXJuIHRoaXMud3JhcFVNRChjb2RlKTtcblx0XHRcdGNhc2UgXCJlczZcIjpcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiBjb2RlO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgd3JhcENvbW1vbkpTKGNvZGU6IHN0cmluZyk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIGBcblwidXNlIHN0cmljdFwiO1xuJHtjb2RlfVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5cbi8vIEhhbmRsZSBkZWZhdWx0IGV4cG9ydCBjb21wYXRpYmlsaXR5XG5pZiAodHlwZW9mIG1vZHVsZS5leHBvcnRzLmRlZmF1bHQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG1vZHVsZS5leHBvcnRzLCBcImRlZmF1bHRcIiwge1xuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogbW9kdWxlLmV4cG9ydHNcbiAgICB9KTtcbn1cbmA7XG5cdH1cblxuXHRwcml2YXRlIHdyYXBVTUQoY29kZTogc3RyaW5nKTogc3RyaW5nIHtcblx0XHRjb25zdCBuYW1lID0gdGhpcy5vcHRpb25zLnVtZE5hbWUgfHwgXCJidW5kbGVcIjtcblx0XHRyZXR1cm4gYFxuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoW10sIGZhY3RvcnkpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gQnJvd3NlciBnbG9iYWxzXG4gICAgcm9vdFtcIiR7bmFtZX1cIl0gPSBmYWN0b3J5KCk7XG4gIH1cbn0pKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJyA/IHNlbGYgOiB0aGlzLCBmdW5jdGlvbiAoKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIHZhciBleHBvcnRzID0ge307XG4gIHZhciBtb2R1bGUgPSB7IGV4cG9ydHM6IGV4cG9ydHMgfTtcblxuICAke2NvZGV9XG5cbiAgcmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufSk7XG5gO1xuXHR9XG5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0Ly8gIEhlbHBlcnMgKyBEaWFnbm9zdGljc1xuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdHByaXZhdGUgbG9nRGlhZ25vc3RpYyhkaWFnbm9zdGljOiBEaWFnbm9zdGljKTogdm9pZCB7XG5cdFx0Y29uc3QgbWVzc2FnZSA9IGRpYWdub3N0aWMuZ2V0TWVzc2FnZVRleHQoKTtcblx0XHRjb25zdCBtZXNzYWdlVGV4dCA9IHR5cGVvZiBtZXNzYWdlID09PSBcInN0cmluZ1wiXG5cdFx0XHQ/IG1lc3NhZ2Vcblx0XHRcdDogbWVzc2FnZS5nZXRNZXNzYWdlVGV4dCgpO1xuXHRcdGNvbnN0IHNvdXJjZUZpbGUgPSBkaWFnbm9zdGljLmdldFNvdXJjZUZpbGUoKTtcblx0XHRjb25zdCBwb3MgPSBkaWFnbm9zdGljLmdldFN0YXJ0KCk7XG5cblx0XHRpZiAoc291cmNlRmlsZSAmJiBwb3MgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y29uc3QgbGluZUFuZENoYXIgPSBzb3VyY2VGaWxlLmdldExpbmVBbmRDb2x1bW5BdFBvcyhwb3MpO1xuXHRcdFx0bG9nZ2VyLmVycm9yKFxuXHRcdFx0XHRgJHtzb3VyY2VGaWxlLmdldEZpbGVQYXRoKCl9ICgke2xpbmVBbmRDaGFyLmxpbmUgKyAxfSwke1xuXHRcdFx0XHRcdGxpbmVBbmRDaGFyLmNvbHVtbiArIDFcblx0XHRcdFx0fSk6ICR7bWVzc2FnZVRleHR9YCxcblx0XHRcdCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGxvZ2dlci5lcnJvcihtZXNzYWdlVGV4dCk7XG5cdFx0fVxuXHR9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMkJBQTJCO0FBRTNCLFNBQVMsTUFBTSxRQUFRLGVBQWU7QUFDdEMsU0FFQyxpQkFBaUIsRUFDakIsa0JBQWtCLFFBQ1osa0NBQWtDO0FBQ3pDLFNBV0MsV0FBVyxjQUFjLEVBR3pCLFVBQVUsRUFDVixFQUFFLFFBR0ksNkNBQTZDO0FBQ3BELFNBQVMsVUFBVSxZQUFZLFFBQVEsK0JBQStCO0FBMkN0RTs7Ozs7OztDQU9DLEdBQ0QsT0FBTyxNQUFNOztFQUNKLFNBQXdCO0VBQ3hCLE9BQTRDO0VBRXBELFlBQ0MsQUFBUSxPQWdCUCxDQUNBO1NBakJPLFVBQUE7U0FKRCxXQUFxQixFQUFFO1NBQ3ZCLFNBQWtDLElBQUk7RUFvQjNDO0VBRUg7O0VBRUMsR0FDRCxNQUFhLFNBQ1osTUFBNkQsRUFDN0QsVUFBMEIsRUFDQztJQUMzQixJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUU7SUFDbEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLO0lBRWpCLElBQUk7TUFDSCwwQ0FBMEM7TUFDMUMsTUFBTSxZQUFZLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLEdBQUcsRUFBRSxPQUFPLE9BQU87TUFFdEUsK0JBQStCO01BQy9CLE1BQU0sYUFBYSxJQUFJLENBQUMsa0JBQWtC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
// denoCacheMetadata=12302059649503324976,1316819314452334784