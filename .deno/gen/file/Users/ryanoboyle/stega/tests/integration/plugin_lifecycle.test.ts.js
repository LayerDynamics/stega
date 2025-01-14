// tests/integration/plugin_lifecycle.test.ts
import { TestFramework } from "../utils/test_framework.ts";
import { assertEquals } from "@std/assert";
Deno.test("Plugin Lifecycle Integration Tests", async (t)=>{
  const framework = new TestFramework();
  await t.step("plugin load and unload cycle", async ()=>{
    const env = await framework.createTestEnvironment();
    framework.getLogger().clear();
    // Create plugin with corrected error handling
    const pluginPath = await env.createPluginFile("lifecycle-plugin.ts", `
            import type { CLI } from "${env.resolveSrcPath("core.ts")}";
            import type { Plugin } from "${env.resolveSrcPath("plugin.ts")}";

            const plugin: Plugin = {
                metadata: {
                    name: "lifecycle-test-plugin",
                    version: "1.0.0",
                    description: "Test plugin for lifecycle management"
                },
                init: async (cli: CLI) => {
                    try {
                        cli.register({
                            name: "test-command",
                            description: "Test command",
                            action: async () => {
                                cli.logger.info("Test command executed");
                            }
                        });
                        cli.logger.info("Plugin initialized");
                    } catch (error) {
                        // Format error message correctly
                        cli.logger.error(\`Failed to initialize plugin: \${error instanceof Error ? error.message : String(error)}\`);
                        throw error;
                    }
                },
                unload: async (cli: CLI) => {
                    // @ts-ignore - Accessing private registry for cleanup
                    const registry = cli['registry'];
                    const removed = registry.remove("test-command");
                    cli.logger.info("Plugin destroyed");
                }
            };

            export default plugin;
        `);
    try {
      // Log test environment details
      framework.getLogger().debug(`Test environment base dir: ${env.getBaseDir()}`);
      framework.getLogger().debug(`Plugin path: ${pluginPath}`);
      // Load plugin with debug logging
      const loadResult = await framework.executeCommand([
        "plugin",
        "load",
        "--path",
        pluginPath,
        "--debug"
      ]);
      assertEquals(loadResult.success, true, `Plugin failed to load: ${loadResult.error?.message}`);
      // Wait for CLI and plugin initialization
      await framework.waitForCLIReady();
      await new Promise((resolve)=>setTimeout(resolve, 200));
      // Debug available commands
      const commands = framework.getRegisteredCommands();
      framework.getLogger().debug(`Available commands: ${commands.join(", ")}`);
      // Check command registration
      const execResult = await framework.executeCommand([
        "test-command"
      ]);
      assertEquals(execResult.success, true, `Plugin command should be available. Commands: ${commands.join(", ")}`);
      // Unload plugin
      const unloadResult = await framework.executeCommand([
        "plugin",
        "unload",
        "--name",
        "lifecycle-test-plugin"
      ]);
      assertEquals(unloadResult.success, true, "Plugin should unload successfully");
      // Verify command is no longer available
      const postUnloadResult = await framework.executeCommand([
        "test-command"
      ]);
      assertEquals(postUnloadResult.success, false, "Command should not be available after unload");
    } catch (error) {
      console.error("Test failed:", error);
      console.log("Debug state:", {
        baseDir: env.getBaseDir(),
        pluginPath,
        srcPath: env.resolveSrcPath("core.ts"),
        commands: framework.getRegisteredCommands(),
        logs: framework.getLogger().getLogs(),
        debugLogs: framework.getLogger().getDebugs(),
        errors: framework.getLogger().getErrors()
      });
      throw error;
    } finally{
      await env.cleanup();
    }
  });
  // Clean up framework after all tests
  await t.step("cleanup", async ()=>{
    await framework.cleanup();
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9pbnRlZ3JhdGlvbi9wbHVnaW5fbGlmZWN5Y2xlLnRlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGVzdHMvaW50ZWdyYXRpb24vcGx1Z2luX2xpZmVjeWNsZS50ZXN0LnRzXG5pbXBvcnQgeyBUZXN0RnJhbWV3b3JrIH0gZnJvbSBcIi4uL3V0aWxzL3Rlc3RfZnJhbWV3b3JrLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcblxuRGVuby50ZXN0KFwiUGx1Z2luIExpZmVjeWNsZSBJbnRlZ3JhdGlvbiBUZXN0c1wiLCBhc3luYyAodCkgPT4ge1xuXHRjb25zdCBmcmFtZXdvcmsgPSBuZXcgVGVzdEZyYW1ld29yaygpO1xuXG5cdGF3YWl0IHQuc3RlcChcInBsdWdpbiBsb2FkIGFuZCB1bmxvYWQgY3ljbGVcIiwgYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IGVudiA9IGF3YWl0IGZyYW1ld29yay5jcmVhdGVUZXN0RW52aXJvbm1lbnQoKTtcblx0XHRmcmFtZXdvcmsuZ2V0TG9nZ2VyKCkuY2xlYXIoKTtcblxuXHRcdC8vIENyZWF0ZSBwbHVnaW4gd2l0aCBjb3JyZWN0ZWQgZXJyb3IgaGFuZGxpbmdcblx0XHRjb25zdCBwbHVnaW5QYXRoID0gYXdhaXQgZW52LmNyZWF0ZVBsdWdpbkZpbGUoXG5cdFx0XHRcImxpZmVjeWNsZS1wbHVnaW4udHNcIixcblx0XHRcdGBcbiAgICAgICAgICAgIGltcG9ydCB0eXBlIHsgQ0xJIH0gZnJvbSBcIiR7ZW52LnJlc29sdmVTcmNQYXRoKFwiY29yZS50c1wiKX1cIjtcbiAgICAgICAgICAgIGltcG9ydCB0eXBlIHsgUGx1Z2luIH0gZnJvbSBcIiR7ZW52LnJlc29sdmVTcmNQYXRoKFwicGx1Z2luLnRzXCIpfVwiO1xuXG4gICAgICAgICAgICBjb25zdCBwbHVnaW46IFBsdWdpbiA9IHtcbiAgICAgICAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcImxpZmVjeWNsZS10ZXN0LXBsdWdpblwiLFxuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBcIjEuMC4wXCIsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlRlc3QgcGx1Z2luIGZvciBsaWZlY3ljbGUgbWFuYWdlbWVudFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBpbml0OiBhc3luYyAoY2xpOiBDTEkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaS5yZWdpc3Rlcih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJ0ZXN0LWNvbW1hbmRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJUZXN0IGNvbW1hbmRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xpLmxvZ2dlci5pbmZvKFwiVGVzdCBjb21tYW5kIGV4ZWN1dGVkXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xpLmxvZ2dlci5pbmZvKFwiUGx1Z2luIGluaXRpYWxpemVkXCIpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9ybWF0IGVycm9yIG1lc3NhZ2UgY29ycmVjdGx5XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGkubG9nZ2VyLmVycm9yKFxcYEZhaWxlZCB0byBpbml0aWFsaXplIHBsdWdpbjogXFwke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1cXGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHVubG9hZDogYXN5bmMgKGNsaTogQ0xJKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgLSBBY2Nlc3NpbmcgcHJpdmF0ZSByZWdpc3RyeSBmb3IgY2xlYW51cFxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZWdpc3RyeSA9IGNsaVsncmVnaXN0cnknXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVtb3ZlZCA9IHJlZ2lzdHJ5LnJlbW92ZShcInRlc3QtY29tbWFuZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgY2xpLmxvZ2dlci5pbmZvKFwiUGx1Z2luIGRlc3Ryb3llZFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBleHBvcnQgZGVmYXVsdCBwbHVnaW47XG4gICAgICAgIGAsXG5cdFx0KTtcblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBMb2cgdGVzdCBlbnZpcm9ubWVudCBkZXRhaWxzXG5cdFx0XHRmcmFtZXdvcmsuZ2V0TG9nZ2VyKCkuZGVidWcoXG5cdFx0XHRcdGBUZXN0IGVudmlyb25tZW50IGJhc2UgZGlyOiAke2Vudi5nZXRCYXNlRGlyKCl9YCxcblx0XHRcdCk7XG5cdFx0XHRmcmFtZXdvcmsuZ2V0TG9nZ2VyKCkuZGVidWcoYFBsdWdpbiBwYXRoOiAke3BsdWdpblBhdGh9YCk7XG5cblx0XHRcdC8vIExvYWQgcGx1Z2luIHdpdGggZGVidWcgbG9nZ2luZ1xuXHRcdFx0Y29uc3QgbG9hZFJlc3VsdCA9IGF3YWl0IGZyYW1ld29yay5leGVjdXRlQ29tbWFuZChbXG5cdFx0XHRcdFwicGx1Z2luXCIsXG5cdFx0XHRcdFwibG9hZFwiLFxuXHRcdFx0XHRcIi0tcGF0aFwiLFxuXHRcdFx0XHRwbHVnaW5QYXRoLFxuXHRcdFx0XHRcIi0tZGVidWdcIixcblx0XHRcdF0pO1xuXG5cdFx0XHRhc3NlcnRFcXVhbHMoXG5cdFx0XHRcdGxvYWRSZXN1bHQuc3VjY2Vzcyxcblx0XHRcdFx0dHJ1ZSxcblx0XHRcdFx0YFBsdWdpbiBmYWlsZWQgdG8gbG9hZDogJHtsb2FkUmVzdWx0LmVycm9yPy5tZXNzYWdlfWAsXG5cdFx0XHQpO1xuXG5cdFx0XHQvLyBXYWl0IGZvciBDTEkgYW5kIHBsdWdpbiBpbml0aWFsaXphdGlvblxuXHRcdFx0YXdhaXQgZnJhbWV3b3JrLndhaXRGb3JDTElSZWFkeSgpO1xuXHRcdFx0YXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMjAwKSk7XG5cblx0XHRcdC8vIERlYnVnIGF2YWlsYWJsZSBjb21tYW5kc1xuXHRcdFx0Y29uc3QgY29tbWFuZHMgPSBmcmFtZXdvcmsuZ2V0UmVnaXN0ZXJlZENvbW1hbmRzKCk7XG5cdFx0XHRmcmFtZXdvcmsuZ2V0TG9nZ2VyKCkuZGVidWcoYEF2YWlsYWJsZSBjb21tYW5kczogJHtjb21tYW5kcy5qb2luKFwiLCBcIil9YCk7XG5cblx0XHRcdC8vIENoZWNrIGNvbW1hbmQgcmVnaXN0cmF0aW9uXG5cdFx0XHRjb25zdCBleGVjUmVzdWx0ID0gYXdhaXQgZnJhbWV3b3JrLmV4ZWN1dGVDb21tYW5kKFtcInRlc3QtY29tbWFuZFwiXSk7XG5cdFx0XHRhc3NlcnRFcXVhbHMoXG5cdFx0XHRcdGV4ZWNSZXN1bHQuc3VjY2Vzcyxcblx0XHRcdFx0dHJ1ZSxcblx0XHRcdFx0YFBsdWdpbiBjb21tYW5kIHNob3VsZCBiZSBhdmFpbGFibGUuIENvbW1hbmRzOiAke2NvbW1hbmRzLmpvaW4oXCIsIFwiKX1gLFxuXHRcdFx0KTtcblxuXHRcdFx0Ly8gVW5sb2FkIHBsdWdpblxuXHRcdFx0Y29uc3QgdW5sb2FkUmVzdWx0ID0gYXdhaXQgZnJhbWV3b3JrLmV4ZWN1dGVDb21tYW5kKFtcblx0XHRcdFx0XCJwbHVnaW5cIixcblx0XHRcdFx0XCJ1bmxvYWRcIixcblx0XHRcdFx0XCItLW5hbWVcIixcblx0XHRcdFx0XCJsaWZlY3ljbGUtdGVzdC1wbHVnaW5cIixcblx0XHRcdF0pO1xuXHRcdFx0YXNzZXJ0RXF1YWxzKFxuXHRcdFx0XHR1bmxvYWRSZXN1bHQuc3VjY2Vzcyxcblx0XHRcdFx0dHJ1ZSxcblx0XHRcdFx0XCJQbHVnaW4gc2hvdWxkIHVubG9hZCBzdWNjZXNzZnVsbHlcIixcblx0XHRcdCk7XG5cblx0XHRcdC8vIFZlcmlmeSBjb21tYW5kIGlzIG5vIGxvbmdlciBhdmFpbGFibGVcblx0XHRcdGNvbnN0IHBvc3RVbmxvYWRSZXN1bHQgPSBhd2FpdCBmcmFtZXdvcmsuZXhlY3V0ZUNvbW1hbmQoW1widGVzdC1jb21tYW5kXCJdKTtcblx0XHRcdGFzc2VydEVxdWFscyhcblx0XHRcdFx0cG9zdFVubG9hZFJlc3VsdC5zdWNjZXNzLFxuXHRcdFx0XHRmYWxzZSxcblx0XHRcdFx0XCJDb21tYW5kIHNob3VsZCBub3QgYmUgYXZhaWxhYmxlIGFmdGVyIHVubG9hZFwiLFxuXHRcdFx0KTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIlRlc3QgZmFpbGVkOlwiLCBlcnJvcik7XG5cdFx0XHRjb25zb2xlLmxvZyhcIkRlYnVnIHN0YXRlOlwiLCB7XG5cdFx0XHRcdGJhc2VEaXI6IGVudi5nZXRCYXNlRGlyKCksXG5cdFx0XHRcdHBsdWdpblBhdGgsXG5cdFx0XHRcdHNyY1BhdGg6IGVudi5yZXNvbHZlU3JjUGF0aChcImNvcmUudHNcIiksXG5cdFx0XHRcdGNvbW1hbmRzOiBmcmFtZXdvcmsuZ2V0UmVnaXN0ZXJlZENvbW1hbmRzKCksXG5cdFx0XHRcdGxvZ3M6IGZyYW1ld29yay5nZXRMb2dnZXIoKS5nZXRMb2dzKCksXG5cdFx0XHRcdGRlYnVnTG9nczogZnJhbWV3b3JrLmdldExvZ2dlcigpLmdldERlYnVncygpLFxuXHRcdFx0XHRlcnJvcnM6IGZyYW1ld29yay5nZXRMb2dnZXIoKS5nZXRFcnJvcnMoKSxcblx0XHRcdH0pO1xuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdGF3YWl0IGVudi5jbGVhbnVwKCk7XG5cdFx0fVxuXHR9KTtcblxuXHQvLyBDbGVhbiB1cCBmcmFtZXdvcmsgYWZ0ZXIgYWxsIHRlc3RzXG5cdGF3YWl0IHQuc3RlcChcImNsZWFudXBcIiwgYXN5bmMgKCkgPT4ge1xuXHRcdGF3YWl0IGZyYW1ld29yay5jbGVhbnVwKCk7XG5cdH0pO1xufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsNkNBQTZDO0FBQzdDLFNBQVMsYUFBYSxRQUFRLDZCQUE2QjtBQUMzRCxTQUFTLFlBQVksUUFBUSxjQUFjO0FBRTNDLEtBQUssSUFBSSxDQUFDLHNDQUFzQyxPQUFPO0VBQ3RELE1BQU0sWUFBWSxJQUFJO0VBRXRCLE1BQU0sRUFBRSxJQUFJLENBQUMsZ0NBQWdDO0lBQzVDLE1BQU0sTUFBTSxNQUFNLFVBQVUscUJBQXFCO0lBQ2pELFVBQVUsU0FBUyxHQUFHLEtBQUs7SUFFM0IsOENBQThDO0lBQzlDLE1BQU0sYUFBYSxNQUFNLElBQUksZ0JBQWdCLENBQzVDLHVCQUNBLENBQUM7c0NBQ2tDLEVBQUUsSUFBSSxjQUFjLENBQUMsV0FBVzt5Q0FDN0IsRUFBRSxJQUFJLGNBQWMsQ0FBQyxhQUFhOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7UUFpQ25FLENBQUM7SUFHUCxJQUFJO01BQ0gsK0JBQStCO01BQy9CLFVBQVUsU0FBUyxHQUFHLEtBQUssQ0FDMUIsQ0FBQywyQkFBMkIsRUFBRSxJQUFJLFVBQVUsR0FBRyxDQUFDO01BRWpELFVBQVUsU0FBUyxHQUFHLEtBQUssQ0FBQyxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUM7TUFFeEQsaUNBQWlDO01BQ2pDLE1BQU0sYUFBYSxNQUFNLFVBQVUsY0FBYyxDQUFDO1FBQ2pEO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7T0FDQTtNQUVELGFBQ0MsV0FBVyxPQUFPLEVBQ2xCLE1BQ0EsQ0FBQyx1QkFBdUIsRUFBRSxXQUFXLEtBQUssRUFBRSxRQUFRLENBQUM7TUFHdEQseUNBQXlDO01BQ3pDLE1BQU0sVUFBVSxlQUFlO01BQy9CLE1BQU0sSUFBSSxRQUFRLENBQUMsVUFBWSxXQUFXLFNBQVM7TUFFbkQsMkJBQTJCO01BQzNCLE1BQU0sV0FBVyxVQUFVLHFCQUFxQjtNQUNoRCxVQUFVLFNBQVMsR0FBRyxLQUFLLENBQUMsQ0FBQyxvQkFBb0IsRUFBRSxTQUFTLElBQUksQ0FBQyxNQUFNLENBQUM7TUFFeEUsNkJBQTZCO01BQzdCLE1BQU0sYUFBYSxNQUFNLFVBQVUsY0FBYyxDQUFDO1FBQUM7T0FBZTtNQUNsRSxhQUNDLFdBQVcsT0FBTyxFQUNsQixNQUNBLENBQUMsOENBQThDLEVBQUUsU0FBUyxJQUFJLENBQUMsTUFBTSxDQUFDO01BR3ZFLGdCQUFnQjtNQUNoQixNQUFNLGVBQWUsTUFBTSxVQUFVLGNBQWMsQ0FBQztRQUNuRDtRQUNBO1FBQ0E7UUFDQTtPQUNBO01BQ0QsYUFDQyxhQUFhLE9BQU8sRUFDcEIsTUFDQTtNQUdELHdDQUF3QztNQUN4QyxNQUFNLG1CQUFtQixNQUFNLFVBQVUsY0FBYyxDQUFDO1FBQUM7T0FBZTtNQUN4RSxhQUNDLGlCQUFpQixPQUFPLEVBQ3hCLE9BQ0E7SUFFRixFQUFFLE9BQU8sT0FBTztNQUNmLFFBQVEsS0FBSyxDQUFDLGdCQUFnQjtNQUM5QixRQUFRLEdBQUcsQ0FBQyxnQkFBZ0I7UUFDM0IsU0FBUyxJQUFJLFVBQVU7UUFDdkI7UUFDQSxTQUFTLElBQUksY0FBYyxDQUFDO1FBQzVCLFVBQVUsVUFBVSxxQkFBcUI7UUFDekMsTUFBTSxVQUFVLFNBQVMsR0FBRyxPQUFPO1FBQ25DLFdBQVcsVUFBVSxTQUFTLEdBQUcsU0FBUztRQUMxQyxRQUFRLFVBQVUsU0FBUyxHQUFHLFNBQVM7TUFDeEM7TUFDQSxNQUFNO0lBQ1AsU0FBVTtNQUNULE1BQU0sSUFBSSxPQUFPO0lBQ2xCO0VBQ0Q7RUFFQSxxQ0FBcUM7RUFDckMsTUFBTSxFQUFFLElBQUksQ0FBQyxXQUFXO0lBQ3ZCLE1BQU0sVUFBVSxPQUFPO0VBQ3hCO0FBQ0QifQ==
// denoCacheMetadata=10391617389541527461,8766882985678126259