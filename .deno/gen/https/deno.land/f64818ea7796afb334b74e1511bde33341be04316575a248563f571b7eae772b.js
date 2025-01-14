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
 * @param text Link text.
 * @param url Link url.
 * ```
 * console.log(
 *   ansi.link("Click me.", "https://deno.land"),
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
 * @param buffer  Image buffer.
 * @param options Image options.
 * ```
 * const response = await fetch("https://deno.land/images/hashrock_simple.png");
 * const imageBuffer: ArrayBuffer = await response.arrayBuffer();
 * console.log(
 *   ansi.image(imageBuffer),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvYW5zaS9hbnNpX2VzY2FwZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZW5jb2RlQmFzZTY0IH0gZnJvbSBcIi4vZGVwcy50c1wiO1xuXG4vKiogRXNjYXBlIHNlcXVlbmNlOiBgXFx4MUJgICovXG5jb25zdCBFU0MgPSBcIlxceDFCXCI7XG4vKiogQ29udHJvbCBzZXF1ZW5jZSBpbnRybzogYFxceDFCW2AgKi9cbmNvbnN0IENTSSA9IGAke0VTQ31bYDtcbi8qKiBPcGVyYXRpbmcgc3lzdGVtIGNvbW1hbmQ6IGBcXHgxQl1gICovXG5jb25zdCBPU0MgPSBgJHtFU0N9XWA7XG4vKiogTGluayBzZXBhcmF0b3IgKi9cbmNvbnN0IFNFUCA9IFwiO1wiO1xuXG4vKiogUmluZyBhdWRpbyBiZWxsOiBgXFx1MDAwN2AgKi9cbmV4cG9ydCBjb25zdCBiZWwgPSBcIlxcdTAwMDdcIjtcbi8qKiBHZXQgY3Vyc29yIHBvc2l0aW9uLiAqL1xuZXhwb3J0IGNvbnN0IGN1cnNvclBvc2l0aW9uID0gYCR7Q1NJfTZuYDtcblxuLyoqXG4gKiBNb3ZlIGN1cnNvciB0byB4LCB5LCBjb3VudGluZyBmcm9tIHRoZSB0b3AgbGVmdCBjb3JuZXIuXG4gKiBAcGFyYW0geCBQb3NpdGlvbiBsZWZ0LlxuICogQHBhcmFtIHkgUG9zaXRpb24gdG9wLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3Vyc29yVG8oeDogbnVtYmVyLCB5PzogbnVtYmVyKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiB5ICE9PSBcIm51bWJlclwiKSB7XG4gICAgcmV0dXJuIGAke0NTSX0ke3h9R2A7XG4gIH1cbiAgcmV0dXJuIGAke0NTSX0ke3l9OyR7eH1IYDtcbn1cblxuLyoqXG4gKiBNb3ZlIGN1cnNvciBieSBvZmZzZXQuXG4gKiBAcGFyYW0geCBPZmZzZXQgbGVmdC5cbiAqIEBwYXJhbSB5IE9mZnNldCB0b3AuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjdXJzb3JNb3ZlKHg6IG51bWJlciwgeTogbnVtYmVyKTogc3RyaW5nIHtcbiAgbGV0IHJldCA9IFwiXCI7XG5cbiAgaWYgKHggPCAwKSB7XG4gICAgcmV0ICs9IGAke0NTSX0key14fURgO1xuICB9IGVsc2UgaWYgKHggPiAwKSB7XG4gICAgcmV0ICs9IGAke0NTSX0ke3h9Q2A7XG4gIH1cblxuICBpZiAoeSA8IDApIHtcbiAgICByZXQgKz0gYCR7Q1NJfSR7LXl9QWA7XG4gIH0gZWxzZSBpZiAoeSA+IDApIHtcbiAgICByZXQgKz0gYCR7Q1NJfSR7eX1CYDtcbiAgfVxuXG4gIHJldHVybiByZXQ7XG59XG5cbi8qKlxuICogTW92ZSBjdXJzb3IgdXAgYnkgbiBsaW5lcy5cbiAqIEBwYXJhbSBjb3VudCBOdW1iZXIgb2YgbGluZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjdXJzb3JVcChjb3VudCA9IDEpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Q1NJfSR7Y291bnR9QWA7XG59XG5cbi8qKlxuICogTW92ZSBjdXJzb3IgZG93biBieSBuIGxpbmVzLlxuICogQHBhcmFtIGNvdW50IE51bWJlciBvZiBsaW5lcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGN1cnNvckRvd24oY291bnQgPSAxKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke0NTSX0ke2NvdW50fUJgO1xufVxuXG4vKipcbiAqIE1vdmUgY3Vyc29yIGZvcndhcmQgYnkgbiBsaW5lcy5cbiAqIEBwYXJhbSBjb3VudCBOdW1iZXIgb2YgbGluZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjdXJzb3JGb3J3YXJkKGNvdW50ID0gMSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtDU0l9JHtjb3VudH1DYDtcbn1cblxuLyoqXG4gKiBNb3ZlIGN1cnNvciBiYWNrd2FyZCBieSBuIGxpbmVzLlxuICogQHBhcmFtIGNvdW50IE51bWJlciBvZiBsaW5lcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGN1cnNvckJhY2t3YXJkKGNvdW50ID0gMSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtDU0l9JHtjb3VudH1EYDtcbn1cblxuLyoqXG4gKiBNb3ZlIGN1cnNvciB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaW5lIG4gbGluZXMgZG93bi5cbiAqIEBwYXJhbSBjb3VudCBOdW1iZXIgb2YgbGluZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjdXJzb3JOZXh0TGluZShjb3VudCA9IDEpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Q1NJfUVgLnJlcGVhdChjb3VudCk7XG59XG5cbi8qKlxuICogTW92ZSBjdXJzb3IgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgbGluZSBuIGxpbmVzIHVwLlxuICogQHBhcmFtIGNvdW50IE51bWJlciBvZiBsaW5lcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGN1cnNvclByZXZMaW5lKGNvdW50ID0gMSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtDU0l9RmAucmVwZWF0KGNvdW50KTtcbn1cblxuLyoqIE1vdmUgY3Vyc29yIHRvIGZpcnN0IGNvbHVtbiBvZiBjdXJyZW50IHJvdy4gKi9cbmV4cG9ydCBjb25zdCBjdXJzb3JMZWZ0ID0gYCR7Q1NJfUdgO1xuLyoqIEhpZGUgY3Vyc29yLiAqL1xuZXhwb3J0IGNvbnN0IGN1cnNvckhpZGUgPSBgJHtDU0l9PzI1bGA7XG4vKiogU2hvdyBjdXJzb3IuICovXG5leHBvcnQgY29uc3QgY3Vyc29yU2hvdyA9IGAke0NTSX0/MjVoYDtcbi8qKiBTYXZlIGN1cnNvci4gKi9cbmV4cG9ydCBjb25zdCBjdXJzb3JTYXZlID0gYCR7RVNDfTdgO1xuLyoqIFJlc3RvcmUgY3Vyc29yLiAqL1xuZXhwb3J0IGNvbnN0IGN1cnNvclJlc3RvcmUgPSBgJHtFU0N9OGA7XG5cbi8qKlxuICogU2Nyb2xsIHdpbmRvdyB1cCBieSBuIGxpbmVzLlxuICogQHBhcmFtIGNvdW50IE51bWJlciBvZiBsaW5lcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjcm9sbFVwKGNvdW50ID0gMSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtDU0l9U2AucmVwZWF0KGNvdW50KTtcbn1cblxuLyoqXG4gKiBTY3JvbGwgd2luZG93IGRvd24gYnkgbiBsaW5lcy5cbiAqIEBwYXJhbSBjb3VudCBOdW1iZXIgb2YgbGluZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzY3JvbGxEb3duKGNvdW50ID0gMSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtDU0l9VGAucmVwZWF0KGNvdW50KTtcbn1cblxuLyoqIENsZWFyIHNjcmVlbi4gKi9cbmV4cG9ydCBjb25zdCBlcmFzZVNjcmVlbiA9IGAke0NTSX0ySmA7XG5cbi8qKlxuICogQ2xlYXIgc2NyZWVuIHVwIGJ5IG4gbGluZXMuXG4gKiBAcGFyYW0gY291bnQgTnVtYmVyIG9mIGxpbmVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXJhc2VVcChjb3VudCA9IDEpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7Q1NJfTFKYC5yZXBlYXQoY291bnQpO1xufVxuXG4vKipcbiAqIENsZWFyIHNjcmVlbiBkb3duIGJ5IG4gbGluZXMuXG4gKiBAcGFyYW0gY291bnQgTnVtYmVyIG9mIGxpbmVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXJhc2VEb3duKGNvdW50ID0gMSk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtDU0l9MEpgLnJlcGVhdChjb3VudCk7XG59XG5cbi8qKiBDbGVhciBjdXJyZW50IGxpbmUuICovXG5leHBvcnQgY29uc3QgZXJhc2VMaW5lID0gYCR7Q1NJfTJLYDtcbi8qKiBDbGVhciB0byBsaW5lIGVuZC4gKi9cbmV4cG9ydCBjb25zdCBlcmFzZUxpbmVFbmQgPSBgJHtDU0l9MEtgO1xuLyoqIENsZWFyIHRvIGxpbmUgc3RhcnQuICovXG5leHBvcnQgY29uc3QgZXJhc2VMaW5lU3RhcnQgPSBgJHtDU0l9MUtgO1xuXG4vKipcbiAqIENsZWFyIHNjcmVlbiBhbmQgbW92ZSBjdXJzb3IgYnkgbiBsaW5lcyB1cCBhbmQgbW92ZSBjdXJzb3IgdG8gZmlyc3QgY29sdW1uLlxuICogQHBhcmFtIGNvdW50IE51bWJlciBvZiBsaW5lcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVyYXNlTGluZXMoY291bnQ6IG51bWJlcik6IHN0cmluZyB7XG4gIGxldCBjbGVhciA9IFwiXCI7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgIGNsZWFyICs9IGVyYXNlTGluZSArIChpIDwgY291bnQgLSAxID8gY3Vyc29yVXAoKSA6IFwiXCIpO1xuICB9XG4gIGNsZWFyICs9IGN1cnNvckxlZnQ7XG4gIHJldHVybiBjbGVhcjtcbn1cblxuLyoqIENsZWFyIHRoZSB0ZXJtaW5hbCBzY3JlZW4uIChWaWV3cG9ydCkgKi9cbmV4cG9ydCBjb25zdCBjbGVhclNjcmVlbiA9IFwiXFx1MDAxQmNcIjtcblxuLyoqXG4gKiBDbGVhciB0aGUgd2hvbGUgdGVybWluYWwsIGluY2x1ZGluZyBzY3JvbGxiYWNrIGJ1ZmZlci5cbiAqIChOb3QganVzdCB0aGUgdmlzaWJsZSBwYXJ0IG9mIGl0KS5cbiAqL1xuZXhwb3J0IGNvbnN0IGNsZWFyVGVybWluYWwgPSBEZW5vLmJ1aWxkLm9zID09PSBcIndpbmRvd3NcIlxuICA/IGAke2VyYXNlU2NyZWVufSR7Q1NJfTBmYFxuICAvLyAxLiBFcmFzZXMgdGhlIHNjcmVlbiAoT25seSBkb25lIGluIGNhc2UgYDJgIGlzIG5vdCBzdXBwb3J0ZWQpXG4gIC8vIDIuIEVyYXNlcyB0aGUgd2hvbGUgc2NyZWVuIGluY2x1ZGluZyBzY3JvbGxiYWNrIGJ1ZmZlclxuICAvLyAzLiBNb3ZlcyBjdXJzb3IgdG8gdGhlIHRvcC1sZWZ0IHBvc2l0aW9uXG4gIC8vIE1vcmUgaW5mbzogaHR0cHM6Ly93d3cucmVhbC13b3JsZC1zeXN0ZW1zLmNvbS9kb2NzL0FOU0ljb2RlLmh0bWxcbiAgOiBgJHtlcmFzZVNjcmVlbn0ke0NTSX0zSiR7Q1NJfUhgO1xuXG4vKipcbiAqIENyZWF0ZSBsaW5rLlxuICogQHBhcmFtIHRleHQgTGluayB0ZXh0LlxuICogQHBhcmFtIHVybCBMaW5rIHVybC5cbiAqIGBgYFxuICogY29uc29sZS5sb2coXG4gKiAgIGFuc2kubGluayhcIkNsaWNrIG1lLlwiLCBcImh0dHBzOi8vZGVuby5sYW5kXCIpLFxuICogKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gbGluayh0ZXh0OiBzdHJpbmcsIHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIFtcbiAgICBPU0MsXG4gICAgXCI4XCIsXG4gICAgU0VQLFxuICAgIFNFUCxcbiAgICB1cmwsXG4gICAgYmVsLFxuICAgIHRleHQsXG4gICAgT1NDLFxuICAgIFwiOFwiLFxuICAgIFNFUCxcbiAgICBTRVAsXG4gICAgYmVsLFxuICBdLmpvaW4oXCJcIik7XG59XG5cbi8qKiBJbWFnZSBvcHRpb25zLiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbWFnZU9wdGlvbnMge1xuICB3aWR0aD86IG51bWJlcjtcbiAgaGVpZ2h0PzogbnVtYmVyO1xuICBwcmVzZXJ2ZUFzcGVjdFJhdGlvPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBDcmVhdGUgaW1hZ2UuXG4gKiBAcGFyYW0gYnVmZmVyICBJbWFnZSBidWZmZXIuXG4gKiBAcGFyYW0gb3B0aW9ucyBJbWFnZSBvcHRpb25zLlxuICogYGBgXG4gKiBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFwiaHR0cHM6Ly9kZW5vLmxhbmQvaW1hZ2VzL2hhc2hyb2NrX3NpbXBsZS5wbmdcIik7XG4gKiBjb25zdCBpbWFnZUJ1ZmZlcjogQXJyYXlCdWZmZXIgPSBhd2FpdCByZXNwb25zZS5hcnJheUJ1ZmZlcigpO1xuICogY29uc29sZS5sb2coXG4gKiAgIGFuc2kuaW1hZ2UoaW1hZ2VCdWZmZXIpLFxuICogKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW1hZ2UoXG4gIGJ1ZmZlcjogc3RyaW5nIHwgQXJyYXlCdWZmZXIsXG4gIG9wdGlvbnM/OiBJbWFnZU9wdGlvbnMsXG4pOiBzdHJpbmcge1xuICBsZXQgcmV0ID0gYCR7T1NDfTEzMzc7RmlsZT1pbmxpbmU9MWA7XG5cbiAgaWYgKG9wdGlvbnM/LndpZHRoKSB7XG4gICAgcmV0ICs9IGA7d2lkdGg9JHtvcHRpb25zLndpZHRofWA7XG4gIH1cblxuICBpZiAob3B0aW9ucz8uaGVpZ2h0KSB7XG4gICAgcmV0ICs9IGA7aGVpZ2h0PSR7b3B0aW9ucy5oZWlnaHR9YDtcbiAgfVxuXG4gIGlmIChvcHRpb25zPy5wcmVzZXJ2ZUFzcGVjdFJhdGlvID09PSBmYWxzZSkge1xuICAgIHJldCArPSBcIjtwcmVzZXJ2ZUFzcGVjdFJhdGlvPTBcIjtcbiAgfVxuXG4gIHJldHVybiByZXQgKyBcIjpcIiArIGVuY29kZUJhc2U2NChidWZmZXIpICsgYmVsO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsWUFBWSxRQUFRLFlBQVk7QUFFekMsNEJBQTRCLEdBQzVCLE1BQU0sTUFBTTtBQUNaLG9DQUFvQyxHQUNwQyxNQUFNLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3JCLHNDQUFzQyxHQUN0QyxNQUFNLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3JCLG1CQUFtQixHQUNuQixNQUFNLE1BQU07QUFFWiw4QkFBOEIsR0FDOUIsT0FBTyxNQUFNLE1BQU0sU0FBUztBQUM1Qix5QkFBeUIsR0FDekIsT0FBTyxNQUFNLGlCQUFpQixDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUV6Qzs7OztDQUlDLEdBQ0QsT0FBTyxTQUFTLFNBQVMsQ0FBUyxFQUFFLENBQVU7RUFDNUMsSUFBSSxPQUFPLE1BQU0sVUFBVTtJQUN6QixPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7RUFDdEI7RUFDQSxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDM0I7QUFFQTs7OztDQUlDLEdBQ0QsT0FBTyxTQUFTLFdBQVcsQ0FBUyxFQUFFLENBQVM7RUFDN0MsSUFBSSxNQUFNO0VBRVYs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
// denoCacheMetadata=6938867137816102593,4359818007922115591