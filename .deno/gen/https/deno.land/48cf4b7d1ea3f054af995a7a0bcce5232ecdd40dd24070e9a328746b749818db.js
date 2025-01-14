import { encodeBase64 } from "./deps.ts";
/** Escape sequence: `\x1B` */ const ESC = "\x1B";
/** Control sequence intro: `\x1B[` */ const CSI = `${ESC}[`;
/** Operating system command: `\x1B]` */ const OSC = `${ESC}]`;
/** Link separator */ const SEP = ";";
/** Ring audio bell: `\u0007` */ export const bel = "\u0007";
/** Get cursor position. */ export const cursorPosition = `${CSI}6n`;
/**
 * Move cursor to x, y, counting from the top left corner.
 * @param x Position left.
 * @param y Position top.
 */ export function cursorTo(x, y) {
  if (typeof y !== "number") {
    return `${CSI}${x}G`;
  }
  return `${CSI}${y};${x}H`;
}
/**
 * Move cursor by offset.
 * @param x Offset left.
 * @param y Offset top.
 */ export function cursorMove(x, y) {
  let ret = "";
  if (x < 0) {
    ret += `${CSI}${-x}D`;
  } else if (x > 0) {
    ret += `${CSI}${x}C`;
  }
  if (y < 0) {
    ret += `${CSI}${-y}A`;
  } else if (y > 0) {
    ret += `${CSI}${y}B`;
  }
  return ret;
}
/**
 * Move cursor up by n lines.
 * @param count Number of lines.
 */ export function cursorUp(count = 1) {
  return `${CSI}${count}A`;
}
/**
 * Move cursor down by n lines.
 * @param count Number of lines.
 */ export function cursorDown(count = 1) {
  return `${CSI}${count}B`;
}
/**
 * Move cursor forward by n lines.
 * @param count Number of lines.
 */ export function cursorForward(count = 1) {
  return `${CSI}${count}C`;
}
/**
 * Move cursor backward by n lines.
 * @param count Number of lines.
 */ export function cursorBackward(count = 1) {
  return `${CSI}${count}D`;
}
/**
 * Move cursor to the beginning of the line n lines down.
 * @param count Number of lines.
 */ export function cursorNextLine(count = 1) {
  return `${CSI}E`.repeat(count);
}
/**
 * Move cursor to the beginning of the line n lines up.
 * @param count Number of lines.
 */ export function cursorPrevLine(count = 1) {
  return `${CSI}F`.repeat(count);
}
/** Move cursor to first column of current row. */ export const cursorLeft = `${CSI}G`;
/** Hide cursor. */ export const cursorHide = `${CSI}?25l`;
/** Show cursor. */ export const cursorShow = `${CSI}?25h`;
/** Save cursor. */ export const cursorSave = `${ESC}7`;
/** Restore cursor. */ export const cursorRestore = `${ESC}8`;
/**
 * Scroll window up by n lines.
 * @param count Number of lines.
 */ export function scrollUp(count = 1) {
  return `${CSI}S`.repeat(count);
}
/**
 * Scroll window down by n lines.
 * @param count Number of lines.
 */ export function scrollDown(count = 1) {
  return `${CSI}T`.repeat(count);
}
/** Clear screen. */ export const eraseScreen = `${CSI}2J`;
/**
 * Clear screen up by n lines.
 * @param count Number of lines.
 */ export function eraseUp(count = 1) {
  return `${CSI}1J`.repeat(count);
}
/**
 * Clear screen down by n lines.
 * @param count Number of lines.
 */ export function eraseDown(count = 1) {
  return `${CSI}0J`.repeat(count);
}
/** Clear current line. */ export const eraseLine = `${CSI}2K`;
/** Clear to line end. */ export const eraseLineEnd = `${CSI}0K`;
/** Clear to line start. */ export const eraseLineStart = `${CSI}1K`;
/**
 * Clear screen and move cursor by n lines up and move cursor to first column.
 * @param count Number of lines.
 */ export function eraseLines(count) {
  let clear = "";
  for(let i = 0; i < count; i++){
    clear += eraseLine + (i < count - 1 ? cursorUp() : "");
  }
  clear += cursorLeft;
  return clear;
}
/** Clear the terminal screen. (Viewport) */ export const clearScreen = "\u001Bc";
/**
 * Clear the whole terminal, including scrollback buffer.
 * (Not just the visible part of it).
 */ export const clearTerminal = Deno.build.os === "windows" ? `${eraseScreen}${CSI}0f` : `${eraseScreen}${CSI}3J${CSI}H`;
