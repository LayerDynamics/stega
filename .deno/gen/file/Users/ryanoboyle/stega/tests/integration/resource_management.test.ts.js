import { assertEquals } from "@std/assert";
import { createTestCLI } from "../test_utils.ts";
Deno.test("Resource Management Integration Tests", async (t)=>{
  const { cli, logger } = await createTestCLI();
  let tempPath;
  try {
    await t.step("file resource handling", async ()=>{
      tempPath = await Deno.makeTempFile();
      await Deno.writeTextFile(tempPath, "test content");
      cli.register({
        name: "read-file",
        action: async ()=>{
          const content = await Deno.readTextFile(tempPath);
          console.log(content);
        // Don't return anything
        }
      });
      await cli.runCommand([
        "read-file"
      ]);
      assertEquals(logger.errors.length, 0);
    });
  } finally{
    await Deno.remove(tempPath);
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9pbnRlZ3JhdGlvbi9yZXNvdXJjZV9tYW5hZ2VtZW50LnRlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGVzdEZyYW1ld29yayB9IGZyb20gXCIuLi91dGlscy90ZXN0X2ZyYW1ld29yay50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0RXF1YWxzLCBhc3NlcnRFeGlzdHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbmltcG9ydCB7IGNyZWF0ZVRlc3RDTEkgfSBmcm9tIFwiLi4vdGVzdF91dGlscy50c1wiO1xuXG5EZW5vLnRlc3QoXCJSZXNvdXJjZSBNYW5hZ2VtZW50IEludGVncmF0aW9uIFRlc3RzXCIsIGFzeW5jICh0KSA9PiB7XG5cdGNvbnN0IHsgY2xpLCBsb2dnZXIgfSA9IGF3YWl0IGNyZWF0ZVRlc3RDTEkoKTtcblx0bGV0IHRlbXBQYXRoOiBzdHJpbmc7XG5cblx0dHJ5IHtcblx0XHRhd2FpdCB0LnN0ZXAoXCJmaWxlIHJlc291cmNlIGhhbmRsaW5nXCIsIGFzeW5jICgpID0+IHtcblx0XHRcdHRlbXBQYXRoID0gYXdhaXQgRGVuby5tYWtlVGVtcEZpbGUoKTtcblx0XHRcdGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZSh0ZW1wUGF0aCwgXCJ0ZXN0IGNvbnRlbnRcIik7XG5cblx0XHRcdGNsaS5yZWdpc3Rlcih7XG5cdFx0XHRcdG5hbWU6IFwicmVhZC1maWxlXCIsXG5cdFx0XHRcdGFjdGlvbjogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBEZW5vLnJlYWRUZXh0RmlsZSh0ZW1wUGF0aCk7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coY29udGVudCk7XG5cdFx0XHRcdFx0Ly8gRG9uJ3QgcmV0dXJuIGFueXRoaW5nXG5cdFx0XHRcdH0sXG5cdFx0XHR9KTtcblxuXHRcdFx0YXdhaXQgY2xpLnJ1bkNvbW1hbmQoW1wicmVhZC1maWxlXCJdKTtcblx0XHRcdGFzc2VydEVxdWFscyhsb2dnZXIuZXJyb3JzLmxlbmd0aCwgMCk7XG5cdFx0fSk7XG5cdH0gZmluYWxseSB7XG5cdFx0YXdhaXQgRGVuby5yZW1vdmUodGVtcFBhdGghKTtcblx0fVxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBUyxZQUFZLFFBQXNCLGNBQWM7QUFDekQsU0FBUyxhQUFhLFFBQVEsbUJBQW1CO0FBRWpELEtBQUssSUFBSSxDQUFDLHlDQUF5QyxPQUFPO0VBQ3pELE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUcsTUFBTTtFQUM5QixJQUFJO0VBRUosSUFBSTtJQUNILE1BQU0sRUFBRSxJQUFJLENBQUMsMEJBQTBCO01BQ3RDLFdBQVcsTUFBTSxLQUFLLFlBQVk7TUFDbEMsTUFBTSxLQUFLLGFBQWEsQ0FBQyxVQUFVO01BRW5DLElBQUksUUFBUSxDQUFDO1FBQ1osTUFBTTtRQUNOLFFBQVE7VUFDUCxNQUFNLFVBQVUsTUFBTSxLQUFLLFlBQVksQ0FBQztVQUN4QyxRQUFRLEdBQUcsQ0FBQztRQUNaLHdCQUF3QjtRQUN6QjtNQUNEO01BRUEsTUFBTSxJQUFJLFVBQVUsQ0FBQztRQUFDO09BQVk7TUFDbEMsYUFBYSxPQUFPLE1BQU0sQ0FBQyxNQUFNLEVBQUU7SUFDcEM7RUFDRCxTQUFVO0lBQ1QsTUFBTSxLQUFLLE1BQU0sQ0FBQztFQUNuQjtBQUNEIn0=
// denoCacheMetadata=12450863195137717473,17257423740615178769