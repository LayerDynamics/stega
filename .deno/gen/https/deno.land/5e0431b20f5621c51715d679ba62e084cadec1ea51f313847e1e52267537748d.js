import { KeyMap, KeyMapCtrl, KeyMapShift, SpecialKeyMap } from "./_key_codes.ts";
// https://en.wikipedia.org/wiki/ANSI_escape_code
// https://github.com/nodejs/node/blob/v13.13.0/lib/internal/readline/utils.js
const kUTF16SurrogateThreshold = 0x10000; // 2 ** 16
const kEscape = "\x1b";
/**
 * Parse ansi escape sequence.
 *
 * @param data Ansi escape sequence.
 *
 * ```ts
 * import { parse } from "./mod.ts";
 *
 * parse("\x04\x18");
 * ```
 *
 * ```json
 * [
 *   KeyCode { name: "d", sequence: "\x04", ctrl: true, meta: false, shift: false },
 *   KeyCode { name: "x", sequence: "\x18", ctrl: true, meta: false, shift: false },
 * ]
 * ```
 */ export function parse(data) {
  /*
   * Some patterns seen in terminal key escape codes, derived from combos seen
   * at http://www.midnight-commander.org/browser/lib/tty/key.c
   *
   * ESC letter
   * ESC [ letter
   * ESC [ modifier letter
   * ESC [ 1 ; modifier letter
   * ESC [ num char
   * ESC [ num ; modifier char
   * ESC O letter
   * ESC O modifier letter
   * ESC O 1 ; modifier letter
   * ESC N letter
   * ESC [ [ num ; modifier char
   * ESC [ [ 1 ; modifier letter
   * ESC ESC [ num char
   * ESC ESC O letter
   *
   * - char is usually ~ but $ and ^ also happen with rxvt
   * - modifier is 1 +
   *               (shift     * 1) +
   *               (left_alt  * 2) +
   *               (ctrl      * 4) +
   *               (right_alt * 8)
   * - two leading ESCs apparently mean the same as one leading ESC
   */ let index = -1;
  const keys = [];
  const input = data instanceof Uint8Array ? new TextDecoder().decode(data) : data;
  const hasNext = ()=>input.length - 1 >= index + 1;
  const next = ()=>input[++index];
  parseNext();
  return keys;
  function parseNext() {
    let ch = next();
    let s = ch;
    let escaped = false;
    const key = {
      name: undefined,
      char: undefined,
      sequence: undefined,
      code: undefined,
      ctrl: false,
      meta: false,
      shift: false
    };
    if (ch === kEscape && hasNext()) {
      escaped = true;
      s += ch = next();
      if (ch === kEscape) {
        s += ch = next();
      }
    }
    if (escaped && (ch === "O" || ch === "[")) {
      // ANSI escape sequence
      let code = ch;
      let modifier = 0;
      if (ch === "O") {
        // ESC O letter
        // ESC O modifier letter
        s += ch = next();
        if (ch >= "0" && ch <= "9") {
          modifier = (Number(ch) >> 0) - 1;
          s += ch = next();
        }
        code += ch;
      } else if (ch === "[") {
        // ESC [ letter
        // ESC [ modifier letter
        // ESC [ [ modifier letter
        // ESC [ [ num char
        s += ch = next();
        if (ch === "[") {
          // \x1b[[A
          //      ^--- escape codes might have a second bracket
          code += ch;
          s += ch = next();
        }
        /*
         * Here and later we try to buffer just enough data to get
         * a complete ascii sequence.
         *
         * We have basically two classes of ascii characters to process:
         *
         * 1. `\x1b[24;5~` should be parsed as { code: '[24~', modifier: 5 }
         *
         * This particular example is featuring Ctrl+F12 in xterm.
         *
         *  - `;5` part is optional, e.g. it could be `\x1b[24~`
         *  - first part can contain one or two digits
         *
         * So the generic regexp is like /^\d\d?(;\d)?[~^$]$/
         *
         * 2. `\x1b[1;5H` should be parsed as { code: '[H', modifier: 5 }
         *
         * This particular example is featuring Ctrl+Home in xterm.
         *
         *  - `1;5` part is optional, e.g. it could be `\x1b[H`
         *  - `1;` part is optional, e.g. it could be `\x1b[5H`
         *
         * So the generic regexp is like /^((\d;)?\d)?[A-Za-z]$/
         */ const cmdStart = s.length - 1;
        // Skip one or two leading digits
        if (ch >= "0" && ch <= "9") {
          s += ch = next();
          if (ch >= "0" && ch <= "9") {
            s += ch = next();
          }
        }
        // skip modifier
        if (ch === ";") {
          s += ch = next();
          if (ch >= "0" && ch <= "9") {
            s += next();
          }
        }
        /*
         * We buffered enough data, now trying to extract code
         * and modifier from it
         */ const cmd = s.slice(cmdStart);
        let match;
        if (match = cmd.match(/^(\d\d?)(;(\d))?([~^$])$/)) {
          code += match[1] + match[4];
          modifier = (Number(match[3]) || 1) - 1;
        } else if (match = cmd.match(/^((\d;)?(\d))?([A-Za-z])$/)) {
          code += match[4];
          modifier = (Number(match[3]) || 1) - 1;
        } else {
          code += cmd;
        }
      }
      // Parse the key modifier
      key.ctrl = !!(modifier & 4);
      key.meta = !!(modifier & 10);
      key.shift = !!(modifier & 1);
      key.code = code;
      // Parse the key itself
      if (code in KeyMap) {
        key.name = KeyMap[code];
      } else if (code in KeyMapShift) {
        key.name = KeyMapShift[code];
        key.shift = true;
      } else if (code in KeyMapCtrl) {
        key.name = KeyMapCtrl[code];
        key.ctrl = true;
      } else {
        key.name = "undefined";
      }
    } else if (ch in SpecialKeyMap) {
      key.name = SpecialKeyMap[ch];
      key.meta = escaped;
      if (key.name === "space") {
        key.char = ch;
      }
    } else if (!escaped && ch <= "\x1a") {
      // ctrl+letter
      key.name = String.fromCharCode(ch.charCodeAt(0) + "a".charCodeAt(0) - 1);
      key.ctrl = true;
      key.char = key.name;
    } else if (/^[0-9A-Za-z]$/.test(ch)) {
      // Letter, number, shift+letter
      key.name = ch.toLowerCase();
      key.shift = /^[A-Z]$/.test(ch);
      key.meta = escaped;
      key.char = ch;
    } else if (escaped) {
      // Escape sequence timeout
      key.name = ch.length ? undefined : "escape";
      key.meta = true;
    } else {
      key.name = ch;
      key.char = ch;
    }
    key.sequence = s;
    if (s.length !== 0 && (key.name !== undefined || escaped) || charLengthAt(s, 0) === s.length) {
      keys.push(key);
    } else {
      throw new Error("Unrecognized or broken escape sequence");
    }
    if (hasNext()) {
      parseNext();
    }
  }
}
function charLengthAt(str, i) {
  const pos = str.codePointAt(i);
  if (typeof pos === "undefined") {
    // Pretend to move to the right. This is necessary to autocomplete while
    // moving to the right.
    return 1;
  }
  return pos >= kUTF16SurrogateThreshold ? 2 : 1;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYxLjAuMC1yYy4zL2tleWNvZGUva2V5X2NvZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgS2V5TWFwLFxuICBLZXlNYXBDdHJsLFxuICBLZXlNYXBTaGlmdCxcbiAgU3BlY2lhbEtleU1hcCxcbn0gZnJvbSBcIi4vX2tleV9jb2Rlcy50c1wiO1xuXG4vLyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlXG4vLyBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvYmxvYi92MTMuMTMuMC9saWIvaW50ZXJuYWwvcmVhZGxpbmUvdXRpbHMuanNcblxuY29uc3Qga1VURjE2U3Vycm9nYXRlVGhyZXNob2xkID0gMHgxMDAwMDsgLy8gMiAqKiAxNlxuY29uc3Qga0VzY2FwZSA9IFwiXFx4MWJcIjtcblxuLyoqIEtleUNvZGUgb2JqZWN0LiAqL1xuZXhwb3J0IGludGVyZmFjZSBLZXlDb2RlIHtcbiAgLyoqIEtleSBuYW1lLiAqL1xuICBuYW1lPzogc3RyaW5nO1xuICAvKiogS2V5IHNlcXVlbmNlLiAqL1xuICBzZXF1ZW5jZT86IHN0cmluZztcbiAgLyoqIEtleSBjb2RlLiAqL1xuICBjb2RlPzogc3RyaW5nO1xuICAvKiogSW5kaWNhdGVzIGlmIHRoZSBjdHJsIGtleSBpcyBwcmVzc2VkLiAqL1xuICBjdHJsPzogYm9vbGVhbjtcbiAgLyoqIEluZGljYXRlcyBpZiB0aGUgbWV0YSBrZXkgaXMgcHJlc3NlZC4gKi9cbiAgbWV0YT86IGJvb2xlYW47XG4gIC8qKiBJbmRpY2F0ZXMgaWYgdGhlIHNoaWZ0IGtleSBpcyBwcmVzc2VkLiAqL1xuICBzaGlmdD86IGJvb2xlYW47XG4gIC8qKiBLZXkgc3RyaW5nIHZhbHVlLiAqL1xuICBjaGFyPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIFBhcnNlIGFuc2kgZXNjYXBlIHNlcXVlbmNlLlxuICpcbiAqIEBwYXJhbSBkYXRhIEFuc2kgZXNjYXBlIHNlcXVlbmNlLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBwYXJzZSB9IGZyb20gXCIuL21vZC50c1wiO1xuICpcbiAqIHBhcnNlKFwiXFx4MDRcXHgxOFwiKTtcbiAqIGBgYFxuICpcbiAqIGBgYGpzb25cbiAqIFtcbiAqICAgS2V5Q29kZSB7IG5hbWU6IFwiZFwiLCBzZXF1ZW5jZTogXCJcXHgwNFwiLCBjdHJsOiB0cnVlLCBtZXRhOiBmYWxzZSwgc2hpZnQ6IGZhbHNlIH0sXG4gKiAgIEtleUNvZGUgeyBuYW1lOiBcInhcIiwgc2VxdWVuY2U6IFwiXFx4MThcIiwgY3RybDogdHJ1ZSwgbWV0YTogZmFsc2UsIHNoaWZ0OiBmYWxzZSB9LFxuICogXVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShkYXRhOiBVaW50OEFycmF5IHwgc3RyaW5nKTogS2V5Q29kZVtdIHtcbiAgLypcbiAgICogU29tZSBwYXR0ZXJucyBzZWVuIGluIHRlcm1pbmFsIGtleSBlc2NhcGUgY29kZXMsIGRlcml2ZWQgZnJvbSBjb21ib3Mgc2VlblxuICAgKiBhdCBodHRwOi8vd3d3Lm1pZG5pZ2h0LWNvbW1hbmRlci5vcmcvYnJvd3Nlci9saWIvdHR5L2tleS5jXG4gICAqXG4gICAqIEVTQyBsZXR0ZXJcbiAgICogRVNDIFsgbGV0dGVyXG4gICAqIEVTQyBbIG1vZGlmaWVyIGxldHRlclxuICAgKiBFU0MgWyAxIDsgbW9kaWZpZXIgbGV0dGVyXG4gICAqIEVTQyBbIG51bSBjaGFyXG4gICAqIEVTQyBbIG51bSA7IG1vZGlmaWVyIGNoYXJcbiAgICogRVNDIE8gbGV0dGVyXG4gICAqIEVTQyBPIG1vZGlmaWVyIGxldHRlclxuICAgKiBFU0MgTyAxIDsgbW9kaWZpZXIgbGV0dGVyXG4gICAqIEVTQyBOIGxldHRlclxuICAgKiBFU0MgWyBbIG51bSA7IG1vZGlmaWVyIGNoYXJcbiAgICogRVNDIFsgWyAxIDsgbW9kaWZpZXIgbGV0dGVyXG4gICAqIEVTQyBFU0MgWyBudW0gY2hhclxuICAgKiBFU0MgRVNDIE8gbGV0dGVyXG4gICAqXG4gICAqIC0gY2hhciBpcyB1c3VhbGx5IH4gYnV0ICQgYW5kIF4gYWxzbyBoYXBwZW4gd2l0aCByeHZ0XG4gICAqIC0gbW9kaWZpZXIgaXMgMSArXG4gICAqICAgICAgICAgICAgICAgKHNoaWZ0ICAgICAqIDEpICtcbiAgICogICAgICAgICAgICAgICAobGVmdF9hbHQgICogMikgK1xuICAgKiAgICAgICAgICAgICAgIChjdHJsICAgICAgKiA0KSArXG4gICAqICAgICAgICAgICAgICAgKHJpZ2h0X2FsdCAqIDgpXG4gICAqIC0gdHdvIGxlYWRpbmcgRVNDcyBhcHBhcmVudGx5IG1lYW4gdGhlIHNhbWUgYXMgb25lIGxlYWRpbmcgRVNDXG4gICAqL1xuICBsZXQgaW5kZXggPSAtMTtcbiAgY29uc3Qga2V5czogS2V5Q29kZVtdID0gW107XG4gIGNvbnN0IGlucHV0OiBzdHJpbmcgPSBkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheVxuICAgID8gbmV3IFRleHREZWNvZGVyKCkuZGVjb2RlKGRhdGEpXG4gICAgOiBkYXRhO1xuXG4gIGNvbnN0IGhhc05leHQgPSAoKSA9PiBpbnB1dC5sZW5ndGggLSAxID49IGluZGV4ICsgMTtcbiAgY29uc3QgbmV4dCA9ICgpID0+IGlucHV0WysraW5kZXhdO1xuXG4gIHBhcnNlTmV4dCgpO1xuXG4gIHJldHVybiBrZXlzO1xuXG4gIGZ1bmN0aW9uIHBhcnNlTmV4dCgpIHtcbiAgICBsZXQgY2g6IHN0cmluZyA9IG5leHQoKTtcbiAgICBsZXQgczogc3RyaW5nID0gY2g7XG4gICAgbGV0IGVzY2FwZWQgPSBmYWxzZTtcblxuICAgIGNvbnN0IGtleTogS2V5Q29kZSA9IHtcbiAgICAgIG5hbWU6IHVuZGVmaW5lZCxcbiAgICAgIGNoYXI6IHVuZGVmaW5lZCxcbiAgICAgIHNlcXVlbmNlOiB1bmRlZmluZWQsXG4gICAgICBjb2RlOiB1bmRlZmluZWQsXG4gICAgICBjdHJsOiBmYWxzZSxcbiAgICAgIG1ldGE6IGZhbHNlLFxuICAgICAgc2hpZnQ6IGZhbHNlLFxuICAgIH07XG5cbiAgICBpZiAoY2ggPT09IGtFc2NhcGUgJiYgaGFzTmV4dCgpKSB7XG4gICAgICBlc2NhcGVkID0gdHJ1ZTtcbiAgICAgIHMgKz0gY2ggPSBuZXh0KCk7XG5cbiAgICAgIGlmIChjaCA9PT0ga0VzY2FwZSkge1xuICAgICAgICBzICs9IGNoID0gbmV4dCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlc2NhcGVkICYmIChjaCA9PT0gXCJPXCIgfHwgY2ggPT09IFwiW1wiKSkge1xuICAgICAgLy8gQU5TSSBlc2NhcGUgc2VxdWVuY2VcbiAgICAgIGxldCBjb2RlOiBzdHJpbmcgPSBjaDtcbiAgICAgIGxldCBtb2RpZmllciA9IDA7XG5cbiAgICAgIGlmIChjaCA9PT0gXCJPXCIpIHtcbiAgICAgICAgLy8gRVNDIE8gbGV0dGVyXG4gICAgICAgIC8vIEVTQyBPIG1vZGlmaWVyIGxldHRlclxuICAgICAgICBzICs9IGNoID0gbmV4dCgpO1xuXG4gICAgICAgIGlmIChjaCA+PSBcIjBcIiAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICAgIG1vZGlmaWVyID0gKE51bWJlcihjaCkgPj4gMCkgLSAxO1xuICAgICAgICAgIHMgKz0gY2ggPSBuZXh0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb2RlICs9IGNoO1xuICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCJbXCIpIHtcbiAgICAgICAgLy8gRVNDIFsgbGV0dGVyXG4gICAgICAgIC8vIEVTQyBbIG1vZGlmaWVyIGxldHRlclxuICAgICAgICAvLyBFU0MgWyBbIG1vZGlmaWVyIGxldHRlclxuICAgICAgICAvLyBFU0MgWyBbIG51bSBjaGFyXG4gICAgICAgIHMgKz0gY2ggPSBuZXh0KCk7XG5cbiAgICAgICAgaWYgKGNoID09PSBcIltcIikge1xuICAgICAgICAgIC8vIFxceDFiW1tBXG4gICAgICAgICAgLy8gICAgICBeLS0tIGVzY2FwZSBjb2RlcyBtaWdodCBoYXZlIGEgc2Vjb25kIGJyYWNrZXRcbiAgICAgICAgICBjb2RlICs9IGNoO1xuICAgICAgICAgIHMgKz0gY2ggPSBuZXh0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKlxuICAgICAgICAgKiBIZXJlIGFuZCBsYXRlciB3ZSB0cnkgdG8gYnVmZmVyIGp1c3QgZW5vdWdoIGRhdGEgdG8gZ2V0XG4gICAgICAgICAqIGEgY29tcGxldGUgYXNjaWkgc2VxdWVuY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIFdlIGhhdmUgYmFzaWNhbGx5IHR3byBjbGFzc2VzIG9mIGFzY2lpIGNoYXJhY3RlcnMgdG8gcHJvY2VzczpcbiAgICAgICAgICpcbiAgICAgICAgICogMS4gYFxceDFiWzI0OzV+YCBzaG91bGQgYmUgcGFyc2VkIGFzIHsgY29kZTogJ1syNH4nLCBtb2RpZmllcjogNSB9XG4gICAgICAgICAqXG4gICAgICAgICAqIFRoaXMgcGFydGljdWxhciBleGFtcGxlIGlzIGZlYXR1cmluZyBDdHJsK0YxMiBpbiB4dGVybS5cbiAgICAgICAgICpcbiAgICAgICAgICogIC0gYDs1YCBwYXJ0IGlzIG9wdGlvbmFsLCBlLmcuIGl0IGNvdWxkIGJlIGBcXHgxYlsyNH5gXG4gICAgICAgICAqICAtIGZpcnN0IHBhcnQgY2FuIGNvbnRhaW4gb25lIG9yIHR3byBkaWdpdHNcbiAgICAgICAgICpcbiAgICAgICAgICogU28gdGhlIGdlbmVyaWMgcmVnZXhwIGlzIGxpa2UgL15cXGRcXGQ/KDtcXGQpP1t+XiRdJC9cbiAgICAgICAgICpcbiAgICAgICAgICogMi4gYFxceDFiWzE7NUhgIHNob3VsZCBiZSBwYXJzZWQgYXMgeyBjb2RlOiAnW0gnLCBtb2RpZmllcjogNSB9XG4gICAgICAgICAqXG4gICAgICAgICAqIFRoaXMgcGFydGljdWxhciBleGFtcGxlIGlzIGZlYXR1cmluZyBDdHJsK0hvbWUgaW4geHRlcm0uXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGAxOzVgIHBhcnQgaXMgb3B0aW9uYWwsIGUuZy4gaXQgY291bGQgYmUgYFxceDFiW0hgXG4gICAgICAgICAqICAtIGAxO2AgcGFydCBpcyBvcHRpb25hbCwgZS5nLiBpdCBjb3VsZCBiZSBgXFx4MWJbNUhgXG4gICAgICAgICAqXG4gICAgICAgICAqIFNvIHRoZSBnZW5lcmljIHJlZ2V4cCBpcyBsaWtlIC9eKChcXGQ7KT9cXGQpP1tBLVphLXpdJC9cbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IGNtZFN0YXJ0OiBudW1iZXIgPSBzLmxlbmd0aCAtIDE7XG5cbiAgICAgICAgLy8gU2tpcCBvbmUgb3IgdHdvIGxlYWRpbmcgZGlnaXRzXG4gICAgICAgIGlmIChjaCA+PSBcIjBcIiAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICAgIHMgKz0gY2ggPSBuZXh0KCk7XG5cbiAgICAgICAgICBpZiAoY2ggPj0gXCIwXCIgJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgICAgIHMgKz0gY2ggPSBuZXh0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gc2tpcCBtb2RpZmllclxuICAgICAgICBpZiAoY2ggPT09IFwiO1wiKSB7XG4gICAgICAgICAgcyArPSBjaCA9IG5leHQoKTtcblxuICAgICAgICAgIGlmIChjaCA+PSBcIjBcIiAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICAgICAgcyArPSBuZXh0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLypcbiAgICAgICAgICogV2UgYnVmZmVyZWQgZW5vdWdoIGRhdGEsIG5vdyB0cnlpbmcgdG8gZXh0cmFjdCBjb2RlXG4gICAgICAgICAqIGFuZCBtb2RpZmllciBmcm9tIGl0XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCBjbWQ6IHN0cmluZyA9IHMuc2xpY2UoY21kU3RhcnQpO1xuICAgICAgICBsZXQgbWF0Y2g6IFJlZ0V4cE1hdGNoQXJyYXkgfCBudWxsO1xuXG4gICAgICAgIGlmICgobWF0Y2ggPSBjbWQubWF0Y2goL14oXFxkXFxkPykoOyhcXGQpKT8oW35eJF0pJC8pKSkge1xuICAgICAgICAgIGNvZGUgKz0gbWF0Y2hbMV0gKyBtYXRjaFs0XTtcbiAgICAgICAgICBtb2RpZmllciA9IChOdW1iZXIobWF0Y2hbM10pIHx8IDEpIC0gMTtcbiAgICAgICAgfSBlbHNlIGlmICgobWF0Y2ggPSBjbWQubWF0Y2goL14oKFxcZDspPyhcXGQpKT8oW0EtWmEtel0pJC8pKSkge1xuICAgICAgICAgIGNvZGUgKz0gbWF0Y2hbNF07XG4gICAgICAgICAgbW9kaWZpZXIgPSAoTnVtYmVyKG1hdGNoWzNdKSB8fCAxKSAtIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29kZSArPSBjbWQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUGFyc2UgdGhlIGtleSBtb2RpZmllclxuICAgICAga2V5LmN0cmwgPSAhIShtb2RpZmllciAmIDQpO1xuICAgICAga2V5Lm1ldGEgPSAhIShtb2RpZmllciAmIDEwKTtcbiAgICAgIGtleS5zaGlmdCA9ICEhKG1vZGlmaWVyICYgMSk7XG4gICAgICBrZXkuY29kZSA9IGNvZGU7XG5cbiAgICAgIC8vIFBhcnNlIHRoZSBrZXkgaXRzZWxmXG4gICAgICBpZiAoY29kZSBpbiBLZXlNYXApIHtcbiAgICAgICAga2V5Lm5hbWUgPSBLZXlNYXBbY29kZV07XG4gICAgICB9IGVsc2UgaWYgKGNvZGUgaW4gS2V5TWFwU2hpZnQpIHtcbiAgICAgICAga2V5Lm5hbWUgPSBLZXlNYXBTaGlmdFtjb2RlXTtcbiAgICAgICAga2V5LnNoaWZ0ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoY29kZSBpbiBLZXlNYXBDdHJsKSB7XG4gICAgICAgIGtleS5uYW1lID0gS2V5TWFwQ3RybFtjb2RlXTtcbiAgICAgICAga2V5LmN0cmwgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAga2V5Lm5hbWUgPSBcInVuZGVmaW5lZFwiO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2ggaW4gU3BlY2lhbEtleU1hcCkge1xuICAgICAga2V5Lm5hbWUgPSBTcGVjaWFsS2V5TWFwW2NoXTtcbiAgICAgIGtleS5tZXRhID0gZXNjYXBlZDtcblxuICAgICAgaWYgKGtleS5uYW1lID09PSBcInNwYWNlXCIpIHtcbiAgICAgICAga2V5LmNoYXIgPSBjaDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCFlc2NhcGVkICYmIGNoIDw9IFwiXFx4MWFcIikge1xuICAgICAgLy8gY3RybCtsZXR0ZXJcbiAgICAgIGtleS5uYW1lID0gU3RyaW5nLmZyb21DaGFyQ29kZShcbiAgICAgICAgY2guY2hhckNvZGVBdCgwKSArIFwiYVwiLmNoYXJDb2RlQXQoMCkgLSAxLFxuICAgICAgKTtcbiAgICAgIGtleS5jdHJsID0gdHJ1ZTtcblxuICAgICAga2V5LmNoYXIgPSBrZXkubmFtZTtcbiAgICB9IGVsc2UgaWYgKC9eWzAtOUEtWmEtel0kLy50ZXN0KGNoKSkge1xuICAgICAgLy8gTGV0dGVyLCBudW1iZXIsIHNoaWZ0K2xldHRlclxuICAgICAga2V5Lm5hbWUgPSBjaC50b0xvd2VyQ2FzZSgpO1xuICAgICAga2V5LnNoaWZ0ID0gL15bQS1aXSQvLnRlc3QoY2gpO1xuICAgICAga2V5Lm1ldGEgPSBlc2NhcGVkO1xuICAgICAga2V5LmNoYXIgPSBjaDtcbiAgICB9IGVsc2UgaWYgKGVzY2FwZWQpIHtcbiAgICAgIC8vIEVzY2FwZSBzZXF1ZW5jZSB0aW1lb3V0XG4gICAgICBrZXkubmFtZSA9IGNoLmxlbmd0aCA/IHVuZGVmaW5lZCA6IFwiZXNjYXBlXCI7XG4gICAgICBrZXkubWV0YSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtleS5uYW1lID0gY2g7XG4gICAgICBrZXkuY2hhciA9IGNoO1xuICAgIH1cblxuICAgIGtleS5zZXF1ZW5jZSA9IHM7XG5cbiAgICBpZiAoXG4gICAgICAocy5sZW5ndGggIT09IDAgJiYgKGtleS5uYW1lICE9PSB1bmRlZmluZWQgfHwgZXNjYXBlZCkpIHx8XG4gICAgICBjaGFyTGVuZ3RoQXQocywgMCkgPT09IHMubGVuZ3RoXG4gICAgKSB7XG4gICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIG9yIGJyb2tlbiBlc2NhcGUgc2VxdWVuY2VcIik7XG4gICAgfVxuXG4gICAgaWYgKGhhc05leHQoKSkge1xuICAgICAgcGFyc2VOZXh0KCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNoYXJMZW5ndGhBdChzdHI6IHN0cmluZywgaTogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgcG9zOiBudW1iZXIgfCB1bmRlZmluZWQgPSBzdHIuY29kZVBvaW50QXQoaSk7XG4gIGlmICh0eXBlb2YgcG9zID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgLy8gUHJldGVuZCB0byBtb3ZlIHRvIHRoZSByaWdodC4gVGhpcyBpcyBuZWNlc3NhcnkgdG8gYXV0b2NvbXBsZXRlIHdoaWxlXG4gICAgLy8gbW92aW5nIHRvIHRoZSByaWdodC5cbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gcG9zID49IGtVVEYxNlN1cnJvZ2F0ZVRocmVzaG9sZCA/IDIgOiAxO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQ0UsTUFBTSxFQUNOLFVBQVUsRUFDVixXQUFXLEVBQ1gsYUFBYSxRQUNSLGtCQUFrQjtBQUV6QixpREFBaUQ7QUFDakQsOEVBQThFO0FBRTlFLE1BQU0sMkJBQTJCLFNBQVMsVUFBVTtBQUNwRCxNQUFNLFVBQVU7QUFvQmhCOzs7Ozs7Ozs7Ozs7Ozs7OztDQWlCQyxHQUNELE9BQU8sU0FBUyxNQUFNLElBQXlCO0VBQzdDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTBCQyxHQUNELElBQUksUUFBUSxDQUFDO0VBQ2IsTUFBTSxPQUFrQixFQUFFO0VBQzFCLE1BQU0sUUFBZ0IsZ0JBQWdCLGFBQ2xDLElBQUksY0FBYyxNQUFNLENBQUMsUUFDekI7RUFFSixNQUFNLFVBQVUsSUFBTSxNQUFNLE1BQU0sR0FBRyxL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
// denoCacheMetadata=15712748216285693450,17364737283331725422