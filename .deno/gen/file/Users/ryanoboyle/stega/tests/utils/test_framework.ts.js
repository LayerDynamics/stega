// tests/utils/test_framework.ts
import { CLI } from "../../src/core.ts";
/**
 * Comprehensive test framework for Stega CLI testing
 */ export class TestFramework {
  tempFiles = [];
  tempDirs = [];
  mocks = new Map();
  cli;
  logger;
  constructor(){
    this.logger = new MockLogger();
    this.cli = new CLI(undefined, true, true, this.logger);
  }
  /**
	 * Creates an isolated test environment
	 */ async createTestEnvironment() {
    const baseDir = await Deno.makeTempDir();
    this.tempDirs.push(baseDir);
    return new TestEnvironment(baseDir, this);
  }
  /**
	 * Creates a file with given content for testing
	 */ async createTempFile(content, extension = ".txt") {
    const filePath = await Deno.makeTempFile({
      suffix: extension
    });
    await Deno.writeTextFile(filePath, content);
    this.tempFiles.push(filePath);
    return filePath;
  }
  /**
	 * Registers a mock for a specific dependency
	 */ registerMock(identifier, mock) {
    this.mocks.set(identifier, mock);
  }
  /**
	 * Retrieves a registered mock
	 */ getMock(identifier) {
    const mock = this.mocks.get(identifier);
    if (!mock) {
      throw new Error(`Mock not found: ${identifier}`);
    }
    return mock;
  }
  /**
	 * Verifies if a command exists
	 */ hasCommand(name) {
    const cli = this.getCLI();
    // @ts-ignore - Accessing private registry for testing
    const registry = cli["registry"];
    const exists = registry.findCommand(name) !== undefined;
    this.logger.debug(`Command "${name}" ${exists ? "exists" : "not found"} in registry`);
    if (!exists) {
      const commands = registry.getCommands().map((cmd)=>cmd.name);
      this.logger.debug(`Available commands: ${commands.join(", ")}`);
    }
    return exists;
  }
  /**
	 * Lists all registered commands
	 */ getRegisteredCommands() {
    const cli = this.getCLI();
    // @ts-ignore - Accessing private registry for testing
    const registry = cli["registry"];
    const commands = registry.getCommands().map((cmd)=>cmd.name);
    this.logger.debug(`Registered commands: ${commands.join(", ")}`);
    return commands;
  }
  /**
	 * Waits for command registration to complete
	 */ async waitForCLIReady() {
    await this.cli.waitForReady();
  }
  /**
	 * Executes a command in the test environment
	 */ async executeCommand(args) {
    // Wait for CLI to be ready before executing commands
    await this.waitForCLIReady();
    const startTime = performance.now();
    let error;
    this.logger.debug(`Executing command: ${args.join(" ")}`);
    const preCommands = this.getRegisteredCommands();
    this.logger.debug(`Available commands before execution: ${preCommands.join(", ")}`);
    try {
      await this.cli.runCommand(args);
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));
      this.logger.debug(`Command execution failed: ${error.message}`);
    }
    const endTime = performance.now();
    const postCommands = this.getRegisteredCommands();
    this.logger.debug(`Available commands after execution: ${postCommands.join(", ")}`);
    const result = {
      duration: endTime - startTime,
      success: !error,
      error,
      logs: this.logger.getLogs(),
      errors: this.logger.getErrors()
    };
    this.logger.debug(`Command result: ${JSON.stringify(result)}`);
    return result;
  }
  /**
	 * Measures performance of a specific operation
	 */ async measurePerformance(operation, iterations = 1) {
    const durations = [];
    const memoryUsage = [];
    for(let i = 0; i < iterations; i++){
      const startMemory = Deno.memoryUsage().heapUsed;
      const startTime = performance.now();
      await operation();
      const endTime = performance.now();
      const endMemory = Deno.memoryUsage().heapUsed;
      durations.push(endTime - startTime);
      memoryUsage.push(endMemory - startMemory);
    }
    return {
      averageDuration: durations.reduce((a, b)=>a + b, 0) / iterations,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      averageMemoryUsage: memoryUsage.reduce((a, b)=>a + b, 0) / iterations,
      peakMemoryUsage: Math.max(...memoryUsage)
    };
  }
  /**
	 * Cleans up all test resources
	 */ async cleanup() {
    for (const file of this.tempFiles){
      try {
        await Deno.remove(file);
      } catch (error) {
        console.warn(`Failed to remove temp file ${file}:`, error);
      }
    }
    for (const dir of this.tempDirs){
      try {
        await Deno.remove(dir, {
          recursive: true
        });
      } catch (error) {
        console.warn(`Failed to remove temp directory ${dir}:`, error);
      }
    }
    this.tempFiles = [];
    this.tempDirs = [];
    this.mocks.clear();
  }
  /**
	 * Gets the CLI instance
	 */ getCLI() {
    return this.cli;
  }
  /**
	 * Gets the logger instance
	 */ getLogger() {
    return this.logger;
  }
}
/**
 * Represents an isolated test environment
 */ export class TestEnvironment {
  baseDir;
  framework;
  constructor(baseDir, framework){
    this.baseDir = baseDir;
    this.framework = framework;
  }
  /**
	 * Creates a file within the test environment
	 */ async createFile(relativePath, content) {
    const fullPath = `${this.baseDir}/${relativePath}`;
    await Deno.mkdir(new URL(".", "file://" + fullPath).pathname, {
      recursive: true
    });
    await Deno.writeTextFile(fullPath, content);
    return fullPath;
  }
  /**
	 * Reads a file from the test environment
	 */ async readFile(relativePath) {
    return await Deno.readTextFile(`${this.baseDir}/${relativePath}`);
  }
  /**
	 * Gets the base directory of the test environment
	 */ getBaseDir() {
    return this.baseDir;
  }
  /**
	 * Resolves a path relative to the source directory
	 */ resolveSrcPath(path) {
    return new URL(`../../src/${path}`, import.meta.url).pathname;
  }
  /**
	 * Creates a plugin file with correct import paths
	 */ async createPluginFile(name, content) {
    const corePath = this.resolveSrcPath("core.ts");
    const pluginPath = this.resolveSrcPath("plugin.ts");
    const pluginContent = content.replace("../../src/core.ts", corePath).replace("../../src/plugin.ts", pluginPath);
    return await this.createFile(name, pluginContent);
  }
  /**
	 * Cleans up the test environment
	 */ async cleanup() {
    try {
      await Deno.remove(this.baseDir, {
        recursive: true
      });
    } catch (error) {
      console.warn(`Failed to cleanup test environment at ${this.baseDir}:`, error);
    }
  }
}
/**
 * Mock logger for testing
 */ export class MockLogger {
  logs = [];
  errors = [];
  debugs = [];
  warns = [];
  info(message) {
    this.logs.push(message);
  }
  error(message) {
    this.errors.push(message);
  }
  debug(message) {
    this.debugs.push(message);
  }
  warn(message) {
    this.warns.push(message);
  }
  getLogs() {
    return [
      ...this.logs
    ];
  }
  getErrors() {
    return [
      ...this.errors
    ];
  }
  getDebugs() {
    return [
      ...this.debugs
    ];
  }
  getWarns() {
    return [
      ...this.warns
    ];
  }
  clear() {
    this.logs = [];
    this.errors = [];
    this.debugs = [];
    this.warns = [];
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy91dGlscy90ZXN0X2ZyYW1ld29yay50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0ZXN0cy91dGlscy90ZXN0X2ZyYW1ld29yay50c1xuaW1wb3J0IHsgQ0xJIH0gZnJvbSBcIi4uLy4uL3NyYy9jb3JlLnRzXCI7XG5pbXBvcnQgeyBDb21tYW5kLCBDb21tYW5kUmVnaXN0cnkgfSBmcm9tIFwiLi4vLi4vc3JjL2NvbW1hbmQudHNcIjtcbmltcG9ydCB7IElMb2dnZXIgfSBmcm9tIFwiLi4vLi4vc3JjL2xvZ2dlcl9pbnRlcmZhY2UudHNcIjtcbmltcG9ydCB7IGFzc2VydEVxdWFscywgYXNzZXJ0RXhpc3RzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG5cbi8qKlxuICogQ29tcHJlaGVuc2l2ZSB0ZXN0IGZyYW1ld29yayBmb3IgU3RlZ2EgQ0xJIHRlc3RpbmdcbiAqL1xuZXhwb3J0IGNsYXNzIFRlc3RGcmFtZXdvcmsge1xuXHRwcml2YXRlIHRlbXBGaWxlczogc3RyaW5nW10gPSBbXTtcblx0cHJpdmF0ZSB0ZW1wRGlyczogc3RyaW5nW10gPSBbXTtcblx0cHJpdmF0ZSBtb2NrczogTWFwPHN0cmluZywgdW5rbm93bj4gPSBuZXcgTWFwKCk7XG5cdHByaXZhdGUgY2xpOiBDTEk7XG5cdHByaXZhdGUgbG9nZ2VyOiBNb2NrTG9nZ2VyO1xuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMubG9nZ2VyID0gbmV3IE1vY2tMb2dnZXIoKTtcblx0XHR0aGlzLmNsaSA9IG5ldyBDTEkodW5kZWZpbmVkLCB0cnVlLCB0cnVlLCB0aGlzLmxvZ2dlcik7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyBhbiBpc29sYXRlZCB0ZXN0IGVudmlyb25tZW50XG5cdCAqL1xuXHRwdWJsaWMgYXN5bmMgY3JlYXRlVGVzdEVudmlyb25tZW50KCk6IFByb21pc2U8VGVzdEVudmlyb25tZW50PiB7XG5cdFx0Y29uc3QgYmFzZURpciA9IGF3YWl0IERlbm8ubWFrZVRlbXBEaXIoKTtcblx0XHR0aGlzLnRlbXBEaXJzLnB1c2goYmFzZURpcik7XG5cblx0XHRyZXR1cm4gbmV3IFRlc3RFbnZpcm9ubWVudChiYXNlRGlyLCB0aGlzKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGEgZmlsZSB3aXRoIGdpdmVuIGNvbnRlbnQgZm9yIHRlc3Rpbmdcblx0ICovXG5cdHB1YmxpYyBhc3luYyBjcmVhdGVUZW1wRmlsZShcblx0XHRjb250ZW50OiBzdHJpbmcsXG5cdFx0ZXh0ZW5zaW9uID0gXCIudHh0XCIsXG5cdCk6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0Y29uc3QgZmlsZVBhdGggPSBhd2FpdCBEZW5vLm1ha2VUZW1wRmlsZSh7IHN1ZmZpeDogZXh0ZW5zaW9uIH0pO1xuXHRcdGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShmaWxlUGF0aCwgY29udGVudCk7XG5cdFx0dGhpcy50ZW1wRmlsZXMucHVzaChmaWxlUGF0aCk7XG5cdFx0cmV0dXJuIGZpbGVQYXRoO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJlZ2lzdGVycyBhIG1vY2sgZm9yIGEgc3BlY2lmaWMgZGVwZW5kZW5jeVxuXHQgKi9cblx0cHVibGljIHJlZ2lzdGVyTW9jazxUPihpZGVudGlmaWVyOiBzdHJpbmcsIG1vY2s6IFQpOiB2b2lkIHtcblx0XHR0aGlzLm1vY2tzLnNldChpZGVudGlmaWVyLCBtb2NrKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgYSByZWdpc3RlcmVkIG1vY2tcblx0ICovXG5cdHB1YmxpYyBnZXRNb2NrPFQ+KGlkZW50aWZpZXI6IHN0cmluZyk6IFQge1xuXHRcdGNvbnN0IG1vY2sgPSB0aGlzLm1vY2tzLmdldChpZGVudGlmaWVyKTtcblx0XHRpZiAoIW1vY2spIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgTW9jayBub3QgZm91bmQ6ICR7aWRlbnRpZmllcn1gKTtcblx0XHR9XG5cdFx0cmV0dXJuIG1vY2sgYXMgVDtcblx0fVxuXG5cdC8qKlxuXHQgKiBWZXJpZmllcyBpZiBhIGNvbW1hbmQgZXhpc3RzXG5cdCAqL1xuXHRwdWJsaWMgaGFzQ29tbWFuZChuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcblx0XHRjb25zdCBjbGkgPSB0aGlzLmdldENMSSgpO1xuXHRcdC8vIEB0cy1pZ25vcmUgLSBBY2Nlc3NpbmcgcHJpdmF0ZSByZWdpc3RyeSBmb3IgdGVzdGluZ1xuXHRcdGNvbnN0IHJlZ2lzdHJ5OiBDb21tYW5kUmVnaXN0cnkgPSBjbGlbXCJyZWdpc3RyeVwiXTtcblx0XHRjb25zdCBleGlzdHMgPSByZWdpc3RyeS5maW5kQ29tbWFuZChuYW1lKSAhPT0gdW5kZWZpbmVkO1xuXHRcdHRoaXMubG9nZ2VyLmRlYnVnKFxuXHRcdFx0YENvbW1hbmQgXCIke25hbWV9XCIgJHtleGlzdHMgPyBcImV4aXN0c1wiIDogXCJub3QgZm91bmRcIn0gaW4gcmVnaXN0cnlgLFxuXHRcdCk7XG5cdFx0aWYgKCFleGlzdHMpIHtcblx0XHRcdGNvbnN0IGNvbW1hbmRzID0gcmVnaXN0cnkuZ2V0Q29tbWFuZHMoKS5tYXAoKGNtZCkgPT4gY21kLm5hbWUpO1xuXHRcdFx0dGhpcy5sb2dnZXIuZGVidWcoYEF2YWlsYWJsZSBjb21tYW5kczogJHtjb21tYW5kcy5qb2luKFwiLCBcIil9YCk7XG5cdFx0fVxuXHRcdHJldHVybiBleGlzdHM7XG5cdH1cblxuXHQvKipcblx0ICogTGlzdHMgYWxsIHJlZ2lzdGVyZWQgY29tbWFuZHNcblx0ICovXG5cdHB1YmxpYyBnZXRSZWdpc3RlcmVkQ29tbWFuZHMoKTogc3RyaW5nW10ge1xuXHRcdGNvbnN0IGNsaSA9IHRoaXMuZ2V0Q0xJKCk7XG5cdFx0Ly8gQHRzLWlnbm9yZSAtIEFjY2Vzc2luZyBwcml2YXRlIHJlZ2lzdHJ5IGZvciB0ZXN0aW5nXG5cdFx0Y29uc3QgcmVnaXN0cnk6IENvbW1hbmRSZWdpc3RyeSA9IGNsaVtcInJlZ2lzdHJ5XCJdO1xuXHRcdGNvbnN0IGNvbW1hbmRzID0gcmVnaXN0cnkuZ2V0Q29tbWFuZHMoKS5tYXAoKGNtZCkgPT4gY21kLm5hbWUpO1xuXHRcdHRoaXMubG9nZ2VyLmRlYnVnKGBSZWdpc3RlcmVkIGNvbW1hbmRzOiAke2NvbW1hbmRzLmpvaW4oXCIsIFwiKX1gKTtcblx0XHRyZXR1cm4gY29tbWFuZHM7XG5cdH1cblxuXHQvKipcblx0ICogV2FpdHMgZm9yIGNvbW1hbmQgcmVnaXN0cmF0aW9uIHRvIGNvbXBsZXRlXG5cdCAqL1xuXHRwdWJsaWMgYXN5bmMgd2FpdEZvckNMSVJlYWR5KCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGF3YWl0IHRoaXMuY2xpLndhaXRGb3JSZWFkeSgpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEV4ZWN1dGVzIGEgY29tbWFuZCBpbiB0aGUgdGVzdCBlbnZpcm9ubWVudFxuXHQgKi9cblx0cHVibGljIGFzeW5jIGV4ZWN1dGVDb21tYW5kKGFyZ3M6IHN0cmluZ1tdKTogUHJvbWlzZTxDb21tYW5kUmVzdWx0PiB7XG5cdFx0Ly8gV2FpdCBmb3IgQ0xJIHRvIGJlIHJlYWR5IGJlZm9yZSBleGVjdXRpbmcgY29tbWFuZHNcblx0XHRhd2FpdCB0aGlzLndhaXRGb3JDTElSZWFkeSgpO1xuXG5cdFx0Y29uc3Qgc3RhcnRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cdFx0bGV0IGVycm9yOiBFcnJvciB8IHVuZGVmaW5lZDtcblxuXHRcdHRoaXMubG9nZ2VyLmRlYnVnKGBFeGVjdXRpbmcgY29tbWFuZDogJHthcmdzLmpvaW4oXCIgXCIpfWApO1xuXHRcdGNvbnN0IHByZUNvbW1hbmRzID0gdGhpcy5nZXRSZWdpc3RlcmVkQ29tbWFuZHMoKTtcblx0XHR0aGlzLmxvZ2dlci5kZWJ1Zyhcblx0XHRcdGBBdmFpbGFibGUgY29tbWFuZHMgYmVmb3JlIGV4ZWN1dGlvbjogJHtwcmVDb21tYW5kcy5qb2luKFwiLCBcIil9YCxcblx0XHQpO1xuXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMuY2xpLnJ1bkNvbW1hbmQoYXJncyk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0ZXJyb3IgPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlIDogbmV3IEVycm9yKFN0cmluZyhlKSk7XG5cdFx0XHR0aGlzLmxvZ2dlci5kZWJ1ZyhgQ29tbWFuZCBleGVjdXRpb24gZmFpbGVkOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZW5kVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXHRcdGNvbnN0IHBvc3RDb21tYW5kcyA9IHRoaXMuZ2V0UmVnaXN0ZXJlZENvbW1hbmRzKCk7XG5cdFx0dGhpcy5sb2dnZXIuZGVidWcoXG5cdFx0XHRgQXZhaWxhYmxlIGNvbW1hbmRzIGFmdGVyIGV4ZWN1dGlvbjogJHtwb3N0Q29tbWFuZHMuam9pbihcIiwgXCIpfWAsXG5cdFx0KTtcblxuXHRcdGNvbnN0IHJlc3VsdCA9IHtcblx0XHRcdGR1cmF0aW9uOiBlbmRUaW1lIC0gc3RhcnRUaW1lLFxuXHRcdFx0c3VjY2VzczogIWVycm9yLFxuXHRcdFx0ZXJyb3IsXG5cdFx0XHRsb2dzOiB0aGlzLmxvZ2dlci5nZXRMb2dzKCksXG5cdFx0XHRlcnJvcnM6IHRoaXMubG9nZ2VyLmdldEVycm9ycygpLFxuXHRcdH07XG5cblx0XHR0aGlzLmxvZ2dlci5kZWJ1ZyhgQ29tbWFuZCByZXN1bHQ6ICR7SlNPTi5zdHJpbmdpZnkocmVzdWx0KX1gKTtcblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG5cblx0LyoqXG5cdCAqIE1lYXN1cmVzIHBlcmZvcm1hbmNlIG9mIGEgc3BlY2lmaWMgb3BlcmF0aW9uXG5cdCAqL1xuXHRwdWJsaWMgYXN5bmMgbWVhc3VyZVBlcmZvcm1hbmNlKFxuXHRcdG9wZXJhdGlvbjogKCkgPT4gUHJvbWlzZTx2b2lkPixcblx0XHRpdGVyYXRpb25zID0gMSxcblx0KTogUHJvbWlzZTxQZXJmb3JtYW5jZU1ldHJpY3M+IHtcblx0XHRjb25zdCBkdXJhdGlvbnM6IG51bWJlcltdID0gW107XG5cdFx0Y29uc3QgbWVtb3J5VXNhZ2U6IG51bWJlcltdID0gW107XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGl0ZXJhdGlvbnM7IGkrKykge1xuXHRcdFx0Y29uc3Qgc3RhcnRNZW1vcnkgPSBEZW5vLm1lbW9yeVVzYWdlKCkuaGVhcFVzZWQ7XG5cdFx0XHRjb25zdCBzdGFydFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuXHRcdFx0YXdhaXQgb3BlcmF0aW9uKCk7XG5cblx0XHRcdGNvbnN0IGVuZFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblx0XHRcdGNvbnN0IGVuZE1lbW9yeSA9IERlbm8ubWVtb3J5VXNhZ2UoKS5oZWFwVXNlZDtcblxuXHRcdFx0ZHVyYXRpb25zLnB1c2goZW5kVGltZSAtIHN0YXJ0VGltZSk7XG5cdFx0XHRtZW1vcnlVc2FnZS5wdXNoKGVuZE1lbW9yeSAtIHN0YXJ0TWVtb3J5KTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0YXZlcmFnZUR1cmF0aW9uOiBkdXJhdGlvbnMucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCkgLyBpdGVyYXRpb25zLFxuXHRcdFx0bWluRHVyYXRpb246IE1hdGgubWluKC4uLmR1cmF0aW9ucyksXG5cdFx0XHRtYXhEdXJhdGlvbjogTWF0aC5tYXgoLi4uZHVyYXRpb25zKSxcblx0XHRcdGF2ZXJhZ2VNZW1vcnlVc2FnZTogbWVtb3J5VXNhZ2UucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCkgLyBpdGVyYXRpb25zLFxuXHRcdFx0cGVha01lbW9yeVVzYWdlOiBNYXRoLm1heCguLi5tZW1vcnlVc2FnZSksXG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDbGVhbnMgdXAgYWxsIHRlc3QgcmVzb3VyY2VzXG5cdCAqL1xuXHRwdWJsaWMgYXN5bmMgY2xlYW51cCgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRmb3IgKGNvbnN0IGZpbGUgb2YgdGhpcy50ZW1wRmlsZXMpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IERlbm8ucmVtb3ZlKGZpbGUpO1xuXHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKGBGYWlsZWQgdG8gcmVtb3ZlIHRlbXAgZmlsZSAke2ZpbGV9OmAsIGVycm9yKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKGNvbnN0IGRpciBvZiB0aGlzLnRlbXBEaXJzKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRhd2FpdCBEZW5vLnJlbW92ZShkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuXHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKGBGYWlsZWQgdG8gcmVtb3ZlIHRlbXAgZGlyZWN0b3J5ICR7ZGlyfTpgLCBlcnJvcik7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy50ZW1wRmlsZXMgPSBbXTtcblx0XHR0aGlzLnRlbXBEaXJzID0gW107XG5cdFx0dGhpcy5tb2Nrcy5jbGVhcigpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldHMgdGhlIENMSSBpbnN0YW5jZVxuXHQgKi9cblx0cHVibGljIGdldENMSSgpOiBDTEkge1xuXHRcdHJldHVybiB0aGlzLmNsaTtcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXRzIHRoZSBsb2dnZXIgaW5zdGFuY2Vcblx0ICovXG5cdHB1YmxpYyBnZXRMb2dnZXIoKTogTW9ja0xvZ2dlciB7XG5cdFx0cmV0dXJuIHRoaXMubG9nZ2VyO1xuXHR9XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyBhbiBpc29sYXRlZCB0ZXN0IGVudmlyb25tZW50XG4gKi9cbmV4cG9ydCBjbGFzcyBUZXN0RW52aXJvbm1lbnQge1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRwcml2YXRlIGJhc2VEaXI6IHN0cmluZyxcblx0XHRwcml2YXRlIGZyYW1ld29yazogVGVzdEZyYW1ld29yayxcblx0KSB7fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGEgZmlsZSB3aXRoaW4gdGhlIHRlc3QgZW52aXJvbm1lbnRcblx0ICovXG5cdHB1YmxpYyBhc3luYyBjcmVhdGVGaWxlKFxuXHRcdHJlbGF0aXZlUGF0aDogc3RyaW5nLFxuXHRcdGNvbnRlbnQ6IHN0cmluZyxcblx0KTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRjb25zdCBmdWxsUGF0aCA9IGAke3RoaXMuYmFzZURpcn0vJHtyZWxhdGl2ZVBhdGh9YDtcblx0XHRhd2FpdCBEZW5vLm1rZGlyKG5ldyBVUkwoXCIuXCIsIFwiZmlsZTovL1wiICsgZnVsbFBhdGgpLnBhdGhuYW1lLCB7XG5cdFx0XHRyZWN1cnNpdmU6IHRydWUsXG5cdFx0fSk7XG5cdFx0YXdhaXQgRGVuby53cml0ZVRleHRGaWxlKGZ1bGxQYXRoLCBjb250ZW50KTtcblx0XHRyZXR1cm4gZnVsbFBhdGg7XG5cdH1cblxuXHQvKipcblx0ICogUmVhZHMgYSBmaWxlIGZyb20gdGhlIHRlc3QgZW52aXJvbm1lbnRcblx0ICovXG5cdHB1YmxpYyBhc3luYyByZWFkRmlsZShyZWxhdGl2ZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0cmV0dXJuIGF3YWl0IERlbm8ucmVhZFRleHRGaWxlKGAke3RoaXMuYmFzZURpcn0vJHtyZWxhdGl2ZVBhdGh9YCk7XG5cdH1cblxuXHQvKipcblx0ICogR2V0cyB0aGUgYmFzZSBkaXJlY3Rvcnkgb2YgdGhlIHRlc3QgZW52aXJvbm1lbnRcblx0ICovXG5cdHB1YmxpYyBnZXRCYXNlRGlyKCk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIHRoaXMuYmFzZURpcjtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXNvbHZlcyBhIHBhdGggcmVsYXRpdmUgdG8gdGhlIHNvdXJjZSBkaXJlY3Rvcnlcblx0ICovXG5cdHB1YmxpYyByZXNvbHZlU3JjUGF0aChwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRcdHJldHVybiBuZXcgVVJMKGAuLi8uLi9zcmMvJHtwYXRofWAsIGltcG9ydC5tZXRhLnVybCkucGF0aG5hbWU7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIHBsdWdpbiBmaWxlIHdpdGggY29ycmVjdCBpbXBvcnQgcGF0aHNcblx0ICovXG5cdHB1YmxpYyBhc3luYyBjcmVhdGVQbHVnaW5GaWxlKFxuXHRcdG5hbWU6IHN0cmluZyxcblx0XHRjb250ZW50OiBzdHJpbmcsXG5cdCk6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0Y29uc3QgY29yZVBhdGggPSB0aGlzLnJlc29sdmVTcmNQYXRoKFwiY29yZS50c1wiKTtcblx0XHRjb25zdCBwbHVnaW5QYXRoID0gdGhpcy5yZXNvbHZlU3JjUGF0aChcInBsdWdpbi50c1wiKTtcblxuXHRcdGNvbnN0IHBsdWdpbkNvbnRlbnQgPSBjb250ZW50XG5cdFx0XHQucmVwbGFjZShcIi4uLy4uL3NyYy9jb3JlLnRzXCIsIGNvcmVQYXRoKVxuXHRcdFx0LnJlcGxhY2UoXCIuLi8uLi9zcmMvcGx1Z2luLnRzXCIsIHBsdWdpblBhdGgpO1xuXG5cdFx0cmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlRmlsZShuYW1lLCBwbHVnaW5Db250ZW50KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDbGVhbnMgdXAgdGhlIHRlc3QgZW52aXJvbm1lbnRcblx0ICovXG5cdHB1YmxpYyBhc3luYyBjbGVhbnVwKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBEZW5vLnJlbW92ZSh0aGlzLmJhc2VEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLndhcm4oXG5cdFx0XHRcdGBGYWlsZWQgdG8gY2xlYW51cCB0ZXN0IGVudmlyb25tZW50IGF0ICR7dGhpcy5iYXNlRGlyfTpgLFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgcmVzdWx0IG9mIGEgY29tbWFuZCBleGVjdXRpb25cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21tYW5kUmVzdWx0IHtcblx0ZHVyYXRpb246IG51bWJlcjtcblx0c3VjY2VzczogYm9vbGVhbjtcblx0ZXJyb3I/OiBFcnJvcjtcblx0bG9nczogc3RyaW5nW107XG5cdGVycm9yczogc3RyaW5nW107XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyBwZXJmb3JtYW5jZSBtZXRyaWNzXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGVyZm9ybWFuY2VNZXRyaWNzIHtcblx0YXZlcmFnZUR1cmF0aW9uOiBudW1iZXI7XG5cdG1pbkR1cmF0aW9uOiBudW1iZXI7XG5cdG1heER1cmF0aW9uOiBudW1iZXI7XG5cdGF2ZXJhZ2VNZW1vcnlVc2FnZTogbnVtYmVyO1xuXHRwZWFrTWVtb3J5VXNhZ2U6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBNb2NrIGxvZ2dlciBmb3IgdGVzdGluZ1xuICovXG5leHBvcnQgY2xhc3MgTW9ja0xvZ2dlciBpbXBsZW1lbnRzIElMb2dnZXIge1xuXHRwcml2YXRlIGxvZ3M6IHN0cmluZ1tdID0gW107XG5cdHByaXZhdGUgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXHRwcml2YXRlIGRlYnVnczogc3RyaW5nW10gPSBbXTtcblx0cHJpdmF0ZSB3YXJuczogc3RyaW5nW10gPSBbXTtcblxuXHRpbmZvKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuXHRcdHRoaXMubG9ncy5wdXNoKG1lc3NhZ2UpO1xuXHR9XG5cblx0ZXJyb3IobWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG5cdFx0dGhpcy5lcnJvcnMucHVzaChtZXNzYWdlKTtcblx0fVxuXG5cdGRlYnVnKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuXHRcdHRoaXMuZGVidWdzLnB1c2gobWVzc2FnZSk7XG5cdH1cblxuXHR3YXJuKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuXHRcdHRoaXMud2FybnMucHVzaChtZXNzYWdlKTtcblx0fVxuXG5cdGdldExvZ3MoKTogc3RyaW5nW10ge1xuXHRcdHJldHVybiBbLi4udGhpcy5sb2dzXTtcblx0fVxuXG5cdGdldEVycm9ycygpOiBzdHJpbmdbXSB7XG5cdFx0cmV0dXJuIFsuLi50aGlzLmVycm9yc107XG5cdH1cblxuXHRnZXREZWJ1Z3MoKTogc3RyaW5nW10ge1xuXHRcdHJldHVybiBbLi4udGhpcy5kZWJ1Z3NdO1xuXHR9XG5cblx0Z2V0V2FybnMoKTogc3RyaW5nW10ge1xuXHRcdHJldHVybiBbLi4udGhpcy53YXJuc107XG5cdH1cblxuXHRjbGVhcigpOiB2b2lkIHtcblx0XHR0aGlzLmxvZ3MgPSBbXTtcblx0XHR0aGlzLmVycm9ycyA9IFtdO1xuXHRcdHRoaXMuZGVidWdzID0gW107XG5cdFx0dGhpcy53YXJucyA9IFtdO1xuXHR9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsZ0NBQWdDO0FBQ2hDLFNBQVMsR0FBRyxRQUFRLG9CQUFvQjtBQUt4Qzs7Q0FFQyxHQUNELE9BQU8sTUFBTTtFQUNKLFlBQXNCLEVBQUUsQ0FBQztFQUN6QixXQUFxQixFQUFFLENBQUM7RUFDeEIsUUFBOEIsSUFBSSxNQUFNO0VBQ3hDLElBQVM7RUFDVCxPQUFtQjtFQUUzQixhQUFjO0lBQ2IsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJO0lBQ2xCLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxJQUFJLFdBQVcsTUFBTSxNQUFNLElBQUksQ0FBQyxNQUFNO0VBQ3REO0VBRUE7O0VBRUMsR0FDRCxNQUFhLHdCQUFrRDtJQUM5RCxNQUFNLFVBQVUsTUFBTSxLQUFLLFdBQVc7SUFDdEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7SUFFbkIsT0FBTyxJQUFJLGdCQUFnQixTQUFTLElBQUk7RUFDekM7RUFFQTs7RUFFQyxHQUNELE1BQWEsZUFDWixPQUFlLEVBQ2YsWUFBWSxNQUFNLEVBQ0E7SUFDbEIsTUFBTSxXQUFXLE1BQU0sS0FBSyxZQUFZLENBQUM7TUFBRSxRQUFRO0lBQVU7SUFDN0QsTUFBTSxLQUFLLGFBQWEsQ0FBQyxVQUFVO0lBQ25DLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO0lBQ3BCLE9BQU87RUFDUjtFQUVBOztFQUVDLEdBQ0QsQUFBTyxhQUFnQixVQUFrQixFQUFF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
// denoCacheMetadata=8169164791960770572,12036391211126121204