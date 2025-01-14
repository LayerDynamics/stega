// tests/batch_command.test.ts
import { assertEquals, assertRejects } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { CLI } from "../src/core.ts";
import { createBatchCommand } from "../src/commands/batch_command.ts"; // Import factory function
import { CommandNotFoundError } from "../src/error.ts"; // Ensure this path is correct
/**
 * Mock Logger to intercept log messages during tests.
 */ class MockLogger {
  logs = [];
  errors = [];
  debugs = [];
  warns = [];
  info(message) {
    this.logs.push(message);
  }
  error(message) {
    this.errors.push(message);
  }
  debug(message) {
    this.debugs.push(message);
  }
  warn(message) {
    this.warns.push(message);
  }
}
/**
 * Helper function to create a fresh test CLI instance with a mock logger.
 */ const createTestCLI = ()=>{
  const mockLogger = new MockLogger();
  const cli = new CLI(undefined, true, true, mockLogger);
  return cli;
};
/**
 * Deno.test for Batch command - parallel execution
 */ Deno.test("Batch command - parallel execution", async ()=>{
  const cli = createTestCLI();
  const executed = new Set();
  const mockLogger = cli.logger;
  // Register commands with execution tracking
  const batchCommand = createBatchCommand(cli);
  cli.register(batchCommand);
  cli.register({
    name: "cmd1",
    description: "First test command",
    action: ()=>{
      executed.add("cmd1");
    }
  });
  cli.register({
    name: "cmd2",
    description: "Second test command",
    action: ()=>{
      executed.add("cmd2");
    }
  });
  // Execute batch command in parallel with separate flag arguments
  await cli.runCommand([
    "batch",
    "--commands",
    "cmd1,cmd2",
    "--parallel",
    "true"
  ]);
  // Assertions
  assertEquals(executed.size, 2, "Both cmd1 and cmd2 should have been executed");
  assertEquals(executed.has("cmd1"), true, "cmd1 should have been executed");
  assertEquals(executed.has("cmd2"), true, "cmd2 should have been executed");
  // Verify logs
  assertEquals(mockLogger.logs.includes("Executing 2 command(s) in parallel"), true);
  assertEquals(mockLogger.logs.includes("Batch execution completed successfully"), true);
});
/**
 * Deno.test for Batch command - sequential execution
 */ Deno.test("Batch command - sequential execution", async ()=>{
  const cli = createTestCLI();
  const executed = [];
  const mockLogger = cli.logger;
  // Register commands with execution tracking
  const batchCommand = createBatchCommand(cli);
  cli.register(batchCommand);
  cli.register({
    name: "cmd1",
    description: "First test command",
    action: ()=>{
      executed.push("cmd1");
    }
  });
  cli.register({
    name: "cmd2",
    description: "Second test command",
    action: ()=>{
      executed.push("cmd2");
    }
  });
  // Execute batch command sequentially with separate flag arguments
  await cli.runCommand([
    "batch",
    "--commands",
    "cmd1,cmd2"
  ]);
  // Assertions
  assertEquals(executed.length, 2, "Both cmd1 and cmd2 should have been executed");
  assertEquals(executed[0], "cmd1", "cmd1 should have been executed first");
  assertEquals(executed[1], "cmd2", "cmd2 should have been executed second");
  // Verify logs
  assertEquals(mockLogger.logs.includes("Executing 2 command(s) sequentially"), true);
  assertEquals(mockLogger.logs.includes("Batch execution completed successfully"), true);
});
/**
 * Deno.test for Batch command - error handling with missing command
 */ Deno.test("Batch command - error handling with missing command", async ()=>{
  const cli = createTestCLI();
  const errorMessage = `Command "nonexistent" not found.`;
  const mockLogger = cli.logger;
  // Register only batchCommand without registering 'nonexistent'
  const batchCommand = createBatchCommand(cli);
  cli.register(batchCommand);
  // Execute batch command with a non-existent command
  await assertRejects(async ()=>{
    await cli.runCommand([
      "batch",
      "--commands",
      "nonexistent"
    ]);
  }, CommandNotFoundError, errorMessage, 'Should throw CommandNotFoundError when "nonexistent" is not registered');
  // Verify error logs
  assertEquals(mockLogger.errors.includes(`Command "nonexistent" not found.`), true);
});
/**
 * Deno.test for Batch command - single command execution
 */ Deno.test("Batch command - single command execution", async ()=>{
  const cli = createTestCLI();
  let executed = false;
  const mockLogger = cli.logger;
  // Register batchCommand and a single command
  const batchCommand = createBatchCommand(cli);
  cli.register(batchCommand);
  cli.register({
    name: "single-cmd",
    description: "Single test command",
    action: ()=>{
      executed = true;
    }
  });
  // Execute batch command with a single command
  await cli.runCommand([
    "batch",
    "--commands",
    "single-cmd"
  ]);
  // Assertions
  assertEquals(executed, true, "single-cmd should have been executed");
  // Verify logs
  assertEquals(mockLogger.logs.includes("Executing 1 command(s) sequentially"), true);
  assertEquals(mockLogger.logs.includes("Batch execution completed successfully"), true);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9iYXRjaF9jb21tYW5kLnRlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGVzdHMvYmF0Y2hfY29tbWFuZC50ZXN0LnRzXG5pbXBvcnQge1xuXHRhc3NlcnRFcXVhbHMsXG5cdGFzc2VydFJlamVjdHMsXG59IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4yMDMuMC90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbmltcG9ydCB7IENMSSB9IGZyb20gXCIuLi9zcmMvY29yZS50c1wiO1xuaW1wb3J0IHsgY3JlYXRlQmF0Y2hDb21tYW5kIH0gZnJvbSBcIi4uL3NyYy9jb21tYW5kcy9iYXRjaF9jb21tYW5kLnRzXCI7IC8vIEltcG9ydCBmYWN0b3J5IGZ1bmN0aW9uXG5pbXBvcnQgeyBDb21tYW5kTm90Rm91bmRFcnJvciB9IGZyb20gXCIuLi9zcmMvZXJyb3IudHNcIjsgLy8gRW5zdXJlIHRoaXMgcGF0aCBpcyBjb3JyZWN0XG5cbi8qKlxuICogTW9jayBMb2dnZXIgdG8gaW50ZXJjZXB0IGxvZyBtZXNzYWdlcyBkdXJpbmcgdGVzdHMuXG4gKi9cbmNsYXNzIE1vY2tMb2dnZXIge1xuXHRsb2dzOiBzdHJpbmdbXSA9IFtdO1xuXHRlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cdGRlYnVnczogc3RyaW5nW10gPSBbXTtcblx0d2FybnM6IHN0cmluZ1tdID0gW107IC8vIEFkZGVkICd3YXJucycgYXJyYXlcblxuXHRpbmZvKG1lc3NhZ2U6IHN0cmluZykge1xuXHRcdHRoaXMubG9ncy5wdXNoKG1lc3NhZ2UpO1xuXHR9XG5cblx0ZXJyb3IobWVzc2FnZTogc3RyaW5nKSB7XG5cdFx0dGhpcy5lcnJvcnMucHVzaChtZXNzYWdlKTtcblx0fVxuXG5cdGRlYnVnKG1lc3NhZ2U6IHN0cmluZykge1xuXHRcdHRoaXMuZGVidWdzLnB1c2gobWVzc2FnZSk7XG5cdH1cblxuXHR3YXJuKG1lc3NhZ2U6IHN0cmluZykge1xuXHRcdHRoaXMud2FybnMucHVzaChtZXNzYWdlKTtcblx0fVxufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBjcmVhdGUgYSBmcmVzaCB0ZXN0IENMSSBpbnN0YW5jZSB3aXRoIGEgbW9jayBsb2dnZXIuXG4gKi9cbmNvbnN0IGNyZWF0ZVRlc3RDTEkgPSAoKTogQ0xJID0+IHtcblx0Y29uc3QgbW9ja0xvZ2dlciA9IG5ldyBNb2NrTG9nZ2VyKCk7XG5cdGNvbnN0IGNsaSA9IG5ldyBDTEkodW5kZWZpbmVkLCB0cnVlLCB0cnVlLCBtb2NrTG9nZ2VyKTtcblx0cmV0dXJuIGNsaTtcbn07XG5cbi8qKlxuICogRGVuby50ZXN0IGZvciBCYXRjaCBjb21tYW5kIC0gcGFyYWxsZWwgZXhlY3V0aW9uXG4gKi9cbkRlbm8udGVzdChcIkJhdGNoIGNvbW1hbmQgLSBwYXJhbGxlbCBleGVjdXRpb25cIiwgYXN5bmMgKCkgPT4ge1xuXHRjb25zdCBjbGkgPSBjcmVhdGVUZXN0Q0xJKCk7XG5cdGNvbnN0IGV4ZWN1dGVkID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cdGNvbnN0IG1vY2tMb2dnZXIgPSAoY2xpLmxvZ2dlcikgYXMgTW9ja0xvZ2dlcjtcblxuXHQvLyBSZWdpc3RlciBjb21tYW5kcyB3aXRoIGV4ZWN1dGlvbiB0cmFja2luZ1xuXHRjb25zdCBiYXRjaENvbW1hbmQgPSBjcmVhdGVCYXRjaENvbW1hbmQoY2xpKTtcblx0Y2xpLnJlZ2lzdGVyKGJhdGNoQ29tbWFuZCk7XG5cblx0Y2xpLnJlZ2lzdGVyKHtcblx0XHRuYW1lOiBcImNtZDFcIixcblx0XHRkZXNjcmlwdGlvbjogXCJGaXJzdCB0ZXN0IGNvbW1hbmRcIixcblx0XHRhY3Rpb246ICgpID0+IHtcblx0XHRcdGV4ZWN1dGVkLmFkZChcImNtZDFcIik7XG5cdFx0fSxcblx0fSk7XG5cdGNsaS5yZWdpc3Rlcih7XG5cdFx0bmFtZTogXCJjbWQyXCIsXG5cdFx0ZGVzY3JpcHRpb246IFwiU2Vjb25kIHRlc3QgY29tbWFuZFwiLFxuXHRcdGFjdGlvbjogKCkgPT4ge1xuXHRcdFx0ZXhlY3V0ZWQuYWRkKFwiY21kMlwiKTtcblx0XHR9LFxuXHR9KTtcblxuXHQvLyBFeGVjdXRlIGJhdGNoIGNvbW1hbmQgaW4gcGFyYWxsZWwgd2l0aCBzZXBhcmF0ZSBmbGFnIGFyZ3VtZW50c1xuXHRhd2FpdCBjbGkucnVuQ29tbWFuZChbXG5cdFx0XCJiYXRjaFwiLFxuXHRcdFwiLS1jb21tYW5kc1wiLFxuXHRcdFwiY21kMSxjbWQyXCIsXG5cdFx0XCItLXBhcmFsbGVsXCIsXG5cdFx0XCJ0cnVlXCIsXG5cdF0pO1xuXG5cdC8vIEFzc2VydGlvbnNcblx0YXNzZXJ0RXF1YWxzKFxuXHRcdGV4ZWN1dGVkLnNpemUsXG5cdFx0Mixcblx0XHRcIkJvdGggY21kMSBhbmQgY21kMiBzaG91bGQgaGF2ZSBiZWVuIGV4ZWN1dGVkXCIsXG5cdCk7XG5cdGFzc2VydEVxdWFscyhleGVjdXRlZC5oYXMoXCJjbWQxXCIpLCB0cnVlLCBcImNtZDEgc2hvdWxkIGhhdmUgYmVlbiBleGVjdXRlZFwiKTtcblx0YXNzZXJ0RXF1YWxzKGV4ZWN1dGVkLmhhcyhcImNtZDJcIiksIHRydWUsIFwiY21kMiBzaG91bGQgaGF2ZSBiZWVuIGV4ZWN1dGVkXCIpO1xuXG5cdC8vIFZlcmlmeSBsb2dzXG5cdGFzc2VydEVxdWFscyhcblx0XHRtb2NrTG9nZ2VyLmxvZ3MuaW5jbHVkZXMoXCJFeGVjdXRpbmcgMiBjb21tYW5kKHMpIGluIHBhcmFsbGVsXCIpLFxuXHRcdHRydWUsXG5cdCk7XG5cdGFzc2VydEVxdWFscyhcblx0XHRtb2NrTG9nZ2VyLmxvZ3MuaW5jbHVkZXMoXCJCYXRjaCBleGVjdXRpb24gY29tcGxldGVkIHN1Y2Nlc3NmdWxseVwiKSxcblx0XHR0cnVlLFxuXHQpO1xufSk7XG5cbi8qKlxuICogRGVuby50ZXN0IGZvciBCYXRjaCBjb21tYW5kIC0gc2VxdWVudGlhbCBleGVjdXRpb25cbiAqL1xuRGVuby50ZXN0KFwiQmF0Y2ggY29tbWFuZCAtIHNlcXVlbnRpYWwgZXhlY3V0aW9uXCIsIGFzeW5jICgpID0+IHtcblx0Y29uc3QgY2xpID0gY3JlYXRlVGVzdENMSSgpO1xuXHRjb25zdCBleGVjdXRlZDogc3RyaW5nW10gPSBbXTtcblx0Y29uc3QgbW9ja0xvZ2dlciA9IChjbGkubG9nZ2VyKSBhcyBNb2NrTG9nZ2VyO1xuXG5cdC8vIFJlZ2lzdGVyIGNvbW1hbmRzIHdpdGggZXhlY3V0aW9uIHRyYWNraW5nXG5cdGNvbnN0IGJhdGNoQ29tbWFuZCA9IGNyZWF0ZUJhdGNoQ29tbWFuZChjbGkpO1xuXHRjbGkucmVnaXN0ZXIoYmF0Y2hDb21tYW5kKTtcblxuXHRjbGkucmVnaXN0ZXIoe1xuXHRcdG5hbWU6IFwiY21kMVwiLFxuXHRcdGRlc2NyaXB0aW9uOiBcIkZpcnN0IHRlc3QgY29tbWFuZFwiLFxuXHRcdGFjdGlvbjogKCkgPT4ge1xuXHRcdFx0ZXhlY3V0ZWQucHVzaChcImNtZDFcIik7XG5cdFx0fSxcblx0fSk7XG5cdGNsaS5yZWdpc3Rlcih7XG5cdFx0bmFtZTogXCJjbWQyXCIsXG5cdFx0ZGVzY3JpcHRpb246IFwiU2Vjb25kIHRlc3QgY29tbWFuZFwiLFxuXHRcdGFjdGlvbjogKCkgPT4ge1xuXHRcdFx0ZXhlY3V0ZWQucHVzaChcImNtZDJcIik7XG5cdFx0fSxcblx0fSk7XG5cblx0Ly8gRXhlY3V0ZSBiYXRjaCBjb21tYW5kIHNlcXVlbnRpYWxseSB3aXRoIHNlcGFyYXRlIGZsYWcgYXJndW1lbnRzXG5cdGF3YWl0IGNsaS5ydW5Db21tYW5kKFtcImJhdGNoXCIsIFwiLS1jb21tYW5kc1wiLCBcImNtZDEsY21kMlwiXSk7XG5cblx0Ly8gQXNzZXJ0aW9uc1xuXHRhc3NlcnRFcXVhbHMoXG5cdFx0ZXhlY3V0ZWQubGVuZ3RoLFxuXHRcdDIsXG5cdFx0XCJCb3RoIGNtZDEgYW5kIGNtZDIgc2hvdWxkIGhhdmUgYmVlbiBleGVjdXRlZFwiLFxuXHQpO1xuXHRhc3NlcnRFcXVhbHMoZXhlY3V0ZWRbMF0sIFwiY21kMVwiLCBcImNtZDEgc2hvdWxkIGhhdmUgYmVlbiBleGVjdXRlZCBmaXJzdFwiKTtcblx0YXNzZXJ0RXF1YWxzKGV4ZWN1dGVkWzFdLCBcImNtZDJcIiwgXCJjbWQyIHNob3VsZCBoYXZlIGJlZW4gZXhlY3V0ZWQgc2Vjb25kXCIpO1xuXG5cdC8vIFZlcmlmeSBsb2dzXG5cdGFzc2VydEVxdWFscyhcblx0XHRtb2NrTG9nZ2VyLmxvZ3MuaW5jbHVkZXMoXCJFeGVjdXRpbmcgMiBjb21tYW5kKHMpIHNlcXVlbnRpYWxseVwiKSxcblx0XHR0cnVlLFxuXHQpO1xuXHRhc3NlcnRFcXVhbHMoXG5cdFx0bW9ja0xvZ2dlci5sb2dzLmluY2x1ZGVzKFwiQmF0Y2ggZXhlY3V0aW9uIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHlcIiksXG5cdFx0dHJ1ZSxcblx0KTtcbn0pO1xuXG4vKipcbiAqIERlbm8udGVzdCBmb3IgQmF0Y2ggY29tbWFuZCAtIGVycm9yIGhhbmRsaW5nIHdpdGggbWlzc2luZyBjb21tYW5kXG4gKi9cbkRlbm8udGVzdChcIkJhdGNoIGNvbW1hbmQgLSBlcnJvciBoYW5kbGluZyB3aXRoIG1pc3NpbmcgY29tbWFuZFwiLCBhc3luYyAoKSA9PiB7XG5cdGNvbnN0IGNsaSA9IGNyZWF0ZVRlc3RDTEkoKTtcblx0Y29uc3QgZXJyb3JNZXNzYWdlID0gYENvbW1hbmQgXCJub25leGlzdGVudFwiIG5vdCBmb3VuZC5gO1xuXHRjb25zdCBtb2NrTG9nZ2VyID0gKGNsaS5sb2dnZXIpIGFzIE1vY2tMb2dnZXI7XG5cblx0Ly8gUmVnaXN0ZXIgb25seSBiYXRjaENvbW1hbmQgd2l0aG91dCByZWdpc3RlcmluZyAnbm9uZXhpc3RlbnQnXG5cdGNvbnN0IGJhdGNoQ29tbWFuZCA9IGNyZWF0ZUJhdGNoQ29tbWFuZChjbGkpO1xuXHRjbGkucmVnaXN0ZXIoYmF0Y2hDb21tYW5kKTtcblxuXHQvLyBFeGVjdXRlIGJhdGNoIGNvbW1hbmQgd2l0aCBhIG5vbi1leGlzdGVudCBjb21tYW5kXG5cdGF3YWl0IGFzc2VydFJlamVjdHMoXG5cdFx0YXN5bmMgKCkgPT4ge1xuXHRcdFx0YXdhaXQgY2xpLnJ1bkNvbW1hbmQoW1wiYmF0Y2hcIiwgXCItLWNvbW1hbmRzXCIsIFwibm9uZXhpc3RlbnRcIl0pO1xuXHRcdH0sXG5cdFx0Q29tbWFuZE5vdEZvdW5kRXJyb3IsXG5cdFx0ZXJyb3JNZXNzYWdlLFxuXHRcdCdTaG91bGQgdGhyb3cgQ29tbWFuZE5vdEZvdW5kRXJyb3Igd2hlbiBcIm5vbmV4aXN0ZW50XCIgaXMgbm90IHJlZ2lzdGVyZWQnLFxuXHQpO1xuXG5cdC8vIFZlcmlmeSBlcnJvciBsb2dzXG5cdGFzc2VydEVxdWFscyhcblx0XHRtb2NrTG9nZ2VyLmVycm9ycy5pbmNsdWRlcyhgQ29tbWFuZCBcIm5vbmV4aXN0ZW50XCIgbm90IGZvdW5kLmApLFxuXHRcdHRydWUsXG5cdCk7XG59KTtcblxuLyoqXG4gKiBEZW5vLnRlc3QgZm9yIEJhdGNoIGNvbW1hbmQgLSBzaW5nbGUgY29tbWFuZCBleGVjdXRpb25cbiAqL1xuRGVuby50ZXN0KFwiQmF0Y2ggY29tbWFuZCAtIHNpbmdsZSBjb21tYW5kIGV4ZWN1dGlvblwiLCBhc3luYyAoKSA9PiB7XG5cdGNvbnN0IGNsaSA9IGNyZWF0ZVRlc3RDTEkoKTtcblx0bGV0IGV4ZWN1dGVkID0gZmFsc2U7XG5cdGNvbnN0IG1vY2tMb2dnZXIgPSAoY2xpLmxvZ2dlcikgYXMgTW9ja0xvZ2dlcjtcblxuXHQvLyBSZWdpc3RlciBiYXRjaENvbW1hbmQgYW5kIGEgc2luZ2xlIGNvbW1hbmRcblx0Y29uc3QgYmF0Y2hDb21tYW5kID0gY3JlYXRlQmF0Y2hDb21tYW5kKGNsaSk7XG5cdGNsaS5yZWdpc3RlcihiYXRjaENvbW1hbmQpO1xuXHRjbGkucmVnaXN0ZXIoe1xuXHRcdG5hbWU6IFwic2luZ2xlLWNtZFwiLFxuXHRcdGRlc2NyaXB0aW9uOiBcIlNpbmdsZSB0ZXN0IGNvbW1hbmRcIixcblx0XHRhY3Rpb246ICgpID0+IHtcblx0XHRcdGV4ZWN1dGVkID0gdHJ1ZTtcblx0XHR9LFxuXHR9KTtcblxuXHQvLyBFeGVjdXRlIGJhdGNoIGNvbW1hbmQgd2l0aCBhIHNpbmdsZSBjb21tYW5kXG5cdGF3YWl0IGNsaS5ydW5Db21tYW5kKFtcImJhdGNoXCIsIFwiLS1jb21tYW5kc1wiLCBcInNpbmdsZS1jbWRcIl0pO1xuXG5cdC8vIEFzc2VydGlvbnNcblx0YXNzZXJ0RXF1YWxzKGV4ZWN1dGVkLCB0cnVlLCBcInNpbmdsZS1jbWQgc2hvdWxkIGhhdmUgYmVlbiBleGVjdXRlZFwiKTtcblxuXHQvLyBWZXJpZnkgbG9nc1xuXHRhc3NlcnRFcXVhbHMoXG5cdFx0bW9ja0xvZ2dlci5sb2dzLmluY2x1ZGVzKFwiRXhlY3V0aW5nIDEgY29tbWFuZChzKSBzZXF1ZW50aWFsbHlcIiksXG5cdFx0dHJ1ZSxcblx0KTtcblx0YXNzZXJ0RXF1YWxzKFxuXHRcdG1vY2tMb2dnZXIubG9ncy5pbmNsdWRlcyhcIkJhdGNoIGV4ZWN1dGlvbiBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5XCIpLFxuXHRcdHRydWUsXG5cdCk7XG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSw4QkFBOEI7QUFDOUIsU0FDQyxZQUFZLEVBQ1osYUFBYSxRQUNQLG1EQUFtRDtBQUMxRCxTQUFTLEdBQUcsUUFBUSxpQkFBaUI7QUFDckMsU0FBUyxrQkFBa0IsUUFBUSxtQ0FBbUMsQ0FBQywwQkFBMEI7QUFDakcsU0FBUyxvQkFBb0IsUUFBUSxrQkFBa0IsQ0FBQyw4QkFBOEI7QUFFdEY7O0NBRUMsR0FDRCxNQUFNO0VBQ0wsT0FBaUIsRUFBRSxDQUFDO0VBQ3BCLFNBQW1CLEVBQUUsQ0FBQztFQUN0QixTQUFtQixFQUFFLENBQUM7RUFDdEIsUUFBa0IsRUFBRSxDQUFDO0VBRXJCLEtBQUssT0FBZSxFQUFFO0lBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0VBQ2hCO0VBRUEsTUFBTSxPQUFlLEVBQUU7SUFDdEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7RUFDbEI7RUFFQSxNQUFNLE9BQWUsRUFBRTtJQUN0QixJ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
// denoCacheMetadata=2929612824474617775,12743465891346994457