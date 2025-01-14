// tests/e2e/scenarios/plugin_workflow.test.ts
import { assertEquals } from "@std/assert";
import { createTestCLI } from "../../test_utils.ts";
Deno.test("E2E - Plugin and Workflow Integration", async (t)=>{
  await t.step("loads plugin and executes workflow", async ()=>{
    const { cli, logger } = await createTestCLI();
    const pluginContent = `
            import { CLI } from "${import.meta.resolve("../../../src/core.ts")}";
            
            const plugin = {
                metadata: {
                    name: "test-plugin",
                    version: "1.0.0"
                },
                init: async (cli: CLI) => {
                    cli.register({
                        name: "test-command",
                        action: () => {
                            console.log("Plugin command executed");
                        }
                    });
                    console.log("Plugin initialized");
                }
            };
            
            export default plugin;
        `;
    const pluginPath = await Deno.makeTempFile({
      suffix: ".ts"
    });
    await Deno.writeTextFile(pluginPath, pluginContent);
    try {
      await cli.loadPlugins([
        pluginPath
      ]);
      await cli.runCommand([
        "test-command"
      ]);
      assertEquals(logger.errors.length, 0, "Should have no errors");
    } finally{
      await Deno.remove(pluginPath);
    }
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9lMmUvc2NlbmFyaW9zL3BsdWdpbl93b3JrZmxvdy50ZXN0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHRlc3RzL2UyZS9zY2VuYXJpb3MvcGx1Z2luX3dvcmtmbG93LnRlc3QudHNcbmltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuaW1wb3J0IHsgY3JlYXRlVGVzdENMSSB9IGZyb20gXCIuLi8uLi90ZXN0X3V0aWxzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IENMSSB9IGZyb20gXCIuLi8uLi8uLi9zcmMvY29yZS50c1wiO1xuXG5EZW5vLnRlc3QoXCJFMkUgLSBQbHVnaW4gYW5kIFdvcmtmbG93IEludGVncmF0aW9uXCIsIGFzeW5jICh0KSA9PiB7XG5cdGF3YWl0IHQuc3RlcChcImxvYWRzIHBsdWdpbiBhbmQgZXhlY3V0ZXMgd29ya2Zsb3dcIiwgYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IHsgY2xpLCBsb2dnZXIgfSA9IGF3YWl0IGNyZWF0ZVRlc3RDTEkoKTtcblxuXHRcdGNvbnN0IHBsdWdpbkNvbnRlbnQgPSBgXG4gICAgICAgICAgICBpbXBvcnQgeyBDTEkgfSBmcm9tIFwiJHtcblx0XHRcdGltcG9ydC5tZXRhLnJlc29sdmUoXCIuLi8uLi8uLi9zcmMvY29yZS50c1wiKVxuXHRcdH1cIjtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgcGx1Z2luID0ge1xuICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwidGVzdC1wbHVnaW5cIixcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogXCIxLjAuMFwiXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBpbml0OiBhc3luYyAoY2xpOiBDTEkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY2xpLnJlZ2lzdGVyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwidGVzdC1jb21tYW5kXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBsdWdpbiBjb21tYW5kIGV4ZWN1dGVkXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJQbHVnaW4gaW5pdGlhbGl6ZWRcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZXhwb3J0IGRlZmF1bHQgcGx1Z2luO1xuICAgICAgICBgO1xuXG5cdFx0Y29uc3QgcGx1Z2luUGF0aCA9IGF3YWl0IERlbm8ubWFrZVRlbXBGaWxlKHsgc3VmZml4OiBcIi50c1wiIH0pO1xuXHRcdGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShwbHVnaW5QYXRoLCBwbHVnaW5Db250ZW50KTtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBjbGkubG9hZFBsdWdpbnMoW3BsdWdpblBhdGhdKTtcblx0XHRcdGF3YWl0IGNsaS5ydW5Db21tYW5kKFtcInRlc3QtY29tbWFuZFwiXSk7XG5cdFx0XHRhc3NlcnRFcXVhbHMobG9nZ2VyLmVycm9ycy5sZW5ndGgsIDAsIFwiU2hvdWxkIGhhdmUgbm8gZXJyb3JzXCIpO1xuXHRcdH0gZmluYWxseSB7XG5cdFx0XHRhd2FpdCBEZW5vLnJlbW92ZShwbHVnaW5QYXRoKTtcblx0XHR9XG5cdH0pO1xufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsOENBQThDO0FBQzlDLFNBQVMsWUFBWSxRQUFRLGNBQWM7QUFDM0MsU0FBUyxhQUFhLFFBQVEsc0JBQXNCO0FBR3BELEtBQUssSUFBSSxDQUFDLHlDQUF5QyxPQUFPO0VBQ3pELE1BQU0sRUFBRSxJQUFJLENBQUMsc0NBQXNDO0lBQ2xELE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUcsTUFBTTtJQUU5QixNQUFNLGdCQUFnQixDQUFDO2lDQUNRLEVBQzlCLFlBQVksT0FBTyxDQUFDLHdCQUNwQjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQW1CSyxDQUFDO0lBRVAsTUFBTSxhQUFhLE1BQU0sS0FBSyxZQUFZLENBQUM7TUFBRSxRQUFRO0lBQU07SUFDM0QsTUFBTSxLQUFLLGFBQWEsQ0FBQyxZQUFZO0lBRXJDLElBQUk7TUFDSCxNQUFNLElBQUksV0FBVyxDQUFDO1FBQUM7T0FBVztNQUNsQyxNQUFNLElBQUksVUFBVSxDQUFDO1FBQUM7T0FBZTtNQUNyQyxhQUFhLE9BQU8sTUFBTSxDQUFDLE1BQU0sRUFBRSxHQUFHO0lBQ3ZDLFNBQVU7TUFDVCxNQUFNLEtBQUssTUFBTSxDQUFDO0lBQ25CO0VBQ0Q7QUFDRCJ9
// denoCacheMetadata=15779506035945635473,9089546511682210230