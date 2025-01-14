// tests/unit/core/command.test.ts
import { assertEquals } from "@std/assert";
import { CommandRegistry } from "../../../src/command.ts";
import { TestHarness } from "../../utils/test_harness.ts";
Deno.test("CommandRegistry - comprehensive command management", async (t)=>{
  const harness = new TestHarness();
  await t.step("registration and retrieval", async ()=>{
    const registry = new CommandRegistry();
    const command = {
      name: "test",
      description: "Test command",
      options: [
        {
          name: "flag",
          type: "string",
          required: true
        }
      ],
      action: ()=>{}
    };
    registry.register(command);
    const retrieved = registry.findCommand("test");
    assertEquals(retrieved?.name, command.name);
    assertEquals(retrieved?.description, command.description);
  });
  await t.step("subcommand handling", async ()=>{
    const registry = new CommandRegistry();
    const command = {
      name: "parent",
      subcommands: [
        {
          name: "child",
          action: ()=>{}
        }
      ],
      action: ()=>{}
    };
    registry.register(command);
    const subcommand = registry.findSubcommand(command, [
      "child"
    ]);
    assertEquals(subcommand?.name, "child");
  });
  await t.step("alias resolution", async ()=>{
    const registry = new CommandRegistry();
    const command = {
      name: "test",
      aliases: [
        "t",
        "tst"
      ],
      action: ()=>{}
    };
    registry.register(command);
    const byAlias1 = registry.findCommand("t");
    const byAlias2 = registry.findCommand("tst");
    assertEquals(byAlias1?.name, command.name);
    assertEquals(byAlias2?.name, command.name);
  });
  await harness.cleanup();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy91bml0L2NvcmUvY29tbWFuZC50ZXN0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHRlc3RzL3VuaXQvY29yZS9jb21tYW5kLnRlc3QudHNcbmltcG9ydCB7IGFzc2VydEVxdWFscywgYXNzZXJ0UmVqZWN0cyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tbWFuZFJlZ2lzdHJ5IH0gZnJvbSBcIi4uLy4uLy4uL3NyYy9jb21tYW5kLnRzXCI7XG5pbXBvcnQgeyBUZXN0SGFybmVzcyB9IGZyb20gXCIuLi8uLi91dGlscy90ZXN0X2hhcm5lc3MudHNcIjtcblxuRGVuby50ZXN0KFwiQ29tbWFuZFJlZ2lzdHJ5IC0gY29tcHJlaGVuc2l2ZSBjb21tYW5kIG1hbmFnZW1lbnRcIiwgYXN5bmMgKHQpID0+IHtcblx0Y29uc3QgaGFybmVzcyA9IG5ldyBUZXN0SGFybmVzcygpO1xuXG5cdGF3YWl0IHQuc3RlcChcInJlZ2lzdHJhdGlvbiBhbmQgcmV0cmlldmFsXCIsIGFzeW5jICgpID0+IHtcblx0XHRjb25zdCByZWdpc3RyeSA9IG5ldyBDb21tYW5kUmVnaXN0cnkoKTtcblx0XHRjb25zdCBjb21tYW5kOiBDb21tYW5kID0ge1xuXHRcdFx0bmFtZTogXCJ0ZXN0XCIsXG5cdFx0XHRkZXNjcmlwdGlvbjogXCJUZXN0IGNvbW1hbmRcIixcblx0XHRcdG9wdGlvbnM6IFt7XG5cdFx0XHRcdG5hbWU6IFwiZmxhZ1wiLFxuXHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0XHRyZXF1aXJlZDogdHJ1ZSxcblx0XHRcdH1dLFxuXHRcdFx0YWN0aW9uOiAoKSA9PiB7fSxcblx0XHR9O1xuXG5cdFx0cmVnaXN0cnkucmVnaXN0ZXIoY29tbWFuZCk7XG5cdFx0Y29uc3QgcmV0cmlldmVkID0gcmVnaXN0cnkuZmluZENvbW1hbmQoXCJ0ZXN0XCIpO1xuXHRcdGFzc2VydEVxdWFscyhyZXRyaWV2ZWQ/Lm5hbWUsIGNvbW1hbmQubmFtZSk7XG5cdFx0YXNzZXJ0RXF1YWxzKHJldHJpZXZlZD8uZGVzY3JpcHRpb24sIGNvbW1hbmQuZGVzY3JpcHRpb24pO1xuXHR9KTtcblxuXHRhd2FpdCB0LnN0ZXAoXCJzdWJjb21tYW5kIGhhbmRsaW5nXCIsIGFzeW5jICgpID0+IHtcblx0XHRjb25zdCByZWdpc3RyeSA9IG5ldyBDb21tYW5kUmVnaXN0cnkoKTtcblx0XHRjb25zdCBjb21tYW5kOiBDb21tYW5kID0ge1xuXHRcdFx0bmFtZTogXCJwYXJlbnRcIixcblx0XHRcdHN1YmNvbW1hbmRzOiBbe1xuXHRcdFx0XHRuYW1lOiBcImNoaWxkXCIsXG5cdFx0XHRcdGFjdGlvbjogKCkgPT4ge30sXG5cdFx0XHR9XSxcblx0XHRcdGFjdGlvbjogKCkgPT4ge30sXG5cdFx0fTtcblxuXHRcdHJlZ2lzdHJ5LnJlZ2lzdGVyKGNvbW1hbmQpO1xuXHRcdGNvbnN0IHN1YmNvbW1hbmQgPSByZWdpc3RyeS5maW5kU3ViY29tbWFuZChjb21tYW5kLCBbXCJjaGlsZFwiXSk7XG5cdFx0YXNzZXJ0RXF1YWxzKHN1YmNvbW1hbmQ/Lm5hbWUsIFwiY2hpbGRcIik7XG5cdH0pO1xuXG5cdGF3YWl0IHQuc3RlcChcImFsaWFzIHJlc29sdXRpb25cIiwgYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IHJlZ2lzdHJ5ID0gbmV3IENvbW1hbmRSZWdpc3RyeSgpO1xuXHRcdGNvbnN0IGNvbW1hbmQ6IENvbW1hbmQgPSB7XG5cdFx0XHRuYW1lOiBcInRlc3RcIixcblx0XHRcdGFsaWFzZXM6IFtcInRcIiwgXCJ0c3RcIl0sXG5cdFx0XHRhY3Rpb246ICgpID0+IHt9LFxuXHRcdH07XG5cblx0XHRyZWdpc3RyeS5yZWdpc3Rlcihjb21tYW5kKTtcblx0XHRjb25zdCBieUFsaWFzMSA9IHJlZ2lzdHJ5LmZpbmRDb21tYW5kKFwidFwiKTtcblx0XHRjb25zdCBieUFsaWFzMiA9IHJlZ2lzdHJ5LmZpbmRDb21tYW5kKFwidHN0XCIpO1xuXHRcdGFzc2VydEVxdWFscyhieUFsaWFzMT8ubmFtZSwgY29tbWFuZC5uYW1lKTtcblx0XHRhc3NlcnRFcXVhbHMoYnlBbGlhczI/Lm5hbWUsIGNvbW1hbmQubmFtZSk7XG5cdH0pO1xuXG5cdGF3YWl0IGhhcm5lc3MuY2xlYW51cCgpO1xufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsa0NBQWtDO0FBQ2xDLFNBQVMsWUFBWSxRQUF1QixjQUFjO0FBQzFELFNBQWtCLGVBQWUsUUFBUSwwQkFBMEI7QUFDbkUsU0FBUyxXQUFXLFFBQVEsOEJBQThCO0FBRTFELEtBQUssSUFBSSxDQUFDLHNEQUFzRCxPQUFPO0VBQ3RFLE1BQU0sVUFBVSxJQUFJO0VBRXBCLE1BQU0sRUFBRSxJQUFJLENBQUMsOEJBQThCO0lBQzFDLE1BQU0sV0FBVyxJQUFJO0lBQ3JCLE1BQU0sVUFBbUI7TUFDeEIsTUFBTTtNQUNOLGFBQWE7TUFDYixTQUFTO1FBQUM7VUFDVCxNQUFNO1VBQ04sTUFBTTtVQUNOLFVBQVU7UUFDWDtPQUFFO01BQ0YsUUFBUSxLQUFPO0lBQ2hCO0lBRUEsU0FBUyxRQUFRLENBQUM7SUFDbEIsTUFBTSxZQUFZLFNBQVMsV0FBVyxDQUFDO0lBQ3ZDLGFBQWEsV0FBVyxNQUFNLFFBQVEsSUFBSTtJQUMxQyxhQUFhLFdBQVcsYUFBYSxRQUFRLFdBQVc7RUFDekQ7RUFFQSxNQUFNLEVBQUUsSUFBSSxDQUFDLHVCQUF1QjtJQUNuQyxNQUFNLFdBQVcsSUFBSTtJQUNyQixNQUFNLFVBQW1CO01BQ3hCLE1BQU07TUFDTixhQUFhO1FBQUM7VUFDYixNQUFNO1VBQ04sUUFBUSxLQUFPO1FBQ2hCO09BQUU7TUFDRixRQUFRLEtBQU87SUFDaEI7SUFFQSxTQUFTLFFBQVEsQ0FBQztJQUNsQixNQUFNLGFBQWEsU0FBUyxjQUFjLENBQUMsU0FBUztNQUFDO0tBQVE7SUFDN0QsYUFBYSxZQUFZLE1BQU07RUFDaEM7RUFFQSxNQUFNLEVBQUUsSUFBSSxDQUFDLG9CQUFvQjtJQUNoQyxNQUFNLFdBQVcsSUFBSTtJQUNyQixNQUFNLFVBQW1CO01BQ3hCLE1BQU07TUFDTixTQUFTO1FBQUM7UUFBSztPQUFNO01BQ3JCLFFBQVEsS0FBTztJQUNoQjtJQUVBLFNBQVMsUUFBUSxDQUFDO0lBQ2xCLE1BQU0sV0FBVyxTQUFTLFdBQVcsQ0FBQztJQUN0QyxNQUFNLFdBQVcsU0FBUyxXQUFXLENBQUM7SUFDdEMsYUFBYSxVQUFVLE1BQU0sUUFBUSxJQUFJO0lBQ3pDLGFBQWEsVUFBVSxNQUFNLFFBQVEsSUFBSTtFQUMxQztFQUVBLE1BQU0sUUFBUSxPQUFPO0FBQ3RCIn0=
// denoCacheMetadata=10891569394503231270,6693629005079771249