import { GenericPrompt } from "./_generic_prompt.ts";
import { GenericSuggestions } from "./_generic_suggestions.ts";
import { parseNumber } from "./_utils.ts";
/**
 * Number prompt representation.
 *
 * ```ts
 * import { Number } from "./mod.ts";
 *
 * const age: number = await Number.prompt("How old are you?");
 * ```
 */ export class Number extends GenericSuggestions {
  settings;
  /** Execute the prompt with provided message or options. */ static prompt(options) {
    return new this(options).prompt();
  }
  /**
   * Inject prompt value. If called, the prompt doesn't prompt for an input and
   * returns immediately the injected value. Can be used for unit tests or pre
   * selections.
   *
   * @param value Input value.
   */ static inject(value) {
    GenericPrompt.inject(value);
  }
  constructor(options){
    super();
    if (typeof options === "string") {
      options = {
        message: options
      };
    }
    this.settings = this.getDefaultSettings(options);
  }
  getDefaultSettings(options) {
    const settings = super.getDefaultSettings(options);
    return {
      ...settings,
      min: options.min ?? -Infinity,
      max: options.max ?? Infinity,
      float: options.float ?? false,
      round: options.round ?? 2,
      files: false,
      keys: {
        increaseValue: [
          "up",
          "u",
          "+"
        ],
        decreaseValue: [
          "down",
          "d",
          "-"
        ],
        ...settings.keys ?? {}
      }
    };
  }
  success(value) {
    this.saveSuggestions(value);
    return super.success(value);
  }
  /**
   * Handle user input event.
   * @param event Key event.
   */ async handleEvent(event) {
    switch(true){
      case this.settings.suggestions && this.isKey(this.settings.keys, "next", event):
        if (this.settings.list) {
          this.selectPreviousSuggestion();
        } else {
          this.selectNextSuggestion();
        }
        break;
      case this.settings.suggestions && this.isKey(this.settings.keys, "previous", event):
        if (this.settings.list) {
          this.selectNextSuggestion();
        } else {
          this.selectPreviousSuggestion();
        }
        break;
      case this.isKey(this.settings.keys, "increaseValue", event):
        this.increaseValue();
        break;
      case this.isKey(this.settings.keys, "decreaseValue", event):
        this.decreaseValue();
        break;
      default:
        await super.handleEvent(event);
    }
  }
  /** Increase input number. */ increaseValue() {
    this.manipulateIndex(false);
  }
  /** Decrease input number. */ decreaseValue() {
    this.manipulateIndex(true);
  }
  /** Decrease/increase input number. */ manipulateIndex(decrease) {
    if (this.inputValue[this.inputIndex] === "-") {
      this.inputIndex++;
    }
    if (this.inputValue.length && this.inputIndex > this.inputValue.length - 1) {
      this.inputIndex--;
    }
    const decimalIndex = this.inputValue.indexOf(".");
    const [abs, dec] = this.inputValue.split(".");
    if (dec && this.inputIndex === decimalIndex) {
      this.inputIndex--;
    }
    const inDecimal = decimalIndex !== -1 && this.inputIndex > decimalIndex;
    let value = (inDecimal ? dec : abs) || "0";
    const oldLength = this.inputValue.length;
    const index = inDecimal ? this.inputIndex - decimalIndex - 1 : this.inputIndex;
    const increaseValue = Math.pow(10, value.length - index - 1);
    value = (parseInt(value) + (decrease ? -increaseValue : increaseValue)).toString();
    this.inputValue = !dec ? value : this.inputIndex > decimalIndex ? abs + "." + value : value + "." + dec;
    if (this.inputValue.length > oldLength) {
      this.inputIndex++;
    } else if (this.inputValue.length < oldLength && this.inputValue[this.inputIndex - 1] !== "-") {
      this.inputIndex--;
    }
    this.inputIndex = Math.max(0, Math.min(this.inputIndex, this.inputValue.length - 1));
  }
  /**
   * Add char to input.
   * @param char Char.
   */ addChar(char) {
    if (isNumeric(char)) {
      super.addChar(char);
    } else if (this.settings.float && char === "." && this.inputValue.indexOf(".") === -1 && (this.inputValue[0] === "-" ? this.inputIndex > 1 : this.inputIndex > 0)) {
      super.addChar(char);
    }
  }
  /**
   * Validate input value.
   * @param value User input value.
   * @return True on success, false or error message on error.
   */ validate(value) {
    if (!isNumeric(value)) {
      return false;
    }
    const val = parseFloat(value);
    if (val > this.settings.max) {
      return `Value must be lower or equal than ${this.settings.max}`;
    }
    if (val < this.settings.min) {
      return `Value must be greater or equal than ${this.settings.min}`;
    }
    return true;
  }
  /**
   * Map input value to output value.
   * @param value Input value.
   * @return Output value.
   */ transform(value) {
    const val = parseFloat(value);
    if (this.settings.float) {
      return parseFloat(val.toFixed(this.settings.round));
    }
    return val;
  }
  /**
   * Format output value.
   * @param value Output value.
   */ format(value) {
    return value.toString();
  }
  /** Get input input. */ getValue() {
    return this.inputValue;
  }
}
function isNumeric(value) {
  return typeof value === "number" || !!value && !isNaN(parseNumber(value));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYxLjAuMC1yYy4zL3Byb21wdC9udW1iZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBLZXlDb2RlIH0gZnJvbSBcIi4uL2tleWNvZGUva2V5X2NvZGUudHNcIjtcbmltcG9ydCB7IEdlbmVyaWNQcm9tcHQgfSBmcm9tIFwiLi9fZ2VuZXJpY19wcm9tcHQudHNcIjtcbmltcG9ydCB7XG4gIEdlbmVyaWNTdWdnZXN0aW9ucyxcbiAgR2VuZXJpY1N1Z2dlc3Rpb25zS2V5cyxcbiAgR2VuZXJpY1N1Z2dlc3Rpb25zT3B0aW9ucyxcbiAgR2VuZXJpY1N1Z2dlc3Rpb25zU2V0dGluZ3MsXG59IGZyb20gXCIuL19nZW5lcmljX3N1Z2dlc3Rpb25zLnRzXCI7XG5pbXBvcnQgeyBwYXJzZU51bWJlciB9IGZyb20gXCIuL191dGlscy50c1wiO1xuXG50eXBlIFVuc3VwcG9ydGVkT3B0aW9ucyA9IFwiZmlsZXNcIjtcblxuLyoqIE51bWJlciBwcm9tcHQgb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTnVtYmVyT3B0aW9uc1xuICBleHRlbmRzIE9taXQ8R2VuZXJpY1N1Z2dlc3Rpb25zT3B0aW9uczxudW1iZXIsIHN0cmluZz4sIFVuc3VwcG9ydGVkT3B0aW9ucz4ge1xuICAvKiogS2V5bWFwIHRvIGFzc2lnbiBrZXkgbmFtZXMgdG8gcHJvbXB0IGFjdGlvbnMuICovXG4gIGtleXM/OiBOdW1iZXJLZXlzO1xuICAvKiogSWYgc2V0LCB0aGUgcHJvbXB0IHZhbHVlIG11c3QgYmUgZ3JlYXRlciBvciBlcXVhbCB0aGFuIG1pbi4gKi9cbiAgbWluPzogbnVtYmVyO1xuICAvKiogSWYgc2V0LCB0aGUgcHJvbXB0IHZhbHVlIG11c3QgYmUgbG93ZXIgb3IgZXF1YWwgdGhhbiBtYXguICovXG4gIG1heD86IG51bWJlcjtcbiAgLyoqIEVuYWJsZSBmbG9hdGluZyBwb2ludCBudW1iZXJzLiAqL1xuICBmbG9hdD86IGJvb2xlYW47XG4gIC8qKiBSb3VuZCBmbG9hdGluZyBwb2ludCBudW1iZXJzLiAqL1xuICByb3VuZD86IG51bWJlcjtcbn1cblxuLyoqIE51bWJlciBwcm9tcHQgc2V0dGluZ3MuICovXG5pbnRlcmZhY2UgTnVtYmVyU2V0dGluZ3MgZXh0ZW5kcyBHZW5lcmljU3VnZ2VzdGlvbnNTZXR0aW5nczxudW1iZXIsIHN0cmluZz4ge1xuICBtaW46IG51bWJlcjtcbiAgbWF4OiBudW1iZXI7XG4gIGZsb2F0OiBib29sZWFuO1xuICByb3VuZDogbnVtYmVyO1xuICBrZXlzPzogTnVtYmVyS2V5cztcbn1cblxuLyoqIE51bWJlciBwcm9tcHQga2V5bWFwLiAqL1xuZXhwb3J0IGludGVyZmFjZSBOdW1iZXJLZXlzIGV4dGVuZHMgR2VuZXJpY1N1Z2dlc3Rpb25zS2V5cyB7XG4gIC8qKiBJbmNyZWFzZSB2YWx1ZSBrZXltYXAuIERlZmF1bHQgaXMgYFtcInVwXCIsIFwidVwiLCBcIitcIl1gLiAqL1xuICBpbmNyZWFzZVZhbHVlPzogc3RyaW5nW107XG4gIC8qKiBEZWNyZWFzZSB2YWx1ZSBrZXltYXAuIERlZmF1bHQgaXMgYFtcImRvd25cIiwgXCJkXCIsIFwiLVwiXWAuICovXG4gIGRlY3JlYXNlVmFsdWU/OiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBOdW1iZXIgcHJvbXB0IHJlcHJlc2VudGF0aW9uLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBOdW1iZXIgfSBmcm9tIFwiLi9tb2QudHNcIjtcbiAqXG4gKiBjb25zdCBhZ2U6IG51bWJlciA9IGF3YWl0IE51bWJlci5wcm9tcHQoXCJIb3cgb2xkIGFyZSB5b3U/XCIpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBOdW1iZXIgZXh0ZW5kcyBHZW5lcmljU3VnZ2VzdGlvbnM8bnVtYmVyLCBzdHJpbmc+IHtcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IHNldHRpbmdzOiBOdW1iZXJTZXR0aW5ncztcblxuICAvKiogRXhlY3V0ZSB0aGUgcHJvbXB0IHdpdGggcHJvdmlkZWQgbWVzc2FnZSBvciBvcHRpb25zLiAqL1xuICBwdWJsaWMgc3RhdGljIHByb21wdChvcHRpb25zOiBzdHJpbmcgfCBOdW1iZXJPcHRpb25zKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICByZXR1cm4gbmV3IHRoaXMob3B0aW9ucykucHJvbXB0KCk7XG4gIH1cblxuICAvKipcbiAgICogSW5qZWN0IHByb21wdCB2YWx1ZS4gSWYgY2FsbGVkLCB0aGUgcHJvbXB0IGRvZXNuJ3QgcHJvbXB0IGZvciBhbiBpbnB1dCBhbmRcbiAgICogcmV0dXJucyBpbW1lZGlhdGVseSB0aGUgaW5qZWN0ZWQgdmFsdWUuIENhbiBiZSB1c2VkIGZvciB1bml0IHRlc3RzIG9yIHByZVxuICAgKiBzZWxlY3Rpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgSW5wdXQgdmFsdWUuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGluamVjdCh2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgR2VuZXJpY1Byb21wdC5pbmplY3QodmFsdWUpO1xuICB9XG5cbiAgY29uc3RydWN0b3Iob3B0aW9uczogc3RyaW5nIHwgTnVtYmVyT3B0aW9ucykge1xuICAgIHN1cGVyKCk7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBvcHRpb25zID0geyBtZXNzYWdlOiBvcHRpb25zIH07XG4gICAgfVxuICAgIHRoaXMuc2V0dGluZ3MgPSB0aGlzLmdldERlZmF1bHRTZXR0aW5ncyhvcHRpb25zKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXREZWZhdWx0U2V0dGluZ3Mob3B0aW9uczogTnVtYmVyT3B0aW9ucyk6IE51bWJlclNldHRpbmdzIHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHN1cGVyLmdldERlZmF1bHRTZXR0aW5ncyhvcHRpb25zKTtcbiAgICByZXR1cm4ge1xuICAgICAgLi4uc2V0dGluZ3MsXG4gICAgICBtaW46IG9wdGlvbnMubWluID8/IC1JbmZpbml0eSxcbiAgICAgIG1heDogb3B0aW9ucy5tYXggPz8gSW5maW5pdHksXG4gICAgICBmbG9hdDogb3B0aW9ucy5mbG9hdCA/PyBmYWxzZSxcbiAgICAgIHJvdW5kOiBvcHRpb25zLnJvdW5kID8/IDIsXG4gICAgICBmaWxlczogZmFsc2UsXG4gICAgICBrZXlzOiB7XG4gICAgICAgIGluY3JlYXNlVmFsdWU6IFtcInVwXCIsIFwidVwiLCBcIitcIl0sXG4gICAgICAgIGRlY3JlYXNlVmFsdWU6IFtcImRvd25cIiwgXCJkXCIsIFwiLVwiXSxcbiAgICAgICAgLi4uKHNldHRpbmdzLmtleXMgPz8ge30pLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgcHJvdGVjdGVkIHN1Y2Nlc3ModmFsdWU6IG51bWJlcik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgdGhpcy5zYXZlU3VnZ2VzdGlvbnModmFsdWUpO1xuICAgIHJldHVybiBzdXBlci5zdWNjZXNzKHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgdXNlciBpbnB1dCBldmVudC5cbiAgICogQHBhcmFtIGV2ZW50IEtleSBldmVudC5cbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBoYW5kbGVFdmVudChldmVudDogS2V5Q29kZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgICAgY2FzZSB0aGlzLnNldHRpbmdzLnN1Z2dlc3Rpb25zICYmXG4gICAgICAgIHRoaXMuaXNLZXkodGhpcy5zZXR0aW5ncy5rZXlzLCBcIm5leHRcIiwgZXZlbnQpOlxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5saXN0KSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3RQcmV2aW91c1N1Z2dlc3Rpb24oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnNlbGVjdE5leHRTdWdnZXN0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIHRoaXMuc2V0dGluZ3Muc3VnZ2VzdGlvbnMgJiZcbiAgICAgICAgdGhpcy5pc0tleSh0aGlzLnNldHRpbmdzLmtleXMsIFwicHJldmlvdXNcIiwgZXZlbnQpOlxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5saXN0KSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3ROZXh0U3VnZ2VzdGlvbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuc2VsZWN0UHJldmlvdXNTdWdnZXN0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIHRoaXMuaXNLZXkodGhpcy5zZXR0aW5ncy5rZXlzLCBcImluY3JlYXNlVmFsdWVcIiwgZXZlbnQpOlxuICAgICAgICB0aGlzLmluY3JlYXNlVmFsdWUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIHRoaXMuaXNLZXkodGhpcy5zZXR0aW5ncy5rZXlzLCBcImRlY3JlYXNlVmFsdWVcIiwgZXZlbnQpOlxuICAgICAgICB0aGlzLmRlY3JlYXNlVmFsdWUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhd2FpdCBzdXBlci5oYW5kbGVFdmVudChldmVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEluY3JlYXNlIGlucHV0IG51bWJlci4gKi9cbiAgcHVibGljIGluY3JlYXNlVmFsdWUoKSB7XG4gICAgdGhpcy5tYW5pcHVsYXRlSW5kZXgoZmFsc2UpO1xuICB9XG5cbiAgLyoqIERlY3JlYXNlIGlucHV0IG51bWJlci4gKi9cbiAgcHVibGljIGRlY3JlYXNlVmFsdWUoKSB7XG4gICAgdGhpcy5tYW5pcHVsYXRlSW5kZXgodHJ1ZSk7XG4gIH1cblxuICAvKiogRGVjcmVhc2UvaW5jcmVhc2UgaW5wdXQgbnVtYmVyLiAqL1xuICBwcm90ZWN0ZWQgbWFuaXB1bGF0ZUluZGV4KGRlY3JlYXNlPzogYm9vbGVhbikge1xuICAgIGlmICh0aGlzLmlucHV0VmFsdWVbdGhpcy5pbnB1dEluZGV4XSA9PT0gXCItXCIpIHtcbiAgICAgIHRoaXMuaW5wdXRJbmRleCsrO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHRoaXMuaW5wdXRWYWx1ZS5sZW5ndGggJiYgKHRoaXMuaW5wdXRJbmRleCA+IHRoaXMuaW5wdXRWYWx1ZS5sZW5ndGggLSAxKVxuICAgICkge1xuICAgICAgdGhpcy5pbnB1dEluZGV4LS07XG4gICAgfVxuXG4gICAgY29uc3QgZGVjaW1hbEluZGV4OiBudW1iZXIgPSB0aGlzLmlucHV0VmFsdWUuaW5kZXhPZihcIi5cIik7XG4gICAgY29uc3QgW2FicywgZGVjXSA9IHRoaXMuaW5wdXRWYWx1ZS5zcGxpdChcIi5cIik7XG5cbiAgICBpZiAoZGVjICYmIHRoaXMuaW5wdXRJbmRleCA9PT0gZGVjaW1hbEluZGV4KSB7XG4gICAgICB0aGlzLmlucHV0SW5kZXgtLTtcbiAgICB9XG5cbiAgICBjb25zdCBpbkRlY2ltYWw6IGJvb2xlYW4gPSBkZWNpbWFsSW5kZXggIT09IC0xICYmXG4gICAgICB0aGlzLmlucHV0SW5kZXggPiBkZWNpbWFsSW5kZXg7XG4gICAgbGV0IHZhbHVlOiBzdHJpbmcgPSAoaW5EZWNpbWFsID8gZGVjIDogYWJzKSB8fCBcIjBcIjtcbiAgICBjb25zdCBvbGRMZW5ndGg6IG51bWJlciA9IHRoaXMuaW5wdXRWYWx1ZS5sZW5ndGg7XG4gICAgY29uc3QgaW5kZXg6IG51bWJlciA9IGluRGVjaW1hbFxuICAgICAgPyB0aGlzLmlucHV0SW5kZXggLSBkZWNpbWFsSW5kZXggLSAxXG4gICAgICA6IHRoaXMuaW5wdXRJbmRleDtcbiAgICBjb25zdCBpbmNyZWFzZVZhbHVlID0gTWF0aC5wb3coMTAsIHZhbHVlLmxlbmd0aCAtIGluZGV4IC0gMSk7XG5cbiAgICB2YWx1ZSA9IChwYXJzZUludCh2YWx1ZSkgKyAoZGVjcmVhc2UgPyAtaW5jcmVhc2VWYWx1ZSA6IGluY3JlYXNlVmFsdWUpKVxuICAgICAgLnRvU3RyaW5nKCk7XG5cbiAgICB0aGlzLmlucHV0VmFsdWUgPSAhZGVjXG4gICAgICA/IHZhbHVlXG4gICAgICA6ICh0aGlzLmlucHV0SW5kZXggPiBkZWNpbWFsSW5kZXhcbiAgICAgICAgPyBhYnMgKyBcIi5cIiArIHZhbHVlXG4gICAgICAgIDogdmFsdWUgKyBcIi5cIiArIGRlYyk7XG5cbiAgICBpZiAodGhpcy5pbnB1dFZhbHVlLmxlbmd0aCA+IG9sZExlbmd0aCkge1xuICAgICAgdGhpcy5pbnB1dEluZGV4Kys7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHRoaXMuaW5wdXRWYWx1ZS5sZW5ndGggPCBvbGRMZW5ndGggJiZcbiAgICAgIHRoaXMuaW5wdXRWYWx1ZVt0aGlzLmlucHV0SW5kZXggLSAxXSAhPT0gXCItXCJcbiAgICApIHtcbiAgICAgIHRoaXMuaW5wdXRJbmRleC0tO1xuICAgIH1cblxuICAgIHRoaXMuaW5wdXRJbmRleCA9IE1hdGgubWF4KFxuICAgICAgMCxcbiAgICAgIE1hdGgubWluKHRoaXMuaW5wdXRJbmRleCwgdGhpcy5pbnB1dFZhbHVlLmxlbmd0aCAtIDEpLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGNoYXIgdG8gaW5wdXQuXG4gICAqIEBwYXJhbSBjaGFyIENoYXIuXG4gICAqL1xuICBwcm90ZWN0ZWQgYWRkQ2hhcihjaGFyOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoaXNOdW1lcmljKGNoYXIpKSB7XG4gICAgICBzdXBlci5hZGRDaGFyKGNoYXIpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICB0aGlzLnNldHRpbmdzLmZsb2F0ICYmXG4gICAgICBjaGFyID09PSBcIi5cIiAmJlxuICAgICAgdGhpcy5pbnB1dFZhbHVlLmluZGV4T2YoXCIuXCIpID09PSAtMSAmJlxuICAgICAgKHRoaXMuaW5wdXRWYWx1ZVswXSA9PT0gXCItXCIgPyB0aGlzLmlucHV0SW5kZXggPiAxIDogdGhpcy5pbnB1dEluZGV4ID4gMClcbiAgICApIHtcbiAgICAgIHN1cGVyLmFkZENoYXIoY2hhcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIGlucHV0IHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgVXNlciBpbnB1dCB2YWx1ZS5cbiAgICogQHJldHVybiBUcnVlIG9uIHN1Y2Nlc3MsIGZhbHNlIG9yIGVycm9yIG1lc3NhZ2Ugb24gZXJyb3IuXG4gICAqL1xuICBwcm90ZWN0ZWQgdmFsaWRhdGUodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4gfCBzdHJpbmcge1xuICAgIGlmICghaXNOdW1lcmljKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHZhbDogbnVtYmVyID0gcGFyc2VGbG9hdCh2YWx1ZSk7XG5cbiAgICBpZiAodmFsID4gdGhpcy5zZXR0aW5ncy5tYXgpIHtcbiAgICAgIHJldHVybiBgVmFsdWUgbXVzdCBiZSBsb3dlciBvciBlcXVhbCB0aGFuICR7dGhpcy5zZXR0aW5ncy5tYXh9YDtcbiAgICB9XG5cbiAgICBpZiAodmFsIDwgdGhpcy5zZXR0aW5ncy5taW4pIHtcbiAgICAgIHJldHVybiBgVmFsdWUgbXVzdCBiZSBncmVhdGVyIG9yIGVxdWFsIHRoYW4gJHt0aGlzLnNldHRpbmdzLm1pbn1gO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hcCBpbnB1dCB2YWx1ZSB0byBvdXRwdXQgdmFsdWUuXG4gICAqIEBwYXJhbSB2YWx1ZSBJbnB1dCB2YWx1ZS5cbiAgICogQHJldHVybiBPdXRwdXQgdmFsdWUuXG4gICAqL1xuICBwcm90ZWN0ZWQgdHJhbnNmb3JtKHZhbHVlOiBzdHJpbmcpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IHZhbDogbnVtYmVyID0gcGFyc2VGbG9hdCh2YWx1ZSk7XG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncy5mbG9hdCkge1xuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodmFsLnRvRml4ZWQodGhpcy5zZXR0aW5ncy5yb3VuZCkpO1xuICAgIH1cblxuICAgIHJldHVybiB2YWw7XG4gIH1cblxuICAvKipcbiAgICogRm9ybWF0IG91dHB1dCB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIE91dHB1dCB2YWx1ZS5cbiAgICovXG4gIHByb3RlY3RlZCBmb3JtYXQodmFsdWU6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cblxuICAvKiogR2V0IGlucHV0IGlucHV0LiAqL1xuICBwcm90ZWN0ZWQgZ2V0VmFsdWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5pbnB1dFZhbHVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzTnVtZXJpYyh2YWx1ZTogc3RyaW5nIHwgbnVtYmVyKTogdmFsdWUgaXMgbnVtYmVyIHwgc3RyaW5nIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiB8fCAoISF2YWx1ZSAmJiAhaXNOYU4ocGFyc2VOdW1iZXIodmFsdWUpKSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBUyxhQUFhLFFBQVEsdUJBQXVCO0FBQ3JELFNBQ0Usa0JBQWtCLFFBSWIsNEJBQTRCO0FBQ25DLFNBQVMsV0FBVyxRQUFRLGNBQWM7QUFvQzFDOzs7Ozs7OztDQVFDLEdBQ0QsT0FBTyxNQUFNLGVBQWU7RUFDUCxTQUF5QjtFQUU1Qyx5REFBeUQsR0FDekQsT0FBYyxPQUFPLE9BQStCLEVBQW1CO0lBQ3JFLE9BQU8sSUFBSSxJQUFJLENBQUMsU0FBUyxNQUFNO0VBQ2pDO0VBRUE7Ozs7OztHQU1DLEdBQ0QsT0FBYyxPQUFPLEtBQWEsRUFBUTtJQUN4QyxjQUFjLE1BQU0sQ0FBQztFQUN2QjtFQUVBLFlBQVksT0FBK0IsQ0FBRTtJQUMzQyxLQUFLO0lBQ0wsSUFBSSxPQUFPLFlBQVksVUFBVTtNQUMvQixVQUFVO1FBQUUsU0FBUztNQUFRO0lBQy9CO0lBQ0EsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUM7RUFDMUM7RUFFTyxtQkFBbUIsT0FBc0IsRUFBa0I7SUFDaEUsTUFBTSxXQUFXLEtBQUssQ0FBQyxtQkFBbUI7SUFDMUMs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
// denoCacheMetadata=16455781827445662890,5917071584261412759