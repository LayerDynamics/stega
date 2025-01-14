// tests/logger.test.ts
import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { logger } from "../src/logger.ts";
/* eslint-disable no-control-regex */ // Control characters are intentional in these regex patterns
const stripAnsi = (str)=>str.replace(/\x1B\[\d+m/g, "");
const _stripEscapes = (str)=>str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, ""); // Prefixed with underscore
/* eslint-enable no-control-regex */ Deno.test("Logger should log messages at appropriate levels", ()=>{
  const logs = [];
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error
  };
  // Mock console methods
  console.log = (msg)=>logs.push(msg);
  console.info = (msg)=>logs.push(msg);
  console.warn = (msg)=>logs.push(msg);
  console.error = (msg)=>logs.push(msg);
  try {
    // Clear any existing logs
    logs.length = 0;
    // Only log INFO and above
    logger.info("Info message");
    logger.warn("Warn message");
    logger.error("Error message");
    // Strip ANSI color codes and normalize whitespace
    const strippedLogs = logs.map((log)=>/* eslint-disable no-control-regex */ stripAnsi(log).replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "").replace(/\s+/g, " ").trim());
    assertEquals(strippedLogs, [
      "INFO Info message",
      "WARN Warn message",
      "ERROR Error message"
    ]);
  } finally{
    Object.assign(console, originalConsole);
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9sb2dnZXIudGVzdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0ZXN0cy9sb2dnZXIudGVzdC50c1xuaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSBcIi4uL3NyYy9sb2dnZXIudHNcIjtcbmltcG9ydCB7IExvZ0xldmVscyBhcyBfTG9nTGV2ZWxzIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyNC4wL2xvZy9tb2QudHNcIjtcblxuLyogZXNsaW50LWRpc2FibGUgbm8tY29udHJvbC1yZWdleCAqL1xuLy8gQ29udHJvbCBjaGFyYWN0ZXJzIGFyZSBpbnRlbnRpb25hbCBpbiB0aGVzZSByZWdleCBwYXR0ZXJuc1xuY29uc3Qgc3RyaXBBbnNpID0gKHN0cjogc3RyaW5nKSA9PiBzdHIucmVwbGFjZSgvXFx4MUJcXFtcXGQrbS9nLCBcIlwiKTtcbmNvbnN0IF9zdHJpcEVzY2FwZXMgPSAoc3RyOiBzdHJpbmcpID0+XG5cdHN0ci5yZXBsYWNlKFxuXHRcdC9bXFx1MDAxYlxcdTAwOWJdW1soKSM7P10qKD86WzAtOV17MSw0fSg/OjtbMC05XXswLDR9KSopP1swLTlBLU9SWmNmLW5xcnk9PjxdL2csXG5cdFx0XCJcIixcblx0KTsgLy8gUHJlZml4ZWQgd2l0aCB1bmRlcnNjb3JlXG4vKiBlc2xpbnQtZW5hYmxlIG5vLWNvbnRyb2wtcmVnZXggKi9cblxuRGVuby50ZXN0KFwiTG9nZ2VyIHNob3VsZCBsb2cgbWVzc2FnZXMgYXQgYXBwcm9wcmlhdGUgbGV2ZWxzXCIsICgpID0+IHtcblx0Y29uc3QgbG9nczogc3RyaW5nW10gPSBbXTtcblx0Y29uc3Qgb3JpZ2luYWxDb25zb2xlID0ge1xuXHRcdGxvZzogY29uc29sZS5sb2csXG5cdFx0aW5mbzogY29uc29sZS5pbmZvLFxuXHRcdHdhcm46IGNvbnNvbGUud2Fybixcblx0XHRlcnJvcjogY29uc29sZS5lcnJvcixcblx0fTtcblxuXHQvLyBNb2NrIGNvbnNvbGUgbWV0aG9kc1xuXHRjb25zb2xlLmxvZyA9IChtc2c6IHN0cmluZykgPT4gbG9ncy5wdXNoKG1zZyk7XG5cdGNvbnNvbGUuaW5mbyA9IChtc2c6IHN0cmluZykgPT4gbG9ncy5wdXNoKG1zZyk7XG5cdGNvbnNvbGUud2FybiA9IChtc2c6IHN0cmluZykgPT4gbG9ncy5wdXNoKG1zZyk7XG5cdGNvbnNvbGUuZXJyb3IgPSAobXNnOiBzdHJpbmcpID0+IGxvZ3MucHVzaChtc2cpO1xuXG5cdHRyeSB7XG5cdFx0Ly8gQ2xlYXIgYW55IGV4aXN0aW5nIGxvZ3Ncblx0XHRsb2dzLmxlbmd0aCA9IDA7XG5cblx0XHQvLyBPbmx5IGxvZyBJTkZPIGFuZCBhYm92ZVxuXHRcdGxvZ2dlci5pbmZvKFwiSW5mbyBtZXNzYWdlXCIpO1xuXHRcdGxvZ2dlci53YXJuKFwiV2FybiBtZXNzYWdlXCIpO1xuXHRcdGxvZ2dlci5lcnJvcihcIkVycm9yIG1lc3NhZ2VcIik7XG5cblx0XHQvLyBTdHJpcCBBTlNJIGNvbG9yIGNvZGVzIGFuZCBub3JtYWxpemUgd2hpdGVzcGFjZVxuXHRcdGNvbnN0IHN0cmlwcGVkTG9ncyA9IGxvZ3MubWFwKChsb2cpID0+XG5cdFx0XHQvKiBlc2xpbnQtZGlzYWJsZSBuby1jb250cm9sLXJlZ2V4ICovXG5cdFx0XHRzdHJpcEFuc2kobG9nKVxuXHRcdFx0XHQucmVwbGFjZShcblx0XHRcdFx0XHQvW1xcdTAwMWJcXHUwMDliXVtbKCkjOz9dKig/OlswLTldezEsNH0oPzo7WzAtOV17MCw0fSkqKT9bMC05QS1PUlpjZi1ucXJ5PT48XS9nLFxuXHRcdFx0XHRcdFwiXCIsXG5cdFx0XHRcdClcblx0XHRcdFx0LnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG5cdFx0XHRcdC50cmltKClcblx0XHRcdC8qIGVzbGludC1lbmFibGUgbm8tY29udHJvbC1yZWdleCAqL1xuXHRcdCk7XG5cblx0XHRhc3NlcnRFcXVhbHMoc3RyaXBwZWRMb2dzLCBbXG5cdFx0XHRcIklORk8gSW5mbyBtZXNzYWdlXCIsXG5cdFx0XHRcIldBUk4gV2FybiBtZXNzYWdlXCIsXG5cdFx0XHRcIkVSUk9SIEVycm9yIG1lc3NhZ2VcIixcblx0XHRdKTtcblx0fSBmaW5hbGx5IHtcblx0XHRPYmplY3QuYXNzaWduKGNvbnNvbGUsIG9yaWdpbmFsQ29uc29sZSk7XG5cdH1cbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHVCQUF1QjtBQUN2QixTQUFTLFlBQVksUUFBUSxtREFBbUQ7QUFDaEYsU0FBUyxNQUFNLFFBQVEsbUJBQW1CO0FBRzFDLG1DQUFtQyxHQUNuQyw2REFBNkQ7QUFDN0QsTUFBTSxZQUFZLENBQUMsTUFBZ0IsSUFBSSxPQUFPLENBQUMsZUFBZTtBQUM5RCxNQUFNLGdCQUFnQixDQUFDLE1BQ3RCLElBQUksT0FBTyxDQUNWLCtFQUNBLEtBQ0UsMkJBQTJCO0FBQy9CLGtDQUFrQyxHQUVsQyxLQUFLLElBQUksQ0FBQyxvREFBb0Q7RUFDN0QsTUFBTSxPQUFpQixFQUFFO0VBQ3pCLE1BQU0sa0JBQWtCO0lBQ3ZCLEtBQUssUUFBUSxHQUFHO0lBQ2hCLE1BQU0sUUFBUSxJQUFJO0lBQ2xCLE1BQU0sUUFBUSxJQUFJO0lBQ2xCLE9BQU8sUUFBUSxLQUFLO0VBQ3JCO0VBRUEsdUJBQXVCO0VBQ3ZCLFFBQVEsR0FBRyxHQUFHLENBQUMsTUFBZ0IsS0FBSyxJQUFJLENBQUM7RUFDekMsUUFBUSxJQUFJLEdBQUcsQ0FBQyxNQUFnQixLQUFLLElBQUksQ0FBQztFQUMxQyxRQUFRLElBQUksR0FBRyxDQUFDLE1BQWdCLEtBQUssSUFBSSxDQUFDO0VBQzFDLFFBQVEsS0FBSyxHQUFHLENBQUMsTUFBZ0IsS0FBSyxJQUFJLENBQUM7RUFFM0MsSUFBSTtJQUNILDBCQUEwQjtJQUMxQixLQUFLLE1BQU0sR0FBRztJQUVkLDBCQUEwQjtJQUMxQixPQUFPLElBQUksQ0FBQztJQUNaLE9BQU8sSUFBSSxDQUFDO0lBQ1osT0FBTyxLQUFLLENBQUM7SUFFYixrREFBa0Q7SUFDbEQsTUFBTSxlQUFlLEtBQUssR0FBRyxDQUFDLENBQUMsTUFDOUIsbUNBQW1DLEdBQ25DLFVBQVUsS0FDUixPQUFPLENBQ1AsK0VBQ0EsSUFFQSxPQUFPLENBQUMsUUFBUSxLQUNoQixJQUFJO0lBSVAsYUFBYSxjQUFjO01BQzFCO01BQ0E7TUFDQTtLQUNBO0VBQ0YsU0FBVTtJQUNULE9BQU8sTUFBTSxDQUFDLFNBQVM7RUFDeEI7QUFDRCJ9
// denoCacheMetadata=14185556413648193805,1397891884645570388