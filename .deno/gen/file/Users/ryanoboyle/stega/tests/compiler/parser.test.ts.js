// tests/compiler/parserf.test.ts
import { assertEquals } from "@std/assert";
import { Parser } from "../../src/compiler/parser.ts";
Deno.test("Parser - parses TypeScript code correctly", ()=>{
  const parser = new Parser();
  const code = `
        import { foo } from './bar';
        
        export function hello(): void {
            console.log('Hello');
        }
    `;
  const result = parser.parse(code, "test.ts");
  // Import './bar' will cause an error since the file doesn't exist
  assertEquals(result.errors.length, 1);
  assertEquals(result.dependencies.length, 1);
  assertEquals(result.dependencies[0], "./bar");
});
Deno.test("Parser - handles syntax errors", ()=>{
  const parser = new Parser();
  const invalidCode = `
        import { foo from './bar';  // Missing closing brace
        
        export function hello(): void {
            console.log('Hello');
        }
    `;
  const result = parser.parse(invalidCode, "test.ts");
  assertEquals(result.errors.length > 0, true);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9jb21waWxlci9wYXJzZXIudGVzdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0ZXN0cy9jb21waWxlci9wYXJzZXJmLnRlc3QudHNcbmltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuaW1wb3J0IHsgUGFyc2VyIH0gZnJvbSBcIi4uLy4uL3NyYy9jb21waWxlci9wYXJzZXIudHNcIjtcblxuRGVuby50ZXN0KFwiUGFyc2VyIC0gcGFyc2VzIFR5cGVTY3JpcHQgY29kZSBjb3JyZWN0bHlcIiwgKCkgPT4ge1xuXHRjb25zdCBwYXJzZXIgPSBuZXcgUGFyc2VyKCk7XG5cdGNvbnN0IGNvZGUgPSBgXG4gICAgICAgIGltcG9ydCB7IGZvbyB9IGZyb20gJy4vYmFyJztcbiAgICAgICAgXG4gICAgICAgIGV4cG9ydCBmdW5jdGlvbiBoZWxsbygpOiB2b2lkIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdIZWxsbycpO1xuICAgICAgICB9XG4gICAgYDtcblxuXHRjb25zdCByZXN1bHQgPSBwYXJzZXIucGFyc2UoY29kZSwgXCJ0ZXN0LnRzXCIpO1xuXHQvLyBJbXBvcnQgJy4vYmFyJyB3aWxsIGNhdXNlIGFuIGVycm9yIHNpbmNlIHRoZSBmaWxlIGRvZXNuJ3QgZXhpc3Rcblx0YXNzZXJ0RXF1YWxzKHJlc3VsdC5lcnJvcnMubGVuZ3RoLCAxKTtcblx0YXNzZXJ0RXF1YWxzKHJlc3VsdC5kZXBlbmRlbmNpZXMubGVuZ3RoLCAxKTtcblx0YXNzZXJ0RXF1YWxzKHJlc3VsdC5kZXBlbmRlbmNpZXNbMF0sIFwiLi9iYXJcIik7XG59KTtcblxuRGVuby50ZXN0KFwiUGFyc2VyIC0gaGFuZGxlcyBzeW50YXggZXJyb3JzXCIsICgpID0+IHtcblx0Y29uc3QgcGFyc2VyID0gbmV3IFBhcnNlcigpO1xuXHRjb25zdCBpbnZhbGlkQ29kZSA9IGBcbiAgICAgICAgaW1wb3J0IHsgZm9vIGZyb20gJy4vYmFyJzsgIC8vIE1pc3NpbmcgY2xvc2luZyBicmFjZVxuICAgICAgICBcbiAgICAgICAgZXhwb3J0IGZ1bmN0aW9uIGhlbGxvKCk6IHZvaWQge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0hlbGxvJyk7XG4gICAgICAgIH1cbiAgICBgO1xuXG5cdGNvbnN0IHJlc3VsdCA9IHBhcnNlci5wYXJzZShpbnZhbGlkQ29kZSwgXCJ0ZXN0LnRzXCIpO1xuXHRhc3NlcnRFcXVhbHMocmVzdWx0LmVycm9ycy5sZW5ndGggPiAwLCB0cnVlKTtcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGlDQUFpQztBQUNqQyxTQUFTLFlBQVksUUFBUSxjQUFjO0FBQzNDLFNBQVMsTUFBTSxRQUFRLCtCQUErQjtBQUV0RCxLQUFLLElBQUksQ0FBQyw2Q0FBNkM7RUFDdEQsTUFBTSxTQUFTLElBQUk7RUFDbkIsTUFBTSxPQUFPLENBQUM7Ozs7OztJQU1YLENBQUM7RUFFSixNQUFNLFNBQVMsT0FBTyxLQUFLLENBQUMsTUFBTTtFQUNsQyxrRUFBa0U7RUFDbEUsYUFBYSxPQUFPLE1BQU0sQ0FBQyxNQUFNLEVBQUU7RUFDbkMsYUFBYSxPQUFPLFlBQVksQ0FBQyxNQUFNLEVBQUU7RUFDekMsYUFBYSxPQUFPLFlBQVksQ0FBQyxFQUFFLEVBQUU7QUFDdEM7QUFFQSxLQUFLLElBQUksQ0FBQyxrQ0FBa0M7RUFDM0MsTUFBTSxTQUFTLElBQUk7RUFDbkIsTUFBTSxjQUFjLENBQUM7Ozs7OztJQU1sQixDQUFDO0VBRUosTUFBTSxTQUFTLE9BQU8sS0FBSyxDQUFDLGFBQWE7RUFDekMsYUFBYSxPQUFPLE1BQU0sQ0FBQyxNQUFNLEdBQUcsR0FBRztBQUN4QyJ9
// denoCacheMetadata=274507420144953507,11072359835988863999