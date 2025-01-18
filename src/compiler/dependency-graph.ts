// /src/compiler/dependency-graph.ts
import type { ModuleInfo } from "./types.ts";
import * as path from "jsr:@std/path@0.224.0";
import { ts } from "npm:ts-morph@17.0.1";


/**
 * Represents a directed graph of module dependencies for tracking and managing relationships between modules.
 * Provides functionality for building, analyzing, and optimizing module dependencies in a TypeScript/JavaScript project.
 * 
 * Features:
 * - Dependency tracking and resolution
 * - Cycle detection
 * - Topological sorting
 * - Graph optimization
 * - Module merging
 * - Connected components analysis
 * 
 * @example
 * ```typescript
 * const graph = new DependencyGraph();
 * await graph.build(entryModule, { parseModule: async (path) => {...} });
 * const order = graph.getTopologicalOrder();
 * ```
 * 
 * @remarks
 * The graph maintains three primary data structures:
 * - modules: Map of module paths to their corresponding ModuleInfo
 * - dependencies: Map of module paths to their dependencies
 * - reverseDependencies: Map of module paths to their dependents
 * 
 * The graph can be serialized to JSON for persistence and deserialized back into a working graph.
 * 
 * @see {@link ModuleInfo} for the structure of module information
 * @see {@link build} for initializing the graph
 * @see {@link optimizeGraph} for performing graph optimizations
 */
export class DependencyGraph {
	private modules = new Map<string, ModuleInfo>();
	private dependencies = new Map<string, Set<string>>();
	private reverseDependencies = new Map<string, Set<string>>();
	public moduleOrder: string[] = [];

	/**
	 * Gets the total number of modules in the graph
	 */
	public get size(): number {
		return this.modules.size;
	}

	/**
	 * Builds the dependency graph starting from the entry module.
	 * @param entryModule - The entry module to start building the graph.
	 * @param options - An object containing the parseModule function.
	 */
	public async build(
		entryModule: ModuleInfo,
		options: { parseModule: (path: string) => Promise<ModuleInfo> },
	): Promise<void> {
		await this.addModule(entryModule, options);
	}

	/**
	 * Retrieves a module by its path.
	 * @param path - The module's file path.
	 * @returns The Module object or undefined if not found.
	 */
	public getModule(path: string): ModuleInfo | undefined {
		return this.modules.get(path);
	}

	/**
	 * Retrieves all modules in the graph.
	 * @returns An array of Module objects.
	 */
	public getAllModules(): ModuleInfo[] {
		return Array.from(this.modules.values());
	}

	/**
	 * Updates a module's information in the graph.
	 * @param path - The module's file path.
	 * @param module - The updated Module object.
	 */
	public updateModule(path: string, module: ModuleInfo): void {
		this.modules.set(path, module);
		this.setDependencies(path, module.dependencies);
	}

	/**
	 * Sets the dependencies for a given module.
	 * @param path - The module's file path.
	 * @param dependencies - An array of dependency module specifiers.
	 */
	private setDependencies(path: string, dependencies: string[]): void {
		if (!this.dependencies.has(path)) {
			this.dependencies.set(path, new Set());
		}
		const deps = this.dependencies.get(path)!;
		deps.clear();
		for (const dep of dependencies) {
			const resolvedDep = this.resolveModulePath(dep, path);
			deps.add(resolvedDep);
			// Update reverse dependencies
			if (!this.reverseDependencies.has(resolvedDep)) {
				this.reverseDependencies.set(resolvedDep, new Set());
			}
			this.reverseDependencies.get(resolvedDep)!.add(path);
		}
	}

