import { GenericInput } from "./_generic_input.ts";
import { bold, brightBlue, dim, dirname, join, normalize, stripColor, underline } from "./deps.ts";
import { Figures, getFiguresByKeys } from "./_figures.ts";
import { distance } from "../_utils/distance.ts";
const sep = Deno.build.os === "windows" ? "\\" : "/";
/** Generic input prompt representation. */ export class GenericSuggestions extends GenericInput {
  suggestionsIndex = -1;
  suggestionsOffset = 0;
  suggestions = [];
  #hasReadPermissions;
  getDefaultSettings(options) {
    const settings = super.getDefaultSettings(options);
    return {
      ...settings,
      listPointer: options.listPointer ?? brightBlue(Figures.POINTER),
      maxRows: options.maxRows ?? 8,
      keys: {
        complete: [
          "tab"
        ],
        next: [
          "up"
        ],
        previous: [
          "down"
        ],
        nextPage: [
          "pageup"
        ],
        previousPage: [
          "pagedown"
        ],
        ...settings.keys ?? {}
      }
    };
  }
  get localStorage() {
    // Keep support for deno < 1.10.
    if (this.settings.id && "localStorage" in window) {
      try {
        // deno-lint-ignore no-explicit-any
        return window.localStorage;
      } catch (_) {
      // Ignore error if --location is not set.
      }
    }
    return null;
  }
  loadSuggestions() {
    if (this.settings.id) {
      const json = this.localStorage?.getItem(this.settings.id);
      const suggestions = json ? JSON.parse(json) : [];
      if (!Array.isArray(suggestions)) {
        return [];
      }
      return suggestions;
    }
    return [];
  }
  saveSuggestions(...suggestions) {
    if (this.settings.id) {
      this.localStorage?.setItem(this.settings.id, JSON.stringify([
        ...suggestions,
        ...this.loadSuggestions()
      ].filter(uniqueSuggestions)));
    }
  }
  async render() {
    if (this.settings.files && this.#hasReadPermissions === undefined) {
      const status = await Deno.permissions.request({
        name: "read"
      });
      // disable path completion if read permissions are denied.
      this.#hasReadPermissions = status.state === "granted";
    }
    await this.match();
    return super.render();
  }
  async match() {
    this.suggestions = await this.getSuggestions();
    this.suggestionsIndex = Math.max(this.getCurrentInputValue().trim().length === 0 ? -1 : 0, Math.min(this.suggestions.length - 1, this.suggestionsIndex));
    this.suggestionsOffset = Math.max(0, Math.min(this.suggestions.length - this.getListHeight(), this.suggestionsOffset));
  }
  input() {
    return super.input() + dim(this.getSuggestion());
  }
  getSuggestion() {
    return this.suggestions[this.suggestionsIndex]?.toString().substr(this.getCurrentInputValue().length) ?? "";
  }
  async getUserSuggestions(input) {
    return typeof this.settings.suggestions === "function" ? await this.settings.suggestions(input) : this.settings.suggestions ?? [];
  }
  #isFileModeEnabled() {
    return !!this.settings.files && this.#hasReadPermissions === true;
  }
  async getFileSuggestions(input) {
    if (!this.#isFileModeEnabled()) {
      return [];
    }
    const path = await Deno.stat(input).then((file)=>file.isDirectory ? input : dirname(input)).catch(()=>dirname(input));
    return await listDir(path, this.settings.files);
  }
  async getSuggestions() {
    const input = this.getCurrentInputValue();
    const suggestions = [
      ...this.loadSuggestions(),
      ...await this.getUserSuggestions(input),
      ...await this.getFileSuggestions(input)
    ].filter(uniqueSuggestions);
    if (!input.length) {
      return suggestions;
    }
    return suggestions.filter((value)=>stripColor(value.toString()).toLowerCase().startsWith(input.toLowerCase())).sort((a, b)=>distance((a || a).toString(), input) - distance((b || b).toString(), input));
  }
  body() {
    return this.getList() + this.getInfo();
  }
  getInfo() {
    if (!this.settings.info) {
      return "";
    }
    const selected = this.suggestionsIndex + 1;
    const matched = this.suggestions.length;
    const actions = [];
    if (this.suggestions.length) {
      if (this.settings.list) {
        actions.push([
          "Next",
          getFiguresByKeys(this.settings.keys?.next ?? [])
        ], [
          "Previous",
          getFiguresByKeys(this.settings.keys?.previous ?? [])
        ], [
          "Next Page",
          getFiguresByKeys(this.settings.keys?.nextPage ?? [])
        ], [
          "Previous Page",
          getFiguresByKeys(this.settings.keys?.previousPage ?? [])
        ]);
      } else {
        actions.push([
          "Next",
          getFiguresByKeys(this.settings.keys?.next ?? [])
        ], [
          "Previous",
          getFiguresByKeys(this.settings.keys?.previous ?? [])
        ]);
      }
      actions.push([
        "Complete",
        getFiguresByKeys(this.settings.keys?.complete ?? [])
      ]);
    }
    actions.push([
      "Submit",
      getFiguresByKeys(this.settings.keys?.submit ?? [])
    ]);
    let info = this.settings.indent;
    if (this.suggestions.length) {
      info += brightBlue(Figures.INFO) + bold(` ${selected}/${matched} `);
    }
    info += actions.map((cur)=>`${cur[0]}: ${bold(cur[1].join(" "))}`).join(", ");
    return info;
  }
  getList() {
    if (!this.suggestions.length || !this.settings.list) {
      return "";
    }
    const list = [];
    const height = this.getListHeight();
    for(let i = this.suggestionsOffset; i < this.suggestionsOffset + height; i++){
      list.push(this.getListItem(this.suggestions[i], this.suggestionsIndex === i));
    }
    if (list.length && this.settings.info) {
      list.push("");
    }
    return list.join("\n");
  }
  /**
   * Render option.
   * @param value        Option.
   * @param isSelected  Set to true if option is selected.
   */ getListItem(value, isSelected) {
    let line = this.settings.indent ?? "";
    line += isSelected ? `${this.settings.listPointer} ` : "  ";
    if (isSelected) {
      line += underline(this.highlight(value));
    } else {
      line += this.highlight(value);
    }
    return line;
  }
  /** Get suggestions row height. */ getListHeight(suggestions = this.suggestions) {
    return Math.min(suggestions.length, this.settings.maxRows || suggestions.length);
  }
  /**
   * Handle user input event.
   * @param event Key event.
   */ async handleEvent(event) {
    switch(true){
      case this.isKey(this.settings.keys, "next", event):
        if (this.settings.list) {
          this.selectPreviousSuggestion();
        } else {
          this.selectNextSuggestion();
        }
        break;
      case this.isKey(this.settings.keys, "previous", event):
        if (this.settings.list) {
          this.selectNextSuggestion();
        } else {
          this.selectPreviousSuggestion();
        }
        break;
      case this.isKey(this.settings.keys, "nextPage", event):
        if (this.settings.list) {
          this.selectPreviousSuggestionsPage();
        } else {
          this.selectNextSuggestionsPage();
        }
        break;
      case this.isKey(this.settings.keys, "previousPage", event):
        if (this.settings.list) {
          this.selectNextSuggestionsPage();
        } else {
          this.selectPreviousSuggestionsPage();
        }
        break;
      case this.isKey(this.settings.keys, "complete", event):
        await this.#completeValue();
        break;
      case this.isKey(this.settings.keys, "moveCursorRight", event):
        if (this.inputIndex < this.inputValue.length) {
          this.moveCursorRight();
        } else {
          await this.#completeValue();
        }
        break;
      default:
        await super.handleEvent(event);
    }
  }
  /** Delete char right. */ deleteCharRight() {
    if (this.inputIndex < this.inputValue.length) {
      super.deleteCharRight();
      if (!this.getCurrentInputValue().length) {
        this.suggestionsIndex = -1;
        this.suggestionsOffset = 0;
      }
    }
  }
  async #completeValue() {
    this.inputValue = await this.complete();
    this.inputIndex = this.inputValue.length;
    this.suggestionsIndex = 0;
    this.suggestionsOffset = 0;
  }
  async complete() {
    let input = this.getCurrentInputValue();
    const suggestion = this.suggestions[this.suggestionsIndex]?.toString();
    if (this.settings.complete) {
      input = await this.settings.complete(input, suggestion);
    } else if (this.#isFileModeEnabled() && input.at(-1) !== sep && await isDirectory(input) && (this.getCurrentInputValue().at(-1) !== "." || this.getCurrentInputValue().endsWith(".."))) {
      input += sep;
    } else if (suggestion) {
      input = suggestion;
    }
    return this.#isFileModeEnabled() ? normalize(input) : input;
  }
  /** Select previous suggestion. */ selectPreviousSuggestion() {
    if (this.suggestions.length) {
      if (this.suggestionsIndex > -1) {
        this.suggestionsIndex--;
        if (this.suggestionsIndex < this.suggestionsOffset) {
          this.suggestionsOffset--;
        }
      }
    }
  }
  /** Select next suggestion. */ selectNextSuggestion() {
    if (this.suggestions.length) {
      if (this.suggestionsIndex < this.suggestions.length - 1) {
        this.suggestionsIndex++;
        if (this.suggestionsIndex >= this.suggestionsOffset + this.getListHeight()) {
          this.suggestionsOffset++;
        }
      }
    }
  }
  /** Select previous suggestions page. */ selectPreviousSuggestionsPage() {
    if (this.suggestions.length) {
      const height = this.getListHeight();
      if (this.suggestionsOffset >= height) {
        this.suggestionsIndex -= height;
        this.suggestionsOffset -= height;
      } else if (this.suggestionsOffset > 0) {
        this.suggestionsIndex -= this.suggestionsOffset;
        this.suggestionsOffset = 0;
      }
    }
  }
  /** Select next suggestions page. */ selectNextSuggestionsPage() {
    if (this.suggestions.length) {
      const height = this.getListHeight();
      if (this.suggestionsOffset + height + height < this.suggestions.length) {
        this.suggestionsIndex += height;
        this.suggestionsOffset += height;
      } else if (this.suggestionsOffset + height < this.suggestions.length) {
        const offset = this.suggestions.length - height;
        this.suggestionsIndex += offset - this.suggestionsOffset;
        this.suggestionsOffset = offset;
      }
    }
  }
}
function uniqueSuggestions(value, index, self) {
  return typeof value !== "undefined" && value !== "" && self.indexOf(value) === index;
}
function isDirectory(path) {
  return Deno.stat(path).then((file)=>file.isDirectory).catch(()=>false);
}
async function listDir(path, mode) {
  const fileNames = [];
  for await (const file of Deno.readDir(path || ".")){
    if (mode === true && (file.name.startsWith(".") || file.name.endsWith("~"))) {
      continue;
    }
    const filePath = join(path, file.name);
    if (mode instanceof RegExp && !mode.test(filePath)) {
      continue;
    }
    fileNames.push(filePath);
  }
  return fileNames.sort(function(a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYxLjAuMC1yYy4zL3Byb21wdC9fZ2VuZXJpY19zdWdnZXN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEtleUNvZGUgfSBmcm9tIFwiLi4va2V5Y29kZS9rZXlfY29kZS50c1wiO1xuaW1wb3J0IHtcbiAgR2VuZXJpY0lucHV0LFxuICBHZW5lcmljSW5wdXRLZXlzLFxuICBHZW5lcmljSW5wdXRQcm9tcHRPcHRpb25zLFxuICBHZW5lcmljSW5wdXRQcm9tcHRTZXR0aW5ncyxcbn0gZnJvbSBcIi4vX2dlbmVyaWNfaW5wdXQudHNcIjtcbmltcG9ydCB7XG4gIGJvbGQsXG4gIGJyaWdodEJsdWUsXG4gIGRpbSxcbiAgZGlybmFtZSxcbiAgam9pbixcbiAgbm9ybWFsaXplLFxuICBzdHJpcENvbG9yLFxuICB1bmRlcmxpbmUsXG59IGZyb20gXCIuL2RlcHMudHNcIjtcbmltcG9ydCB7IEZpZ3VyZXMsIGdldEZpZ3VyZXNCeUtleXMgfSBmcm9tIFwiLi9fZmlndXJlcy50c1wiO1xuaW1wb3J0IHsgZGlzdGFuY2UgfSBmcm9tIFwiLi4vX3V0aWxzL2Rpc3RhbmNlLnRzXCI7XG5cbi8qKiBHZW5lcmljIGlucHV0IHByb21wdCBvcHRpb25zLiAqL1xuZXhwb3J0IGludGVyZmFjZSBHZW5lcmljU3VnZ2VzdGlvbnNPcHRpb25zPFRWYWx1ZSwgVFJhd1ZhbHVlPlxuICBleHRlbmRzIEdlbmVyaWNJbnB1dFByb21wdE9wdGlvbnM8VFZhbHVlLCBUUmF3VmFsdWU+IHtcbiAgLyoqIEtleW1hcCB0byBhc3NpZ24ga2V5IG5hbWVzIHRvIHByb21wdCBhY3Rpb25zLiAqL1xuICBrZXlzPzogR2VuZXJpY1N1Z2dlc3Rpb25zS2V5cztcbiAgLyoqXG4gICAqIFByb21wdCBpZC4gSWYgc2V0LCB0aGUgcHJvbXB0IHZhbHVlIGlzIHN0b3JlZCBpbiBsb2NhbCBzdG9yYWdlIGFuZCB1c2VkIGZvclxuICAgKiBhdXRvIHN1Z2dlc3Rpb25zIHRoZSBuZXh0IHRpbWUgdGhlIHByb21wdCBpcyB1c2VkLlxuICAgKi9cbiAgaWQ/OiBzdHJpbmc7XG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBzdWdnZXN0aW9ucyBvciBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhbiBhcnJheSBvZlxuICAgKiBzdWdnZXN0aW9ucy5cbiAgICovXG4gIHN1Z2dlc3Rpb25zPzogQXJyYXk8c3RyaW5nIHwgbnVtYmVyPiB8IFN1Z2dlc3Rpb25IYW5kbGVyO1xuICAvKiogQ2FsbGJhY2sgZnVuY3Rpb24gZm9yIGF1dG8tc3VnZ2VzdGlvbiBjb21wbGV0aW9uLiAqL1xuICBjb21wbGV0ZT86IENvbXBsZXRlSGFuZGxlcjtcbiAgLyoqXG4gICAqIEVuYWJsZSBhdXRvc3VnZ2VzdGlvbnMgZm9yIGZpbGVzLiBDYW4gYmUgYSBib29sZWFuIHRvIGVuYWJsZSBhbGwgZmlsZXMgb3IgYVxuICAgKiByZWd1bGFyIGV4cHJlc3Npb24gdG8gaW5jbHVkZSBvbmx5IHNwZWNpZmljIGZpbGVzLlxuICAgKi9cbiAgZmlsZXM/OiBib29sZWFuIHwgUmVnRXhwO1xuICAvKiogU2hvdyBhdXRvIHN1Z2dlc3Rpb25zIGFzIGEgbGlzdC4gKi9cbiAgbGlzdD86IGJvb2xlYW47XG4gIC8qKiBEaXNwbGF5IHByb21wdCBpbmZvLiAqL1xuICBpbmZvPzogYm9vbGVhbjtcbiAgLyoqIENoYW5nZSBsaXN0IHBvaW50ZXIuIERlZmF1bHQgaXMgYGJyaWdodEJsdWUoXCLina9cIilgLiAqL1xuICBsaXN0UG9pbnRlcj86IHN0cmluZztcbiAgLyoqIExpbWl0IG1heCBkaXNwbGF5ZWQgcm93cyBwZXIgcGFnZS4gKi9cbiAgbWF4Um93cz86IG51bWJlcjtcbn1cblxuLyoqIEdlbmVyaWMgaW5wdXQgcHJvbXB0IHNldHRpbmdzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBHZW5lcmljU3VnZ2VzdGlvbnNTZXR0aW5nczxUVmFsdWUsIFRSYXdWYWx1ZT5cbiAgZXh0ZW5kcyBHZW5lcmljSW5wdXRQcm9tcHRTZXR0aW5nczxUVmFsdWUsIFRSYXdWYWx1ZT4ge1xuICBrZXlzPzogR2VuZXJpY1N1Z2dlc3Rpb25zS2V5cztcbiAgaWQ/OiBzdHJpbmc7XG4gIHN1Z2dlc3Rpb25zPzogQXJyYXk8c3RyaW5nIHwgbnVtYmVyPiB8IFN1Z2dlc3Rpb25IYW5kbGVyO1xuICBjb21wbGV0ZT86IENvbXBsZXRlSGFuZGxlcjtcbiAgZmlsZXM/OiBib29sZWFuIHwgUmVnRXhwO1xuICBsaXN0PzogYm9vbGVhbjtcbiAgaW5mbz86IGJvb2xlYW47XG4gIGxpc3RQb2ludGVyOiBzdHJpbmc7XG4gIG1heFJvd3M6IG51bWJlcjtcbn1cblxuLyoqIElucHV0IGtleXMgb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgR2VuZXJpY1N1Z2dlc3Rpb25zS2V5cyBleHRlbmRzIEdlbmVyaWNJbnB1dEtleXMge1xuICAvKiogQXBwbHkgYXV0by1zdWdnZXN0aW9uIGtleW1hcC4gRGVmYXVsdCBpcyBgW1widGFiXCJdYC4gKi9cbiAgY29tcGxldGU/OiBzdHJpbmdbXTtcbiAgLyoqIFNlbGVjdCBuZXh0IG9wdGlvbiBrZXltYXAuIERlZmF1bHQgaXMgYFtcInVwXCJdYC4gKi9cbiAgbmV4dD86IHN0cmluZ1tdO1xuICAvKiogU2VsZWN0IHByZXZpb3VzIG9wdGlvbiBrZXltYXAuIERlZmF1bHQgaXMgYFtcImRvd25cIl1gLiAqL1xuICBwcmV2aW91cz86IHN0cmluZ1tdO1xuICAvKiogU2VsZWN0IG5leHQgcGFnZSBrZXltYXAuIERlZmF1bHQgaXMgYFtcInBhZ2V1cFwiXWAuICovXG4gIG5leHRQYWdlPzogc3RyaW5nW107XG4gIC8qKiBTZWxlY3QgcHJldmlvdXMgcGFnZSBrZXltYXAuIERlZmF1bHQgaXMgYFtcInBhZ2Vkb3duXCJdYC4gKi9cbiAgcHJldmlvdXNQYWdlPzogc3RyaW5nW107XG59XG5cbi8qKiBBdXRvLXN1Z2dlc3Rpb25zIGhhbmRsZXIuICovXG5leHBvcnQgdHlwZSBTdWdnZXN0aW9uSGFuZGxlciA9IChcbiAgaW5wdXQ6IHN0cmluZyxcbikgPT4gQXJyYXk8c3RyaW5nIHwgbnVtYmVyPiB8IFByb21pc2U8QXJyYXk8c3RyaW5nIHwgbnVtYmVyPj47XG5cbi8qKiBBdXRvLXN1Z2dlc3Rpb25zIGNvbXBsZXRlIGhhbmRsZXIuICovXG5leHBvcnQgdHlwZSBDb21wbGV0ZUhhbmRsZXIgPSAoXG4gIGlucHV0OiBzdHJpbmcsXG4gIHN1Z2dlc3Rpb24/OiBzdHJpbmcsXG4pID0+IFByb21pc2U8c3RyaW5nPiB8IHN0cmluZztcblxuaW50ZXJmYWNlIExvY2FsU3RvcmFnZSB7XG4gIGdldEl0ZW0oa2V5OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsO1xuICByZW1vdmVJdGVtKGtleTogc3RyaW5nKTogdm9pZDtcbiAgc2V0SXRlbShrZXk6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IHZvaWQ7XG59XG5cbmNvbnN0IHNlcCA9IERlbm8uYnVpbGQub3MgPT09IFwid2luZG93c1wiID8gXCJcXFxcXCIgOiBcIi9cIjtcblxuLyoqIEdlbmVyaWMgaW5wdXQgcHJvbXB0IHJlcHJlc2VudGF0aW9uLiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEdlbmVyaWNTdWdnZXN0aW9uczxUVmFsdWUsIFRSYXdWYWx1ZT5cbiAgZXh0ZW5kcyBHZW5lcmljSW5wdXQ8VFZhbHVlLCBUUmF3VmFsdWU+IHtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IHJlYWRvbmx5IHNldHRpbmdzOiBHZW5lcmljU3VnZ2VzdGlvbnNTZXR0aW5nczxcbiAgICBUVmFsdWUsXG4gICAgVFJhd1ZhbHVlXG4gID47XG4gIHByb3RlY3RlZCBzdWdnZXN0aW9uc0luZGV4ID0gLTE7XG4gIHByb3RlY3RlZCBzdWdnZXN0aW9uc09mZnNldCA9IDA7XG4gIHByb3RlY3RlZCBzdWdnZXN0aW9uczogQXJyYXk8c3RyaW5nIHwgbnVtYmVyPiA9IFtdO1xuICAjaGFzUmVhZFBlcm1pc3Npb25zPzogYm9vbGVhbjtcblxuICBwdWJsaWMgZ2V0RGVmYXVsdFNldHRpbmdzKFxuICAgIG9wdGlvbnM6IEdlbmVyaWNTdWdnZXN0aW9uc09wdGlvbnM8VFZhbHVlLCBUUmF3VmFsdWU+LFxuICApOiBHZW5lcmljU3VnZ2VzdGlvbnNTZXR0aW5nczxUVmFsdWUsIFRSYXdWYWx1ZT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gc3VwZXIuZ2V0RGVmYXVsdFNldHRpbmdzKG9wdGlvbnMpO1xuICAgIHJldHVybiB7XG4gICAgICAuLi5zZXR0aW5ncyxcbiAgICAgIGxpc3RQb2ludGVyOiBvcHRpb25zLmxpc3RQb2ludGVyID8/IGJyaWdodEJsdWUoRmlndXJlcy5QT0lOVEVSKSxcbiAgICAgIG1heFJvd3M6IG9wdGlvbnMubWF4Um93cyA/PyA4LFxuICAgICAga2V5czoge1xuICAgICAgICBjb21wbGV0ZTogW1widGFiXCJdLFxuICAgICAgICBuZXh0OiBbXCJ1cFwiXSxcbiAgICAgICAgcHJldmlvdXM6IFtcImRvd25cIl0sXG4gICAgICAgIG5leHRQYWdlOiBbXCJwYWdldXBcIl0sXG4gICAgICAgIHByZXZpb3VzUGFnZTogW1wicGFnZWRvd25cIl0sXG4gICAgICAgIC4uLihzZXR0aW5ncy5rZXlzID8/IHt9KSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXQgbG9jYWxTdG9yYWdlKCk6IExvY2FsU3RvcmFnZSB8IG51bGwge1xuICAgIC8vIEtlZXAgc3VwcG9ydCBmb3IgZGVubyA8IDEuMTAuXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuaWQgJiYgXCJsb2NhbFN0b3JhZ2VcIiBpbiB3aW5kb3cpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICAgIHJldHVybiAod2luZG93IGFzIGFueSkubG9jYWxTdG9yYWdlO1xuICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAvLyBJZ25vcmUgZXJyb3IgaWYgLS1sb2NhdGlvbiBpcyBub3Qgc2V0LlxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByb3RlY3RlZCBsb2FkU3VnZ2VzdGlvbnMoKTogQXJyYXk8c3RyaW5nIHwgbnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuaWQpIHtcbiAgICAgIGNvbnN0IGpzb24gPSB0aGlzLmxvY2FsU3RvcmFnZT8uZ2V0SXRlbSh0aGlzLnNldHRpbmdzLmlkKTtcbiAgICAgIGNvbnN0IHN1Z2dlc3Rpb25zOiBBcnJheTxzdHJpbmcgfCBudW1iZXI+ID0ganNvbiA/IEpTT04ucGFyc2UoanNvbikgOiBbXTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShzdWdnZXN0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN1Z2dlc3Rpb25zO1xuICAgIH1cbiAgICByZXR1cm4gW107XG4gIH1cblxuICBwcm90ZWN0ZWQgc2F2ZVN1Z2dlc3Rpb25zKC4uLnN1Z2dlc3Rpb25zOiBBcnJheTxzdHJpbmcgfCBudW1iZXI+KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuaWQpIHtcbiAgICAgIHRoaXMubG9jYWxTdG9yYWdlPy5zZXRJdGVtKFxuICAgICAgICB0aGlzLnNldHRpbmdzLmlkLFxuICAgICAgICBKU09OLnN0cmluZ2lmeShbXG4gICAgICAgICAgLi4uc3VnZ2VzdGlvbnMsXG4gICAgICAgICAgLi4udGhpcy5sb2FkU3VnZ2VzdGlvbnMoKSxcbiAgICAgICAgXS5maWx0ZXIodW5pcXVlU3VnZ2VzdGlvbnMpKSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIHJlbmRlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5maWxlcyAmJiB0aGlzLiNoYXNSZWFkUGVybWlzc2lvbnMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgRGVuby5wZXJtaXNzaW9ucy5yZXF1ZXN0KHsgbmFtZTogXCJyZWFkXCIgfSk7XG4gICAgICAvLyBkaXNhYmxlIHBhdGggY29tcGxldGlvbiBpZiByZWFkIHBlcm1pc3Npb25zIGFyZSBkZW5pZWQuXG4gICAgICB0aGlzLiNoYXNSZWFkUGVybWlzc2lvbnMgPSBzdGF0dXMuc3RhdGUgPT09IFwiZ3JhbnRlZFwiO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLm1hdGNoKCk7XG4gICAgcmV0dXJuIHN1cGVyLnJlbmRlcigpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIG1hdGNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc3VnZ2VzdGlvbnMgPSBhd2FpdCB0aGlzLmdldFN1Z2dlc3Rpb25zKCk7XG4gICAgdGhpcy5zdWdnZXN0aW9uc0luZGV4ID0gTWF0aC5tYXgoXG4gICAgICB0aGlzLmdldEN1cnJlbnRJbnB1dFZhbHVlKCkudHJpbSgpLmxlbmd0aCA9PT0gMCA/IC0xIDogMCxcbiAgICAgIE1hdGgubWluKHRoaXMuc3VnZ2VzdGlvbnMubGVuZ3RoIC0gMSwgdGhpcy5zdWdnZXN0aW9uc0luZGV4KSxcbiAgICApO1xuICAgIHRoaXMuc3VnZ2VzdGlvbnNPZmZzZXQgPSBNYXRoLm1heChcbiAgICAgIDAsXG4gICAgICBNYXRoLm1pbihcbiAgICAgICAgdGhpcy5zdWdnZXN0aW9ucy5sZW5ndGggLSB0aGlzLmdldExpc3RIZWlnaHQoKSxcbiAgICAgICAgdGhpcy5zdWdnZXN0aW9uc09mZnNldCxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBpbnB1dCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBzdXBlci5pbnB1dCgpICsgZGltKHRoaXMuZ2V0U3VnZ2VzdGlvbigpKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXRTdWdnZXN0aW9uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuc3VnZ2VzdGlvbnNbdGhpcy5zdWdnZXN0aW9uc0luZGV4XT8udG9TdHJpbmcoKVxuICAgICAgLnN1YnN0cihcbiAgICAgICAgdGhpcy5nZXRDdXJyZW50SW5wdXRWYWx1ZSgpLmxlbmd0aCxcbiAgICAgICkgPz8gXCJcIjtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRVc2VyU3VnZ2VzdGlvbnMoXG4gICAgaW5wdXQ6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxBcnJheTxzdHJpbmcgfCBudW1iZXI+PiB7XG4gICAgcmV0dXJuIHR5cGVvZiB0aGlzLnNldHRpbmdzLnN1Z2dlc3Rpb25zID09PSBcImZ1bmN0aW9uXCJcbiAgICAgID8gYXdhaXQgdGhpcy5zZXR0aW5ncy5zdWdnZXN0aW9ucyhpbnB1dClcbiAgICAgIDogdGhpcy5zZXR0aW5ncy5zdWdnZXN0aW9ucyA/PyBbXTtcbiAgfVxuXG4gICNpc0ZpbGVNb2RlRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLnNldHRpbmdzLmZpbGVzICYmIHRoaXMuI2hhc1JlYWRQZXJtaXNzaW9ucyA9PT0gdHJ1ZTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRGaWxlU3VnZ2VzdGlvbnMoXG4gICAgaW5wdXQ6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxBcnJheTxzdHJpbmcgfCBudW1iZXI+PiB7XG4gICAgaWYgKCF0aGlzLiNpc0ZpbGVNb2RlRW5hYmxlZCgpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IERlbm8uc3RhdChpbnB1dClcbiAgICAgIC50aGVuKChmaWxlKSA9PiBmaWxlLmlzRGlyZWN0b3J5ID8gaW5wdXQgOiBkaXJuYW1lKGlucHV0KSlcbiAgICAgIC5jYXRjaCgoKSA9PiBkaXJuYW1lKGlucHV0KSk7XG5cbiAgICByZXR1cm4gYXdhaXQgbGlzdERpcihwYXRoLCB0aGlzLnNldHRpbmdzLmZpbGVzKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRTdWdnZXN0aW9ucygpOiBQcm9taXNlPEFycmF5PHN0cmluZyB8IG51bWJlcj4+IHtcbiAgICBjb25zdCBpbnB1dCA9IHRoaXMuZ2V0Q3VycmVudElucHV0VmFsdWUoKTtcbiAgICBjb25zdCBzdWdnZXN0aW9ucyA9IFtcbiAgICAgIC4uLnRoaXMubG9hZFN1Z2dlc3Rpb25zKCksXG4gICAgICAuLi5hd2FpdCB0aGlzLmdldFVzZXJTdWdnZXN0aW9ucyhpbnB1dCksXG4gICAgICAuLi5hd2FpdCB0aGlzLmdldEZpbGVTdWdnZXN0aW9ucyhpbnB1dCksXG4gICAgXS5maWx0ZXIodW5pcXVlU3VnZ2VzdGlvbnMpO1xuXG4gICAgaWYgKCFpbnB1dC5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBzdWdnZXN0aW9ucztcbiAgICB9XG5cbiAgICByZXR1cm4gc3VnZ2VzdGlvbnNcbiAgICAgIC5maWx0ZXIoKHZhbHVlOiBzdHJpbmcgfCBudW1iZXIpID0+XG4gICAgICAgIHN0cmlwQ29sb3IodmFsdWUudG9TdHJpbmcoKSlcbiAgICAgICAgICAudG9Mb3dlckNhc2UoKVxuICAgICAgICAgIC5zdGFydHNXaXRoKGlucHV0LnRvTG93ZXJDYXNlKCkpXG4gICAgICApXG4gICAgICAuc29ydCgoYTogc3RyaW5nIHwgbnVtYmVyLCBiOiBzdHJpbmcgfCBudW1iZXIpID0+XG4gICAgICAgIGRpc3RhbmNlKChhIHx8IGEpLnRvU3RyaW5nKCksIGlucHV0KSAtXG4gICAgICAgIGRpc3RhbmNlKChiIHx8IGIpLnRvU3RyaW5nKCksIGlucHV0KVxuICAgICAgKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBib2R5KCk6IHN0cmluZyB8IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0TGlzdCgpICsgdGhpcy5nZXRJbmZvKCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0SW5mbygpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5zZXR0aW5ncy5pbmZvKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgY29uc3Qgc2VsZWN0ZWQ6IG51bWJlciA9IHRoaXMuc3VnZ2VzdGlvbnNJbmRleCArIDE7XG4gICAgY29uc3QgbWF0Y2hlZDogbnVtYmVyID0gdGhpcy5zdWdnZXN0aW9ucy5sZW5ndGg7XG4gICAgY29uc3QgYWN0aW9uczogQXJyYXk8W3N0cmluZywgQXJyYXk8c3RyaW5nPl0+ID0gW107XG5cbiAgICBpZiAodGhpcy5zdWdnZXN0aW9ucy5sZW5ndGgpIHtcbiAgICAgIGlmICh0aGlzLnNldHRpbmdzLmxpc3QpIHtcbiAgICAgICAgYWN0aW9ucy5wdXNoKFxuICAgICAgICAgIFtcIk5leHRcIiwgZ2V0RmlndXJlc0J5S2V5cyh0aGlzLnNldHRpbmdzLmtleXM/Lm5leHQgPz8gW10pXSxcbiAgICAgICAgICBbXCJQcmV2aW91c1wiLCBnZXRGaWd1cmVzQnlLZXlzKHRoaXMuc2V0dGluZ3Mua2V5cz8ucHJldmlvdXMgPz8gW10pXSxcbiAgICAgICAgICBbXCJOZXh0IFBhZ2VcIiwgZ2V0RmlndXJlc0J5S2V5cyh0aGlzLnNldHRpbmdzLmtleXM/Lm5leHRQYWdlID8/IFtdKV0sXG4gICAgICAgICAgW1xuICAgICAgICAgICAgXCJQcmV2aW91cyBQYWdlXCIsXG4gICAgICAgICAgICBnZXRGaWd1cmVzQnlLZXlzKHRoaXMuc2V0dGluZ3Mua2V5cz8ucHJldmlvdXNQYWdlID8/IFtdKSxcbiAgICAgICAgICBdLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWN0aW9ucy5wdXNoKFxuICAgICAgICAgIFtcIk5leHRcIiwgZ2V0RmlndXJlc0J5S2V5cyh0aGlzLnNldHRpbmdzLmtleXM/Lm5leHQgPz8gW10pXSxcbiAgICAgICAgICBbXCJQcmV2aW91c1wiLCBnZXRGaWd1cmVzQnlLZXlzKHRoaXMuc2V0dGluZ3Mua2V5cz8ucHJldmlvdXMgPz8gW10pXSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGFjdGlvbnMucHVzaChcbiAgICAgICAgW1wiQ29tcGxldGVcIiwgZ2V0RmlndXJlc0J5S2V5cyh0aGlzLnNldHRpbmdzLmtleXM/LmNvbXBsZXRlID8/IFtdKV0sXG4gICAgICApO1xuICAgIH1cbiAgICBhY3Rpb25zLnB1c2goXG4gICAgICBbXCJTdWJtaXRcIiwgZ2V0RmlndXJlc0J5S2V5cyh0aGlzLnNldHRpbmdzLmtleXM/LnN1Ym1pdCA/PyBbXSldLFxuICAgICk7XG5cbiAgICBsZXQgaW5mbyA9IHRoaXMuc2V0dGluZ3MuaW5kZW50O1xuICAgIGlmICh0aGlzLnN1Z2dlc3Rpb25zLmxlbmd0aCkge1xuICAgICAgaW5mbyArPSBicmlnaHRCbHVlKEZpZ3VyZXMuSU5GTykgKyBib2xkKGAgJHtzZWxlY3RlZH0vJHttYXRjaGVkfSBgKTtcbiAgICB9XG4gICAgaW5mbyArPSBhY3Rpb25zXG4gICAgICAubWFwKChjdXIpID0+IGAke2N1clswXX06ICR7Ym9sZChjdXJbMV0uam9pbihcIiBcIikpfWApXG4gICAgICAuam9pbihcIiwgXCIpO1xuXG4gICAgcmV0dXJuIGluZm87XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0TGlzdCgpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5zdWdnZXN0aW9ucy5sZW5ndGggfHwgIXRoaXMuc2V0dGluZ3MubGlzdCkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIGNvbnN0IGxpc3Q6IEFycmF5PHN0cmluZz4gPSBbXTtcbiAgICBjb25zdCBoZWlnaHQ6IG51bWJlciA9IHRoaXMuZ2V0TGlzdEhlaWdodCgpO1xuICAgIGZvciAoXG4gICAgICBsZXQgaSA9IHRoaXMuc3VnZ2VzdGlvbnNPZmZzZXQ7XG4gICAgICBpIDwgdGhpcy5zdWdnZXN0aW9uc09mZnNldCArIGhlaWdodDtcbiAgICAgIGkrK1xuICAgICkge1xuICAgICAgbGlzdC5wdXNoKFxuICAgICAgICB0aGlzLmdldExpc3RJdGVtKFxuICAgICAgICAgIHRoaXMuc3VnZ2VzdGlvbnNbaV0sXG4gICAgICAgICAgdGhpcy5zdWdnZXN0aW9uc0luZGV4ID09PSBpLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKGxpc3QubGVuZ3RoICYmIHRoaXMuc2V0dGluZ3MuaW5mbykge1xuICAgICAgbGlzdC5wdXNoKFwiXCIpO1xuICAgIH1cbiAgICByZXR1cm4gbGlzdC5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbmRlciBvcHRpb24uXG4gICAqIEBwYXJhbSB2YWx1ZSAgICAgICAgT3B0aW9uLlxuICAgKiBAcGFyYW0gaXNTZWxlY3RlZCAgU2V0IHRvIHRydWUgaWYgb3B0aW9uIGlzIHNlbGVjdGVkLlxuICAgKi9cbiAgcHJvdGVjdGVkIGdldExpc3RJdGVtKFxuICAgIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIsXG4gICAgaXNTZWxlY3RlZD86IGJvb2xlYW4sXG4gICk6IHN0cmluZyB7XG4gICAgbGV0IGxpbmUgPSB0aGlzLnNldHRpbmdzLmluZGVudCA/PyBcIlwiO1xuICAgIGxpbmUgKz0gaXNTZWxlY3RlZCA/IGAke3RoaXMuc2V0dGluZ3MubGlzdFBvaW50ZXJ9IGAgOiBcIiAgXCI7XG4gICAgaWYgKGlzU2VsZWN0ZWQpIHtcbiAgICAgIGxpbmUgKz0gdW5kZXJsaW5lKHRoaXMuaGlnaGxpZ2h0KHZhbHVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpbmUgKz0gdGhpcy5oaWdobGlnaHQodmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gbGluZTtcbiAgfVxuXG4gIC8qKiBHZXQgc3VnZ2VzdGlvbnMgcm93IGhlaWdodC4gKi9cbiAgcHJvdGVjdGVkIGdldExpc3RIZWlnaHQoXG4gICAgc3VnZ2VzdGlvbnM6IEFycmF5PHN0cmluZyB8IG51bWJlcj4gPSB0aGlzLnN1Z2dlc3Rpb25zLFxuICApOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLm1pbihcbiAgICAgIHN1Z2dlc3Rpb25zLmxlbmd0aCxcbiAgICAgIHRoaXMuc2V0dGluZ3MubWF4Um93cyB8fCBzdWdnZXN0aW9ucy5sZW5ndGgsXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgdXNlciBpbnB1dCBldmVudC5cbiAgICogQHBhcmFtIGV2ZW50IEtleSBldmVudC5cbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBoYW5kbGVFdmVudChldmVudDogS2V5Q29kZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgICAgY2FzZSB0aGlzLmlzS2V5KHRoaXMuc2V0dGluZ3Mua2V5cywgXCJuZXh0XCIsIGV2ZW50KTpcbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MubGlzdCkge1xuICAgICAgICAgIHRoaXMuc2VsZWN0UHJldmlvdXNTdWdnZXN0aW9uKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3ROZXh0U3VnZ2VzdGlvbigpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLmlzS2V5KHRoaXMuc2V0dGluZ3Mua2V5cywgXCJwcmV2aW91c1wiLCBldmVudCk6XG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmxpc3QpIHtcbiAgICAgICAgICB0aGlzLnNlbGVjdE5leHRTdWdnZXN0aW9uKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3RQcmV2aW91c1N1Z2dlc3Rpb24oKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdGhpcy5pc0tleSh0aGlzLnNldHRpbmdzLmtleXMsIFwibmV4dFBhZ2VcIiwgZXZlbnQpOlxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5saXN0KSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3RQcmV2aW91c1N1Z2dlc3Rpb25zUGFnZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuc2VsZWN0TmV4dFN1Z2dlc3Rpb25zUGFnZSgpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLmlzS2V5KHRoaXMuc2V0dGluZ3Mua2V5cywgXCJwcmV2aW91c1BhZ2VcIiwgZXZlbnQpOlxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5saXN0KSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3ROZXh0U3VnZ2VzdGlvbnNQYWdlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3RQcmV2aW91c1N1Z2dlc3Rpb25zUGFnZSgpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLmlzS2V5KHRoaXMuc2V0dGluZ3Mua2V5cywgXCJjb21wbGV0ZVwiLCBldmVudCk6XG4gICAgICAgIGF3YWl0IHRoaXMuI2NvbXBsZXRlVmFsdWUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIHRoaXMuaXNLZXkodGhpcy5zZXR0aW5ncy5rZXlzLCBcIm1vdmVDdXJzb3JSaWdodFwiLCBldmVudCk6XG4gICAgICAgIGlmICh0aGlzLmlucHV0SW5kZXggPCB0aGlzLmlucHV0VmFsdWUubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5tb3ZlQ3Vyc29yUmlnaHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLiNjb21wbGV0ZVZhbHVlKCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhd2FpdCBzdXBlci5oYW5kbGVFdmVudChldmVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIERlbGV0ZSBjaGFyIHJpZ2h0LiAqL1xuICBwcm90ZWN0ZWQgZGVsZXRlQ2hhclJpZ2h0KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmlucHV0SW5kZXggPCB0aGlzLmlucHV0VmFsdWUubGVuZ3RoKSB7XG4gICAgICBzdXBlci5kZWxldGVDaGFyUmlnaHQoKTtcbiAgICAgIGlmICghdGhpcy5nZXRDdXJyZW50SW5wdXRWYWx1ZSgpLmxlbmd0aCkge1xuICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zSW5kZXggPSAtMTtcbiAgICAgICAgdGhpcy5zdWdnZXN0aW9uc09mZnNldCA9IDA7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgI2NvbXBsZXRlVmFsdWUoKSB7XG4gICAgdGhpcy5pbnB1dFZhbHVlID0gYXdhaXQgdGhpcy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuaW5wdXRJbmRleCA9IHRoaXMuaW5wdXRWYWx1ZS5sZW5ndGg7XG4gICAgdGhpcy5zdWdnZXN0aW9uc0luZGV4ID0gMDtcbiAgICB0aGlzLnN1Z2dlc3Rpb25zT2Zmc2V0ID0gMDtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBjb21wbGV0ZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBpbnB1dDogc3RyaW5nID0gdGhpcy5nZXRDdXJyZW50SW5wdXRWYWx1ZSgpO1xuICAgIGNvbnN0IHN1Z2dlc3Rpb246IHN0cmluZyB8IHVuZGVmaW5lZCA9IHRoaXNcbiAgICAgIC5zdWdnZXN0aW9uc1t0aGlzLnN1Z2dlc3Rpb25zSW5kZXhdPy50b1N0cmluZygpO1xuXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuY29tcGxldGUpIHtcbiAgICAgIGlucHV0ID0gYXdhaXQgdGhpcy5zZXR0aW5ncy5jb21wbGV0ZShpbnB1dCwgc3VnZ2VzdGlvbik7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHRoaXMuI2lzRmlsZU1vZGVFbmFibGVkKCkgJiZcbiAgICAgIGlucHV0LmF0KC0xKSAhPT0gc2VwICYmXG4gICAgICBhd2FpdCBpc0RpcmVjdG9yeShpbnB1dCkgJiZcbiAgICAgIChcbiAgICAgICAgdGhpcy5nZXRDdXJyZW50SW5wdXRWYWx1ZSgpLmF0KC0xKSAhPT0gXCIuXCIgfHxcbiAgICAgICAgdGhpcy5nZXRDdXJyZW50SW5wdXRWYWx1ZSgpLmVuZHNXaXRoKFwiLi5cIilcbiAgICAgIClcbiAgICApIHtcbiAgICAgIGlucHV0ICs9IHNlcDtcbiAgICB9IGVsc2UgaWYgKHN1Z2dlc3Rpb24pIHtcbiAgICAgIGlucHV0ID0gc3VnZ2VzdGlvbjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy4jaXNGaWxlTW9kZUVuYWJsZWQoKSA/IG5vcm1hbGl6ZShpbnB1dCkgOiBpbnB1dDtcbiAgfVxuXG4gIC8qKiBTZWxlY3QgcHJldmlvdXMgc3VnZ2VzdGlvbi4gKi9cbiAgcHJvdGVjdGVkIHNlbGVjdFByZXZpb3VzU3VnZ2VzdGlvbigpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zdWdnZXN0aW9ucy5sZW5ndGgpIHtcbiAgICAgIGlmICh0aGlzLnN1Z2dlc3Rpb25zSW5kZXggPiAtMSkge1xuICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zSW5kZXgtLTtcbiAgICAgICAgaWYgKHRoaXMuc3VnZ2VzdGlvbnNJbmRleCA8IHRoaXMuc3VnZ2VzdGlvbnNPZmZzZXQpIHtcbiAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zT2Zmc2V0LS07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogU2VsZWN0IG5leHQgc3VnZ2VzdGlvbi4gKi9cbiAgcHJvdGVjdGVkIHNlbGVjdE5leHRTdWdnZXN0aW9uKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnN1Z2dlc3Rpb25zLmxlbmd0aCkge1xuICAgICAgaWYgKHRoaXMuc3VnZ2VzdGlvbnNJbmRleCA8IHRoaXMuc3VnZ2VzdGlvbnMubGVuZ3RoIC0gMSkge1xuICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zSW5kZXgrKztcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHRoaXMuc3VnZ2VzdGlvbnNJbmRleCA+PVxuICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9uc09mZnNldCArIHRoaXMuZ2V0TGlzdEhlaWdodCgpXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXMuc3VnZ2VzdGlvbnNPZmZzZXQrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBTZWxlY3QgcHJldmlvdXMgc3VnZ2VzdGlvbnMgcGFnZS4gKi9cbiAgcHJvdGVjdGVkIHNlbGVjdFByZXZpb3VzU3VnZ2VzdGlvbnNQYWdlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnN1Z2dlc3Rpb25zLmxlbmd0aCkge1xuICAgICAgY29uc3QgaGVpZ2h0OiBudW1iZXIgPSB0aGlzLmdldExpc3RIZWlnaHQoKTtcbiAgICAgIGlmICh0aGlzLnN1Z2dlc3Rpb25zT2Zmc2V0ID49IGhlaWdodCkge1xuICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zSW5kZXggLT0gaGVpZ2h0O1xuICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zT2Zmc2V0IC09IGhlaWdodDtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5zdWdnZXN0aW9uc09mZnNldCA+IDApIHtcbiAgICAgICAgdGhpcy5zdWdnZXN0aW9uc0luZGV4IC09IHRoaXMuc3VnZ2VzdGlvbnNPZmZzZXQ7XG4gICAgICAgIHRoaXMuc3VnZ2VzdGlvbnNPZmZzZXQgPSAwO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBTZWxlY3QgbmV4dCBzdWdnZXN0aW9ucyBwYWdlLiAqL1xuICBwcm90ZWN0ZWQgc2VsZWN0TmV4dFN1Z2dlc3Rpb25zUGFnZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zdWdnZXN0aW9ucy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IGhlaWdodDogbnVtYmVyID0gdGhpcy5nZXRMaXN0SGVpZ2h0KCk7XG4gICAgICBpZiAodGhpcy5zdWdnZXN0aW9uc09mZnNldCArIGhlaWdodCArIGhlaWdodCA8IHRoaXMuc3VnZ2VzdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuc3VnZ2VzdGlvbnNJbmRleCArPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuc3VnZ2VzdGlvbnNPZmZzZXQgKz0gaGVpZ2h0O1xuICAgICAgfSBlbHNlIGlmICh0aGlzLnN1Z2dlc3Rpb25zT2Zmc2V0ICsgaGVpZ2h0IDwgdGhpcy5zdWdnZXN0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5zdWdnZXN0aW9ucy5sZW5ndGggLSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuc3VnZ2VzdGlvbnNJbmRleCArPSBvZmZzZXQgLSB0aGlzLnN1Z2dlc3Rpb25zT2Zmc2V0O1xuICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zT2Zmc2V0ID0gb2Zmc2V0O1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB1bmlxdWVTdWdnZXN0aW9ucyhcbiAgdmFsdWU6IHVua25vd24sXG4gIGluZGV4OiBudW1iZXIsXG4gIHNlbGY6IEFycmF5PHVua25vd24+LFxuKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIgJiYgdmFsdWUgIT09IFwiXCIgJiZcbiAgICBzZWxmLmluZGV4T2YodmFsdWUpID09PSBpbmRleDtcbn1cblxuZnVuY3Rpb24gaXNEaXJlY3RvcnkocGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIHJldHVybiBEZW5vLnN0YXQocGF0aClcbiAgICAudGhlbigoZmlsZSkgPT4gZmlsZS5pc0RpcmVjdG9yeSlcbiAgICAuY2F0Y2goKCkgPT4gZmFsc2UpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBsaXN0RGlyKFxuICBwYXRoOiBzdHJpbmcsXG4gIG1vZGU/OiBib29sZWFuIHwgUmVnRXhwLFxuKTogUHJvbWlzZTxBcnJheTxzdHJpbmc+PiB7XG4gIGNvbnN0IGZpbGVOYW1lczogc3RyaW5nW10gPSBbXTtcblxuICBmb3IgYXdhaXQgKGNvbnN0IGZpbGUgb2YgRGVuby5yZWFkRGlyKHBhdGggfHwgXCIuXCIpKSB7XG4gICAgaWYgKFxuICAgICAgbW9kZSA9PT0gdHJ1ZSAmJiAoZmlsZS5uYW1lLnN0YXJ0c1dpdGgoXCIuXCIpIHx8IGZpbGUubmFtZS5lbmRzV2l0aChcIn5cIikpXG4gICAgKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgZmlsZVBhdGggPSBqb2luKHBhdGgsIGZpbGUubmFtZSk7XG5cbiAgICBpZiAobW9kZSBpbnN0YW5jZW9mIFJlZ0V4cCAmJiAhbW9kZS50ZXN0KGZpbGVQYXRoKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGZpbGVOYW1lcy5wdXNoKGZpbGVQYXRoKTtcbiAgfVxuXG4gIHJldHVybiBmaWxlTmFtZXMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhLnRvTG93ZXJDYXNlKCkubG9jYWxlQ29tcGFyZShiLnRvTG93ZXJDYXNlKCkpO1xuICB9KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUNFLFlBQVksUUFJUCxzQkFBc0I7QUFDN0IsU0FDRSxJQUFJLEVBQ0osVUFBVSxFQUNWLEdBQUcsRUFDSCxPQUFPLEVBQ1AsSUFBSSxFQUNKLFNBQVMsRUFDVCxVQUFVLEVBQ1YsU0FBUyxRQUNKLFlBQVk7QUFDbkIsU0FBUyxPQUFPLEVBQUUsZ0JBQWdCLFFBQVEsZ0JBQWdCO0FBQzFELFNBQVMsUUFBUSxRQUFRLHdCQUF3QjtBQStFakQsTUFBTSxNQUFNLEtBQUssS0FBSyxDQUFDLEVBQUUsS0FBSyxZQUFZLE9BQU87QUFFakQseUNBQXlDLEdBQ3pDLE9BQU8sTUFBZSwyQkFDWjtFQUtFLG1CQUFtQixDQUFDLEVBQUU7RUFDdEIsb0JBQW9CLEVBQUU7RUFDdEIsY0FBc0MsRUFBRSxDQUFDO0VBQ25ELENBQUEsa0JBQW1CLENBQVc7RUFFdkIsbUJBQ0wsT0FBcUQsRUFDTjtJQUMvQyxNQUFNLFdBQVcsS0FBSyxDQUFDLG1CQUFtQjtJQUMxQyxPQUFPO01BQ0wsR0FBRyxRQUFRO01BQ1gsYUFBYSxRQUFRLFdBQVcsSUFBSSxXQUFXLFFBQVEsT0FBTztNQUM5RCxTQUFTLFFBQVEsT0FBTyxJQUFJO01BQzVCLE1BQU07UUFDSixVQUFVO1VBQUM7U0FBTTtRQUNqQixNQUFNO1VBQUM7U0FBSztRQUNaLFVBQVU7VUFBQztTQUFPO1FBQ2xCLFVBQVU7VUFBQztTQUFTO1FBQ3BCLGNBQWM7VUFBQztTQUFXO1FBQzFCLEdBQUksU0FBUyxJQUFJLElBQUksQ0FBQyxDQUFDO01BQ3pCO0lBQ0Y7RUFDRjtFQUVBLElBQWMsZUFBb0M7SUFDaEQsZ0NBQWdDO0lBQ2hDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksa0JBQWtCLFFBQVE7TUFDaEQsSUFBSTtRQUNGLG1DQUFtQztRQUNuQyxPQUFPLEFBQUMsT0FBZSxZQUFZO01BQ3JDLEVBQUUsT0FBTyxHQUFHO01BQ1YseUNBQXlDO01BQzNDO0lBQ0Y7SUFDQSxPQUFPO0VBQ1Q7RUFFVSxrQkFBMEM7SUFDbEQsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRTtNQUNwQixNQUFNLE9BQU8sSUFBSSxDQUFDLFlBQVksRUFBRSxRQUFRLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtNQUN4RCxNQUFNLGNBQXNDLE9BQU8sS0FBSyxLQUFLLENBQUMsUUFBUSxFQUFFO01BQ3hFLElBQUksQ0FBQyxNQUFNLE9BQU8sQ0FBQyxjQUFjO1FBQy9CLE9BQU8sRUFBRTtNQUNYO01BQ0EsT0FBTztJQUNUO0lBQ0EsT0FBTyxFQUFFO0VBQ1g7RUFFVSxnQkFBZ0IsR0FBRyxXQUFtQyxFQUFRO0lBQ3RFLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUU7TUFDcEIsSUFBSSxDQUFDLFlBQVksRUFBRSxRQUNqQixJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFDaEIsS0FBSyxTQUFTLENBQUM7V0FDVjtXQUNBLElBQUksQ0FBQyxlQUFlO09BQ3hCLENBQUMsTUFBTSxDQUFDO0lBRWI7RUFDRjtFQUVBLE1BQWdCLFNBQXdCO0lBQ3RDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLENBQUEsa0JBQW1CLEtBQUssV0FBVztNQUNqRSxNQUFNLFNBQVMsTUFBTSxLQUFLLFdBQVcsQ0FBQyxPQUFPLENBQUM7UUFBRSxNQUFNO01BQU87TUFDN0QsMERBQTBEO01BQzFELElBQUksQ0FBQyxDQUFBLGtCQUFtQixHQUFHLE9BQU8sS0FBSyxLQUFLO0lBQzlDO0lBQ0EsTUFBTSxJQUFJLENBQUMsS0FBSztJQUNoQixPQUFPLEtBQUssQ0FBQztFQUNmO0VBRUEsTUFBZ0IsUUFBdUI7SUFDckMsSUFBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjO0lBQzVDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLEdBQUcsQ0FDOUIsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksR0FBRyxNQUFNLEtBQUssSUFBSSxDQUFDLElBQUksR0FDdkQsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsZ0JBQWdCO0lBRTdELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLEdBQUcsQ0FDL0IsR0FDQSxLQUFLLEdBQUcsQ0FDTixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxJQUM1QyxJQUFJLENBQUMsaUJBQWlCO0VBRzVCO0VBRVUsUUFBZ0I7SUFDeEIsT0FBTyxLQUFLLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxhQUFhO0VBQy9DO0VBRVUsZ0JBQXdCO0lBQ2hDLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxXQUM3QyxPQUNDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxNQUFNLEtBQy9CO0VBQ1Q7RUFFQSxNQUFnQixtQkFDZCxLQUFhLEVBQ29CO0lBQ2pDLE9BQU8sT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsS0FBSyxhQUN4QyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFNBQ2hDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxJQUFJLEVBQUU7RUFDckM7RUFFQSxDQUFBLGlCQUFrQjtJQUNoQixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsQ0FBQSxrQkFBbUIsS0FBSztFQUMvRDtFQUVBLE1BQWdCLG1CQUNkLEtBQWEsRUFDb0I7SUFDakMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBLGlCQUFrQixJQUFJO01BQzlCLE9BQU8sRUFBRTtJQUNYO0lBRUEsTUFBTSxPQUFPLE1BQU0sS0FBSyxJQUFJLENBQUMsT0FDMUIsSUFBSSxDQUFDLENBQUMsT0FBUyxLQUFLLFdBQVcsR0FBRyxRQUFRLFFBQVEsUUFDbEQsS0FBSyxDQUFDLElBQU0sUUFBUTtJQUV2QixPQUFPLE1BQU0sUUFBUSxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSztFQUNoRDtFQUVBLE1BQWdCLGlCQUFrRDtJQUNoRSxNQUFNLFFBQVEsSUFBSSxDQUFDLG9CQUFvQjtJQUN2QyxNQUFNLGNBQWM7U0FDZixJQUFJLENBQUMsZUFBZTtTQUNwQixNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztTQUM5QixNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztLQUNsQyxDQUFDLE1BQU0sQ0FBQztJQUVULElBQUksQ0FBQyxNQUFNLE1BQU0sRUFBRTtNQUNqQixPQUFPO0lBQ1Q7SUFFQSxPQUFPLFlBQ0osTUFBTSxDQUFDLENBQUMsUUFDUCxXQUFXLE1BQU0sUUFBUSxJQUN0QixXQUFXLEdBQ1gsVUFBVSxDQUFDLE1BQU0sV0FBVyxLQUVoQyxJQUFJLENBQUMsQ0FBQyxHQUFvQixJQUN6QixTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsUUFBUSxJQUFJLFNBQzlCLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxRQUFRLElBQUk7RUFFcEM7RUFFVSxPQUFpQztJQUN6QyxPQUFPLElBQUksQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLE9BQU87RUFDdEM7RUFFVSxVQUFrQjtJQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUU7TUFDdkIsT0FBTztJQUNUO0lBQ0EsTUFBTSxXQUFtQixJQUFJLENBQUMsZ0JBQWdCLEdBQUc7SUFDakQsTUFBTSxVQUFrQixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU07SUFDL0MsTUFBTSxVQUEwQyxFQUFFO0lBRWxELElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUU7TUFDM0IsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRTtRQUN0QixRQUFRLElBQUksQ0FDVjtVQUFDO1VBQVEsaUJBQWlCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtTQUFFLEVBQzFEO1VBQUM7VUFBWSxpQkFBaUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1NBQUUsRUFDbEU7VUFBQztVQUFhLGlCQUFpQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7U0FBRSxFQUNuRTtVQUNFO1VBQ0EsaUJBQWlCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1NBQ3hEO01BRUwsT0FBTztRQUNMLFFBQVEsSUFBSSxDQUNWO1VBQUM7VUFBUSxpQkFBaUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFO1NBQUUsRUFDMUQ7VUFBQztVQUFZLGlCQUFpQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7U0FBRTtNQUV0RTtNQUNBLFFBQVEsSUFBSSxDQUNWO1FBQUM7UUFBWSxpQkFBaUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO09BQUU7SUFFdEU7SUFDQSxRQUFRLElBQUksQ0FDVjtNQUFDO01BQVUsaUJBQWlCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtLQUFFO0lBR2hFLElBQUksT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU07SUFDL0IsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRTtNQUMzQixRQUFRLFdBQVcsUUFBUSxJQUFJLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNwRTtJQUNBLFFBQVEsUUFDTCxHQUFHLENBQUMsQ0FBQyxNQUFRLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUNuRCxJQUFJLENBQUM7SUFFUixPQUFPO0VBQ1Q7RUFFVSxVQUFrQjtJQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRTtNQUNuRCxPQUFPO0lBQ1Q7SUFDQSxNQUFNLE9BQXNCLEVBQUU7SUFDOUIsTUFBTSxTQUFpQixJQUFJLENBQUMsYUFBYTtJQUN6QyxJQUNFLElBQUksSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQzlCLElBQUksSUFBSSxDQUFDLGlCQUFpQixHQUFHLFFBQzdCLElBQ0E7TUFDQSxLQUFLLElBQUksQ0FDUCxJQUFJLENBQUMsV0FBVyxDQUNkLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUNuQixJQUFJLENBQUMsZ0JBQWdCLEtBQUs7SUFHaEM7SUFDQSxJQUFJLEtBQUssTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFO01BQ3JDLEtBQUssSUFBSSxDQUFDO0lBQ1o7SUFDQSxPQUFPLEtBQUssSUFBSSxDQUFDO0VBQ25CO0VBRUE7Ozs7R0FJQyxHQUNELEFBQVUsWUFDUixLQUFzQixFQUN0QixVQUFvQixFQUNaO0lBQ1IsSUFBSSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJO0lBQ25DLFFBQVEsYUFBYSxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUc7SUFDdkQsSUFBSSxZQUFZO01BQ2QsUUFBUSxVQUFVLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDbkMsT0FBTztNQUNMLFFBQVEsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUN6QjtJQUNBLE9BQU87RUFDVDtFQUVBLGdDQUFnQyxHQUNoQyxBQUFVLGNBQ1IsY0FBc0MsSUFBSSxDQUFDLFdBQVcsRUFDOUM7SUFDUixPQUFPLEtBQUssR0FBRyxDQUNiLFlBQVksTUFBTSxFQUNsQixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sSUFBSSxZQUFZLE1BQU07RUFFL0M7RUFFQTs7O0dBR0MsR0FDRCxNQUFnQixZQUFZLEtBQWMsRUFBaUI7SUFDekQsT0FBUTtNQUNOLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRO1FBQzFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUU7VUFDdEIsSUFBSSxDQUFDLHdCQUF3QjtRQUMvQixPQUFPO1VBQ0wsSUFBSSxDQUFDLG9CQUFvQjtRQUMzQjtRQUNBO01BQ0YsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFlBQVk7UUFDOUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRTtVQUN0QixJQUFJLENBQUMsb0JBQW9CO1FBQzNCLE9BQU87VUFDTCxJQUFJLENBQUMsd0JBQXdCO1FBQy9CO1FBQ0E7TUFDRixLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsWUFBWTtRQUM5QyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFO1VBQ3RCLElBQUksQ0FBQyw2QkFBNkI7UUFDcEMsT0FBTztVQUNMLElBQUksQ0FBQyx5QkFBeUI7UUFDaEM7UUFDQTtNQUNGLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxnQkFBZ0I7UUFDbEQsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRTtVQUN0QixJQUFJLENBQUMseUJBQXlCO1FBQ2hDLE9BQU87VUFDTCxJQUFJLENBQUMsNkJBQTZCO1FBQ3BDO1FBQ0E7TUFDRixLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsWUFBWTtRQUM5QyxNQUFNLElBQUksQ0FBQyxDQUFBLGFBQWM7UUFDekI7TUFDRixLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CO1FBQ3JELElBQUksSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRTtVQUM1QyxJQUFJLENBQUMsZUFBZTtRQUN0QixPQUFPO1VBQ0wsTUFBTSxJQUFJLENBQUMsQ0FBQSxhQUFjO1FBQzNCO1FBQ0E7TUFDRjtRQUNFLE1BQU0sS0FBSyxDQUFDLFlBQVk7SUFDNUI7RUFDRjtFQUVBLHVCQUF1QixHQUN2QixBQUFVLGtCQUF3QjtJQUNoQyxJQUFJLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUU7TUFDNUMsS0FBSyxDQUFDO01BQ04sSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxNQUFNLEVBQUU7UUFDdkMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUM7UUFDekIsSUFBSSxDQUFDLGlCQUFpQixHQUFHO01BQzNCO0lBQ0Y7RUFDRjtFQUVBLE1BQU0sQ0FBQSxhQUFjO0lBQ2xCLElBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsUUFBUTtJQUNyQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTTtJQUN4QyxJQUFJLENBQUMsZ0JBQWdCLEdBQUc7SUFDeEIsSUFBSSxDQUFDLGlCQUFpQixHQUFHO0VBQzNCO0VBRUEsTUFBZ0IsV0FBNEI7SUFDMUMsSUFBSSxRQUFnQixJQUFJLENBQUMsb0JBQW9CO0lBQzdDLE1BQU0sYUFBaUMsSUFBSSxDQUN4QyxXQUFXLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUU7SUFFdkMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRTtNQUMxQixRQUFRLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTztJQUM5QyxPQUFPLElBQ0wsSUFBSSxDQUFDLENBQUEsaUJBQWtCLE1BQ3ZCLE1BQU0sRUFBRSxDQUFDLENBQUMsT0FBTyxPQUNqQixNQUFNLFlBQVksVUFDbEIsQ0FDRSxJQUFJLENBQUMsb0JBQW9CLEdBQUcsRUFBRSxDQUFDLENBQUMsT0FBTyxPQUN2QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEtBQ3ZDLEdBQ0E7TUFDQSxTQUFTO0lBQ1gsT0FBTyxJQUFJLFlBQVk7TUFDckIsUUFBUTtJQUNWO0lBRUEsT0FBTyxJQUFJLENBQUMsQ0FBQSxpQkFBa0IsS0FBSyxVQUFVLFNBQVM7RUFDeEQ7RUFFQSxnQ0FBZ0MsR0FDaEMsQUFBVSwyQkFBaUM7SUFDekMsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRTtNQUMzQixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEdBQUc7UUFDOUIsSUFBSSxDQUFDLGdCQUFnQjtRQUNyQixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7VUFDbEQsSUFBSSxDQUFDLGlCQUFpQjtRQUN4QjtNQUNGO0lBQ0Y7RUFDRjtFQUVBLDRCQUE0QixHQUM1QixBQUFVLHVCQUE2QjtJQUNyQyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFO01BQzNCLElBQUksSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLEdBQUc7UUFDdkQsSUFBSSxDQUFDLGdCQUFnQjtRQUNyQixJQUNFLElBQUksQ0FBQyxnQkFBZ0IsSUFDbkIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxhQUFhLElBQzdDO1VBQ0EsSUFBSSxDQUFDLGlCQUFpQjtRQUN4QjtNQUNGO0lBQ0Y7RUFDRjtFQUVBLHNDQUFzQyxHQUN0QyxBQUFVLGdDQUFzQztJQUM5QyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFO01BQzNCLE1BQU0sU0FBaUIsSUFBSSxDQUFDLGFBQWE7TUFDekMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLElBQUksUUFBUTtRQUNwQyxJQUFJLENBQUMsZ0JBQWdCLElBQUk7UUFDekIsSUFBSSxDQUFDLGlCQUFpQixJQUFJO01BQzVCLE9BQU8sSUFBSSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsR0FBRztRQUNyQyxJQUFJLENBQUMsZ0JBQWdCLElBQUksSUFBSSxDQUFDLGlCQUFpQjtRQUMvQyxJQUFJLENBQUMsaUJBQWlCLEdBQUc7TUFDM0I7SUFDRjtFQUNGO0VBRUEsa0NBQWtDLEdBQ2xDLEFBQVUsNEJBQWtDO0lBQzFDLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUU7TUFDM0IsTUFBTSxTQUFpQixJQUFJLENBQUMsYUFBYTtNQUN6QyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLFNBQVMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUU7UUFDdEUsSUFBSSxDQUFDLGdCQUFnQixJQUFJO1FBQ3pCLElBQUksQ0FBQyxpQkFBaUIsSUFBSTtNQUM1QixPQUFPLElBQUksSUFBSSxDQUFDLGlCQUFpQixHQUFHLFNBQVMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUU7UUFDcEUsTUFBTSxTQUFTLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHO1FBQ3pDLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxTQUFTLElBQUksQ0FBQyxpQkFBaUI7UUFDeEQsSUFBSSxDQUFDLGlCQUFpQixHQUFHO01BQzNCO0lBQ0Y7RUFDRjtBQUNGO0FBRUEsU0FBUyxrQkFDUCxLQUFjLEVBQ2QsS0FBYSxFQUNiLElBQW9CO0VBRXBCLE9BQU8sT0FBTyxVQUFVLGVBQWUsVUFBVSxNQUMvQyxLQUFLLE9BQU8sQ0FBQyxXQUFXO0FBQzVCO0FBRUEsU0FBUyxZQUFZLElBQVk7RUFDL0IsT0FBTyxLQUFLLElBQUksQ0FBQyxNQUNkLElBQUksQ0FBQyxDQUFDLE9BQVMsS0FBSyxXQUFXLEVBQy9CLEtBQUssQ0FBQyxJQUFNO0FBQ2pCO0FBRUEsZUFBZSxRQUNiLElBQVksRUFDWixJQUF1QjtFQUV2QixNQUFNLFlBQXNCLEVBQUU7RUFFOUIsV0FBVyxNQUFNLFFBQVEsS0FBSyxPQUFPLENBQUMsUUFBUSxLQUFNO0lBQ2xELElBQ0UsU0FBUyxRQUFRLENBQUMsS0FBSyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksR0FDdEU7TUFDQTtJQUNGO0lBQ0EsTUFBTSxXQUFXLEtBQUssTUFBTSxLQUFLLElBQUk7SUFFckMsSUFBSSxnQkFBZ0IsVUFBVSxDQUFDLEtBQUssSUFBSSxDQUFDLFdBQVc7TUFDbEQ7SUFDRjtJQUNBLFVBQVUsSUFBSSxDQUFDO0VBQ2pCO0VBRUEsT0FBTyxVQUFVLElBQUksQ0FBQyxTQUFVLENBQUMsRUFBRSxDQUFDO0lBQ2xDLE9BQU8sRUFBRSxXQUFXLEdBQUcsYUFBYSxDQUFDLEVBQUUsV0FBVztFQUNwRDtBQUNGIn0=
// denoCacheMetadata=12609629258914038904,15441849986739174281