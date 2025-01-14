import { bgGreen, bgWhite, stripColor, writeAllSync } from "./deps.ts";
import { prettyTime } from "./time.ts";
export { MultiProgressBar } from "./multi.ts";
const hasStdout = Deno.stdout;
var Direction;
export default class ProgressBar {
  title;
  total;
  width;
  complete;
  preciseBar;
  incomplete;
  clear;
  interval;
  display;
  prettyTime;
  isCompleted = false;
  lastStr = "";
  lastStrLen = 0;
  start = Date.now();
  lastRenderTime = 0;
  encoder = new TextEncoder();
  // Note from @bjesuiter: This MUST be a Lamda function compared to a class member function,
  // otherwise it will leak async ops in `deno test`
  // Deno Version: 1.27.1
  signalListener = ()=>{
    this.end();
    Deno.exit();
  };
  /**
   * Title, total, complete, incomplete, can also be set or changed in the render method
   *
   * - title Progress bar title, default: ''
   * - total total number of ticks to complete,
   * - width the displayed width of the progress, default: 50
   * - complete completion character, default: colors.bgGreen(' '), can use any string
   * - incomplete incomplete character, default: colors.bgWhite(' '), can use any string
   * - clear  clear the bar on completion, default: false
   * - interval  minimum time between updates in milliseconds, default: 16
   * - display  What is displayed and display order, default: ':title :percent :bar :time :completed/:total'
   * - prettyTime Whether to pretty print time and eta
   */ constructor({ title = "", total, width = 50, complete = bgGreen(" "), preciseBar = [], incomplete = bgWhite(" "), clear = false, interval = 16, display, prettyTime = false } = {}){
    this.title = title;
    this.total = total;
    this.width = width;
    this.complete = complete;
    this.preciseBar = preciseBar.concat(complete);
    this.incomplete = incomplete;
    this.clear = clear;
    this.interval = interval;
    this.display = display ?? ":title :percent :bar :time :completed/:total :text";
    this.prettyTime = prettyTime;
    Deno.addSignalListener("SIGINT", this.signalListener);
  }
  /**
   * "render" the progress bar
   *
   * - `completed` completed value
   * - `options` optional parameters
   *   - `title` progress bar title
   *   - `total` total number of ticks to complete
   *   - `text` optional, custom text, default: ''
   *   - `complete` completion character, If you want to change at a certain moment. For example, it turns red at 20%
   *   - `incomplete` incomplete character, If you want to change at a certain moment. For example, it turns red at 20%
   *   - `prettyTimeOptions` prettyTime options
   */ render(completed, options = {}) {
    if (this.isCompleted || !hasStdout) return;
    if (completed < 0) {
      throw new Error(`completed must greater than or equal to 0`);
    }
    const total = options.total ?? this.total ?? 100;
    const now = Date.now();
    const ms = now - this.lastRenderTime;
    if (ms < this.interval && completed < total) return;
    this.lastRenderTime = now;
    const time = this.prettyTime ? prettyTime(now - this.start, options.prettyTimeOptions) : ((now - this.start) / 1000).toFixed(1) + "s";
    const msEta = completed >= total ? 0 : (total / completed - 1) * (now - this.start);
    const eta = completed == 0 ? "-" : this.prettyTime ? prettyTime(msEta, options.prettyTimeOptions) : (msEta / 1000).toFixed(1) + "s";
    const percent = (completed / total * 100).toFixed(2) + "%";
    // :title :percent :bar :time :completed/:total
    let str = this.display.replace(":title", options.title ?? this.title).replace(":time", time).replace(":text", options.text ?? "").replace(":eta", eta).replace(":percent", percent).replace(":completed", completed + "").replace(":total", total + "");
    // compute the available space (non-zero) for the bar
    const availableSpace = Math.max(0, this.ttyColumns - str.replace(":bar", "").length);
    const width = Math.min(this.width, availableSpace);
    const finished = completed >= total;
    const preciseBar = options.preciseBar ?? this.preciseBar;
    const precision = preciseBar.length > 1;
    // :bar
    const completeLength = width * completed / total;
    const roundedCompleteLength = Math.floor(completeLength);
    let precise = "";
    if (precision) {
      const preciseLength = completeLength - roundedCompleteLength;
      precise = finished ? "" : preciseBar[Math.floor(preciseBar.length * preciseLength)];
    }
    const complete = new Array(roundedCompleteLength).fill(options.complete ?? this.complete).join("");
    const incomplete = new Array(Math.max(width - roundedCompleteLength - (precision ? 1 : 0), 0)).fill(options.incomplete ?? this.incomplete).join("");
    str = str.replace(":bar", complete + precise + incomplete);
    if (str !== this.lastStr) {
      const strLen = stripColor(str).length;
      if (strLen < this.lastStrLen) {
        str += " ".repeat(this.lastStrLen - strLen);
      }
      this.write(str);
      this.lastStr = str;
      this.lastStrLen = strLen;
    }
    if (finished) this.end();
  }
  /**
   * end: end a progress bar.
   * No need to call in most cases, unless you want to end before 100%
   */ end() {
    Deno.removeSignalListener("SIGINT", this.signalListener);
    this.isCompleted = true;
    if (this.clear) {
      this.stdoutWrite("\r");
      this.clearLine();
    } else {
      this.breakLine();
    }
    this.showCursor();
  }
  /**
   * interrupt the progress bar and write a message above it
   *
   * @param message The message to write
   */ console(message) {
    this.clearLine();
    this.write(`${message}`);
    this.breakLine();
    this.write(this.lastStr);
  }
  write(msg) {
    msg = `\r${msg}\x1b[?25l`;
    this.stdoutWrite(msg);
  }
  get ttyColumns() {
    if (!Deno.isatty(Deno.stdout.rid)) return 100;
    return Deno.consoleSize().columns;
  }
  breakLine() {
    this.stdoutWrite("\n");
  }
  stdoutWrite(msg) {
    writeAllSync(Deno.stdout, this.encoder.encode(msg));
  }
  clearLine(direction = 2) {
    switch(direction){
      case 2:
        this.stdoutWrite("\x1b[2K");
        break;
      case 0:
        this.stdoutWrite("\x1b[1K");
        break;
      case 1:
        this.stdoutWrite("\x1b[0K");
        break;
    }
  }
  showCursor() {
    this.stdoutWrite("\x1b[?25h");
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvcHJvZ3Jlc3NAdjEuMy44L21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBiZ0dyZWVuLCBiZ1doaXRlLCBzdHJpcENvbG9yLCB3cml0ZUFsbFN5bmMgfSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBwcmV0dHlUaW1lLCBwcmV0dHlUaW1lT3B0aW9ucyB9IGZyb20gXCIuL3RpbWUudHNcIjtcbmV4cG9ydCB7IE11bHRpUHJvZ3Jlc3NCYXIgfSBmcm9tIFwiLi9tdWx0aS50c1wiO1xuXG5jb25zdCBoYXNTdGRvdXQgPSBEZW5vLnN0ZG91dDtcblxuY29uc3QgZW51bSBEaXJlY3Rpb24ge1xuICBsZWZ0LFxuICByaWdodCxcbiAgYWxsLFxufVxuXG5pbnRlcmZhY2UgY29uc3RydWN0b3JPcHRpb25zIHtcbiAgdGl0bGU/OiBzdHJpbmc7XG4gIHRvdGFsPzogbnVtYmVyO1xuICB3aWR0aD86IG51bWJlcjtcbiAgY29tcGxldGU/OiBzdHJpbmc7XG4gIHByZWNpc2VCYXI/OiBzdHJpbmdbXTtcbiAgaW5jb21wbGV0ZT86IHN0cmluZztcbiAgY2xlYXI/OiBib29sZWFuO1xuICBpbnRlcnZhbD86IG51bWJlcjtcbiAgZGlzcGxheT86IHN0cmluZztcbiAgcHJldHR5VGltZT86IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSByZW5kZXJPcHRpb25zIHtcbiAgdGl0bGU/OiBzdHJpbmc7XG4gIHRvdGFsPzogbnVtYmVyO1xuICB0ZXh0Pzogc3RyaW5nO1xuICBjb21wbGV0ZT86IHN0cmluZztcbiAgcHJlY2lzZUJhcj86IHN0cmluZ1tdO1xuICBpbmNvbXBsZXRlPzogc3RyaW5nO1xuICBwcmV0dHlUaW1lT3B0aW9ucz86IHByZXR0eVRpbWVPcHRpb25zO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcm9ncmVzc0JhciB7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHRvdGFsPzogbnVtYmVyO1xuICB3aWR0aDogbnVtYmVyO1xuICBjb21wbGV0ZTogc3RyaW5nO1xuICBwcmVjaXNlQmFyOiBzdHJpbmdbXTtcbiAgaW5jb21wbGV0ZTogc3RyaW5nO1xuICBjbGVhcjogYm9vbGVhbjtcbiAgaW50ZXJ2YWw6IG51bWJlcjtcbiAgZGlzcGxheTogc3RyaW5nO1xuICBwcmV0dHlUaW1lOiBib29sZWFuO1xuXG4gIHByaXZhdGUgaXNDb21wbGV0ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBsYXN0U3RyID0gXCJcIjtcbiAgcHJpdmF0ZSBsYXN0U3RyTGVuID0gMDtcbiAgcHJpdmF0ZSBzdGFydCA9IERhdGUubm93KCk7XG4gIHByaXZhdGUgbGFzdFJlbmRlclRpbWUgPSAwO1xuICBwcml2YXRlIGVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcblxuICAvLyBOb3RlIGZyb20gQGJqZXN1aXRlcjogVGhpcyBNVVNUIGJlIGEgTGFtZGEgZnVuY3Rpb24gY29tcGFyZWQgdG8gYSBjbGFzcyBtZW1iZXIgZnVuY3Rpb24sXG4gIC8vIG90aGVyd2lzZSBpdCB3aWxsIGxlYWsgYXN5bmMgb3BzIGluIGBkZW5vIHRlc3RgXG4gIC8vIERlbm8gVmVyc2lvbjogMS4yNy4xXG4gIHByaXZhdGUgc2lnbmFsTGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgdGhpcy5lbmQoKTtcbiAgICBEZW5vLmV4aXQoKTtcbiAgfTtcblxuICAvKipcbiAgICogVGl0bGUsIHRvdGFsLCBjb21wbGV0ZSwgaW5jb21wbGV0ZSwgY2FuIGFsc28gYmUgc2V0IG9yIGNoYW5nZWQgaW4gdGhlIHJlbmRlciBtZXRob2RcbiAgICpcbiAgICogLSB0aXRsZSBQcm9ncmVzcyBiYXIgdGl0bGUsIGRlZmF1bHQ6ICcnXG4gICAqIC0gdG90YWwgdG90YWwgbnVtYmVyIG9mIHRpY2tzIHRvIGNvbXBsZXRlLFxuICAgKiAtIHdpZHRoIHRoZSBkaXNwbGF5ZWQgd2lkdGggb2YgdGhlIHByb2dyZXNzLCBkZWZhdWx0OiA1MFxuICAgKiAtIGNvbXBsZXRlIGNvbXBsZXRpb24gY2hhcmFjdGVyLCBkZWZhdWx0OiBjb2xvcnMuYmdHcmVlbignICcpLCBjYW4gdXNlIGFueSBzdHJpbmdcbiAgICogLSBpbmNvbXBsZXRlIGluY29tcGxldGUgY2hhcmFjdGVyLCBkZWZhdWx0OiBjb2xvcnMuYmdXaGl0ZSgnICcpLCBjYW4gdXNlIGFueSBzdHJpbmdcbiAgICogLSBjbGVhciAgY2xlYXIgdGhlIGJhciBvbiBjb21wbGV0aW9uLCBkZWZhdWx0OiBmYWxzZVxuICAgKiAtIGludGVydmFsICBtaW5pbXVtIHRpbWUgYmV0d2VlbiB1cGRhdGVzIGluIG1pbGxpc2Vjb25kcywgZGVmYXVsdDogMTZcbiAgICogLSBkaXNwbGF5ICBXaGF0IGlzIGRpc3BsYXllZCBhbmQgZGlzcGxheSBvcmRlciwgZGVmYXVsdDogJzp0aXRsZSA6cGVyY2VudCA6YmFyIDp0aW1lIDpjb21wbGV0ZWQvOnRvdGFsJ1xuICAgKiAtIHByZXR0eVRpbWUgV2hldGhlciB0byBwcmV0dHkgcHJpbnQgdGltZSBhbmQgZXRhXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICB7XG4gICAgICB0aXRsZSA9IFwiXCIsXG4gICAgICB0b3RhbCxcbiAgICAgIHdpZHRoID0gNTAsXG4gICAgICBjb21wbGV0ZSA9IGJnR3JlZW4oXCIgXCIpLFxuICAgICAgcHJlY2lzZUJhciA9IFtdLFxuICAgICAgaW5jb21wbGV0ZSA9IGJnV2hpdGUoXCIgXCIpLFxuICAgICAgY2xlYXIgPSBmYWxzZSxcbiAgICAgIGludGVydmFsID0gMTYsXG4gICAgICBkaXNwbGF5LFxuICAgICAgcHJldHR5VGltZSA9IGZhbHNlLFxuICAgIH06IGNvbnN0cnVjdG9yT3B0aW9ucyA9IHt9LFxuICApIHtcbiAgICB0aGlzLnRpdGxlID0gdGl0bGU7XG4gICAgdGhpcy50b3RhbCA9IHRvdGFsO1xuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLmNvbXBsZXRlID0gY29tcGxldGU7XG4gICAgdGhpcy5wcmVjaXNlQmFyID0gcHJlY2lzZUJhci5jb25jYXQoY29tcGxldGUpO1xuICAgIHRoaXMuaW5jb21wbGV0ZSA9IGluY29tcGxldGU7XG4gICAgdGhpcy5jbGVhciA9IGNsZWFyO1xuICAgIHRoaXMuaW50ZXJ2YWwgPSBpbnRlcnZhbDtcbiAgICB0aGlzLmRpc3BsYXkgPSBkaXNwbGF5ID8/XG4gICAgICBcIjp0aXRsZSA6cGVyY2VudCA6YmFyIDp0aW1lIDpjb21wbGV0ZWQvOnRvdGFsIDp0ZXh0XCI7XG4gICAgdGhpcy5wcmV0dHlUaW1lID0gcHJldHR5VGltZTtcbiAgICBEZW5vLmFkZFNpZ25hbExpc3RlbmVyKFwiU0lHSU5UXCIsIHRoaXMuc2lnbmFsTGlzdGVuZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFwicmVuZGVyXCIgdGhlIHByb2dyZXNzIGJhclxuICAgKlxuICAgKiAtIGBjb21wbGV0ZWRgIGNvbXBsZXRlZCB2YWx1ZVxuICAgKiAtIGBvcHRpb25zYCBvcHRpb25hbCBwYXJhbWV0ZXJzXG4gICAqICAgLSBgdGl0bGVgIHByb2dyZXNzIGJhciB0aXRsZVxuICAgKiAgIC0gYHRvdGFsYCB0b3RhbCBudW1iZXIgb2YgdGlja3MgdG8gY29tcGxldGVcbiAgICogICAtIGB0ZXh0YCBvcHRpb25hbCwgY3VzdG9tIHRleHQsIGRlZmF1bHQ6ICcnXG4gICAqICAgLSBgY29tcGxldGVgIGNvbXBsZXRpb24gY2hhcmFjdGVyLCBJZiB5b3Ugd2FudCB0byBjaGFuZ2UgYXQgYSBjZXJ0YWluIG1vbWVudC4gRm9yIGV4YW1wbGUsIGl0IHR1cm5zIHJlZCBhdCAyMCVcbiAgICogICAtIGBpbmNvbXBsZXRlYCBpbmNvbXBsZXRlIGNoYXJhY3RlciwgSWYgeW91IHdhbnQgdG8gY2hhbmdlIGF0IGEgY2VydGFpbiBtb21lbnQuIEZvciBleGFtcGxlLCBpdCB0dXJucyByZWQgYXQgMjAlXG4gICAqICAgLSBgcHJldHR5VGltZU9wdGlvbnNgIHByZXR0eVRpbWUgb3B0aW9uc1xuICAgKi9cbiAgcmVuZGVyKGNvbXBsZXRlZDogbnVtYmVyLCBvcHRpb25zOiByZW5kZXJPcHRpb25zID0ge30pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5pc0NvbXBsZXRlZCB8fCAhaGFzU3Rkb3V0KSByZXR1cm47XG5cbiAgICBpZiAoY29tcGxldGVkIDwgMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb21wbGV0ZWQgbXVzdCBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gMGApO1xuICAgIH1cblxuICAgIGNvbnN0IHRvdGFsID0gb3B0aW9ucy50b3RhbCA/PyB0aGlzLnRvdGFsID8/IDEwMDtcbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IG1zID0gbm93IC0gdGhpcy5sYXN0UmVuZGVyVGltZTtcbiAgICBpZiAobXMgPCB0aGlzLmludGVydmFsICYmIGNvbXBsZXRlZCA8IHRvdGFsKSByZXR1cm47XG5cbiAgICB0aGlzLmxhc3RSZW5kZXJUaW1lID0gbm93O1xuICAgIGNvbnN0IHRpbWUgPSB0aGlzLnByZXR0eVRpbWVcbiAgICAgID8gcHJldHR5VGltZShub3cgLSB0aGlzLnN0YXJ0LCBvcHRpb25zLnByZXR0eVRpbWVPcHRpb25zKVxuICAgICAgOiAoKG5vdyAtIHRoaXMuc3RhcnQpIC8gMTAwMCkudG9GaXhlZCgxKSArIFwic1wiO1xuICAgIGNvbnN0IG1zRXRhID0gY29tcGxldGVkID49IHRvdGFsXG4gICAgICA/IDBcbiAgICAgIDogKHRvdGFsIC8gY29tcGxldGVkIC0gMSkgKiAobm93IC0gdGhpcy5zdGFydCk7XG4gICAgY29uc3QgZXRhID0gY29tcGxldGVkID09IDBcbiAgICAgID8gXCItXCJcbiAgICAgIDogdGhpcy5wcmV0dHlUaW1lXG4gICAgICA/IHByZXR0eVRpbWUobXNFdGEsIG9wdGlvbnMucHJldHR5VGltZU9wdGlvbnMpXG4gICAgICA6IChtc0V0YSAvIDEwMDApLnRvRml4ZWQoMSkgK1xuICAgICAgICBcInNcIjtcblxuICAgIGNvbnN0IHBlcmNlbnQgPSAoKGNvbXBsZXRlZCAvIHRvdGFsKSAqIDEwMCkudG9GaXhlZCgyKSArIFwiJVwiO1xuXG4gICAgLy8gOnRpdGxlIDpwZXJjZW50IDpiYXIgOnRpbWUgOmNvbXBsZXRlZC86dG90YWxcbiAgICBsZXQgc3RyID0gdGhpcy5kaXNwbGF5XG4gICAgICAucmVwbGFjZShcIjp0aXRsZVwiLCBvcHRpb25zLnRpdGxlID8/IHRoaXMudGl0bGUpXG4gICAgICAucmVwbGFjZShcIjp0aW1lXCIsIHRpbWUpXG4gICAgICAucmVwbGFjZShcIjp0ZXh0XCIsIG9wdGlvbnMudGV4dCA/PyBcIlwiKVxuICAgICAgLnJlcGxhY2UoXCI6ZXRhXCIsIGV0YSlcbiAgICAgIC5yZXBsYWNlKFwiOnBlcmNlbnRcIiwgcGVyY2VudClcbiAgICAgIC5yZXBsYWNlKFwiOmNvbXBsZXRlZFwiLCBjb21wbGV0ZWQgKyBcIlwiKVxuICAgICAgLnJlcGxhY2UoXCI6dG90YWxcIiwgdG90YWwgKyBcIlwiKTtcblxuICAgIC8vIGNvbXB1dGUgdGhlIGF2YWlsYWJsZSBzcGFjZSAobm9uLXplcm8pIGZvciB0aGUgYmFyXG4gICAgY29uc3QgYXZhaWxhYmxlU3BhY2UgPSBNYXRoLm1heChcbiAgICAgIDAsXG4gICAgICB0aGlzLnR0eUNvbHVtbnMgLSBzdHIucmVwbGFjZShcIjpiYXJcIiwgXCJcIikubGVuZ3RoLFxuICAgICk7XG5cbiAgICBjb25zdCB3aWR0aCA9IE1hdGgubWluKHRoaXMud2lkdGgsIGF2YWlsYWJsZVNwYWNlKTtcbiAgICBjb25zdCBmaW5pc2hlZCA9IGNvbXBsZXRlZCA+PSB0b3RhbDtcblxuICAgIGNvbnN0IHByZWNpc2VCYXIgPSBvcHRpb25zLnByZWNpc2VCYXIgPz8gdGhpcy5wcmVjaXNlQmFyO1xuICAgIGNvbnN0IHByZWNpc2lvbiA9IHByZWNpc2VCYXIubGVuZ3RoID4gMTtcblxuICAgIC8vIDpiYXJcbiAgICBjb25zdCBjb21wbGV0ZUxlbmd0aCA9IHdpZHRoICogY29tcGxldGVkIC8gdG90YWw7XG4gICAgY29uc3Qgcm91bmRlZENvbXBsZXRlTGVuZ3RoID0gTWF0aC5mbG9vcihjb21wbGV0ZUxlbmd0aCk7XG5cbiAgICBsZXQgcHJlY2lzZSA9IFwiXCI7XG4gICAgaWYgKHByZWNpc2lvbikge1xuICAgICAgY29uc3QgcHJlY2lzZUxlbmd0aCA9IGNvbXBsZXRlTGVuZ3RoIC0gcm91bmRlZENvbXBsZXRlTGVuZ3RoO1xuICAgICAgcHJlY2lzZSA9IGZpbmlzaGVkXG4gICAgICAgID8gXCJcIlxuICAgICAgICA6IHByZWNpc2VCYXJbTWF0aC5mbG9vcihwcmVjaXNlQmFyLmxlbmd0aCAqIHByZWNpc2VMZW5ndGgpXTtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wbGV0ZSA9IG5ldyBBcnJheShyb3VuZGVkQ29tcGxldGVMZW5ndGgpLmZpbGwoXG4gICAgICBvcHRpb25zLmNvbXBsZXRlID8/IHRoaXMuY29tcGxldGUsXG4gICAgKS5qb2luKFwiXCIpO1xuICAgIGNvbnN0IGluY29tcGxldGUgPSBuZXcgQXJyYXkoXG4gICAgICBNYXRoLm1heCh3aWR0aCAtIHJvdW5kZWRDb21wbGV0ZUxlbmd0aCAtIChwcmVjaXNpb24gPyAxIDogMCksIDApLFxuICAgICkuZmlsbChvcHRpb25zLmluY29tcGxldGUgPz8gdGhpcy5pbmNvbXBsZXRlKS5qb2luKFwiXCIpO1xuXG4gICAgc3RyID0gc3RyLnJlcGxhY2UoXCI6YmFyXCIsIGNvbXBsZXRlICsgcHJlY2lzZSArIGluY29tcGxldGUpO1xuXG4gICAgaWYgKHN0ciAhPT0gdGhpcy5sYXN0U3RyKSB7XG4gICAgICBjb25zdCBzdHJMZW4gPSBzdHJpcENvbG9yKHN0cikubGVuZ3RoO1xuICAgICAgaWYgKHN0ckxlbiA8IHRoaXMubGFzdFN0ckxlbikge1xuICAgICAgICBzdHIgKz0gXCIgXCIucmVwZWF0KHRoaXMubGFzdFN0ckxlbiAtIHN0ckxlbik7XG4gICAgICB9XG4gICAgICB0aGlzLndyaXRlKHN0cik7XG4gICAgICB0aGlzLmxhc3RTdHIgPSBzdHI7XG4gICAgICB0aGlzLmxhc3RTdHJMZW4gPSBzdHJMZW47XG4gICAgfVxuXG4gICAgaWYgKGZpbmlzaGVkKSB0aGlzLmVuZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIGVuZDogZW5kIGEgcHJvZ3Jlc3MgYmFyLlxuICAgKiBObyBuZWVkIHRvIGNhbGwgaW4gbW9zdCBjYXNlcywgdW5sZXNzIHlvdSB3YW50IHRvIGVuZCBiZWZvcmUgMTAwJVxuICAgKi9cbiAgZW5kKCk6IHZvaWQge1xuICAgIERlbm8ucmVtb3ZlU2lnbmFsTGlzdGVuZXIoXCJTSUdJTlRcIiwgdGhpcy5zaWduYWxMaXN0ZW5lcik7XG4gICAgdGhpcy5pc0NvbXBsZXRlZCA9IHRydWU7XG4gICAgaWYgKHRoaXMuY2xlYXIpIHtcbiAgICAgIHRoaXMuc3Rkb3V0V3JpdGUoXCJcXHJcIik7XG4gICAgICB0aGlzLmNsZWFyTGluZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmJyZWFrTGluZSgpO1xuICAgIH1cbiAgICB0aGlzLnNob3dDdXJzb3IoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBpbnRlcnJ1cHQgdGhlIHByb2dyZXNzIGJhciBhbmQgd3JpdGUgYSBtZXNzYWdlIGFib3ZlIGl0XG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHdyaXRlXG4gICAqL1xuICBjb25zb2xlKG1lc3NhZ2U6IHN0cmluZyB8IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuY2xlYXJMaW5lKCk7XG4gICAgdGhpcy53cml0ZShgJHttZXNzYWdlfWApO1xuICAgIHRoaXMuYnJlYWtMaW5lKCk7XG4gICAgdGhpcy53cml0ZSh0aGlzLmxhc3RTdHIpO1xuICB9XG5cbiAgcHJpdmF0ZSB3cml0ZShtc2c6IHN0cmluZyk6IHZvaWQge1xuICAgIG1zZyA9IGBcXHIke21zZ31cXHgxYls/MjVsYDtcbiAgICB0aGlzLnN0ZG91dFdyaXRlKG1zZyk7XG4gIH1cblxuICBwcml2YXRlIGdldCB0dHlDb2x1bW5zKCk6IG51bWJlciB7XG4gICAgaWYgKCFEZW5vLmlzYXR0eShEZW5vLnN0ZG91dC5yaWQpKSByZXR1cm4gMTAwO1xuICAgIHJldHVybiBEZW5vLmNvbnNvbGVTaXplKCkuY29sdW1ucztcbiAgfVxuXG4gIHByaXZhdGUgYnJlYWtMaW5lKCkge1xuICAgIHRoaXMuc3Rkb3V0V3JpdGUoXCJcXG5cIik7XG4gIH1cblxuICBwcml2YXRlIHN0ZG91dFdyaXRlKG1zZzogc3RyaW5nKSB7XG4gICAgd3JpdGVBbGxTeW5jKERlbm8uc3Rkb3V0LCB0aGlzLmVuY29kZXIuZW5jb2RlKG1zZykpO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGVhckxpbmUoZGlyZWN0aW9uOiBEaXJlY3Rpb24gPSBEaXJlY3Rpb24uYWxsKTogdm9pZCB7XG4gICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgIGNhc2UgRGlyZWN0aW9uLmFsbDpcbiAgICAgICAgdGhpcy5zdGRvdXRXcml0ZShcIlxceDFiWzJLXCIpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRGlyZWN0aW9uLmxlZnQ6XG4gICAgICAgIHRoaXMuc3Rkb3V0V3JpdGUoXCJcXHgxYlsxS1wiKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIERpcmVjdGlvbi5yaWdodDpcbiAgICAgICAgdGhpcy5zdGRvdXRXcml0ZShcIlxceDFiWzBLXCIpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNob3dDdXJzb3IoKTogdm9pZCB7XG4gICAgdGhpcy5zdGRvdXRXcml0ZShcIlxceDFiWz8yNWhcIik7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLE9BQU8sRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLFlBQVksUUFBUSxZQUFZO0FBQ3ZFLFNBQVMsVUFBVSxRQUEyQixZQUFZO0FBQzFELFNBQVMsZ0JBQWdCLFFBQVEsYUFBYTtBQUU5QyxNQUFNLFlBQVksS0FBSyxNQUFNOztBQStCN0IsZUFBZSxNQUFNO0VBQ25CLE1BQWM7RUFDZCxNQUFlO0VBQ2YsTUFBYztFQUNkLFNBQWlCO0VBQ2pCLFdBQXFCO0VB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
// denoCacheMetadata=2020898607607108761,3022723943707537556