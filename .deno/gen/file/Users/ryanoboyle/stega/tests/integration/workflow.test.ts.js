// tests/integration/workflow.test.ts
import { TestHarness } from "../utils/test_harness.ts";
import { assertEquals } from "@std/assert";
Deno.test("Workflow Integration - command chaining", async (t)=>{
  const harness = new TestHarness();
  const cli = harness.getCLI();
  const logger = harness.getLogger();
  const executed = [];
  // Register test commands
  cli.register({
    name: "first",
    action: ()=>{
      executed.push("first");
    }
  });
  cli.register({
    name: "second",
    action: ()=>{
      executed.push("second");
    }
  });
  await t.step("executes commands in sequence", async ()=>{
    await cli.runCommand([
      "first"
    ]);
    await cli.runCommand([
      "second"
    ]);
    assertEquals(executed, [
      "first",
      "second"
    ]);
    assertEquals(logger.errors.length, 0);
  });
  await harness.cleanup();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9pbnRlZ3JhdGlvbi93b3JrZmxvdy50ZXN0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHRlc3RzL2ludGVncmF0aW9uL3dvcmtmbG93LnRlc3QudHNcbmltcG9ydCB7IFRlc3RIYXJuZXNzIH0gZnJvbSBcIi4uL3V0aWxzL3Rlc3RfaGFybmVzcy50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG5cbkRlbm8udGVzdChcIldvcmtmbG93IEludGVncmF0aW9uIC0gY29tbWFuZCBjaGFpbmluZ1wiLCBhc3luYyAodCkgPT4ge1xuXHRjb25zdCBoYXJuZXNzID0gbmV3IFRlc3RIYXJuZXNzKCk7XG5cdGNvbnN0IGNsaSA9IGhhcm5lc3MuZ2V0Q0xJKCk7XG5cdGNvbnN0IGxvZ2dlciA9IGhhcm5lc3MuZ2V0TG9nZ2VyKCk7XG5cblx0Y29uc3QgZXhlY3V0ZWQ6IHN0cmluZ1tdID0gW107XG5cblx0Ly8gUmVnaXN0ZXIgdGVzdCBjb21tYW5kc1xuXHRjbGkucmVnaXN0ZXIoe1xuXHRcdG5hbWU6IFwiZmlyc3RcIixcblx0XHRhY3Rpb246ICgpID0+IHtcblx0XHRcdGV4ZWN1dGVkLnB1c2goXCJmaXJzdFwiKTtcblx0XHR9LFxuXHR9KTtcblxuXHRjbGkucmVnaXN0ZXIoe1xuXHRcdG5hbWU6IFwic2Vjb25kXCIsXG5cdFx0YWN0aW9uOiAoKSA9PiB7XG5cdFx0XHRleGVjdXRlZC5wdXNoKFwic2Vjb25kXCIpO1xuXHRcdH0sXG5cdH0pO1xuXG5cdGF3YWl0IHQuc3RlcChcImV4ZWN1dGVzIGNvbW1hbmRzIGluIHNlcXVlbmNlXCIsIGFzeW5jICgpID0+IHtcblx0XHRhd2FpdCBjbGkucnVuQ29tbWFuZChbXCJmaXJzdFwiXSk7XG5cdFx0YXdhaXQgY2xpLnJ1bkNvbW1hbmQoW1wic2Vjb25kXCJdKTtcblxuXHRcdGFzc2VydEVxdWFscyhleGVjdXRlZCwgW1wiZmlyc3RcIiwgXCJzZWNvbmRcIl0pO1xuXHRcdGFzc2VydEVxdWFscyhsb2dnZXIuZXJyb3JzLmxlbmd0aCwgMCk7XG5cdH0pO1xuXG5cdGF3YWl0IGhhcm5lc3MuY2xlYW51cCgpO1xufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscUNBQXFDO0FBQ3JDLFNBQVMsV0FBVyxRQUFRLDJCQUEyQjtBQUN2RCxTQUFTLFlBQVksUUFBUSxjQUFjO0FBRTNDLEtBQUssSUFBSSxDQUFDLDJDQUEyQyxPQUFPO0VBQzNELE1BQU0sVUFBVSxJQUFJO0VBQ3BCLE1BQU0sTUFBTSxRQUFRLE1BQU07RUFDMUIsTUFBTSxTQUFTLFFBQVEsU0FBUztFQUVoQyxNQUFNLFdBQXFCLEVBQUU7RUFFN0IseUJBQXlCO0VBQ3pCLElBQUksUUFBUSxDQUFDO0lBQ1osTUFBTTtJQUNOLFFBQVE7TUFDUCxTQUFTLElBQUksQ0FBQztJQUNmO0VBQ0Q7RUFFQSxJQUFJLFFBQVEsQ0FBQztJQUNaLE1BQU07SUFDTixRQUFRO01BQ1AsU0FBUyxJQUFJLENBQUM7SUFDZjtFQUNEO0VBRUEsTUFBTSxFQUFFLElBQUksQ0FBQyxpQ0FBaUM7SUFDN0MsTUFBTSxJQUFJLFVBQVUsQ0FBQztNQUFDO0tBQVE7SUFDOUIsTUFBTSxJQUFJLFVBQVUsQ0FBQztNQUFDO0tBQVM7SUFFL0IsYUFBYSxVQUFVO01BQUM7TUFBUztLQUFTO0lBQzFDLGFBQWEsT0FBTyxNQUFNLENBQUMsTUFBTSxFQUFFO0VBQ3BDO0VBRUEsTUFBTSxRQUFRLE9BQU87QUFDdEIifQ==
// denoCacheMetadata=9197036049071466219,14811392448996585221