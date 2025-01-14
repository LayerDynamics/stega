// tests/cli.test.ts
import { CLI } from "../src/core.ts"; // Import CLI from core.ts
import { assert, assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
// Helper function to capture console output
async function captureConsoleOutput(func) {
  const originalLog = console.log;
  const originalError = console.error;
  let stdout = "";
  let stderr = "";
  console.log = (msg)=>{
    stdout += String(msg) + "\n";
  };
  console.error = (msg)=>{
    stderr += String(msg) + "\n";
  };
  try {
    const result = func();
    if (result instanceof Promise) {
      await result;
    }
  } finally{
    console.log = originalLog;
    console.error = originalError;
  }
  return {
    stdout,
    stderr
  };
}
Deno.test("CLI should execute the greet command correctly", async ()=>{
  const cli = new CLI(undefined, true, true); // Enable test mode
  let output = "";
  const greetCommand = {
    name: "greet",
    description: "Greet the user",
    options: [
      {
        name: "name",
        alias: "n",
        type: "string",
        required: true
      },
      {
        name: "verbose",
        alias: "v",
        type: "boolean",
        default: false
      }
    ],
    action: (args)=>{
      const name = args.flags.name;
      const verbose = args.flags.verbose;
      output = verbose ? `Hello, ${name}!` : `Hi, ${name}!`;
    }
  };
  cli.register(greetCommand);
  // Mock Deno.args
  const originalArgs = Deno.args;
  Object.defineProperty(Deno, "args", {
    value: [
      "greet",
      "--name=Tester",
      "--verbose"
    ]
  });
  await cli.run();
  // Restore Deno.args
  Object.defineProperty(Deno, "args", {
    value: originalArgs
  });
  assertEquals(output, "Hello, Tester!");
});
Deno.test("CLI should handle missing required flags", async ()=>{
  const cli = new CLI(undefined, true, true); // Enable test mode
  const greetCommand = {
    name: "greet",
    description: "Greet the user",
    options: [
      {
        name: "name",
        alias: "n",
        type: "string",
        required: true
      }
    ],
    action: ()=>{}
  };
  cli.register(greetCommand);
  // Mock Deno.args
  const originalArgs = Deno.args;
  Object.defineProperty(Deno, "args", {
    value: [
      "greet"
    ]
  });
  let error;
  const { stdout } = await captureConsoleOutput(async ()=>{
    try {
      await cli.run();
    } catch (e) {
      error = e;
    }
  });
  // Restore Deno.args
  Object.defineProperty(Deno, "args", {
    value: originalArgs
  });
  assert(error?.message.includes("Missing required flag: --name"));
  assert(stdout.includes("Available Commands:"));
});
Deno.test("CLI should handle invalid flag values", async ()=>{
  const cli = new CLI(undefined, true, true); // Enable test mode
  const greetCommand = {
    name: "greet",
    description: "Greet the user",
    options: [
      {
        name: "name",
        alias: "n",
        type: "string",
        required: true
      },
      {
        name: "times",
        alias: "t",
        type: "number",
        default: 1
      }
    ],
    action: ()=>{}
  };
  cli.register(greetCommand);
  // Mock Deno.args
  const originalArgs = Deno.args;
  Object.defineProperty(Deno, "args", {
    value: [
      "greet",
      "--name=Bob",
      "--times=abc"
    ]
  });
  let error;
  const { stdout } = await captureConsoleOutput(async ()=>{
    try {
      await cli.run();
    } catch (e) {
      error = e;
    }
  });
  // Restore Deno.args
  Object.defineProperty(Deno, "args", {
    value: originalArgs
  });
  assert(error?.message.includes("Invalid value for flag --times: expected a number."));
  assert(stdout.includes("Available Commands:"));
});
Deno.test("CLI should handle unknown commands", async ()=>{
  const cli = new CLI(undefined, true, true); // Enable test mode
  // Mock Deno.args
  const originalArgs = Deno.args;
  Object.defineProperty(Deno, "args", {
    value: [
      "unknown"
    ]
  });
  let error;
  const { stdout } = await captureConsoleOutput(async ()=>{
    try {
      await cli.run();
    } catch (e) {
      error = e;
    }
  });
  // Restore Deno.args
  Object.defineProperty(Deno, "args", {
    value: originalArgs
  });
  assert(error?.message.includes('Command "unknown" not found.'));
  assert(stdout.includes("Available Commands:"));
});
Deno.test("CLI should handle unknown subcommands", async ()=>{
  const cli = new CLI(undefined, true, true); // Enable test mode
  const userCommand = {
    name: "user",
    description: "User management commands",
    subcommands: [
      {
        name: "add",
        description: "Add a new user",
        action: ()=>{}
      },
      {
        name: "remove",
        description: "Remove an existing user",
        action: ()=>{}
      }
    ],
    action: ()=>{}
  };
  cli.register(userCommand);
  // Mock Deno.args
  const originalArgs = Deno.args;
  Object.defineProperty(Deno, "args", {
    value: [
      "user",
      "update"
    ]
  });
  let error;
  const { stdout } = await captureConsoleOutput(async ()=>{
    try {
      await cli.run();
    } catch (e) {
      error = e;
    }
  });
  // Restore Deno.args
  Object.defineProperty(Deno, "args", {
    value: originalArgs
  });
  assert(error?.message.includes('Subcommand "update" not found.'));
  assert(stdout.includes("Available Commands:"));
});
Deno.test("CLI should display general help when no command is provided", async ()=>{
  const cli = new CLI(undefined, true, true); // Enable test mode
  // Mock Deno.args
  const originalArgs = Deno.args;
  Object.defineProperty(Deno, "args", {
    value: []
  });
  const { stdout } = await captureConsoleOutput(async ()=>{
    await cli.run();
  });
  // Restore Deno.args
  Object.defineProperty(Deno, "args", {
    value: originalArgs
  });
  assert(stdout.includes("Available Commands:"));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9jbGkudGVzdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0ZXN0cy9jbGkudGVzdC50c1xuaW1wb3J0IHsgQ0xJIH0gZnJvbSBcIi4uL3NyYy9jb3JlLnRzXCI7IC8vIEltcG9ydCBDTEkgZnJvbSBjb3JlLnRzXG5pbXBvcnQgeyBDb21tYW5kIH0gZnJvbSBcIi4uL3NyYy9jb21tYW5kLnRzXCI7IC8vIEltcG9ydCBDb21tYW5kIGZyb20gY29tbWFuZC50c1xuaW1wb3J0IHsgQXJncyB9IGZyb20gXCIuLi9zcmMvdHlwZXMudHNcIjsgLy8gSW1wb3J0IEFyZ3MgZnJvbSB0eXBlcy50c1xuaW1wb3J0IHtcblx0YXNzZXJ0LFxuXHRhc3NlcnRFcXVhbHMsXG59IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4yMDMuMC90ZXN0aW5nL2Fzc2VydHMudHNcIjtcblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGNhcHR1cmUgY29uc29sZSBvdXRwdXRcbmFzeW5jIGZ1bmN0aW9uIGNhcHR1cmVDb25zb2xlT3V0cHV0KFxuXHRmdW5jOiAoKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPixcbik6IFByb21pc2U8eyBzdGRvdXQ6IHN0cmluZzsgc3RkZXJyOiBzdHJpbmcgfT4ge1xuXHRjb25zdCBvcmlnaW5hbExvZyA9IGNvbnNvbGUubG9nO1xuXHRjb25zdCBvcmlnaW5hbEVycm9yID0gY29uc29sZS5lcnJvcjtcblx0bGV0IHN0ZG91dCA9IFwiXCI7XG5cdGxldCBzdGRlcnIgPSBcIlwiO1xuXG5cdGNvbnNvbGUubG9nID0gKG1zZzogdW5rbm93bik6IHZvaWQgPT4ge1xuXHRcdHN0ZG91dCArPSBTdHJpbmcobXNnKSArIFwiXFxuXCI7XG5cdH07XG5cblx0Y29uc29sZS5lcnJvciA9IChtc2c6IHVua25vd24pOiB2b2lkID0+IHtcblx0XHRzdGRlcnIgKz0gU3RyaW5nKG1zZykgKyBcIlxcblwiO1xuXHR9O1xuXG5cdHRyeSB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gZnVuYygpO1xuXHRcdGlmIChyZXN1bHQgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG5cdFx0XHRhd2FpdCByZXN1bHQ7XG5cdFx0fVxuXHR9IGZpbmFsbHkge1xuXHRcdGNvbnNvbGUubG9nID0gb3JpZ2luYWxMb2c7XG5cdFx0Y29uc29sZS5lcnJvciA9IG9yaWdpbmFsRXJyb3I7XG5cdH1cblxuXHRyZXR1cm4geyBzdGRvdXQsIHN0ZGVyciB9O1xufVxuXG5EZW5vLnRlc3QoXCJDTEkgc2hvdWxkIGV4ZWN1dGUgdGhlIGdyZWV0IGNvbW1hbmQgY29ycmVjdGx5XCIsIGFzeW5jICgpID0+IHtcblx0Y29uc3QgY2xpID0gbmV3IENMSSh1bmRlZmluZWQsIHRydWUsIHRydWUpOyAvLyBFbmFibGUgdGVzdCBtb2RlXG5cblx0bGV0IG91dHB1dCA9IFwiXCI7XG5cblx0Y29uc3QgZ3JlZXRDb21tYW5kOiBDb21tYW5kID0ge1xuXHRcdG5hbWU6IFwiZ3JlZXRcIixcblx0XHRkZXNjcmlwdGlvbjogXCJHcmVldCB0aGUgdXNlclwiLFxuXHRcdG9wdGlvbnM6IFtcblx0XHRcdHsgbmFtZTogXCJuYW1lXCIsIGFsaWFzOiBcIm5cIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcblx0XHRcdHsgbmFtZTogXCJ2ZXJib3NlXCIsIGFsaWFzOiBcInZcIiwgdHlwZTogXCJib29sZWFuXCIsIGRlZmF1bHQ6IGZhbHNlIH0sXG5cdFx0XSxcblx0XHRhY3Rpb246IChhcmdzOiBBcmdzKSA9PiB7XG5cdFx0XHRjb25zdCBuYW1lID0gYXJncy5mbGFncy5uYW1lO1xuXHRcdFx0Y29uc3QgdmVyYm9zZSA9IGFyZ3MuZmxhZ3MudmVyYm9zZTtcblx0XHRcdG91dHB1dCA9IHZlcmJvc2UgPyBgSGVsbG8sICR7bmFtZX0hYCA6IGBIaSwgJHtuYW1lfSFgO1xuXHRcdH0sXG5cdH07XG5cblx0Y2xpLnJlZ2lzdGVyKGdyZWV0Q29tbWFuZCk7XG5cblx0Ly8gTW9jayBEZW5vLmFyZ3Ncblx0Y29uc3Qgb3JpZ2luYWxBcmdzID0gRGVuby5hcmdzO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoRGVubywgXCJhcmdzXCIsIHtcblx0XHR2YWx1ZTogW1wiZ3JlZXRcIiwgXCItLW5hbWU9VGVzdGVyXCIsIFwiLS12ZXJib3NlXCJdLFxuXHR9KTtcblxuXHRhd2FpdCBjbGkucnVuKCk7XG5cblx0Ly8gUmVzdG9yZSBEZW5vLmFyZ3Ncblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KERlbm8sIFwiYXJnc1wiLCB7IHZhbHVlOiBvcmlnaW5hbEFyZ3MgfSk7XG5cblx0YXNzZXJ0RXF1YWxzKG91dHB1dCwgXCJIZWxsbywgVGVzdGVyIVwiKTtcbn0pO1xuXG5EZW5vLnRlc3QoXCJDTEkgc2hvdWxkIGhhbmRsZSBtaXNzaW5nIHJlcXVpcmVkIGZsYWdzXCIsIGFzeW5jICgpID0+IHtcblx0Y29uc3QgY2xpID0gbmV3IENMSSh1bmRlZmluZWQsIHRydWUsIHRydWUpOyAvLyBFbmFibGUgdGVzdCBtb2RlXG5cblx0Y29uc3QgZ3JlZXRDb21tYW5kOiBDb21tYW5kID0ge1xuXHRcdG5hbWU6IFwiZ3JlZXRcIixcblx0XHRkZXNjcmlwdGlvbjogXCJHcmVldCB0aGUgdXNlclwiLFxuXHRcdG9wdGlvbnM6IFtcblx0XHRcdHsgbmFtZTogXCJuYW1lXCIsIGFsaWFzOiBcIm5cIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcblx0XHRdLFxuXHRcdGFjdGlvbjogKCkgPT4ge30sXG5cdH07XG5cblx0Y2xpLnJlZ2lzdGVyKGdyZWV0Q29tbWFuZCk7XG5cblx0Ly8gTW9jayBEZW5vLmFyZ3Ncblx0Y29uc3Qgb3JpZ2luYWxBcmdzID0gRGVuby5hcmdzO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoRGVubywgXCJhcmdzXCIsIHsgdmFsdWU6IFtcImdyZWV0XCJdIH0pO1xuXG5cdGxldCBlcnJvcjogRXJyb3IgfCB1bmRlZmluZWQ7XG5cdGNvbnN0IHsgc3Rkb3V0IH0gPSBhd2FpdCBjYXB0dXJlQ29uc29sZU91dHB1dChhc3luYyAoKSA9PiB7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IGNsaS5ydW4oKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRlcnJvciA9IGUgYXMgRXJyb3I7XG5cdFx0fVxuXHR9KTtcblxuXHQvLyBSZXN0b3JlIERlbm8uYXJnc1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoRGVubywgXCJhcmdzXCIsIHsgdmFsdWU6IG9yaWdpbmFsQXJncyB9KTtcblxuXHRhc3NlcnQoZXJyb3I/Lm1lc3NhZ2UuaW5jbHVkZXMoXCJNaXNzaW5nIHJlcXVpcmVkIGZsYWc6IC0tbmFtZVwiKSk7XG5cdGFzc2VydChzdGRvdXQuaW5jbHVkZXMoXCJBdmFpbGFibGUgQ29tbWFuZHM6XCIpKTtcbn0pO1xuXG5EZW5vLnRlc3QoXCJDTEkgc2hvdWxkIGhhbmRsZSBpbnZhbGlkIGZsYWcgdmFsdWVzXCIsIGFzeW5jICgpID0+IHtcblx0Y29uc3QgY2xpID0gbmV3IENMSSh1bmRlZmluZWQsIHRydWUsIHRydWUpOyAvLyBFbmFibGUgdGVzdCBtb2RlXG5cblx0Y29uc3QgZ3JlZXRDb21tYW5kOiBDb21tYW5kID0ge1xuXHRcdG5hbWU6IFwiZ3JlZXRcIixcblx0XHRkZXNjcmlwdGlvbjogXCJHcmVldCB0aGUgdXNlclwiLFxuXHRcdG9wdGlvbnM6IFtcblx0XHRcdHsgbmFtZTogXCJuYW1lXCIsIGFsaWFzOiBcIm5cIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcblx0XHRcdHsgbmFtZTogXCJ0aW1lc1wiLCBhbGlhczogXCJ0XCIsIHR5cGU6IFwibnVtYmVyXCIsIGRlZmF1bHQ6IDEgfSxcblx0XHRdLFxuXHRcdGFjdGlvbjogKCkgPT4ge30sXG5cdH07XG5cblx0Y2xpLnJlZ2lzdGVyKGdyZWV0Q29tbWFuZCk7XG5cblx0Ly8gTW9jayBEZW5vLmFyZ3Ncblx0Y29uc3Qgb3JpZ2luYWxBcmdzID0gRGVuby5hcmdzO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoRGVubywgXCJhcmdzXCIsIHtcblx0XHR2YWx1ZTogW1wiZ3JlZXRcIiwgXCItLW5hbWU9Qm9iXCIsIFwiLS10aW1lcz1hYmNcIl0sXG5cdH0pO1xuXG5cdGxldCBlcnJvcjogRXJyb3IgfCB1bmRlZmluZWQ7XG5cdGNvbnN0IHsgc3Rkb3V0IH0gPSBhd2FpdCBjYXB0dXJlQ29uc29sZU91dHB1dChhc3luYyAoKSA9PiB7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IGNsaS5ydW4oKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRlcnJvciA9IGUgYXMgRXJyb3I7XG5cdFx0fVxuXHR9KTtcblxuXHQvLyBSZXN0b3JlIERlbm8uYXJnc1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoRGVubywgXCJhcmdzXCIsIHsgdmFsdWU6IG9yaWdpbmFsQXJncyB9KTtcblxuXHRhc3NlcnQoXG5cdFx0ZXJyb3I/Lm1lc3NhZ2UuaW5jbHVkZXMoXG5cdFx0XHRcIkludmFsaWQgdmFsdWUgZm9yIGZsYWcgLS10aW1lczogZXhwZWN0ZWQgYSBudW1iZXIuXCIsXG5cdFx0KSxcblx0KTtcblx0YXNzZXJ0KHN0ZG91dC5pbmNsdWRlcyhcIkF2YWlsYWJsZSBDb21tYW5kczpcIikpO1xufSk7XG5cbkRlbm8udGVzdChcIkNMSSBzaG91bGQgaGFuZGxlIHVua25vd24gY29tbWFuZHNcIiwgYXN5bmMgKCkgPT4ge1xuXHRjb25zdCBjbGkgPSBuZXcgQ0xJKHVuZGVmaW5lZCwgdHJ1ZSwgdHJ1ZSk7IC8vIEVuYWJsZSB0ZXN0IG1vZGVcblxuXHQvLyBNb2NrIERlbm8uYXJnc1xuXHRjb25zdCBvcmlnaW5hbEFyZ3MgPSBEZW5vLmFyZ3M7XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShEZW5vLCBcImFyZ3NcIiwgeyB2YWx1ZTogW1widW5rbm93blwiXSB9KTtcblxuXHRsZXQgZXJyb3I6IEVycm9yIHwgdW5kZWZpbmVkO1xuXHRjb25zdCB7IHN0ZG91dCB9ID0gYXdhaXQgY2FwdHVyZUNvbnNvbGVPdXRwdXQoYXN5bmMgKCkgPT4ge1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBjbGkucnVuKCk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0ZXJyb3IgPSBlIGFzIEVycm9yO1xuXHRcdH1cblx0fSk7XG5cblx0Ly8gUmVzdG9yZSBEZW5vLmFyZ3Ncblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KERlbm8sIFwiYXJnc1wiLCB7IHZhbHVlOiBvcmlnaW5hbEFyZ3MgfSk7XG5cblx0YXNzZXJ0KGVycm9yPy5tZXNzYWdlLmluY2x1ZGVzKCdDb21tYW5kIFwidW5rbm93blwiIG5vdCBmb3VuZC4nKSk7XG5cdGFzc2VydChzdGRvdXQuaW5jbHVkZXMoXCJBdmFpbGFibGUgQ29tbWFuZHM6XCIpKTtcbn0pO1xuXG5EZW5vLnRlc3QoXCJDTEkgc2hvdWxkIGhhbmRsZSB1bmtub3duIHN1YmNvbW1hbmRzXCIsIGFzeW5jICgpID0+IHtcblx0Y29uc3QgY2xpID0gbmV3IENMSSh1bmRlZmluZWQsIHRydWUsIHRydWUpOyAvLyBFbmFibGUgdGVzdCBtb2RlXG5cblx0Y29uc3QgdXNlckNvbW1hbmQ6IENvbW1hbmQgPSB7XG5cdFx0bmFtZTogXCJ1c2VyXCIsXG5cdFx0ZGVzY3JpcHRpb246IFwiVXNlciBtYW5hZ2VtZW50IGNvbW1hbmRzXCIsXG5cdFx0c3ViY29tbWFuZHM6IFtcblx0XHRcdHtcblx0XHRcdFx0bmFtZTogXCJhZGRcIixcblx0XHRcdFx0ZGVzY3JpcHRpb246IFwiQWRkIGEgbmV3IHVzZXJcIixcblx0XHRcdFx0YWN0aW9uOiAoKSA9PiB7fSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWU6IFwicmVtb3ZlXCIsXG5cdFx0XHRcdGRlc2NyaXB0aW9uOiBcIlJlbW92ZSBhbiBleGlzdGluZyB1c2VyXCIsXG5cdFx0XHRcdGFjdGlvbjogKCkgPT4ge30sXG5cdFx0XHR9LFxuXHRcdF0sXG5cdFx0YWN0aW9uOiAoKSA9PiB7fSxcblx0fTtcblxuXHRjbGkucmVnaXN0ZXIodXNlckNvbW1hbmQpO1xuXG5cdC8vIE1vY2sgRGVuby5hcmdzXG5cdGNvbnN0IG9yaWdpbmFsQXJncyA9IERlbm8uYXJncztcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KERlbm8sIFwiYXJnc1wiLCB7IHZhbHVlOiBbXCJ1c2VyXCIsIFwidXBkYXRlXCJdIH0pO1xuXG5cdGxldCBlcnJvcjogRXJyb3IgfCB1bmRlZmluZWQ7XG5cdGNvbnN0IHsgc3Rkb3V0IH0gPSBhd2FpdCBjYXB0dXJlQ29uc29sZU91dHB1dChhc3luYyAoKSA9PiB7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IGNsaS5ydW4oKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRlcnJvciA9IGUgYXMgRXJyb3I7XG5cdFx0fVxuXHR9KTtcblxuXHQvLyBSZXN0b3JlIERlbm8uYXJnc1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoRGVubywgXCJhcmdzXCIsIHsgdmFsdWU6IG9yaWdpbmFsQXJncyB9KTtcblxuXHRhc3NlcnQoZXJyb3I/Lm1lc3NhZ2UuaW5jbHVkZXMoJ1N1YmNvbW1hbmQgXCJ1cGRhdGVcIiBub3QgZm91bmQuJykpO1xuXHRhc3NlcnQoc3Rkb3V0LmluY2x1ZGVzKFwiQXZhaWxhYmxlIENvbW1hbmRzOlwiKSk7XG59KTtcblxuRGVuby50ZXN0KFwiQ0xJIHNob3VsZCBkaXNwbGF5IGdlbmVyYWwgaGVscCB3aGVuIG5vIGNvbW1hbmQgaXMgcHJvdmlkZWRcIiwgYXN5bmMgKCkgPT4ge1xuXHRjb25zdCBjbGkgPSBuZXcgQ0xJKHVuZGVmaW5lZCwgdHJ1ZSwgdHJ1ZSk7IC8vIEVuYWJsZSB0ZXN0IG1vZGVcblxuXHQvLyBNb2NrIERlbm8uYXJnc1xuXHRjb25zdCBvcmlnaW5hbEFyZ3MgPSBEZW5vLmFyZ3M7XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShEZW5vLCBcImFyZ3NcIiwgeyB2YWx1ZTogW10gfSk7XG5cblx0Y29uc3QgeyBzdGRvdXQgfSA9IGF3YWl0IGNhcHR1cmVDb25zb2xlT3V0cHV0KGFzeW5jICgpID0+IHtcblx0XHRhd2FpdCBjbGkucnVuKCk7XG5cdH0pO1xuXG5cdC8vIFJlc3RvcmUgRGVuby5hcmdzXG5cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KERlbm8sIFwiYXJnc1wiLCB7IHZhbHVlOiBvcmlnaW5hbEFyZ3MgfSk7XG5cblx0YXNzZXJ0KHN0ZG91dC5pbmNsdWRlcyhcIkF2YWlsYWJsZSBDb21tYW5kczpcIikpO1xufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsb0JBQW9CO0FBQ3BCLFNBQVMsR0FBRyxRQUFRLGlCQUFpQixDQUFDLDBCQUEwQjtBQUdoRSxTQUNDLE1BQU0sRUFDTixZQUFZLFFBQ04sbURBQW1EO0FBRTFELDRDQUE0QztBQUM1QyxlQUFlLHFCQUNkLElBQWdDO0VBRWhDLE1BQU0sY0FBYyxRQUFRLEdBQUc7RUFDL0IsTUFBTSxnQkFBZ0IsUUFBUSxLQUFLO0VBQ25DLElBQUksU0FBUztFQUNiLElBQUksU0FBUztFQUViLFFBQVEsR0FBRyxHQUFHLENBQUM7SUFDZCxVQUFVLE9BQU8sT0FBTztFQUN6QjtFQUVBLFFBQVEsS0FBSyxHQUFHLENBQUM7SUFDaEIsVUFBVSxPQUFPLE9BQU87RUFDekI7RUFFQSxJQUFJO0lBQ0gsTUFBTSxTQUFTO0lBQ2YsSUFBSSxrQkFBa0IsU0FBUztNQUM5QixNQUFNO0lBQ1A7RUFDRCxTQUFVO0lBQ1QsUUFBUSxHQUFHLEdBQUc7SUFDZCxRQUFRLEtBQUssR0FBRztFQUNqQjtFQUVBLE9BQU87SUFBRTtJQUFRO0VBQU87QUFDekI7QUFFQSxLQUFLLElBQUksQ0FBQyxrREFBa0Q7RUFDM0QsTUFBTSxNQUFNLElBQUksSUFBSSxXQUFXLE1BQU0sT0FBTyxtQkFBbUI7RUFFL0QsSUFBSSxTQUFTO0VBRWIsTUFBTSxlQUF3QjtJQUM3QixNQUFNO0lBQ04sYUFBYTtJQUNiLFNBQVM7TUFDUjtRQUFFLE1BQU07UUFBUSxPQUFPO1FBQUssTUFBTTtRQUFVLFVBQVU7TUFBSztNQUMzRDtRQUFFLE1BQU07UUFBVyxPQUFPO1FB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
// denoCacheMetadata=2654091683106923289,13123900074456592081