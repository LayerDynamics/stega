// tests/utils/test_harness.ts
import { CLI } from "../../src/core.ts";
import { MockLogger } from "./mock_logger.ts";
export class TestHarness {
  contexts = [];
  cli;
  mockLogger;
  constructor(){
    this.mockLogger = new MockLogger();
    this.cli = new CLI(undefined, true, true, this.mockLogger);
  }
  getCLI() {
    return this.cli;
  }
  getLogger() {
    return this.mockLogger;
  }
  async createTempDir() {
    const dir = await Deno.makeTempDir();
    this.contexts.push({
      cleanup: async ()=>{
        await Deno.remove(dir, {
          recursive: true
        });
      }
    });
    return dir;
  }
  async createTempFile(content) {
    const file = await Deno.makeTempFile();
    await Deno.writeTextFile(file, content);
    this.contexts.push({
      cleanup: async ()=>{
        await Deno.remove(file);
      }
    });
    return file;
  }
  async cleanup() {
    for (const context of this.contexts.reverse()){
      await context.cleanup();
    }
    this.contexts = [];
  }
  mockCommand(name, action) {
    return {
      name,
      action
    };
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy91dGlscy90ZXN0X2hhcm5lc3MudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGVzdHMvdXRpbHMvdGVzdF9oYXJuZXNzLnRzXG5pbXBvcnQgeyBDTEkgfSBmcm9tIFwiLi4vLi4vc3JjL2NvcmUudHNcIjtcbmltcG9ydCB7IENvbW1hbmQgfSBmcm9tIFwiLi4vLi4vc3JjL2NvbW1hbmQudHNcIjtcbmltcG9ydCB7IElMb2dnZXIgfSBmcm9tIFwiLi4vLi4vc3JjL2xvZ2dlcl9pbnRlcmZhY2UudHNcIjtcbmltcG9ydCB7IE1vY2tMb2dnZXIgfSBmcm9tIFwiLi9tb2NrX2xvZ2dlci50c1wiO1xuXG5pbnRlcmZhY2UgVGVzdENvbnRleHQge1xuXHRjbGVhbnVwOiAoKSA9PiBQcm9taXNlPHZvaWQ+O1xufVxuXG5leHBvcnQgY2xhc3MgVGVzdEhhcm5lc3Mge1xuXHRwcml2YXRlIGNvbnRleHRzOiBUZXN0Q29udGV4dFtdID0gW107XG5cdHByaXZhdGUgY2xpOiBDTEk7XG5cdHByaXZhdGUgbW9ja0xvZ2dlcjogTW9ja0xvZ2dlcjtcblxuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLm1vY2tMb2dnZXIgPSBuZXcgTW9ja0xvZ2dlcigpO1xuXHRcdHRoaXMuY2xpID0gbmV3IENMSSh1bmRlZmluZWQsIHRydWUsIHRydWUsIHRoaXMubW9ja0xvZ2dlcik7XG5cdH1cblxuXHRwdWJsaWMgZ2V0Q0xJKCk6IENMSSB7XG5cdFx0cmV0dXJuIHRoaXMuY2xpO1xuXHR9XG5cblx0cHVibGljIGdldExvZ2dlcigpOiBNb2NrTG9nZ2VyIHtcblx0XHRyZXR1cm4gdGhpcy5tb2NrTG9nZ2VyO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIGNyZWF0ZVRlbXBEaXIoKTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRjb25zdCBkaXIgPSBhd2FpdCBEZW5vLm1ha2VUZW1wRGlyKCk7XG5cdFx0dGhpcy5jb250ZXh0cy5wdXNoKHtcblx0XHRcdGNsZWFudXA6IGFzeW5jICgpID0+IHtcblx0XHRcdFx0YXdhaXQgRGVuby5yZW1vdmUoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblx0XHRcdH0sXG5cdFx0fSk7XG5cdFx0cmV0dXJuIGRpcjtcblx0fVxuXG5cdHB1YmxpYyBhc3luYyBjcmVhdGVUZW1wRmlsZShjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRcdGNvbnN0IGZpbGUgPSBhd2FpdCBEZW5vLm1ha2VUZW1wRmlsZSgpO1xuXHRcdGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShmaWxlLCBjb250ZW50KTtcblx0XHR0aGlzLmNvbnRleHRzLnB1c2goe1xuXHRcdFx0Y2xlYW51cDogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRhd2FpdCBEZW5vLnJlbW92ZShmaWxlKTtcblx0XHRcdH0sXG5cdFx0fSk7XG5cdFx0cmV0dXJuIGZpbGU7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgY2xlYW51cCgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRmb3IgKGNvbnN0IGNvbnRleHQgb2YgdGhpcy5jb250ZXh0cy5yZXZlcnNlKCkpIHtcblx0XHRcdGF3YWl0IGNvbnRleHQuY2xlYW51cCgpO1xuXHRcdH1cblx0XHR0aGlzLmNvbnRleHRzID0gW107XG5cdH1cblxuXHRwdWJsaWMgbW9ja0NvbW1hbmQobmFtZTogc3RyaW5nLCBhY3Rpb246IChhcmdzOiB1bmtub3duKSA9PiB2b2lkKTogQ29tbWFuZCB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG5hbWUsXG5cdFx0XHRhY3Rpb24sXG5cdFx0fTtcblx0fVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDhCQUE4QjtBQUM5QixTQUFTLEdBQUcsUUFBUSxvQkFBb0I7QUFHeEMsU0FBUyxVQUFVLFFBQVEsbUJBQW1CO0FBTTlDLE9BQU8sTUFBTTtFQUNKLFdBQTBCLEVBQUUsQ0FBQztFQUM3QixJQUFTO0VBQ1QsV0FBdUI7RUFFL0IsYUFBYztJQUNiLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSTtJQUN0QixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksSUFBSSxXQUFXLE1BQU0sTUFBTSxJQUFJLENBQUMsVUFBVTtFQUMxRDtFQUVPLFNBQWM7SUFDcEIsT0FBTyxJQUFJLENBQUMsR0FBRztFQUNoQjtFQUVPLFlBQXdCO0lBQzlCLE9BQU8sSUFBSSxDQUFDLFVBQVU7RUFDdkI7RUFFQSxNQUFhLGdCQUFpQztJQUM3QyxNQUFNLE1BQU0sTUFBTSxLQUFLLFdBQVc7SUFDbEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7TUFDbEIsU0FBUztRQUNSLE1BQU0sS0FBSyxNQUFNLENBQUMsS0FBSztVQUFFLFdBQVc7UUFBSztNQUMxQztJQUNEO0lBQ0EsT0FBTztFQUNSO0VBRUEsTUFBYSxlQUFlLE9BQWUsRUFBbUI7SUFDN0QsTUFBTSxPQUFPLE1BQU0sS0FBSyxZQUFZO0lBQ3BDLE1BQU0sS0FBSyxhQUFhLENBQUMsTUFBTTtJQUMvQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztNQUNsQixTQUFTO1FBQ1IsTUFBTSxLQUFLLE1BQU0sQ0FBQztNQUNuQjtJQUNEO0lBQ0EsT0FBTztFQUNSO0VBRUEsTUFBYSxVQUF5QjtJQUNyQyxLQUFLLE1BQU0sV0FBVyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sR0FBSTtNQUM5QyxNQUFNLFFBQVEsT0FBTztJQUN0QjtJQUNBLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRTtFQUNuQjtFQUVPLFlBQVksSUFBWSxFQUFFLE1BQStCLEVBQVc7SUFDMUUsT0FBTztNQUNOO01BQ0E7SUFDRDtFQUNEO0FBQ0QifQ==
// denoCacheMetadata=16860718186776921749,2905237573996102809