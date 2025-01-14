// tests/transformer.test.ts
import { assertEquals } from "@std/assert";
import { Transformer } from "../../src/compiler/transformer.ts";
import { Project, ts } from "https://deno.land/x/ts_morph@17.0.1/mod.ts";
Deno.test("Transformer - removes TypeScript types", ()=>{
  const project = new Project({
    useInMemoryFileSystem: true
  });
  const sourceFile = project.createSourceFile("test.ts", `
        interface Test {
            foo: string;
        }
        
        function hello(name: string): void {
            console.log(name);
        }
        `);
  const transformer = new Transformer({
    experimentalDecorators: false,
    entryPoint: "",
    outDir: "",
    sourceMaps: false,
    minify: false,
    target: ts.ScriptTarget.ES2020,
    plugins: [],
    module: ts.ModuleKind.ES2015,
    platform: "browser",
    externals: [],
    define: {},
    treeshake: true,
    format: "es6"
  });
  const result = transformer.transform({
    ast: sourceFile,
    path: "test.ts"
  });
  const transformedCode = result.ast.getText();
  assertEquals(transformedCode.includes("interface"), false);
  assertEquals(transformedCode.includes(": string"), false);
  assertEquals(transformedCode.includes(": void"), false);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9jb21waWxlci90cmFuc2Zvcm1lci50ZXN0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHRlc3RzL3RyYW5zZm9ybWVyLnRlc3QudHNcbmltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuaW1wb3J0IHsgVHJhbnNmb3JtZXIgfSBmcm9tIFwiLi4vLi4vc3JjL2NvbXBpbGVyL3RyYW5zZm9ybWVyLnRzXCI7XG5pbXBvcnQgeyBQcm9qZWN0LCB0cyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC94L3RzX21vcnBoQDE3LjAuMS9tb2QudHNcIjtcblxuRGVuby50ZXN0KFwiVHJhbnNmb3JtZXIgLSByZW1vdmVzIFR5cGVTY3JpcHQgdHlwZXNcIiwgKCkgPT4ge1xuXHRjb25zdCBwcm9qZWN0ID0gbmV3IFByb2plY3Qoe1xuXHRcdHVzZUluTWVtb3J5RmlsZVN5c3RlbTogdHJ1ZSxcblx0fSk7XG5cblx0Y29uc3Qgc291cmNlRmlsZSA9IHByb2plY3QuY3JlYXRlU291cmNlRmlsZShcblx0XHRcInRlc3QudHNcIixcblx0XHRgXG4gICAgICAgIGludGVyZmFjZSBUZXN0IHtcbiAgICAgICAgICAgIGZvbzogc3RyaW5nO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmdW5jdGlvbiBoZWxsbyhuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGAsXG5cdCk7XG5cblx0Y29uc3QgdHJhbnNmb3JtZXIgPSBuZXcgVHJhbnNmb3JtZXIoe1xuXHRcdGV4cGVyaW1lbnRhbERlY29yYXRvcnM6IGZhbHNlLFxuXHRcdGVudHJ5UG9pbnQ6IFwiXCIsXG5cdFx0b3V0RGlyOiBcIlwiLFxuXHRcdHNvdXJjZU1hcHM6IGZhbHNlLFxuXHRcdG1pbmlmeTogZmFsc2UsXG5cdFx0dGFyZ2V0OiB0cy5TY3JpcHRUYXJnZXQuRVMyMDIwLFxuXHRcdHBsdWdpbnM6IFtdLFxuXHRcdG1vZHVsZTogdHMuTW9kdWxlS2luZC5FUzIwMTUsXG5cdFx0cGxhdGZvcm06IFwiYnJvd3NlclwiLFxuXHRcdGV4dGVybmFsczogW10sXG5cdFx0ZGVmaW5lOiB7fSxcblx0XHR0cmVlc2hha2U6IHRydWUsXG5cdFx0Zm9ybWF0OiBcImVzNlwiLCAvLyBBZGQgcmVxdWlyZWQgZm9ybWF0IGZpZWxkXG5cdH0pO1xuXG5cdGNvbnN0IHJlc3VsdCA9IHRyYW5zZm9ybWVyLnRyYW5zZm9ybSh7IGFzdDogc291cmNlRmlsZSwgcGF0aDogXCJ0ZXN0LnRzXCIgfSk7XG5cdGNvbnN0IHRyYW5zZm9ybWVkQ29kZSA9IHJlc3VsdC5hc3QuZ2V0VGV4dCgpO1xuXG5cdGFzc2VydEVxdWFscyh0cmFuc2Zvcm1lZENvZGUuaW5jbHVkZXMoXCJpbnRlcmZhY2VcIiksIGZhbHNlKTtcblx0YXNzZXJ0RXF1YWxzKHRyYW5zZm9ybWVkQ29kZS5pbmNsdWRlcyhcIjogc3RyaW5nXCIpLCBmYWxzZSk7XG5cdGFzc2VydEVxdWFscyh0cmFuc2Zvcm1lZENvZGUuaW5jbHVkZXMoXCI6IHZvaWRcIiksIGZhbHNlKTtcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDRCQUE0QjtBQUM1QixTQUFTLFlBQVksUUFBUSxjQUFjO0FBQzNDLFNBQVMsV0FBVyxRQUFRLG9DQUFvQztBQUNoRSxTQUFTLE9BQU8sRUFBRSxFQUFFLFFBQVEsNkNBQTZDO0FBRXpFLEtBQUssSUFBSSxDQUFDLDBDQUEwQztFQUNuRCxNQUFNLFVBQVUsSUFBSSxRQUFRO0lBQzNCLHVCQUF1QjtFQUN4QjtFQUVBLE1BQU0sYUFBYSxRQUFRLGdCQUFnQixDQUMxQyxXQUNBLENBQUM7Ozs7Ozs7O1FBUUssQ0FBQztFQUdSLE1BQU0sY0FBYyxJQUFJLFlBQVk7SUFDbkMsd0JBQXdCO0lBQ3hCLFlBQVk7SUFDWixRQUFRO0lBQ1IsWUFBWTtJQUNaLFFBQVE7SUFDUixRQUFRLEdBQUcsWUFBWSxDQUFDLE1BQU07SUFDOUIsU0FBUyxFQUFFO0lBQ1gsUUFBUSxHQUFHLFVBQVUsQ0FBQyxNQUFNO0lBQzVCLFVBQVU7SUFDVixXQUFXLEVBQUU7SUFDYixRQUFRLENBQUM7SUFDVCxXQUFXO0lBQ1gsUUFBUTtFQUNUO0VBRUEsTUFBTSxTQUFTLFlBQVksU0FBUyxDQUFDO0lBQUUsS0FBSztJQUFZLE1BQU07RUFBVTtFQUN4RSxNQUFNLGtCQUFrQixPQUFPLEdBQUcsQ0FBQyxPQUFPO0VBRTFDLGFBQWEsZ0JBQWdCLFFBQVEsQ0FBQyxjQUFjO0VBQ3BELGFBQWEsZ0JBQWdCLFFBQVEsQ0FBQyxhQUFhO0VBQ25ELGFBQWEsZ0JBQWdCLFFBQVEsQ0FBQyxXQUFXO0FBQ2xEIn0=
// denoCacheMetadata=539259866972612948,1128313766730852247