	/**
	 * Resolves a module specifier to an absolute file path.
	 * @param specifier - The module specifier string.
	 * @param importerPath - The path of the importing module.
	 * @returns The resolved absolute file path.
	 */
	private resolveModulePath(specifier: string, importerPath: string): string {
		if (specifier.startsWith(".") || specifier.startsWith("/")) {
			// Relative or absolute path
			const importerDir = path.dirname(importerPath);
			let resolvedPath = path.resolve(importerDir, specifier);
			if (!resolvedPath.endsWith(".ts") && !resolvedPath.endsWith(".js")) {
				// Attempt to resolve with .ts extension
				if (Deno.env.get("DENO_BUILD_EXTENSIONS")) {
					resolvedPath += ".ts";
				} else {
					resolvedPath += ".js";
				}
			}
			return resolvedPath;
		} else {
			// Node modules or aliases
			// Simplistic node_modules resolution
			const nodeModulesPath = path.resolve("./node_modules", specifier);
			// Attempt to find index.ts or index.js
			try {
				if (Deno.statSync(nodeModulesPath + ".ts").isFile) {
					return nodeModulesPath + ".ts";
				} else if (Deno.statSync(nodeModulesPath + ".js").isFile) {
					return nodeModulesPath + ".js";
				}
			} catch {
				// File does not exist, proceed to check for index files
			}
			try {
				// Attempt to find index files
				if (Deno.statSync(path.join(nodeModulesPath, "index.ts")).isFile) {
					return path.join(nodeModulesPath, "index.ts");
				} else if (
					Deno.statSync(path.join(nodeModulesPath, "index.js")).isFile
				) {
					return path.join(nodeModulesPath, "index.js");
				}
			} catch {
				// Index files do not exist
			}
			throw new Error(
				`Cannot resolve module '${specifier}' imported from '${importerPath}'`,
			);
		}
	}

	/**
	 * Returns the topological order of modules for bundling.
	 * @returns An array of module paths in topological order.
	 */
	public getTopologicalOrder(): string[] {
		const visited = new Set<string>();
		const order: string[] = [];

		const visit = (p: string) => {
			if (visited.has(p)) return;
			visited.add(p);

			const deps = this.dependencies.get(p) || new Set();
			for (const dep of deps) {
				visit(dep);
			}
			order.push(p);
		};

		for (const p of this.modules.keys()) {
			visit(p);
		}

		return order;
	}

	/**
	 * Adds a module and its dependencies to the graph recursively.
	 * @param module - The Module object to add.
	 * @param options - An object containing the parseModule function.
	 */
	private async addModule(
		module: ModuleInfo,
		options: { parseModule: (path: string) => Promise<ModuleInfo> },
	): Promise<void> {
		this.updateModule(module.path, module);

		// Process dependencies
		for (const dep of module.dependencies) {
			const resolvedDep = this.resolveModulePath(dep, module.path);
			if (!this.modules.has(resolvedDep)) {
				const depModule = await options.parseModule(resolvedDep);
				await this.addModule(depModule, options);
			}
		}
	}

	/**
	 * Retrieves the dependencies of a module.
	 * @param path - The module's file path.
	 * @returns A Set of dependency module paths.
	 */
	public getDependencies(path: string): Set<string> {
		return this.dependencies.get(path) ?? new Set();
	}

	/**
	 * Retrieves the dependents of a module.
	 * @param path - The module's file path.
	 * @returns A Set of dependent module paths.
	 */
	public getDependents(path: string): Set<string> {
		return this.reverseDependencies.get(path) ?? new Set();
	}

