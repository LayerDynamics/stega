// tests/build_command.test.ts
var _computedKey;
import { assertEquals, assertRejects } from "@std/assert";
import { createBuildCommand } from "../src/commands/build.ts";
import { createTestCLI } from "./test_utils.ts";
_computedKey = Symbol.asyncDispose;
// Mock Process class with correct interface implementation
class MockProcess {
  pid = 1234;
  _killed = false;
  #stdin = new WritableStream();
  #stdout = new ReadableStream();
  #stderr = new ReadableStream();
  #status = Promise.resolve({
    success: true,
    code: 0,
    signal: null
  });
  get stdin() {
    return this.#stdin;
  }
  get stdout() {
    return this.#stdout;
  }
  get stderr() {
    return this.#stderr;
  }
  get status() {
    if (this._killed) {
      return Promise.resolve({
        success: false,
        code: 1,
        signal: "SIGTERM"
      });
    }
    return this.#status;
  }
  async output() {
    const status = await this.status;
    return {
      ...status,
      stdout: new Uint8Array(),
      stderr: new Uint8Array()
    };
  }
  async stderrOutput() {
    return new Uint8Array();
  }
  ref() {}
  unref() {}
  kill(signo) {
    this._killed = true;
    if (signo && ![
      "SIGTERM",
      "SIGKILL"
    ].includes(signo)) {
      throw new Error(`Unsupported signal: ${signo}`);
    }
    this.#stdout.cancel();
    this.#stderr.cancel();
    const writer = this.#stdin.getWriter();
    writer.close();
  }
  async [_computedKey]() {
    if (!this._killed) {
      this.kill("SIGTERM");
    }
  }
}
// Mock Command class with improved tracking
class MockCommand {
  static lastArgs = [];
  constructor(cmd, options){
    MockCommand.lastArgs = [
      cmd.toString(),
      ...options?.args ?? []
    ];
  }
  spawn() {
    return new MockProcess();
  }
  static reset() {
    this.lastArgs = [];
  }
}
// Each test has its own permissions and is split into a separate Deno.test
Deno.test({
  name: "Basic build command execution",
  permissions: {
    read: true,
    write: true,
    env: true
  },
  async fn () {
    const { cli } = await createTestCLI();
    const buildCommand = createBuildCommand(cli);
    const originalCommand = Deno.Command;
    try {
      // @ts-ignore: Mock implementation
      Deno.Command = MockCommand;
      MockCommand.reset();
      // Create temporary test file
      const tmpDir = await Deno.makeTempDir();
      const testFile = `${tmpDir}/test.ts`;
      await Deno.writeTextFile(testFile, "console.log('test');");
      cli.register(buildCommand);
      await cli.runCommand([
        "build",
        "--output",
        "test-bin",
        "--target",
        "linux",
        "--entry",
        testFile
      ]);
      // Verify command
      assertEquals(MockCommand.lastArgs[0], "deno");
      assertEquals(MockCommand.lastArgs[1], "compile");
      assertEquals(MockCommand.lastArgs.includes("--output=test-bin"), true);
      // Cleanup
      await Deno.remove(tmpDir, {
        recursive: true
      });
    } finally{
      // @ts-ignore: Restoration
      Deno.Command = originalCommand;
    }
  }
});
Deno.test({
  name: "Plugin hooks execution",
  permissions: {
    read: true,
    write: true,
    env: true
  },
  async fn () {
    const { cli } = await createTestCLI();
    const hooksCalled = {
      before: false,
      after: false,
      afterWithSuccess: false
    };
    const mockPlugin = {
      metadata: {
        name: "test",
        version: "1.0.0"
      },
      init: ()=>{},
      beforeBuild: async (_options)=>{
        hooksCalled.before = true;
        return Promise.resolve();
      },
      afterBuild: async (_options, success)=>{
        hooksCalled.after = true;
        hooksCalled.afterWithSuccess = success;
        return Promise.resolve();
      }
    };
    const originalCommand = Deno.Command;
    const originalGetPlugins = cli.getLoadedPlugins;
    try {
      // @ts-ignore: Mock implementation
      Deno.Command = MockCommand;
      cli.getLoadedPlugins = ()=>[
          mockPlugin
        ];
      // Create test file
      const tmpDir = await Deno.makeTempDir();
      const testFile = `${tmpDir}/test.ts`;
      await Deno.writeTextFile(testFile, "console.log('test');");
      // Execute build
      const buildCommand = createBuildCommand(cli);
      cli.register(buildCommand);
      await cli.runCommand([
        "build",
        "--output",
        "test-bin",
        "--target",
        "linux",
        "--entry",
        testFile
      ]);
      // Verify hooks
      assertEquals(hooksCalled.before, true, "beforeBuild hook should be called");
      assertEquals(hooksCalled.after, true, "afterBuild hook should be called");
      assertEquals(hooksCalled.afterWithSuccess, true, "afterBuild should indicate success");
      // Cleanup
      await Deno.remove(tmpDir, {
        recursive: true
      });
    } finally{
      // @ts-ignore: Restoration
      Deno.Command = originalCommand;
      cli.getLoadedPlugins = originalGetPlugins;
    }
  }
});
Deno.test({
  name: "Plugin build cancellation",
  permissions: {
    read: true,
    write: true,
    env: true
  },
  async fn () {
    const { cli } = await createTestCLI();
    let buildAttempted = false;
    const mockPlugin = {
      metadata: {
        name: "test",
        version: "1.0.0"
      },
      init: ()=>{},
      beforeBuild: async (_options)=>{
        buildAttempted = true;
        throw new Error("Build cancelled by plugin");
      },
      afterBuild: ()=>{
        throw new Error("afterBuild should not be called when build is cancelled");
      }
    };
    const originalCommand = Deno.Command;
    const originalGetPlugins = cli.getLoadedPlugins;
    try {
      // @ts-ignore: Mock implementation
      Deno.Command = MockCommand;
      cli.getLoadedPlugins = ()=>[
          mockPlugin
        ];
      // Setup test file
      const tmpDir = await Deno.makeTempDir();
      const testFile = `${tmpDir}/test.ts`;
      await Deno.writeTextFile(testFile, "console.log('test');");
      const buildCommand = createBuildCommand(cli);
      cli.register(buildCommand);
      // Verify build cancellation
      await assertRejects(()=>cli.runCommand([
          "build",
          "--output",
          "test-bin",
          "--target",
          "linux",
          "--entry",
          testFile
        ]), Error, "Build cancelled by plugin");
      assertEquals(buildAttempted, true, "Plugin should attempt to cancel build");
      // Cleanup
      await Deno.remove(tmpDir, {
        recursive: true
      });
    } finally{
      // @ts-ignore: Restoration
      Deno.Command = originalCommand;
      cli.getLoadedPlugins = originalGetPlugins;
    }
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9idWlsZF9jb21tYW5kLnRlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGVzdHMvYnVpbGRfY29tbWFuZC50ZXN0LnRzXG5pbXBvcnQgeyBhc3NlcnRFcXVhbHMsIGFzc2VydFJlamVjdHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbmltcG9ydCB7IGNyZWF0ZUJ1aWxkQ29tbWFuZCB9IGZyb20gXCIuLi9zcmMvY29tbWFuZHMvYnVpbGQudHNcIjtcbmltcG9ydCB7IGNyZWF0ZVRlc3RDTEkgfSBmcm9tIFwiLi90ZXN0X3V0aWxzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEJ1aWxkT3B0aW9ucywgUGx1Z2luIH0gZnJvbSBcIi4uL3NyYy9wbHVnaW4udHNcIjtcblxuLy8gTW9jayBQcm9jZXNzIGNsYXNzIHdpdGggY29ycmVjdCBpbnRlcmZhY2UgaW1wbGVtZW50YXRpb25cbmNsYXNzIE1vY2tQcm9jZXNzIGltcGxlbWVudHMgRGVuby5DaGlsZFByb2Nlc3Mge1xuXHRyZWFkb25seSBwaWQgPSAxMjM0O1xuXHRwcml2YXRlIF9raWxsZWQgPSBmYWxzZTtcblxuXHQjc3RkaW4gPSBuZXcgV3JpdGFibGVTdHJlYW08VWludDhBcnJheT4oKTtcblx0I3N0ZG91dCA9IG5ldyBSZWFkYWJsZVN0cmVhbTxVaW50OEFycmF5PigpO1xuXHQjc3RkZXJyID0gbmV3IFJlYWRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+KCk7XG5cdCNzdGF0dXMgPSBQcm9taXNlLnJlc29sdmUoeyBzdWNjZXNzOiB0cnVlLCBjb2RlOiAwLCBzaWduYWw6IG51bGwgfSk7XG5cblx0Z2V0IHN0ZGluKCk6IFdyaXRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+IHtcblx0XHRyZXR1cm4gdGhpcy4jc3RkaW47XG5cdH1cblxuXHRnZXQgc3Rkb3V0KCk6IFJlYWRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+IHtcblx0XHRyZXR1cm4gdGhpcy4jc3Rkb3V0O1xuXHR9XG5cblx0Z2V0IHN0ZGVycigpOiBSZWFkYWJsZVN0cmVhbTxVaW50OEFycmF5PiB7XG5cdFx0cmV0dXJuIHRoaXMuI3N0ZGVycjtcblx0fVxuXG5cdGdldCBzdGF0dXMoKTogUHJvbWlzZTxEZW5vLkNvbW1hbmRTdGF0dXM+IHtcblx0XHRpZiAodGhpcy5fa2lsbGVkKSB7XG5cdFx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGNvZGU6IDEsIHNpZ25hbDogXCJTSUdURVJNXCIgfSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLiNzdGF0dXM7XG5cdH1cblxuXHRhc3luYyBvdXRwdXQoKTogUHJvbWlzZTxEZW5vLkNvbW1hbmRPdXRwdXQ+IHtcblx0XHRjb25zdCBzdGF0dXMgPSBhd2FpdCB0aGlzLnN0YXR1cztcblx0XHRyZXR1cm4ge1xuXHRcdFx0Li4uc3RhdHVzLFxuXHRcdFx0c3Rkb3V0OiBuZXcgVWludDhBcnJheSgpLFxuXHRcdFx0c3RkZXJyOiBuZXcgVWludDhBcnJheSgpLFxuXHRcdH07XG5cdH1cblxuXHRhc3luYyBzdGRlcnJPdXRwdXQoKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG5cdFx0cmV0dXJuIG5ldyBVaW50OEFycmF5KCk7XG5cdH1cblxuXHRyZWYoKTogdm9pZCB7fVxuXHR1bnJlZigpOiB2b2lkIHt9XG5cblx0a2lsbChzaWdubz86IERlbm8uU2lnbmFsKTogdm9pZCB7XG5cdFx0dGhpcy5fa2lsbGVkID0gdHJ1ZTtcblx0XHRpZiAoc2lnbm8gJiYgIVtcIlNJR1RFUk1cIiwgXCJTSUdLSUxMXCJdLmluY2x1ZGVzKHNpZ25vKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBzaWduYWw6ICR7c2lnbm99YCk7XG5cdFx0fVxuXHRcdHRoaXMuI3N0ZG91dC5jYW5jZWwoKTtcblx0XHR0aGlzLiNzdGRlcnIuY2FuY2VsKCk7XG5cdFx0Y29uc3Qgd3JpdGVyID0gdGhpcy4jc3RkaW4uZ2V0V3JpdGVyKCk7XG5cdFx0d3JpdGVyLmNsb3NlKCk7XG5cdH1cblxuXHRhc3luYyBbU3ltYm9sLmFzeW5jRGlzcG9zZV0oKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKCF0aGlzLl9raWxsZWQpIHtcblx0XHRcdHRoaXMua2lsbChcIlNJR1RFUk1cIik7XG5cdFx0fVxuXHR9XG59XG5cbi8vIE1vY2sgQ29tbWFuZCBjbGFzcyB3aXRoIGltcHJvdmVkIHRyYWNraW5nXG5jbGFzcyBNb2NrQ29tbWFuZCB7XG5cdHN0YXRpYyBsYXN0QXJnczogc3RyaW5nW10gPSBbXTtcblxuXHRjb25zdHJ1Y3RvcihjbWQ6IHN0cmluZyB8IFVSTCwgb3B0aW9ucz86IERlbm8uQ29tbWFuZE9wdGlvbnMpIHtcblx0XHRNb2NrQ29tbWFuZC5sYXN0QXJncyA9IFtjbWQudG9TdHJpbmcoKSwgLi4uKG9wdGlvbnM/LmFyZ3MgPz8gW10pXTtcblx0fVxuXG5cdHNwYXduKCk6IERlbm8uQ2hpbGRQcm9jZXNzIHtcblx0XHRyZXR1cm4gbmV3IE1vY2tQcm9jZXNzKCk7XG5cdH1cblxuXHRzdGF0aWMgcmVzZXQoKTogdm9pZCB7XG5cdFx0dGhpcy5sYXN0QXJncyA9IFtdO1xuXHR9XG59XG5cbi8vIEVhY2ggdGVzdCBoYXMgaXRzIG93biBwZXJtaXNzaW9ucyBhbmQgaXMgc3BsaXQgaW50byBhIHNlcGFyYXRlIERlbm8udGVzdFxuRGVuby50ZXN0KHtcblx0bmFtZTogXCJCYXNpYyBidWlsZCBjb21tYW5kIGV4ZWN1dGlvblwiLFxuXHRwZXJtaXNzaW9uczoge1xuXHRcdHJlYWQ6IHRydWUsXG5cdFx0d3JpdGU6IHRydWUsXG5cdFx0ZW52OiB0cnVlLFxuXHR9LFxuXHRhc3luYyBmbigpIHtcblx0XHRjb25zdCB7IGNsaSB9ID0gYXdhaXQgY3JlYXRlVGVzdENMSSgpO1xuXHRcdGNvbnN0IGJ1aWxkQ29tbWFuZCA9IGNyZWF0ZUJ1aWxkQ29tbWFuZChjbGkpO1xuXG5cdFx0Y29uc3Qgb3JpZ2luYWxDb21tYW5kID0gRGVuby5Db21tYW5kO1xuXHRcdHRyeSB7XG5cdFx0XHQvLyBAdHMtaWdub3JlOiBNb2NrIGltcGxlbWVudGF0aW9uXG5cdFx0XHREZW5vLkNvbW1hbmQgPSBNb2NrQ29tbWFuZDtcblx0XHRcdE1vY2tDb21tYW5kLnJlc2V0KCk7XG5cblx0XHRcdC8vIENyZWF0ZSB0ZW1wb3JhcnkgdGVzdCBmaWxlXG5cdFx0XHRjb25zdCB0bXBEaXIgPSBhd2FpdCBEZW5vLm1ha2VUZW1wRGlyKCk7XG5cdFx0XHRjb25zdCB0ZXN0RmlsZSA9IGAke3RtcERpcn0vdGVzdC50c2A7XG5cdFx0XHRhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUodGVzdEZpbGUsIFwiY29uc29sZS5sb2coJ3Rlc3QnKTtcIik7XG5cblx0XHRcdGNsaS5yZWdpc3RlcihidWlsZENvbW1hbmQpO1xuXHRcdFx0YXdhaXQgY2xpLnJ1bkNvbW1hbmQoW1xuXHRcdFx0XHRcImJ1aWxkXCIsXG5cdFx0XHRcdFwiLS1vdXRwdXRcIixcblx0XHRcdFx0XCJ0ZXN0LWJpblwiLFxuXHRcdFx0XHRcIi0tdGFyZ2V0XCIsXG5cdFx0XHRcdFwibGludXhcIixcblx0XHRcdFx0XCItLWVudHJ5XCIsXG5cdFx0XHRcdHRlc3RGaWxlLFxuXHRcdFx0XSk7XG5cblx0XHRcdC8vIFZlcmlmeSBjb21tYW5kXG5cdFx0XHRhc3NlcnRFcXVhbHMoTW9ja0NvbW1hbmQubGFzdEFyZ3NbMF0sIFwiZGVub1wiKTtcblx0XHRcdGFzc2VydEVxdWFscyhNb2NrQ29tbWFuZC5sYXN0QXJnc1sxXSwgXCJjb21waWxlXCIpO1xuXHRcdFx0YXNzZXJ0RXF1YWxzKFxuXHRcdFx0XHRNb2NrQ29tbWFuZC5sYXN0QXJncy5pbmNsdWRlcyhcIi0tb3V0cHV0PXRlc3QtYmluXCIpLFxuXHRcdFx0XHR0cnVlLFxuXHRcdFx0KTtcblxuXHRcdFx0Ly8gQ2xlYW51cFxuXHRcdFx0YXdhaXQgRGVuby5yZW1vdmUodG1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0Ly8gQHRzLWlnbm9yZTogUmVzdG9yYXRpb25cblx0XHRcdERlbm8uQ29tbWFuZCA9IG9yaWdpbmFsQ29tbWFuZDtcblx0XHR9XG5cdH0sXG59KTtcblxuRGVuby50ZXN0KHtcblx0bmFtZTogXCJQbHVnaW4gaG9va3MgZXhlY3V0aW9uXCIsXG5cdHBlcm1pc3Npb25zOiB7XG5cdFx0cmVhZDogdHJ1ZSxcblx0XHR3cml0ZTogdHJ1ZSxcblx0XHRlbnY6IHRydWUsXG5cdH0sXG5cdGFzeW5jIGZuKCkge1xuXHRcdGNvbnN0IHsgY2xpIH0gPSBhd2FpdCBjcmVhdGVUZXN0Q0xJKCk7XG5cdFx0Y29uc3QgaG9va3NDYWxsZWQgPSB7XG5cdFx0XHRiZWZvcmU6IGZhbHNlLFxuXHRcdFx0YWZ0ZXI6IGZhbHNlLFxuXHRcdFx0YWZ0ZXJXaXRoU3VjY2VzczogZmFsc2UsXG5cdFx0fTtcblxuXHRcdGNvbnN0IG1vY2tQbHVnaW46IFBsdWdpbiA9IHtcblx0XHRcdG1ldGFkYXRhOiB7XG5cdFx0XHRcdG5hbWU6IFwidGVzdFwiLFxuXHRcdFx0XHR2ZXJzaW9uOiBcIjEuMC4wXCIsXG5cdFx0XHR9LFxuXHRcdFx0aW5pdDogKCkgPT4ge30sXG5cdFx0XHRiZWZvcmVCdWlsZDogYXN5bmMgKF9vcHRpb25zOiBCdWlsZE9wdGlvbnMpID0+IHtcblx0XHRcdFx0aG9va3NDYWxsZWQuYmVmb3JlID0gdHJ1ZTtcblx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuXHRcdFx0fSxcblx0XHRcdGFmdGVyQnVpbGQ6IGFzeW5jIChfb3B0aW9uczogQnVpbGRPcHRpb25zLCBzdWNjZXNzOiBib29sZWFuKSA9PiB7XG5cdFx0XHRcdGhvb2tzQ2FsbGVkLmFmdGVyID0gdHJ1ZTtcblx0XHRcdFx0aG9va3NDYWxsZWQuYWZ0ZXJXaXRoU3VjY2VzcyA9IHN1Y2Nlc3M7XG5cdFx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcblx0XHRcdH0sXG5cdFx0fTtcblxuXHRcdGNvbnN0IG9yaWdpbmFsQ29tbWFuZCA9IERlbm8uQ29tbWFuZDtcblx0XHRjb25zdCBvcmlnaW5hbEdldFBsdWdpbnMgPSBjbGkuZ2V0TG9hZGVkUGx1Z2lucztcblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBAdHMtaWdub3JlOiBNb2NrIGltcGxlbWVudGF0aW9uXG5cdFx0XHREZW5vLkNvbW1hbmQgPSBNb2NrQ29tbWFuZDtcblx0XHRcdGNsaS5nZXRMb2FkZWRQbHVnaW5zID0gKCkgPT4gW21vY2tQbHVnaW5dO1xuXG5cdFx0XHQvLyBDcmVhdGUgdGVzdCBmaWxlXG5cdFx0XHRjb25zdCB0bXBEaXIgPSBhd2FpdCBEZW5vLm1ha2VUZW1wRGlyKCk7XG5cdFx0XHRjb25zdCB0ZXN0RmlsZSA9IGAke3RtcERpcn0vdGVzdC50c2A7XG5cdFx0XHRhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUodGVzdEZpbGUsIFwiY29uc29sZS5sb2coJ3Rlc3QnKTtcIik7XG5cblx0XHRcdC8vIEV4ZWN1dGUgYnVpbGRcblx0XHRcdGNvbnN0IGJ1aWxkQ29tbWFuZCA9IGNyZWF0ZUJ1aWxkQ29tbWFuZChjbGkpO1xuXHRcdFx0Y2xpLnJlZ2lzdGVyKGJ1aWxkQ29tbWFuZCk7XG5cdFx0XHRhd2FpdCBjbGkucnVuQ29tbWFuZChbXG5cdFx0XHRcdFwiYnVpbGRcIixcblx0XHRcdFx0XCItLW91dHB1dFwiLFxuXHRcdFx0XHRcInRlc3QtYmluXCIsXG5cdFx0XHRcdFwiLS10YXJnZXRcIixcblx0XHRcdFx0XCJsaW51eFwiLFxuXHRcdFx0XHRcIi0tZW50cnlcIixcblx0XHRcdFx0dGVzdEZpbGUsXG5cdFx0XHRdKTtcblxuXHRcdFx0Ly8gVmVyaWZ5IGhvb2tzXG5cdFx0XHRhc3NlcnRFcXVhbHMoXG5cdFx0XHRcdGhvb2tzQ2FsbGVkLmJlZm9yZSxcblx0XHRcdFx0dHJ1ZSxcblx0XHRcdFx0XCJiZWZvcmVCdWlsZCBob29rIHNob3VsZCBiZSBjYWxsZWRcIixcblx0XHRcdCk7XG5cdFx0XHRhc3NlcnRFcXVhbHMoaG9va3NDYWxsZWQuYWZ0ZXIsIHRydWUsIFwiYWZ0ZXJCdWlsZCBob29rIHNob3VsZCBiZSBjYWxsZWRcIik7XG5cdFx0XHRhc3NlcnRFcXVhbHMoXG5cdFx0XHRcdGhvb2tzQ2FsbGVkLmFmdGVyV2l0aFN1Y2Nlc3MsXG5cdFx0XHRcdHRydWUsXG5cdFx0XHRcdFwiYWZ0ZXJCdWlsZCBzaG91bGQgaW5kaWNhdGUgc3VjY2Vzc1wiLFxuXHRcdFx0KTtcblxuXHRcdFx0Ly8gQ2xlYW51cFxuXHRcdFx0YXdhaXQgRGVuby5yZW1vdmUodG1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0Ly8gQHRzLWlnbm9yZTogUmVzdG9yYXRpb25cblx0XHRcdERlbm8uQ29tbWFuZCA9IG9yaWdpbmFsQ29tbWFuZDtcblx0XHRcdGNsaS5nZXRMb2FkZWRQbHVnaW5zID0gb3JpZ2luYWxHZXRQbHVnaW5zO1xuXHRcdH1cblx0fSxcbn0pO1xuXG5EZW5vLnRlc3Qoe1xuXHRuYW1lOiBcIlBsdWdpbiBidWlsZCBjYW5jZWxsYXRpb25cIixcblx0cGVybWlzc2lvbnM6IHtcblx0XHRyZWFkOiB0cnVlLFxuXHRcdHdyaXRlOiB0cnVlLFxuXHRcdGVudjogdHJ1ZSxcblx0fSxcblx0YXN5bmMgZm4oKSB7XG5cdFx0Y29uc3QgeyBjbGkgfSA9IGF3YWl0IGNyZWF0ZVRlc3RDTEkoKTtcblx0XHRsZXQgYnVpbGRBdHRlbXB0ZWQgPSBmYWxzZTtcblxuXHRcdGNvbnN0IG1vY2tQbHVnaW46IFBsdWdpbiA9IHtcblx0XHRcdG1ldGFkYXRhOiB7XG5cdFx0XHRcdG5hbWU6IFwidGVzdFwiLFxuXHRcdFx0XHR2ZXJzaW9uOiBcIjEuMC4wXCIsXG5cdFx0XHR9LFxuXHRcdFx0aW5pdDogKCkgPT4ge30sXG5cdFx0XHRiZWZvcmVCdWlsZDogYXN5bmMgKF9vcHRpb25zOiBCdWlsZE9wdGlvbnMpID0+IHtcblx0XHRcdFx0YnVpbGRBdHRlbXB0ZWQgPSB0cnVlO1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJCdWlsZCBjYW5jZWxsZWQgYnkgcGx1Z2luXCIpO1xuXHRcdFx0fSxcblx0XHRcdGFmdGVyQnVpbGQ6ICgpID0+IHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHRcdFwiYWZ0ZXJCdWlsZCBzaG91bGQgbm90IGJlIGNhbGxlZCB3aGVuIGJ1aWxkIGlzIGNhbmNlbGxlZFwiLFxuXHRcdFx0XHQpO1xuXHRcdFx0fSxcblx0XHR9O1xuXG5cdFx0Y29uc3Qgb3JpZ2luYWxDb21tYW5kID0gRGVuby5Db21tYW5kO1xuXHRcdGNvbnN0IG9yaWdpbmFsR2V0UGx1Z2lucyA9IGNsaS5nZXRMb2FkZWRQbHVnaW5zO1xuXG5cdFx0dHJ5IHtcblx0XHRcdC8vIEB0cy1pZ25vcmU6IE1vY2sgaW1wbGVtZW50YXRpb25cblx0XHRcdERlbm8uQ29tbWFuZCA9IE1vY2tDb21tYW5kO1xuXHRcdFx0Y2xpLmdldExvYWRlZFBsdWdpbnMgPSAoKSA9PiBbbW9ja1BsdWdpbl07XG5cblx0XHRcdC8vIFNldHVwIHRlc3QgZmlsZVxuXHRcdFx0Y29uc3QgdG1wRGlyID0gYXdhaXQgRGVuby5tYWtlVGVtcERpcigpO1xuXHRcdFx0Y29uc3QgdGVzdEZpbGUgPSBgJHt0bXBEaXJ9L3Rlc3QudHNgO1xuXHRcdFx0YXdhaXQgRGVuby53cml0ZVRleHRGaWxlKHRlc3RGaWxlLCBcImNvbnNvbGUubG9nKCd0ZXN0Jyk7XCIpO1xuXG5cdFx0XHRjb25zdCBidWlsZENvbW1hbmQgPSBjcmVhdGVCdWlsZENvbW1hbmQoY2xpKTtcblx0XHRcdGNsaS5yZWdpc3RlcihidWlsZENvbW1hbmQpO1xuXG5cdFx0XHQvLyBWZXJpZnkgYnVpbGQgY2FuY2VsbGF0aW9uXG5cdFx0XHRhd2FpdCBhc3NlcnRSZWplY3RzKFxuXHRcdFx0XHQoKSA9PlxuXHRcdFx0XHRcdGNsaS5ydW5Db21tYW5kKFtcblx0XHRcdFx0XHRcdFwiYnVpbGRcIixcblx0XHRcdFx0XHRcdFwiLS1vdXRwdXRcIixcblx0XHRcdFx0XHRcdFwidGVzdC1iaW5cIixcblx0XHRcdFx0XHRcdFwiLS10YXJnZXRcIixcblx0XHRcdFx0XHRcdFwibGludXhcIixcblx0XHRcdFx0XHRcdFwiLS1lbnRyeVwiLFxuXHRcdFx0XHRcdFx0dGVzdEZpbGUsXG5cdFx0XHRcdFx0XSksXG5cdFx0XHRcdEVycm9yLFxuXHRcdFx0XHRcIkJ1aWxkIGNhbmNlbGxlZCBieSBwbHVnaW5cIixcblx0XHRcdCk7XG5cblx0XHRcdGFzc2VydEVxdWFscyhcblx0XHRcdFx0YnVpbGRBdHRlbXB0ZWQsXG5cdFx0XHRcdHRydWUsXG5cdFx0XHRcdFwiUGx1Z2luIHNob3VsZCBhdHRlbXB0IHRvIGNhbmNlbCBidWlsZFwiLFxuXHRcdFx0KTtcblxuXHRcdFx0Ly8gQ2xlYW51cFxuXHRcdFx0YXdhaXQgRGVuby5yZW1vdmUodG1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0Ly8gQHRzLWlnbm9yZTogUmVzdG9yYXRpb25cblx0XHRcdERlbm8uQ29tbWFuZCA9IG9yaWdpbmFsQ29tbWFuZDtcblx0XHRcdGNsaS5nZXRMb2FkZWRQbHVnaW5zID0gb3JpZ2luYWxHZXRQbHVnaW5zO1xuXHRcdH1cblx0fSxcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDhCQUE4Qjs7QUFDOUIsU0FBUyxZQUFZLEVBQUUsYUFBYSxRQUFRLGNBQWM7QUFDMUQsU0FBUyxrQkFBa0IsUUFBUSwyQkFBMkI7QUFDOUQsU0FBUyxhQUFhLFFBQVEsa0JBQWtCO2VBMkR4QyxPQUFPLFlBQVk7QUF4RDNCLDJEQUEyRDtBQUMzRCxNQUFNO0VBQ0ksTUFBTSxLQUFLO0VBQ1osVUFBVSxNQUFNO0VBRXhCLENBQUEsS0FBTSxHQUFHLElBQUksaUJBQTZCO0VBQzFDLENBQUEsTUFBTyxHQUFHLElBQUksaUJBQTZCO0VBQzNDLENBQUEsTUFBTyxHQUFHLElBQUksaUJBQTZCO0VBQzNDLENBQUEsTUFBTyxHQUFHLFFBQVEsT0FBTyxDQUFDO0lBQUUsU0FBUztJQUFNLE1BQU07SUFBRyxRQUFRO0VBQUssR0FBRztFQUVwRSxJQUFJLFFBQW9DO0lBQ3ZDLE9BQU8sSUFBSSxDQUFDLENBQUEsS0FBTTtFQUNuQjtFQUVBLElBQUksU0FBcUM7SUFDeEMsT0FBTyxJQUFJLENBQUMsQ0FBQSxNQUFPO0VBQ3BCO0VBRUEsSUFBSSxTQUFxQztJQUN4QyxPQUFPLElBQUksQ0FBQyxDQUFBLE1BQU87RUFDcEI7RUFFQSxJQUFJLFNBQXNDO0lBQ3pDLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtNQUNqQixPQUFPLFFBQVEsT0FBTyxDQUFDO1FBQUUsU0FBUztRQUFPLE1BQU07UUFBRyxRQUFRO01BQVU7SUFDckU7SUFDQSxPQUFPLElBQUksQ0FBQyxDQUFBLE1BQU87RUFDcEI7RUFFQSxNQUFNLFNBQXNDO0lBQzNDLE1BQU0sU0FBUyxNQUFNLElBQUksQ0FBQyxNQUFNO0lBQ2hDLE9BQU87TUFDTixHQUFHLE1BQU07TUFDVCxRQUFRLElBQUk7TUFDWixRQUFRLElBQUk7SUFDYjtFQUNEO0VBRUEsTUFBTSxlQUFvQztJQUN6QyxPQUFPLElBQUk7RUFDWjtFQUVBLE1BQVksQ0FBQztFQUNiLFFBQWMsQ0FBQztFQUVmLEtBQUssS0FBbUIsRUFBUTtJQUMvQixJQUFJLENBQUMsT0FBTyxHQUFHO0lBQ2YsSUFBSSxTQUFTLENBQUM7TUFBQztNQUFXO0tBQVUsQ0FBQyxRQUFRLENBQUMsUUFBUTtNQUNyRCxNQUFNLElBQUksTUFBTSxDQUFDLG9CQUFvQixFQUFFLE1BQU0sQ0FBQztJQUMvQztJQUNBLElBQUksQ0FBQyxDQUFBLE1BQU8sQ0FBQyxNQUFNO0lBQ25CLElBQUksQ0FBQyxDQUFBLE1BQU8sQ0FBQyxNQUFNO0lBQ25CLE1BQU0sU0FBUyxJQUFJLENBQUMsQ0FBQSxLQUFNLENBQUMsU0FBUztJQUNwQyxPQUFPLEtBQUs7RUFDYjtFQUVBLHVCQUE2QztJQUM1QyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtNQUNsQixJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ1g7RUFDRDtBQUNEO0FBRUEsNENBQTRDO0FBQzVDLE1BQU07RUFDTCxPQUFPLFdBQXFCLEVBQUUsQ0FBQztFQUUvQixZQUFZLEdBQWlCLEVBQUUsT0FBNkIsQ0FBRTtJQUM3RCxZQUFZLFFBQVEsR0FBRztNQUFDLElBQUksUUFBUTtTQUFRLFNBQVMsUUFBUSxFQUFFO0tBQUU7RUFDbEU7RUFFQSxRQUEyQjtJQUMxQixPQUFPLElBQUk7RUFDWjtFQUVBLE9BQU8sUUFBYztJQUNwQixJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUU7RUFDbkI7QUFDRDtBQUVBLDJFQUEyRTtBQUMzRSxLQUFLLElBQUksQ0FBQztFQUNULE1BQU07RUFDTixhQUFhO0lBQ1osTUFBTTtJQUNOLE9BQU87SUFDUCxLQUFLO0VBQ047RUFDQSxNQUFNO0lBQ0wsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLE1BQU07SUFDdEIsTUFBTSxlQUFlLG1CQUFtQjtJQUV4QyxNQUFNLGtCQUFrQixLQUFLLE9BQU87SUFDcEMsSUFBSTtNQUNILGtDQUFrQztNQUNsQyxLQUFLLE9BQU8sR0FBRztNQUNmLFlBQVksS0FBSztNQUVqQiw2QkFBNkI7TUFDN0IsTUFBTSxTQUFTLE1BQU0sS0FBSyxXQUFXO01BQ3JDLE1BQU0sV0FBVyxDQUFDLEVBQUUsT0FBTyxRQUFRLENBQUM7TUFDcEMsTUFBTSxLQUFLLGFBQWEsQ0FBQyxVQUFVO01BRW5DLElBQUksUUFBUSxDQUFDO01BQ2IsTUFBTSxJQUFJLFVBQVUsQ0FBQztRQUNwQjtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtPQUNBO01BRUQsaUJBQWlCO01BQ2pCLGFBQWEsWUFBWSxRQUFRLENBQUMsRUFBRSxFQUFFO01BQ3RDLGFBQWEsWUFBWSxRQUFRLENBQUMsRUFBRSxFQUFFO01BQ3RDLGFBQ0MsWUFBWSxRQUFRLENBQUMsUUFBUSxDQUFDLHNCQUM5QjtNQUdELFVBQVU7TUFDVixNQUFNLEtBQUssTUFBTSxDQUFDLFFBQVE7UUFBRSxXQUFXO01BQUs7SUFDN0MsU0FBVTtNQUNULDBCQUEwQjtNQUMxQixLQUFLLE9BQU8sR0FBRztJQUNoQjtFQUNEO0FBQ0Q7QUFFQSxLQUFLLElBQUksQ0FBQztFQUNULE1BQU07RUFDTixhQUFhO0lBQ1osTUFBTTtJQUNOLE9BQU87SUFDUCxLQUFLO0VBQ047RUFDQSxNQUFNO0lBQ0wsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLE1BQU07SUFDdEIsTUFBTSxjQUFjO01BQ25CLFFBQVE7TUFDUixPQUFPO01BQ1Asa0JBQWtCO0lBQ25CO0lBRUEsTUFBTSxhQUFxQjtNQUMxQixVQUFVO1FBQ1QsTUFBTTtRQUNOLFNBQVM7TUFDVjtNQUNBLE1BQU0sS0FBTztNQUNiLGFBQWEsT0FBTztRQUNuQixZQUFZLE1BQU0sR0FBRztRQUNyQixPQUFPLFFBQVEsT0FBTztNQUN2QjtNQUNBLFlBQVksT0FBTyxVQUF3QjtRQUMxQyxZQUFZLEtBQUssR0FBRztRQUNwQixZQUFZLGdCQUFnQixHQUFHO1FBQy9CLE9BQU8sUUFBUSxPQUFPO01BQ3ZCO0lBQ0Q7SUFFQSxNQUFNLGtCQUFrQixLQUFLLE9BQU87SUFDcEMsTUFBTSxxQkFBcUIsSUFBSSxnQkFBZ0I7SUFFL0MsSUFBSTtNQUNILGtDQUFrQztNQUNsQyxLQUFLLE9BQU8sR0FBRztNQUNmLElBQUksZ0JBQWdCLEdBQUcsSUFBTTtVQUFDO1NBQVc7TUFFekMsbUJBQW1CO01BQ25CLE1BQU0sU0FBUyxNQUFNLEtBQUssV0FBVztNQUNyQyxNQUFNLFdBQVcsQ0FBQyxFQUFFLE9BQU8sUUFBUSxDQUFDO01BQ3BDLE1BQU0sS0FBSyxhQUFhLENBQUMsVUFBVTtNQUVuQyxnQkFBZ0I7TUFDaEIsTUFBTSxlQUFlLG1CQUFtQjtNQUN4QyxJQUFJLFFBQVEsQ0FBQztNQUNiLE1BQU0sSUFBSSxVQUFVLENBQUM7UUFDcEI7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7T0FDQTtNQUVELGVBQWU7TUFDZixhQUNDLFlBQVksTUFBTSxFQUNsQixNQUNBO01BRUQsYUFBYSxZQUFZLEtBQUssRUFBRSxNQUFNO01BQ3RDLGFBQ0MsWUFBWSxnQkFBZ0IsRUFDNUIsTUFDQTtNQUdELFVBQVU7TUFDVixNQUFNLEtBQUssTUFBTSxDQUFDLFFBQVE7UUFBRSxXQUFXO01BQUs7SUFDN0MsU0FBVTtNQUNULDBCQUEwQjtNQUMxQixLQUFLLE9BQU8sR0FBRztNQUNmLElBQUksZ0JBQWdCLEdBQUc7SUFDeEI7RUFDRDtBQUNEO0FBRUEsS0FBSyxJQUFJLENBQUM7RUFDVCxNQUFNO0VBQ04sYUFBYTtJQUNaLE1BQU07SUFDTixPQUFPO0lBQ1AsS0FBSztFQUNOO0VBQ0EsTUFBTTtJQUNMLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNO0lBQ3RCLElBQUksaUJBQWlCO0lBRXJCLE1BQU0sYUFBcUI7TUFDMUIsVUFBVTtRQUNULE1BQU07UUFDTixTQUFTO01BQ1Y7TUFDQSxNQUFNLEtBQU87TUFDYixhQUFhLE9BQU87UUFDbkIsaUJBQWlCO1FBQ2pCLE1BQU0sSUFBSSxNQUFNO01BQ2pCO01BQ0EsWUFBWTtRQUNYLE1BQU0sSUFBSSxNQUNUO01BRUY7SUFDRDtJQUVBLE1BQU0sa0JBQWtCLEtBQUssT0FBTztJQUNwQyxNQUFNLHFCQUFxQixJQUFJLGdCQUFnQjtJQUUvQyxJQUFJO01BQ0gsa0NBQWtDO01BQ2xDLEtBQUssT0FBTyxHQUFHO01BQ2YsSUFBSSxnQkFBZ0IsR0FBRyxJQUFNO1VBQUM7U0FBVztNQUV6QyxrQkFBa0I7TUFDbEIsTUFBTSxTQUFTLE1BQU0sS0FBSyxXQUFXO01BQ3JDLE1BQU0sV0FBVyxDQUFDLEVBQUUsT0FBTyxRQUFRLENBQUM7TUFDcEMsTUFBTSxLQUFLLGFBQWEsQ0FBQyxVQUFVO01BRW5DLE1BQU0sZUFBZSxtQkFBbUI7TUFDeEMsSUFBSSxRQUFRLENBQUM7TUFFYiw0QkFBNEI7TUFDNUIsTUFBTSxjQUNMLElBQ0MsSUFBSSxVQUFVLENBQUM7VUFDZDtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtTQUNBLEdBQ0YsT0FDQTtNQUdELGFBQ0MsZ0JBQ0EsTUFDQTtNQUdELFVBQVU7TUFDVixNQUFNLEtBQUssTUFBTSxDQUFDLFFBQVE7UUFBRSxXQUFXO01BQUs7SUFDN0MsU0FBVTtNQUNULDBCQUEwQjtNQUMxQixLQUFLLE9BQU8sR0FBRztNQUNmLElBQUksZ0JBQWdCLEdBQUc7SUFDeEI7RUFDRDtBQUNEIn0=
// denoCacheMetadata=3824409171253623143,8665938609513113179