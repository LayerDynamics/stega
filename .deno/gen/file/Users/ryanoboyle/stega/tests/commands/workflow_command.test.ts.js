import { createWorkflowCommand } from "../../src/commands/workflow_command.ts";
import { createTempFile, createTestCLI } from "../utils/test_helpers.ts";
Deno.test("Workflow Command - Add and run workflow", async ()=>{
  const cli = createTestCLI();
  const command = createWorkflowCommand(cli);
  cli.register(command);
  const config = {
    steps: [
      {
        name: "step1",
        command: "echo test"
      }
    ]
  };
  const configPath = await createTempFile(JSON.stringify(config));
  await cli.runCommand([
    "workflow",
    "add",
    "--name=test-workflow",
    `--config=${configPath}`
  ]);
  await cli.runCommand([
    "workflow",
    "run",
    "--name=test-workflow"
  ]);
  await Deno.remove(configPath);
}); // ...rest of workflow tests...
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9jb21tYW5kcy93b3JrZmxvd19jb21tYW5kLnRlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlV29ya2Zsb3dDb21tYW5kIH0gZnJvbSBcIi4uLy4uL3NyYy9jb21tYW5kcy93b3JrZmxvd19jb21tYW5kLnRzXCI7XG5pbXBvcnQgdHlwZSB7IENvbW1hbmQgfSBmcm9tIFwiLi4vLi4vc3JjL2NvbW1hbmQudHNcIjtcbmltcG9ydCB7IGNyZWF0ZVRlbXBGaWxlLCBjcmVhdGVUZXN0Q0xJIH0gZnJvbSBcIi4uL3V0aWxzL3Rlc3RfaGVscGVycy50c1wiO1xuXG5EZW5vLnRlc3QoXCJXb3JrZmxvdyBDb21tYW5kIC0gQWRkIGFuZCBydW4gd29ya2Zsb3dcIiwgYXN5bmMgKCkgPT4ge1xuXHRjb25zdCBjbGkgPSBjcmVhdGVUZXN0Q0xJKCk7XG5cdGNvbnN0IGNvbW1hbmQgPSBjcmVhdGVXb3JrZmxvd0NvbW1hbmQoY2xpKSBhcyBDb21tYW5kO1xuXHRjbGkucmVnaXN0ZXIoY29tbWFuZCk7XG5cblx0Y29uc3QgY29uZmlnID0ge1xuXHRcdHN0ZXBzOiBbeyBuYW1lOiBcInN0ZXAxXCIsIGNvbW1hbmQ6IFwiZWNobyB0ZXN0XCIgfV0sXG5cdH07XG5cblx0Y29uc3QgY29uZmlnUGF0aCA9IGF3YWl0IGNyZWF0ZVRlbXBGaWxlKEpTT04uc3RyaW5naWZ5KGNvbmZpZykpO1xuXG5cdGF3YWl0IGNsaS5ydW5Db21tYW5kKFtcblx0XHRcIndvcmtmbG93XCIsXG5cdFx0XCJhZGRcIixcblx0XHRcIi0tbmFtZT10ZXN0LXdvcmtmbG93XCIsXG5cdFx0YC0tY29uZmlnPSR7Y29uZmlnUGF0aH1gLFxuXHRdKTtcblxuXHRhd2FpdCBjbGkucnVuQ29tbWFuZChbXG5cdFx0XCJ3b3JrZmxvd1wiLFxuXHRcdFwicnVuXCIsXG5cdFx0XCItLW5hbWU9dGVzdC13b3JrZmxvd1wiLFxuXHRdKTtcblxuXHRhd2FpdCBEZW5vLnJlbW92ZShjb25maWdQYXRoKTtcbn0pO1xuXG4vLyAuLi5yZXN0IG9mIHdvcmtmbG93IHRlc3RzLi4uXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxxQkFBcUIsUUFBUSx5Q0FBeUM7QUFFL0UsU0FBUyxjQUFjLEVBQUUsYUFBYSxRQUFRLDJCQUEyQjtBQUV6RSxLQUFLLElBQUksQ0FBQywyQ0FBMkM7RUFDcEQsTUFBTSxNQUFNO0VBQ1osTUFBTSxVQUFVLHNCQUFzQjtFQUN0QyxJQUFJLFFBQVEsQ0FBQztFQUViLE1BQU0sU0FBUztJQUNkLE9BQU87TUFBQztRQUFFLE1BQU07UUFBUyxTQUFTO01BQVk7S0FBRTtFQUNqRDtFQUVBLE1BQU0sYUFBYSxNQUFNLGVBQWUsS0FBSyxTQUFTLENBQUM7RUFFdkQsTUFBTSxJQUFJLFVBQVUsQ0FBQztJQUNwQjtJQUNBO0lBQ0E7SUFDQSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUM7R0FDeEI7RUFFRCxNQUFNLElBQUksVUFBVSxDQUFDO0lBQ3BCO0lBQ0E7SUFDQTtHQUNBO0VBRUQsTUFBTSxLQUFLLE1BQU0sQ0FBQztBQUNuQixJQUVBLCtCQUErQiJ9
// denoCacheMetadata=10491329352929964346,5418487617450962186