// tests/plugin_loader.test.ts
import { PluginLoader } from "../src/plugin_loader.ts";
import { CLI } from "../src/core.ts";
import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
Deno.test("PluginLoader - basic plugin loading", async ()=>{
  const cli = new CLI(undefined, true, true);
  const loader = new PluginLoader();
  // Mock plugin as a URL string to avoid filesystem access
  const mockUrl = "data:text/javascript;base64," + btoa(`
        export default {
            metadata: {
                name: "TestPlugin",
                version: "1.0.0",
                description: "A test plugin",
                dependencies: []
            },
            init: (cli) => {
                cli.register({
                    name: "test",
                    description: "Test command",
                    action: () => {}
                });
            }
        };
    `);
  await loader.loadPlugin(mockUrl, cli);
  const plugins = loader.listPlugins();
  assertEquals(plugins.length, 1);
  assertEquals(plugins[0].name, "TestPlugin");
});
Deno.test("PluginLoader - dependency handling", async ()=>{
  const cli = new CLI();
  const loader = new PluginLoader();
  const basePluginUrl = "data:text/javascript;base64," + btoa(`
        export default {
            metadata: {
                name: "BasePlugin",
                version: "1.0.0"
            },
            init: (cli) => {
                cli.register({
                    name: "base",
                    description: "Base command",
                    action: () => {}
                });
            }
        };
    `);
  const dependentPluginUrl = "data:text/javascript;base64," + btoa(`
        export default {
            metadata: {
                name: "DependentPlugin",
                version: "1.0.0",
                dependencies: ["BasePlugin"]
            },
            init: (cli) => {
                cli.register({
                    name: "dependent",
                    description: "Dependent command",
                    action: () => {}
                });
            }
        };
    `);
  await loader.loadPlugin(basePluginUrl, cli);
  await loader.loadPlugin(dependentPluginUrl, cli);
  const plugins = loader.listPlugins();
  assertEquals(plugins.length, 2);
  assertEquals(plugins[0].name, "BasePlugin");
  assertEquals(plugins[1].name, "DependentPlugin");
});
Deno.test("PluginLoader should handle dependencies correctly", async ()=>{
  const cli = new CLI();
  const pluginLoader = new PluginLoader();
  // Define mock plugins as data URLs
  const testPluginUrl = "data:text/javascript;base64," + btoa(`
        export default {
            metadata: {
                name: "TestPlugin",
                version: "1.0.0",
                description: "A test plugin",
                dependencies: []
            },
            init: (cli) => {
                cli.register({
                    name: "test",
                    description: "Test command",
                    action: () => {}
                });
            }
        };
    `);
  const dependentPluginUrl = "data:text/javascript;base64," + btoa(`
        export default {
            metadata: {
                name: "DependentPlugin",
                version: "1.0.0",
                description: "A plugin that depends on TestPlugin",
                dependencies: ["TestPlugin"]
            },
            init: (cli) => {
                cli.register({
                    name: "dependent",
                    description: "Dependent command",
                    action: () => {}
                });
            }
        };
    `);
  // Load TestPlugin first
  await pluginLoader.loadPlugin(testPluginUrl, cli);
  // Then load DependentPlugin
  await pluginLoader.loadPlugin(dependentPluginUrl, cli);
  // Attempt to load DependentPlugin again to test idempotency
  await pluginLoader.loadPlugin(dependentPluginUrl, cli);
  const plugins = pluginLoader.listPlugins();
  assertEquals(plugins.length, 2);
  assertEquals(plugins[0].name, "TestPlugin");
  assertEquals(plugins[1].name, "DependentPlugin");
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9wbHVnaW5fbG9hZGVyLnRlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGVzdHMvcGx1Z2luX2xvYWRlci50ZXN0LnRzXG5pbXBvcnQgeyBQbHVnaW5Mb2FkZXIgfSBmcm9tIFwiLi4vc3JjL3BsdWdpbl9sb2FkZXIudHNcIjtcbmltcG9ydCB7IENMSSB9IGZyb20gXCIuLi9zcmMvY29yZS50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuaW1wb3J0IHR5cGUgeyBQbHVnaW4gfSBmcm9tIFwiLi4vc3JjL3BsdWdpbi50c1wiO1xuXG4vLyBEZWZpbmUgaW50ZXJmYWNlIGZvciBnbG9iYWxUaGlzIGV4dGVuc2lvblxuaW50ZXJmYWNlIEN1c3RvbUdsb2JhbFRoaXMge1xuXHRpbXBvcnQ6IChwYXRoOiBzdHJpbmcpID0+IFByb21pc2U8eyBkZWZhdWx0OiBQbHVnaW4gfT47XG59XG5cbkRlbm8udGVzdChcIlBsdWdpbkxvYWRlciAtIGJhc2ljIHBsdWdpbiBsb2FkaW5nXCIsIGFzeW5jICgpID0+IHtcblx0Y29uc3QgY2xpID0gbmV3IENMSSh1bmRlZmluZWQsIHRydWUsIHRydWUpO1xuXHRjb25zdCBsb2FkZXIgPSBuZXcgUGx1Z2luTG9hZGVyKCk7XG5cblx0Ly8gTW9jayBwbHVnaW4gYXMgYSBVUkwgc3RyaW5nIHRvIGF2b2lkIGZpbGVzeXN0ZW0gYWNjZXNzXG5cdGNvbnN0IG1vY2tVcmwgPSBcImRhdGE6dGV4dC9qYXZhc2NyaXB0O2Jhc2U2NCxcIiArIGJ0b2EoYFxuICAgICAgICBleHBvcnQgZGVmYXVsdCB7XG4gICAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwiVGVzdFBsdWdpblwiLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IFwiMS4wLjBcIixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBIHRlc3QgcGx1Z2luXCIsXG4gICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzOiBbXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluaXQ6IChjbGkpID0+IHtcbiAgICAgICAgICAgICAgICBjbGkucmVnaXN0ZXIoe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcInRlc3RcIixcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVGVzdCBjb21tYW5kXCIsXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogKCkgPT4ge31cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICBgKTtcblxuXHRhd2FpdCBsb2FkZXIubG9hZFBsdWdpbihtb2NrVXJsLCBjbGkpO1xuXHRjb25zdCBwbHVnaW5zID0gbG9hZGVyLmxpc3RQbHVnaW5zKCk7XG5cdGFzc2VydEVxdWFscyhwbHVnaW5zLmxlbmd0aCwgMSk7XG5cdGFzc2VydEVxdWFscyhwbHVnaW5zWzBdLm5hbWUsIFwiVGVzdFBsdWdpblwiKTtcbn0pO1xuXG5EZW5vLnRlc3QoXCJQbHVnaW5Mb2FkZXIgLSBkZXBlbmRlbmN5IGhhbmRsaW5nXCIsIGFzeW5jICgpID0+IHtcblx0Y29uc3QgY2xpID0gbmV3IENMSSgpO1xuXHRjb25zdCBsb2FkZXIgPSBuZXcgUGx1Z2luTG9hZGVyKCk7XG5cblx0Y29uc3QgYmFzZVBsdWdpblVybCA9IFwiZGF0YTp0ZXh0L2phdmFzY3JpcHQ7YmFzZTY0LFwiICsgYnRvYShgXG4gICAgICAgIGV4cG9ydCBkZWZhdWx0IHtcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJCYXNlUGx1Z2luXCIsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogXCIxLjAuMFwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5pdDogKGNsaSkgPT4ge1xuICAgICAgICAgICAgICAgIGNsaS5yZWdpc3Rlcih7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiYmFzZVwiLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJCYXNlIGNvbW1hbmRcIixcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAoKSA9PiB7fVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIGApO1xuXG5cdGNvbnN0IGRlcGVuZGVudFBsdWdpblVybCA9IFwiZGF0YTp0ZXh0L2phdmFzY3JpcHQ7YmFzZTY0LFwiICsgYnRvYShgXG4gICAgICAgIGV4cG9ydCBkZWZhdWx0IHtcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJEZXBlbmRlbnRQbHVnaW5cIixcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBcIjEuMC4wXCIsXG4gICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzOiBbXCJCYXNlUGx1Z2luXCJdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5pdDogKGNsaSkgPT4ge1xuICAgICAgICAgICAgICAgIGNsaS5yZWdpc3Rlcih7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVwZW5kZW50XCIsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkRlcGVuZGVudCBjb21tYW5kXCIsXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogKCkgPT4ge31cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICBgKTtcblxuXHRhd2FpdCBsb2FkZXIubG9hZFBsdWdpbihiYXNlUGx1Z2luVXJsLCBjbGkpO1xuXHRhd2FpdCBsb2FkZXIubG9hZFBsdWdpbihkZXBlbmRlbnRQbHVnaW5VcmwsIGNsaSk7XG5cblx0Y29uc3QgcGx1Z2lucyA9IGxvYWRlci5saXN0UGx1Z2lucygpO1xuXHRhc3NlcnRFcXVhbHMocGx1Z2lucy5sZW5ndGgsIDIpO1xuXHRhc3NlcnRFcXVhbHMocGx1Z2luc1swXS5uYW1lLCBcIkJhc2VQbHVnaW5cIik7XG5cdGFzc2VydEVxdWFscyhwbHVnaW5zWzFdLm5hbWUsIFwiRGVwZW5kZW50UGx1Z2luXCIpO1xufSk7XG5cbkRlbm8udGVzdChcIlBsdWdpbkxvYWRlciBzaG91bGQgaGFuZGxlIGRlcGVuZGVuY2llcyBjb3JyZWN0bHlcIiwgYXN5bmMgKCkgPT4ge1xuXHRjb25zdCBjbGkgPSBuZXcgQ0xJKCk7XG5cdGNvbnN0IHBsdWdpbkxvYWRlciA9IG5ldyBQbHVnaW5Mb2FkZXIoKTtcblxuXHQvLyBEZWZpbmUgbW9jayBwbHVnaW5zIGFzIGRhdGEgVVJMc1xuXHRjb25zdCB0ZXN0UGx1Z2luVXJsID0gXCJkYXRhOnRleHQvamF2YXNjcmlwdDtiYXNlNjQsXCIgKyBidG9hKGBcbiAgICAgICAgZXhwb3J0IGRlZmF1bHQge1xuICAgICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcIlRlc3RQbHVnaW5cIixcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBcIjEuMC4wXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQSB0ZXN0IHBsdWdpblwiLFxuICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llczogW11cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbml0OiAoY2xpKSA9PiB7XG4gICAgICAgICAgICAgICAgY2xpLnJlZ2lzdGVyKHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJ0ZXN0XCIsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlRlc3QgY29tbWFuZFwiLFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICgpID0+IHt9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgYCk7XG5cblx0Y29uc3QgZGVwZW5kZW50UGx1Z2luVXJsID0gXCJkYXRhOnRleHQvamF2YXNjcmlwdDtiYXNlNjQsXCIgKyBidG9hKGBcbiAgICAgICAgZXhwb3J0IGRlZmF1bHQge1xuICAgICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcIkRlcGVuZGVudFBsdWdpblwiLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IFwiMS4wLjBcIixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBIHBsdWdpbiB0aGF0IGRlcGVuZHMgb24gVGVzdFBsdWdpblwiLFxuICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llczogW1wiVGVzdFBsdWdpblwiXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluaXQ6IChjbGkpID0+IHtcbiAgICAgICAgICAgICAgICBjbGkucmVnaXN0ZXIoe1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcImRlcGVuZGVudFwiLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJEZXBlbmRlbnQgY29tbWFuZFwiLFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICgpID0+IHt9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgYCk7XG5cblx0Ly8gTG9hZCBUZXN0UGx1Z2luIGZpcnN0XG5cdGF3YWl0IHBsdWdpbkxvYWRlci5sb2FkUGx1Z2luKHRlc3RQbHVnaW5VcmwsIGNsaSk7XG5cdC8vIFRoZW4gbG9hZCBEZXBlbmRlbnRQbHVnaW5cblx0YXdhaXQgcGx1Z2luTG9hZGVyLmxvYWRQbHVnaW4oZGVwZW5kZW50UGx1Z2luVXJsLCBjbGkpO1xuXHQvLyBBdHRlbXB0IHRvIGxvYWQgRGVwZW5kZW50UGx1Z2luIGFnYWluIHRvIHRlc3QgaWRlbXBvdGVuY3lcblx0YXdhaXQgcGx1Z2luTG9hZGVyLmxvYWRQbHVnaW4oZGVwZW5kZW50UGx1Z2luVXJsLCBjbGkpO1xuXG5cdGNvbnN0IHBsdWdpbnMgPSBwbHVnaW5Mb2FkZXIubGlzdFBsdWdpbnMoKTtcblx0YXNzZXJ0RXF1YWxzKHBsdWdpbnMubGVuZ3RoLCAyKTtcblx0YXNzZXJ0RXF1YWxzKHBsdWdpbnNbMF0ubmFtZSwgXCJUZXN0UGx1Z2luXCIpO1xuXHRhc3NlcnRFcXVhbHMocGx1Z2luc1sxXS5uYW1lLCBcIkRlcGVuZGVudFBsdWdpblwiKTtcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDhCQUE4QjtBQUM5QixTQUFTLFlBQVksUUFBUSwwQkFBMEI7QUFDdkQsU0FBUyxHQUFHLFFBQVEsaUJBQWlCO0FBQ3JDLFNBQVMsWUFBWSxRQUFRLG1EQUFtRDtBQVFoRixLQUFLLElBQUksQ0FBQyx1Q0FBdUM7RUFDaEQsTUFBTSxNQUFNLElBQUksSUFBSSxXQUFXLE1BQU07RUFDckMsTUFBTSxTQUFTLElBQUk7RUFFbkIseURBQXlEO0VBQ3pELE1BQU0sVUFBVSxpQ0FBaUMsS0FBSyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0lBZ0JwRCxDQUFDO0VBRUosTUFBTSxPQUFPLFVBQVUsQ0FBQyxTQUFTO0VBQ2pDLE1BQU0sVUFBVSxPQUFPLFdBQVc7RUFDbEMsYUFBYSxRQUFRLE1BQU0sRUFBRTtFQUM3QixhQUFhLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFO0FBQy9CO0FBRUEsS0FBSyxJQUFJLENBQUMsc0NBQXNDO0VBQy9DLE1BQU0sTUFBTSxJQUFJO0VBQ2hCLE1BQU0sU0FBUyxJQUFJO0VBRW5CLE1BQU0sZ0JBQWdCLGlDQUFpQyxLQUFLLENBQUM7Ozs7Ozs7Ozs7Ozs7O0lBYzFELENBQUM7RUFFSixNQUFNLHFCQUFxQixpQ0FBaUMsS0FBSyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7SUFlL0QsQ0FBQztFQUVKLE1BQU0sT0FBTyxVQUFVLENBQUMsZUFBZTtFQUN2QyxNQUFNLE9BQU8sVUFBVSxDQUFDLG9CQUFvQjtFQUU1QyxNQUFNLFVBQVUsT0FBTyxXQUFXO0VBQ2xDLGFBQWEsUUFBUSxNQUFNLEVBQUU7RUFDN0IsYUFBYSxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRTtFQUM5QixhQUFhLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFO0FBQy9CO0FBRUEsS0FBSyxJQUFJLENBQUMscURBQXFEO0VBQzlELE1BQU0sTUFBTSxJQUFJO0VBQ2hCLE1BQU0sZUFBZSxJQUFJO0VBRXpCLG1DQUFtQztFQUNuQyxNQUFNLGdCQUFnQixpQ0FBaUMsS0FBSyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0lBZ0IxRCxDQUFDO0VBRUosTUFBTSxxQkFBcUIsaUNBQWlDLEtBQUssQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztJQWdCL0QsQ0FBQztFQUVKLHdCQUF3QjtFQUN4QixNQUFNLGFBQWEsVUFBVSxDQUFDLGVBQWU7RUFDN0MsNEJBQTRCO0VBQzVCLE1BQU0sYUFBYSxVQUFVLENBQUMsb0JBQW9CO0VBQ2xELDREQUE0RDtFQUM1RCxNQUFNLGFBQWEsVUFBVSxDQUFDLG9CQUFvQjtFQUVsRCxNQUFNLFVBQVUsYUFBYSxXQUFXO0VBQ3hDLGFBQWEsUUFBUSxNQUFNLEVBQUU7RUFDN0IsYUFBYSxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRTtFQUM5QixhQUFhLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFO0FBQy9CIn0=
// denoCacheMetadata=1105441939016700224,11649216081852117962