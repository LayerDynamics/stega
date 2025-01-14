// /src/compiler/bundler.ts
/**
 * Bundles all modules into a single output file, handling module wrapping based on the target module format.
 */ import { SourceMapGenerator } from "https://esm.sh/source-map@0.7.4";
import { logger } from "./logger.ts";
import { ts } from "https://deno.land/x/ts_morph@17.0.1/mod.ts";
/**
 * Bundler class responsible for combining all modules into a single bundle.
 */ export class Bundler {
  options;
  constructor(options){
    this.options = options;
  }
  /**
	 * Bundles the modules from the dependency graph into a single code string.
	 * @param depGraph - The dependency graph containing all modules.
	 * @returns The bundled code, optional source map, and a map of module paths to their code.
	 */ bundle(depGraph) {
    logger.info(`Starting bundle process with ${depGraph.size} modules`);
    const modules = new Map();
    const moduleOrder = depGraph.getTopologicalOrder();
    // Add format-specific preamble based on module format
    const moduleFormat = this.getModuleFormat();
    logger.info(`Using module format: ${moduleFormat}`);
    let code = this.generatePreamble();
    // Log external modules being skipped
    this.options.externals.forEach((ext)=>{
      logger.info(`Skipping external module: ${ext}`);
    });
    // Initialize source map generator
    const sourceMap = new SourceMapGenerator({
      file: "bundle.js"
    });
    // Bundle modules in dependency order
    for (const modulePath of moduleOrder){
      if (this.options.externals.includes(modulePath)) {
        continue;
      }
      logger.info(`Bundling module: ${modulePath}`);
      const moduleCode = this.bundleModule(depGraph, modulePath);
      modules.set(modulePath, moduleCode);
      code += moduleCode;
      // Example source map mapping (to be enhanced based on actual code generation)
      // This simplistic mapping assumes one line per module
      const line = code.split("\n").length;
      sourceMap.addMapping({
        generated: {
          line: line,
          column: 0
        },
        original: {
          line: 1,
          column: 0
        },
        source: modulePath
      });
      sourceMap.setSourceContent(modulePath, modules.get(modulePath) || "");
    }
    code += this.generatePostamble();
    logger.info("Bundle process completed successfully");
    return {
      code,
      modules,
      map: this.options.sourceMaps ? sourceMap.toString() : undefined
    };
  }
  /**
	 * Determines the module format based on compiler options.
	 */ getModuleFormat() {
    if (this.options.module === ts.ModuleKind.CommonJS) {
      return "commonjs";
    } else if (this.options.module === ts.ModuleKind.UMD) {
      return "umd";
    }
    return "es6";
  }
  /**
	 * Wraps a single module's code based on the target module format.
	 * @param depGraph - The dependency graph.
	 * @param modulePath - The path of the module to bundle.
	 * @returns The wrapped module code as a string.
	 */ bundleModule(depGraph, modulePath) {
    const module = depGraph.getModule(modulePath);
    if (!module) {
      logger.error(`Failed to bundle module: ${modulePath} - Module not found`);
      throw new Error(`Module not found: ${modulePath}`);
    }
    // Use the ModuleFormat to determine wrapping
    const format = this.getModuleFormat();
    logger.info(`Wrapping module ${modulePath} using ${format} format`);
    return format === "commonjs" ? this.wrapCommonJS(modulePath, module.code) : this.wrapESModule(modulePath, module.code);
  }
  /**
	 * Wraps module code in a CommonJS format.
	 * @param path - The module's file path.
	 * @param code - The module's code.
	 * @returns The CommonJS-wrapped module code.
	 */ wrapCommonJS(path, code) {
    return `
__register("${path}", function(module, exports, require) {
${code}
});
`;
  }
  /**
	 * Wraps module code in an ES Module format.
	 * @param path - The module's file path.
	 * @param code - The module's code.
	 * @returns The ES Module-wrapped module code.
	 */ wrapESModule(path, code) {
    return `
__register("${path}", function(module, exports) {
${code}
});
`;
  }
  /**
	 * Generates the preamble code that initializes the module registry and require function.
	 * @returns The preamble code as a string.
	 */ generatePreamble() {
    return `
(function(global) {
  const modules = new Map();
  const registry = new Map();

  function __register(path, factory) {
    registry.set(path, factory);
  }

  function __require(path) {
    if (modules.has(path)) {
      return modules.get(path).exports;
    }

    const module = { exports: {} };
    modules.set(path, module);

    const factory = registry.get(path);
    if (!factory) {
      throw new Error(\`Module not found: \${path}\`);
    }
    factory(module, module.exports, __require);

    return module.exports;
  }

  global.__require = __require;
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : global);
`;
  }
  /**
	 * Generates the postamble code that requires the entry point module to start execution.
	 * @returns The postamble code as a string.
	 */ generatePostamble() {
    return `
__require("${this.options.entryPoint}");
`;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29tcGlsZXIvYnVuZGxlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyAvc3JjL2NvbXBpbGVyL2J1bmRsZXIudHNcblxuLyoqXG4gKiBCdW5kbGVzIGFsbCBtb2R1bGVzIGludG8gYSBzaW5nbGUgb3V0cHV0IGZpbGUsIGhhbmRsaW5nIG1vZHVsZSB3cmFwcGluZyBiYXNlZCBvbiB0aGUgdGFyZ2V0IG1vZHVsZSBmb3JtYXQuXG4gKi9cblxuaW1wb3J0IHsgRGVwZW5kZW5jeUdyYXBoIH0gZnJvbSBcIi4vZGVwZW5kZW5jeS1ncmFwaC50c1wiO1xuaW1wb3J0IHR5cGUgeyBDb21waWxlck9wdGlvbnMsIE1vZHVsZUZvcm1hdCB9IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBTb3VyY2VNYXBHZW5lcmF0b3IgfSBmcm9tIFwiaHR0cHM6Ly9lc20uc2gvc291cmNlLW1hcEAwLjcuNFwiO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSBcIi4vbG9nZ2VyLnRzXCI7XG5pbXBvcnQgeyB0cyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC94L3RzX21vcnBoQDE3LjAuMS9tb2QudHNcIjtcblxuLyoqXG4gKiBJbnRlcmZhY2UgcmVwcmVzZW50aW5nIHRoZSByZXN1bHQgb2YgdGhlIGJ1bmRsaW5nIHByb2Nlc3MuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQnVuZGxlUmVzdWx0IHtcblx0Y29kZTogc3RyaW5nO1xuXHRtYXA/OiBzdHJpbmc7XG5cdG1vZHVsZXM6IE1hcDxzdHJpbmcsIHN0cmluZz47XG59XG5cbi8qKlxuICogQnVuZGxlciBjbGFzcyByZXNwb25zaWJsZSBmb3IgY29tYmluaW5nIGFsbCBtb2R1bGVzIGludG8gYSBzaW5nbGUgYnVuZGxlLlxuICovXG5leHBvcnQgY2xhc3MgQnVuZGxlciB7XG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgb3B0aW9uczogQ29tcGlsZXJPcHRpb25zKSB7fVxuXG5cdC8qKlxuXHQgKiBCdW5kbGVzIHRoZSBtb2R1bGVzIGZyb20gdGhlIGRlcGVuZGVuY3kgZ3JhcGggaW50byBhIHNpbmdsZSBjb2RlIHN0cmluZy5cblx0ICogQHBhcmFtIGRlcEdyYXBoIC0gVGhlIGRlcGVuZGVuY3kgZ3JhcGggY29udGFpbmluZyBhbGwgbW9kdWxlcy5cblx0ICogQHJldHVybnMgVGhlIGJ1bmRsZWQgY29kZSwgb3B0aW9uYWwgc291cmNlIG1hcCwgYW5kIGEgbWFwIG9mIG1vZHVsZSBwYXRocyB0byB0aGVpciBjb2RlLlxuXHQgKi9cblx0cHVibGljIGJ1bmRsZShkZXBHcmFwaDogRGVwZW5kZW5jeUdyYXBoKTogQnVuZGxlUmVzdWx0IHtcblx0XHRsb2dnZXIuaW5mbyhgU3RhcnRpbmcgYnVuZGxlIHByb2Nlc3Mgd2l0aCAke2RlcEdyYXBoLnNpemV9IG1vZHVsZXNgKTtcblx0XHRjb25zdCBtb2R1bGVzID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblx0XHRjb25zdCBtb2R1bGVPcmRlciA9IGRlcEdyYXBoLmdldFRvcG9sb2dpY2FsT3JkZXIoKTtcblxuXHRcdC8vIEFkZCBmb3JtYXQtc3BlY2lmaWMgcHJlYW1ibGUgYmFzZWQgb24gbW9kdWxlIGZvcm1hdFxuXHRcdGNvbnN0IG1vZHVsZUZvcm1hdDogTW9kdWxlRm9ybWF0ID0gdGhpcy5nZXRNb2R1bGVGb3JtYXQoKTtcblx0XHRsb2dnZXIuaW5mbyhgVXNpbmcgbW9kdWxlIGZvcm1hdDogJHttb2R1bGVGb3JtYXR9YCk7XG5cdFx0bGV0IGNvZGUgPSB0aGlzLmdlbmVyYXRlUHJlYW1ibGUoKTtcblxuXHRcdC8vIExvZyBleHRlcm5hbCBtb2R1bGVzIGJlaW5nIHNraXBwZWRcblx0XHR0aGlzLm9wdGlvbnMuZXh0ZXJuYWxzLmZvckVhY2goKGV4dCkgPT4ge1xuXHRcdFx0bG9nZ2VyLmluZm8oYFNraXBwaW5nIGV4dGVybmFsIG1vZHVsZTogJHtleHR9YCk7XG5cdFx0fSk7XG5cblx0XHQvLyBJbml0aWFsaXplIHNvdXJjZSBtYXAgZ2VuZXJhdG9yXG5cdFx0Y29uc3Qgc291cmNlTWFwID0gbmV3IFNvdXJjZU1hcEdlbmVyYXRvcih7IGZpbGU6IFwiYnVuZGxlLmpzXCIgfSk7XG5cblx0XHQvLyBCdW5kbGUgbW9kdWxlcyBpbiBkZXBlbmRlbmN5IG9yZGVyXG5cdFx0Zm9yIChjb25zdCBtb2R1bGVQYXRoIG9mIG1vZHVsZU9yZGVyKSB7XG5cdFx0XHRpZiAodGhpcy5vcHRpb25zLmV4dGVybmFscy5pbmNsdWRlcyhtb2R1bGVQYXRoKSkge1xuXHRcdFx0XHQvLyBTa2lwIGJ1bmRsaW5nIGV4dGVybmFsIG1vZHVsZXNcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0XHRsb2dnZXIuaW5mbyhgQnVuZGxpbmcgbW9kdWxlOiAke21vZHVsZVBhdGh9YCk7XG5cdFx0XHRjb25zdCBtb2R1bGVDb2RlID0gdGhpcy5idW5kbGVNb2R1bGUoZGVwR3JhcGgsIG1vZHVsZVBhdGgpO1xuXHRcdFx0bW9kdWxlcy5zZXQobW9kdWxlUGF0aCwgbW9kdWxlQ29kZSk7XG5cdFx0XHRjb2RlICs9IG1vZHVsZUNvZGU7XG5cblx0XHRcdC8vIEV4YW1wbGUgc291cmNlIG1hcCBtYXBwaW5nICh0byBiZSBlbmhhbmNlZCBiYXNlZCBvbiBhY3R1YWwgY29kZSBnZW5lcmF0aW9uKVxuXHRcdFx0Ly8gVGhpcyBzaW1wbGlzdGljIG1hcHBpbmcgYXNzdW1lcyBvbmUgbGluZSBwZXIgbW9kdWxlXG5cdFx0XHRjb25zdCBsaW5lID0gY29kZS5zcGxpdChcIlxcblwiKS5sZW5ndGg7XG5cdFx0XHRzb3VyY2VNYXAuYWRkTWFwcGluZyh7XG5cdFx0XHRcdGdlbmVyYXRlZDogeyBsaW5lOiBsaW5lLCBjb2x1bW46IDAgfSxcblx0XHRcdFx0b3JpZ2luYWw6IHsgbGluZTogMSwgY29sdW1uOiAwIH0sXG5cdFx0XHRcdHNvdXJjZTogbW9kdWxlUGF0aCxcblx0XHRcdH0pO1xuXHRcdFx0c291cmNlTWFwLnNldFNvdXJjZUNvbnRlbnQobW9kdWxlUGF0aCwgbW9kdWxlcy5nZXQobW9kdWxlUGF0aCkgfHwgXCJcIik7XG5cdFx0fVxuXG5cdFx0Y29kZSArPSB0aGlzLmdlbmVyYXRlUG9zdGFtYmxlKCk7XG5cdFx0bG9nZ2VyLmluZm8oXCJCdW5kbGUgcHJvY2VzcyBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5XCIpO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvZGUsXG5cdFx0XHRtb2R1bGVzLFxuXHRcdFx0bWFwOiB0aGlzLm9wdGlvbnMuc291cmNlTWFwcyA/IHNvdXJjZU1hcC50b1N0cmluZygpIDogdW5kZWZpbmVkLFxuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lcyB0aGUgbW9kdWxlIGZvcm1hdCBiYXNlZCBvbiBjb21waWxlciBvcHRpb25zLlxuXHQgKi9cblx0cHJpdmF0ZSBnZXRNb2R1bGVGb3JtYXQoKTogTW9kdWxlRm9ybWF0IHtcblx0XHRpZiAodGhpcy5vcHRpb25zLm1vZHVsZSA9PT0gdHMuTW9kdWxlS2luZC5Db21tb25KUykge1xuXHRcdFx0cmV0dXJuIFwiY29tbW9uanNcIjtcblx0XHR9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5tb2R1bGUgPT09IHRzLk1vZHVsZUtpbmQuVU1EKSB7XG5cdFx0XHRyZXR1cm4gXCJ1bWRcIjtcblx0XHR9XG5cdFx0cmV0dXJuIFwiZXM2XCI7XG5cdH1cblxuXHQvKipcblx0ICogV3JhcHMgYSBzaW5nbGUgbW9kdWxlJ3MgY29kZSBiYXNlZCBvbiB0aGUgdGFyZ2V0IG1vZHVsZSBmb3JtYXQuXG5cdCAqIEBwYXJhbSBkZXBHcmFwaCAtIFRoZSBkZXBlbmRlbmN5IGdyYXBoLlxuXHQgKiBAcGFyYW0gbW9kdWxlUGF0aCAtIFRoZSBwYXRoIG9mIHRoZSBtb2R1bGUgdG8gYnVuZGxlLlxuXHQgKiBAcmV0dXJucyBUaGUgd3JhcHBlZCBtb2R1bGUgY29kZSBhcyBhIHN0cmluZy5cblx0ICovXG5cdHByaXZhdGUgYnVuZGxlTW9kdWxlKGRlcEdyYXBoOiBEZXBlbmRlbmN5R3JhcGgsIG1vZHVsZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG5cdFx0Y29uc3QgbW9kdWxlID0gZGVwR3JhcGguZ2V0TW9kdWxlKG1vZHVsZVBhdGgpO1xuXHRcdGlmICghbW9kdWxlKSB7XG5cdFx0XHRsb2dnZXIuZXJyb3IoYEZhaWxlZCB0byBidW5kbGUgbW9kdWxlOiAke21vZHVsZVBhdGh9IC0gTW9kdWxlIG5vdCBmb3VuZGApO1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBNb2R1bGUgbm90IGZvdW5kOiAke21vZHVsZVBhdGh9YCk7XG5cdFx0fVxuXG5cdFx0Ly8gVXNlIHRoZSBNb2R1bGVGb3JtYXQgdG8gZGV0ZXJtaW5lIHdyYXBwaW5nXG5cdFx0Y29uc3QgZm9ybWF0ID0gdGhpcy5nZXRNb2R1bGVGb3JtYXQoKTtcblx0XHRsb2dnZXIuaW5mbyhgV3JhcHBpbmcgbW9kdWxlICR7bW9kdWxlUGF0aH0gdXNpbmcgJHtmb3JtYXR9IGZvcm1hdGApO1xuXG5cdFx0cmV0dXJuIGZvcm1hdCA9PT0gXCJjb21tb25qc1wiXG5cdFx0XHQ/IHRoaXMud3JhcENvbW1vbkpTKG1vZHVsZVBhdGgsIG1vZHVsZS5jb2RlKVxuXHRcdFx0OiB0aGlzLndyYXBFU01vZHVsZShtb2R1bGVQYXRoLCBtb2R1bGUuY29kZSk7XG5cdH1cblxuXHQvKipcblx0ICogV3JhcHMgbW9kdWxlIGNvZGUgaW4gYSBDb21tb25KUyBmb3JtYXQuXG5cdCAqIEBwYXJhbSBwYXRoIC0gVGhlIG1vZHVsZSdzIGZpbGUgcGF0aC5cblx0ICogQHBhcmFtIGNvZGUgLSBUaGUgbW9kdWxlJ3MgY29kZS5cblx0ICogQHJldHVybnMgVGhlIENvbW1vbkpTLXdyYXBwZWQgbW9kdWxlIGNvZGUuXG5cdCAqL1xuXHRwcml2YXRlIHdyYXBDb21tb25KUyhwYXRoOiBzdHJpbmcsIGNvZGU6IHN0cmluZyk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIGBcbl9fcmVnaXN0ZXIoXCIke3BhdGh9XCIsIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgcmVxdWlyZSkge1xuJHtjb2RlfVxufSk7XG5gO1xuXHR9XG5cblx0LyoqXG5cdCAqIFdyYXBzIG1vZHVsZSBjb2RlIGluIGFuIEVTIE1vZHVsZSBmb3JtYXQuXG5cdCAqIEBwYXJhbSBwYXRoIC0gVGhlIG1vZHVsZSdzIGZpbGUgcGF0aC5cblx0ICogQHBhcmFtIGNvZGUgLSBUaGUgbW9kdWxlJ3MgY29kZS5cblx0ICogQHJldHVybnMgVGhlIEVTIE1vZHVsZS13cmFwcGVkIG1vZHVsZSBjb2RlLlxuXHQgKi9cblx0cHJpdmF0ZSB3cmFwRVNNb2R1bGUocGF0aDogc3RyaW5nLCBjb2RlOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRcdHJldHVybiBgXG5fX3JlZ2lzdGVyKFwiJHtwYXRofVwiLCBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcbiR7Y29kZX1cbn0pO1xuYDtcblx0fVxuXG5cdC8qKlxuXHQgKiBHZW5lcmF0ZXMgdGhlIHByZWFtYmxlIGNvZGUgdGhhdCBpbml0aWFsaXplcyB0aGUgbW9kdWxlIHJlZ2lzdHJ5IGFuZCByZXF1aXJlIGZ1bmN0aW9uLlxuXHQgKiBAcmV0dXJucyBUaGUgcHJlYW1ibGUgY29kZSBhcyBhIHN0cmluZy5cblx0ICovXG5cdHByaXZhdGUgZ2VuZXJhdGVQcmVhbWJsZSgpOiBzdHJpbmcge1xuXHRcdHJldHVybiBgXG4oZnVuY3Rpb24oZ2xvYmFsKSB7XG4gIGNvbnN0IG1vZHVsZXMgPSBuZXcgTWFwKCk7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gbmV3IE1hcCgpO1xuXG4gIGZ1bmN0aW9uIF9fcmVnaXN0ZXIocGF0aCwgZmFjdG9yeSkge1xuICAgIHJlZ2lzdHJ5LnNldChwYXRoLCBmYWN0b3J5KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9fcmVxdWlyZShwYXRoKSB7XG4gICAgaWYgKG1vZHVsZXMuaGFzKHBhdGgpKSB7XG4gICAgICByZXR1cm4gbW9kdWxlcy5nZXQocGF0aCkuZXhwb3J0cztcbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGUgPSB7IGV4cG9ydHM6IHt9IH07XG4gICAgbW9kdWxlcy5zZXQocGF0aCwgbW9kdWxlKTtcblxuICAgIGNvbnN0IGZhY3RvcnkgPSByZWdpc3RyeS5nZXQocGF0aCk7XG4gICAgaWYgKCFmYWN0b3J5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXFxgTW9kdWxlIG5vdCBmb3VuZDogXFwke3BhdGh9XFxgKTtcbiAgICB9XG4gICAgZmFjdG9yeShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3JlcXVpcmUpO1xuXG4gICAgcmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuICB9XG5cbiAgZ2xvYmFsLl9fcmVxdWlyZSA9IF9fcmVxdWlyZTtcbn0pKHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbFRoaXMgOiB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IGdsb2JhbCk7XG5gO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdlbmVyYXRlcyB0aGUgcG9zdGFtYmxlIGNvZGUgdGhhdCByZXF1aXJlcyB0aGUgZW50cnkgcG9pbnQgbW9kdWxlIHRvIHN0YXJ0IGV4ZWN1dGlvbi5cblx0ICogQHJldHVybnMgVGhlIHBvc3RhbWJsZSBjb2RlIGFzIGEgc3RyaW5nLlxuXHQgKi9cblx0cHJpdmF0ZSBnZW5lcmF0ZVBvc3RhbWJsZSgpOiBzdHJpbmcge1xuXHRcdHJldHVybiBgXG5fX3JlcXVpcmUoXCIke3RoaXMub3B0aW9ucy5lbnRyeVBvaW50fVwiKTtcbmA7XG5cdH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwyQkFBMkI7QUFFM0I7O0NBRUMsR0FJRCxTQUFTLGtCQUFrQixRQUFRLGtDQUFrQztBQUNyRSxTQUFTLE1BQU0sUUFBUSxjQUFjO0FBQ3JDLFNBQVMsRUFBRSxRQUFRLDZDQUE2QztBQVdoRTs7Q0FFQyxHQUNELE9BQU8sTUFBTTs7RUFDWixZQUFZLEFBQVEsT0FBd0IsQ0FBRTtTQUExQixVQUFBO0VBQTJCO0VBRS9DOzs7O0VBSUMsR0FDRCxBQUFPLE9BQU8s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
// denoCacheMetadata=863209187255150816,6058294424073612677