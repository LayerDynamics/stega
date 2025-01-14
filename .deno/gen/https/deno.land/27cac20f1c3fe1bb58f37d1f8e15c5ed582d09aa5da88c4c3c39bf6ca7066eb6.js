import { brightBlue, dim, green, red, yellow } from "./deps.ts";
import { Figures } from "./figures.ts";
import { GenericList } from "./_generic_list.ts";
import { GenericPrompt } from "./_generic_prompt.ts";
/** Checkbox prompt representation. */ export class Checkbox extends GenericList {
  /**
   * Inject prompt value. Can be used for unit tests or pre selections.
   * @param value Array of input values.
   */ static inject(value) {
    GenericPrompt.inject(value);
  }
  /** Execute the prompt and show cursor on end. */ static prompt(options) {
    return new this({
      pointer: brightBlue(Figures.POINTER_SMALL),
      prefix: yellow("? "),
      indent: " ",
      listPointer: brightBlue(Figures.POINTER),
      maxRows: 10,
      searchLabel: brightBlue(Figures.SEARCH),
      minOptions: 0,
      maxOptions: Infinity,
      check: green(Figures.TICK),
      uncheck: red(Figures.CROSS),
      ...options,
      keys: {
        check: [
          "space"
        ],
        ...options.keys ?? {}
      },
      options: Checkbox.mapOptions(options)
    }).prompt();
  }
  /**
   * Create list separator.
   * @param label Separator label.
   */ static separator(label) {
    return {
      ...super.separator(label),
      icon: false
    };
  }
  /**
   * Map string option values to options and set option defaults.
   * @param options Checkbox options.
   */ static mapOptions(options) {
    return options.options.map((item)=>typeof item === "string" ? {
        value: item
      } : item).map((item)=>({
        ...this.mapOption(item),
        checked: typeof item.checked === "undefined" && options.default && options.default.indexOf(item.value) !== -1 ? true : !!item.checked,
        icon: typeof item.icon === "undefined" ? true : item.icon
      }));
  }
  /**
   * Render checkbox option.
   * @param item        Checkbox option settings.
   * @param isSelected  Set to true if option is selected.
   */ getListItem(item, isSelected) {
    let line = this.settings.indent;
    // pointer
    line += isSelected ? this.settings.listPointer + " " : "  ";
    // icon
    if (item.icon) {
      let check = item.checked ? this.settings.check + " " : this.settings.uncheck + " ";
      if (item.disabled) {
        check = dim(check);
      }
      line += check;
    } else {
      line += "  ";
    }
    // value
    line += `${isSelected && !item.disabled ? this.highlight(item.name, (val)=>val) : this.highlight(item.name)}`;
    return line;
  }
  /** Get value of checked options. */ getValue() {
    return this.settings.options.filter((item)=>item.checked).map((item)=>item.value);
  }
  /**
   * Handle user input event.
   * @param event Key event.
   */ async handleEvent(event) {
    switch(true){
      case this.isKey(this.settings.keys, "check", event):
        this.checkValue();
        break;
      default:
        await super.handleEvent(event);
    }
  }
  /** Check selected option. */ checkValue() {
    const item = this.options[this.listIndex];
    if (item.disabled) {
      this.setErrorMessage("This option is disabled and cannot be changed.");
    } else {
      item.checked = !item.checked;
    }
  }
  /**
   * Validate input value.
   * @param value User input value.
   * @return True on success, false or error message on error.
   */ validate(value) {
    const isValidValue = Array.isArray(value) && value.every((val)=>typeof val === "string" && val.length > 0 && this.settings.options.findIndex((option)=>option.value === val) !== -1);
    if (!isValidValue) {
      return false;
    }
    if (value.length < this.settings.minOptions) {
      return `The minimum number of options is ${this.settings.minOptions} but got ${value.length}.`;
    }
    if (value.length > this.settings.maxOptions) {
      return `The maximum number of options is ${this.settings.maxOptions} but got ${value.length}.`;
    }
    return true;
  }
  /**
   * Map input value to output value.
   * @param value Input value.
   * @return Output value.
   */ transform(value) {
    return value.map((val)=>val.trim());
  }
  /**
   * Format output value.
   * @param value Output value.
   */ format(value) {
    return value.map((val)=>this.getOptionByValue(val)?.name ?? val).join(", ");
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvcHJvbXB0L2NoZWNrYm94LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgS2V5Q29kZSB9IGZyb20gXCIuLi9rZXljb2RlL21vZC50c1wiO1xuaW1wb3J0IHsgYnJpZ2h0Qmx1ZSwgZGltLCBncmVlbiwgcmVkLCB5ZWxsb3cgfSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBGaWd1cmVzIH0gZnJvbSBcIi4vZmlndXJlcy50c1wiO1xuaW1wb3J0IHtcbiAgR2VuZXJpY0xpc3QsXG4gIEdlbmVyaWNMaXN0S2V5cyxcbiAgR2VuZXJpY0xpc3RPcHRpb24sXG4gIEdlbmVyaWNMaXN0T3B0aW9ucyxcbiAgR2VuZXJpY0xpc3RPcHRpb25TZXR0aW5ncyxcbiAgR2VuZXJpY0xpc3RTZXR0aW5ncyxcbn0gZnJvbSBcIi4vX2dlbmVyaWNfbGlzdC50c1wiO1xuaW1wb3J0IHsgR2VuZXJpY1Byb21wdCB9IGZyb20gXCIuL19nZW5lcmljX3Byb21wdC50c1wiO1xuXG4vKiogQ2hlY2tib3gga2V5IG9wdGlvbnMuICovXG5leHBvcnQgaW50ZXJmYWNlIENoZWNrYm94S2V5cyBleHRlbmRzIEdlbmVyaWNMaXN0S2V5cyB7XG4gIGNoZWNrPzogc3RyaW5nW107XG59XG5cbi8qKiBDaGVja2JveCBvcHRpb24gb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2hlY2tib3hPcHRpb24gZXh0ZW5kcyBHZW5lcmljTGlzdE9wdGlvbiB7XG4gIGNoZWNrZWQ/OiBib29sZWFuO1xuICBpY29uPzogYm9vbGVhbjtcbn1cblxuLyoqIENoZWNrYm94IG9wdGlvbiBzZXR0aW5ncy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2hlY2tib3hPcHRpb25TZXR0aW5ncyBleHRlbmRzIEdlbmVyaWNMaXN0T3B0aW9uU2V0dGluZ3Mge1xuICBjaGVja2VkOiBib29sZWFuO1xuICBpY29uOiBib29sZWFuO1xufVxuXG4vKiogQ2hlY2tib3ggb3B0aW9ucyB0eXBlLiAqL1xuZXhwb3J0IHR5cGUgQ2hlY2tib3hWYWx1ZU9wdGlvbnMgPSAoc3RyaW5nIHwgQ2hlY2tib3hPcHRpb24pW107XG4vKiogQ2hlY2tib3ggb3B0aW9uIHNldHRpbmdzIHR5cGUuICovXG5leHBvcnQgdHlwZSBDaGVja2JveFZhbHVlU2V0dGluZ3MgPSBDaGVja2JveE9wdGlvblNldHRpbmdzW107XG5cbi8qKiBDaGVja2JveCBwcm9tcHQgb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2hlY2tib3hPcHRpb25zXG4gIGV4dGVuZHMgR2VuZXJpY0xpc3RPcHRpb25zPHN0cmluZ1tdLCBzdHJpbmdbXT4ge1xuICBvcHRpb25zOiBDaGVja2JveFZhbHVlT3B0aW9ucztcbiAgY2hlY2s/OiBzdHJpbmc7XG4gIHVuY2hlY2s/OiBzdHJpbmc7XG4gIG1pbk9wdGlvbnM/OiBudW1iZXI7XG4gIG1heE9wdGlvbnM/OiBudW1iZXI7XG4gIGtleXM/OiBDaGVja2JveEtleXM7XG59XG5cbi8qKiBDaGVja2JveCBwcm9tcHQgc2V0dGluZ3MuICovXG5pbnRlcmZhY2UgQ2hlY2tib3hTZXR0aW5ncyBleHRlbmRzIEdlbmVyaWNMaXN0U2V0dGluZ3M8c3RyaW5nW10sIHN0cmluZ1tdPiB7XG4gIG9wdGlvbnM6IENoZWNrYm94VmFsdWVTZXR0aW5ncztcbiAgY2hlY2s6IHN0cmluZztcbiAgdW5jaGVjazogc3RyaW5nO1xuICBtaW5PcHRpb25zOiBudW1iZXI7XG4gIG1heE9wdGlvbnM6IG51bWJlcjtcbiAga2V5cz86IENoZWNrYm94S2V5cztcbn1cblxuLyoqIENoZWNrYm94IHByb21wdCByZXByZXNlbnRhdGlvbi4gKi9cbmV4cG9ydCBjbGFzcyBDaGVja2JveFxuICBleHRlbmRzIEdlbmVyaWNMaXN0PHN0cmluZ1tdLCBzdHJpbmdbXSwgQ2hlY2tib3hTZXR0aW5ncz4ge1xuICAvKipcbiAgICogSW5qZWN0IHByb21wdCB2YWx1ZS4gQ2FuIGJlIHVzZWQgZm9yIHVuaXQgdGVzdHMgb3IgcHJlIHNlbGVjdGlvbnMuXG4gICAqIEBwYXJhbSB2YWx1ZSBBcnJheSBvZiBpbnB1dCB2YWx1ZXMuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGluamVjdCh2YWx1ZTogc3RyaW5nW10pOiB2b2lkIHtcbiAgICBHZW5lcmljUHJvbXB0LmluamVjdCh2YWx1ZSk7XG4gIH1cblxuICAvKiogRXhlY3V0ZSB0aGUgcHJvbXB0IGFuZCBzaG93IGN1cnNvciBvbiBlbmQuICovXG4gIHB1YmxpYyBzdGF0aWMgcHJvbXB0KG9wdGlvbnM6IENoZWNrYm94T3B0aW9ucyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gbmV3IHRoaXMoe1xuICAgICAgcG9pbnRlcjogYnJpZ2h0Qmx1ZShGaWd1cmVzLlBPSU5URVJfU01BTEwpLFxuICAgICAgcHJlZml4OiB5ZWxsb3coXCI/IFwiKSxcbiAgICAgIGluZGVudDogXCIgXCIsXG4gICAgICBsaXN0UG9pbnRlcjogYnJpZ2h0Qmx1ZShGaWd1cmVzLlBPSU5URVIpLFxuICAgICAgbWF4Um93czogMTAsXG4gICAgICBzZWFyY2hMYWJlbDogYnJpZ2h0Qmx1ZShGaWd1cmVzLlNFQVJDSCksXG4gICAgICBtaW5PcHRpb25zOiAwLFxuICAgICAgbWF4T3B0aW9uczogSW5maW5pdHksXG4gICAgICBjaGVjazogZ3JlZW4oRmlndXJlcy5USUNLKSxcbiAgICAgIHVuY2hlY2s6IHJlZChGaWd1cmVzLkNST1NTKSxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBrZXlzOiB7XG4gICAgICAgIGNoZWNrOiBbXCJzcGFjZVwiXSxcbiAgICAgICAgLi4uKG9wdGlvbnMua2V5cyA/PyB7fSksXG4gICAgICB9LFxuICAgICAgb3B0aW9uczogQ2hlY2tib3gubWFwT3B0aW9ucyhvcHRpb25zKSxcbiAgICB9KS5wcm9tcHQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbGlzdCBzZXBhcmF0b3IuXG4gICAqIEBwYXJhbSBsYWJlbCBTZXBhcmF0b3IgbGFiZWwuXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHNlcGFyYXRvcihsYWJlbD86IHN0cmluZyk6IENoZWNrYm94T3B0aW9uIHtcbiAgICByZXR1cm4ge1xuICAgICAgLi4uc3VwZXIuc2VwYXJhdG9yKGxhYmVsKSxcbiAgICAgIGljb246IGZhbHNlLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogTWFwIHN0cmluZyBvcHRpb24gdmFsdWVzIHRvIG9wdGlvbnMgYW5kIHNldCBvcHRpb24gZGVmYXVsdHMuXG4gICAqIEBwYXJhbSBvcHRpb25zIENoZWNrYm94IG9wdGlvbnMuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIG1hcE9wdGlvbnMob3B0aW9uczogQ2hlY2tib3hPcHRpb25zKTogQ2hlY2tib3hWYWx1ZVNldHRpbmdzIHtcbiAgICByZXR1cm4gb3B0aW9ucy5vcHRpb25zXG4gICAgICAubWFwKChpdGVtOiBzdHJpbmcgfCBDaGVja2JveE9wdGlvbikgPT5cbiAgICAgICAgdHlwZW9mIGl0ZW0gPT09IFwic3RyaW5nXCIgPyB7IHZhbHVlOiBpdGVtIH0gOiBpdGVtXG4gICAgICApXG4gICAgICAubWFwKChpdGVtKSA9PiAoe1xuICAgICAgICAuLi50aGlzLm1hcE9wdGlvbihpdGVtKSxcbiAgICAgICAgY2hlY2tlZDogdHlwZW9mIGl0ZW0uY2hlY2tlZCA9PT0gXCJ1bmRlZmluZWRcIiAmJiBvcHRpb25zLmRlZmF1bHQgJiZcbiAgICAgICAgICAgIG9wdGlvbnMuZGVmYXVsdC5pbmRleE9mKGl0ZW0udmFsdWUpICE9PSAtMVxuICAgICAgICAgID8gdHJ1ZVxuICAgICAgICAgIDogISFpdGVtLmNoZWNrZWQsXG4gICAgICAgIGljb246IHR5cGVvZiBpdGVtLmljb24gPT09IFwidW5kZWZpbmVkXCIgPyB0cnVlIDogaXRlbS5pY29uLFxuICAgICAgfSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbmRlciBjaGVja2JveCBvcHRpb24uXG4gICAqIEBwYXJhbSBpdGVtICAgICAgICBDaGVja2JveCBvcHRpb24gc2V0dGluZ3MuXG4gICAqIEBwYXJhbSBpc1NlbGVjdGVkICBTZXQgdG8gdHJ1ZSBpZiBvcHRpb24gaXMgc2VsZWN0ZWQuXG4gICAqL1xuICBwcm90ZWN0ZWQgZ2V0TGlzdEl0ZW0oXG4gICAgaXRlbTogQ2hlY2tib3hPcHRpb25TZXR0aW5ncyxcbiAgICBpc1NlbGVjdGVkPzogYm9vbGVhbixcbiAgKTogc3RyaW5nIHtcbiAgICBsZXQgbGluZSA9IHRoaXMuc2V0dGluZ3MuaW5kZW50O1xuXG4gICAgLy8gcG9pbnRlclxuICAgIGxpbmUgKz0gaXNTZWxlY3RlZCA/IHRoaXMuc2V0dGluZ3MubGlzdFBvaW50ZXIgKyBcIiBcIiA6IFwiICBcIjtcblxuICAgIC8vIGljb25cbiAgICBpZiAoaXRlbS5pY29uKSB7XG4gICAgICBsZXQgY2hlY2sgPSBpdGVtLmNoZWNrZWRcbiAgICAgICAgPyB0aGlzLnNldHRpbmdzLmNoZWNrICsgXCIgXCJcbiAgICAgICAgOiB0aGlzLnNldHRpbmdzLnVuY2hlY2sgKyBcIiBcIjtcbiAgICAgIGlmIChpdGVtLmRpc2FibGVkKSB7XG4gICAgICAgIGNoZWNrID0gZGltKGNoZWNrKTtcbiAgICAgIH1cbiAgICAgIGxpbmUgKz0gY2hlY2s7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpbmUgKz0gXCIgIFwiO1xuICAgIH1cblxuICAgIC8vIHZhbHVlXG4gICAgbGluZSArPSBgJHtcbiAgICAgIGlzU2VsZWN0ZWQgJiYgIWl0ZW0uZGlzYWJsZWRcbiAgICAgICAgPyB0aGlzLmhpZ2hsaWdodChpdGVtLm5hbWUsICh2YWwpID0+IHZhbClcbiAgICAgICAgOiB0aGlzLmhpZ2hsaWdodChpdGVtLm5hbWUpXG4gICAgfWA7XG5cbiAgICByZXR1cm4gbGluZTtcbiAgfVxuXG4gIC8qKiBHZXQgdmFsdWUgb2YgY2hlY2tlZCBvcHRpb25zLiAqL1xuICBwcm90ZWN0ZWQgZ2V0VmFsdWUoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLnNldHRpbmdzLm9wdGlvbnNcbiAgICAgIC5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0uY2hlY2tlZClcbiAgICAgIC5tYXAoKGl0ZW0pID0+IGl0ZW0udmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSB1c2VyIGlucHV0IGV2ZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgS2V5IGV2ZW50LlxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIGhhbmRsZUV2ZW50KGV2ZW50OiBLZXlDb2RlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgc3dpdGNoICh0cnVlKSB7XG4gICAgICBjYXNlIHRoaXMuaXNLZXkodGhpcy5zZXR0aW5ncy5rZXlzLCBcImNoZWNrXCIsIGV2ZW50KTpcbiAgICAgICAgdGhpcy5jaGVja1ZhbHVlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYXdhaXQgc3VwZXIuaGFuZGxlRXZlbnQoZXZlbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDaGVjayBzZWxlY3RlZCBvcHRpb24uICovXG4gIHByb3RlY3RlZCBjaGVja1ZhbHVlKCk6IHZvaWQge1xuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLm9wdGlvbnNbdGhpcy5saXN0SW5kZXhdO1xuICAgIGlmIChpdGVtLmRpc2FibGVkKSB7XG4gICAgICB0aGlzLnNldEVycm9yTWVzc2FnZShcIlRoaXMgb3B0aW9uIGlzIGRpc2FibGVkIGFuZCBjYW5ub3QgYmUgY2hhbmdlZC5cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGl0ZW0uY2hlY2tlZCA9ICFpdGVtLmNoZWNrZWQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIGlucHV0IHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgVXNlciBpbnB1dCB2YWx1ZS5cbiAgICogQHJldHVybiBUcnVlIG9uIHN1Y2Nlc3MsIGZhbHNlIG9yIGVycm9yIG1lc3NhZ2Ugb24gZXJyb3IuXG4gICAqL1xuICBwcm90ZWN0ZWQgdmFsaWRhdGUodmFsdWU6IHN0cmluZ1tdKTogYm9vbGVhbiB8IHN0cmluZyB7XG4gICAgY29uc3QgaXNWYWxpZFZhbHVlID0gQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiZcbiAgICAgIHZhbHVlLmV2ZXJ5KCh2YWwpID0+XG4gICAgICAgIHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIgJiZcbiAgICAgICAgdmFsLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5vcHRpb25zLmZpbmRJbmRleCgob3B0aW9uOiBDaGVja2JveE9wdGlvblNldHRpbmdzKSA9PlxuICAgICAgICAgICAgb3B0aW9uLnZhbHVlID09PSB2YWxcbiAgICAgICAgICApICE9PSAtMVxuICAgICAgKTtcblxuICAgIGlmICghaXNWYWxpZFZhbHVlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHZhbHVlLmxlbmd0aCA8IHRoaXMuc2V0dGluZ3MubWluT3B0aW9ucykge1xuICAgICAgcmV0dXJuIGBUaGUgbWluaW11bSBudW1iZXIgb2Ygb3B0aW9ucyBpcyAke3RoaXMuc2V0dGluZ3MubWluT3B0aW9uc30gYnV0IGdvdCAke3ZhbHVlLmxlbmd0aH0uYDtcbiAgICB9XG4gICAgaWYgKHZhbHVlLmxlbmd0aCA+IHRoaXMuc2V0dGluZ3MubWF4T3B0aW9ucykge1xuICAgICAgcmV0dXJuIGBUaGUgbWF4aW11bSBudW1iZXIgb2Ygb3B0aW9ucyBpcyAke3RoaXMuc2V0dGluZ3MubWF4T3B0aW9uc30gYnV0IGdvdCAke3ZhbHVlLmxlbmd0aH0uYDtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXAgaW5wdXQgdmFsdWUgdG8gb3V0cHV0IHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgSW5wdXQgdmFsdWUuXG4gICAqIEByZXR1cm4gT3V0cHV0IHZhbHVlLlxuICAgKi9cbiAgcHJvdGVjdGVkIHRyYW5zZm9ybSh2YWx1ZTogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHZhbHVlLm1hcCgodmFsKSA9PiB2YWwudHJpbSgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JtYXQgb3V0cHV0IHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgT3V0cHV0IHZhbHVlLlxuICAgKi9cbiAgcHJvdGVjdGVkIGZvcm1hdCh2YWx1ZTogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIHJldHVybiB2YWx1ZS5tYXAoKHZhbCkgPT4gdGhpcy5nZXRPcHRpb25CeVZhbHVlKHZhbCk/Lm5hbWUgPz8gdmFsKVxuICAgICAgLmpvaW4oXCIsIFwiKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLFNBQVMsVUFBVSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sUUFBUSxZQUFZO0FBQ2hFLFNBQVMsT0FBTyxRQUFRLGVBQWU7QUFDdkMsU0FDRSxXQUFXLFFBTU4scUJBQXFCO0FBQzVCLFNBQVMsYUFBYSxRQUFRLHVCQUF1QjtBQTZDckQsb0NBQW9DLEdBQ3BDLE9BQU8sTUFBTSxpQkFDSDtFQUNSOzs7R0FHQyxHQUNELE9BQWMsT0FBTyxLQUFlLEVBQVE7SUFDMUMsY0FBYyxNQUFNLENBQUM7RUFDdkI7RUFFQSwrQ0FBK0MsR0FDL0MsT0FBYyxPQUFPLE9BQXdCLEVBQXFCO0lBQ2hFLE9BQU8sSUFBSSxJQUFJLENBQUM7TUFDZCxTQUFTLFdBQVcsUUFBUSxhQUFhO01BQ3pDLFFBQVEsT0FBTztNQUNmLFFBQVE7TUFDUixhQUFhLFdBQVcsUUFBUSxPQUFPO01BQ3ZDLFNBQVM7TUFDVCxhQUFhLFdBQVcsUUFBUSxNQUFNO01BQ3RDLFlBQVk7TUFDWixZQUFZO01BQ1osT0FBTyxNQUFNLFFBQVEsSUFBSTtNQUN6QixTQUFTLElBQUksUUFBUSxLQUFLO01BQzFCLEdBQUcsT0FBTztNQUNWLE1BQU07UUFDSixPQUFPO1VBQUM7U0FBUTtRQUNoQixHQUFJLFFBQVEsSUFBSSxJQUFJLENBQUMsQ0FBQztNQUN4QjtNQUNBLFNBQVMsU0FBUyxVQUFVLENBQUM7SUFDL0Is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
// denoCacheMetadata=156045764937706967,17049867901347975178