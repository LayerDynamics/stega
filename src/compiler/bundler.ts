// /src/compiler/bundler.ts

/**
 * Bundles all modules into a single output file, handling module wrapping based on the target module format.
 */

import { DependencyGraph } from "./dependency-graph.ts";
import type { CompilerOptions, ModuleFormat } from "./types.ts";
import { SourceMapGenerator } from "npm:source-map@0.7.4";
import { logger } from "./logger.ts";
import { ts } from "npm:ts-morph@17.0.1";

/**
 * Interface representing the result of the bundling process.
 */
export interface BundleResult {
	code: string;
	map?: string;
	modules: Map<string, string>;
}

/**
 * Bundler class responsible for combining all modules into a single bundle.
 */
export class Bundler {
	constructor(private options: CompilerOptions) {}

	/**
	 * Bundles the modules from the dependency graph into a single code string.
	 * @param depGraph - The dependency graph containing all modules.
	 * @returns The bundled code, optional source map, and a map of module paths to their code.
	 */
	public bundle(depGraph: DependencyGraph): BundleResult {
		logger.info(`Starting bundle process with ${depGraph.size} modules`);
		const modules = new Map<string, string>();
		const moduleOrder = depGraph.getTopologicalOrder();

		// Add format-specific preamble based on module format
		const moduleFormat: ModuleFormat = this.getModuleFormat();
		logger.info(`Using module format: ${moduleFormat}`);

		// Log external modules being skipped
		this.options.externals.forEach((ext: string) => {
			logger.info(`Skipping external module: ${ext}`);
		});

		let code = this.generatePreamble();

		// Initialize source map generator
		const sourceMap = new SourceMapGenerator({ file: "bundle.js" });

		// Bundle modules in dependency order
		for (const modulePath of moduleOrder) {
			if (this.options.externals.includes(modulePath)) {
				// Skip bundling external modules
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
				generated: { line: line, column: 0 },
				original: { line: 1, column: 0 },
				source: modulePath,
			});
			sourceMap.setSourceContent(modulePath, modules.get(modulePath) || "");
		}

		code += this.generatePostamble();
		logger.info("Bundle process completed successfully");

		return {
			code,
			modules,
			map: this.options.sourceMaps ? sourceMap.toString() : undefined,
		};
	}

	/**
	 * Determines the module format based on compiler options.
	 */
	private getModuleFormat(): ModuleFormat {
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
	 */
	private bundleModule(depGraph: DependencyGraph, modulePath: string): string {
		const module = depGraph.getModule(modulePath);
		if (!module) {
			logger.error(`Failed to bundle module: ${modulePath} - Module not found`);
			throw new Error(`Module not found: ${modulePath}`);
		}

		// Use the ModuleFormat to determine wrapping
		const format = this.getModuleFormat();
		logger.info(`Wrapping module ${modulePath} using ${format} format`);

		return format === "commonjs"
			? this.wrapCommonJS(modulePath, module.code)
			: this.wrapESModule(modulePath, module.code);
	}

	/**
	 * Wraps module code in a CommonJS format.
	 * @param path - The module's file path.
	 * @param code - The module's code.
	 * @returns The CommonJS-wrapped module code.
	 */
	private wrapCommonJS(path: string, code: string): string {
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
	 */
	private wrapESModule(path: string, code: string): string {
		return `
__register("${path}", function(module, exports) {
${code}
});
`;
	}

	/**
	 * Generates the preamble code that initializes the module registry and require function.
	 * @returns The preamble code as a string.
	 */
	private generatePreamble(): string {
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
	 */
	private generatePostamble(): string {
		return `
__require("${this.options.entryPoint}");
`;
	}
}
