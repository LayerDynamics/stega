// tests/middleware.test.ts
import { CLI } from "../src/core.ts";
import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";
Deno.test("Middleware should execute before command action", async ()=>{
  const cli = new CLI(undefined, true, true);
  let middlewareExecuted = false;
  let actionExecuted = false;
  // Register middleware
  cli.use((_args, _command)=>{
    middlewareExecuted = true;
  });
  // Register command
  cli.register({
    name: "test",
    action: ()=>{
      actionExecuted = true;
    }
  });
  // Mock Deno.args
  const originalArgs = Deno.args;
  Object.defineProperty(Deno, "args", {
    value: [
      "test"
    ]
  });
  await cli.run();
  // Restore Deno.args
  Object.defineProperty(Deno, "args", {
    value: originalArgs
  });
  assertEquals(middlewareExecuted, true);
  assertEquals(actionExecuted, true);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9taWRkbGV3YXJlLnRlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGVzdHMvbWlkZGxld2FyZS50ZXN0LnRzXG5pbXBvcnQgeyBDTEkgfSBmcm9tIFwiLi4vc3JjL2NvcmUudHNcIjtcbmltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4yMDMuMC90ZXN0aW5nL2Fzc2VydHMudHNcIjtcblxuRGVuby50ZXN0KFwiTWlkZGxld2FyZSBzaG91bGQgZXhlY3V0ZSBiZWZvcmUgY29tbWFuZCBhY3Rpb25cIiwgYXN5bmMgKCkgPT4ge1xuXHRjb25zdCBjbGkgPSBuZXcgQ0xJKHVuZGVmaW5lZCwgdHJ1ZSwgdHJ1ZSk7XG5cblx0bGV0IG1pZGRsZXdhcmVFeGVjdXRlZCA9IGZhbHNlO1xuXHRsZXQgYWN0aW9uRXhlY3V0ZWQgPSBmYWxzZTtcblxuXHQvLyBSZWdpc3RlciBtaWRkbGV3YXJlXG5cdGNsaS51c2UoKF9hcmdzLCBfY29tbWFuZCkgPT4ge1xuXHRcdG1pZGRsZXdhcmVFeGVjdXRlZCA9IHRydWU7XG5cdH0pO1xuXG5cdC8vIFJlZ2lzdGVyIGNvbW1hbmRcblx0Y2xpLnJlZ2lzdGVyKHtcblx0XHRuYW1lOiBcInRlc3RcIixcblx0XHRhY3Rpb246ICgpID0+IHtcblx0XHRcdGFjdGlvbkV4ZWN1dGVkID0gdHJ1ZTtcblx0XHR9LFxuXHR9KTtcblxuXHQvLyBNb2NrIERlbm8uYXJnc1xuXHRjb25zdCBvcmlnaW5hbEFyZ3MgPSBEZW5vLmFyZ3M7XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShEZW5vLCBcImFyZ3NcIiwgeyB2YWx1ZTogW1widGVzdFwiXSB9KTtcblxuXHRhd2FpdCBjbGkucnVuKCk7XG5cblx0Ly8gUmVzdG9yZSBEZW5vLmFyZ3Ncblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KERlbm8sIFwiYXJnc1wiLCB7IHZhbHVlOiBvcmlnaW5hbEFyZ3MgfSk7XG5cblx0YXNzZXJ0RXF1YWxzKG1pZGRsZXdhcmVFeGVjdXRlZCwgdHJ1ZSk7XG5cdGFzc2VydEVxdWFscyhhY3Rpb25FeGVjdXRlZCwgdHJ1ZSk7XG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwyQkFBMkI7QUFDM0IsU0FBUyxHQUFHLFFBQVEsaUJBQWlCO0FBQ3JDLFNBQVMsWUFBWSxRQUFRLG1EQUFtRDtBQUVoRixLQUFLLElBQUksQ0FBQyxtREFBbUQ7RUFDNUQsTUFBTSxNQUFNLElBQUksSUFBSSxXQUFXLE1BQU07RUFFckMsSUFBSSxxQkFBcUI7RUFDekIsSUFBSSxpQkFBaUI7RUFFckIsc0JBQXNCO0VBQ3RCLElBQUksR0FBRyxDQUFDLENBQUMsT0FBTztJQUNmLHFCQUFxQjtFQUN0QjtFQUVBLG1CQUFtQjtFQUNuQixJQUFJLFFBQVEsQ0FBQztJQUNaLE1BQU07SUFDTixRQUFRO01BQ1AsaUJBQWlCO0lBQ2xCO0VBQ0Q7RUFFQSxpQkFBaUI7RUFDakIsTUFBTSxlQUFlLEtBQUssSUFBSTtFQUM5QixPQUFPLGNBQWMsQ0FBQyxNQUFNLFFBQVE7SUFBRSxPQUFPO01BQUM7S0FBTztFQUFDO0VBRXRELE1BQU0sSUFBSSxHQUFHO0VBRWIsb0JBQW9CO0VBQ3BCLE9BQU8sY0FBYyxDQUFDLE1BQU0sUUFBUTtJQUFFLE9BQU87RUFBYTtFQUUxRCxhQUFhLG9CQUFvQjtFQUNqQyxhQUFhLGdCQUFnQjtBQUM5QiJ9
// denoCacheMetadata=13211825250417548911,3796713557577620081