// /src/compiler/transformer.ts
import { SyntaxKind, ts } from "https://deno.land/x/ts_morph@17.0.1/mod.ts";
import { SourceMapGenerator } from "https://esm.sh/source-map@0.7.4";
import { logger } from "./logger.ts";
/**
 * The Transformer class applies a series of transformations to TypeScript source files.
 */ export class Transformer {
  options;
  transforms;
  /**
	 * Initializes the Transformer with compiler options and registers default transforms.
	 * @param options - CompilerOptions to guide transformation behaviors.
	 */ constructor(options){
    this.options = options;
    this.transforms = new Map();
    this.registerDefaultTransforms();
  }
  /**
	 * Registers a transformation function under a specific name.
	 * @param name - The name of the transformation.
	 * @param transform - The transformation function to apply.
	 */ registerTransform(name, transform) {
    this.transforms.set(name, transform);
  }
  /**
	 * Applies all registered transformations to the given module's AST.
	 * @param moduleAst - The module's AST and path.
	 * @returns The transformed AST and an optional source map.
	 */ transform(moduleAst) {
    const { ast, path } = moduleAst;
    // Apply all registered transformations in sequence
    for (const transform of this.transforms.values()){
      transform(ast);
    }
    // Generate source map if needed
    const map = this.options.sourceMaps ? this.generateSourceMap(ast, path) : undefined;
    return {
      ast,
      map
    };
  }
  /**
	 * Registers default transformation functions.
	 */ registerDefaultTransforms() {
    // Register built-in transformations
    this.registerTransform("decorators", this.transformDecorators.bind(this));
    this.registerTransform("typescript", this.transformTypeScript.bind(this));
    this.registerTransform("modules", this.transformModules.bind(this));
    this.registerTransform("dynamic-imports", this.transformDynamicImports.bind(this));
  }
  /**
	 * Transforms decorators within the source file by removing them.
	 * @param sourceFile - The SourceFile to transform.
	 */ transformDecorators(sourceFile) {
    if (!this.options.experimentalDecorators) {
      return;
    }
    // Handle class decorators
    sourceFile.getClasses().forEach((cls)=>{
      // Find and remove class-level decorators
      sourceFile.getDescendantsOfKind(SyntaxKind.Decorator).filter((dec)=>dec.getParent() === cls).forEach((dec)=>dec.remove());
      // Remove method decorators
      cls.getMethods().forEach((method)=>{
        sourceFile.getDescendantsOfKind(SyntaxKind.Decorator).filter((dec)=>dec.getParent() === method).forEach((dec)=>dec.remove());
      });
      // Remove property decorators
      cls.getProperties().forEach((prop)=>{
        sourceFile.getDescendantsOfKind(SyntaxKind.Decorator).filter((dec)=>dec.getParent() === prop).forEach((dec)=>dec.remove());
      });
    });
    // Handle function decorators
    sourceFile.getFunctions().forEach((func)=>{
      sourceFile.getDescendantsOfKind(SyntaxKind.Decorator).filter((dec)=>dec.getParent() === func).forEach((dec)=>dec.remove());
    });
  }
  /**
	 * Removes TypeScript-specific syntax like type annotations and interface declarations.
	 * @param sourceFile - The SourceFile to transform.
	 */ transformTypeScript(sourceFile) {
    // Remove type annotations from function parameters and return types
    sourceFile.getFunctions().forEach((func)=>{
      func.getParameters().forEach((param)=>{
        param.removeType();
      });
      func.removeReturnType();
    });
    // Remove type annotations from class properties and methods
    sourceFile.getClasses().forEach((cls)=>{
      cls.getProperties().forEach((prop)=>{
        prop.removeType();
      });
      cls.getMethods().forEach((method)=>{
        method.getParameters().forEach((param)=>{
          param.removeType();
        });
        method.removeReturnType();
      });
    });
    // Remove all interface declarations
    sourceFile.getInterfaces().forEach((iface)=>{
      iface.remove();
    });
    // Remove type aliases
    sourceFile.getTypeAliases().forEach((alias)=>{
      alias.remove();
    });
    // Remove enums
    sourceFile.getEnums().forEach((enm)=>{
      enm.remove();
    });
  }
  /**
	 * Performs module-specific transformations, such as altering import/export syntax.
	 * @param sourceFile - The SourceFile to transform.
	 */ transformModules(sourceFile) {
    // Transform Import Declarations
    sourceFile.getImportDeclarations().forEach((importDecl)=>{
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      // Ensure import paths are relative
      let newModuleSpecifier = moduleSpecifier;
      if (!moduleSpecifier.startsWith(".") && !moduleSpecifier.startsWith("/")) {
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
    sourceFile.getExportDeclarations().forEach((exportDecl)=>{
      const namedExports = exportDecl.getNamedExports();
      const namespaceExport = exportDecl.getNamespaceExport();
      const moduleSpecifier = exportDecl.getModuleSpecifierValue();
      if (namedExports.length === 1) {
        const [singleExport] = namedExports;
        const exportName = singleExport.getName();
        if (exportName) {
          exportDecl.replaceWithText(`export default ${exportName};`);
        }
      } else if (namedExports.length === 0 && exportDecl.isNamespaceExport() && namespaceExport) {
        const namespaceName = namespaceExport.getName();
        if (namespaceName && moduleSpecifier) {
          exportDecl.replaceWithText(`import * as ${namespaceName} from "${moduleSpecifier}";\nexport { ${namespaceName} };`);
        }
      }
    });
  }
  /**
	 * Transforms dynamic import() expressions to static imports or other strategies based on target format.
	 * @param sourceFile - The SourceFile to transform.
	 */ transformDynamicImports(sourceFile) {
    sourceFile.getDescendantsOfKind(ts.SyntaxKind.CallExpression).forEach((callExpr)=>{
      const expr = callExpr.getExpression();
      if (expr.getKind() === ts.SyntaxKind.ImportKeyword) {
        const args = callExpr.getArguments();
        if (args.length === 1) {
          const modulePath = args[0].getText().replace(/['"]/g, "");
          callExpr.replaceWithText(`__require("${modulePath}")`);
        }
      }
    });
  }
  /**
	 * Generates a source map for the transformed AST.
	 * @param sourceFile - The transformed SourceFile.
	 * @param path - The file path.
	 * @returns The generated source map as a string.
	 */ generateSourceMap(sourceFile, path) {
    try {
      const generator = new SourceMapGenerator({
        file: "bundle.js"
      });
      // Map function declarations
      sourceFile.getFunctions().forEach((func)=>{
        const nameNode = func.getNameNode();
        if (nameNode) {
          const name = func.getName();
          const pos = nameNode.getStart();
          const location = sourceFile.getLineAndColumnAtPos(pos);
          if (name && location) {
            generator.addMapping({
              generated: {
                line: location.line + 1,
                column: location.column
              },
              original: {
                line: location.line + 1,
                column: location.column
              },
              source: path,
              name: name
            });
          }
        }
      });
      // Map class declarations
      sourceFile.getClasses().forEach((cls)=>{
        const nameNode = cls.getNameNode();
        if (nameNode) {
          const name = cls.getName();
          const pos = nameNode.getStart();
          const location = sourceFile.getLineAndColumnAtPos(pos);
          if (name && location) {
            generator.addMapping({
              generated: {
                line: location.line + 1,
                column: location.column
              },
              original: {
                line: location.line + 1,
                column: location.column
              },
              source: path,
              name: name
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29tcGlsZXIvdHJhbnNmb3JtZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gL3NyYy9jb21waWxlci90cmFuc2Zvcm1lci50c1xuaW1wb3J0IHtcblx0Q2xhc3NEZWNsYXJhdGlvbixcblx0RnVuY3Rpb25EZWNsYXJhdGlvbixcblx0U291cmNlRmlsZSxcblx0U3ludGF4S2luZCxcblx0dHMsXG59IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC94L3RzX21vcnBoQDE3LjAuMS9tb2QudHNcIjtcbmltcG9ydCB0eXBlIHsgQ29tcGlsZXJPcHRpb25zIH0gZnJvbSBcIi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IFNvdXJjZU1hcEdlbmVyYXRvciB9IGZyb20gXCJodHRwczovL2VzbS5zaC9zb3VyY2UtbWFwQDAuNy40XCI7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tIFwiLi9sb2dnZXIudHNcIjtcblxuLyoqXG4gKiBSZXByZXNlbnRzIHRoZSByZXN1bHQgb2YgYSB0cmFuc2Zvcm1hdGlvbiwgaW5jbHVkaW5nIHRoZSB0cmFuc2Zvcm1lZCBBU1QgYW5kIGFuIG9wdGlvbmFsIHNvdXJjZSBtYXAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVHJhbnNmb3JtUmVzdWx0IHtcblx0YXN0OiBTb3VyY2VGaWxlO1xuXHRtYXA/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogVHlwZSBkZWZpbml0aW9uIGZvciBhIHRyYW5zZm9ybWF0aW9uIGZ1bmN0aW9uLlxuICogQHBhcmFtIHNvdXJjZUZpbGUgLSBUaGUgU291cmNlRmlsZSB0byB0cmFuc2Zvcm0uXG4gKi9cbnR5cGUgVHJhbnNmb3JtRm4gPSAoc291cmNlRmlsZTogU291cmNlRmlsZSkgPT4gdm9pZDtcblxuLyoqXG4gKiBUaGUgVHJhbnNmb3JtZXIgY2xhc3MgYXBwbGllcyBhIHNlcmllcyBvZiB0cmFuc2Zvcm1hdGlvbnMgdG8gVHlwZVNjcmlwdCBzb3VyY2UgZmlsZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBUcmFuc2Zvcm1lciB7XG5cdHByaXZhdGUgdHJhbnNmb3JtczogTWFwPHN0cmluZywgVHJhbnNmb3JtRm4+O1xuXG5cdC8qKlxuXHQgKiBJbml0aWFsaXplcyB0aGUgVHJhbnNmb3JtZXIgd2l0aCBjb21waWxlciBvcHRpb25zIGFuZCByZWdpc3RlcnMgZGVmYXVsdCB0cmFuc2Zvcm1zLlxuXHQgKiBAcGFyYW0gb3B0aW9ucyAtIENvbXBpbGVyT3B0aW9ucyB0byBndWlkZSB0cmFuc2Zvcm1hdGlvbiBiZWhhdmlvcnMuXG5cdCAqL1xuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIG9wdGlvbnM6IENvbXBpbGVyT3B0aW9ucykge1xuXHRcdHRoaXMudHJhbnNmb3JtcyA9IG5ldyBNYXAoKTtcblx0XHR0aGlzLnJlZ2lzdGVyRGVmYXVsdFRyYW5zZm9ybXMoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZWdpc3RlcnMgYSB0cmFuc2Zvcm1hdGlvbiBmdW5jdGlvbiB1bmRlciBhIHNwZWNpZmljIG5hbWUuXG5cdCAqIEBwYXJhbSBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHRyYW5zZm9ybWF0aW9uLlxuXHQgKiBAcGFyYW0gdHJhbnNmb3JtIC0gVGhlIHRyYW5zZm9ybWF0aW9uIGZ1bmN0aW9uIHRvIGFwcGx5LlxuXHQgKi9cblx0cHVibGljIHJlZ2lzdGVyVHJhbnNmb3JtKG5hbWU6IHN0cmluZywgdHJhbnNmb3JtOiBUcmFuc2Zvcm1Gbik6IHZvaWQge1xuXHRcdHRoaXMudHJhbnNmb3Jtcy5zZXQobmFtZSwgdHJhbnNmb3JtKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBBcHBsaWVzIGFsbCByZWdpc3RlcmVkIHRyYW5zZm9ybWF0aW9ucyB0byB0aGUgZ2l2ZW4gbW9kdWxlJ3MgQVNULlxuXHQgKiBAcGFyYW0gbW9kdWxlQXN0IC0gVGhlIG1vZHVsZSdzIEFTVCBhbmQgcGF0aC5cblx0ICogQHJldHVybnMgVGhlIHRyYW5zZm9ybWVkIEFTVCBhbmQgYW4gb3B0aW9uYWwgc291cmNlIG1hcC5cblx0ICovXG5cdHB1YmxpYyB0cmFuc2Zvcm0oXG5cdFx0bW9kdWxlQXN0OiB7IGFzdDogU291cmNlRmlsZTsgcGF0aDogc3RyaW5nIH0sXG5cdCk6IFRyYW5zZm9ybVJlc3VsdCB7XG5cdFx0Y29uc3QgeyBhc3QsIHBhdGggfSA9IG1vZHVsZUFzdDtcblxuXHRcdC8vIEFwcGx5IGFsbCByZWdpc3RlcmVkIHRyYW5zZm9ybWF0aW9ucyBpbiBzZXF1ZW5jZVxuXHRcdGZvciAoY29uc3QgdHJhbnNmb3JtIG9mIHRoaXMudHJhbnNmb3Jtcy52YWx1ZXMoKSkge1xuXHRcdFx0dHJhbnNmb3JtKGFzdCk7XG5cdFx0fVxuXG5cdFx0Ly8gR2VuZXJhdGUgc291cmNlIG1hcCBpZiBuZWVkZWRcblx0XHRjb25zdCBtYXAgPSB0aGlzLm9wdGlvbnMuc291cmNlTWFwc1xuXHRcdFx0PyB0aGlzLmdlbmVyYXRlU291cmNlTWFwKGFzdCwgcGF0aClcblx0XHRcdDogdW5kZWZpbmVkO1xuXG5cdFx0cmV0dXJuIHsgYXN0LCBtYXAgfTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZWdpc3RlcnMgZGVmYXVsdCB0cmFuc2Zvcm1hdGlvbiBmdW5jdGlvbnMuXG5cdCAqL1xuXHRwcml2YXRlIHJlZ2lzdGVyRGVmYXVsdFRyYW5zZm9ybXMoKTogdm9pZCB7XG5cdFx0Ly8gUmVnaXN0ZXIgYnVpbHQtaW4gdHJhbnNmb3JtYXRpb25zXG5cdFx0dGhpcy5yZWdpc3RlclRyYW5zZm9ybShcImRlY29yYXRvcnNcIiwgdGhpcy50cmFuc2Zvcm1EZWNvcmF0b3JzLmJpbmQodGhpcykpO1xuXHRcdHRoaXMucmVnaXN0ZXJUcmFuc2Zvcm0oXCJ0eXBlc2NyaXB0XCIsIHRoaXMudHJhbnNmb3JtVHlwZVNjcmlwdC5iaW5kKHRoaXMpKTtcblx0XHR0aGlzLnJlZ2lzdGVyVHJhbnNmb3JtKFwibW9kdWxlc1wiLCB0aGlzLnRyYW5zZm9ybU1vZHVsZXMuYmluZCh0aGlzKSk7XG5cdFx0dGhpcy5yZWdpc3RlclRyYW5zZm9ybShcblx0XHRcdFwiZHluYW1pYy1pbXBvcnRzXCIsXG5cdFx0XHR0aGlzLnRyYW5zZm9ybUR5bmFtaWNJbXBvcnRzLmJpbmQodGhpcyksXG5cdFx0KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBUcmFuc2Zvcm1zIGRlY29yYXRvcnMgd2l0aGluIHRoZSBzb3VyY2UgZmlsZSBieSByZW1vdmluZyB0aGVtLlxuXHQgKiBAcGFyYW0gc291cmNlRmlsZSAtIFRoZSBTb3VyY2VGaWxlIHRvIHRyYW5zZm9ybS5cblx0ICovXG5cdHByaXZhdGUgdHJhbnNmb3JtRGVjb3JhdG9ycyhzb3VyY2VGaWxlOiBTb3VyY2VGaWxlKTogdm9pZCB7XG5cdFx0aWYgKCF0aGlzLm9wdGlvbnMuZXhwZXJpbWVudGFsRGVjb3JhdG9ycykge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIEhhbmRsZSBjbGFzcyBkZWNvcmF0b3JzXG5cdFx0c291cmNlRmlsZS5nZXRDbGFzc2VzKCkuZm9yRWFjaCgoY2xzOiBDbGFzc0RlY2xhcmF0aW9uKSA9PiB7XG5cdFx0XHQvLyBGaW5kIGFuZCByZW1vdmUgY2xhc3MtbGV2ZWwgZGVjb3JhdG9yc1xuXHRcdFx0c291cmNlRmlsZS5nZXREZXNjZW5kYW50c09mS2luZChTeW50YXhLaW5kLkRlY29yYXRvcilcblx0XHRcdFx0LmZpbHRlcigoZGVjKSA9PiBkZWMuZ2V0UGFyZW50KCkgPT09IGNscylcblx0XHRcdFx0LmZvckVhY2goKGRlYykgPT4gZGVjLnJlbW92ZSgpKTtcblxuXHRcdFx0Ly8gUmVtb3ZlIG1ldGhvZCBkZWNvcmF0b3JzXG5cdFx0XHRjbHMuZ2V0TWV0aG9kcygpLmZvckVhY2goKG1ldGhvZCkgPT4ge1xuXHRcdFx0XHRzb3VyY2VGaWxlLmdldERlc2NlbmRhbnRzT2ZLaW5kKFN5bnRheEtpbmQuRGVjb3JhdG9yKVxuXHRcdFx0XHRcdC5maWx0ZXIoKGRlYykgPT4gZGVjLmdldFBhcmVudCgpID09PSBtZXRob2QpXG5cdFx0XHRcdFx0LmZvckVhY2goKGRlYykgPT4gZGVjLnJlbW92ZSgpKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBSZW1vdmUgcHJvcGVydHkgZGVjb3JhdG9yc1xuXHRcdFx0Y2xzLmdldFByb3BlcnRpZXMoKS5mb3JFYWNoKChwcm9wKSA9PiB7XG5cdFx0XHRcdHNvdXJjZUZpbGUuZ2V0RGVzY2VuZGFudHNPZktpbmQoU3ludGF4S2luZC5EZWNvcmF0b3IpXG5cdFx0XHRcdFx0LmZpbHRlcigoZGVjKSA9PiBkZWMuZ2V0UGFyZW50KCkgPT09IHByb3ApXG5cdFx0XHRcdFx0LmZvckVhY2goKGRlYykgPT4gZGVjLnJlbW92ZSgpKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0Ly8gSGFuZGxlIGZ1bmN0aW9uIGRlY29yYXRvcnNcblx0XHRzb3VyY2VGaWxlLmdldEZ1bmN0aW9ucygpLmZvckVhY2goKGZ1bmM6IEZ1bmN0aW9uRGVjbGFyYXRpb24pID0+IHtcblx0XHRcdHNvdXJjZUZpbGUuZ2V0RGVzY2VuZGFudHNPZktpbmQoU3ludGF4S2luZC5EZWNvcmF0b3IpXG5cdFx0XHRcdC5maWx0ZXIoKGRlYykgPT4gZGVjLmdldFBhcmVudCgpID09PSBmdW5jKVxuXHRcdFx0XHQuZm9yRWFjaCgoZGVjKSA9PiBkZWMucmVtb3ZlKCkpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgVHlwZVNjcmlwdC1zcGVjaWZpYyBzeW50YXggbGlrZSB0eXBlIGFubm90YXRpb25zIGFuZCBpbnRlcmZhY2UgZGVjbGFyYXRpb25zLlxuXHQgKiBAcGFyYW0gc291cmNlRmlsZSAtIFRoZSBTb3VyY2VGaWxlIHRvIHRyYW5zZm9ybS5cblx0ICovXG5cdHByaXZhdGUgdHJhbnNmb3JtVHlwZVNjcmlwdChzb3VyY2VGaWxlOiBTb3VyY2VGaWxlKTogdm9pZCB7XG5cdFx0Ly8gUmVtb3ZlIHR5cGUgYW5ub3RhdGlvbnMgZnJvbSBmdW5jdGlvbiBwYXJhbWV0ZXJzIGFuZCByZXR1cm4gdHlwZXNcblx0XHRzb3VyY2VGaWxlLmdldEZ1bmN0aW9ucygpLmZvckVhY2goKGZ1bmMpID0+IHtcblx0XHRcdGZ1bmMuZ2V0UGFyYW1ldGVycygpLmZvckVhY2goKHBhcmFtKSA9PiB7XG5cdFx0XHRcdHBhcmFtLnJlbW92ZVR5cGUoKTtcblx0XHRcdH0pO1xuXHRcdFx0ZnVuYy5yZW1vdmVSZXR1cm5UeXBlKCk7XG5cdFx0fSk7XG5cblx0XHQvLyBSZW1vdmUgdHlwZSBhbm5vdGF0aW9ucyBmcm9tIGNsYXNzIHByb3BlcnRpZXMgYW5kIG1ldGhvZHNcblx0XHRzb3VyY2VGaWxlLmdldENsYXNzZXMoKS5mb3JFYWNoKChjbHMpID0+IHtcblx0XHRcdGNscy5nZXRQcm9wZXJ0aWVzKCkuZm9yRWFjaCgocHJvcCkgPT4ge1xuXHRcdFx0XHRwcm9wLnJlbW92ZVR5cGUoKTtcblx0XHRcdH0pO1xuXHRcdFx0Y2xzLmdldE1ldGhvZHMoKS5mb3JFYWNoKChtZXRob2QpID0+IHtcblx0XHRcdFx0bWV0aG9kLmdldFBhcmFtZXRlcnMoKS5mb3JFYWNoKChwYXJhbSkgPT4ge1xuXHRcdFx0XHRcdHBhcmFtLnJlbW92ZVR5cGUoKTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdG1ldGhvZC5yZW1vdmVSZXR1cm5UeXBlKCk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdC8vIFJlbW92ZSBhbGwgaW50ZXJmYWNlIGRlY2xhcmF0aW9uc1xuXHRcdHNvdXJjZUZpbGUuZ2V0SW50ZXJmYWNlcygpLmZvckVhY2goKGlmYWNlKSA9PiB7XG5cdFx0XHRpZmFjZS5yZW1vdmUoKTtcblx0XHR9KTtcblxuXHRcdC8vIFJlbW92ZSB0eXBlIGFsaWFzZXNcblx0XHRzb3VyY2VGaWxlLmdldFR5cGVBbGlhc2VzKCkuZm9yRWFjaCgoYWxpYXMpID0+IHtcblx0XHRcdGFsaWFzLnJlbW92ZSgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gUmVtb3ZlIGVudW1zXG5cdFx0c291cmNlRmlsZS5nZXRFbnVtcygpLmZvckVhY2goKGVubSkgPT4ge1xuXHRcdFx0ZW5tLnJlbW92ZSgpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFBlcmZvcm1zIG1vZHVsZS1zcGVjaWZpYyB0cmFuc2Zvcm1hdGlvbnMsIHN1Y2ggYXMgYWx0ZXJpbmcgaW1wb3J0L2V4cG9ydCBzeW50YXguXG5cdCAqIEBwYXJhbSBzb3VyY2VGaWxlIC0gVGhlIFNvdXJjZUZpbGUgdG8gdHJhbnNmb3JtLlxuXHQgKi9cblx0cHJpdmF0ZSB0cmFuc2Zvcm1Nb2R1bGVzKHNvdXJjZUZpbGU6IFNvdXJjZUZpbGUpOiB2b2lkIHtcblx0XHQvLyBUcmFuc2Zvcm0gSW1wb3J0IERlY2xhcmF0aW9uc1xuXHRcdHNvdXJjZUZpbGUuZ2V0SW1wb3J0RGVjbGFyYXRpb25zKCkuZm9yRWFjaCgoaW1wb3J0RGVjbCkgPT4ge1xuXHRcdFx0Y29uc3QgbW9kdWxlU3BlY2lmaWVyID0gaW1wb3J0RGVjbC5nZXRNb2R1bGVTcGVjaWZpZXJWYWx1ZSgpO1xuXG5cdFx0XHQvLyBFbnN1cmUgaW1wb3J0IHBhdGhzIGFyZSByZWxhdGl2ZVxuXHRcdFx0bGV0IG5ld01vZHVsZVNwZWNpZmllciA9IG1vZHVsZVNwZWNpZmllcjtcblx0XHRcdGlmIChcblx0XHRcdFx0IW1vZHVsZVNwZWNpZmllci5zdGFydHNXaXRoKFwiLlwiKSAmJiAhbW9kdWxlU3BlY2lmaWVyLnN0YXJ0c1dpdGgoXCIvXCIpXG5cdFx0XHQpIHtcblx0XHRcdFx0bmV3TW9kdWxlU3BlY2lmaWVyID0gYC4vJHttb2R1bGVTcGVjaWZpZXJ9YDtcblx0XHRcdH1cblxuXHRcdFx0Ly8gUmVtb3ZlIC50cyBleHRlbnNpb24gZnJvbSBpbXBvcnQgcGF0aHNcblx0XHRcdGlmIChuZXdNb2R1bGVTcGVjaWZpZXIuZW5kc1dpdGgoXCIudHNcIikpIHtcblx0XHRcdFx0bmV3TW9kdWxlU3BlY2lmaWVyID0gbmV3TW9kdWxlU3BlY2lmaWVyLnNsaWNlKDAsIC0zKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gVXBkYXRlIHRoZSBtb2R1bGUgc3BlY2lmaWVyXG5cdFx0XHRpbXBvcnREZWNsLnNldE1vZHVsZVNwZWNpZmllcihuZXdNb2R1bGVTcGVjaWZpZXIpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gVHJhbnNmb3JtIEV4cG9ydCBEZWNsYXJhdGlvbnNcblx0XHRzb3VyY2VGaWxlLmdldEV4cG9ydERlY2xhcmF0aW9ucygpLmZvckVhY2goKGV4cG9ydERlY2wpID0+IHtcblx0XHRcdGNvbnN0IG5hbWVkRXhwb3J0cyA9IGV4cG9ydERlY2wuZ2V0TmFtZWRFeHBvcnRzKCk7XG5cdFx0XHRjb25zdCBuYW1lc3BhY2VFeHBvcnQgPSBleHBvcnREZWNsLmdldE5hbWVzcGFjZUV4cG9ydCgpO1xuXHRcdFx0Y29uc3QgbW9kdWxlU3BlY2lmaWVyID0gZXhwb3J0RGVjbC5nZXRNb2R1bGVTcGVjaWZpZXJWYWx1ZSgpO1xuXG5cdFx0XHRpZiAobmFtZWRFeHBvcnRzLmxlbmd0aCA9PT0gMSkge1xuXHRcdFx0XHRjb25zdCBbc2luZ2xlRXhwb3J0XSA9IG5hbWVkRXhwb3J0cztcblx0XHRcdFx0Y29uc3QgZXhwb3J0TmFtZSA9IHNpbmdsZUV4cG9ydC5nZXROYW1lKCk7XG5cdFx0XHRcdGlmIChleHBvcnROYW1lKSB7XG5cdFx0XHRcdFx0ZXhwb3J0RGVjbC5yZXBsYWNlV2l0aFRleHQoYGV4cG9ydCBkZWZhdWx0ICR7ZXhwb3J0TmFtZX07YCk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoXG5cdFx0XHRcdG5hbWVkRXhwb3J0cy5sZW5ndGggPT09IDAgJiYgZXhwb3J0RGVjbC5pc05hbWVzcGFjZUV4cG9ydCgpICYmXG5cdFx0XHRcdG5hbWVzcGFjZUV4cG9ydFxuXHRcdFx0KSB7XG5cdFx0XHRcdGNvbnN0IG5hbWVzcGFjZU5hbWUgPSBuYW1lc3BhY2VFeHBvcnQuZ2V0TmFtZSgpO1xuXHRcdFx0XHRpZiAobmFtZXNwYWNlTmFtZSAmJiBtb2R1bGVTcGVjaWZpZXIpIHtcblx0XHRcdFx0XHRleHBvcnREZWNsLnJlcGxhY2VXaXRoVGV4dChcblx0XHRcdFx0XHRcdGBpbXBvcnQgKiBhcyAke25hbWVzcGFjZU5hbWV9IGZyb20gXCIke21vZHVsZVNwZWNpZmllcn1cIjtcXG5leHBvcnQgeyAke25hbWVzcGFjZU5hbWV9IH07YCxcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogVHJhbnNmb3JtcyBkeW5hbWljIGltcG9ydCgpIGV4cHJlc3Npb25zIHRvIHN0YXRpYyBpbXBvcnRzIG9yIG90aGVyIHN0cmF0ZWdpZXMgYmFzZWQgb24gdGFyZ2V0IGZvcm1hdC5cblx0ICogQHBhcmFtIHNvdXJjZUZpbGUgLSBUaGUgU291cmNlRmlsZSB0byB0cmFuc2Zvcm0uXG5cdCAqL1xuXHRwcml2YXRlIHRyYW5zZm9ybUR5bmFtaWNJbXBvcnRzKHNvdXJjZUZpbGU6IFNvdXJjZUZpbGUpOiB2b2lkIHtcblx0XHRzb3VyY2VGaWxlLmdldERlc2NlbmRhbnRzT2ZLaW5kKHRzLlN5bnRheEtpbmQuQ2FsbEV4cHJlc3Npb24pLmZvckVhY2goXG5cdFx0XHQoY2FsbEV4cHIpID0+IHtcblx0XHRcdFx0Y29uc3QgZXhwciA9IGNhbGxFeHByLmdldEV4cHJlc3Npb24oKTtcblx0XHRcdFx0aWYgKGV4cHIuZ2V0S2luZCgpID09PSB0cy5TeW50YXhLaW5kLkltcG9ydEtleXdvcmQpIHtcblx0XHRcdFx0XHRjb25zdCBhcmdzID0gY2FsbEV4cHIuZ2V0QXJndW1lbnRzKCk7XG5cdFx0XHRcdFx0aWYgKGFyZ3MubGVuZ3RoID09PSAxKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBtb2R1bGVQYXRoID0gYXJnc1swXS5nZXRUZXh0KCkucmVwbGFjZSgvWydcIl0vZywgXCJcIik7XG5cdFx0XHRcdFx0XHRjYWxsRXhwci5yZXBsYWNlV2l0aFRleHQoYF9fcmVxdWlyZShcIiR7bW9kdWxlUGF0aH1cIilgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBHZW5lcmF0ZXMgYSBzb3VyY2UgbWFwIGZvciB0aGUgdHJhbnNmb3JtZWQgQVNULlxuXHQgKiBAcGFyYW0gc291cmNlRmlsZSAtIFRoZSB0cmFuc2Zvcm1lZCBTb3VyY2VGaWxlLlxuXHQgKiBAcGFyYW0gcGF0aCAtIFRoZSBmaWxlIHBhdGguXG5cdCAqIEByZXR1cm5zIFRoZSBnZW5lcmF0ZWQgc291cmNlIG1hcCBhcyBhIHN0cmluZy5cblx0ICovXG5cdHByaXZhdGUgZ2VuZXJhdGVTb3VyY2VNYXAoc291cmNlRmlsZTogU291cmNlRmlsZSwgcGF0aDogc3RyaW5nKTogc3RyaW5nIHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgZ2VuZXJhdG9yID0gbmV3IFNvdXJjZU1hcEdlbmVyYXRvcih7IGZpbGU6IFwiYnVuZGxlLmpzXCIgfSk7XG5cblx0XHRcdC8vIE1hcCBmdW5jdGlvbiBkZWNsYXJhdGlvbnNcblx0XHRcdHNvdXJjZUZpbGUuZ2V0RnVuY3Rpb25zKCkuZm9yRWFjaCgoZnVuYykgPT4ge1xuXHRcdFx0XHRjb25zdCBuYW1lTm9kZSA9IGZ1bmMuZ2V0TmFtZU5vZGUoKTtcblx0XHRcdFx0aWYgKG5hbWVOb2RlKSB7XG5cdFx0XHRcdFx0Y29uc3QgbmFtZSA9IGZ1bmMuZ2V0TmFtZSgpO1xuXHRcdFx0XHRcdGNvbnN0IHBvcyA9IG5hbWVOb2RlLmdldFN0YXJ0KCk7XG5cdFx0XHRcdFx0Y29uc3QgbG9jYXRpb24gPSBzb3VyY2VGaWxlLmdldExpbmVBbmRDb2x1bW5BdFBvcyhwb3MpO1xuXHRcdFx0XHRcdGlmIChuYW1lICYmIGxvY2F0aW9uKSB7XG5cdFx0XHRcdFx0XHRnZW5lcmF0b3IuYWRkTWFwcGluZyh7XG5cdFx0XHRcdFx0XHRcdGdlbmVyYXRlZDogeyBsaW5lOiBsb2NhdGlvbi5saW5lICsgMSwgY29sdW1uOiBsb2NhdGlvbi5jb2x1bW4gfSxcblx0XHRcdFx0XHRcdFx0b3JpZ2luYWw6IHsgbGluZTogbG9jYXRpb24ubGluZSArIDEsIGNvbHVtbjogbG9jYXRpb24uY29sdW1uIH0sXG5cdFx0XHRcdFx0XHRcdHNvdXJjZTogcGF0aCxcblx0XHRcdFx0XHRcdFx0bmFtZTogbmFtZSxcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdC8vIE1hcCBjbGFzcyBkZWNsYXJhdGlvbnNcblx0XHRcdHNvdXJjZUZpbGUuZ2V0Q2xhc3NlcygpLmZvckVhY2goKGNscykgPT4ge1xuXHRcdFx0XHRjb25zdCBuYW1lTm9kZSA9IGNscy5nZXROYW1lTm9kZSgpO1xuXHRcdFx0XHRpZiAobmFtZU5vZGUpIHtcblx0XHRcdFx0XHRjb25zdCBuYW1lID0gY2xzLmdldE5hbWUoKTtcblx0XHRcdFx0XHRjb25zdCBwb3MgPSBuYW1lTm9kZS5nZXRTdGFydCgpO1xuXHRcdFx0XHRcdGNvbnN0IGxvY2F0aW9uID0gc291cmNlRmlsZS5nZXRMaW5lQW5kQ29sdW1uQXRQb3MocG9zKTtcblx0XHRcdFx0XHRpZiAobmFtZSAmJiBsb2NhdGlvbikge1xuXHRcdFx0XHRcdFx0Z2VuZXJhdG9yLmFkZE1hcHBpbmcoe1xuXHRcdFx0XHRcdFx0XHRnZW5lcmF0ZWQ6IHsgbGluZTogbG9jYXRpb24ubGluZSArIDEsIGNvbHVtbjogbG9jYXRpb24uY29sdW1uIH0sXG5cdFx0XHRcdFx0XHRcdG9yaWdpbmFsOiB7IGxpbmU6IGxvY2F0aW9uLmxpbmUgKyAxLCBjb2x1bW46IGxvY2F0aW9uLmNvbHVtbiB9LFxuXHRcdFx0XHRcdFx0XHRzb3VyY2U6IHBhdGgsXG5cdFx0XHRcdFx0XHRcdG5hbWU6IG5hbWUsXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRnZW5lcmF0b3Iuc2V0U291cmNlQ29udGVudChwYXRoLCBzb3VyY2VGaWxlLmdldEZ1bGxUZXh0KCkpO1xuXHRcdFx0cmV0dXJuIGdlbmVyYXRvci50b1N0cmluZygpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRsb2dnZXIuZXJyb3IoYFNvdXJjZSBtYXAgZ2VuZXJhdGlvbiBmYWlsZWQgZm9yICR7cGF0aH06YCwgZXJyb3IpO1xuXHRcdFx0cmV0dXJuIFwiXCI7XG5cdFx0fVxuXHR9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsK0JBQStCO0FBQy9CLFNBSUMsVUFBVSxFQUNWLEVBQUUsUUFDSSw2Q0FBNkM7QUFFcEQsU0FBUyxrQkFBa0IsUUFBUSxrQ0FBa0M7QUFDckUsU0FBUyxNQUFNLFFBQVEsY0FBYztBQWdCckM7O0NBRUMsR0FDRCxPQUFPLE1BQU07O0VBQ0osV0FBcUM7RUFFN0M7OztFQUdDLEdBQ0QsWUFBWSxBQUFRLE9BQXdCLENBQUU7U0FBMUIsVUFBQTtJQUNuQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUk7SUFDdEIsSUFBSSxDQUFDLHlCQUF5QjtFQUMvQjtFQUVBOzs7O0VBSUMsR0FDRCxBQUFPLGtCQUFrQixJQUFZLEVBQUUsU0FBc0IsRUFBUTtJQUNwRSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxNQUFNO0VBQzNCO0VBRUE7Ozs7RUFJQyxHQUNELEFBQU8sVUFDTixTQUE0QyxFQUMxQjtJQUNsQixNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHO0lBRXRCLG1EQUFtRDtJQUNuRCxLQUFLLE1BQU0sYUFBYSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBSTtNQUNqRCxVQUFVO0lBQ1g7SUFFQSxnQ0FBZ0M7SUFDaEMsTUFBTSxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxHQUNoQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxRQUM1QjtJQUVILE9BQU87TUFBRTtNQUFLO0lBQUk7RUFDbkI7RUFFQTs7RUFFQyxHQUNELEFBQVEsNEJBQWtDO0lBQ3pDLG9DQUFvQztJQUNwQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUk7SUFDdkUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxJQUFJO0lBQ3ZF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
// denoCacheMetadata=4528595224833868016,1319007691991354771