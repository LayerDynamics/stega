// /src/compiler/dependency-graph.ts
import * as path from "https://deno.land/std@0.203.0/path/mod.ts";
import { ts } from "https://deno.land/x/ts_morph@17.0.1/mod.ts";
/**
 * Manages the dependency graph of modules, tracking their dependencies and dependents.
 */ export class DependencyGraph {
  modules = new Map();
  dependencies = new Map();
  reverseDependencies = new Map();
  moduleOrder = [];
  /**
	 * Gets the total number of modules in the graph
	 */ get size() {
    return this.modules.size;
  }
  /**
	 * Builds the dependency graph starting from the entry module.
	 * @param entryModule - The entry module to start building the graph.
	 * @param options - An object containing the parseModule function.
	 */ async build(entryModule, options) {
    await this.addModule(entryModule, options);
  }
  /**
	 * Retrieves a module by its path.
	 * @param path - The module's file path.
	 * @returns The Module object or undefined if not found.
	 */ getModule(path) {
    return this.modules.get(path);
  }
  /**
	 * Retrieves all modules in the graph.
	 * @returns An array of Module objects.
	 */ getAllModules() {
    return Array.from(this.modules.values());
  }
  /**
	 * Updates a module's information in the graph.
	 * @param path - The module's file path.
	 * @param module - The updated Module object.
	 */ updateModule(path, module) {
    this.modules.set(path, module);
    this.setDependencies(path, module.dependencies);
  }
  /**
	 * Sets the dependencies for a given module.
	 * @param path - The module's file path.
	 * @param dependencies - An array of dependency module specifiers.
	 */ setDependencies(path, dependencies) {
    if (!this.dependencies.has(path)) {
      this.dependencies.set(path, new Set());
    }
    const deps = this.dependencies.get(path);
    deps.clear();
    for (const dep of dependencies){
      const resolvedDep = this.resolveModulePath(dep, path);
      deps.add(resolvedDep);
      // Update reverse dependencies
      if (!this.reverseDependencies.has(resolvedDep)) {
        this.reverseDependencies.set(resolvedDep, new Set());
      }
      this.reverseDependencies.get(resolvedDep).add(path);
    }
  }
  /**
	 * Resolves a module specifier to an absolute file path.
	 * @param specifier - The module specifier string.
	 * @param importerPath - The path of the importing module.
	 * @returns The resolved absolute file path.
	 */ resolveModulePath(specifier, importerPath) {
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
      } catch  {
      // File does not exist, proceed to check for index files
      }
      try {
        // Attempt to find index files
        if (Deno.statSync(path.join(nodeModulesPath, "index.ts")).isFile) {
          return path.join(nodeModulesPath, "index.ts");
        } else if (Deno.statSync(path.join(nodeModulesPath, "index.js")).isFile) {
          return path.join(nodeModulesPath, "index.js");
        }
      } catch  {
      // Index files do not exist
      }
      throw new Error(`Cannot resolve module '${specifier}' imported from '${importerPath}'`);
    }
  }
  /**
	 * Returns the topological order of modules for bundling.
	 * @returns An array of module paths in topological order.
	 */ getTopologicalOrder() {
    const visited = new Set();
    const order = [];
    const visit = (p)=>{
      if (visited.has(p)) return;
      visited.add(p);
      const deps = this.dependencies.get(p) || new Set();
      for (const dep of deps){
        visit(dep);
      }
      order.push(p);
    };
    for (const p of this.modules.keys()){
      visit(p);
    }
    return order;
  }
  /**
	 * Adds a module and its dependencies to the graph recursively.
	 * @param module - The Module object to add.
	 * @param options - An object containing the parseModule function.
	 */ async addModule(module, options) {
    this.updateModule(module.path, module);
    // Process dependencies
    for (const dep of module.dependencies){
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
	 */ getDependencies(path) {
    return this.dependencies.get(path) ?? new Set();
  }
  /**
	 * Retrieves the dependents of a module.
	 * @param path - The module's file path.
	 * @returns A Set of dependent module paths.
	 */ getDependents(path) {
    return this.reverseDependencies.get(path) ?? new Set();
  }
  /**
	 * Checks if the dependency graph contains any cycles.
	 * @returns True if a cycle is detected, otherwise false.
	 */ hasCycle() {
    const visited = new Set();
    const recursionStack = new Set();
    const hasCycleUtil = (p)=>{
      if (!visited.has(p)) {
        visited.add(p);
        recursionStack.add(p);
        const deps = this.dependencies.get(p) || new Set();
        for (const dep of deps){
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
    for (const p of this.modules.keys()){
      if (hasCycleUtil(p)) {
        return true;
      }
    }
    return false;
  }
  /**
	 * Retrieves all connected components within the dependency graph.
	 * @returns An array of Sets, each representing a connected component.
	 */ getConnectedComponents() {
    const visited = new Set();
    const components = [];
    const dfs = (p, component)=>{
      if (visited.has(p)) return;
      visited.add(p);
      component.add(p);
      // Visit dependencies
      const deps = this.getDependencies(p);
      for (const dep of deps){
        dfs(dep, component);
      }
      // Visit dependents
      const depents = this.getDependents(p);
      for (const dependent of depents){
        dfs(dependent, component);
      }
    };
    for (const p of this.modules.keys()){
      if (!visited.has(p)) {
        const component = new Set();
        dfs(p, component);
        components.push(component);
      }
    }
    return components;
  }
  /**
	 * Optimizes the dependency graph by removing unused modules, merging modules, and sorting them.
	 */ optimizeGraph() {
    // Remove unused modules
    this.removeUnusedModules();
    // Merge modules if possible
    this.mergeModules();
    // Optimize module order
    this.optimizeModuleOrder();
  }
  /**
	 * Removes modules that are not reachable from any entry points.
	 */ removeUnusedModules() {
    const reachable = new Set();
    const visit = (p)=>{
      if (reachable.has(p)) return;
      reachable.add(p);
      const deps = this.getDependencies(p);
      for (const d of deps){
        visit(d);
      }
    };
    // Start from entry points (modules with no dependents)
    const entryPoints = Array.from(this.modules.keys()).filter((x)=>!this.getDependents(x).size);
    for (const entry of entryPoints){
      visit(entry);
    }
    // Remove unreachable modules
    for (const p of Array.from(this.modules.keys())){
      if (!reachable.has(p)) {
        this.removeModule(p);
      }
    }
  }
  /**
	 * Identifies and merges modules that are suitable candidates for merging.
	 * @returns An array of tuples where each tuple contains the source and target module paths.
	 */ findMergeCandidates() {
    const candidates = [];
    for (const [path] of this.modules.entries()){
      const deps = this.getDependencies(path);
      if (deps.size === 1) {
        const [dep] = Array.from(deps);
        const depents = this.getDependents(dep);
        if (depents.size === 1) {
          candidates.push([
            path,
            dep
          ]);
        }
      }
    }
    return candidates;
  }
  /**
	 * Merges a pair of modules into a single module.
	 * @param source - The source module path to be merged into the target.
	 * @param target - The target module path that will absorb the source module.
	 */ mergeModulePair(source, target) {
    const sourceModule = this.getModule(source);
    const targetModule = this.getModule(target);
    if (!sourceModule || !targetModule) return;
    // Create source file ASTs
    const sourceFile = ts.createSourceFile(source, sourceModule.code, ts.ScriptTarget.Latest, true);
    const targetFile = ts.createSourceFile(target, targetModule.code, ts.ScriptTarget.Latest, true);
    // Merge the ASTs by combining their statements
    const mergedStatements = [
      ...this.getModuleStatements(targetFile),
      ...this.getModuleStatements(sourceFile)
    ];
    // Generate merged code from statements
    const printer = ts.createPrinter();
    const mergedCode = mergedStatements.map((stmt)=>printer.printNode(ts.EmitHint.Unspecified, stmt, targetFile)).join("\n");
    // Create merged module
    const mergedModule = {
      path: target,
      code: mergedCode,
      dependencies: Array.from(new Set([
        ...targetModule.dependencies,
        ...sourceModule.dependencies
      ])),
      ast: targetFile
    };
    // Update graph
    this.updateModule(target, mergedModule);
    this.removeModule(source);
  }
  /**
	 * Helper to get statements from a source file
	 */ getModuleStatements(sourceFile) {
    return Array.from(sourceFile.statements);
  }
  /**
	 * Merges all candidate module pairs.
	 */ mergeModules() {
    const candidates = this.findMergeCandidates();
    for (const [source, target] of candidates){
      this.mergeModulePair(source, target);
    }
  }
  /**
	 * Optimizes the order of modules based on their dependencies and calculated weights.
	 */ optimizeModuleOrder() {
    const order = this.getTopologicalOrder();
    const optimizedModules = new Map();
    // Sort the modules by their TypeScript AST node count for optimal loading
    const moduleWeights = new Map();
    for (const path of order){
      const module = this.modules.get(path);
      if (module?.ast) {
        const ast = module.ast;
        if (ts.isSourceFile(ast)) {
          let nodeCount = 0;
          const visitor = (node)=>{
            nodeCount++;
            return node;
          };
          ts.forEachChild(ast, visitor);
          moduleWeights.set(path, nodeCount);
        }
      }
    }
    // Sort by weights and create the optimized module map
    const sortedPaths = order.sort((a, b)=>(moduleWeights.get(b) || 0) - (moduleWeights.get(a) || 0));
    for (const path of sortedPaths){
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
	 */ calculateModuleWeight(path) {
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
	 */ calculateCriticalPathDepth(path, visited = new Set()) {
    if (visited.has(path)) return 0;
    visited.add(path);
    const deps = this.getDependencies(path);
    if (deps.size === 0) return 1;
    let maxDepth = 0;
    for (const dep of deps){
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
	 */ removeModule(path) {
    this.modules.delete(path);
    this.dependencies.delete(path);
    for (const deps of this.dependencies.values()){
      deps.delete(path);
    }
    this.reverseDependencies.delete(path);
    for (const depents of this.reverseDependencies.values()){
      depents.delete(path);
    }
  }
  /**
	 * Serializes the dependency graph to a JSON string.
	 * @returns The serialized dependency graph.
	 */ toJSON() {
    return JSON.stringify({
      modules: Array.from(this.modules.entries()),
      dependencies: Array.from(this.dependencies.entries()).map(([k, v])=>[
          k,
          Array.from(v)
        ]),
      dependents: Array.from(this.reverseDependencies.entries()).map(([k, v])=>[
          k,
          Array.from(v)
        ])
    }, null, 2);
  }
  /**
	 * Deserializes a JSON string to reconstruct a DependencyGraph instance.
	 * @param json - The JSON string representing the dependency graph.
	 * @returns The reconstructed DependencyGraph instance.
	 */ static fromJSON(json) {
    const data = JSON.parse(json);
    const graph = new DependencyGraph();
    // Restore modules
    graph.modules = new Map(data.modules);
    // Restore dependencies
    graph.dependencies = new Map(data.dependencies.map(([key, values])=>[
        key,
        new Set(values)
      ]));
    // Restore dependents
    graph.reverseDependencies = new Map(data.dependents.map(([key, values])=>[
        key,
        new Set(values)
      ]));
    // Validate
    if (graph.hasCycle()) {
      throw new Error("Restored dependency graph contains cycles");
    }
    // Verify references
    for (const [modulePath, deps] of graph.dependencies){
      if (!graph.modules.has(modulePath)) {
        throw new Error(`Invalid module reference in dependencies: ${modulePath}`);
      }
      for (const dep of deps){
        if (!graph.modules.has(dep)) {
          throw new Error(`Invalid dependency reference: ${dep} in module ${modulePath}`);
        }
      }
    }
    return graph;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29tcGlsZXIvZGVwZW5kZW5jeS1ncmFwaC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyAvc3JjL2NvbXBpbGVyL2RlcGVuZGVuY3ktZ3JhcGgudHNcbmltcG9ydCB0eXBlIHsgTW9kdWxlSW5mbyB9IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4yMDMuMC9wYXRoL21vZC50c1wiO1xuaW1wb3J0IHsgdHMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC90c19tb3JwaEAxNy4wLjEvbW9kLnRzXCI7XG5cbi8qKlxuICogTWFuYWdlcyB0aGUgZGVwZW5kZW5jeSBncmFwaCBvZiBtb2R1bGVzLCB0cmFja2luZyB0aGVpciBkZXBlbmRlbmNpZXMgYW5kIGRlcGVuZGVudHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBEZXBlbmRlbmN5R3JhcGgge1xuXHRwcml2YXRlIG1vZHVsZXMgPSBuZXcgTWFwPHN0cmluZywgTW9kdWxlSW5mbz4oKTtcblx0cHJpdmF0ZSBkZXBlbmRlbmNpZXMgPSBuZXcgTWFwPHN0cmluZywgU2V0PHN0cmluZz4+KCk7XG5cdHByaXZhdGUgcmV2ZXJzZURlcGVuZGVuY2llcyA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4oKTtcblx0cHVibGljIG1vZHVsZU9yZGVyOiBzdHJpbmdbXSA9IFtdO1xuXG5cdC8qKlxuXHQgKiBHZXRzIHRoZSB0b3RhbCBudW1iZXIgb2YgbW9kdWxlcyBpbiB0aGUgZ3JhcGhcblx0ICovXG5cdHB1YmxpYyBnZXQgc2l6ZSgpOiBudW1iZXIge1xuXHRcdHJldHVybiB0aGlzLm1vZHVsZXMuc2l6ZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBCdWlsZHMgdGhlIGRlcGVuZGVuY3kgZ3JhcGggc3RhcnRpbmcgZnJvbSB0aGUgZW50cnkgbW9kdWxlLlxuXHQgKiBAcGFyYW0gZW50cnlNb2R1bGUgLSBUaGUgZW50cnkgbW9kdWxlIHRvIHN0YXJ0IGJ1aWxkaW5nIHRoZSBncmFwaC5cblx0ICogQHBhcmFtIG9wdGlvbnMgLSBBbiBvYmplY3QgY29udGFpbmluZyB0aGUgcGFyc2VNb2R1bGUgZnVuY3Rpb24uXG5cdCAqL1xuXHRwdWJsaWMgYXN5bmMgYnVpbGQoXG5cdFx0ZW50cnlNb2R1bGU6IE1vZHVsZUluZm8sXG5cdFx0b3B0aW9uczogeyBwYXJzZU1vZHVsZTogKHBhdGg6IHN0cmluZykgPT4gUHJvbWlzZTxNb2R1bGVJbmZvPiB9LFxuXHQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRhd2FpdCB0aGlzLmFkZE1vZHVsZShlbnRyeU1vZHVsZSwgb3B0aW9ucyk7XG5cdH1cblxuXHQvKipcblx0ICogUmV0cmlldmVzIGEgbW9kdWxlIGJ5IGl0cyBwYXRoLlxuXHQgKiBAcGFyYW0gcGF0aCAtIFRoZSBtb2R1bGUncyBmaWxlIHBhdGguXG5cdCAqIEByZXR1cm5zIFRoZSBNb2R1bGUgb2JqZWN0IG9yIHVuZGVmaW5lZCBpZiBub3QgZm91bmQuXG5cdCAqL1xuXHRwdWJsaWMgZ2V0TW9kdWxlKHBhdGg6IHN0cmluZyk6IE1vZHVsZUluZm8gfCB1bmRlZmluZWQge1xuXHRcdHJldHVybiB0aGlzLm1vZHVsZXMuZ2V0KHBhdGgpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyBhbGwgbW9kdWxlcyBpbiB0aGUgZ3JhcGguXG5cdCAqIEByZXR1cm5zIEFuIGFycmF5IG9mIE1vZHVsZSBvYmplY3RzLlxuXHQgKi9cblx0cHVibGljIGdldEFsbE1vZHVsZXMoKTogTW9kdWxlSW5mb1tdIHtcblx0XHRyZXR1cm4gQXJyYXkuZnJvbSh0aGlzLm1vZHVsZXMudmFsdWVzKCkpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgYSBtb2R1bGUncyBpbmZvcm1hdGlvbiBpbiB0aGUgZ3JhcGguXG5cdCAqIEBwYXJhbSBwYXRoIC0gVGhlIG1vZHVsZSdzIGZpbGUgcGF0aC5cblx0ICogQHBhcmFtIG1vZHVsZSAtIFRoZSB1cGRhdGVkIE1vZHVsZSBvYmplY3QuXG5cdCAqL1xuXHRwdWJsaWMgdXBkYXRlTW9kdWxlKHBhdGg6IHN0cmluZywgbW9kdWxlOiBNb2R1bGVJbmZvKTogdm9pZCB7XG5cdFx0dGhpcy5tb2R1bGVzLnNldChwYXRoLCBtb2R1bGUpO1xuXHRcdHRoaXMuc2V0RGVwZW5kZW5jaWVzKHBhdGgsIG1vZHVsZS5kZXBlbmRlbmNpZXMpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIGRlcGVuZGVuY2llcyBmb3IgYSBnaXZlbiBtb2R1bGUuXG5cdCAqIEBwYXJhbSBwYXRoIC0gVGhlIG1vZHVsZSdzIGZpbGUgcGF0aC5cblx0ICogQHBhcmFtIGRlcGVuZGVuY2llcyAtIEFuIGFycmF5IG9mIGRlcGVuZGVuY3kgbW9kdWxlIHNwZWNpZmllcnMuXG5cdCAqL1xuXHRwcml2YXRlIHNldERlcGVuZGVuY2llcyhwYXRoOiBzdHJpbmcsIGRlcGVuZGVuY2llczogc3RyaW5nW10pOiB2b2lkIHtcblx0XHRpZiAoIXRoaXMuZGVwZW5kZW5jaWVzLmhhcyhwYXRoKSkge1xuXHRcdFx0dGhpcy5kZXBlbmRlbmNpZXMuc2V0KHBhdGgsIG5ldyBTZXQoKSk7XG5cdFx0fVxuXHRcdGNvbnN0IGRlcHMgPSB0aGlzLmRlcGVuZGVuY2llcy5nZXQocGF0aCkhO1xuXHRcdGRlcHMuY2xlYXIoKTtcblx0XHRmb3IgKGNvbnN0IGRlcCBvZiBkZXBlbmRlbmNpZXMpIHtcblx0XHRcdGNvbnN0IHJlc29sdmVkRGVwID0gdGhpcy5yZXNvbHZlTW9kdWxlUGF0aChkZXAsIHBhdGgpO1xuXHRcdFx0ZGVwcy5hZGQocmVzb2x2ZWREZXApO1xuXHRcdFx0Ly8gVXBkYXRlIHJldmVyc2UgZGVwZW5kZW5jaWVzXG5cdFx0XHRpZiAoIXRoaXMucmV2ZXJzZURlcGVuZGVuY2llcy5oYXMocmVzb2x2ZWREZXApKSB7XG5cdFx0XHRcdHRoaXMucmV2ZXJzZURlcGVuZGVuY2llcy5zZXQocmVzb2x2ZWREZXAsIG5ldyBTZXQoKSk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLnJldmVyc2VEZXBlbmRlbmNpZXMuZ2V0KHJlc29sdmVkRGVwKSEuYWRkKHBhdGgpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXNvbHZlcyBhIG1vZHVsZSBzcGVjaWZpZXIgdG8gYW4gYWJzb2x1dGUgZmlsZSBwYXRoLlxuXHQgKiBAcGFyYW0gc3BlY2lmaWVyIC0gVGhlIG1vZHVsZSBzcGVjaWZpZXIgc3RyaW5nLlxuXHQgKiBAcGFyYW0gaW1wb3J0ZXJQYXRoIC0gVGhlIHBhdGggb2YgdGhlIGltcG9ydGluZyBtb2R1bGUuXG5cdCAqIEByZXR1cm5zIFRoZSByZXNvbHZlZCBhYnNvbHV0ZSBmaWxlIHBhdGguXG5cdCAqL1xuXHRwcml2YXRlIHJlc29sdmVNb2R1bGVQYXRoKHNwZWNpZmllcjogc3RyaW5nLCBpbXBvcnRlclBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG5cdFx0aWYgKHNwZWNpZmllci5zdGFydHNXaXRoKFwiLlwiKSB8fCBzcGVjaWZpZXIuc3RhcnRzV2l0aChcIi9cIikpIHtcblx0XHRcdC8vIFJlbGF0aXZlIG9yIGFic29sdXRlIHBhdGhcblx0XHRcdGNvbnN0IGltcG9ydGVyRGlyID0gcGF0aC5kaXJuYW1lKGltcG9ydGVyUGF0aCk7XG5cdFx0XHRsZXQgcmVzb2x2ZWRQYXRoID0gcGF0aC5yZXNvbHZlKGltcG9ydGVyRGlyLCBzcGVjaWZpZXIpO1xuXHRcdFx0aWYgKCFyZXNvbHZlZFBhdGguZW5kc1dpdGgoXCIudHNcIikgJiYgIXJlc29sdmVkUGF0aC5lbmRzV2l0aChcIi5qc1wiKSkge1xuXHRcdFx0XHQvLyBBdHRlbXB0IHRvIHJlc29sdmUgd2l0aCAudHMgZXh0ZW5zaW9uXG5cdFx0XHRcdGlmIChEZW5vLmVudi5nZXQoXCJERU5PX0JVSUxEX0VYVEVOU0lPTlNcIikpIHtcblx0XHRcdFx0XHRyZXNvbHZlZFBhdGggKz0gXCIudHNcIjtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXNvbHZlZFBhdGggKz0gXCIuanNcIjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHJlc29sdmVkUGF0aDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gTm9kZSBtb2R1bGVzIG9yIGFsaWFzZXNcblx0XHRcdC8vIFNpbXBsaXN0aWMgbm9kZV9tb2R1bGVzIHJlc29sdXRpb25cblx0XHRcdGNvbnN0IG5vZGVNb2R1bGVzUGF0aCA9IHBhdGgucmVzb2x2ZShcIi4vbm9kZV9tb2R1bGVzXCIsIHNwZWNpZmllcik7XG5cdFx0XHQvLyBBdHRlbXB0IHRvIGZpbmQgaW5kZXgudHMgb3IgaW5kZXguanNcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGlmIChEZW5vLnN0YXRTeW5jKG5vZGVNb2R1bGVzUGF0aCArIFwiLnRzXCIpLmlzRmlsZSkge1xuXHRcdFx0XHRcdHJldHVybiBub2RlTW9kdWxlc1BhdGggKyBcIi50c1wiO1xuXHRcdFx0XHR9IGVsc2UgaWYgKERlbm8uc3RhdFN5bmMobm9kZU1vZHVsZXNQYXRoICsgXCIuanNcIikuaXNGaWxlKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG5vZGVNb2R1bGVzUGF0aCArIFwiLmpzXCI7XG5cdFx0XHRcdH1cblx0XHRcdH0gY2F0Y2gge1xuXHRcdFx0XHQvLyBGaWxlIGRvZXMgbm90IGV4aXN0LCBwcm9jZWVkIHRvIGNoZWNrIGZvciBpbmRleCBmaWxlc1xuXHRcdFx0fVxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Ly8gQXR0ZW1wdCB0byBmaW5kIGluZGV4IGZpbGVzXG5cdFx0XHRcdGlmIChEZW5vLnN0YXRTeW5jKHBhdGguam9pbihub2RlTW9kdWxlc1BhdGgsIFwiaW5kZXgudHNcIikpLmlzRmlsZSkge1xuXHRcdFx0XHRcdHJldHVybiBwYXRoLmpvaW4obm9kZU1vZHVsZXNQYXRoLCBcImluZGV4LnRzXCIpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKFxuXHRcdFx0XHRcdERlbm8uc3RhdFN5bmMocGF0aC5qb2luKG5vZGVNb2R1bGVzUGF0aCwgXCJpbmRleC5qc1wiKSkuaXNGaWxlXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdHJldHVybiBwYXRoLmpvaW4obm9kZU1vZHVsZXNQYXRoLCBcImluZGV4LmpzXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGNhdGNoIHtcblx0XHRcdFx0Ly8gSW5kZXggZmlsZXMgZG8gbm90IGV4aXN0XG5cdFx0XHR9XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdGBDYW5ub3QgcmVzb2x2ZSBtb2R1bGUgJyR7c3BlY2lmaWVyfScgaW1wb3J0ZWQgZnJvbSAnJHtpbXBvcnRlclBhdGh9J2AsXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSB0b3BvbG9naWNhbCBvcmRlciBvZiBtb2R1bGVzIGZvciBidW5kbGluZy5cblx0ICogQHJldHVybnMgQW4gYXJyYXkgb2YgbW9kdWxlIHBhdGhzIGluIHRvcG9sb2dpY2FsIG9yZGVyLlxuXHQgKi9cblx0cHVibGljIGdldFRvcG9sb2dpY2FsT3JkZXIoKTogc3RyaW5nW10ge1xuXHRcdGNvbnN0IHZpc2l0ZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcblx0XHRjb25zdCBvcmRlcjogc3RyaW5nW10gPSBbXTtcblxuXHRcdGNvbnN0IHZpc2l0ID0gKHA6IHN0cmluZykgPT4ge1xuXHRcdFx0aWYgKHZpc2l0ZWQuaGFzKHApKSByZXR1cm47XG5cdFx0XHR2aXNpdGVkLmFkZChwKTtcblxuXHRcdFx0Y29uc3QgZGVwcyA9IHRoaXMuZGVwZW5kZW5jaWVzLmdldChwKSB8fCBuZXcgU2V0KCk7XG5cdFx0XHRmb3IgKGNvbnN0IGRlcCBvZiBkZXBzKSB7XG5cdFx0XHRcdHZpc2l0KGRlcCk7XG5cdFx0XHR9XG5cdFx0XHRvcmRlci5wdXNoKHApO1xuXHRcdH07XG5cblx0XHRmb3IgKGNvbnN0IHAgb2YgdGhpcy5tb2R1bGVzLmtleXMoKSkge1xuXHRcdFx0dmlzaXQocCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG9yZGVyO1xuXHR9XG5cblx0LyoqXG5cdCAqIEFkZHMgYSBtb2R1bGUgYW5kIGl0cyBkZXBlbmRlbmNpZXMgdG8gdGhlIGdyYXBoIHJlY3Vyc2l2ZWx5LlxuXHQgKiBAcGFyYW0gbW9kdWxlIC0gVGhlIE1vZHVsZSBvYmplY3QgdG8gYWRkLlxuXHQgKiBAcGFyYW0gb3B0aW9ucyAtIEFuIG9iamVjdCBjb250YWluaW5nIHRoZSBwYXJzZU1vZHVsZSBmdW5jdGlvbi5cblx0ICovXG5cdHByaXZhdGUgYXN5bmMgYWRkTW9kdWxlKFxuXHRcdG1vZHVsZTogTW9kdWxlSW5mbyxcblx0XHRvcHRpb25zOiB7IHBhcnNlTW9kdWxlOiAocGF0aDogc3RyaW5nKSA9PiBQcm9taXNlPE1vZHVsZUluZm8+IH0sXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMudXBkYXRlTW9kdWxlKG1vZHVsZS5wYXRoLCBtb2R1bGUpO1xuXG5cdFx0Ly8gUHJvY2VzcyBkZXBlbmRlbmNpZXNcblx0XHRmb3IgKGNvbnN0IGRlcCBvZiBtb2R1bGUuZGVwZW5kZW5jaWVzKSB7XG5cdFx0XHRjb25zdCByZXNvbHZlZERlcCA9IHRoaXMucmVzb2x2ZU1vZHVsZVBhdGgoZGVwLCBtb2R1bGUucGF0aCk7XG5cdFx0XHRpZiAoIXRoaXMubW9kdWxlcy5oYXMocmVzb2x2ZWREZXApKSB7XG5cdFx0XHRcdGNvbnN0IGRlcE1vZHVsZSA9IGF3YWl0IG9wdGlvbnMucGFyc2VNb2R1bGUocmVzb2x2ZWREZXApO1xuXHRcdFx0XHRhd2FpdCB0aGlzLmFkZE1vZHVsZShkZXBNb2R1bGUsIG9wdGlvbnMpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgdGhlIGRlcGVuZGVuY2llcyBvZiBhIG1vZHVsZS5cblx0ICogQHBhcmFtIHBhdGggLSBUaGUgbW9kdWxlJ3MgZmlsZSBwYXRoLlxuXHQgKiBAcmV0dXJucyBBIFNldCBvZiBkZXBlbmRlbmN5IG1vZHVsZSBwYXRocy5cblx0ICovXG5cdHB1YmxpYyBnZXREZXBlbmRlbmNpZXMocGF0aDogc3RyaW5nKTogU2V0PHN0cmluZz4ge1xuXHRcdHJldHVybiB0aGlzLmRlcGVuZGVuY2llcy5nZXQocGF0aCkgPz8gbmV3IFNldCgpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUgZGVwZW5kZW50cyBvZiBhIG1vZHVsZS5cblx0ICogQHBhcmFtIHBhdGggLSBUaGUgbW9kdWxlJ3MgZmlsZSBwYXRoLlxuXHQgKiBAcmV0dXJucyBBIFNldCBvZiBkZXBlbmRlbnQgbW9kdWxlIHBhdGhzLlxuXHQgKi9cblx0cHVibGljIGdldERlcGVuZGVudHMocGF0aDogc3RyaW5nKTogU2V0PHN0cmluZz4ge1xuXHRcdHJldHVybiB0aGlzLnJldmVyc2VEZXBlbmRlbmNpZXMuZ2V0KHBhdGgpID8/IG5ldyBTZXQoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVja3MgaWYgdGhlIGRlcGVuZGVuY3kgZ3JhcGggY29udGFpbnMgYW55IGN5Y2xlcy5cblx0ICogQHJldHVybnMgVHJ1ZSBpZiBhIGN5Y2xlIGlzIGRldGVjdGVkLCBvdGhlcndpc2UgZmFsc2UuXG5cdCAqL1xuXHRwdWJsaWMgaGFzQ3ljbGUoKTogYm9vbGVhbiB7XG5cdFx0Y29uc3QgdmlzaXRlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXHRcdGNvbnN0IHJlY3Vyc2lvblN0YWNrID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cblx0XHRjb25zdCBoYXNDeWNsZVV0aWwgPSAocDogc3RyaW5nKTogYm9vbGVhbiA9PiB7XG5cdFx0XHRpZiAoIXZpc2l0ZWQuaGFzKHApKSB7XG5cdFx0XHRcdHZpc2l0ZWQuYWRkKHApO1xuXHRcdFx0XHRyZWN1cnNpb25TdGFjay5hZGQocCk7XG5cblx0XHRcdFx0Y29uc3QgZGVwcyA9IHRoaXMuZGVwZW5kZW5jaWVzLmdldChwKSB8fCBuZXcgU2V0KCk7XG5cdFx0XHRcdGZvciAoY29uc3QgZGVwIG9mIGRlcHMpIHtcblx0XHRcdFx0XHRpZiAoIXZpc2l0ZWQuaGFzKGRlcCkpIHtcblx0XHRcdFx0XHRcdGlmIChoYXNDeWNsZVV0aWwoZGVwKSkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2UgaWYgKHJlY3Vyc2lvblN0YWNrLmhhcyhkZXApKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJlY3Vyc2lvblN0YWNrLmRlbGV0ZShwKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9O1xuXG5cdFx0Zm9yIChjb25zdCBwIG9mIHRoaXMubW9kdWxlcy5rZXlzKCkpIHtcblx0XHRcdGlmIChoYXNDeWNsZVV0aWwocCkpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgYWxsIGNvbm5lY3RlZCBjb21wb25lbnRzIHdpdGhpbiB0aGUgZGVwZW5kZW5jeSBncmFwaC5cblx0ICogQHJldHVybnMgQW4gYXJyYXkgb2YgU2V0cywgZWFjaCByZXByZXNlbnRpbmcgYSBjb25uZWN0ZWQgY29tcG9uZW50LlxuXHQgKi9cblx0cHVibGljIGdldENvbm5lY3RlZENvbXBvbmVudHMoKTogU2V0PHN0cmluZz5bXSB7XG5cdFx0Y29uc3QgdmlzaXRlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXHRcdGNvbnN0IGNvbXBvbmVudHM6IFNldDxzdHJpbmc+W10gPSBbXTtcblxuXHRcdGNvbnN0IGRmcyA9IChwOiBzdHJpbmcsIGNvbXBvbmVudDogU2V0PHN0cmluZz4pID0+IHtcblx0XHRcdGlmICh2aXNpdGVkLmhhcyhwKSkgcmV0dXJuO1xuXHRcdFx0dmlzaXRlZC5hZGQocCk7XG5cdFx0XHRjb21wb25lbnQuYWRkKHApO1xuXG5cdFx0XHQvLyBWaXNpdCBkZXBlbmRlbmNpZXNcblx0XHRcdGNvbnN0IGRlcHMgPSB0aGlzLmdldERlcGVuZGVuY2llcyhwKTtcblx0XHRcdGZvciAoY29uc3QgZGVwIG9mIGRlcHMpIHtcblx0XHRcdFx0ZGZzKGRlcCwgY29tcG9uZW50KTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gVmlzaXQgZGVwZW5kZW50c1xuXHRcdFx0Y29uc3QgZGVwZW50cyA9IHRoaXMuZ2V0RGVwZW5kZW50cyhwKTtcblx0XHRcdGZvciAoY29uc3QgZGVwZW5kZW50IG9mIGRlcGVudHMpIHtcblx0XHRcdFx0ZGZzKGRlcGVuZGVudCwgY29tcG9uZW50KTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Zm9yIChjb25zdCBwIG9mIHRoaXMubW9kdWxlcy5rZXlzKCkpIHtcblx0XHRcdGlmICghdmlzaXRlZC5oYXMocCkpIHtcblx0XHRcdFx0Y29uc3QgY29tcG9uZW50ID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cdFx0XHRcdGRmcyhwLCBjb21wb25lbnQpO1xuXHRcdFx0XHRjb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gY29tcG9uZW50cztcblx0fVxuXG5cdC8qKlxuXHQgKiBPcHRpbWl6ZXMgdGhlIGRlcGVuZGVuY3kgZ3JhcGggYnkgcmVtb3ZpbmcgdW51c2VkIG1vZHVsZXMsIG1lcmdpbmcgbW9kdWxlcywgYW5kIHNvcnRpbmcgdGhlbS5cblx0ICovXG5cdHB1YmxpYyBvcHRpbWl6ZUdyYXBoKCk6IHZvaWQge1xuXHRcdC8vIFJlbW92ZSB1bnVzZWQgbW9kdWxlc1xuXHRcdHRoaXMucmVtb3ZlVW51c2VkTW9kdWxlcygpO1xuXG5cdFx0Ly8gTWVyZ2UgbW9kdWxlcyBpZiBwb3NzaWJsZVxuXHRcdHRoaXMubWVyZ2VNb2R1bGVzKCk7XG5cblx0XHQvLyBPcHRpbWl6ZSBtb2R1bGUgb3JkZXJcblx0XHR0aGlzLm9wdGltaXplTW9kdWxlT3JkZXIoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIG1vZHVsZXMgdGhhdCBhcmUgbm90IHJlYWNoYWJsZSBmcm9tIGFueSBlbnRyeSBwb2ludHMuXG5cdCAqL1xuXHRwcml2YXRlIHJlbW92ZVVudXNlZE1vZHVsZXMoKTogdm9pZCB7XG5cdFx0Y29uc3QgcmVhY2hhYmxlID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cblx0XHRjb25zdCB2aXNpdCA9IChwOiBzdHJpbmcpID0+IHtcblx0XHRcdGlmIChyZWFjaGFibGUuaGFzKHApKSByZXR1cm47XG5cdFx0XHRyZWFjaGFibGUuYWRkKHApO1xuXG5cdFx0XHRjb25zdCBkZXBzID0gdGhpcy5nZXREZXBlbmRlbmNpZXMocCk7XG5cdFx0XHRmb3IgKGNvbnN0IGQgb2YgZGVwcykge1xuXHRcdFx0XHR2aXNpdChkKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gU3RhcnQgZnJvbSBlbnRyeSBwb2ludHMgKG1vZHVsZXMgd2l0aCBubyBkZXBlbmRlbnRzKVxuXHRcdGNvbnN0IGVudHJ5UG9pbnRzID0gQXJyYXkuZnJvbSh0aGlzLm1vZHVsZXMua2V5cygpKS5maWx0ZXIoXG5cdFx0XHQoeCkgPT4gIXRoaXMuZ2V0RGVwZW5kZW50cyh4KS5zaXplLFxuXHRcdCk7XG5cblx0XHRmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJ5UG9pbnRzKSB7XG5cdFx0XHR2aXNpdChlbnRyeSk7XG5cdFx0fVxuXG5cdFx0Ly8gUmVtb3ZlIHVucmVhY2hhYmxlIG1vZHVsZXNcblx0XHRmb3IgKGNvbnN0IHAgb2YgQXJyYXkuZnJvbSh0aGlzLm1vZHVsZXMua2V5cygpKSkge1xuXHRcdFx0aWYgKCFyZWFjaGFibGUuaGFzKHApKSB7XG5cdFx0XHRcdHRoaXMucmVtb3ZlTW9kdWxlKHApO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBJZGVudGlmaWVzIGFuZCBtZXJnZXMgbW9kdWxlcyB0aGF0IGFyZSBzdWl0YWJsZSBjYW5kaWRhdGVzIGZvciBtZXJnaW5nLlxuXHQgKiBAcmV0dXJucyBBbiBhcnJheSBvZiB0dXBsZXMgd2hlcmUgZWFjaCB0dXBsZSBjb250YWlucyB0aGUgc291cmNlIGFuZCB0YXJnZXQgbW9kdWxlIHBhdGhzLlxuXHQgKi9cblx0cHJpdmF0ZSBmaW5kTWVyZ2VDYW5kaWRhdGVzKCk6IFtzdHJpbmcsIHN0cmluZ11bXSB7XG5cdFx0Y29uc3QgY2FuZGlkYXRlczogW3N0cmluZywgc3RyaW5nXVtdID0gW107XG5cdFx0Zm9yIChjb25zdCBbcGF0aF0gb2YgdGhpcy5tb2R1bGVzLmVudHJpZXMoKSkge1xuXHRcdFx0Y29uc3QgZGVwcyA9IHRoaXMuZ2V0RGVwZW5kZW5jaWVzKHBhdGgpO1xuXHRcdFx0aWYgKGRlcHMuc2l6ZSA9PT0gMSkge1xuXHRcdFx0XHRjb25zdCBbZGVwXSA9IEFycmF5LmZyb20oZGVwcyk7XG5cdFx0XHRcdGNvbnN0IGRlcGVudHMgPSB0aGlzLmdldERlcGVuZGVudHMoZGVwKTtcblx0XHRcdFx0aWYgKGRlcGVudHMuc2l6ZSA9PT0gMSkge1xuXHRcdFx0XHRcdGNhbmRpZGF0ZXMucHVzaChbcGF0aCwgZGVwXSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGNhbmRpZGF0ZXM7XG5cdH1cblxuXHQvKipcblx0ICogTWVyZ2VzIGEgcGFpciBvZiBtb2R1bGVzIGludG8gYSBzaW5nbGUgbW9kdWxlLlxuXHQgKiBAcGFyYW0gc291cmNlIC0gVGhlIHNvdXJjZSBtb2R1bGUgcGF0aCB0byBiZSBtZXJnZWQgaW50byB0aGUgdGFyZ2V0LlxuXHQgKiBAcGFyYW0gdGFyZ2V0IC0gVGhlIHRhcmdldCBtb2R1bGUgcGF0aCB0aGF0IHdpbGwgYWJzb3JiIHRoZSBzb3VyY2UgbW9kdWxlLlxuXHQgKi9cblx0cHJpdmF0ZSBtZXJnZU1vZHVsZVBhaXIoc291cmNlOiBzdHJpbmcsIHRhcmdldDogc3RyaW5nKTogdm9pZCB7XG5cdFx0Y29uc3Qgc291cmNlTW9kdWxlID0gdGhpcy5nZXRNb2R1bGUoc291cmNlKTtcblx0XHRjb25zdCB0YXJnZXRNb2R1bGUgPSB0aGlzLmdldE1vZHVsZSh0YXJnZXQpO1xuXHRcdGlmICghc291cmNlTW9kdWxlIHx8ICF0YXJnZXRNb2R1bGUpIHJldHVybjtcblxuXHRcdC8vIENyZWF0ZSBzb3VyY2UgZmlsZSBBU1RzXG5cdFx0Y29uc3Qgc291cmNlRmlsZSA9IHRzLmNyZWF0ZVNvdXJjZUZpbGUoXG5cdFx0XHRzb3VyY2UsXG5cdFx0XHRzb3VyY2VNb2R1bGUuY29kZSxcblx0XHRcdHRzLlNjcmlwdFRhcmdldC5MYXRlc3QsXG5cdFx0XHR0cnVlLFxuXHRcdCk7XG5cblx0XHRjb25zdCB0YXJnZXRGaWxlID0gdHMuY3JlYXRlU291cmNlRmlsZShcblx0XHRcdHRhcmdldCxcblx0XHRcdHRhcmdldE1vZHVsZS5jb2RlLFxuXHRcdFx0dHMuU2NyaXB0VGFyZ2V0LkxhdGVzdCxcblx0XHRcdHRydWUsXG5cdFx0KTtcblxuXHRcdC8vIE1lcmdlIHRoZSBBU1RzIGJ5IGNvbWJpbmluZyB0aGVpciBzdGF0ZW1lbnRzXG5cdFx0Y29uc3QgbWVyZ2VkU3RhdGVtZW50cyA9IFtcblx0XHRcdC4uLnRoaXMuZ2V0TW9kdWxlU3RhdGVtZW50cyh0YXJnZXRGaWxlKSxcblx0XHRcdC4uLnRoaXMuZ2V0TW9kdWxlU3RhdGVtZW50cyhzb3VyY2VGaWxlKSxcblx0XHRdO1xuXG5cdFx0Ly8gR2VuZXJhdGUgbWVyZ2VkIGNvZGUgZnJvbSBzdGF0ZW1lbnRzXG5cdFx0Y29uc3QgcHJpbnRlciA9IHRzLmNyZWF0ZVByaW50ZXIoKTtcblx0XHRjb25zdCBtZXJnZWRDb2RlID0gbWVyZ2VkU3RhdGVtZW50c1xuXHRcdFx0Lm1hcCgoc3RtdCkgPT5cblx0XHRcdFx0cHJpbnRlci5wcmludE5vZGUodHMuRW1pdEhpbnQuVW5zcGVjaWZpZWQsIHN0bXQsIHRhcmdldEZpbGUpXG5cdFx0XHQpXG5cdFx0XHQuam9pbihcIlxcblwiKTtcblxuXHRcdC8vIENyZWF0ZSBtZXJnZWQgbW9kdWxlXG5cdFx0Y29uc3QgbWVyZ2VkTW9kdWxlOiBNb2R1bGVJbmZvID0ge1xuXHRcdFx0cGF0aDogdGFyZ2V0LFxuXHRcdFx0Y29kZTogbWVyZ2VkQ29kZSxcblx0XHRcdGRlcGVuZGVuY2llczogQXJyYXkuZnJvbShcblx0XHRcdFx0bmV3IFNldChbLi4udGFyZ2V0TW9kdWxlLmRlcGVuZGVuY2llcywgLi4uc291cmNlTW9kdWxlLmRlcGVuZGVuY2llc10pLFxuXHRcdFx0KSxcblx0XHRcdGFzdDogdGFyZ2V0RmlsZSxcblx0XHR9O1xuXG5cdFx0Ly8gVXBkYXRlIGdyYXBoXG5cdFx0dGhpcy51cGRhdGVNb2R1bGUodGFyZ2V0LCBtZXJnZWRNb2R1bGUpO1xuXHRcdHRoaXMucmVtb3ZlTW9kdWxlKHNvdXJjZSk7XG5cdH1cblxuXHQvKipcblx0ICogSGVscGVyIHRvIGdldCBzdGF0ZW1lbnRzIGZyb20gYSBzb3VyY2UgZmlsZVxuXHQgKi9cblx0cHJpdmF0ZSBnZXRNb2R1bGVTdGF0ZW1lbnRzKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiB0cy5TdGF0ZW1lbnRbXSB7XG5cdFx0cmV0dXJuIEFycmF5LmZyb20oc291cmNlRmlsZS5zdGF0ZW1lbnRzKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBNZXJnZXMgYWxsIGNhbmRpZGF0ZSBtb2R1bGUgcGFpcnMuXG5cdCAqL1xuXHRwcml2YXRlIG1lcmdlTW9kdWxlcygpOiB2b2lkIHtcblx0XHRjb25zdCBjYW5kaWRhdGVzID0gdGhpcy5maW5kTWVyZ2VDYW5kaWRhdGVzKCk7XG5cdFx0Zm9yIChjb25zdCBbc291cmNlLCB0YXJnZXRdIG9mIGNhbmRpZGF0ZXMpIHtcblx0XHRcdHRoaXMubWVyZ2VNb2R1bGVQYWlyKHNvdXJjZSwgdGFyZ2V0KTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogT3B0aW1pemVzIHRoZSBvcmRlciBvZiBtb2R1bGVzIGJhc2VkIG9uIHRoZWlyIGRlcGVuZGVuY2llcyBhbmQgY2FsY3VsYXRlZCB3ZWlnaHRzLlxuXHQgKi9cblx0cHJpdmF0ZSBvcHRpbWl6ZU1vZHVsZU9yZGVyKCk6IHZvaWQge1xuXHRcdGNvbnN0IG9yZGVyID0gdGhpcy5nZXRUb3BvbG9naWNhbE9yZGVyKCk7XG5cdFx0Y29uc3Qgb3B0aW1pemVkTW9kdWxlcyA9IG5ldyBNYXA8c3RyaW5nLCBNb2R1bGVJbmZvPigpO1xuXG5cdFx0Ly8gU29ydCB0aGUgbW9kdWxlcyBieSB0aGVpciBUeXBlU2NyaXB0IEFTVCBub2RlIGNvdW50IGZvciBvcHRpbWFsIGxvYWRpbmdcblx0XHRjb25zdCBtb2R1bGVXZWlnaHRzID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcblx0XHRmb3IgKGNvbnN0IHBhdGggb2Ygb3JkZXIpIHtcblx0XHRcdGNvbnN0IG1vZHVsZSA9IHRoaXMubW9kdWxlcy5nZXQocGF0aCk7XG5cdFx0XHRpZiAobW9kdWxlPy5hc3QpIHtcblx0XHRcdFx0Y29uc3QgYXN0ID0gbW9kdWxlLmFzdCBhcyB0cy5Tb3VyY2VGaWxlO1xuXHRcdFx0XHRpZiAodHMuaXNTb3VyY2VGaWxlKGFzdCkpIHtcblx0XHRcdFx0XHRsZXQgbm9kZUNvdW50ID0gMDtcblx0XHRcdFx0XHRjb25zdCB2aXNpdG9yOiB0cy5WaXNpdG9yID0gKFxuXHRcdFx0XHRcdFx0bm9kZTogdHMuTm9kZSxcblx0XHRcdFx0XHQpOiB0cy5WaXNpdFJlc3VsdDx0cy5Ob2RlPiA9PiB7XG5cdFx0XHRcdFx0XHRub2RlQ291bnQrKztcblx0XHRcdFx0XHRcdHJldHVybiBub2RlO1xuXHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0dHMuZm9yRWFjaENoaWxkKGFzdCwgdmlzaXRvcik7XG5cdFx0XHRcdFx0bW9kdWxlV2VpZ2h0cy5zZXQocGF0aCwgbm9kZUNvdW50KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFNvcnQgYnkgd2VpZ2h0cyBhbmQgY3JlYXRlIHRoZSBvcHRpbWl6ZWQgbW9kdWxlIG1hcFxuXHRcdGNvbnN0IHNvcnRlZFBhdGhzID0gb3JkZXIuc29ydCgoYSwgYikgPT5cblx0XHRcdChtb2R1bGVXZWlnaHRzLmdldChiKSB8fCAwKSAtIChtb2R1bGVXZWlnaHRzLmdldChhKSB8fCAwKVxuXHRcdCk7XG5cblx0XHRmb3IgKGNvbnN0IHBhdGggb2Ygc29ydGVkUGF0aHMpIHtcblx0XHRcdGNvbnN0IG1vZHVsZSA9IHRoaXMubW9kdWxlcy5nZXQocGF0aCk7XG5cdFx0XHRpZiAobW9kdWxlKSB7XG5cdFx0XHRcdG9wdGltaXplZE1vZHVsZXMuc2V0KHBhdGgsIG1vZHVsZSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5tb2R1bGVzID0gb3B0aW1pemVkTW9kdWxlcztcblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxjdWxhdGVzIHRoZSB3ZWlnaHQgb2YgYSBtb2R1bGUgYmFzZWQgb24gdmFyaW91cyBmYWN0b3JzIHRvIGRldGVybWluZSBidW5kbGluZyBvcmRlci5cblx0ICogQHBhcmFtIHBhdGggLSBUaGUgbW9kdWxlJ3MgZmlsZSBwYXRoLlxuXHQgKiBAcmV0dXJucyBUaGUgY2FsY3VsYXRlZCB3ZWlnaHQgYXMgYSBudW1iZXIuXG5cdCAqL1xuXHRwcml2YXRlIGNhbGN1bGF0ZU1vZHVsZVdlaWdodChwYXRoOiBzdHJpbmcpOiBudW1iZXIge1xuXHRcdGNvbnN0IG1vZCA9IHRoaXMuZ2V0TW9kdWxlKHBhdGgpO1xuXHRcdGlmICghbW9kKSByZXR1cm4gMDtcblx0XHQvLyBFeGFtcGxlIHdlaWdodCBjYWxjdWxhdGlvblxuXHRcdGNvbnN0IHNpemVXZWlnaHQgPSBtb2QuY29kZS5sZW5ndGggKiAwLjU7XG5cdFx0Y29uc3QgZGVwV2VpZ2h0ID0gdGhpcy5nZXREZXBlbmRlbmNpZXMocGF0aCkuc2l6ZSAqIDEwMDtcblx0XHRjb25zdCBkZXBFbmRXZWlnaHQgPSB0aGlzLmdldERlcGVuZGVudHMocGF0aCkuc2l6ZSAqIDE1MDtcblx0XHRjb25zdCBjcml0aWNhbFBhdGhXZWlnaHQgPSB0aGlzLmNhbGN1bGF0ZUNyaXRpY2FsUGF0aERlcHRoKHBhdGgpICogMjAwO1xuXG5cdFx0cmV0dXJuIHNpemVXZWlnaHQgKyBkZXBXZWlnaHQgKyBkZXBFbmRXZWlnaHQgKyBjcml0aWNhbFBhdGhXZWlnaHQ7XG5cdH1cblxuXHQvKipcblx0ICogUmVjdXJzaXZlbHkgY2FsY3VsYXRlcyB0aGUgY3JpdGljYWwgcGF0aCBkZXB0aCBvZiBhIG1vZHVsZSBpbiB0aGUgZGVwZW5kZW5jeSBncmFwaC5cblx0ICogQHBhcmFtIHBhdGggLSBUaGUgbW9kdWxlJ3MgZmlsZSBwYXRoLlxuXHQgKiBAcGFyYW0gdmlzaXRlZCAtIEEgc2V0IHRvIHRyYWNrIHZpc2l0ZWQgbW9kdWxlcyB0byBhdm9pZCBpbmZpbml0ZSByZWN1cnNpb24uXG5cdCAqIEByZXR1cm5zIFRoZSBkZXB0aCBhcyBhIG51bWJlci5cblx0ICovXG5cdHByaXZhdGUgY2FsY3VsYXRlQ3JpdGljYWxQYXRoRGVwdGgoXG5cdFx0cGF0aDogc3RyaW5nLFxuXHRcdHZpc2l0ZWQ6IFNldDxzdHJpbmc+ID0gbmV3IFNldCgpLFxuXHQpOiBudW1iZXIge1xuXHRcdGlmICh2aXNpdGVkLmhhcyhwYXRoKSkgcmV0dXJuIDA7XG5cdFx0dmlzaXRlZC5hZGQocGF0aCk7XG5cblx0XHRjb25zdCBkZXBzID0gdGhpcy5nZXREZXBlbmRlbmNpZXMocGF0aCk7XG5cdFx0aWYgKGRlcHMuc2l6ZSA9PT0gMCkgcmV0dXJuIDE7XG5cblx0XHRsZXQgbWF4RGVwdGggPSAwO1xuXHRcdGZvciAoY29uc3QgZGVwIG9mIGRlcHMpIHtcblx0XHRcdGNvbnN0IGRlcHRoID0gdGhpcy5jYWxjdWxhdGVDcml0aWNhbFBhdGhEZXB0aChkZXAsIHZpc2l0ZWQpO1xuXHRcdFx0aWYgKGRlcHRoID4gbWF4RGVwdGgpIHtcblx0XHRcdFx0bWF4RGVwdGggPSBkZXB0aDtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG1heERlcHRoICsgMTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGEgbW9kdWxlIGZyb20gdGhlIGRlcGVuZGVuY3kgZ3JhcGguXG5cdCAqIEBwYXJhbSBwYXRoIC0gVGhlIG1vZHVsZSdzIGZpbGUgcGF0aCB0byByZW1vdmUuXG5cdCAqL1xuXHRwcml2YXRlIHJlbW92ZU1vZHVsZShwYXRoOiBzdHJpbmcpOiB2b2lkIHtcblx0XHR0aGlzLm1vZHVsZXMuZGVsZXRlKHBhdGgpO1xuXHRcdHRoaXMuZGVwZW5kZW5jaWVzLmRlbGV0ZShwYXRoKTtcblxuXHRcdGZvciAoY29uc3QgZGVwcyBvZiB0aGlzLmRlcGVuZGVuY2llcy52YWx1ZXMoKSkge1xuXHRcdFx0ZGVwcy5kZWxldGUocGF0aCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5yZXZlcnNlRGVwZW5kZW5jaWVzLmRlbGV0ZShwYXRoKTtcblx0XHRmb3IgKGNvbnN0IGRlcGVudHMgb2YgdGhpcy5yZXZlcnNlRGVwZW5kZW5jaWVzLnZhbHVlcygpKSB7XG5cdFx0XHRkZXBlbnRzLmRlbGV0ZShwYXRoKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogU2VyaWFsaXplcyB0aGUgZGVwZW5kZW5jeSBncmFwaCB0byBhIEpTT04gc3RyaW5nLlxuXHQgKiBAcmV0dXJucyBUaGUgc2VyaWFsaXplZCBkZXBlbmRlbmN5IGdyYXBoLlxuXHQgKi9cblx0cHVibGljIHRvSlNPTigpOiBzdHJpbmcge1xuXHRcdHJldHVybiBKU09OLnN0cmluZ2lmeShcblx0XHRcdHtcblx0XHRcdFx0bW9kdWxlczogQXJyYXkuZnJvbSh0aGlzLm1vZHVsZXMuZW50cmllcygpKSxcblx0XHRcdFx0ZGVwZW5kZW5jaWVzOiBBcnJheS5mcm9tKHRoaXMuZGVwZW5kZW5jaWVzLmVudHJpZXMoKSkubWFwKChbaywgdl0pID0+IFtcblx0XHRcdFx0XHRrLFxuXHRcdFx0XHRcdEFycmF5LmZyb20odiksXG5cdFx0XHRcdF0pLFxuXHRcdFx0XHRkZXBlbmRlbnRzOiBBcnJheS5mcm9tKHRoaXMucmV2ZXJzZURlcGVuZGVuY2llcy5lbnRyaWVzKCkpLm1hcCgoXG5cdFx0XHRcdFx0W2ssIHZdLFxuXHRcdFx0XHQpID0+IFtcblx0XHRcdFx0XHRrLFxuXHRcdFx0XHRcdEFycmF5LmZyb20odiksXG5cdFx0XHRcdF0pLFxuXHRcdFx0fSxcblx0XHRcdG51bGwsXG5cdFx0XHQyLFxuXHRcdCk7XG5cdH1cblxuXHQvKipcblx0ICogRGVzZXJpYWxpemVzIGEgSlNPTiBzdHJpbmcgdG8gcmVjb25zdHJ1Y3QgYSBEZXBlbmRlbmN5R3JhcGggaW5zdGFuY2UuXG5cdCAqIEBwYXJhbSBqc29uIC0gVGhlIEpTT04gc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgZGVwZW5kZW5jeSBncmFwaC5cblx0ICogQHJldHVybnMgVGhlIHJlY29uc3RydWN0ZWQgRGVwZW5kZW5jeUdyYXBoIGluc3RhbmNlLlxuXHQgKi9cblx0cHVibGljIHN0YXRpYyBmcm9tSlNPTihqc29uOiBzdHJpbmcpOiBEZXBlbmRlbmN5R3JhcGgge1xuXHRcdGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKGpzb24pO1xuXHRcdGNvbnN0IGdyYXBoID0gbmV3IERlcGVuZGVuY3lHcmFwaCgpO1xuXG5cdFx0Ly8gUmVzdG9yZSBtb2R1bGVzXG5cdFx0Z3JhcGgubW9kdWxlcyA9IG5ldyBNYXA8c3RyaW5nLCBNb2R1bGVJbmZvPihkYXRhLm1vZHVsZXMpO1xuXG5cdFx0Ly8gUmVzdG9yZSBkZXBlbmRlbmNpZXNcblx0XHRncmFwaC5kZXBlbmRlbmNpZXMgPSBuZXcgTWFwPHN0cmluZywgU2V0PHN0cmluZz4+KFxuXHRcdFx0ZGF0YS5kZXBlbmRlbmNpZXMubWFwKChba2V5LCB2YWx1ZXNdOiBbc3RyaW5nLCBzdHJpbmdbXV0pID0+IFtcblx0XHRcdFx0a2V5LFxuXHRcdFx0XHRuZXcgU2V0KHZhbHVlcyksXG5cdFx0XHRdKSxcblx0XHQpO1xuXG5cdFx0Ly8gUmVzdG9yZSBkZXBlbmRlbnRzXG5cdFx0Z3JhcGgucmV2ZXJzZURlcGVuZGVuY2llcyA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4oXG5cdFx0XHRkYXRhLmRlcGVuZGVudHMubWFwKChba2V5LCB2YWx1ZXNdOiBbc3RyaW5nLCBzdHJpbmdbXV0pID0+IFtcblx0XHRcdFx0a2V5LFxuXHRcdFx0XHRuZXcgU2V0KHZhbHVlcyksXG5cdFx0XHRdKSxcblx0XHQpO1xuXG5cdFx0Ly8gVmFsaWRhdGVcblx0XHRpZiAoZ3JhcGguaGFzQ3ljbGUoKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiUmVzdG9yZWQgZGVwZW5kZW5jeSBncmFwaCBjb250YWlucyBjeWNsZXNcIik7XG5cdFx0fVxuXG5cdFx0Ly8gVmVyaWZ5IHJlZmVyZW5jZXNcblx0XHRmb3IgKGNvbnN0IFttb2R1bGVQYXRoLCBkZXBzXSBvZiBncmFwaC5kZXBlbmRlbmNpZXMpIHtcblx0XHRcdGlmICghZ3JhcGgubW9kdWxlcy5oYXMobW9kdWxlUGF0aCkpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHRcdGBJbnZhbGlkIG1vZHVsZSByZWZlcmVuY2UgaW4gZGVwZW5kZW5jaWVzOiAke21vZHVsZVBhdGh9YCxcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdGZvciAoY29uc3QgZGVwIG9mIGRlcHMpIHtcblx0XHRcdFx0aWYgKCFncmFwaC5tb2R1bGVzLmhhcyhkZXApKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHRcdFx0YEludmFsaWQgZGVwZW5kZW5jeSByZWZlcmVuY2U6ICR7ZGVwfSBpbiBtb2R1bGUgJHttb2R1bGVQYXRofWAsXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBncmFwaDtcblx0fVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLG9DQUFvQztBQUVwQyxZQUFZLFVBQVUsNENBQTRDO0FBQ2xFLFNBQVMsRUFBRSxRQUFRLDZDQUE2QztBQUVoRTs7Q0FFQyxHQUNELE9BQU8sTUFBTTtFQUNKLFVBQVUsSUFBSSxNQUEwQjtFQUN4QyxlQUFlLElBQUksTUFBMkI7RUFDOUMsc0JBQXNCLElBQUksTUFBMkI7RUFDdEQsY0FBd0IsRUFBRSxDQUFDO0VBRWxDOztFQUVDLEdBQ0QsSUFBVyxPQUFlO0lBQ3pCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJO0VBQ3pCO0VBRUE7Ozs7RUFJQyxHQUNELE1BQWEsTUFDWixXQUF1QixFQUN2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
// denoCacheMetadata=16436126033709252959,15483436806726364440