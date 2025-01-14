// cli_workflow.test.ts
import { TestFramework } from "../utils/test_framework.ts";
import { assertEquals } from "@std/assert";
export async function setupCliWorkflowTest(t) {
  const framework = new TestFramework();
  const cli = framework.getCLI();
  await t.step("complete command workflow", async ()=>{
    const env = await framework.createTestEnvironment();
    // Create plugin with proper module exports and types
    const pluginPath = await env.createFile("plugin.ts", `
            import type { CLI } from "../../src/core.ts";
            import type { Plugin } from "../../src/plugin.ts";

            const plugin: Plugin = {
                metadata: {
                    name: "test-plugin",
                    version: "1.0.0"
                },
                init: async (cli: CLI) => {
                    cli.register({
                        name: "plugin-command",
                        action: async () => {
                            console.log("Plugin command executed");
                        }
                    });
                    console.log("Plugin initialized");
                }
            };

            export default plugin;
        `);
    try {
      // Load plugin and verify success
      const loadResult = await framework.executeCommand([
        "plugin",
        "load",
        "--path",
        pluginPath
      ]);
      assertEquals(loadResult.success, true, "Plugin should load successfully");
      assertEquals(loadResult.error, undefined, "Should not have loading errors");
      // Wait for plugin initialization
      await new Promise((resolve)=>setTimeout(resolve, 100));
      // Execute plugin command
      const execResult = await framework.executeCommand([
        "plugin-command"
      ]);
      assertEquals(execResult.success, true, "Plugin command should execute successfully");
      assertEquals(execResult.error, undefined, "Should not have execution errors");
      // Verify logs contain initialization message
      const logs = framework.getLogger().getLogs();
      assertEquals(logs.some((log)=>log.includes("Plugin initialized")), true, "Should show plugin initialization message");
      // Test help command
      const helpResult = await framework.executeCommand([
        "help"
      ]);
      assertEquals(helpResult.success, true, "Help command should work after plugin operations");
      assertEquals(helpResult.error, undefined, "Help command should not have errors");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Test failed:", errorMessage);
      throw error;
    } finally{
      await env.cleanup?.();
      await framework.cleanup();
    }
  });
}
export async function setupPluginLifecycleTest(t) {
  const framework = new TestFramework();
  await t.step("plugin load and unload cycle", async ()=>{
    const env = await framework.createTestEnvironment();
    framework.getLogger().clear();
    const pluginPath = await env.createFile("lifecycle-plugin.ts", `
            import type { CLI } from "../../src/core.ts";
            import type { Plugin } from "../../src/plugin.ts";

            const plugin: Plugin = {
                metadata: {
                    name: "lifecycle-test-plugin",
                    version: "1.0.0"
                },
                init: async (cli: CLI) => {
                    try {
                        cli.register({
                            name: "test-command",
                            description: "Test command",
                            action: async () => {
                                console.log("Test command executed");
                            }
                        });
                        await new Promise(resolve => setTimeout(resolve, 100));
                        console.log("Plugin initialized");
                    } catch (error) {
                        console.error("Failed to register command:", error);
                        throw error;
                    }
                },
                unload: async (cli: CLI) => {
                    // @ts-ignore - Accessing private registry for cleanup
                    cli['registry'].remove("test-command");
                    console.log("Plugin destroyed");
                }
            };

            export default plugin;
        `);
    try {
      // Load plugin
      const loadResult = await framework.executeCommand([
        "plugin",
        "load",
        "--path",
        pluginPath,
        "--debug"
      ]);
      assertEquals(loadResult.success, true, "Plugin should load successfully");
      // Wait for CLI to be ready
      await framework.waitForCLIReady();
      // Verify command registration
      const commands = framework.getRegisteredCommands();
      console.log("Available commands:", commands);
      const commandExists = framework.hasCommand("test-command");
      assertEquals(commandExists, true, `test-command should be registered. Available commands: ${commands.join(", ")}`);
    // Rest of the test remains the same...
    // ...existing code...
    } catch (error) {
      console.error("Test failed:", error);
      console.log("Debug state:", {
        commands: framework.getRegisteredCommands(),
        logs: framework.getLogger().getLogs(),
        debugLogs: framework.getLogger().getDebugs(),
        errors: framework.getLogger().getErrors()
      });
      throw error;
    } finally{
      await env.cleanup();
      await framework.cleanup();
    }
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9pbnRlZ3JhdGlvbi9jbGlfd29ya2Zsb3cudGVzdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBjbGlfd29ya2Zsb3cudGVzdC50c1xuaW1wb3J0IHsgQ0xJIH0gZnJvbSBcIi4uLy4uL3NyYy9jb3JlLnRzXCI7XG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tIFwiLi4vLi4vc3JjL3BsdWdpbi50c1wiO1xuaW1wb3J0IHsgdHlwZSBDb21tYW5kUmVzdWx0LCBUZXN0RnJhbWV3b3JrIH0gZnJvbSBcIi4uL3V0aWxzL3Rlc3RfZnJhbWV3b3JrLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldHVwQ2xpV29ya2Zsb3dUZXN0KHQ6IERlbm8uVGVzdENvbnRleHQpIHtcblx0Y29uc3QgZnJhbWV3b3JrID0gbmV3IFRlc3RGcmFtZXdvcmsoKTtcblx0Y29uc3QgY2xpID0gZnJhbWV3b3JrLmdldENMSSgpO1xuXG5cdGF3YWl0IHQuc3RlcChcImNvbXBsZXRlIGNvbW1hbmQgd29ya2Zsb3dcIiwgYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IGVudiA9IGF3YWl0IGZyYW1ld29yay5jcmVhdGVUZXN0RW52aXJvbm1lbnQoKTtcblxuXHRcdC8vIENyZWF0ZSBwbHVnaW4gd2l0aCBwcm9wZXIgbW9kdWxlIGV4cG9ydHMgYW5kIHR5cGVzXG5cdFx0Y29uc3QgcGx1Z2luUGF0aCA9IGF3YWl0IGVudi5jcmVhdGVGaWxlKFxuXHRcdFx0XCJwbHVnaW4udHNcIixcblx0XHRcdGBcbiAgICAgICAgICAgIGltcG9ydCB0eXBlIHsgQ0xJIH0gZnJvbSBcIi4uLy4uL3NyYy9jb3JlLnRzXCI7XG4gICAgICAgICAgICBpbXBvcnQgdHlwZSB7IFBsdWdpbiB9IGZyb20gXCIuLi8uLi9zcmMvcGx1Z2luLnRzXCI7XG5cbiAgICAgICAgICAgIGNvbnN0IHBsdWdpbjogUGx1Z2luID0ge1xuICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwidGVzdC1wbHVnaW5cIixcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogXCIxLjAuMFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBpbml0OiBhc3luYyAoY2xpOiBDTEkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY2xpLnJlZ2lzdGVyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwicGx1Z2luLWNvbW1hbmRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUGx1Z2luIGNvbW1hbmQgZXhlY3V0ZWRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBsdWdpbiBpbml0aWFsaXplZFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBleHBvcnQgZGVmYXVsdCBwbHVnaW47XG4gICAgICAgIGAsXG5cdFx0KTtcblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBMb2FkIHBsdWdpbiBhbmQgdmVyaWZ5IHN1Y2Nlc3Ncblx0XHRcdGNvbnN0IGxvYWRSZXN1bHQgPSBhd2FpdCBmcmFtZXdvcmsuZXhlY3V0ZUNvbW1hbmQoW1xuXHRcdFx0XHRcInBsdWdpblwiLFxuXHRcdFx0XHRcImxvYWRcIixcblx0XHRcdFx0XCItLXBhdGhcIixcblx0XHRcdFx0cGx1Z2luUGF0aCxcblx0XHRcdF0pO1xuXHRcdFx0YXNzZXJ0RXF1YWxzKGxvYWRSZXN1bHQuc3VjY2VzcywgdHJ1ZSwgXCJQbHVnaW4gc2hvdWxkIGxvYWQgc3VjY2Vzc2Z1bGx5XCIpO1xuXHRcdFx0YXNzZXJ0RXF1YWxzKFxuXHRcdFx0XHRsb2FkUmVzdWx0LmVycm9yLFxuXHRcdFx0XHR1bmRlZmluZWQsXG5cdFx0XHRcdFwiU2hvdWxkIG5vdCBoYXZlIGxvYWRpbmcgZXJyb3JzXCIsXG5cdFx0XHQpO1xuXG5cdFx0XHQvLyBXYWl0IGZvciBwbHVnaW4gaW5pdGlhbGl6YXRpb25cblx0XHRcdGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMCkpO1xuXG5cdFx0XHQvLyBFeGVjdXRlIHBsdWdpbiBjb21tYW5kXG5cdFx0XHRjb25zdCBleGVjUmVzdWx0ID0gYXdhaXQgZnJhbWV3b3JrLmV4ZWN1dGVDb21tYW5kKFtcInBsdWdpbi1jb21tYW5kXCJdKTtcblx0XHRcdGFzc2VydEVxdWFscyhcblx0XHRcdFx0ZXhlY1Jlc3VsdC5zdWNjZXNzLFxuXHRcdFx0XHR0cnVlLFxuXHRcdFx0XHRcIlBsdWdpbiBjb21tYW5kIHNob3VsZCBleGVjdXRlIHN1Y2Nlc3NmdWxseVwiLFxuXHRcdFx0KTtcblx0XHRcdGFzc2VydEVxdWFscyhcblx0XHRcdFx0ZXhlY1Jlc3VsdC5lcnJvcixcblx0XHRcdFx0dW5kZWZpbmVkLFxuXHRcdFx0XHRcIlNob3VsZCBub3QgaGF2ZSBleGVjdXRpb24gZXJyb3JzXCIsXG5cdFx0XHQpO1xuXG5cdFx0XHQvLyBWZXJpZnkgbG9ncyBjb250YWluIGluaXRpYWxpemF0aW9uIG1lc3NhZ2Vcblx0XHRcdGNvbnN0IGxvZ3MgPSBmcmFtZXdvcmsuZ2V0TG9nZ2VyKCkuZ2V0TG9ncygpO1xuXHRcdFx0YXNzZXJ0RXF1YWxzKFxuXHRcdFx0XHRsb2dzLnNvbWUoKGxvZykgPT4gbG9nLmluY2x1ZGVzKFwiUGx1Z2luIGluaXRpYWxpemVkXCIpKSxcblx0XHRcdFx0dHJ1ZSxcblx0XHRcdFx0XCJTaG91bGQgc2hvdyBwbHVnaW4gaW5pdGlhbGl6YXRpb24gbWVzc2FnZVwiLFxuXHRcdFx0KTtcblxuXHRcdFx0Ly8gVGVzdCBoZWxwIGNvbW1hbmRcblx0XHRcdGNvbnN0IGhlbHBSZXN1bHQgPSBhd2FpdCBmcmFtZXdvcmsuZXhlY3V0ZUNvbW1hbmQoW1wiaGVscFwiXSk7XG5cdFx0XHRhc3NlcnRFcXVhbHMoXG5cdFx0XHRcdGhlbHBSZXN1bHQuc3VjY2Vzcyxcblx0XHRcdFx0dHJ1ZSxcblx0XHRcdFx0XCJIZWxwIGNvbW1hbmQgc2hvdWxkIHdvcmsgYWZ0ZXIgcGx1Z2luIG9wZXJhdGlvbnNcIixcblx0XHRcdCk7XG5cdFx0XHRhc3NlcnRFcXVhbHMoXG5cdFx0XHRcdGhlbHBSZXN1bHQuZXJyb3IsXG5cdFx0XHRcdHVuZGVmaW5lZCxcblx0XHRcdFx0XCJIZWxwIGNvbW1hbmQgc2hvdWxkIG5vdCBoYXZlIGVycm9yc1wiLFxuXHRcdFx0KTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvclxuXHRcdFx0XHQ/IGVycm9yLm1lc3NhZ2Vcblx0XHRcdFx0OiBTdHJpbmcoZXJyb3IpO1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIlRlc3QgZmFpbGVkOlwiLCBlcnJvck1lc3NhZ2UpO1xuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdGF3YWl0IGVudi5jbGVhbnVwPy4oKTtcblx0XHRcdGF3YWl0IGZyYW1ld29yay5jbGVhbnVwKCk7XG5cdFx0fVxuXHR9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldHVwUGx1Z2luTGlmZWN5Y2xlVGVzdCh0OiBEZW5vLlRlc3RDb250ZXh0KSB7XG5cdGNvbnN0IGZyYW1ld29yayA9IG5ldyBUZXN0RnJhbWV3b3JrKCk7XG5cblx0YXdhaXQgdC5zdGVwKFwicGx1Z2luIGxvYWQgYW5kIHVubG9hZCBjeWNsZVwiLCBhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgZW52ID0gYXdhaXQgZnJhbWV3b3JrLmNyZWF0ZVRlc3RFbnZpcm9ubWVudCgpO1xuXHRcdGZyYW1ld29yay5nZXRMb2dnZXIoKS5jbGVhcigpO1xuXG5cdFx0Y29uc3QgcGx1Z2luUGF0aCA9IGF3YWl0IGVudi5jcmVhdGVGaWxlKFxuXHRcdFx0XCJsaWZlY3ljbGUtcGx1Z2luLnRzXCIsXG5cdFx0XHRgXG4gICAgICAgICAgICBpbXBvcnQgdHlwZSB7IENMSSB9IGZyb20gXCIuLi8uLi9zcmMvY29yZS50c1wiO1xuICAgICAgICAgICAgaW1wb3J0IHR5cGUgeyBQbHVnaW4gfSBmcm9tIFwiLi4vLi4vc3JjL3BsdWdpbi50c1wiO1xuXG4gICAgICAgICAgICBjb25zdCBwbHVnaW46IFBsdWdpbiA9IHtcbiAgICAgICAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcImxpZmVjeWNsZS10ZXN0LXBsdWdpblwiLFxuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBcIjEuMC4wXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGluaXQ6IGFzeW5jIChjbGk6IENMSSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xpLnJlZ2lzdGVyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBcInRlc3QtY29tbWFuZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlRlc3QgY29tbWFuZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRlc3QgY29tbWFuZCBleGVjdXRlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUGx1Z2luIGluaXRpYWxpemVkXCIpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byByZWdpc3RlciBjb21tYW5kOlwiLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdW5sb2FkOiBhc3luYyAoY2xpOiBDTEkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSAtIEFjY2Vzc2luZyBwcml2YXRlIHJlZ2lzdHJ5IGZvciBjbGVhbnVwXG4gICAgICAgICAgICAgICAgICAgIGNsaVsncmVnaXN0cnknXS5yZW1vdmUoXCJ0ZXN0LWNvbW1hbmRcIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUGx1Z2luIGRlc3Ryb3llZFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBleHBvcnQgZGVmYXVsdCBwbHVnaW47XG4gICAgICAgIGAsXG5cdFx0KTtcblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBMb2FkIHBsdWdpblxuXHRcdFx0Y29uc3QgbG9hZFJlc3VsdCA9IGF3YWl0IGZyYW1ld29yay5leGVjdXRlQ29tbWFuZChbXG5cdFx0XHRcdFwicGx1Z2luXCIsXG5cdFx0XHRcdFwibG9hZFwiLFxuXHRcdFx0XHRcIi0tcGF0aFwiLFxuXHRcdFx0XHRwbHVnaW5QYXRoLFxuXHRcdFx0XHRcIi0tZGVidWdcIixcblx0XHRcdF0pO1xuXHRcdFx0YXNzZXJ0RXF1YWxzKGxvYWRSZXN1bHQuc3VjY2VzcywgdHJ1ZSwgXCJQbHVnaW4gc2hvdWxkIGxvYWQgc3VjY2Vzc2Z1bGx5XCIpO1xuXG5cdFx0XHQvLyBXYWl0IGZvciBDTEkgdG8gYmUgcmVhZHlcblx0XHRcdGF3YWl0IGZyYW1ld29yay53YWl0Rm9yQ0xJUmVhZHkoKTtcblxuXHRcdFx0Ly8gVmVyaWZ5IGNvbW1hbmQgcmVnaXN0cmF0aW9uXG5cdFx0XHRjb25zdCBjb21tYW5kcyA9IGZyYW1ld29yay5nZXRSZWdpc3RlcmVkQ29tbWFuZHMoKTtcblx0XHRcdGNvbnNvbGUubG9nKFwiQXZhaWxhYmxlIGNvbW1hbmRzOlwiLCBjb21tYW5kcyk7XG5cblx0XHRcdGNvbnN0IGNvbW1hbmRFeGlzdHMgPSBmcmFtZXdvcmsuaGFzQ29tbWFuZChcInRlc3QtY29tbWFuZFwiKTtcblx0XHRcdGFzc2VydEVxdWFscyhcblx0XHRcdFx0Y29tbWFuZEV4aXN0cyxcblx0XHRcdFx0dHJ1ZSxcblx0XHRcdFx0YHRlc3QtY29tbWFuZCBzaG91bGQgYmUgcmVnaXN0ZXJlZC4gQXZhaWxhYmxlIGNvbW1hbmRzOiAke1xuXHRcdFx0XHRcdGNvbW1hbmRzLmpvaW4oXCIsIFwiKVxuXHRcdFx0XHR9YCxcblx0XHRcdCk7XG5cblx0XHRcdC8vIFJlc3Qgb2YgdGhlIHRlc3QgcmVtYWlucyB0aGUgc2FtZS4uLlxuXHRcdFx0Ly8gLi4uZXhpc3RpbmcgY29kZS4uLlxuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKFwiVGVzdCBmYWlsZWQ6XCIsIGVycm9yKTtcblx0XHRcdGNvbnNvbGUubG9nKFwiRGVidWcgc3RhdGU6XCIsIHtcblx0XHRcdFx0Y29tbWFuZHM6IGZyYW1ld29yay5nZXRSZWdpc3RlcmVkQ29tbWFuZHMoKSxcblx0XHRcdFx0bG9nczogZnJhbWV3b3JrLmdldExvZ2dlcigpLmdldExvZ3MoKSxcblx0XHRcdFx0ZGVidWdMb2dzOiBmcmFtZXdvcmsuZ2V0TG9nZ2VyKCkuZ2V0RGVidWdzKCksXG5cdFx0XHRcdGVycm9yczogZnJhbWV3b3JrLmdldExvZ2dlcigpLmdldEVycm9ycygpLFxuXHRcdFx0fSk7XG5cdFx0XHR0aHJvdyBlcnJvcjtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0YXdhaXQgZW52LmNsZWFudXAoKTtcblx0XHRcdGF3YWl0IGZyYW1ld29yay5jbGVhbnVwKCk7XG5cdFx0fVxuXHR9KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx1QkFBdUI7QUFHdkIsU0FBNkIsYUFBYSxRQUFRLDZCQUE2QjtBQUMvRSxTQUFTLFlBQVksUUFBUSxjQUFjO0FBRTNDLE9BQU8sZUFBZSxxQkFBcUIsQ0FBbUI7RUFDN0QsTUFBTSxZQUFZLElBQUk7RUFDdEIsTUFBTSxNQUFNLFVBQVUsTUFBTTtFQUU1QixNQUFNLEVBQUUsSUFBSSxDQUFDLDZCQUE2QjtJQUN6QyxNQUFNLE1BQU0sTUFBTSxVQUFVLHFCQUFxQjtJQUVqRCxxREFBcUQ7SUFDckQsTUFBTSxhQUFhLE1BQU0sSUFBSSxVQUFVLENBQ3RDLGFBQ0EsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBcUJJLENBQUM7SUFHUCxJQUFJO01BQ0gsaUNBQWlDO01BQ2pDLE1BQU0sYUFBYSxNQUFNLFVBQVUsY0FBYyxDQUFDO1FBQ2pEO1FBQ0E7UUFDQTtRQUNBO09BQ0E7TUFDRCxhQUFhLFdBQVcsT0FBTyxFQUFFLE1BQU07TUFDdkMsYUFDQyxXQUFXLEtBQUssRUFDaEIsV0FDQTtNQUdELGlDQUFpQztNQUNqQyxNQUFNLElBQUksUUFBUSxDQUFDLFVBQVksV0FBVyxTQUFTO01BRW5ELHlCQUF5QjtNQUN6QixNQUFNLGFBQWEsTUFBTSxVQUFVLGNBQWMsQ0FBQztRQUFDO09BQWlCO01BQ3BFLGFBQ0MsV0FBVyxPQUFPLEVBQ2xCLE1BQ0E7TUFFRCxhQUNDLFdBQVcsS0FBSyxFQUNoQixXQUNBO01BR0QsNkNBQTZDO01BQzdDLE1BQU0sT0FBTyxVQUFVLFNBQVMsR0FBRyxPQUFPO01BQzFDLGFBQ0MsS0FBSyxJQUFJLENBQUMsQ0FBQyxNQUFRLElBQUksUUFBUSxDQUFDLHdCQUNoQyxNQUNBO01BR0Qsb0JBQW9CO01BQ3BCLE1BQU0sYUFBYSxNQUFNLFVBQVUsY0FBYyxDQUFDO1FBQUM7T0FBTztNQUMxRCxhQUNDLFdBQVcsT0FBTyxFQUNsQixNQUNBO01BRUQsYUFDQyxXQUFXLEtBQUssRUFDaEIsV0FDQTtJQUVGLEVBQUUsT0FBTyxPQUFPO01BQ2YsTUFBTSxlQUFlLGlCQUFpQixRQUNuQyxNQUFNLE9BQU8sR0FDYixPQUFPO01BQ1YsUUFBUSxLQUFLLENBQUMsZ0JBQWdCO01BQzlCLE1BQU07SUFDUCxTQUFVO01BQ1QsTUFBTSxJQUFJLE9BQU87TUFDakIsTUFBTSxVQUFVLE9BQU87SUFDeEI7RUFDRDtBQUNEO0FBRUEsT0FBTyxlQUFlLHlCQUF5QixDQUFtQjtFQUNqRSxNQUFNLFlBQVksSUFBSTtFQUV0QixNQUFNLEVBQUUsSUFBSSxDQUFDLGdDQUFnQztJQUM1QyxNQUFNLE1BQU0sTUFBTSxVQUFVLHFCQUFxQjtJQUNqRCxVQUFVLFNBQVMsR0FBRyxLQUFLO0lBRTNCLE1BQU0sYUFBYSxNQUFNLElBQUksVUFBVSxDQUN0Qyx1QkFDQSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7UUFpQ0ksQ0FBQztJQUdQLElBQUk7TUFDSCxjQUFjO01BQ2QsTUFBTSxhQUFhLE1BQU0sVUFBVSxjQUFjLENBQUM7UUFDakQ7UUFDQTtRQUNBO1FBQ0E7UUFDQTtPQUNBO01BQ0QsYUFBYSxXQUFXLE9BQU8sRUFBRSxNQUFNO01BRXZDLDJCQUEyQjtNQUMzQixNQUFNLFVBQVUsZUFBZTtNQUUvQiw4QkFBOEI7TUFDOUIsTUFBTSxXQUFXLFVBQVUscUJBQXFCO01BQ2hELFFBQVEsR0FBRyxDQUFDLHVCQUF1QjtNQUVuQyxNQUFNLGdCQUFnQixVQUFVLFVBQVUsQ0FBQztNQUMzQyxhQUNDLGVBQ0EsTUFDQSxDQUFDLHVEQUF1RCxFQUN2RCxTQUFTLElBQUksQ0FBQyxNQUNkLENBQUM7SUFHSCx1Q0FBdUM7SUFDdkMsc0JBQXNCO0lBQ3ZCLEVBQUUsT0FBTyxPQUFPO01BQ2YsUUFBUSxLQUFLLENBQUMsZ0JBQWdCO01BQzlCLFFBQVEsR0FBRyxDQUFDLGdCQUFnQjtRQUMzQixVQUFVLFVBQVUscUJBQXFCO1FBQ3pDLE1BQU0sVUFBVSxTQUFTLEdBQUcsT0FBTztRQUNuQyxXQUFXLFVBQVUsU0FBUyxHQUFHLFNBQVM7UUFDMUMsUUFBUSxVQUFVLFNBQVMsR0FBRyxTQUFTO01BQ3hDO01BQ0EsTUFBTTtJQUNQLFNBQVU7TUFDVCxNQUFNLElBQUksT0FBTztNQUNqQixNQUFNLFVBQVUsT0FBTztJQUN4QjtFQUNEO0FBQ0QifQ==
// denoCacheMetadata=18307519302272852875,16562145785963170833