// tests/core.test.ts
import { CLI } from "../src/core.ts";
import { assert, assertEquals, assertRejects } from "@std/assert";
import { CommandNotFoundError, InvalidFlagValueError, MissingFlagError } from "../src/error.ts";
// Helper function to capture console output
async function captureOutput(fn) {
  const originalLog = console.log;
  const originalError = console.error;
  let stdout = "";
  let stderr = "";
  console.log = (...args)=>{
    stdout += args.join(" ") + "\n";
  };
  console.error = (...args)=>{
    stderr += args.join(" ") + "\n";
  };
  try {
    await fn();
  } finally{
    console.log = originalLog;
    console.error = originalError;
  }
  return {
    stdout,
    stderr
  };
}
// Test setup helper
function setupTestCLI(args) {
  const cli = new CLI(undefined, true, true);
  const originalArgs = Deno.args;
  Object.defineProperty(Deno, "args", {
    value: args
  });
  return {
    cli,
    restore: ()=>Object.defineProperty(Deno, "args", {
        value: originalArgs
      })
  };
}
Deno.test("CLI - Basic command registration and execution", async ()=>{
  const { cli, restore } = setupTestCLI([
    "test",
    "--value=123"
  ]);
  try {
    let executed = false;
    cli.register({
      name: "test",
      options: [
        {
          name: "value",
          type: "number",
          required: true
        }
      ],
      action: (args)=>{
        executed = true;
        assertEquals(args.flags.value, 123);
      }
    });
    await cli.run();
    assert(executed, "Command should have executed");
  } finally{
    restore();
  }
});
Deno.test("CLI - Required flag validation", async ()=>{
  const { cli, restore } = setupTestCLI([
    "test"
  ]);
  try {
    cli.register({
      name: "test",
      options: [
        {
          name: "required",
          type: "string",
          required: true
        }
      ],
      action: ()=>{}
    });
    await assertRejects(()=>cli.run(), MissingFlagError, "Missing required flag: --required");
  } finally{
    restore();
  }
});
Deno.test("CLI - Flag type validation", async ()=>{
  const { cli, restore } = setupTestCLI([
    "test",
    "--number=invalid"
  ]);
  try {
    cli.register({
      name: "test",
      options: [
        {
          name: "number",
          type: "number",
          required: true
        }
      ],
      action: ()=>{}
    });
    await assertRejects(()=>cli.run(), InvalidFlagValueError, "Invalid value for flag --number: expected a number");
  } finally{
    restore();
  }
});
Deno.test("CLI - Help command", async ()=>{
  const { cli, restore } = setupTestCLI([
    "help"
  ]);
  try {
    cli.register({
      name: "test",
      description: "Test command",
      action: ()=>{}
    });
    const { stdout } = await captureOutput(()=>cli.run());
    assert(stdout.includes("Available Commands:"));
    assert(stdout.includes("test"));
    assert(stdout.includes("Test command"));
  } finally{
    restore();
  }
});
Deno.test("CLI - Subcommand handling", async ()=>{
  const { cli, restore } = setupTestCLI([
    "parent",
    "child",
    "--flag=value"
  ]);
  try {
    let executed = false;
    cli.register({
      name: "parent",
      subcommands: [
        {
          name: "child",
          options: [
            {
              name: "flag",
              type: "string",
              required: true
            }
          ],
          action: (args)=>{
            executed = true;
            assertEquals(args.flags.flag, "value");
          }
        }
      ],
      action: ()=>{}
    });
    await cli.run();
    assert(executed, "Subcommand should have executed");
  } finally{
    restore();
  }
});
Deno.test("CLI - Unknown command handling", async ()=>{
  const { cli, restore } = setupTestCLI([
    "unknown"
  ]);
  try {
    await assertRejects(()=>cli.run(), CommandNotFoundError, 'Command "unknown" not found');
  } finally{
    restore();
  }
});
Deno.test("CLI - Flag aliases", async ()=>{
  const { cli, restore } = setupTestCLI([
    "test",
    "-v"
  ]);
  try {
    let executed = false;
    cli.register({
      name: "test",
      options: [
        {
          name: "verbose",
          alias: "v",
          type: "boolean",
          default: false
        }
      ],
      action: (args)=>{
        executed = true;
        assertEquals(args.flags.verbose, true);
      }
    });
    await cli.run();
    assert(executed, "Command should have executed");
  } finally{
    restore();
  }
});
Deno.test("CLI - Default values", async ()=>{
  const { cli, restore } = setupTestCLI([
    "test"
  ]);
  try {
    let executed = false;
    cli.register({
      name: "test",
      options: [
        {
          name: "count",
          type: "number",
          default: 42
        }
      ],
      action: (args)=>{
        executed = true;
        assertEquals(args.flags.count, 42);
      }
    });
    await cli.run();
    assert(executed, "Command should have executed");
  } finally{
    restore();
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9jb3JlLnRlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGVzdHMvY29yZS50ZXN0LnRzXG5pbXBvcnQgeyBDTEkgfSBmcm9tIFwiLi4vc3JjL2NvcmUudHNcIjtcbmltcG9ydCB7IGFzc2VydCwgYXNzZXJ0RXF1YWxzLCBhc3NlcnRSZWplY3RzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG5pbXBvcnQge1xuXHRDb21tYW5kTm90Rm91bmRFcnJvcixcblx0SW52YWxpZEZsYWdWYWx1ZUVycm9yLFxuXHRNaXNzaW5nRmxhZ0Vycm9yLFxufSBmcm9tIFwiLi4vc3JjL2Vycm9yLnRzXCI7XG5cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBjYXB0dXJlIGNvbnNvbGUgb3V0cHV0XG5hc3luYyBmdW5jdGlvbiBjYXB0dXJlT3V0cHV0KFxuXHRmbjogKCkgPT4gUHJvbWlzZTx2b2lkPixcbik6IFByb21pc2U8eyBzdGRvdXQ6IHN0cmluZzsgc3RkZXJyOiBzdHJpbmcgfT4ge1xuXHRjb25zdCBvcmlnaW5hbExvZyA9IGNvbnNvbGUubG9nO1xuXHRjb25zdCBvcmlnaW5hbEVycm9yID0gY29uc29sZS5lcnJvcjtcblx0bGV0IHN0ZG91dCA9IFwiXCI7XG5cdGxldCBzdGRlcnIgPSBcIlwiO1xuXG5cdGNvbnNvbGUubG9nID0gKC4uLmFyZ3M6IHVua25vd25bXSkgPT4ge1xuXHRcdHN0ZG91dCArPSBhcmdzLmpvaW4oXCIgXCIpICsgXCJcXG5cIjtcblx0fTtcblx0Y29uc29sZS5lcnJvciA9ICguLi5hcmdzOiB1bmtub3duW10pID0+IHtcblx0XHRzdGRlcnIgKz0gYXJncy5qb2luKFwiIFwiKSArIFwiXFxuXCI7XG5cdH07XG5cblx0dHJ5IHtcblx0XHRhd2FpdCBmbigpO1xuXHR9IGZpbmFsbHkge1xuXHRcdGNvbnNvbGUubG9nID0gb3JpZ2luYWxMb2c7XG5cdFx0Y29uc29sZS5lcnJvciA9IG9yaWdpbmFsRXJyb3I7XG5cdH1cblxuXHRyZXR1cm4geyBzdGRvdXQsIHN0ZGVyciB9O1xufVxuXG4vLyBUZXN0IHNldHVwIGhlbHBlclxuZnVuY3Rpb24gc2V0dXBUZXN0Q0xJKGFyZ3M6IHN0cmluZ1tdKSB7XG5cdGNvbnN0IGNsaSA9IG5ldyBDTEkodW5kZWZpbmVkLCB0cnVlLCB0cnVlKTtcblx0Y29uc3Qgb3JpZ2luYWxBcmdzID0gRGVuby5hcmdzO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoRGVubywgXCJhcmdzXCIsIHsgdmFsdWU6IGFyZ3MgfSk7XG5cdHJldHVybiB7XG5cdFx0Y2xpLFxuXHRcdHJlc3RvcmU6ICgpID0+IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShEZW5vLCBcImFyZ3NcIiwgeyB2YWx1ZTogb3JpZ2luYWxBcmdzIH0pLFxuXHR9O1xufVxuXG5EZW5vLnRlc3QoXCJDTEkgLSBCYXNpYyBjb21tYW5kIHJlZ2lzdHJhdGlvbiBhbmQgZXhlY3V0aW9uXCIsIGFzeW5jICgpID0+IHtcblx0Y29uc3QgeyBjbGksIHJlc3RvcmUgfSA9IHNldHVwVGVzdENMSShbXCJ0ZXN0XCIsIFwiLS12YWx1ZT0xMjNcIl0pO1xuXHR0cnkge1xuXHRcdGxldCBleGVjdXRlZCA9IGZhbHNlO1xuXG5cdFx0Y2xpLnJlZ2lzdGVyKHtcblx0XHRcdG5hbWU6IFwidGVzdFwiLFxuXHRcdFx0b3B0aW9uczogW3sgbmFtZTogXCJ2YWx1ZVwiLCB0eXBlOiBcIm51bWJlclwiLCByZXF1aXJlZDogdHJ1ZSB9XSxcblx0XHRcdGFjdGlvbjogKGFyZ3MpID0+IHtcblx0XHRcdFx0ZXhlY3V0ZWQgPSB0cnVlO1xuXHRcdFx0XHRhc3NlcnRFcXVhbHMoYXJncy5mbGFncy52YWx1ZSwgMTIzKTtcblx0XHRcdH0sXG5cdFx0fSk7XG5cblx0XHRhd2FpdCBjbGkucnVuKCk7XG5cdFx0YXNzZXJ0KGV4ZWN1dGVkLCBcIkNvbW1hbmQgc2hvdWxkIGhhdmUgZXhlY3V0ZWRcIik7XG5cdH0gZmluYWxseSB7XG5cdFx0cmVzdG9yZSgpO1xuXHR9XG59KTtcblxuRGVuby50ZXN0KFwiQ0xJIC0gUmVxdWlyZWQgZmxhZyB2YWxpZGF0aW9uXCIsIGFzeW5jICgpID0+IHtcblx0Y29uc3QgeyBjbGksIHJlc3RvcmUgfSA9IHNldHVwVGVzdENMSShbXCJ0ZXN0XCJdKTtcblx0dHJ5IHtcblx0XHRjbGkucmVnaXN0ZXIoe1xuXHRcdFx0bmFtZTogXCJ0ZXN0XCIsXG5cdFx0XHRvcHRpb25zOiBbeyBuYW1lOiBcInJlcXVpcmVkXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH1dLFxuXHRcdFx0YWN0aW9uOiAoKSA9PiB7fSxcblx0XHR9KTtcblxuXHRcdGF3YWl0IGFzc2VydFJlamVjdHMoXG5cdFx0XHQoKSA9PiBjbGkucnVuKCksXG5cdFx0XHRNaXNzaW5nRmxhZ0Vycm9yLFxuXHRcdFx0XCJNaXNzaW5nIHJlcXVpcmVkIGZsYWc6IC0tcmVxdWlyZWRcIixcblx0XHQpO1xuXHR9IGZpbmFsbHkge1xuXHRcdHJlc3RvcmUoKTtcblx0fVxufSk7XG5cbkRlbm8udGVzdChcIkNMSSAtIEZsYWcgdHlwZSB2YWxpZGF0aW9uXCIsIGFzeW5jICgpID0+IHtcblx0Y29uc3QgeyBjbGksIHJlc3RvcmUgfSA9IHNldHVwVGVzdENMSShbXCJ0ZXN0XCIsIFwiLS1udW1iZXI9aW52YWxpZFwiXSk7XG5cdHRyeSB7XG5cdFx0Y2xpLnJlZ2lzdGVyKHtcblx0XHRcdG5hbWU6IFwidGVzdFwiLFxuXHRcdFx0b3B0aW9uczogW3sgbmFtZTogXCJudW1iZXJcIiwgdHlwZTogXCJudW1iZXJcIiwgcmVxdWlyZWQ6IHRydWUgfV0sXG5cdFx0XHRhY3Rpb246ICgpID0+IHt9LFxuXHRcdH0pO1xuXG5cdFx0YXdhaXQgYXNzZXJ0UmVqZWN0cyhcblx0XHRcdCgpID0+IGNsaS5ydW4oKSxcblx0XHRcdEludmFsaWRGbGFnVmFsdWVFcnJvcixcblx0XHRcdFwiSW52YWxpZCB2YWx1ZSBmb3IgZmxhZyAtLW51bWJlcjogZXhwZWN0ZWQgYSBudW1iZXJcIixcblx0XHQpO1xuXHR9IGZpbmFsbHkge1xuXHRcdHJlc3RvcmUoKTtcblx0fVxufSk7XG5cbkRlbm8udGVzdChcIkNMSSAtIEhlbHAgY29tbWFuZFwiLCBhc3luYyAoKSA9PiB7XG5cdGNvbnN0IHsgY2xpLCByZXN0b3JlIH0gPSBzZXR1cFRlc3RDTEkoW1wiaGVscFwiXSk7XG5cdHRyeSB7XG5cdFx0Y2xpLnJlZ2lzdGVyKHtcblx0XHRcdG5hbWU6IFwidGVzdFwiLFxuXHRcdFx0ZGVzY3JpcHRpb246IFwiVGVzdCBjb21tYW5kXCIsXG5cdFx0XHRhY3Rpb246ICgpID0+IHt9LFxuXHRcdH0pO1xuXG5cdFx0Y29uc3QgeyBzdGRvdXQgfSA9IGF3YWl0IGNhcHR1cmVPdXRwdXQoKCkgPT4gY2xpLnJ1bigpKTtcblx0XHRhc3NlcnQoc3Rkb3V0LmluY2x1ZGVzKFwiQXZhaWxhYmxlIENvbW1hbmRzOlwiKSk7XG5cdFx0YXNzZXJ0KHN0ZG91dC5pbmNsdWRlcyhcInRlc3RcIikpO1xuXHRcdGFzc2VydChzdGRvdXQuaW5jbHVkZXMoXCJUZXN0IGNvbW1hbmRcIikpO1xuXHR9IGZpbmFsbHkge1xuXHRcdHJlc3RvcmUoKTtcblx0fVxufSk7XG5cbkRlbm8udGVzdChcIkNMSSAtIFN1YmNvbW1hbmQgaGFuZGxpbmdcIiwgYXN5bmMgKCkgPT4ge1xuXHRjb25zdCB7IGNsaSwgcmVzdG9yZSB9ID0gc2V0dXBUZXN0Q0xJKFtcInBhcmVudFwiLCBcImNoaWxkXCIsIFwiLS1mbGFnPXZhbHVlXCJdKTtcblx0dHJ5IHtcblx0XHRsZXQgZXhlY3V0ZWQgPSBmYWxzZTtcblxuXHRcdGNsaS5yZWdpc3Rlcih7XG5cdFx0XHRuYW1lOiBcInBhcmVudFwiLFxuXHRcdFx0c3ViY29tbWFuZHM6IFt7XG5cdFx0XHRcdG5hbWU6IFwiY2hpbGRcIixcblx0XHRcdFx0b3B0aW9uczogW3sgbmFtZTogXCJmbGFnXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH1dLFxuXHRcdFx0XHRhY3Rpb246IChhcmdzKSA9PiB7XG5cdFx0XHRcdFx0ZXhlY3V0ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdGFzc2VydEVxdWFscyhhcmdzLmZsYWdzLmZsYWcsIFwidmFsdWVcIik7XG5cdFx0XHRcdH0sXG5cdFx0XHR9XSxcblx0XHRcdGFjdGlvbjogKCkgPT4ge30sXG5cdFx0fSk7XG5cblx0XHRhd2FpdCBjbGkucnVuKCk7XG5cdFx0YXNzZXJ0KGV4ZWN1dGVkLCBcIlN1YmNvbW1hbmQgc2hvdWxkIGhhdmUgZXhlY3V0ZWRcIik7XG5cdH0gZmluYWxseSB7XG5cdFx0cmVzdG9yZSgpO1xuXHR9XG59KTtcblxuRGVuby50ZXN0KFwiQ0xJIC0gVW5rbm93biBjb21tYW5kIGhhbmRsaW5nXCIsIGFzeW5jICgpID0+IHtcblx0Y29uc3QgeyBjbGksIHJlc3RvcmUgfSA9IHNldHVwVGVzdENMSShbXCJ1bmtub3duXCJdKTtcblx0dHJ5IHtcblx0XHRhd2FpdCBhc3NlcnRSZWplY3RzKFxuXHRcdFx0KCkgPT4gY2xpLnJ1bigpLFxuXHRcdFx0Q29tbWFuZE5vdEZvdW5kRXJyb3IsXG5cdFx0XHQnQ29tbWFuZCBcInVua25vd25cIiBub3QgZm91bmQnLFxuXHRcdCk7XG5cdH0gZmluYWxseSB7XG5cdFx0cmVzdG9yZSgpO1xuXHR9XG59KTtcblxuRGVuby50ZXN0KFwiQ0xJIC0gRmxhZyBhbGlhc2VzXCIsIGFzeW5jICgpID0+IHtcblx0Y29uc3QgeyBjbGksIHJlc3RvcmUgfSA9IHNldHVwVGVzdENMSShbXCJ0ZXN0XCIsIFwiLXZcIl0pO1xuXHR0cnkge1xuXHRcdGxldCBleGVjdXRlZCA9IGZhbHNlO1xuXG5cdFx0Y2xpLnJlZ2lzdGVyKHtcblx0XHRcdG5hbWU6IFwidGVzdFwiLFxuXHRcdFx0b3B0aW9uczogW3tcblx0XHRcdFx0bmFtZTogXCJ2ZXJib3NlXCIsXG5cdFx0XHRcdGFsaWFzOiBcInZcIixcblx0XHRcdFx0dHlwZTogXCJib29sZWFuXCIsXG5cdFx0XHRcdGRlZmF1bHQ6IGZhbHNlLFxuXHRcdFx0fV0sXG5cdFx0XHRhY3Rpb246IChhcmdzKSA9PiB7XG5cdFx0XHRcdGV4ZWN1dGVkID0gdHJ1ZTtcblx0XHRcdFx0YXNzZXJ0RXF1YWxzKGFyZ3MuZmxhZ3MudmVyYm9zZSwgdHJ1ZSk7XG5cdFx0XHR9LFxuXHRcdH0pO1xuXG5cdFx0YXdhaXQgY2xpLnJ1bigpO1xuXHRcdGFzc2VydChleGVjdXRlZCwgXCJDb21tYW5kIHNob3VsZCBoYXZlIGV4ZWN1dGVkXCIpO1xuXHR9IGZpbmFsbHkge1xuXHRcdHJlc3RvcmUoKTtcblx0fVxufSk7XG5cbkRlbm8udGVzdChcIkNMSSAtIERlZmF1bHQgdmFsdWVzXCIsIGFzeW5jICgpID0+IHtcblx0Y29uc3QgeyBjbGksIHJlc3RvcmUgfSA9IHNldHVwVGVzdENMSShbXCJ0ZXN0XCJdKTtcblx0dHJ5IHtcblx0XHRsZXQgZXhlY3V0ZWQgPSBmYWxzZTtcblxuXHRcdGNsaS5yZWdpc3Rlcih7XG5cdFx0XHRuYW1lOiBcInRlc3RcIixcblx0XHRcdG9wdGlvbnM6IFt7XG5cdFx0XHRcdG5hbWU6IFwiY291bnRcIixcblx0XHRcdFx0dHlwZTogXCJudW1iZXJcIixcblx0XHRcdFx0ZGVmYXVsdDogNDIsXG5cdFx0XHR9XSxcblx0XHRcdGFjdGlvbjogKGFyZ3MpID0+IHtcblx0XHRcdFx0ZXhlY3V0ZWQgPSB0cnVlO1xuXHRcdFx0XHRhc3NlcnRFcXVhbHMoYXJncy5mbGFncy5jb3VudCwgNDIpO1xuXHRcdFx0fSxcblx0XHR9KTtcblxuXHRcdGF3YWl0IGNsaS5ydW4oKTtcblx0XHRhc3NlcnQoZXhlY3V0ZWQsIFwiQ29tbWFuZCBzaG91bGQgaGF2ZSBleGVjdXRlZFwiKTtcblx0fSBmaW5hbGx5IHtcblx0XHRyZXN0b3JlKCk7XG5cdH1cbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFCQUFxQjtBQUNyQixTQUFTLEdBQUcsUUFBUSxpQkFBaUI7QUFDckMsU0FBUyxNQUFNLEVBQUUsWUFBWSxFQUFFLGFBQWEsUUFBUSxjQUFjO0FBQ2xFLFNB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
// denoCacheMetadata=4204018178137299802,4898391743062784653