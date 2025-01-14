// /src/compiler/compiler.ts
import {
	BuildContext,
	BundleResult,
	CompilerOptions,
	CompilerPlugin,
	GeneratedOutput,
	ModuleInfo,
	OnLoadArgs,
	OnLoadResult,
	OnResolveArgs,
	OnResolveResult,
	OnTransformArgs,
	OnTransformResult,
	SourceFile,
} from "./types.ts";

import { ts } from "https://deno.land/x/ts_morph@17.0.1/mod.ts";
import { Parser } from "./parser.ts";
import { Transformer } from "./transformer.ts";
import { Bundler } from "./bundler.ts";
import { CodeGenerator } from "./codegen.ts";
import { logger } from "./logger.ts";
import { DependencyGraph } from "./dependency-graph.ts";
import { Cache } from "./cache.ts";

/**
 * Compiler class orchestrates the parsing, transforming, bundling, and code generation processes.
 */
export class Compiler {
	private parser: Parser;
	private transformer: Transformer;
	private bundler: Bundler;
	private codeGenerator: CodeGenerator;
	private cache: Cache<ModuleInfo>;
	private logger = logger;
	private plugins: CompilerPlugin[] = [];
	private buildContext: BuildContext;
	private depGraph: DependencyGraph;
	private options: CompilerOptions;

	/**
	 * Initializes the Compiler with the provided options, setting up all components.
	 * @param partialOptions - Partial CompilerOptions to customize the compiler behavior.
	 */
	constructor(partialOptions: Partial<CompilerOptions>) {
		const mandatoryDefaults: CompilerOptions = {
			entryPoint: "",
			outDir: "dist",
			sourceMaps: false,
			minify: false,
			target: ts.ScriptTarget.ES2020,
			plugins: [],
			module: ts.ModuleKind.ESNext,
			platform: "browser",
			externals: [],
			define: {},
			treeshake: true,
			format: "es6",
			experimentalDecorators: false,
			umdName: "bundle",
		};

		this.options = {
			...mandatoryDefaults,
			...partialOptions,
		};

		this.parser = new Parser(this.options);
		this.transformer = new Transformer(this.options);
		this.bundler = new Bundler(this.options);
		this.codeGenerator = new CodeGenerator(this.options);
		this.cache = new Cache<ModuleInfo>();
		this.depGraph = new DependencyGraph();

		this.buildContext = this.createBuildContext();
		this.registerPlugins(this.options.plugins);
	}

	private createBuildContext(): BuildContext {
		return {
			onLoad: this.handleOnLoad.bind(this),
			onResolve: this.handleOnResolve.bind(this),
			onTransform: this.handleOnTransform.bind(this),
		};
	}

	private handleOnLoad(
		_callback: (args: OnLoadArgs) => Promise<OnLoadResult>,
	): void {
		// Implementation placeholder
	}

	private handleOnResolve(
		_callback: (args: OnResolveArgs) => Promise<OnResolveResult>,
	): void {
		// Implementation placeholder
	}

	private handleOnTransform(
		_callback: (args: OnTransformArgs) => Promise<OnTransformResult>,
	): void {
		// Implementation placeholder
	}

	private registerPlugins(plugins: CompilerPlugin[]): void {
		for (const plugin of (plugins || [])) {
			this.plugins.push(plugin);
			plugin.setup(this.buildContext);
		}
	}

	public async compile(): Promise<void> {
		try {
			if (!this.options.entryPoint) {
				throw new Error("Entry point not specified in compiler options.");
			}

			const rawEntryModule = await this.parseModule(this.options.entryPoint);
			const entryModule = rawEntryModule as ModuleInfo;
			if (!entryModule) {
				throw new Error("Invalid entry module.");
			}

			await this.buildDependencyGraph(entryModule);

			if (this.depGraph.hasCycle()) {
				throw new Error("Dependency graph contains cycles.");
			}

			await this.depGraph.optimizeGraph();
			this.transformModules();

			const bundleResult = this.bundler.bundle(this.depGraph);
			const codeGenResult = await this.generateCode(bundleResult);
			const { code, map } = codeGenResult;

			await this.writeOutput(code, map);
		} catch (error) {
			this.logger.error(
				"Compilation failed:",
				error instanceof Error ? error.message : String(error),
			);
			throw error;
		}
	}

	private async parseModule(path: string): Promise<ModuleInfo> {
		const contents = await Deno.readTextFile(path);
		const cached = await this.cache.get(path, contents);
		if (cached) {
			return cached;
		}

		const parseResult = this.parser.parse(contents, path);

		const mod: ModuleInfo = {
			path,
			code: parseResult.ast.getFullText(),
			dependencies: parseResult.dependencies,
			ast: parseResult.ast,
		};

		await this.cache.set(path, mod, contents);
		return mod;
	}

	private async buildDependencyGraph(entryModule: ModuleInfo) {
		await this.depGraph.build(entryModule, {
			parseModule: async (depPath: string) => {
				return await this.parseModule(depPath);
			},
		});
	}

	private transformModules(): void {
		const modules = this.depGraph.getAllModules();

		for (const module of modules) {
			const result = this.transformer.transform({
				ast: module.ast as SourceFile,
				path: module.path,
			});

			module.code = result.ast.getFullText();
			module.ast = result.ast;
		}
	}

	private async generateCode(
		bundleResult: BundleResult,
	): Promise<GeneratedOutput> {
		const convertedModules = new Map<string, SourceFile>();
		for (const [key, value] of bundleResult.modules) {
			convertedModules.set(key, value as unknown as SourceFile);
		}

		const generatedOutput = await this.codeGenerator.generate(
			{
				ast: bundleResult.code as unknown as SourceFile,
				modules: convertedModules,
			},
			{
				sourceMaps: this.options.sourceMaps,
				minify: this.options.minify,
				target: ts.ScriptTarget[this.options.target].toLowerCase(),
				format: this.options.format,
				platform: this.options.platform,
				externals: this.options.externals,
			},
		);

		return generatedOutput;
	}

	private async writeOutput(code: string, sourceMap?: string) {
		await Deno.mkdir(this.options.outDir, { recursive: true });
		const outPath = `${this.options.outDir}/bundle.js`;
		await Deno.writeTextFile(outPath, code);

		if (sourceMap) {
			await Deno.writeTextFile(`${outPath}.map`, sourceMap);
		}
	}
}
