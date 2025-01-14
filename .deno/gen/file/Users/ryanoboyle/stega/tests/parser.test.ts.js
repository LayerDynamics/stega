// tests/parser.test.ts
import { Parser } from "../src/parser.ts";
import { assertEquals, assertThrows } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { CLI } from "../src/core.ts";
import { InvalidFlagValueError, MissingFlagError } from "../src/error.ts";
// Mock logger for CLI instance
const mockLogger = {
  info: ()=>{},
  error: ()=>{},
  debug: ()=>{},
  warn: ()=>{}
};
// Create a mock CLI instance for testing
const createMockCLI = ()=>{
  const cli = new CLI(undefined, true, true, mockLogger);
  // Register some commands with flags for testing
  cli.register({
    name: "greet",
    description: "Greet a user",
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
        required: false
      }
    ],
    action: async (_args)=>{
    // Action logic
    }
  });
  cli.register({
    name: "command",
    description: "A command with multiple flags",
    options: [
      {
        name: "a",
        alias: "a",
        type: "string",
        required: true
      },
      {
        name: "b",
        alias: "b",
        type: "boolean",
        required: false
      },
      {
        name: "c",
        alias: "c",
        type: "number",
        required: false
      }
    ],
    action: async (_args)=>{
    // Action logic
    }
  });
  cli.register({
    name: "test",
    description: "Test command for short flags",
    options: [
      {
        name: "f",
        alias: "f",
        type: "string",
        required: true
      },
      {
        name: "o",
        alias: "o",
        type: "string",
        required: false
      }
    ],
    action: async (_args)=>{
    // Action logic
    }
  });
  // Register 'user' command with 'add' subcommand
  cli.register({
    name: "user",
    description: "User management commands",
    subcommands: [
      {
        name: "add",
        description: "Add a new user",
        options: [
          {
            name: "name",
            alias: "n",
            type: "string",
            required: true
          }
        ],
        action: async (_args)=>{
        // Action logic
        }
      }
    ],
    action: async (_args)=>{
    // Action logic for 'user' command
    }
  });
  return cli;
};
Deno.test("Parser should correctly parse commands and flags", ()=>{
  const parser = new Parser();
  const cli = createMockCLI();
  const argv = [
    "greet",
    "--name=Alice",
    "-v"
  ];
  const args = parser.parse(argv, cli);
  assertEquals(args.command, [
    "greet"
  ]);
  assertEquals(args.flags, {
    name: "Alice",
    v: true
  });
});
Deno.test("Parser should handle flags with separate values", ()=>{
  const parser = new Parser();
  const cli = createMockCLI();
  const argv = [
    "greet",
    "--name",
    "Bob",
    "-o",
    "output.txt"
  ];
  const args = parser.parse(argv, cli);
  assertEquals(args.command, [
    "greet"
  ]);
  assertEquals(args.flags, {
    name: "Bob",
    o: "output.txt"
  });
});
Deno.test("Parser should treat flags without values as boolean", ()=>{
  const parser = new Parser();
  const cli = createMockCLI();
  const argv = [
    "greet",
    "--verbose",
    "--dry-run"
  ];
  const args = parser.parse(argv, cli);
  assertEquals(args.command, [
    "greet"
  ]);
  assertEquals(args.flags, {
    verbose: true,
    "dry-run": true
  });
});
Deno.test("Parser should handle multiple commands", ()=>{
  const parser = new Parser();
  const cli = createMockCLI();
  const argv = [
    "user",
    "add",
    "--name=Charlie"
  ];
  const args = parser.parse(argv, cli);
  assertEquals(args.command, [
    "user",
    "add"
  ]);
  assertEquals(args.flags, {
    name: "Charlie"
  });
});
Deno.test("Parser should handle grouped short flags", ()=>{
  const parser = new Parser();
  const cli = createMockCLI();
  const argv = [
    "command",
    "-abc"
  ];
  // 'a' is required and expects a string, 'b' is boolean, 'c' is number
  // Since 'a' expects a string but is provided without a value, parser should throw MissingFlagError for 'a'
  assertThrows(()=>{
    parser.parse(argv, cli);
  }, MissingFlagError, "Missing required flag: -a. Expected type: string.");
});
Deno.test("Parser should handle short flags with values", ()=>{
  const parser = new Parser();
  const cli = createMockCLI();
  const argv = [
    "test",
    "-o",
    "output.txt",
    "-f"
  ];
  // 'f' is required and expects a string, but no value provided
  assertThrows(()=>{
    parser.parse(argv, cli);
  }, MissingFlagError, "Missing required flag: -f. Expected type: string.");
});
Deno.test("Parser should throw InvalidFlagValueError for invalid number flag", ()=>{
  const parser = new Parser();
  const cli = createMockCLI();
  const argv = [
    "command",
    "-a",
    "value",
    "-c",
    "not-a-number"
  ];
  assertThrows(()=>{
    parser.parse(argv, cli);
  }, InvalidFlagValueError, "Invalid value for flag -c: expected a number.");
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9wYXJzZXIudGVzdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0ZXN0cy9wYXJzZXIudGVzdC50c1xuXG5pbXBvcnQgeyBQYXJzZXIgfSBmcm9tIFwiLi4vc3JjL3BhcnNlci50c1wiO1xuaW1wb3J0IHtcblx0YXNzZXJ0RXF1YWxzLFxuXHRhc3NlcnRUaHJvd3MsXG59IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4yMDMuMC90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbmltcG9ydCB7IENMSSB9IGZyb20gXCIuLi9zcmMvY29yZS50c1wiO1xuaW1wb3J0IHsgSW52YWxpZEZsYWdWYWx1ZUVycm9yLCBNaXNzaW5nRmxhZ0Vycm9yIH0gZnJvbSBcIi4uL3NyYy9lcnJvci50c1wiO1xuaW1wb3J0IHsgSUxvZ2dlciB9IGZyb20gXCIuLi9zcmMvbG9nZ2VyX2ludGVyZmFjZS50c1wiO1xuXG4vLyBNb2NrIGxvZ2dlciBmb3IgQ0xJIGluc3RhbmNlXG5jb25zdCBtb2NrTG9nZ2VyOiBJTG9nZ2VyID0ge1xuXHRpbmZvOiAoKSA9PiB7fSxcblx0ZXJyb3I6ICgpID0+IHt9LFxuXHRkZWJ1ZzogKCkgPT4ge30sXG5cdHdhcm46ICgpID0+IHt9LFxufTtcblxuLy8gQ3JlYXRlIGEgbW9jayBDTEkgaW5zdGFuY2UgZm9yIHRlc3RpbmdcbmNvbnN0IGNyZWF0ZU1vY2tDTEkgPSAoKSA9PiB7XG5cdGNvbnN0IGNsaSA9IG5ldyBDTEkodW5kZWZpbmVkLCB0cnVlLCB0cnVlLCBtb2NrTG9nZ2VyKTtcblx0Ly8gUmVnaXN0ZXIgc29tZSBjb21tYW5kcyB3aXRoIGZsYWdzIGZvciB0ZXN0aW5nXG5cdGNsaS5yZWdpc3Rlcih7XG5cdFx0bmFtZTogXCJncmVldFwiLFxuXHRcdGRlc2NyaXB0aW9uOiBcIkdyZWV0IGEgdXNlclwiLFxuXHRcdG9wdGlvbnM6IFtcblx0XHRcdHsgbmFtZTogXCJuYW1lXCIsIGFsaWFzOiBcIm5cIiwgdHlwZTogXCJzdHJpbmdcIiwgcmVxdWlyZWQ6IHRydWUgfSxcblx0XHRcdHsgbmFtZTogXCJ2ZXJib3NlXCIsIGFsaWFzOiBcInZcIiwgdHlwZTogXCJib29sZWFuXCIsIHJlcXVpcmVkOiBmYWxzZSB9LFxuXHRcdF0sXG5cdFx0YWN0aW9uOiBhc3luYyAoX2FyZ3MpID0+IHtcblx0XHRcdC8vIEFjdGlvbiBsb2dpY1xuXHRcdH0sXG5cdH0pO1xuXG5cdGNsaS5yZWdpc3Rlcih7XG5cdFx0bmFtZTogXCJjb21tYW5kXCIsXG5cdFx0ZGVzY3JpcHRpb246IFwiQSBjb21tYW5kIHdpdGggbXVsdGlwbGUgZmxhZ3NcIixcblx0XHRvcHRpb25zOiBbXG5cdFx0XHR7IG5hbWU6IFwiYVwiLCBhbGlhczogXCJhXCIsIHR5cGU6IFwic3RyaW5nXCIsIHJlcXVpcmVkOiB0cnVlIH0sXG5cdFx0XHR7IG5hbWU6IFwiYlwiLCBhbGlhczogXCJiXCIsIHR5cGU6IFwiYm9vbGVhblwiLCByZXF1aXJlZDogZmFsc2UgfSxcblx0XHRcdHsgbmFtZTogXCJjXCIsIGFsaWFzOiBcImNcIiwgdHlwZTogXCJudW1iZXJcIiwgcmVxdWlyZWQ6IGZhbHNlIH0sXG5cdFx0XSxcblx0XHRhY3Rpb246IGFzeW5jIChfYXJncykgPT4ge1xuXHRcdFx0Ly8gQWN0aW9uIGxvZ2ljXG5cdFx0fSxcblx0fSk7XG5cblx0Y2xpLnJlZ2lzdGVyKHtcblx0XHRuYW1lOiBcInRlc3RcIixcblx0XHRkZXNjcmlwdGlvbjogXCJUZXN0IGNvbW1hbmQgZm9yIHNob3J0IGZsYWdzXCIsXG5cdFx0b3B0aW9uczogW1xuXHRcdFx0eyBuYW1lOiBcImZcIiwgYWxpYXM6IFwiZlwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxuXHRcdFx0eyBuYW1lOiBcIm9cIiwgYWxpYXM6IFwib1wiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogZmFsc2UgfSxcblx0XHRdLFxuXHRcdGFjdGlvbjogYXN5bmMgKF9hcmdzKSA9PiB7XG5cdFx0XHQvLyBBY3Rpb24gbG9naWNcblx0XHR9LFxuXHR9KTtcblxuXHQvLyBSZWdpc3RlciAndXNlcicgY29tbWFuZCB3aXRoICdhZGQnIHN1YmNvbW1hbmRcblx0Y2xpLnJlZ2lzdGVyKHtcblx0XHRuYW1lOiBcInVzZXJcIixcblx0XHRkZXNjcmlwdGlvbjogXCJVc2VyIG1hbmFnZW1lbnQgY29tbWFuZHNcIixcblx0XHRzdWJjb21tYW5kczogW1xuXHRcdFx0e1xuXHRcdFx0XHRuYW1lOiBcImFkZFwiLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjogXCJBZGQgYSBuZXcgdXNlclwiLFxuXHRcdFx0XHRvcHRpb25zOiBbXG5cdFx0XHRcdFx0eyBuYW1lOiBcIm5hbWVcIiwgYWxpYXM6IFwiblwiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxuXHRcdFx0XHRdLFxuXHRcdFx0XHRhY3Rpb246IGFzeW5jIChfYXJncykgPT4ge1xuXHRcdFx0XHRcdC8vIEFjdGlvbiBsb2dpY1xuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRdLFxuXHRcdGFjdGlvbjogYXN5bmMgKF9hcmdzKSA9PiB7XG5cdFx0XHQvLyBBY3Rpb24gbG9naWMgZm9yICd1c2VyJyBjb21tYW5kXG5cdFx0fSxcblx0fSk7XG5cblx0cmV0dXJuIGNsaTtcbn07XG5cbkRlbm8udGVzdChcIlBhcnNlciBzaG91bGQgY29ycmVjdGx5IHBhcnNlIGNvbW1hbmRzIGFuZCBmbGFnc1wiLCAoKSA9PiB7XG5cdGNvbnN0IHBhcnNlciA9IG5ldyBQYXJzZXIoKTtcblx0Y29uc3QgY2xpID0gY3JlYXRlTW9ja0NMSSgpO1xuXHRjb25zdCBhcmd2ID0gW1wiZ3JlZXRcIiwgXCItLW5hbWU9QWxpY2VcIiwgXCItdlwiXTtcblx0Y29uc3QgYXJncyA9IHBhcnNlci5wYXJzZShhcmd2LCBjbGkpO1xuXHRhc3NlcnRFcXVhbHMoYXJncy5jb21tYW5kLCBbXCJncmVldFwiXSk7XG5cdGFzc2VydEVxdWFscyhhcmdzLmZsYWdzLCB7IG5hbWU6IFwiQWxpY2VcIiwgdjogdHJ1ZSB9KTtcbn0pO1xuXG5EZW5vLnRlc3QoXCJQYXJzZXIgc2hvdWxkIGhhbmRsZSBmbGFncyB3aXRoIHNlcGFyYXRlIHZhbHVlc1wiLCAoKSA9PiB7XG5cdGNvbnN0IHBhcnNlciA9IG5ldyBQYXJzZXIoKTtcblx0Y29uc3QgY2xpID0gY3JlYXRlTW9ja0NMSSgpO1xuXHRjb25zdCBhcmd2ID0gW1wiZ3JlZXRcIiwgXCItLW5hbWVcIiwgXCJCb2JcIiwgXCItb1wiLCBcIm91dHB1dC50eHRcIl07XG5cdGNvbnN0IGFyZ3MgPSBwYXJzZXIucGFyc2UoYXJndiwgY2xpKTtcblx0YXNzZXJ0RXF1YWxzKGFyZ3MuY29tbWFuZCwgW1wiZ3JlZXRcIl0pO1xuXHRhc3NlcnRFcXVhbHMoYXJncy5mbGFncywgeyBuYW1lOiBcIkJvYlwiLCBvOiBcIm91dHB1dC50eHRcIiB9KTtcbn0pO1xuXG5EZW5vLnRlc3QoXCJQYXJzZXIgc2hvdWxkIHRyZWF0IGZsYWdzIHdpdGhvdXQgdmFsdWVzIGFzIGJvb2xlYW5cIiwgKCkgPT4ge1xuXHRjb25zdCBwYXJzZXIgPSBuZXcgUGFyc2VyKCk7XG5cdGNvbnN0IGNsaSA9IGNyZWF0ZU1vY2tDTEkoKTtcblx0Y29uc3QgYXJndiA9IFtcImdyZWV0XCIsIFwiLS12ZXJib3NlXCIsIFwiLS1kcnktcnVuXCJdO1xuXHRjb25zdCBhcmdzID0gcGFyc2VyLnBhcnNlKGFyZ3YsIGNsaSk7XG5cdGFzc2VydEVxdWFscyhhcmdzLmNvbW1hbmQsIFtcImdyZWV0XCJdKTtcblx0YXNzZXJ0RXF1YWxzKGFyZ3MuZmxhZ3MsIHsgdmVyYm9zZTogdHJ1ZSwgXCJkcnktcnVuXCI6IHRydWUgfSk7XG59KTtcblxuRGVuby50ZXN0KFwiUGFyc2VyIHNob3VsZCBoYW5kbGUgbXVsdGlwbGUgY29tbWFuZHNcIiwgKCkgPT4ge1xuXHRjb25zdCBwYXJzZXIgPSBuZXcgUGFyc2VyKCk7XG5cdGNvbnN0IGNsaSA9IGNyZWF0ZU1vY2tDTEkoKTtcblx0Y29uc3QgYXJndiA9IFtcInVzZXJcIiwgXCJhZGRcIiwgXCItLW5hbWU9Q2hhcmxpZVwiXTtcblx0Y29uc3QgYXJncyA9IHBhcnNlci5wYXJzZShhcmd2LCBjbGkpO1xuXHRhc3NlcnRFcXVhbHMoYXJncy5jb21tYW5kLCBbXCJ1c2VyXCIsIFwiYWRkXCJdKTtcblx0YXNzZXJ0RXF1YWxzKGFyZ3MuZmxhZ3MsIHsgbmFtZTogXCJDaGFybGllXCIgfSk7XG59KTtcblxuRGVuby50ZXN0KFwiUGFyc2VyIHNob3VsZCBoYW5kbGUgZ3JvdXBlZCBzaG9ydCBmbGFnc1wiLCAoKSA9PiB7XG5cdGNvbnN0IHBhcnNlciA9IG5ldyBQYXJzZXIoKTtcblx0Y29uc3QgY2xpID0gY3JlYXRlTW9ja0NMSSgpO1xuXHRjb25zdCBhcmd2ID0gW1wiY29tbWFuZFwiLCBcIi1hYmNcIl07XG5cdC8vICdhJyBpcyByZXF1aXJlZCBhbmQgZXhwZWN0cyBhIHN0cmluZywgJ2InIGlzIGJvb2xlYW4sICdjJyBpcyBudW1iZXJcblx0Ly8gU2luY2UgJ2EnIGV4cGVjdHMgYSBzdHJpbmcgYnV0IGlzIHByb3ZpZGVkIHdpdGhvdXQgYSB2YWx1ZSwgcGFyc2VyIHNob3VsZCB0aHJvdyBNaXNzaW5nRmxhZ0Vycm9yIGZvciAnYSdcblxuXHRhc3NlcnRUaHJvd3MoXG5cdFx0KCkgPT4ge1xuXHRcdFx0cGFyc2VyLnBhcnNlKGFyZ3YsIGNsaSk7XG5cdFx0fSxcblx0XHRNaXNzaW5nRmxhZ0Vycm9yLFxuXHRcdFwiTWlzc2luZyByZXF1aXJlZCBmbGFnOiAtYS4gRXhwZWN0ZWQgdHlwZTogc3RyaW5nLlwiLFxuXHQpO1xufSk7XG5cbkRlbm8udGVzdChcIlBhcnNlciBzaG91bGQgaGFuZGxlIHNob3J0IGZsYWdzIHdpdGggdmFsdWVzXCIsICgpID0+IHtcblx0Y29uc3QgcGFyc2VyID0gbmV3IFBhcnNlcigpO1xuXHRjb25zdCBjbGkgPSBjcmVhdGVNb2NrQ0xJKCk7XG5cdGNvbnN0IGFyZ3YgPSBbXCJ0ZXN0XCIsIFwiLW9cIiwgXCJvdXRwdXQudHh0XCIsIFwiLWZcIl07XG5cdC8vICdmJyBpcyByZXF1aXJlZCBhbmQgZXhwZWN0cyBhIHN0cmluZywgYnV0IG5vIHZhbHVlIHByb3ZpZGVkXG5cblx0YXNzZXJ0VGhyb3dzKFxuXHRcdCgpID0+IHtcblx0XHRcdHBhcnNlci5wYXJzZShhcmd2LCBjbGkpO1xuXHRcdH0sXG5cdFx0TWlzc2luZ0ZsYWdFcnJvcixcblx0XHRcIk1pc3NpbmcgcmVxdWlyZWQgZmxhZzogLWYuIEV4cGVjdGVkIHR5cGU6IHN0cmluZy5cIixcblx0KTtcbn0pO1xuXG5EZW5vLnRlc3QoXCJQYXJzZXIgc2hvdWxkIHRocm93IEludmFsaWRGbGFnVmFsdWVFcnJvciBmb3IgaW52YWxpZCBudW1iZXIgZmxhZ1wiLCAoKSA9PiB7XG5cdGNvbnN0IHBhcnNlciA9IG5ldyBQYXJzZXIoKTtcblx0Y29uc3QgY2xpID0gY3JlYXRlTW9ja0NMSSgpO1xuXHRjb25zdCBhcmd2ID0gW1wiY29tbWFuZFwiLCBcIi1hXCIsIFwidmFsdWVcIiwgXCItY1wiLCBcIm5vdC1hLW51bWJlclwiXTtcblx0YXNzZXJ0VGhyb3dzKFxuXHRcdCgpID0+IHtcblx0XHRcdHBhcnNlci5wYXJzZShhcmd2LCBjbGkpO1xuXHRcdH0sXG5cdFx0SW52YWxpZEZsYWdWYWx1ZUVycm9yLFxuXHRcdFwiSW52YWxpZCB2YWx1ZSBmb3IgZmxhZyAtYzogZXhwZWN0ZWQgYSBudW1iZXIuXCIsXG5cdCk7XG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx1QkFBdUI7QUFFdkIsU0FBUyxNQUFNLFFBQVEsbUJBQW1CO0FBQzFDLFNBQ0MsWUFBWSxFQUNaLFlBQVksUUFDTixtREFBbUQ7QUFDMUQsU0FBUyxHQUFHLFFBQVEsaUJBQWlCO0FBQ3JDLFNBQVMscUJBQXFCLEVBQUUsZ0JBQWdCLFFBQVEsa0JBQWtCO0FBRzFFLCtCQUErQjtBQUMvQixNQUFNLGFBQXNCO0VBQzNCLE1BQU0sS0FBTztFQUNiLE9BQU8sS0FBTztFQUNkLE9B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
// denoCacheMetadata=11457864480427332207,16616914617784006958