	/**
	 * Checks if the dependency graph contains any cycles.
	 * @returns True if a cycle is detected, otherwise false.
	 */
	public hasCycle(): boolean {
		const visited = new Set<string>();
		const recursionStack = new Set<string>();

		const hasCycleUtil = (p: string): boolean => {
			if (!visited.has(p)) {
				visited.add(p);
				recursionStack.add(p);

				const deps = this.dependencies.get(p) || new Set();
				for (const dep of deps) {
					if (!visited.has(dep)) {
						if (hasCycleUtil(dep)) {
							return true;
						}
					} else if (recursionStack.has(dep)) {
						return true;
					}
				}
			}
			recursionStack.delete(p);
			return false;
		};

		for (const p of this.modules.keys()) {
			if (hasCycleUtil(p)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Retrieves all connected components within the dependency graph.
	 * @returns An array of Sets, each representing a connected component.
	 */
	public getConnectedComponents(): Set<string>[] {
		const visited = new Set<string>();
		const components: Set<string>[] = [];

		const dfs = (p: string, component: Set<string>) => {
			if (visited.has(p)) return;
			visited.add(p);
			component.add(p);

			// Visit dependencies
			const deps = this.getDependencies(p);
			for (const dep of deps) {
				dfs(dep, component);
			}

			// Visit dependents
			const depents = this.getDependents(p);
			for (const dependent of depents) {
				dfs(dependent, component);
			}
		};

		for (const p of this.modules.keys()) {
			if (!visited.has(p)) {
				const component = new Set<string>();
				dfs(p, component);
				components.push(component);
			}
		}

		return components;
	}

	/**
	 * Optimizes the dependency graph by removing unused modules, merging modules, and sorting them.
	 */
	public optimizeGraph(): void {
		// Remove unused modules
		this.removeUnusedModules();

		// Merge modules if possible
		this.mergeModules();

		// Optimize module order
		this.optimizeModuleOrder();
	}

	/**
	 * Removes modules that are not reachable from any entry points.
	 */
	private removeUnusedModules(): void {
		const reachable = new Set<string>();

		const visit = (p: string) => {
			if (reachable.has(p)) return;
			reachable.add(p);

			const deps = this.getDependencies(p);
			for (const d of deps) {
				visit(d);
			}
		};

		// Start from entry points (modules with no dependents)
		const entryPoints = Array.from(this.modules.keys()).filter(
			(x) => !this.getDependents(x).size,
		);

		for (const entry of entryPoints) {
			visit(entry);
		}

		// Remove unreachable modules
		for (const p of Array.from(this.modules.keys())) {
			if (!reachable.has(p)) {
				this.removeModule(p);
			}
		}
	}

	/**
	 * Identifies and merges modules that are suitable candidates for merging.
	 * @returns An array of tuples where each tuple contains the source and target module paths.
	 */
	private findMergeCandidates(): [string, string][] {
		const candidates: [string, string][] = [];
		for (const [path] of this.modules.entries()) {
			const deps = this.getDependencies(path);
			if (deps.size === 1) {
				const [dep] = Array.from(deps);
				const depents = this.getDependents(dep);
				if (depents.size === 1) {
					candidates.push([path, dep]);
				}
			}
		}
		return candidates;
	}

	/**
	 * Merges a pair of modules into a single module.
	 * @param source - The source module path to be merged into the target.
	 * @param target - The target module path that will absorb the source module.
	 */
	private mergeModulePair(source: string, target: string): void {
		const sourceModule = this.getModule(source);
		const targetModule = this.getModule(target);
		if (!sourceModule || !targetModule) return;

		// Create source file ASTs
		const sourceFile = ts.createSourceFile(
			source,
			sourceModule.code,
			ts.ScriptTarget.Latest,
			true,
		);

		const targetFile = ts.createSourceFile(
			target,
			targetModule.code,
			ts.ScriptTarget.Latest,
			true,
		);

		// Merge the ASTs by combining their statements
		const mergedStatements = [
			...this.getModuleStatements(targetFile),
			...this.getModuleStatements(sourceFile),
		];

		// Generate merged code from statements
		const printer = ts.createPrinter();
		const mergedCode = mergedStatements
			.map((stmt) =>
				printer.printNode(ts.EmitHint.Unspecified, stmt, targetFile)
			)
			.join("\n");

		// Create merged module
		const mergedModule: ModuleInfo = {
			path: target,
			code: mergedCode,
			dependencies: Array.from(
				new Set([...targetModule.dependencies, ...sourceModule.dependencies]),
			),
			ast: targetFile,
		};

		// Update graph
		this.updateModule(target, mergedModule);
		this.removeModule(source);
	}

	/**
	 * Helper to get statements from a source file
	 */
	private getModuleStatements(sourceFile: ts.SourceFile): ts.Statement[] {
		return Array.from(sourceFile.statements);
	}

	/**
	 * Merges all candidate module pairs.
	 */
	private mergeModules(): void {
		const candidates = this.findMergeCandidates();
		for (const [source, target] of candidates) {
			this.mergeModulePair(source, target);
		}
	}

	/**
	 * Optimizes the order of modules based on their dependencies and calculated weights.
	 */
	private optimizeModuleOrder(): void {
		const order = this.getTopologicalOrder();
		const optimizedModules = new Map<string, ModuleInfo>();

		// Sort the modules by their TypeScript AST node count for optimal loading
		const moduleWeights = new Map<string, number>();
		for (const path of order) {
			const module = this.modules.get(path);
			if (module?.ast) {
				const ast = module.ast as ts.SourceFile;
				if (ts.isSourceFile(ast)) {
					let nodeCount = 0;
					const visitor: ts.Visitor = (
						node: ts.Node,
					): ts.VisitResult<ts.Node> => {
						nodeCount++;
						return node;
					};
					ts.forEachChild(ast, visitor);
					moduleWeights.set(path, nodeCount);
				}
			}
		}

		// Sort by weights and create the optimized module map
		const sortedPaths = order.sort((a, b) =>
			(moduleWeights.get(b) || 0) - (moduleWeights.get(a) || 0)
		);

		for (const path of sortedPaths) {
			const module = this.modules.get(path);
			if (module) {
				optimizedModules.set(path, module);
			}
		}

		this.modules = optimizedModules;
	}

	/**
	 * Calculates the weight of a module based on various factors to determine bundling order.
	 * @param path - The module's file path.
	 * @returns The calculated weight as a number.
	 */
	private calculateModuleWeight(path: string): number {
		const mod = this.getModule(path);
		if (!mod) return 0;
		// Example weight calculation
		const sizeWeight = mod.code.length * 0.5;
		const depWeight = this.getDependencies(path).size * 100;
		const depEndWeight = this.getDependents(path).size * 150;
		const criticalPathWeight = this.calculateCriticalPathDepth(path) * 200;

		return sizeWeight + depWeight + depEndWeight + criticalPathWeight;
	}

	/**
	 * Recursively calculates the critical path depth of a module in the dependency graph.
	 * @param path - The module's file path.
	 * @param visited - A set to track visited modules to avoid infinite recursion.
	 * @returns The depth as a number.
	 */
	private calculateCriticalPathDepth(
		path: string,
		visited: Set<string> = new Set(),
	): number {
		if (visited.has(path)) return 0;
		visited.add(path);

		const deps = this.getDependencies(path);
		if (deps.size === 0) return 1;

		let maxDepth = 0;
		for (const dep of deps) {
			const depth = this.calculateCriticalPathDepth(dep, visited);
			if (depth > maxDepth) {
				maxDepth = depth;
			}
		}
		return maxDepth + 1;
	}

	/**
	 * Removes a module from the dependency graph.
	 * @param path - The module's file path to remove.
	 */
	private removeModule(path: string): void {
		this.modules.delete(path);
		this.dependencies.delete(path);

		for (const deps of this.dependencies.values()) {
			deps.delete(path);
		}

		this.reverseDependencies.delete(path);
		for (const depents of this.reverseDependencies.values()) {
			depents.delete(path);
		}
	}

	/**
	 * Serializes the dependency graph to a JSON string.
	 * @returns The serialized dependency graph.
	 */
	public toJSON(): string {
		return JSON.stringify(
			{
				modules: Array.from(this.modules.entries()),
				dependencies: Array.from(this.dependencies.entries()).map(([k, v]) => [
					k,
					Array.from(v),
				]),
				dependents: Array.from(this.reverseDependencies.entries()).map((
					[k, v],
				) => [
					k,
					Array.from(v),
				]),
			},
			null,
			2,
		);
	}

	/**
	 * Deserializes a JSON string to reconstruct a DependencyGraph instance.
	 * @param json - The JSON string representing the dependency graph.
	 * @returns The reconstructed DependencyGraph instance.
	 */
	public static fromJSON(json: string): DependencyGraph {
		const data = JSON.parse(json);
		const graph = new DependencyGraph();

		// Restore modules
		graph.modules = new Map<string, ModuleInfo>(data.modules);

		// Restore dependencies
		graph.dependencies = new Map<string, Set<string>>(
			data.dependencies.map(([key, values]: [string, string[]]) => [
				key,
				new Set(values),
			]),
		);

		// Restore dependents
		graph.reverseDependencies = new Map<string, Set<string>>(
			data.dependents.map(([key, values]: [string, string[]]) => [
				key,
				new Set(values),
			]),
		);

		// Validate
		if (graph.hasCycle()) {
			throw new Error("Restored dependency graph contains cycles");
		}

		// Verify references
		for (const [modulePath, deps] of graph.dependencies) {
			if (!graph.modules.has(modulePath)) {
				throw new Error(
					`Invalid module reference in dependencies: ${modulePath}`,
				);
			}
			for (const dep of deps) {
				if (!graph.modules.has(dep)) {
					throw new Error(
						`Invalid dependency reference: ${dep} in module ${modulePath}`,
					);
				}
			}
		}

		return graph;
	}
}
