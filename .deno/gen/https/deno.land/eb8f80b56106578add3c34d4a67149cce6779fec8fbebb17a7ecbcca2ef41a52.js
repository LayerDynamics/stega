import { GenericPrompt } from "./_generic_prompt.ts";
import { GenericSuggestions } from "./_generic_suggestions.ts";
import { parseNumber } from "./_utils.ts";
import { brightBlue, yellow } from "./deps.ts";
import { Figures } from "./figures.ts";
/** Number prompt representation. */ export class Number extends GenericSuggestions {
  /** Execute the prompt and show cursor on end. */ static prompt(options) {
    if (typeof options === "string") {
      options = {
        message: options
      };
    }
    return new this({
      pointer: brightBlue(Figures.POINTER_SMALL),
      prefix: yellow("? "),
      indent: " ",
      listPointer: brightBlue(Figures.POINTER),
      maxRows: 8,
      min: -Infinity,
      max: Infinity,
      float: false,
      round: 2,
      ...options,
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
        ...options.keys ?? {}
      }
    }).prompt();
  }
  /**
   * Inject prompt value. Can be used for unit tests or pre selections.
   * @param value Input value.
   */ static inject(value) {
    GenericPrompt.inject(value);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvcHJvbXB0L251bWJlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEtleUNvZGUgfSBmcm9tIFwiLi4va2V5Y29kZS9rZXlfY29kZS50c1wiO1xuaW1wb3J0IHsgR2VuZXJpY1Byb21wdCB9IGZyb20gXCIuL19nZW5lcmljX3Byb21wdC50c1wiO1xuaW1wb3J0IHtcbiAgR2VuZXJpY1N1Z2dlc3Rpb25zLFxuICBHZW5lcmljU3VnZ2VzdGlvbnNLZXlzLFxuICBHZW5lcmljU3VnZ2VzdGlvbnNPcHRpb25zLFxuICBHZW5lcmljU3VnZ2VzdGlvbnNTZXR0aW5ncyxcbn0gZnJvbSBcIi4vX2dlbmVyaWNfc3VnZ2VzdGlvbnMudHNcIjtcbmltcG9ydCB7IHBhcnNlTnVtYmVyIH0gZnJvbSBcIi4vX3V0aWxzLnRzXCI7XG5pbXBvcnQgeyBicmlnaHRCbHVlLCB5ZWxsb3cgfSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBGaWd1cmVzIH0gZnJvbSBcIi4vZmlndXJlcy50c1wiO1xuXG4vKiogTnVtYmVyIGtleSBvcHRpb25zLiAqL1xuZXhwb3J0IGludGVyZmFjZSBOdW1iZXJLZXlzIGV4dGVuZHMgR2VuZXJpY1N1Z2dlc3Rpb25zS2V5cyB7XG4gIGluY3JlYXNlVmFsdWU/OiBzdHJpbmdbXTtcbiAgZGVjcmVhc2VWYWx1ZT86IHN0cmluZ1tdO1xufVxuXG50eXBlIFVuc3VwcG9ydGVkT3B0aW9ucyA9IFwiZmlsZXNcIjtcblxuLyoqIE51bWJlciBwcm9tcHQgb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTnVtYmVyT3B0aW9uc1xuICBleHRlbmRzIE9taXQ8R2VuZXJpY1N1Z2dlc3Rpb25zT3B0aW9uczxudW1iZXIsIHN0cmluZz4sIFVuc3VwcG9ydGVkT3B0aW9ucz4ge1xuICBtaW4/OiBudW1iZXI7XG4gIG1heD86IG51bWJlcjtcbiAgZmxvYXQ/OiBib29sZWFuO1xuICByb3VuZD86IG51bWJlcjtcbiAga2V5cz86IE51bWJlcktleXM7XG59XG5cbi8qKiBOdW1iZXIgcHJvbXB0IHNldHRpbmdzLiAqL1xuaW50ZXJmYWNlIE51bWJlclNldHRpbmdzIGV4dGVuZHMgR2VuZXJpY1N1Z2dlc3Rpb25zU2V0dGluZ3M8bnVtYmVyLCBzdHJpbmc+IHtcbiAgbWluOiBudW1iZXI7XG4gIG1heDogbnVtYmVyO1xuICBmbG9hdDogYm9vbGVhbjtcbiAgcm91bmQ6IG51bWJlcjtcbiAga2V5cz86IE51bWJlcktleXM7XG59XG5cbi8qKiBOdW1iZXIgcHJvbXB0IHJlcHJlc2VudGF0aW9uLiAqL1xuZXhwb3J0IGNsYXNzIE51bWJlciBleHRlbmRzIEdlbmVyaWNTdWdnZXN0aW9uczxudW1iZXIsIHN0cmluZywgTnVtYmVyU2V0dGluZ3M+IHtcbiAgLyoqIEV4ZWN1dGUgdGhlIHByb21wdCBhbmQgc2hvdyBjdXJzb3Igb24gZW5kLiAqL1xuICBwdWJsaWMgc3RhdGljIHByb21wdChvcHRpb25zOiBzdHJpbmcgfCBOdW1iZXJPcHRpb25zKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIG9wdGlvbnMgPSB7IG1lc3NhZ2U6IG9wdGlvbnMgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IHRoaXMoe1xuICAgICAgcG9pbnRlcjogYnJpZ2h0Qmx1ZShGaWd1cmVzLlBPSU5URVJfU01BTEwpLFxuICAgICAgcHJlZml4OiB5ZWxsb3coXCI/IFwiKSxcbiAgICAgIGluZGVudDogXCIgXCIsXG4gICAgICBsaXN0UG9pbnRlcjogYnJpZ2h0Qmx1ZShGaWd1cmVzLlBPSU5URVIpLFxuICAgICAgbWF4Um93czogOCxcbiAgICAgIG1pbjogLUluZmluaXR5LFxuICAgICAgbWF4OiBJbmZpbml0eSxcbiAgICAgIGZsb2F0OiBmYWxzZSxcbiAgICAgIHJvdW5kOiAyLFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIGZpbGVzOiBmYWxzZSxcbiAgICAgIGtleXM6IHtcbiAgICAgICAgaW5jcmVhc2VWYWx1ZTogW1widXBcIiwgXCJ1XCIsIFwiK1wiXSxcbiAgICAgICAgZGVjcmVhc2VWYWx1ZTogW1wiZG93blwiLCBcImRcIiwgXCItXCJdLFxuICAgICAgICAuLi4ob3B0aW9ucy5rZXlzID8/IHt9KSxcbiAgICAgIH0sXG4gICAgfSkucHJvbXB0KCk7XG4gIH1cblxuICAvKipcbiAgICogSW5qZWN0IHByb21wdCB2YWx1ZS4gQ2FuIGJlIHVzZWQgZm9yIHVuaXQgdGVzdHMgb3IgcHJlIHNlbGVjdGlvbnMuXG4gICAqIEBwYXJhbSB2YWx1ZSBJbnB1dCB2YWx1ZS5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgaW5qZWN0KHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBHZW5lcmljUHJvbXB0LmluamVjdCh2YWx1ZSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgc3VjY2Vzcyh2YWx1ZTogbnVtYmVyKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICB0aGlzLnNhdmVTdWdnZXN0aW9ucyh2YWx1ZSk7XG4gICAgcmV0dXJuIHN1cGVyLnN1Y2Nlc3ModmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSB1c2VyIGlucHV0IGV2ZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgS2V5IGV2ZW50LlxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIGhhbmRsZUV2ZW50KGV2ZW50OiBLZXlDb2RlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgc3dpdGNoICh0cnVlKSB7XG4gICAgICBjYXNlIHRoaXMuc2V0dGluZ3Muc3VnZ2VzdGlvbnMgJiZcbiAgICAgICAgdGhpcy5pc0tleSh0aGlzLnNldHRpbmdzLmtleXMsIFwibmV4dFwiLCBldmVudCk6XG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmxpc3QpIHtcbiAgICAgICAgICB0aGlzLnNlbGVjdFByZXZpb3VzU3VnZ2VzdGlvbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuc2VsZWN0TmV4dFN1Z2dlc3Rpb24oKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdGhpcy5zZXR0aW5ncy5zdWdnZXN0aW9ucyAmJlxuICAgICAgICB0aGlzLmlzS2V5KHRoaXMuc2V0dGluZ3Mua2V5cywgXCJwcmV2aW91c1wiLCBldmVudCk6XG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmxpc3QpIHtcbiAgICAgICAgICB0aGlzLnNlbGVjdE5leHRTdWdnZXN0aW9uKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3RQcmV2aW91c1N1Z2dlc3Rpb24oKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdGhpcy5pc0tleSh0aGlzLnNldHRpbmdzLmtleXMsIFwiaW5jcmVhc2VWYWx1ZVwiLCBldmVudCk6XG4gICAgICAgIHRoaXMuaW5jcmVhc2VWYWx1ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdGhpcy5pc0tleSh0aGlzLnNldHRpbmdzLmtleXMsIFwiZGVjcmVhc2VWYWx1ZVwiLCBldmVudCk6XG4gICAgICAgIHRoaXMuZGVjcmVhc2VWYWx1ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGF3YWl0IHN1cGVyLmhhbmRsZUV2ZW50KGV2ZW50KTtcbiAgICB9XG4gIH1cblxuICAvKiogSW5jcmVhc2UgaW5wdXQgbnVtYmVyLiAqL1xuICBwdWJsaWMgaW5jcmVhc2VWYWx1ZSgpIHtcbiAgICB0aGlzLm1hbmlwdWxhdGVJbmRleChmYWxzZSk7XG4gIH1cblxuICAvKiogRGVjcmVhc2UgaW5wdXQgbnVtYmVyLiAqL1xuICBwdWJsaWMgZGVjcmVhc2VWYWx1ZSgpIHtcbiAgICB0aGlzLm1hbmlwdWxhdGVJbmRleCh0cnVlKTtcbiAgfVxuXG4gIC8qKiBEZWNyZWFzZS9pbmNyZWFzZSBpbnB1dCBudW1iZXIuICovXG4gIHByb3RlY3RlZCBtYW5pcHVsYXRlSW5kZXgoZGVjcmVhc2U/OiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMuaW5wdXRWYWx1ZVt0aGlzLmlucHV0SW5kZXhdID09PSBcIi1cIikge1xuICAgICAgdGhpcy5pbnB1dEluZGV4Kys7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5pbnB1dFZhbHVlLmxlbmd0aCAmJiAodGhpcy5pbnB1dEluZGV4ID4gdGhpcy5pbnB1dFZhbHVlLmxlbmd0aCAtIDEpXG4gICAgKSB7XG4gICAgICB0aGlzLmlucHV0SW5kZXgtLTtcbiAgICB9XG5cbiAgICBjb25zdCBkZWNpbWFsSW5kZXg6IG51bWJlciA9IHRoaXMuaW5wdXRWYWx1ZS5pbmRleE9mKFwiLlwiKTtcbiAgICBjb25zdCBbYWJzLCBkZWNdID0gdGhpcy5pbnB1dFZhbHVlLnNwbGl0KFwiLlwiKTtcblxuICAgIGlmIChkZWMgJiYgdGhpcy5pbnB1dEluZGV4ID09PSBkZWNpbWFsSW5kZXgpIHtcbiAgICAgIHRoaXMuaW5wdXRJbmRleC0tO1xuICAgIH1cblxuICAgIGNvbnN0IGluRGVjaW1hbDogYm9vbGVhbiA9IGRlY2ltYWxJbmRleCAhPT0gLTEgJiZcbiAgICAgIHRoaXMuaW5wdXRJbmRleCA+IGRlY2ltYWxJbmRleDtcbiAgICBsZXQgdmFsdWU6IHN0cmluZyA9IChpbkRlY2ltYWwgPyBkZWMgOiBhYnMpIHx8IFwiMFwiO1xuICAgIGNvbnN0IG9sZExlbmd0aDogbnVtYmVyID0gdGhpcy5pbnB1dFZhbHVlLmxlbmd0aDtcbiAgICBjb25zdCBpbmRleDogbnVtYmVyID0gaW5EZWNpbWFsXG4gICAgICA/IHRoaXMuaW5wdXRJbmRleCAtIGRlY2ltYWxJbmRleCAtIDFcbiAgICAgIDogdGhpcy5pbnB1dEluZGV4O1xuICAgIGNvbnN0IGluY3JlYXNlVmFsdWUgPSBNYXRoLnBvdygxMCwgdmFsdWUubGVuZ3RoIC0gaW5kZXggLSAxKTtcblxuICAgIHZhbHVlID0gKHBhcnNlSW50KHZhbHVlKSArIChkZWNyZWFzZSA/IC1pbmNyZWFzZVZhbHVlIDogaW5jcmVhc2VWYWx1ZSkpXG4gICAgICAudG9TdHJpbmcoKTtcblxuICAgIHRoaXMuaW5wdXRWYWx1ZSA9ICFkZWNcbiAgICAgID8gdmFsdWVcbiAgICAgIDogKHRoaXMuaW5wdXRJbmRleCA+IGRlY2ltYWxJbmRleFxuICAgICAgICA/IGFicyArIFwiLlwiICsgdmFsdWVcbiAgICAgICAgOiB2YWx1ZSArIFwiLlwiICsgZGVjKTtcblxuICAgIGlmICh0aGlzLmlucHV0VmFsdWUubGVuZ3RoID4gb2xkTGVuZ3RoKSB7XG4gICAgICB0aGlzLmlucHV0SW5kZXgrKztcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgdGhpcy5pbnB1dFZhbHVlLmxlbmd0aCA8IG9sZExlbmd0aCAmJlxuICAgICAgdGhpcy5pbnB1dFZhbHVlW3RoaXMuaW5wdXRJbmRleCAtIDFdICE9PSBcIi1cIlxuICAgICkge1xuICAgICAgdGhpcy5pbnB1dEluZGV4LS07XG4gICAgfVxuXG4gICAgdGhpcy5pbnB1dEluZGV4ID0gTWF0aC5tYXgoXG4gICAgICAwLFxuICAgICAgTWF0aC5taW4odGhpcy5pbnB1dEluZGV4LCB0aGlzLmlucHV0VmFsdWUubGVuZ3RoIC0gMSksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgY2hhciB0byBpbnB1dC5cbiAgICogQHBhcmFtIGNoYXIgQ2hhci5cbiAgICovXG4gIHByb3RlY3RlZCBhZGRDaGFyKGNoYXI6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmIChpc051bWVyaWMoY2hhcikpIHtcbiAgICAgIHN1cGVyLmFkZENoYXIoY2hhcik7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHRoaXMuc2V0dGluZ3MuZmxvYXQgJiZcbiAgICAgIGNoYXIgPT09IFwiLlwiICYmXG4gICAgICB0aGlzLmlucHV0VmFsdWUuaW5kZXhPZihcIi5cIikgPT09IC0xICYmXG4gICAgICAodGhpcy5pbnB1dFZhbHVlWzBdID09PSBcIi1cIiA/IHRoaXMuaW5wdXRJbmRleCA+IDEgOiB0aGlzLmlucHV0SW5kZXggPiAwKVxuICAgICkge1xuICAgICAgc3VwZXIuYWRkQ2hhcihjaGFyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgaW5wdXQgdmFsdWUuXG4gICAqIEBwYXJhbSB2YWx1ZSBVc2VyIGlucHV0IHZhbHVlLlxuICAgKiBAcmV0dXJuIFRydWUgb24gc3VjY2VzcywgZmFsc2Ugb3IgZXJyb3IgbWVzc2FnZSBvbiBlcnJvci5cbiAgICovXG4gIHByb3RlY3RlZCB2YWxpZGF0ZSh2YWx1ZTogc3RyaW5nKTogYm9vbGVhbiB8IHN0cmluZyB7XG4gICAgaWYgKCFpc051bWVyaWModmFsdWUpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgdmFsOiBudW1iZXIgPSBwYXJzZUZsb2F0KHZhbHVlKTtcblxuICAgIGlmICh2YWwgPiB0aGlzLnNldHRpbmdzLm1heCkge1xuICAgICAgcmV0dXJuIGBWYWx1ZSBtdXN0IGJlIGxvd2VyIG9yIGVxdWFsIHRoYW4gJHt0aGlzLnNldHRpbmdzLm1heH1gO1xuICAgIH1cblxuICAgIGlmICh2YWwgPCB0aGlzLnNldHRpbmdzLm1pbikge1xuICAgICAgcmV0dXJuIGBWYWx1ZSBtdXN0IGJlIGdyZWF0ZXIgb3IgZXF1YWwgdGhhbiAke3RoaXMuc2V0dGluZ3MubWlufWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogTWFwIGlucHV0IHZhbHVlIHRvIG91dHB1dCB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIElucHV0IHZhbHVlLlxuICAgKiBAcmV0dXJuIE91dHB1dCB2YWx1ZS5cbiAgICovXG4gIHByb3RlY3RlZCB0cmFuc2Zvcm0odmFsdWU6IHN0cmluZyk6IG51bWJlciB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgdmFsOiBudW1iZXIgPSBwYXJzZUZsb2F0KHZhbHVlKTtcblxuICAgIGlmICh0aGlzLnNldHRpbmdzLmZsb2F0KSB7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWwudG9GaXhlZCh0aGlzLnNldHRpbmdzLnJvdW5kKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JtYXQgb3V0cHV0IHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgT3V0cHV0IHZhbHVlLlxuICAgKi9cbiAgcHJvdGVjdGVkIGZvcm1hdCh2YWx1ZTogbnVtYmVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuXG4gIC8qKiBHZXQgaW5wdXQgaW5wdXQuICovXG4gIHByb3RlY3RlZCBnZXRWYWx1ZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmlucHV0VmFsdWU7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNOdW1lcmljKHZhbHVlOiBzdHJpbmcgfCBudW1iZXIpOiB2YWx1ZSBpcyBudW1iZXIgfCBzdHJpbmcge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiIHx8ICghIXZhbHVlICYmICFpc05hTihwYXJzZU51bWJlcih2YWx1ZSkpKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLGFBQWEsUUFBUSx1QkFBdUI7QUFDckQsU0FDRSxrQkFBa0IsUUFJYiw0QkFBNEI7QUFDbkMsU0FBUyxXQUFXLFFBQVEsY0FBYztBQUMxQyxTQUFTLFVBQVUsRUFBRSxNQUFNLFFBQVEsWUFBWTtBQUMvQyxTQUFTLE9BQU8sUUFBUSxlQUFlO0FBNkJ2QyxrQ0FBa0MsR0FDbEMsT0FBTyxNQUFNLGVBQWU7RUFDMUIsK0NBQStDLEdBQy9DLE9BQWMsT0FBTyxPQUErQixFQUFtQjtJQUNyRSxJQUFJLE9BQU8sWUFBWSxVQUFVO01BQy9CLFVBQVU7UUFBRSxTQUFTO01BQVE7SUFDL0I7SUFFQSxPQUFPLElBQUksSUFBSSxDQUFDO01BQ2QsU0FBUyxXQUFXLFFBQVEsYUFBYTtNQUN6QyxRQUFRLE9BQU87TUFDZixRQUFRO01BQ1IsYUFBYSxXQUFXLFFBQVEsT0FBTztNQUN2QyxT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
// denoCacheMetadata=4963464238948179847,10279867163158226162