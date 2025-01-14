import { bgGreen, bgWhite, stripColor, writeAllSync } from "./deps.ts";
import { prettyTime } from "./time.ts";
const hasStdout = Deno.stdout;
export class MultiProgressBar {
  width;
  complete;
  incomplete;
  clear;
  interval;
  display;
  prettyTime;
  #end = false;
  #startIndex = 0;
  #lastRows = 0;
  #bars = [];
  lastStr = "";
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
   * - width the displayed width of the progress, default: 50
   * - complete completion character, default: colors.bgGreen(' '), can use any string
   * - incomplete incomplete character, default: colors.bgWhite(' '), can use any string
   * - clear  clear the bar on completion, default: false
   * - interval  minimum time between updates in milliseconds, default: 16
   * - display  What is displayed and display order, default: ':bar :text :percent :time :completed/:total'
   * - prettyTime Whether to pretty print time and eta
   */ constructor({ title = "", width = 50, complete = bgGreen(" "), incomplete = bgWhite(" "), clear = false, interval, display, prettyTime = false } = {}){
    if (title != "") {
      this.#bars.push({
        str: title
      });
      this.#startIndex = 1;
    }
    this.width = width;
    this.complete = complete;
    this.incomplete = incomplete;
    this.clear = clear;
    this.interval = interval ?? 16;
    this.display = display ?? ":bar :text :percent :time :completed/:total";
    this.prettyTime = prettyTime;
    Deno.addSignalListener("SIGINT", this.signalListener);
  }
  /**
   * "render" the progress bar
   *
   * - `bars` progress bars
   *   - `completed` completed value
   *   - `total` optional, total number of ticks to complete, default: 100
   *   - `text` optional, text displayed per ProgressBar, default: ''
   *   - `complete` - optional, completion character
   *   - `incomplete` - optional, incomplete character
   *   - `prettyTimeOptions` - prettyTime options
   */ render(bars) {
    if (this.#end || !hasStdout) return;
    const now = Date.now();
    const ms = now - this.lastRenderTime;
    this.lastRenderTime = now;
    let end = true;
    let index = this.#startIndex;
    for (const { completed, total = 100, text = "", ...options } of bars){
      if (completed < 0) {
        throw new Error(`completed must greater than or equal to 0`);
      }
      if (!Number.isInteger(total)) throw new Error(`total must be 'number'`);
      if (this.#bars[index] && this.#bars[index].end) {
        index++;
        continue;
      }
      end = false;
      const percent = (completed / total * 100).toFixed(2) + "%";
      const time = this.prettyTime ? prettyTime(now - this.start, options.prettyTimeOptions) : ((now - this.start) / 1000).toFixed(1) + "s";
      const msEta = completed >= total ? 0 : (total / completed - 1) * (now - this.start);
      const eta = completed == 0 ? "-" : this.prettyTime ? prettyTime(msEta, options.prettyTimeOptions) : (msEta / 1000).toFixed(1) + "s";
      // :bar :text :percent :time :completed/:total
      let str = this.display.replace(":text", text).replace(":time", time).replace(":eta", eta).replace(":percent", percent).replace(":completed", completed + "").replace(":total", total + "");
      // compute the available space (non-zero) for the bar
      const availableSpace = Math.max(0, this.ttyColumns - str.replace(":bar", "").length);
      const width = Math.min(this.width, availableSpace);
      // :bar
      const completeLength = Math.round(width * completed / total);
      const complete = new Array(completeLength).fill(options.complete ?? this.complete).join("");
      const incomplete = new Array(width - completeLength).fill(options.incomplete ?? this.incomplete).join("");
      str = str.replace(":bar", complete + incomplete);
      const strLen = stripColor(str).length;
      if (this.#bars[index] && str != this.#bars[index].str) {
        const lastStrLen = this.#bars[index].strLen;
        if (strLen < lastStrLen) {
          str += " ".repeat(lastStrLen - strLen);
        }
      }
      this.#bars[index++] = {
        str,
        strLen,
        end: completed >= total
      };
    }
    if (ms < this.interval && end == false) return;
    const renderStr = this.#bars.map((v)=>v.str).join("\n");
    if (renderStr !== this.lastStr) {
      this.resetScreen();
      this.write(renderStr);
      this.lastStr = renderStr;
      this.#lastRows = this.#bars.length;
    }
    if (end) this.end();
  }
  /**
   * end: end a progress bar.
   * No need to call in most cases, unless you want to end before 100%
   */ end() {
    Deno.removeSignalListener("SIGINT", this.signalListener);
    this.#end = true;
    if (this.clear) {
      this.resetScreen();
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
    this.resetScreen();
    this.write(`${message}`);
    this.breakLine();
    this.write(this.lastStr);
  }
  write(msg) {
    msg = `${msg}\x1b[?25l`;
    this.stdoutWrite(msg);
  }
  resetScreen() {
    if (this.#lastRows > 0) {
      this.stdoutWrite("\x1b[" + (this.#lastRows - 1) + "A\r\x1b[?0J");
    }
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
  showCursor() {
    this.stdoutWrite("\x1b[?25h");
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvcHJvZ3Jlc3NAdjEuMy44L211bHRpLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJnR3JlZW4sIGJnV2hpdGUsIHN0cmlwQ29sb3IsIHdyaXRlQWxsU3luYyB9IGZyb20gXCIuL2RlcHMudHNcIjtcbmltcG9ydCB7IHByZXR0eVRpbWUsIHByZXR0eVRpbWVPcHRpb25zIH0gZnJvbSBcIi4vdGltZS50c1wiO1xuXG5jb25zdCBoYXNTdGRvdXQgPSBEZW5vLnN0ZG91dDtcblxuaW50ZXJmYWNlIGNvbnN0cnVjdG9yT3B0aW9ucyB7XG4gIHRpdGxlPzogc3RyaW5nO1xuICB3aWR0aD86IG51bWJlcjtcbiAgY29tcGxldGU/OiBzdHJpbmc7XG4gIGluY29tcGxldGU/OiBzdHJpbmc7XG4gIGNsZWFyPzogYm9vbGVhbjtcbiAgaW50ZXJ2YWw/OiBudW1iZXI7XG4gIGRpc3BsYXk/OiBzdHJpbmc7XG4gIHByZXR0eVRpbWU/OiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgcmVuZGVyT3B0aW9ucyB7XG4gIGNvbXBsZXRlZDogbnVtYmVyO1xuICB0ZXh0Pzogc3RyaW5nO1xuICB0b3RhbD86IG51bWJlcjtcbiAgY29tcGxldGU/OiBzdHJpbmc7XG4gIGluY29tcGxldGU/OiBzdHJpbmc7XG4gIHByZXR0eVRpbWVPcHRpb25zPzogcHJldHR5VGltZU9wdGlvbnM7XG59XG5cbmludGVyZmFjZSBiYXIge1xuICBzdHI6IHN0cmluZztcbiAgc3RyTGVuPzogbnVtYmVyO1xuICBlbmQ/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgTXVsdGlQcm9ncmVzc0JhciB7XG4gIHdpZHRoOiBudW1iZXI7XG4gIGNvbXBsZXRlOiBzdHJpbmc7XG4gIGluY29tcGxldGU6IHN0cmluZztcbiAgY2xlYXI6IGJvb2xlYW47XG4gIGludGVydmFsOiBudW1iZXI7XG4gIGRpc3BsYXk6IHN0cmluZztcbiAgcHJldHR5VGltZTogYm9vbGVhbjtcblxuICAjZW5kID0gZmFsc2U7XG4gICNzdGFydEluZGV4ID0gMDtcbiAgI2xhc3RSb3dzID0gMDtcbiAgI2JhcnM6IGJhcltdID0gW107XG4gIHByaXZhdGUgbGFzdFN0ciA9IFwiXCI7XG4gIHByaXZhdGUgc3RhcnQgPSBEYXRlLm5vdygpO1xuICBwcml2YXRlIGxhc3RSZW5kZXJUaW1lID0gMDtcbiAgcHJpdmF0ZSBlbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG5cbiAgLy8gTm90ZSBmcm9tIEBiamVzdWl0ZXI6IFRoaXMgTVVTVCBiZSBhIExhbWRhIGZ1bmN0aW9uIGNvbXBhcmVkIHRvIGEgY2xhc3MgbWVtYmVyIGZ1bmN0aW9uLFxuICAvLyBvdGhlcndpc2UgaXQgd2lsbCBsZWFrIGFzeW5jIG9wcyBpbiBgZGVubyB0ZXN0YFxuICAvLyBEZW5vIFZlcnNpb246IDEuMjcuMVxuICBwcml2YXRlIHNpZ25hbExpc3RlbmVyID0gKCkgPT4ge1xuICAgIHRoaXMuZW5kKCk7XG4gICAgRGVuby5leGl0KCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFRpdGxlLCB0b3RhbCwgY29tcGxldGUsIGluY29tcGxldGUsIGNhbiBhbHNvIGJlIHNldCBvciBjaGFuZ2VkIGluIHRoZSByZW5kZXIgbWV0aG9kXG4gICAqXG4gICAqIC0gdGl0bGUgUHJvZ3Jlc3MgYmFyIHRpdGxlLCBkZWZhdWx0OiAnJ1xuICAgKiAtIHdpZHRoIHRoZSBkaXNwbGF5ZWQgd2lkdGggb2YgdGhlIHByb2dyZXNzLCBkZWZhdWx0OiA1MFxuICAgKiAtIGNvbXBsZXRlIGNvbXBsZXRpb24gY2hhcmFjdGVyLCBkZWZhdWx0OiBjb2xvcnMuYmdHcmVlbignICcpLCBjYW4gdXNlIGFueSBzdHJpbmdcbiAgICogLSBpbmNvbXBsZXRlIGluY29tcGxldGUgY2hhcmFjdGVyLCBkZWZhdWx0OiBjb2xvcnMuYmdXaGl0ZSgnICcpLCBjYW4gdXNlIGFueSBzdHJpbmdcbiAgICogLSBjbGVhciAgY2xlYXIgdGhlIGJhciBvbiBjb21wbGV0aW9uLCBkZWZhdWx0OiBmYWxzZVxuICAgKiAtIGludGVydmFsICBtaW5pbXVtIHRpbWUgYmV0d2VlbiB1cGRhdGVzIGluIG1pbGxpc2Vjb25kcywgZGVmYXVsdDogMTZcbiAgICogLSBkaXNwbGF5ICBXaGF0IGlzIGRpc3BsYXllZCBhbmQgZGlzcGxheSBvcmRlciwgZGVmYXVsdDogJzpiYXIgOnRleHQgOnBlcmNlbnQgOnRpbWUgOmNvbXBsZXRlZC86dG90YWwnXG4gICAqIC0gcHJldHR5VGltZSBXaGV0aGVyIHRvIHByZXR0eSBwcmludCB0aW1lIGFuZCBldGFcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHtcbiAgICAgIHRpdGxlID0gXCJcIixcbiAgICAgIHdpZHRoID0gNTAsXG4gICAgICBjb21wbGV0ZSA9IGJnR3JlZW4oXCIgXCIpLFxuICAgICAgaW5jb21wbGV0ZSA9IGJnV2hpdGUoXCIgXCIpLFxuICAgICAgY2xlYXIgPSBmYWxzZSxcbiAgICAgIGludGVydmFsLFxuICAgICAgZGlzcGxheSxcbiAgICAgIHByZXR0eVRpbWUgPSBmYWxzZSxcbiAgICB9OiBjb25zdHJ1Y3Rvck9wdGlvbnMgPSB7fSxcbiAgKSB7XG4gICAgaWYgKHRpdGxlICE9IFwiXCIpIHtcbiAgICAgIHRoaXMuI2JhcnMucHVzaCh7IHN0cjogdGl0bGUgfSk7XG4gICAgICB0aGlzLiNzdGFydEluZGV4ID0gMTtcbiAgICB9XG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuY29tcGxldGUgPSBjb21wbGV0ZTtcbiAgICB0aGlzLmluY29tcGxldGUgPSBpbmNvbXBsZXRlO1xuICAgIHRoaXMuY2xlYXIgPSBjbGVhcjtcbiAgICB0aGlzLmludGVydmFsID0gaW50ZXJ2YWwgPz8gMTY7XG4gICAgdGhpcy5kaXNwbGF5ID0gZGlzcGxheSA/PyBcIjpiYXIgOnRleHQgOnBlcmNlbnQgOnRpbWUgOmNvbXBsZXRlZC86dG90YWxcIjtcbiAgICB0aGlzLnByZXR0eVRpbWUgPSBwcmV0dHlUaW1lO1xuICAgIERlbm8uYWRkU2lnbmFsTGlzdGVuZXIoXCJTSUdJTlRcIiwgdGhpcy5zaWduYWxMaXN0ZW5lcik7XG4gIH1cblxuICAvKipcbiAgICogXCJyZW5kZXJcIiB0aGUgcHJvZ3Jlc3MgYmFyXG4gICAqXG4gICAqIC0gYGJhcnNgIHByb2dyZXNzIGJhcnNcbiAgICogICAtIGBjb21wbGV0ZWRgIGNvbXBsZXRlZCB2YWx1ZVxuICAgKiAgIC0gYHRvdGFsYCBvcHRpb25hbCwgdG90YWwgbnVtYmVyIG9mIHRpY2tzIHRvIGNvbXBsZXRlLCBkZWZhdWx0OiAxMDBcbiAgICogICAtIGB0ZXh0YCBvcHRpb25hbCwgdGV4dCBkaXNwbGF5ZWQgcGVyIFByb2dyZXNzQmFyLCBkZWZhdWx0OiAnJ1xuICAgKiAgIC0gYGNvbXBsZXRlYCAtIG9wdGlvbmFsLCBjb21wbGV0aW9uIGNoYXJhY3RlclxuICAgKiAgIC0gYGluY29tcGxldGVgIC0gb3B0aW9uYWwsIGluY29tcGxldGUgY2hhcmFjdGVyXG4gICAqICAgLSBgcHJldHR5VGltZU9wdGlvbnNgIC0gcHJldHR5VGltZSBvcHRpb25zXG4gICAqL1xuICByZW5kZXIoYmFyczogQXJyYXk8cmVuZGVyT3B0aW9ucz4pOiB2b2lkIHtcbiAgICBpZiAodGhpcy4jZW5kIHx8ICFoYXNTdGRvdXQpIHJldHVybjtcblxuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgY29uc3QgbXMgPSBub3cgLSB0aGlzLmxhc3RSZW5kZXJUaW1lO1xuICAgIHRoaXMubGFzdFJlbmRlclRpbWUgPSBub3c7XG4gICAgbGV0IGVuZCA9IHRydWU7XG4gICAgbGV0IGluZGV4ID0gdGhpcy4jc3RhcnRJbmRleDtcblxuICAgIGZvciAoY29uc3QgeyBjb21wbGV0ZWQsIHRvdGFsID0gMTAwLCB0ZXh0ID0gXCJcIiwgLi4ub3B0aW9ucyB9IG9mIGJhcnMpIHtcbiAgICAgIGlmIChjb21wbGV0ZWQgPCAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgY29tcGxldGVkIG11c3QgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIDBgKTtcbiAgICAgIH1cbiAgICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcih0b3RhbCkpIHRocm93IG5ldyBFcnJvcihgdG90YWwgbXVzdCBiZSAnbnVtYmVyJ2ApO1xuICAgICAgaWYgKHRoaXMuI2JhcnNbaW5kZXhdICYmIHRoaXMuI2JhcnNbaW5kZXhdLmVuZCkge1xuICAgICAgICBpbmRleCsrO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGVuZCA9IGZhbHNlO1xuICAgICAgY29uc3QgcGVyY2VudCA9ICgoY29tcGxldGVkIC8gdG90YWwpICogMTAwKS50b0ZpeGVkKDIpICsgXCIlXCI7XG4gICAgICBjb25zdCB0aW1lID0gdGhpcy5wcmV0dHlUaW1lXG4gICAgICAgID8gcHJldHR5VGltZShub3cgLSB0aGlzLnN0YXJ0LCBvcHRpb25zLnByZXR0eVRpbWVPcHRpb25zKVxuICAgICAgICA6ICgobm93IC0gdGhpcy5zdGFydCkgLyAxMDAwKS50b0ZpeGVkKDEpICsgXCJzXCI7XG4gICAgICBjb25zdCBtc0V0YSA9IGNvbXBsZXRlZCA+PSB0b3RhbFxuICAgICAgICA/IDBcbiAgICAgICAgOiAodG90YWwgLyBjb21wbGV0ZWQgLSAxKSAqIChub3cgLSB0aGlzLnN0YXJ0KTtcbiAgICAgIGNvbnN0IGV0YSA9IGNvbXBsZXRlZCA9PSAwXG4gICAgICAgID8gXCItXCJcbiAgICAgICAgOiB0aGlzLnByZXR0eVRpbWVcbiAgICAgICAgPyBwcmV0dHlUaW1lKG1zRXRhLCBvcHRpb25zLnByZXR0eVRpbWVPcHRpb25zKVxuICAgICAgICA6IChtc0V0YSAvIDEwMDApLnRvRml4ZWQoMSkgK1xuICAgICAgICAgIFwic1wiO1xuXG4gICAgICAvLyA6YmFyIDp0ZXh0IDpwZXJjZW50IDp0aW1lIDpjb21wbGV0ZWQvOnRvdGFsXG4gICAgICBsZXQgc3RyID0gdGhpcy5kaXNwbGF5XG4gICAgICAgIC5yZXBsYWNlKFwiOnRleHRcIiwgdGV4dClcbiAgICAgICAgLnJlcGxhY2UoXCI6dGltZVwiLCB0aW1lKVxuICAgICAgICAucmVwbGFjZShcIjpldGFcIiwgZXRhKVxuICAgICAgICAucmVwbGFjZShcIjpwZXJjZW50XCIsIHBlcmNlbnQpXG4gICAgICAgIC5yZXBsYWNlKFwiOmNvbXBsZXRlZFwiLCBjb21wbGV0ZWQgKyBcIlwiKVxuICAgICAgICAucmVwbGFjZShcIjp0b3RhbFwiLCB0b3RhbCArIFwiXCIpO1xuXG4gICAgICAvLyBjb21wdXRlIHRoZSBhdmFpbGFibGUgc3BhY2UgKG5vbi16ZXJvKSBmb3IgdGhlIGJhclxuICAgICAgY29uc3QgYXZhaWxhYmxlU3BhY2UgPSBNYXRoLm1heChcbiAgICAgICAgMCxcbiAgICAgICAgdGhpcy50dHlDb2x1bW5zIC0gc3RyLnJlcGxhY2UoXCI6YmFyXCIsIFwiXCIpLmxlbmd0aCxcbiAgICAgICk7XG4gICAgICBcbiAgICAgIGNvbnN0IHdpZHRoID0gTWF0aC5taW4odGhpcy53aWR0aCwgYXZhaWxhYmxlU3BhY2UpO1xuICAgICAgLy8gOmJhclxuICAgICAgY29uc3QgY29tcGxldGVMZW5ndGggPSBNYXRoLnJvdW5kKHdpZHRoICogY29tcGxldGVkIC8gdG90YWwpO1xuICAgICAgY29uc3QgY29tcGxldGUgPSBuZXcgQXJyYXkoY29tcGxldGVMZW5ndGgpLmZpbGwoXG4gICAgICAgIG9wdGlvbnMuY29tcGxldGUgPz8gdGhpcy5jb21wbGV0ZSxcbiAgICAgICkuam9pbihcIlwiKTtcbiAgICAgIGNvbnN0IGluY29tcGxldGUgPSBuZXcgQXJyYXkod2lkdGggLSBjb21wbGV0ZUxlbmd0aCkuZmlsbChcbiAgICAgICAgb3B0aW9ucy5pbmNvbXBsZXRlID8/IHRoaXMuaW5jb21wbGV0ZSxcbiAgICAgICkuam9pbihcIlwiKTtcblxuICAgICAgc3RyID0gc3RyLnJlcGxhY2UoXCI6YmFyXCIsIGNvbXBsZXRlICsgaW5jb21wbGV0ZSk7XG4gICAgICBjb25zdCBzdHJMZW4gPSBzdHJpcENvbG9yKHN0cikubGVuZ3RoO1xuICAgICAgaWYgKHRoaXMuI2JhcnNbaW5kZXhdICYmIHN0ciAhPSB0aGlzLiNiYXJzW2luZGV4XS5zdHIpIHtcbiAgICAgICAgY29uc3QgbGFzdFN0ckxlbiA9IHRoaXMuI2JhcnNbaW5kZXhdLnN0ckxlbiE7XG4gICAgICAgIGlmIChzdHJMZW4gPCBsYXN0U3RyTGVuKSB7XG4gICAgICAgICAgc3RyICs9IFwiIFwiLnJlcGVhdChsYXN0U3RyTGVuIC0gc3RyTGVuKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLiNiYXJzW2luZGV4KytdID0ge1xuICAgICAgICBzdHIsXG4gICAgICAgIHN0ckxlbixcbiAgICAgICAgZW5kOiBjb21wbGV0ZWQgPj0gdG90YWwsXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAobXMgPCB0aGlzLmludGVydmFsICYmIGVuZCA9PSBmYWxzZSkgcmV0dXJuO1xuICAgIGNvbnN0IHJlbmRlclN0ciA9IHRoaXMuI2JhcnMubWFwKCh2KSA9PiB2LnN0cikuam9pbihcIlxcblwiKTtcblxuICAgIGlmIChyZW5kZXJTdHIgIT09IHRoaXMubGFzdFN0cikge1xuICAgICAgdGhpcy5yZXNldFNjcmVlbigpO1xuICAgICAgdGhpcy53cml0ZShyZW5kZXJTdHIpO1xuICAgICAgdGhpcy5sYXN0U3RyID0gcmVuZGVyU3RyO1xuICAgICAgdGhpcy4jbGFzdFJvd3MgPSB0aGlzLiNiYXJzLmxlbmd0aDtcbiAgICB9XG5cbiAgICBpZiAoZW5kKSB0aGlzLmVuZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIGVuZDogZW5kIGEgcHJvZ3Jlc3MgYmFyLlxuICAgKiBObyBuZWVkIHRvIGNhbGwgaW4gbW9zdCBjYXNlcywgdW5sZXNzIHlvdSB3YW50IHRvIGVuZCBiZWZvcmUgMTAwJVxuICAgKi9cbiAgZW5kKCk6IHZvaWQge1xuICAgIERlbm8ucmVtb3ZlU2lnbmFsTGlzdGVuZXIoXCJTSUdJTlRcIiwgdGhpcy5zaWduYWxMaXN0ZW5lcik7XG4gICAgdGhpcy4jZW5kID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5jbGVhcikge1xuICAgICAgdGhpcy5yZXNldFNjcmVlbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmJyZWFrTGluZSgpO1xuICAgIH1cbiAgICB0aGlzLnNob3dDdXJzb3IoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBpbnRlcnJ1cHQgdGhlIHByb2dyZXNzIGJhciBhbmQgd3JpdGUgYSBtZXNzYWdlIGFib3ZlIGl0XG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHdyaXRlXG4gICAqL1xuICBjb25zb2xlKG1lc3NhZ2U6IHN0cmluZyB8IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMucmVzZXRTY3JlZW4oKTtcbiAgICB0aGlzLndyaXRlKGAke21lc3NhZ2V9YCk7XG4gICAgdGhpcy5icmVha0xpbmUoKTtcbiAgICB0aGlzLndyaXRlKHRoaXMubGFzdFN0cik7XG4gIH1cblxuICBwcml2YXRlIHdyaXRlKG1zZzogc3RyaW5nKTogdm9pZCB7XG4gICAgbXNnID0gYCR7bXNnfVxceDFiWz8yNWxgO1xuICAgIHRoaXMuc3Rkb3V0V3JpdGUobXNnKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVzZXRTY3JlZW4oKSB7XG4gICAgaWYgKHRoaXMuI2xhc3RSb3dzID4gMCkge1xuICAgICAgdGhpcy5zdGRvdXRXcml0ZShcIlxceDFiW1wiICsgKHRoaXMuI2xhc3RSb3dzIC0gMSkgKyBcIkFcXHJcXHgxYls/MEpcIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXQgdHR5Q29sdW1ucygpOiBudW1iZXIge1xuICAgIGlmICghRGVuby5pc2F0dHkoRGVuby5zdGRvdXQucmlkKSkgcmV0dXJuIDEwMDtcbiAgICByZXR1cm4gRGVuby5jb25zb2xlU2l6ZSgpLmNvbHVtbnM7XG4gIH1cblxuICBwcml2YXRlIGJyZWFrTGluZSgpIHtcbiAgICB0aGlzLnN0ZG91dFdyaXRlKFwiXFxuXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGRvdXRXcml0ZShtc2c6IHN0cmluZykge1xuICAgIHdyaXRlQWxsU3luYyhEZW5vLnN0ZG91dCwgdGhpcy5lbmNvZGVyLmVuY29kZShtc2cpKTtcbiAgfVxuXG4gIHByaXZhdGUgc2hvd0N1cnNvcigpOiB2b2lkIHtcbiAgICB0aGlzLnN0ZG91dFdyaXRlKFwiXFx4MWJbPzI1aFwiKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsT0FBTyxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsWUFBWSxRQUFRLFlBQVk7QUFDdkUsU0FBUyxVQUFVLFFBQTJCLFlBQVk7QUFFMUQsTUFBTSxZQUFZLEtBQUssTUFBTTtBQTRCN0IsT0FBTyxNQUFNO0VBQ1gsTUFBYztFQUNkLFNBQWlCO0VBQ2pCLFdBQW1CO0VBQ25CLE1BQWU7RUFDZixTQUFpQjtFQUNqQixRQUFnQjtFQUNoQixXQUFvQjtFQUVwQixDQUFBLEdBQUksR0FBRyxNQUFNO0VBQ2IsQ0FBQSxVQUFXLEdBQUcsRUFBRTtFQUNoQixDQUFBLFFBQVMsR0FBRyxFQUFFO0VBQ2QsQ0FBQSxJQUFLLEdBQVUsRUFBRSxDQUFDO0VBQ1YsVUFBVSxHQUFHO0VBQ2IsUUFBUSxLQUFLLEdBQUcsR0FBRztFQUNuQixpQkFBaUIsRUFBRTtFQUNuQixVQUFVLElBQUksY0FBYztFQUVwQywyRkFBMkY7RUFDM0Ysa0RBQWtEO0VBQ2xELHVCQUF1QjtFQUNmLGlCQUFpQjtJQUN2QixJQUFJLENBQUMsR0FBRztJQUNSLEtBQUssSUFBSTtFQUNYLEVBQUU7RUFFRjs7Ozs7Ozs7Ozs7R0FXQyxHQUNELFlBQ0UsRUFDRSxRQUFRLEVBQUUsRUFDVixRQUFRLEVBQUUsRUFDVixXQUFXLFFBQVEsSUFBSSxFQUN2QixhQUFhLFFBQVEsSUFBSSxFQUN6QixRQUFRLEtBQUssRUFDYixRQUFRLEVBQ1IsT0FBTyxFQUNQLGFBQWEsS0FBSyxFQUNDLEdBQUcsQ0FBQyxDQUFDLENBQzFCO0lBQ0EsSUFBSSxTQUFTLElBQUk7TUFDZixJQUFJLENBQUMsQ0FBQSxJQUFLLENBQUMsSUFBSSxDQUFD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
// denoCacheMetadata=6063853273585193924,17456412241214491749