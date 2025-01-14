// tests/performance/startup.test.ts
import { TestHarness } from "../utils/test_harness.ts";
import { assert } from "@std/assert";
Deno.test("Performance - CLI Startup", async (t)=>{
  const harness = new TestHarness();
  await t.step("measures startup time", async ()=>{
    const start = performance.now();
    const cli = harness.getCLI();
    const end = performance.now();
    const startupTime = end - start;
    assert(startupTime < 100, `Startup time (${startupTime}ms) exceeds 100ms threshold`);
  });
  await t.step("measures command registration overhead", async ()=>{
    const cli = harness.getCLI();
    const start = performance.now();
    // Register test commands
    for(let i = 0; i < 100; i++){
      cli.register({
        name: `test-${i}`,
        action: ()=>{}
      });
    }
    const end = performance.now();
    const registrationTime = end - start;
    assert(registrationTime < 50, `Registration time (${registrationTime}ms) exceeds 50ms threshold`);
  });
  await harness.cleanup();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9wZXJmb3JtYW5jZS9zdGFydHVwLnRlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGVzdHMvcGVyZm9ybWFuY2Uvc3RhcnR1cC50ZXN0LnRzXG5pbXBvcnQgeyBUZXN0SGFybmVzcyB9IGZyb20gXCIuLi91dGlscy90ZXN0X2hhcm5lc3MudHNcIjtcbmltcG9ydCB7IGFzc2VydCwgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG5cbkRlbm8udGVzdChcIlBlcmZvcm1hbmNlIC0gQ0xJIFN0YXJ0dXBcIiwgYXN5bmMgKHQpID0+IHtcblx0Y29uc3QgaGFybmVzcyA9IG5ldyBUZXN0SGFybmVzcygpO1xuXG5cdGF3YWl0IHQuc3RlcChcIm1lYXN1cmVzIHN0YXJ0dXAgdGltZVwiLCBhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3Qgc3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcblx0XHRjb25zdCBjbGkgPSBoYXJuZXNzLmdldENMSSgpO1xuXHRcdGNvbnN0IGVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG5cdFx0Y29uc3Qgc3RhcnR1cFRpbWUgPSBlbmQgLSBzdGFydDtcblx0XHRhc3NlcnQoXG5cdFx0XHRzdGFydHVwVGltZSA8IDEwMCxcblx0XHRcdGBTdGFydHVwIHRpbWUgKCR7c3RhcnR1cFRpbWV9bXMpIGV4Y2VlZHMgMTAwbXMgdGhyZXNob2xkYCxcblx0XHQpO1xuXHR9KTtcblxuXHRhd2FpdCB0LnN0ZXAoXCJtZWFzdXJlcyBjb21tYW5kIHJlZ2lzdHJhdGlvbiBvdmVyaGVhZFwiLCBhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgY2xpID0gaGFybmVzcy5nZXRDTEkoKTtcblx0XHRjb25zdCBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG5cdFx0Ly8gUmVnaXN0ZXIgdGVzdCBjb21tYW5kc1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgMTAwOyBpKyspIHtcblx0XHRcdGNsaS5yZWdpc3Rlcih7XG5cdFx0XHRcdG5hbWU6IGB0ZXN0LSR7aX1gLFxuXHRcdFx0XHRhY3Rpb246ICgpID0+IHt9LFxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cdFx0Y29uc3QgcmVnaXN0cmF0aW9uVGltZSA9IGVuZCAtIHN0YXJ0O1xuXHRcdGFzc2VydChcblx0XHRcdHJlZ2lzdHJhdGlvblRpbWUgPCA1MCxcblx0XHRcdGBSZWdpc3RyYXRpb24gdGltZSAoJHtyZWdpc3RyYXRpb25UaW1lfW1zKSBleGNlZWRzIDUwbXMgdGhyZXNob2xkYCxcblx0XHQpO1xuXHR9KTtcblxuXHRhd2FpdCBoYXJuZXNzLmNsZWFudXAoKTtcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLG9DQUFvQztBQUNwQyxTQUFTLFdBQVcsUUFBUSwyQkFBMkI7QUFDdkQsU0FBUyxNQUFNLFFBQXNCLGNBQWM7QUFFbkQsS0FBSyxJQUFJLENBQUMsNkJBQTZCLE9BQU87RUFDN0MsTUFBTSxVQUFVLElBQUk7RUFFcEIsTUFBTSxFQUFFLElBQUksQ0FBQyx5QkFBeUI7SUFDckMsTUFBTSxRQUFRLFlBQVksR0FBRztJQUM3QixNQUFNLE1BQU0sUUFBUSxNQUFNO0lBQzFCLE1BQU0sTUFBTSxZQUFZLEdBQUc7SUFFM0IsTUFBTSxjQUFjLE1BQU07SUFDMUIsT0FDQyxjQUFjLEtBQ2QsQ0FBQyxjQUFjLEVBQUUsWUFBWSwyQkFBMkIsQ0FBQztFQUUzRDtFQUVBLE1BQU0sRUFBRSxJQUFJLENBQUMsMENBQTBDO0lBQ3RELE1BQU0sTUFBTSxRQUFRLE1BQU07SUFDMUIsTUFBTSxRQUFRLFlBQVksR0FBRztJQUU3Qix5QkFBeUI7SUFDekIsSUFBSyxJQUFJLElBQUksR0FBRyxJQUFJLEtBQUssSUFBSztNQUM3QixJQUFJLFFBQVEsQ0FBQztRQUNaLE1BQU0sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDO1FBQ2pCLFFBQVEsS0FBTztNQUNoQjtJQUNEO0lBRUEsTUFBTSxNQUFNLFlBQVksR0FBRztJQUMzQixNQUFNLG1CQUFtQixNQUFNO0lBQy9CLE9BQ0MsbUJBQW1CLElBQ25CLENBQUMsbUJBQW1CLEVBQUUsaUJBQWlCLDBCQUEwQixDQUFDO0VBRXBFO0VBRUEsTUFBTSxRQUFRLE9BQU87QUFDdEIifQ==
// denoCacheMetadata=1073483014304061437,16165817995215870781