/**
 * Create link.
 *
 * @param text Link text.
 * @param url Link url.
 *
 * ```ts
 * import { link } from "./mod.ts";
 *
 * console.log(
 *   link("Click me.", "https://deno.land"),
 * );
 * ```
 */ export function link(text, url) {
  return [
    OSC,
    "8",
    SEP,
    SEP,
    url,
    bel,
    text,
    OSC,
    "8",
    SEP,
    SEP,
    bel
  ].join("");
}
/**
 * Create image.
 *
 * @param buffer  Image buffer.
 * @param options Image options.
 *
 * ```ts
 * import { image } from "./mod.ts";
 *
 * const response = await fetch("https://deno.land/images/hashrock_simple.png");
 * const imageBuffer: ArrayBuffer = await response.arrayBuffer();
 * console.log(
 *   image(imageBuffer),
 * );
 * ```
 */ export function image(buffer, options) {
  let ret = `${OSC}1337;File=inline=1`;
  if (options?.width) {
    ret += `;width=${options.width}`;
  }
  if (options?.height) {
    ret += `;height=${options.height}`;
  }
  if (options?.preserveAspectRatio === false) {
    ret += ";preserveAspectRatio=0";
  }
  return ret + ":" + encodeBase64(buffer) + bel;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYxLjAuMC1yYy4zL2Fuc2kvYW5zaV9lc2NhcGVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGVuY29kZUJhc2U2NCB9IGZyb20gXCIuL2RlcHMudHNcIjtcblxuLyoqIEVzY2FwZSBzZXF1ZW5jZTogYFxceDFCYCAqL1xuY29uc3QgRVNDID0gXCJcXHgxQlwiO1xuLyoqIENvbnRyb2wgc2VxdWVuY2UgaW50cm86IGBcXHgxQltgICovXG5jb25zdCBDU0kgPSBgJHtFU0N9W2A7XG4vKiogT3BlcmF0aW5nIHN5c3RlbSBjb21tYW5kOiBgXFx4MUJdYCAqL1xuY29uc3QgT1NDID0gYCR7RVNDfV1gO1xuLyoqIExpbmsgc2VwYXJhdG9yICovXG5jb25zdCBTRVAgPSBcIjtcIjtcblxuLyoqIFJpbmcgYXVkaW8gYmVsbDogYFxcdTAwMDdgICovXG5leHBvcnQgY29uc3QgYmVsID0gXCJcXHUwMDA3XCI7XG4vKiogR2V0IGN1cnNvciBwb3NpdGlvbi4gKi9cbmV4cG9ydCBjb25zdCBjdXJzb3JQb3NpdGlvbiA9IGAke0NTSX02bmA7XG5cbi8qKlxuICogTW92ZSBjdXJzb3IgdG8geCwgeSwgY291bnRpbmcgZnJvbSB0aGUgdG9wIGxlZnQgY29ybmVyLlxuICogQHBhcmFtIHggUG9zaXRpb24gbGVmdC5cbiAqIEBwYXJhbSB5IFBvc2l0aW9uIHRvcC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGN1cnNvclRvKHg6IG51bWJlciwgeT86IG51bWJlcik6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgeSAhPT0gXCJudW1iZXJcIikge1xuICAgIHJldHVybiBgJHtDU0l9JHt4fUdgO1xuICB9XG4gIHJldHVybiBgJHtDU0l9JHt5fTske3h9SGA7XG59XG5cbi8qKlxuICogTW92ZSBjdXJzb3IgYnkgb2Zmc2V0LlxuICogQHBhcmFtIHggT2Zmc2V0IGxlZnQuXG4gKiBAcGFyYW0geSBPZmZzZXQgdG9wLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3Vyc29yTW92ZSh4OiBudW1iZXIsIHk6IG51bWJlcik6IHN0cmluZyB7XG4gIGxldCByZXQgPSBcIlwiO1xuXG4gIGlmICh4IDwgMCkge1xuICAgIHJldCArPSBgJHtDU0l9JHsteH1EYDtcbiAgfSBlbHNlIGlmICh4ID4gMCkge1xuICAgIHJldCArPSBgJHtDU0l9JHt4fUNgO1xuICB9XG5cbiAgaWYgKHkgPCAwKSB7XG4gICAgcmV0ICs9IGAke0NTSX0key15fUFgO1xuICB9IGVsc2UgaWYgKHkgPiAwKSB7XG4gICAgcmV0ICs9IGAke0NTSX0ke3l9QmA7XG4gIH1cblxuICByZXR1cm4gcmV0O1xufVxuXG4vKipcbiAqIE1vdmUgY3Vyc29yIHVwIGJ5IG4gbGluZXMuXG4gKiBAcGFyYW0gY291bnQgTnVtYmVyIG9mIGxpbmVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3Vyc29yVXAoY291bnQgPSAxKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke0NTSX0ke2NvdW50fUFgO1xufVxuXG4vKipcbiAqIE1vdmUgY3Vyc29yIGRvd24gYnkgbiBsaW5lcy5cbiAqIEBwYXJhbSBjb3VudCBOdW1iZXIgb2YgbGluZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjdXJzb3JEb3duKGNvdW50ID0gMSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtDU0l9JHtjb3VudH1CYDtcbn1cblxuLyoqXG4gKiBNb3ZlIGN1cnNvciBmb3J3YXJkIGJ5IG4gbGluZXMuXG4gKiBAcGFyYW0gY291bnQgTnVtYmVyIG9mIGxpbmVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3Vyc29yRm9yd2FyZChjb3VudCA9IDEpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Q1NJfSR7Y291bnR9Q2A7XG59XG5cbi8qKlxuICogTW92ZSBjdXJzb3IgYmFja3dhcmQgYnkgbiBsaW5lcy5cbiAqIEBwYXJhbSBjb3VudCBOdW1iZXIgb2YgbGluZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjdXJzb3JCYWNrd2FyZChjb3VudCA9IDEpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Q1NJfSR7Y291bnR9RGA7XG59XG5cbi8qKlxuICogTW92ZSBjdXJzb3IgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgbGluZSBuIGxpbmVzIGRvd24uXG4gKiBAcGFyYW0gY291bnQgTnVtYmVyIG9mIGxpbmVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3Vyc29yTmV4dExpbmUoY291bnQgPSAxKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke0NTSX1FYC5yZXBlYXQoY291bnQpO1xufVxuXG4vKipcbiAqIE1vdmUgY3Vyc29yIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpbmUgbiBsaW5lcyB1cC5cbiAqIEBwYXJhbSBjb3VudCBOdW1iZXIgb2YgbGluZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjdXJzb3JQcmV2TGluZShjb3VudCA9IDEpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Q1NJfUZgLnJlcGVhdChjb3VudCk7XG59XG5cbi8qKiBNb3ZlIGN1cnNvciB0byBmaXJzdCBjb2x1bW4gb2YgY3VycmVudCByb3cuICovXG5leHBvcnQgY29uc3QgY3Vyc29yTGVmdCA9IGAke0NTSX1HYDtcbi8qKiBIaWRlIGN1cnNvci4gKi9cbmV4cG9ydCBjb25zdCBjdXJzb3JIaWRlID0gYCR7Q1NJfT8yNWxgO1xuLyoqIFNob3cgY3Vyc29yLiAqL1xuZXhwb3J0IGNvbnN0IGN1cnNvclNob3cgPSBgJHtDU0l9PzI1aGA7XG4vKiogU2F2ZSBjdXJzb3IuICovXG5leHBvcnQgY29uc3QgY3Vyc29yU2F2ZSA9IGAke0VTQ303YDtcbi8qKiBSZXN0b3JlIGN1cnNvci4gKi9cbmV4cG9ydCBjb25zdCBjdXJzb3JSZXN0b3JlID0gYCR7RVNDfThgO1xuXG4vKipcbiAqIFNjcm9sbCB3aW5kb3cgdXAgYnkgbiBsaW5lcy5cbiAqIEBwYXJhbSBjb3VudCBOdW1iZXIgb2YgbGluZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzY3JvbGxVcChjb3VudCA9IDEpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Q1NJfVNgLnJlcGVhdChjb3VudCk7XG59XG5cbi8qKlxuICogU2Nyb2xsIHdpbmRvdyBkb3duIGJ5IG4gbGluZXMuXG4gKiBAcGFyYW0gY291bnQgTnVtYmVyIG9mIGxpbmVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2Nyb2xsRG93bihjb3VudCA9IDEpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Q1NJfVRgLnJlcGVhdChjb3VudCk7XG59XG5cbi8qKiBDbGVhciBzY3JlZW4uICovXG5leHBvcnQgY29uc3QgZXJhc2VTY3JlZW4gPSBgJHtDU0l9MkpgO1xuXG4vKipcbiAqIENsZWFyIHNjcmVlbiB1cCBieSBuIGxpbmVzLlxuICogQHBhcmFtIGNvdW50IE51bWJlciBvZiBsaW5lcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVyYXNlVXAoY291bnQgPSAxKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke0NTSX0xSmAucmVwZWF0KGNvdW50KTtcbn1cblxuLyoqXG4gKiBDbGVhciBzY3JlZW4gZG93biBieSBuIGxpbmVzLlxuICogQHBhcmFtIGNvdW50IE51bWJlciBvZiBsaW5lcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVyYXNlRG93bihjb3VudCA9IDEpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Q1NJfTBKYC5yZXBlYXQoY291bnQpO1xufVxuXG4vKiogQ2xlYXIgY3VycmVudCBsaW5lLiAqL1xuZXhwb3J0IGNvbnN0IGVyYXNlTGluZSA9IGAke0NTSX0yS2A7XG4vKiogQ2xlYXIgdG8gbGluZSBlbmQuICovXG5leHBvcnQgY29uc3QgZXJhc2VMaW5lRW5kID0gYCR7Q1NJfTBLYDtcbi8qKiBDbGVhciB0byBsaW5lIHN0YXJ0LiAqL1xuZXhwb3J0IGNvbnN0IGVyYXNlTGluZVN0YXJ0ID0gYCR7Q1NJfTFLYDtcblxuLyoqXG4gKiBDbGVhciBzY3JlZW4gYW5kIG1vdmUgY3Vyc29yIGJ5IG4gbGluZXMgdXAgYW5kIG1vdmUgY3Vyc29yIHRvIGZpcnN0IGNvbHVtbi5cbiAqIEBwYXJhbSBjb3VudCBOdW1iZXIgb2YgbGluZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlcmFzZUxpbmVzKGNvdW50OiBudW1iZXIpOiBzdHJpbmcge1xuICBsZXQgY2xlYXIgPSBcIlwiO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICBjbGVhciArPSBlcmFzZUxpbmUgKyAoaSA8IGNvdW50IC0gMSA/IGN1cnNvclVwKCkgOiBcIlwiKTtcbiAgfVxuICBjbGVhciArPSBjdXJzb3JMZWZ0O1xuICByZXR1cm4gY2xlYXI7XG59XG5cbi8qKiBDbGVhciB0aGUgdGVybWluYWwgc2NyZWVuLiAoVmlld3BvcnQpICovXG5leHBvcnQgY29uc3QgY2xlYXJTY3JlZW4gPSBcIlxcdTAwMUJjXCI7XG5cbi8qKlxuICogQ2xlYXIgdGhlIHdob2xlIHRlcm1pbmFsLCBpbmNsdWRpbmcgc2Nyb2xsYmFjayBidWZmZXIuXG4gKiAoTm90IGp1c3QgdGhlIHZpc2libGUgcGFydCBvZiBpdCkuXG4gKi9cbmV4cG9ydCBjb25zdCBjbGVhclRlcm1pbmFsID0gRGVuby5idWlsZC5vcyA9PT0gXCJ3aW5kb3dzXCJcbiAgPyBgJHtlcmFzZVNjcmVlbn0ke0NTSX0wZmBcbiAgLy8gMS4gRXJhc2VzIHRoZSBzY3JlZW4gKE9ubHkgZG9uZSBpbiBjYXNlIGAyYCBpcyBub3Qgc3VwcG9ydGVkKVxuICAvLyAyLiBFcmFzZXMgdGhlIHdob2xlIHNjcmVlbiBpbmNsdWRpbmcgc2Nyb2xsYmFjayBidWZmZXJcbiAgLy8gMy4gTW92ZXMgY3Vyc29yIHRvIHRoZSB0b3AtbGVmdCBwb3NpdGlvblxuICAvLyBNb3JlIGluZm86IGh0dHBzOi8vd3d3LnJlYWwtd29ybGQtc3lzdGVtcy5jb20vZG9jcy9BTlNJY29kZS5odG1sXG4gIDogYCR7ZXJhc2VTY3JlZW59JHtDU0l9M0oke0NTSX1IYDtcblxuLyoqXG4gKiBDcmVhdGUgbGluay5cbiAqXG4gKiBAcGFyYW0gdGV4dCBMaW5rIHRleHQuXG4gKiBAcGFyYW0gdXJsIExpbmsgdXJsLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBsaW5rIH0gZnJvbSBcIi4vbW9kLnRzXCI7XG4gKlxuICogY29uc29sZS5sb2coXG4gKiAgIGxpbmsoXCJDbGljayBtZS5cIiwgXCJodHRwczovL2Rlbm8ubGFuZFwiKSxcbiAqICk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpbmsodGV4dDogc3RyaW5nLCB1cmw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBbXG4gICAgT1NDLFxuICAgIFwiOFwiLFxuICAgIFNFUCxcbiAgICBTRVAsXG4gICAgdXJsLFxuICAgIGJlbCxcbiAgICB0ZXh0LFxuICAgIE9TQyxcbiAgICBcIjhcIixcbiAgICBTRVAsXG4gICAgU0VQLFxuICAgIGJlbCxcbiAgXS5qb2luKFwiXCIpO1xufVxuXG4vKiogSW1hZ2Ugb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW1hZ2VPcHRpb25zIHtcbiAgd2lkdGg/OiBudW1iZXI7XG4gIGhlaWdodD86IG51bWJlcjtcbiAgcHJlc2VydmVBc3BlY3RSYXRpbz86IGJvb2xlYW47XG59XG5cbi8qKlxuICogQ3JlYXRlIGltYWdlLlxuICpcbiAqIEBwYXJhbSBidWZmZXIgIEltYWdlIGJ1ZmZlci5cbiAqIEBwYXJhbSBvcHRpb25zIEltYWdlIG9wdGlvbnMuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGltYWdlIH0gZnJvbSBcIi4vbW9kLnRzXCI7XG4gKlxuICogY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vZGVuby5sYW5kL2ltYWdlcy9oYXNocm9ja19zaW1wbGUucG5nXCIpO1xuICogY29uc3QgaW1hZ2VCdWZmZXI6IEFycmF5QnVmZmVyID0gYXdhaXQgcmVzcG9uc2UuYXJyYXlCdWZmZXIoKTtcbiAqIGNvbnNvbGUubG9nKFxuICogICBpbWFnZShpbWFnZUJ1ZmZlciksXG4gKiApO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbWFnZShcbiAgYnVmZmVyOiBzdHJpbmcgfCBBcnJheUJ1ZmZlcixcbiAgb3B0aW9ucz86IEltYWdlT3B0aW9ucyxcbik6IHN0cmluZyB7XG4gIGxldCByZXQgPSBgJHtPU0N9MTMzNztGaWxlPWlubGluZT0xYDtcblxuICBpZiAob3B0aW9ucz8ud2lkdGgpIHtcbiAgICByZXQgKz0gYDt3aWR0aD0ke29wdGlvbnMud2lkdGh9YDtcbiAgfVxuXG4gIGlmIChvcHRpb25zPy5oZWlnaHQpIHtcbiAgICByZXQgKz0gYDtoZWlnaHQ9JHtvcHRpb25zLmhlaWdodH1gO1xuICB9XG5cbiAgaWYgKG9wdGlvbnM/LnByZXNlcnZlQXNwZWN0UmF0aW8gPT09IGZhbHNlKSB7XG4gICAgcmV0ICs9IFwiO3ByZXNlcnZlQXNwZWN0UmF0aW89MFwiO1xuICB9XG5cbiAgcmV0dXJuIHJldCArIFwiOlwiICsgZW5jb2RlQmFzZTY0KGJ1ZmZlcikgKyBiZWw7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxZQUFZLFFBQVEsWUFBWTtBQUV6Qyw0QkFBNEIsR0FDNUIsTUFBTSxNQUFNO0FBQ1osb0NBQW9DLEdBQ3BDLE1BQU0sTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDckIsc0NBQXNDLEdBQ3RDLE1BQU0sTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDckIsbUJBQW1CLEdBQ25CLE1BQU0sTUFBTTtBQUVaLDhCQUE4QixHQUM5QixPQUFPLE1BQU0sTUFBTSxTQUFTO0FBQzVCLHlCQUF5QixHQUN6QixPQUFPLE1BQU0saUJBQWlCLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBRXpDOzs7O0NBSUMsR0FDRCxPQUFPLFNBQVMsU0FBUyxDQUFTLEVBQUUsQ0FBVTtFQUM1QyxJQUFJLE9BQU8sTUFBTSxVQUFVO0lBQ3pCLE9BQU8sQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztFQUN0QjtFQUNBLE9BQU8sQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFF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
// denoCacheMetadata=9261379996756690192,2777007313896237054