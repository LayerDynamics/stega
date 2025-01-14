// tests/command.test.ts
import { CommandRegistry } from "../src/command.ts";
import { assert, assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
Deno.test("CommandRegistry should register and retrieve commands", ()=>{
  const registry = new CommandRegistry();
  const greetCommand = {
    name: "greet",
    action: ()=>{}
  };
  registry.register(greetCommand);
  const retrieved = registry.findCommand("greet");
  assert(retrieved);
  assertEquals(retrieved?.name, "greet");
});
Deno.test("CommandRegistry should handle aliases", ()=>{
  const registry = new CommandRegistry();
  const listCommand = {
    name: "list",
    aliases: [
      "ls",
      "dir"
    ],
    action: ()=>{}
  };
  registry.register(listCommand);
  assert(registry.findCommand("ls"));
  assert(registry.findCommand("dir"));
  assert(registry.findCommand("list"));
  assert(!registry.findCommand("unknown"));
});
Deno.test("CommandRegistry should find subcommands correctly", ()=>{
  const registry = new CommandRegistry();
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
  registry.register(userCommand);
  const subAdd = registry.findSubcommand(userCommand, [
    "add"
  ]);
  assert(subAdd);
  assertEquals(subAdd?.name, "add");
  const subRemove = registry.findSubcommand(userCommand, [
    "remove"
  ]);
  assert(subRemove);
  assertEquals(subRemove?.name, "remove");
  const subUnknown = registry.findSubcommand(userCommand, [
    "update"
  ]);
  assertEquals(subUnknown, undefined);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9jb21tYW5kLnRlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGVzdHMvY29tbWFuZC50ZXN0LnRzXG5pbXBvcnQgeyBDb21tYW5kLCBDb21tYW5kUmVnaXN0cnkgfSBmcm9tIFwiLi4vc3JjL2NvbW1hbmQudHNcIjtcbmltcG9ydCB7XG5cdGFzc2VydCxcblx0YXNzZXJ0RXF1YWxzLFxufSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuMjAzLjAvdGVzdGluZy9hc3NlcnRzLnRzXCI7XG5cbkRlbm8udGVzdChcIkNvbW1hbmRSZWdpc3RyeSBzaG91bGQgcmVnaXN0ZXIgYW5kIHJldHJpZXZlIGNvbW1hbmRzXCIsICgpID0+IHtcblx0Y29uc3QgcmVnaXN0cnkgPSBuZXcgQ29tbWFuZFJlZ2lzdHJ5KCk7XG5cblx0Y29uc3QgZ3JlZXRDb21tYW5kOiBDb21tYW5kID0ge1xuXHRcdG5hbWU6IFwiZ3JlZXRcIixcblx0XHRhY3Rpb246ICgpID0+IHt9LFxuXHR9O1xuXG5cdHJlZ2lzdHJ5LnJlZ2lzdGVyKGdyZWV0Q29tbWFuZCk7XG5cblx0Y29uc3QgcmV0cmlldmVkID0gcmVnaXN0cnkuZmluZENvbW1hbmQoXCJncmVldFwiKTtcblx0YXNzZXJ0KHJldHJpZXZlZCk7XG5cdGFzc2VydEVxdWFscyhyZXRyaWV2ZWQ/Lm5hbWUsIFwiZ3JlZXRcIik7XG59KTtcblxuRGVuby50ZXN0KFwiQ29tbWFuZFJlZ2lzdHJ5IHNob3VsZCBoYW5kbGUgYWxpYXNlc1wiLCAoKSA9PiB7XG5cdGNvbnN0IHJlZ2lzdHJ5ID0gbmV3IENvbW1hbmRSZWdpc3RyeSgpO1xuXG5cdGNvbnN0IGxpc3RDb21tYW5kOiBDb21tYW5kID0ge1xuXHRcdG5hbWU6IFwibGlzdFwiLFxuXHRcdGFsaWFzZXM6IFtcImxzXCIsIFwiZGlyXCJdLFxuXHRcdGFjdGlvbjogKCkgPT4ge30sXG5cdH07XG5cblx0cmVnaXN0cnkucmVnaXN0ZXIobGlzdENvbW1hbmQpO1xuXG5cdGFzc2VydChyZWdpc3RyeS5maW5kQ29tbWFuZChcImxzXCIpKTtcblx0YXNzZXJ0KHJlZ2lzdHJ5LmZpbmRDb21tYW5kKFwiZGlyXCIpKTtcblx0YXNzZXJ0KHJlZ2lzdHJ5LmZpbmRDb21tYW5kKFwibGlzdFwiKSk7XG5cdGFzc2VydCghcmVnaXN0cnkuZmluZENvbW1hbmQoXCJ1bmtub3duXCIpKTtcbn0pO1xuXG5EZW5vLnRlc3QoXCJDb21tYW5kUmVnaXN0cnkgc2hvdWxkIGZpbmQgc3ViY29tbWFuZHMgY29ycmVjdGx5XCIsICgpID0+IHtcblx0Y29uc3QgcmVnaXN0cnkgPSBuZXcgQ29tbWFuZFJlZ2lzdHJ5KCk7XG5cblx0Y29uc3QgdXNlckNvbW1hbmQ6IENvbW1hbmQgPSB7XG5cdFx0bmFtZTogXCJ1c2VyXCIsXG5cdFx0ZGVzY3JpcHRpb246IFwiVXNlciBtYW5hZ2VtZW50IGNvbW1hbmRzXCIsXG5cdFx0c3ViY29tbWFuZHM6IFtcblx0XHRcdHtcblx0XHRcdFx0bmFtZTogXCJhZGRcIixcblx0XHRcdFx0ZGVzY3JpcHRpb246IFwiQWRkIGEgbmV3IHVzZXJcIixcblx0XHRcdFx0YWN0aW9uOiAoKSA9PiB7fSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWU6IFwicmVtb3ZlXCIsXG5cdFx0XHRcdGRlc2NyaXB0aW9uOiBcIlJlbW92ZSBhbiBleGlzdGluZyB1c2VyXCIsXG5cdFx0XHRcdGFjdGlvbjogKCkgPT4ge30sXG5cdFx0XHR9LFxuXHRcdF0sXG5cdFx0YWN0aW9uOiAoKSA9PiB7fSxcblx0fTtcblxuXHRyZWdpc3RyeS5yZWdpc3Rlcih1c2VyQ29tbWFuZCk7XG5cblx0Y29uc3Qgc3ViQWRkID0gcmVnaXN0cnkuZmluZFN1YmNvbW1hbmQodXNlckNvbW1hbmQsIFtcImFkZFwiXSk7XG5cdGFzc2VydChzdWJBZGQpO1xuXHRhc3NlcnRFcXVhbHMoc3ViQWRkPy5uYW1lLCBcImFkZFwiKTtcblxuXHRjb25zdCBzdWJSZW1vdmUgPSByZWdpc3RyeS5maW5kU3ViY29tbWFuZCh1c2VyQ29tbWFuZCwgW1wicmVtb3ZlXCJdKTtcblx0YXNzZXJ0KHN1YlJlbW92ZSk7XG5cdGFzc2VydEVxdWFscyhzdWJSZW1vdmU/Lm5hbWUsIFwicmVtb3ZlXCIpO1xuXG5cdGNvbnN0IHN1YlVua25vd24gPSByZWdpc3RyeS5maW5kU3ViY29tbWFuZCh1c2VyQ29tbWFuZCwgW1widXBkYXRlXCJdKTtcblx0YXNzZXJ0RXF1YWxzKHN1YlVua25vd24sIHVuZGVmaW5lZCk7XG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx3QkFBd0I7QUFDeEIsU0FBa0IsZUFBZSxRQUFRLG9CQUFvQjtBQUM3RCxTQUNDLE1BQU0sRUFDTixZQUFZLFFBQ04sbURBQW1EO0FBRTFELEtBQUssSUFBSSxDQUFDLHlEQUF5RDtFQUNsRSxNQUFNLFdBQVcsSUFBSTtFQUVyQixNQUFNLGVBQXdCO0lBQzdCLE1BQU07SUFDTixRQUFRLEtBQU87RUFDaEI7RUFFQSxTQUFTLFFBQVEsQ0FBQztFQUVsQixNQUFNLFlBQVksU0FBUyxXQUFXLENBQUM7RUFDdkMsT0FBTztFQUNQLGFBQWEsV0FBVyxNQUFNO0FBQy9CO0FBRUEsS0FBSyxJQUFJLENBQUMseUNBQXlDO0VBQ2xELE1BQU0sV0FBVyxJQUFJO0VBRXJCLE1BQU0sY0FBdUI7SUFDNUIsTUFBTTtJQUNOLFNBQVM7TUFBQztNQUFNO0tBQU07SUFDdEIsUUFBUSxLQUFPO0VBQ2hCO0VBRUEsU0FBUyxRQUFRLENBQUM7RUFFbEIsT0FBTyxTQUFTLFdBQVcsQ0FBQztFQUM1QixPQUFPLFNBQVMsV0FBVyxDQUFDO0VBQzVCLE9BQU8sU0FBUyxXQUFXLENBQUM7RUFDNUIsT0FBTyxDQUFDLFNBQVMsV0FBVyxDQUFDO0FBQzlCO0FBRUEsS0FBSyxJQUFJLENBQUMscURBQXFEO0VBQzlELE1BQU0sV0FBVyxJQUFJO0VBRXJCLE1BQU0sY0FBdUI7SUFDNUIsTUFBTTtJQUNOLGFBQWE7SUFDYixhQUFhO01BQ1o7UUFDQyxNQUFNO1FBQ04sYUFBYTtRQUNiLFFBQVEsS0FBTztNQUNoQjtNQUNBO1FBQ0MsTUFBTTtRQUNOLGFBQWE7UUFDYixRQUFRLEtBQU87TUFDaEI7S0FDQTtJQUNELFFBQVEsS0FBTztFQUNoQjtFQUVBLFNBQVMsUUFBUSxDQUFDO0VBRWxCLE1BQU0sU0FBUyxTQUFTLGNBQWMsQ0FBQyxhQUFhO0lBQUM7R0FBTTtFQUMzRCxPQUFPO0VBQ1AsYUFBYSxRQUFRLE1BQU07RUFFM0IsTUFBTSxZQUFZLFNBQVMsY0FBYyxDQUFDLGFBQWE7SUFBQztHQUFTO0VBQ2pFLE9BQU87RUFDUCxhQUFhLFdBQVcsTUFBTTtFQUU5QixNQUFNLGFBQWEsU0FBUyxjQUFjLENBQUMsYUFBYTtJQUFDO0dBQVM7RUFDbEUsYUFBYSxZQUFZO0FBQzFCIn0=
// denoCacheMetadata=8212763432402367510,1754788805389377866