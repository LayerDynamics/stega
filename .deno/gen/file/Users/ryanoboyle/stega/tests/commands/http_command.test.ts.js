// tests/commands/http_command.test.ts
import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { createHttpCommand } from "../../src/commands/http_command.ts";
import { createTestCLI, mockFetchWithAbort } from "../test_utils.ts";
Deno.test("HTTP Command - Basic GET request", async (t)=>{
  await t.step("handles requests", async ()=>{
    const { cli } = await createTestCLI();
    const command = createHttpCommand({});
    cli.register(command);
    let capturedRequest;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init)=>{
      capturedRequest = init;
      return new Response(JSON.stringify({
        success: true
      }), {
        status: 200
      });
    };
    try {
      await cli.runCommand([
        "http",
        "--method=GET",
        "--url=https://api.example.com/test",
        "--headers=Accept:application/json"
      ]);
      assertEquals(capturedRequest?.method, "GET");
      assertEquals((capturedRequest?.headers)["Accept"], "application/json");
    } finally{
      globalThis.fetch = originalFetch;
    }
  });
});
Deno.test("HTTP Command - POST request with data", async (t)=>{
  await t.step("handles requests", async ()=>{
    const { cli } = await createTestCLI();
    const command = createHttpCommand({});
    cli.register(command);
    let capturedRequest = {};
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init)=>{
      if (init) {
        capturedRequest = {
          method: init.method,
          body: init.body,
          headers: init.headers instanceof Headers ? Object.fromEntries(init.headers.entries()) : init.headers
        };
      }
      return new Response(JSON.stringify({
        success: true
      }), {
        status: 200
      });
    };
    try {
      const testData = {
        test: "value"
      };
      await cli.runCommand([
        "http",
        "--method=POST",
        "--url=https://api.example.com/test",
        `--data=${JSON.stringify(testData)}`,
        "--headers=Content-Type:application/json"
      ]);
      assertEquals(capturedRequest.method, "POST");
      assertEquals(JSON.parse(capturedRequest.body || "{}"), testData);
      assertEquals(capturedRequest.headers?.["Content-Type"], "application/json");
    } finally{
      globalThis.fetch = originalFetch;
    }
  });
});
Deno.test("HTTP Command - Handles network errors", async (t)=>{
  await t.step("handles requests", async ()=>{
    const { cli } = await createTestCLI();
    const command = createHttpCommand({});
    cli.register(command);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ()=>{
      throw new TypeError("Failed to fetch");
    };
    try {
      await assertRejects(()=>cli.runCommand([
          "http",
          "--method=GET",
          "--url=https://api.example.com/test"
        ]), Error, "Network error");
    } finally{
      globalThis.fetch = originalFetch;
    }
  });
});
Deno.test("HTTP Command - Handles timeout", async (t)=>{
  await t.step("handles requests", async ()=>{
    const { cli } = await createTestCLI();
    const command = createHttpCommand({
      httpOptions: {
        timeout: 100
      }
    });
    cli.register(command);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetchWithAbort(200, {
      success: true
    }, 200); // Delay longer than timeout
    try {
      await assertRejects(()=>cli.runCommand([
          "http",
          "--method=GET",
          "--url=https://api.example.com/test"
        ]), Error, "Network error: Request timeout");
    } finally{
      globalThis.fetch = originalFetch;
    }
  });
});
Deno.test("HTTP Command - Handles retry logic", async (t)=>{
  await t.step("handles requests", async ()=>{
    const { cli } = await createTestCLI();
    let attempts = 0;
    const command = createHttpCommand({
      httpOptions: {
        retries: 2
      }
    });
    cli.register(command);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetchWithAbort(200, {
      success: true
    }, 100);
    // Modify the mock to fail the first two attempts
    globalThis.fetch = (input, init)=>{
      attempts++;
      if (attempts < 3) {
        return new Promise((_, reject)=>{
          const timer = setTimeout(()=>{
            reject(new Error("Temporary failure"));
          }, 100);
          if (init?.signal) {
            init.signal.addEventListener("abort", ()=>{
              clearTimeout(timer);
              reject(new DOMException("Aborted", "AbortError"));
            });
          }
        });
      }
      return mockFetchWithAbort(200, {
        success: true
      }, 100)(input, init);
    };
    try {
      await cli.runCommand([
        "http",
        "--method=GET",
        "--url=https://api.example.com/test"
      ]);
      assertEquals(attempts, 3, "Should have attempted 3 times");
    } finally{
      globalThis.fetch = originalFetch;
    }
  });
});
Deno.test("HTTP Command - Handles HTTP errors", async (t)=>{
  await t.step("handles requests", async ()=>{
    const { cli } = await createTestCLI();
    const command = createHttpCommand({
      httpOptions: {
        validateStatus: (status)=>status === 200
      }
    });
    cli.register(command);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetchWithAbort(404, {
      success: false,
      message: "Not found"
    });
    try {
      await assertRejects(()=>cli.runCommand([
          "http",
          "--method=GET",
          "--url=https://api.example.com/test"
        ]), Error, "HTTP error 404");
    } finally{
      globalThis.fetch = originalFetch;
    }
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9jb21tYW5kcy9odHRwX2NvbW1hbmQudGVzdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0ZXN0cy9jb21tYW5kcy9odHRwX2NvbW1hbmQudGVzdC50c1xuaW1wb3J0IHtcblx0YXNzZXJ0RXF1YWxzLFxuXHRhc3NlcnRSZWplY3RzLFxufSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuMjI0LjAvdGVzdGluZy9hc3NlcnRzLnRzXCI7XG5pbXBvcnQgeyBjcmVhdGVIdHRwQ29tbWFuZCB9IGZyb20gXCIuLi8uLi9zcmMvY29tbWFuZHMvaHR0cF9jb21tYW5kLnRzXCI7XG5pbXBvcnQgeyBjcmVhdGVUZXN0Q0xJLCBtb2NrRmV0Y2hXaXRoQWJvcnQgfSBmcm9tIFwiLi4vdGVzdF91dGlscy50c1wiO1xuXG5pbnRlcmZhY2UgTW9ja1Jlc3BvbnNlIHtcblx0c3VjY2Vzcz86IGJvb2xlYW47XG5cdG1lc3NhZ2U/OiBzdHJpbmc7XG5cdGVycm9yPzogc3RyaW5nO1xuXHRba2V5OiBzdHJpbmddOiB1bmtub3duO1xufVxuXG5EZW5vLnRlc3QoXCJIVFRQIENvbW1hbmQgLSBCYXNpYyBHRVQgcmVxdWVzdFwiLCBhc3luYyAodCkgPT4ge1xuXHRhd2FpdCB0LnN0ZXAoXCJoYW5kbGVzIHJlcXVlc3RzXCIsIGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IGNsaSB9ID0gYXdhaXQgY3JlYXRlVGVzdENMSSgpO1xuXHRcdGNvbnN0IGNvbW1hbmQgPSBjcmVhdGVIdHRwQ29tbWFuZCh7fSk7XG5cdFx0Y2xpLnJlZ2lzdGVyKGNvbW1hbmQpO1xuXG5cdFx0bGV0IGNhcHR1cmVkUmVxdWVzdDogUmVxdWVzdEluaXQgfCB1bmRlZmluZWQ7XG5cdFx0Y29uc3Qgb3JpZ2luYWxGZXRjaCA9IGdsb2JhbFRoaXMuZmV0Y2g7XG5cdFx0Z2xvYmFsVGhpcy5mZXRjaCA9IGFzeW5jIChcblx0XHRcdGlucHV0OiBzdHJpbmcgfCBVUkwgfCBSZXF1ZXN0LFxuXHRcdFx0aW5pdD86IFJlcXVlc3RJbml0LFxuXHRcdCkgPT4ge1xuXHRcdFx0Y2FwdHVyZWRSZXF1ZXN0ID0gaW5pdDtcblx0XHRcdHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlIH0pLCB7IHN0YXR1czogMjAwIH0pO1xuXHRcdH07XG5cblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgY2xpLnJ1bkNvbW1hbmQoW1xuXHRcdFx0XHRcImh0dHBcIixcblx0XHRcdFx0XCItLW1ldGhvZD1HRVRcIixcblx0XHRcdFx0XCItLXVybD1odHRwczovL2FwaS5leGFtcGxlLmNvbS90ZXN0XCIsXG5cdFx0XHRcdFwiLS1oZWFkZXJzPUFjY2VwdDphcHBsaWNhdGlvbi9qc29uXCIsXG5cdFx0XHRdKTtcblxuXHRcdFx0YXNzZXJ0RXF1YWxzKGNhcHR1cmVkUmVxdWVzdD8ubWV0aG9kLCBcIkdFVFwiKTtcblx0XHRcdGFzc2VydEVxdWFscyhcblx0XHRcdFx0KGNhcHR1cmVkUmVxdWVzdD8uaGVhZGVycyBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVtcIkFjY2VwdFwiXSxcblx0XHRcdFx0XCJhcHBsaWNhdGlvbi9qc29uXCIsXG5cdFx0XHQpO1xuXHRcdH0gZmluYWxseSB7XG5cdFx0XHRnbG9iYWxUaGlzLmZldGNoID0gb3JpZ2luYWxGZXRjaDtcblx0XHR9XG5cdH0pO1xufSk7XG5cbkRlbm8udGVzdChcIkhUVFAgQ29tbWFuZCAtIFBPU1QgcmVxdWVzdCB3aXRoIGRhdGFcIiwgYXN5bmMgKHQpID0+IHtcblx0YXdhaXQgdC5zdGVwKFwiaGFuZGxlcyByZXF1ZXN0c1wiLCBhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgeyBjbGkgfSA9IGF3YWl0IGNyZWF0ZVRlc3RDTEkoKTtcblx0XHRjb25zdCBjb21tYW5kID0gY3JlYXRlSHR0cENvbW1hbmQoe30pO1xuXHRcdGNsaS5yZWdpc3Rlcihjb21tYW5kKTtcblxuXHRcdGxldCBjYXB0dXJlZFJlcXVlc3Q6IHtcblx0XHRcdG1ldGhvZD86IHN0cmluZztcblx0XHRcdGJvZHk/OiBzdHJpbmc7XG5cdFx0XHRoZWFkZXJzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblx0XHR9ID0ge307XG5cdFx0Y29uc3Qgb3JpZ2luYWxGZXRjaCA9IGdsb2JhbFRoaXMuZmV0Y2g7XG5cblx0XHRnbG9iYWxUaGlzLmZldGNoID0gYXN5bmMgKFxuXHRcdFx0aW5wdXQ6IHN0cmluZyB8IFVSTCB8IFJlcXVlc3QsXG5cdFx0XHRpbml0PzogUmVxdWVzdEluaXQsXG5cdFx0KSA9PiB7XG5cdFx0XHRpZiAoaW5pdCkge1xuXHRcdFx0XHRjYXB0dXJlZFJlcXVlc3QgPSB7XG5cdFx0XHRcdFx0bWV0aG9kOiBpbml0Lm1ldGhvZCxcblx0XHRcdFx0XHRib2R5OiBpbml0LmJvZHkgYXMgc3RyaW5nLFxuXHRcdFx0XHRcdGhlYWRlcnM6IGluaXQuaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnNcblx0XHRcdFx0XHRcdD8gT2JqZWN0LmZyb21FbnRyaWVzKGluaXQuaGVhZGVycy5lbnRyaWVzKCkpXG5cdFx0XHRcdFx0XHQ6IChpbml0LmhlYWRlcnMgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPiksXG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSB9KSwgeyBzdGF0dXM6IDIwMCB9KTtcblx0XHR9O1xuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHRlc3REYXRhID0geyB0ZXN0OiBcInZhbHVlXCIgfTtcblx0XHRcdGF3YWl0IGNsaS5ydW5Db21tYW5kKFtcblx0XHRcdFx0XCJodHRwXCIsXG5cdFx0XHRcdFwiLS1tZXRob2Q9UE9TVFwiLFxuXHRcdFx0XHRcIi0tdXJsPWh0dHBzOi8vYXBpLmV4YW1wbGUuY29tL3Rlc3RcIixcblx0XHRcdFx0YC0tZGF0YT0ke0pTT04uc3RyaW5naWZ5KHRlc3REYXRhKX1gLFxuXHRcdFx0XHRcIi0taGVhZGVycz1Db250ZW50LVR5cGU6YXBwbGljYXRpb24vanNvblwiLFxuXHRcdFx0XSk7XG5cblx0XHRcdGFzc2VydEVxdWFscyhjYXB0dXJlZFJlcXVlc3QubWV0aG9kLCBcIlBPU1RcIik7XG5cdFx0XHRhc3NlcnRFcXVhbHMoSlNPTi5wYXJzZShjYXB0dXJlZFJlcXVlc3QuYm9keSB8fCBcInt9XCIpLCB0ZXN0RGF0YSk7XG5cdFx0XHRhc3NlcnRFcXVhbHMoXG5cdFx0XHRcdGNhcHR1cmVkUmVxdWVzdC5oZWFkZXJzPy5bXCJDb250ZW50LVR5cGVcIl0sXG5cdFx0XHRcdFwiYXBwbGljYXRpb24vanNvblwiLFxuXHRcdFx0KTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0Z2xvYmFsVGhpcy5mZXRjaCA9IG9yaWdpbmFsRmV0Y2g7XG5cdFx0fVxuXHR9KTtcbn0pO1xuXG5EZW5vLnRlc3QoXCJIVFRQIENvbW1hbmQgLSBIYW5kbGVzIG5ldHdvcmsgZXJyb3JzXCIsIGFzeW5jICh0KSA9PiB7XG5cdGF3YWl0IHQuc3RlcChcImhhbmRsZXMgcmVxdWVzdHNcIiwgYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IHsgY2xpIH0gPSBhd2FpdCBjcmVhdGVUZXN0Q0xJKCk7XG5cdFx0Y29uc3QgY29tbWFuZCA9IGNyZWF0ZUh0dHBDb21tYW5kKHt9KTtcblx0XHRjbGkucmVnaXN0ZXIoY29tbWFuZCk7XG5cblx0XHRjb25zdCBvcmlnaW5hbEZldGNoID0gZ2xvYmFsVGhpcy5mZXRjaDtcblx0XHRnbG9iYWxUaGlzLmZldGNoID0gKCkgPT4ge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcihcIkZhaWxlZCB0byBmZXRjaFwiKTtcblx0XHR9O1xuXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IGFzc2VydFJlamVjdHMoXG5cdFx0XHRcdCgpID0+XG5cdFx0XHRcdFx0Y2xpLnJ1bkNvbW1hbmQoW1xuXHRcdFx0XHRcdFx0XCJodHRwXCIsXG5cdFx0XHRcdFx0XHRcIi0tbWV0aG9kPUdFVFwiLFxuXHRcdFx0XHRcdFx0XCItLXVybD1odHRwczovL2FwaS5leGFtcGxlLmNvbS90ZXN0XCIsXG5cdFx0XHRcdFx0XSksXG5cdFx0XHRcdEVycm9yLFxuXHRcdFx0XHRcIk5ldHdvcmsgZXJyb3JcIixcblx0XHRcdCk7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdGdsb2JhbFRoaXMuZmV0Y2ggPSBvcmlnaW5hbEZldGNoO1xuXHRcdH1cblx0fSk7XG59KTtcblxuRGVuby50ZXN0KFwiSFRUUCBDb21tYW5kIC0gSGFuZGxlcyB0aW1lb3V0XCIsIGFzeW5jICh0KSA9PiB7XG5cdGF3YWl0IHQuc3RlcChcImhhbmRsZXMgcmVxdWVzdHNcIiwgYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IHsgY2xpIH0gPSBhd2FpdCBjcmVhdGVUZXN0Q0xJKCk7XG5cdFx0Y29uc3QgY29tbWFuZCA9IGNyZWF0ZUh0dHBDb21tYW5kKHtcblx0XHRcdGh0dHBPcHRpb25zOiB7XG5cdFx0XHRcdHRpbWVvdXQ6IDEwMCwgLy8gU2hvcnQgdGltZW91dCBmb3IgdGVzdGluZ1xuXHRcdFx0fSxcblx0XHR9KTtcblx0XHRjbGkucmVnaXN0ZXIoY29tbWFuZCk7XG5cblx0XHRjb25zdCBvcmlnaW5hbEZldGNoID0gZ2xvYmFsVGhpcy5mZXRjaDtcblx0XHRnbG9iYWxUaGlzLmZldGNoID0gbW9ja0ZldGNoV2l0aEFib3J0KDIwMCwgeyBzdWNjZXNzOiB0cnVlIH0sIDIwMCk7IC8vIERlbGF5IGxvbmdlciB0aGFuIHRpbWVvdXRcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBhc3NlcnRSZWplY3RzKFxuXHRcdFx0XHQoKSA9PlxuXHRcdFx0XHRcdGNsaS5ydW5Db21tYW5kKFtcblx0XHRcdFx0XHRcdFwiaHR0cFwiLFxuXHRcdFx0XHRcdFx0XCItLW1ldGhvZD1HRVRcIixcblx0XHRcdFx0XHRcdFwiLS11cmw9aHR0cHM6Ly9hcGkuZXhhbXBsZS5jb20vdGVzdFwiLFxuXHRcdFx0XHRcdF0pLFxuXHRcdFx0XHRFcnJvcixcblx0XHRcdFx0XCJOZXR3b3JrIGVycm9yOiBSZXF1ZXN0IHRpbWVvdXRcIixcblx0XHRcdCk7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdGdsb2JhbFRoaXMuZmV0Y2ggPSBvcmlnaW5hbEZldGNoO1xuXHRcdH1cblx0fSk7XG59KTtcblxuRGVuby50ZXN0KFwiSFRUUCBDb21tYW5kIC0gSGFuZGxlcyByZXRyeSBsb2dpY1wiLCBhc3luYyAodCkgPT4ge1xuXHRhd2FpdCB0LnN0ZXAoXCJoYW5kbGVzIHJlcXVlc3RzXCIsIGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IGNsaSB9ID0gYXdhaXQgY3JlYXRlVGVzdENMSSgpO1xuXHRcdGxldCBhdHRlbXB0cyA9IDA7XG5cblx0XHRjb25zdCBjb21tYW5kID0gY3JlYXRlSHR0cENvbW1hbmQoe1xuXHRcdFx0aHR0cE9wdGlvbnM6IHtcblx0XHRcdFx0cmV0cmllczogMixcblx0XHRcdH0sXG5cdFx0fSk7XG5cdFx0Y2xpLnJlZ2lzdGVyKGNvbW1hbmQpO1xuXG5cdFx0Y29uc3Qgb3JpZ2luYWxGZXRjaCA9IGdsb2JhbFRoaXMuZmV0Y2g7XG5cdFx0Z2xvYmFsVGhpcy5mZXRjaCA9IG1vY2tGZXRjaFdpdGhBYm9ydCgyMDAsIHsgc3VjY2VzczogdHJ1ZSB9LCAxMDApO1xuXHRcdC8vIE1vZGlmeSB0aGUgbW9jayB0byBmYWlsIHRoZSBmaXJzdCB0d28gYXR0ZW1wdHNcblx0XHRnbG9iYWxUaGlzLmZldGNoID0gKGlucHV0OiBzdHJpbmcgfCBVUkwgfCBSZXF1ZXN0LCBpbml0PzogUmVxdWVzdEluaXQpID0+IHtcblx0XHRcdGF0dGVtcHRzKys7XG5cdFx0XHRpZiAoYXR0ZW1wdHMgPCAzKSB7XG5cdFx0XHRcdHJldHVybiBuZXcgUHJvbWlzZTxSZXNwb25zZT4oKF8sIHJlamVjdCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRyZWplY3QobmV3IEVycm9yKFwiVGVtcG9yYXJ5IGZhaWx1cmVcIikpO1xuXHRcdFx0XHRcdH0sIDEwMCk7XG5cdFx0XHRcdFx0aWYgKGluaXQ/LnNpZ25hbCkge1xuXHRcdFx0XHRcdFx0aW5pdC5zaWduYWwuYWRkRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsICgpID0+IHtcblx0XHRcdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVyKTtcblx0XHRcdFx0XHRcdFx0cmVqZWN0KG5ldyBET01FeGNlcHRpb24oXCJBYm9ydGVkXCIsIFwiQWJvcnRFcnJvclwiKSk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG1vY2tGZXRjaFdpdGhBYm9ydCgyMDAsIHsgc3VjY2VzczogdHJ1ZSB9LCAxMDApKGlucHV0LCBpbml0KTtcblx0XHR9O1xuXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IGNsaS5ydW5Db21tYW5kKFtcblx0XHRcdFx0XCJodHRwXCIsXG5cdFx0XHRcdFwiLS1tZXRob2Q9R0VUXCIsXG5cdFx0XHRcdFwiLS11cmw9aHR0cHM6Ly9hcGkuZXhhbXBsZS5jb20vdGVzdFwiLFxuXHRcdFx0XSk7XG5cblx0XHRcdGFzc2VydEVxdWFscyhhdHRlbXB0cywgMywgXCJTaG91bGQgaGF2ZSBhdHRlbXB0ZWQgMyB0aW1lc1wiKTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0Z2xvYmFsVGhpcy5mZXRjaCA9IG9yaWdpbmFsRmV0Y2g7XG5cdFx0fVxuXHR9KTtcbn0pO1xuXG5EZW5vLnRlc3QoXCJIVFRQIENvbW1hbmQgLSBIYW5kbGVzIEhUVFAgZXJyb3JzXCIsIGFzeW5jICh0KSA9PiB7XG5cdGF3YWl0IHQuc3RlcChcImhhbmRsZXMgcmVxdWVzdHNcIiwgYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IHsgY2xpIH0gPSBhd2FpdCBjcmVhdGVUZXN0Q0xJKCk7XG5cdFx0Y29uc3QgY29tbWFuZCA9IGNyZWF0ZUh0dHBDb21tYW5kKHtcblx0XHRcdGh0dHBPcHRpb25zOiB7XG5cdFx0XHRcdHZhbGlkYXRlU3RhdHVzOiAoc3RhdHVzKSA9PiBzdGF0dXMgPT09IDIwMCxcblx0XHRcdH0sXG5cdFx0fSk7XG5cdFx0Y2xpLnJlZ2lzdGVyKGNvbW1hbmQpO1xuXG5cdFx0Y29uc3Qgb3JpZ2luYWxGZXRjaCA9IGdsb2JhbFRoaXMuZmV0Y2g7XG5cdFx0Z2xvYmFsVGhpcy5mZXRjaCA9IG1vY2tGZXRjaFdpdGhBYm9ydCg0MDQsIHtcblx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0bWVzc2FnZTogXCJOb3QgZm91bmRcIixcblx0XHR9KTtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBhc3NlcnRSZWplY3RzKFxuXHRcdFx0XHQoKSA9PlxuXHRcdFx0XHRcdGNsaS5ydW5Db21tYW5kKFtcblx0XHRcdFx0XHRcdFwiaHR0cFwiLFxuXHRcdFx0XHRcdFx0XCItLW1ldGhvZD1HRVRcIixcblx0XHRcdFx0XHRcdFwiLS11cmw9aHR0cHM6Ly9hcGkuZXhhbXBsZS5jb20vdGVzdFwiLFxuXHRcdFx0XHRcdF0pLFxuXHRcdFx0XHRFcnJvcixcblx0XHRcdFx0XCJIVFRQIGVycm9yIDQwNFwiLFxuXHRcdFx0KTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0Z2xvYmFsVGhpcy5mZXRjaCA9IG9yaWdpbmFsRmV0Y2g7XG5cdFx0fVxuXHR9KTtcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHNDQUFzQztBQUN0QyxTQUNDLFlBQVksRUFDWixhQUFhLFFBQ1AsbURBQW1EO0FBQzFELFNBQVMsaUJBQWlCLFFBQVEscUNBQXFDO0FBQ3ZFLFNBQVMsYUFBYSxFQUFFLGtCQUFrQixRQUFRLG1CQUFtQjtBQVNyRSxLQUFLLElBQUksQ0FBQyxvQ0FBb0MsT0FBTztFQUNwRCxNQUFNLEVBQUUsSUFBSSxDQUFDLG9CQUFvQjtJQUNoQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTTtJQUN0QixNQUFNLFVBQVUsa0JBQWtCLENBQUM7SUFDbkMsSUFBSSxRQUFRLENBQUM7SUFFYixJQUFJO0lBQ0osTUFB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
// denoCacheMetadata=8807955564254194953,14669910211037349086