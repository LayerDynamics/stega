// tests/help.test.ts
import { assert } from "@std/assert";
import { CommandRegistry } from "../src/command.ts";
import { Help } from "../src/help.ts";
import { I18n } from "../src/i18n.ts";
// Helper function to capture output
function _captureOutput(fn) {
  const originalLog = console.log;
  let stdout = "";
  console.log = (...args)=>{
    stdout += args.join(" ") + "\n";
  };
  try {
    const result = fn();
    return {
      stdout: result
    };
  } finally{
    console.log = originalLog;
  }
}
const mockI18n = new I18n({
  available_commands: "Available Commands",
  use_help: 'Use "help [command]" for more information',
  command: "Command",
  options: "Options",
  default: "default"
});
Deno.test("Help - generates general help text", ()=>{
  const registry = new CommandRegistry();
  const help = new Help(registry, mockI18n);
  registry.register({
    name: "test",
    description: "Test command",
    action: ()=>{}
  });
  const helpText = help.generateHelp();
  assert(helpText.includes(mockI18n.t("available_commands")));
  assert(helpText.includes("test"));
  assert(helpText.includes("Test command"));
  assert(helpText.includes(mockI18n.t("use_help")));
});
Deno.test("Help - generates command-specific help", ()=>{
  const registry = new CommandRegistry();
  const help = new Help(registry, mockI18n);
  const testCommand = {
    name: "test",
    description: "Test command",
    options: [
      {
        name: "flag",
        alias: "f",
        description: "Test flag",
        type: "boolean",
        default: false
      }
    ],
    action: ()=>{}
  };
  registry.register(testCommand);
  const command = registry.findCommand("test");
  const helpText = help.generateHelp(command);
  assert(helpText.includes("test"));
  assert(helpText.includes("Test command"));
  assert(helpText.includes("--flag"));
  assert(helpText.includes("-f"));
});
Deno.test("Help - generates subcommand help", ()=>{
  const registry = new CommandRegistry();
  const help = new Help(registry, mockI18n);
  const command = {
    name: "parent",
    description: "Parent command",
    subcommands: [
      {
        name: "child",
        description: "Child command",
        action: ()=>{}
      }
    ],
    action: ()=>{}
  };
  const helpText = help.generateHelp(command);
  assert(helpText.includes("Subcommands:"));
  assert(helpText.includes("child"));
  assert(helpText.includes("Child command"));
  assert(helpText.includes("Usage:"));
  assert(helpText.includes("stega parent <subcommand>"));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9oZWxwLnRlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGVzdHMvaGVscC50ZXN0LnRzXG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbmltcG9ydCB7IENvbW1hbmRSZWdpc3RyeSB9IGZyb20gXCIuLi9zcmMvY29tbWFuZC50c1wiO1xuaW1wb3J0IHsgSGVscCB9IGZyb20gXCIuLi9zcmMvaGVscC50c1wiO1xuaW1wb3J0IHsgSTE4biB9IGZyb20gXCIuLi9zcmMvaTE4bi50c1wiO1xuXG4vLyBIZWxwZXIgZnVuY3Rpb24gdG8gY2FwdHVyZSBvdXRwdXRcbmZ1bmN0aW9uIF9jYXB0dXJlT3V0cHV0KGZuOiAoKSA9PiBzdHJpbmcpOiB7IHN0ZG91dDogc3RyaW5nIH0ge1xuXHRjb25zdCBvcmlnaW5hbExvZyA9IGNvbnNvbGUubG9nO1xuXHRsZXQgc3Rkb3V0ID0gXCJcIjtcblx0Y29uc29sZS5sb2cgPSAoLi4uYXJnczogdW5rbm93bltdKSA9PiB7XG5cdFx0c3Rkb3V0ICs9IGFyZ3Muam9pbihcIiBcIikgKyBcIlxcblwiO1xuXHR9O1xuXG5cdHRyeSB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gZm4oKTtcblx0XHRyZXR1cm4geyBzdGRvdXQ6IHJlc3VsdCB9O1xuXHR9IGZpbmFsbHkge1xuXHRcdGNvbnNvbGUubG9nID0gb3JpZ2luYWxMb2c7XG5cdH1cbn1cblxuY29uc3QgbW9ja0kxOG4gPSBuZXcgSTE4bih7XG5cdGF2YWlsYWJsZV9jb21tYW5kczogXCJBdmFpbGFibGUgQ29tbWFuZHNcIixcblx0dXNlX2hlbHA6ICdVc2UgXCJoZWxwIFtjb21tYW5kXVwiIGZvciBtb3JlIGluZm9ybWF0aW9uJyxcblx0Y29tbWFuZDogXCJDb21tYW5kXCIsXG5cdG9wdGlvbnM6IFwiT3B0aW9uc1wiLFxuXHRkZWZhdWx0OiBcImRlZmF1bHRcIixcbn0pO1xuXG5EZW5vLnRlc3QoXCJIZWxwIC0gZ2VuZXJhdGVzIGdlbmVyYWwgaGVscCB0ZXh0XCIsICgpID0+IHtcblx0Y29uc3QgcmVnaXN0cnkgPSBuZXcgQ29tbWFuZFJlZ2lzdHJ5KCk7XG5cdGNvbnN0IGhlbHAgPSBuZXcgSGVscChyZWdpc3RyeSwgbW9ja0kxOG4pO1xuXG5cdHJlZ2lzdHJ5LnJlZ2lzdGVyKHtcblx0XHRuYW1lOiBcInRlc3RcIixcblx0XHRkZXNjcmlwdGlvbjogXCJUZXN0IGNvbW1hbmRcIixcblx0XHRhY3Rpb246ICgpID0+IHt9LFxuXHR9KTtcblxuXHRjb25zdCBoZWxwVGV4dCA9IGhlbHAuZ2VuZXJhdGVIZWxwKCk7XG5cdGFzc2VydChoZWxwVGV4dC5pbmNsdWRlcyhtb2NrSTE4bi50KFwiYXZhaWxhYmxlX2NvbW1hbmRzXCIpKSk7XG5cdGFzc2VydChoZWxwVGV4dC5pbmNsdWRlcyhcInRlc3RcIikpO1xuXHRhc3NlcnQoaGVscFRleHQuaW5jbHVkZXMoXCJUZXN0IGNvbW1hbmRcIikpO1xuXHRhc3NlcnQoaGVscFRleHQuaW5jbHVkZXMobW9ja0kxOG4udChcInVzZV9oZWxwXCIpKSk7XG59KTtcblxuRGVuby50ZXN0KFwiSGVscCAtIGdlbmVyYXRlcyBjb21tYW5kLXNwZWNpZmljIGhlbHBcIiwgKCkgPT4geyAvLyBSZW1vdmUgYXN5bmNcblx0Y29uc3QgcmVnaXN0cnkgPSBuZXcgQ29tbWFuZFJlZ2lzdHJ5KCk7XG5cdGNvbnN0IGhlbHAgPSBuZXcgSGVscChyZWdpc3RyeSwgbW9ja0kxOG4pO1xuXG5cdGNvbnN0IHRlc3RDb21tYW5kID0ge1xuXHRcdG5hbWU6IFwidGVzdFwiLFxuXHRcdGRlc2NyaXB0aW9uOiBcIlRlc3QgY29tbWFuZFwiLFxuXHRcdG9wdGlvbnM6IFt7XG5cdFx0XHRuYW1lOiBcImZsYWdcIixcblx0XHRcdGFsaWFzOiBcImZcIixcblx0XHRcdGRlc2NyaXB0aW9uOiBcIlRlc3QgZmxhZ1wiLFxuXHRcdFx0dHlwZTogXCJib29sZWFuXCIgYXMgY29uc3QsXG5cdFx0XHRkZWZhdWx0OiBmYWxzZSxcblx0XHR9XSxcblx0XHRhY3Rpb246ICgpID0+IHt9LFxuXHR9O1xuXG5cdHJlZ2lzdHJ5LnJlZ2lzdGVyKHRlc3RDb21tYW5kKTtcblx0Y29uc3QgY29tbWFuZCA9IHJlZ2lzdHJ5LmZpbmRDb21tYW5kKFwidGVzdFwiKTtcblx0Y29uc3QgaGVscFRleHQgPSBoZWxwLmdlbmVyYXRlSGVscChjb21tYW5kKTtcblxuXHRhc3NlcnQoaGVscFRleHQuaW5jbHVkZXMoXCJ0ZXN0XCIpKTtcblx0YXNzZXJ0KGhlbHBUZXh0LmluY2x1ZGVzKFwiVGVzdCBjb21tYW5kXCIpKTtcblx0YXNzZXJ0KGhlbHBUZXh0LmluY2x1ZGVzKFwiLS1mbGFnXCIpKTtcblx0YXNzZXJ0KGhlbHBUZXh0LmluY2x1ZGVzKFwiLWZcIikpO1xufSk7XG5cbkRlbm8udGVzdChcIkhlbHAgLSBnZW5lcmF0ZXMgc3ViY29tbWFuZCBoZWxwXCIsICgpID0+IHtcblx0Y29uc3QgcmVnaXN0cnkgPSBuZXcgQ29tbWFuZFJlZ2lzdHJ5KCk7XG5cdGNvbnN0IGhlbHAgPSBuZXcgSGVscChyZWdpc3RyeSwgbW9ja0kxOG4pO1xuXG5cdGNvbnN0IGNvbW1hbmQgPSB7XG5cdFx0bmFtZTogXCJwYXJlbnRcIixcblx0XHRkZXNjcmlwdGlvbjogXCJQYXJlbnQgY29tbWFuZFwiLFxuXHRcdHN1YmNvbW1hbmRzOiBbe1xuXHRcdFx0bmFtZTogXCJjaGlsZFwiLFxuXHRcdFx0ZGVzY3JpcHRpb246IFwiQ2hpbGQgY29tbWFuZFwiLFxuXHRcdFx0YWN0aW9uOiAoKSA9PiB7fSxcblx0XHR9XSxcblx0XHRhY3Rpb246ICgpID0+IHt9LFxuXHR9O1xuXG5cdGNvbnN0IGhlbHBUZXh0ID0gaGVscC5nZW5lcmF0ZUhlbHAoY29tbWFuZCk7XG5cdGFzc2VydChoZWxwVGV4dC5pbmNsdWRlcyhcIlN1YmNvbW1hbmRzOlwiKSk7XG5cdGFzc2VydChoZWxwVGV4dC5pbmNsdWRlcyhcImNoaWxkXCIpKTtcblx0YXNzZXJ0KGhlbHBUZXh0LmluY2x1ZGVzKFwiQ2hpbGQgY29tbWFuZFwiKSk7XG5cdGFzc2VydChoZWxwVGV4dC5pbmNsdWRlcyhcIlVzYWdlOlwiKSk7XG5cdGFzc2VydChoZWxwVGV4dC5pbmNsdWRlcyhcInN0ZWdhIHBhcmVudCA8c3ViY29tbWFuZD5cIikpO1xufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscUJBQXFCO0FBQ3JCLFNBQVMsTUFBTSxRQUFRLGNBQWM7QUFDckMsU0FBUyxlQUFlLFFBQVEsb0JBQW9CO0FBQ3BELFNBQVMsSUFBSSxRQUFRLGlCQUFpQjtBQUN0QyxTQUFTLElBQUksUUFBUSxpQkFBaUI7QUFFdEMsb0NBQW9DO0FBQ3BDLFNBQVMsZUFBZSxFQUFnQjtFQUN2QyxNQUFNLGNBQWMsUUFBUSxHQUFHO0VBQy9CLElBQUksU0FBUztFQUNiLFFBQVEsR0FBRyxHQUFHLENBQUMsR0FBRztJQUNqQixVQUFVLEtBQUssSUFBSSxDQUFDLE9BQU87RUFDNUI7RUFFQSxJQUFJO0lBQ0gsTUFBTSxTQUFTO0lBQ2YsT0FBTztNQUFFLFFBQVE7SUFBTztFQUN6QixTQUFVO0lBQ1QsUUFBUSxHQUFHLEdBQUc7RUFDZjtBQUNEO0FBRUEsTUFBTSxXQUFXLElBQUksS0FBSztFQUN6QixvQkFBb0I7RUFDcEIsVUFBVTtFQUNWLFNBQVM7RUFDVCxTQUFTO0VBQ1QsU0FBUztBQUNWO0FBRUEsS0FBSyxJQUFJLENBQUMsc0NBQXNDO0VBQy9DLE1BQU0sV0FBVyxJQUFJO0VBQ3JCLE1BQU0sT0FBTyxJQUFJLEtBQUssVUFBVTtFQUVoQyxTQUFTLFFBQVEsQ0FBQztJQUNqQixNQUFNO0lBQ04sYUFBYTtJQUNiLFFBQVEsS0FBTztFQUNoQjtFQUVBLE1BQU0sV0FBVyxLQUFLLFlBQVk7RUFDbEMsT0FBTyxTQUFTLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztFQUNwQyxPQUFPLFNBQVMsUUFBUSxDQUFDO0VBQ3pCLE9BQU8sU0FBUyxRQUFRLENBQUM7RUFDekIsT0FBTyxTQUFTLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNyQztBQUVBLEtBQUssSUFBSSxDQUFDLDBDQUEwQztFQUNuRCxNQUFNLFdBQVcsSUFBSTtFQUNyQixNQUFNLE9BQU8sSUFBSSxLQUFLLFVBQVU7RUFFaEMsTUFBTSxjQUFjO0lBQ25CLE1BQU07SUFDTixhQUFhO0lBQ2IsU0FBUztNQUFDO1FBQ1QsTUFBTTtRQUNOLE9BQU87UUFDUCxhQUFhO1FBQ2IsTUFBTTtRQUNOLFNBQVM7TUFDVjtLQUFFO0lBQ0YsUUFBUSxLQUFPO0VBQ2hCO0VBRUEsU0FBUyxRQUFRLENBQUM7RUFDbEIsTUFBTSxVQUFVLFNBQVMsV0FBVyxDQUFDO0VBQ3JDLE1BQU0sV0FBVyxLQUFLLFlBQVksQ0FBQztFQUVuQyxPQUFPLFNBQVMsUUFBUSxDQUFDO0VBQ3pCLE9BQU8sU0FBUyxRQUFRLENBQUM7RUFDekIsT0FBTyxTQUFTLFFBQVEsQ0FBQztFQUN6QixPQUFPLFNBQVMsUUFBUSxDQUFDO0FBQzFCO0FBRUEsS0FBSyxJQUFJLENBQUMsb0NBQW9DO0VBQzdDLE1BQU0sV0FBVyxJQUFJO0VBQ3JCLE1BQU0sT0FBTyxJQUFJLEtBQUssVUFBVTtFQUVoQyxNQUFNLFVBQVU7SUFDZixNQUFNO0lBQ04sYUFBYTtJQUNiLGFBQWE7TUFBQztRQUNiLE1BQU07UUFDTixhQUFhO1FBQ2IsUUFBUSxLQUFPO01BQ2hCO0tBQUU7SUFDRixRQUFRLEtBQU87RUFDaEI7RUFFQSxNQUFNLFdBQVcsS0FBSyxZQUFZLENBQUM7RUFDbkMsT0FBTyxTQUFTLFFBQVEsQ0FBQztFQUN6QixPQUFPLFNBQVMsUUFBUSxDQUFDO0VBQ3pCLE9BQU8sU0FBUyxRQUFRLENBQUM7RUFDekIsT0FBTyxTQUFTLFFBQVEsQ0FBQztFQUN6QixPQUFPLFNBQVMsUUFBUSxDQUFDO0FBQzFCIn0=
// denoCacheMetadata=2890079345489631553,2025537654283000199