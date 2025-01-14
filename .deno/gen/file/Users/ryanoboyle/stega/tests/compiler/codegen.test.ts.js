// /tests/compiler/codegen.test.ts
import { assertEquals } from "@std/assert";
import { CodeGenerator } from "../../src/compiler/codegen.ts";
import { Project, ts } from "https://deno.land/x/ts_morph@17.0.1/mod.ts";
Deno.test("CodeGenerator - generates valid JavaScript", async ()=>{
  // Create project with strict type stripping options
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      emitDecoratorMetadata: false,
      experimentalDecorators: false,
      noEmit: false,
      emitDeclarationOnly: false,
      stripInternal: true,
      isolatedModules: true,
      jsx: ts.JsxEmit.None,
      allowJs: true,
      checkJs: false
    }
  });
  const sourceFile = project.createSourceFile("test.ts", `
        export function hello(name: string): void {
            console.log(\`Hello \${name}\`);
        }
        `);
  // Manual type stripping before code generation
  const stripped = project.createSourceFile("stripped.ts", sourceFile.getFullText(), {
    overwrite: true,
    scriptKind: ts.ScriptKind.JS
  });
  stripped.getFunctions().forEach((func)=>{
    func.getParameters().forEach((param)=>{
      param.removeType();
    });
    func.removeReturnType();
  });
  // Create code generator with strict options
  const generator = new CodeGenerator({
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    experimentalDecorators: false,
    treeshake: true,
    sourceMaps: false,
    minify: false,
    entryPoint: "",
    outDir: "",
    plugins: [],
    platform: "browser",
    externals: [],
    define: {},
    format: "es6",
    emitDecoratorMetadata: false
  });
  const result = await generator.generate({
    ast: stripped,
    modules: new Map()
  }, {
    sourceMaps: false,
    minify: false,
    target: "es2020",
    format: "es6"
  });
  // Pre-process the code by removing whitespace
  const normalizedCode = result.code.replace(/\s+/g, " ").trim();
  console.log("Generated code:", normalizedCode);
  // Test for absence of type annotations
  assertEquals(normalizedCode.includes(": string") || normalizedCode.includes(": void") || normalizedCode.includes(": any"), false, "Generated code should not contain TypeScript type annotations");
  // Test for correct JavaScript output
  assertEquals(normalizedCode.includes("export function hello(name)"), true, "Generated code should contain function declaration without type annotations");
  assertEquals(normalizedCode.includes("console.log(`Hello ${name}`)"), true, "Generated code should contain template literal");
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9jb21waWxlci9jb2RlZ2VuLnRlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gL3Rlc3RzL2NvbXBpbGVyL2NvZGVnZW4udGVzdC50c1xuXG5pbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbmltcG9ydCB7IENvZGVHZW5lcmF0b3IgfSBmcm9tIFwiLi4vLi4vc3JjL2NvbXBpbGVyL2NvZGVnZW4udHNcIjtcbmltcG9ydCB7IFByb2plY3QsIHRzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3gvdHNfbW9ycGhAMTcuMC4xL21vZC50c1wiO1xuXG5EZW5vLnRlc3QoXCJDb2RlR2VuZXJhdG9yIC0gZ2VuZXJhdGVzIHZhbGlkIEphdmFTY3JpcHRcIiwgYXN5bmMgKCkgPT4ge1xuXHQvLyBDcmVhdGUgcHJvamVjdCB3aXRoIHN0cmljdCB0eXBlIHN0cmlwcGluZyBvcHRpb25zXG5cdGNvbnN0IHByb2plY3QgPSBuZXcgUHJvamVjdCh7XG5cdFx0dXNlSW5NZW1vcnlGaWxlU3lzdGVtOiB0cnVlLFxuXHRcdGNvbXBpbGVyT3B0aW9uczoge1xuXHRcdFx0dGFyZ2V0OiB0cy5TY3JpcHRUYXJnZXQuRVMyMDIwLFxuXHRcdFx0bW9kdWxlOiB0cy5Nb2R1bGVLaW5kLkVTTmV4dCxcblx0XHRcdGVtaXREZWNvcmF0b3JNZXRhZGF0YTogZmFsc2UsXG5cdFx0XHRleHBlcmltZW50YWxEZWNvcmF0b3JzOiBmYWxzZSxcblx0XHRcdG5vRW1pdDogZmFsc2UsXG5cdFx0XHRlbWl0RGVjbGFyYXRpb25Pbmx5OiBmYWxzZSxcblx0XHRcdHN0cmlwSW50ZXJuYWw6IHRydWUsXG5cdFx0XHRpc29sYXRlZE1vZHVsZXM6IHRydWUsXG5cdFx0XHRqc3g6IHRzLkpzeEVtaXQuTm9uZSxcblx0XHRcdGFsbG93SnM6IHRydWUsXG5cdFx0XHRjaGVja0pzOiBmYWxzZSxcblx0XHR9LFxuXHR9KTtcblxuXHRjb25zdCBzb3VyY2VGaWxlID0gcHJvamVjdC5jcmVhdGVTb3VyY2VGaWxlKFxuXHRcdFwidGVzdC50c1wiLFxuXHRcdGBcbiAgICAgICAgZXhwb3J0IGZ1bmN0aW9uIGhlbGxvKG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXFxgSGVsbG8gXFwke25hbWV9XFxgKTtcbiAgICAgICAgfVxuICAgICAgICBgLFxuXHQpO1xuXG5cdC8vIE1hbnVhbCB0eXBlIHN0cmlwcGluZyBiZWZvcmUgY29kZSBnZW5lcmF0aW9uXG5cdGNvbnN0IHN0cmlwcGVkID0gcHJvamVjdC5jcmVhdGVTb3VyY2VGaWxlKFxuXHRcdFwic3RyaXBwZWQudHNcIixcblx0XHRzb3VyY2VGaWxlLmdldEZ1bGxUZXh0KCksXG5cdFx0eyBvdmVyd3JpdGU6IHRydWUsIHNjcmlwdEtpbmQ6IHRzLlNjcmlwdEtpbmQuSlMgfSxcblx0KTtcblxuXHRzdHJpcHBlZC5nZXRGdW5jdGlvbnMoKS5mb3JFYWNoKChmdW5jKSA9PiB7XG5cdFx0ZnVuYy5nZXRQYXJhbWV0ZXJzKCkuZm9yRWFjaCgocGFyYW0pID0+IHtcblx0XHRcdHBhcmFtLnJlbW92ZVR5cGUoKTtcblx0XHR9KTtcblx0XHRmdW5jLnJlbW92ZVJldHVyblR5cGUoKTtcblx0fSk7XG5cblx0Ly8gQ3JlYXRlIGNvZGUgZ2VuZXJhdG9yIHdpdGggc3RyaWN0IG9wdGlvbnNcblx0Y29uc3QgZ2VuZXJhdG9yID0gbmV3IENvZGVHZW5lcmF0b3Ioe1xuXHRcdHRhcmdldDogdHMuU2NyaXB0VGFyZ2V0LkVTMjAyMCxcblx0XHRtb2R1bGU6IHRzLk1vZHVsZUtpbmQuRVNOZXh0LFxuXHRcdGV4cGVyaW1lbnRhbERlY29yYXRvcnM6IGZhbHNlLFxuXHRcdHRyZWVzaGFrZTogdHJ1ZSxcblx0XHRzb3VyY2VNYXBzOiBmYWxzZSxcblx0XHRtaW5pZnk6IGZhbHNlLFxuXHRcdGVudHJ5UG9pbnQ6IFwiXCIsXG5cdFx0b3V0RGlyOiBcIlwiLFxuXHRcdHBsdWdpbnM6IFtdLFxuXHRcdHBsYXRmb3JtOiBcImJyb3dzZXJcIixcblx0XHRleHRlcm5hbHM6IFtdLFxuXHRcdGRlZmluZToge30sXG5cdFx0Zm9ybWF0OiBcImVzNlwiLFxuXHRcdGVtaXREZWNvcmF0b3JNZXRhZGF0YTogZmFsc2UsXG5cdH0pO1xuXG5cdGNvbnN0IHJlc3VsdCA9IGF3YWl0IGdlbmVyYXRvci5nZW5lcmF0ZShcblx0XHR7IGFzdDogc3RyaXBwZWQsIG1vZHVsZXM6IG5ldyBNYXAoKSB9LFxuXHRcdHtcblx0XHRcdHNvdXJjZU1hcHM6IGZhbHNlLFxuXHRcdFx0bWluaWZ5OiBmYWxzZSxcblx0XHRcdHRhcmdldDogXCJlczIwMjBcIixcblx0XHRcdGZvcm1hdDogXCJlczZcIixcblx0XHR9LFxuXHQpO1xuXG5cdC8vIFByZS1wcm9jZXNzIHRoZSBjb2RlIGJ5IHJlbW92aW5nIHdoaXRlc3BhY2Vcblx0Y29uc3Qgbm9ybWFsaXplZENvZGUgPSByZXN1bHQuY29kZVxuXHRcdC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuXHRcdC50cmltKCk7XG5cblx0Y29uc29sZS5sb2coXCJHZW5lcmF0ZWQgY29kZTpcIiwgbm9ybWFsaXplZENvZGUpO1xuXG5cdC8vIFRlc3QgZm9yIGFic2VuY2Ugb2YgdHlwZSBhbm5vdGF0aW9uc1xuXHRhc3NlcnRFcXVhbHMoXG5cdFx0bm9ybWFsaXplZENvZGUuaW5jbHVkZXMoXCI6IHN0cmluZ1wiKSB8fFxuXHRcdFx0bm9ybWFsaXplZENvZGUuaW5jbHVkZXMoXCI6IHZvaWRcIikgfHxcblx0XHRcdG5vcm1hbGl6ZWRDb2RlLmluY2x1ZGVzKFwiOiBhbnlcIiksXG5cdFx0ZmFsc2UsXG5cdFx0XCJHZW5lcmF0ZWQgY29kZSBzaG91bGQgbm90IGNvbnRhaW4gVHlwZVNjcmlwdCB0eXBlIGFubm90YXRpb25zXCIsXG5cdCk7XG5cblx0Ly8gVGVzdCBmb3IgY29ycmVjdCBKYXZhU2NyaXB0IG91dHB1dFxuXHRhc3NlcnRFcXVhbHMoXG5cdFx0bm9ybWFsaXplZENvZGUuaW5jbHVkZXMoXCJleHBvcnQgZnVuY3Rpb24gaGVsbG8obmFtZSlcIiksXG5cdFx0dHJ1ZSxcblx0XHRcIkdlbmVyYXRlZCBjb2RlIHNob3VsZCBjb250YWluIGZ1bmN0aW9uIGRlY2xhcmF0aW9uIHdpdGhvdXQgdHlwZSBhbm5vdGF0aW9uc1wiLFxuXHQpO1xuXG5cdGFzc2VydEVxdWFscyhcblx0XHRub3JtYWxpemVkQ29kZS5pbmNsdWRlcyhcImNvbnNvbGUubG9nKGBIZWxsbyAke25hbWV9YClcIiksXG5cdFx0dHJ1ZSxcblx0XHRcIkdlbmVyYXRlZCBjb2RlIHNob3VsZCBjb250YWluIHRlbXBsYXRlIGxpdGVyYWxcIixcblx0KTtcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGtDQUFrQztBQUVsQyxTQUFTLFlBQVksUUFBUSxjQUFjO0FBQzNDLFNBQVMsYUFBYSxRQUFRLGdDQUFnQztBQUM5RCxTQUFTLE9BQU8sRUFBRSxFQUFFLFFBQVEsNkNBQTZDO0FBRXpFLEtBQUssSUFBSSxDQUFDLDhDQUE4QztFQUN2RCxvREFBb0Q7RUFDcEQsTUFBTSxVQUFVLElBQUksUUFBUTtJQUMzQix1QkFBdUI7SUFDdkIsaUJBQWlCO01BQ2hCLFFBQVEsR0FBRyxZQUFZLENBQUMsTUFBTTtNQUM5QixRQUFRLEdBQUcsVUFBVSxDQUFDLE1BQU07TUFDNUIsdUJBQXVCO01BQ3ZCLHdCQUF3QjtNQUN4QixRQUFRO01BQ1IscUJBQXFCO01BQ3JCLGVBQWU7TUFDZixpQkFBaUI7TUFDakIsS0FBSyxHQUFHLE9BQU8sQ0FBQyxJQUFJO01BQ3BCLFNBQVM7TUFDVCxTQUFTO0lBQ1Y7RUFDRDtFQUVBLE1BQU0sYUFBYSxRQUFRLGdCQUFnQixDQUMxQyxXQUNBLENBQUM7Ozs7UUFJSyxDQUFDO0VBR1IsK0NBQStDO0VBQy9DLE1BQU0sV0FBVyxRQUFRLGdCQUFnQixDQUN4QyxlQUNBLFdBQVcsV0FBVyxJQUN0QjtJQUFFLFdBQVc7SUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLEVBQUU7RUFBQztFQUdqRCxTQUFTLFlBQVksR0FBRyxPQUFPLENBQUMsQ0FBQztJQUNoQyxLQUFLLGFBQWEsR0FBRyxPQUFPLENBQUMsQ0FBQztNQUM3QixNQUFNLFVBQVU7SUFDakI7SUFDQSxLQUFLLGdCQUFnQjtFQUN0QjtFQUVBLDRDQUE0QztFQUM1QyxNQUFNLFlBQVksSUFBSSxjQUFjO0lBQ25DLFFBQVEsR0FBRyxZQUFZLENBQUMsTUFBTTtJQUM5QixRQUFRLEdBQUcsVUFBVSxDQUFDLE1BQU07SUFDNUIsd0JBQXdCO0lBQ3hCLFdBQVc7SUFDWCxZQUFZO0lBQ1osUUFBUTtJQUNSLFlBQVk7SUFDWixRQUFRO0lBQ1IsU0FBUyxFQUFFO0lBQ1gsVUFBVTtJQUNWLFdBQVcsRUFBRTtJQUNiLFFBQVEsQ0FBQztJQUNULFFBQVE7SUFDUix1QkFBdUI7RUFDeEI7RUFFQSxNQUFNLFNBQVMsTUFBTSxVQUFVLFFBQVEsQ0FDdEM7SUFBRSxLQUFLO0lBQVUsU0FBUyxJQUFJO0VBQU0sR0FDcEM7SUFDQyxZQUFZO0lBQ1osUUFBUTtJQUNSLFFBQVE7SUFDUixRQUFRO0VBQ1Q7RUFHRCw4Q0FBOEM7RUFDOUMsTUFBTSxpQkFBaUIsT0FBTyxJQUFJLENBQ2hDLE9BQU8sQ0FBQyxRQUFRLEtBQ2hCLElBQUk7RUFFTixRQUFRLEdBQUcsQ0FBQyxtQkFBbUI7RUFFL0IsdUNBQXVDO0VBQ3ZDLGFBQ0MsZUFBZSxRQUFRLENBQUMsZUFDdkIsZUFBZSxRQUFRLENBQUMsYUFDeEIsZUFBZSxRQUFRLENBQUMsVUFDekIsT0FDQTtFQUdELHFDQUFxQztFQUNyQyxhQUNDLGVBQWUsUUFBUSxDQUFDLGdDQUN4QixNQUNBO0VBR0QsYUFDQyxlQUFlLFFBQVEsQ0FBQyxpQ0FDeEIsTUFDQTtBQUVGIn0=
// denoCacheMetadata=16415024851189149660,372656503539418464