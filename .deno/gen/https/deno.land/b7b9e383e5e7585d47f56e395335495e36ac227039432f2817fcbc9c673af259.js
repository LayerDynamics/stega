import { GenericInput } from "./_generic_input.ts";
import { bold, brightBlue, dim, dirname, join, normalize, stripColor, underline } from "./deps.ts";
import { Figures, getFiguresByKeys } from "./figures.ts";
import { distance } from "../_utils/distance.ts";
const sep = Deno.build.os === "windows" ? "\\" : "/";
/** Generic input prompt representation. */ export class GenericSuggestions extends GenericInput {
  suggestionsIndex = -1;
  suggestionsOffset = 0;
  suggestions = [];
  #hasReadPermissions;
  /**
   * Prompt constructor.
   * @param settings Prompt settings.
   */ constructor(settings){
    super({
      ...settings,
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
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjI1LjcvcHJvbXB0L19nZW5lcmljX3N1Z2dlc3Rpb25zLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgS2V5Q29kZSB9IGZyb20gXCIuLi9rZXljb2RlL2tleV9jb2RlLnRzXCI7XG5pbXBvcnQge1xuICBHZW5lcmljSW5wdXQsXG4gIEdlbmVyaWNJbnB1dEtleXMsXG4gIEdlbmVyaWNJbnB1dFByb21wdE9wdGlvbnMsXG4gIEdlbmVyaWNJbnB1dFByb21wdFNldHRpbmdzLFxufSBmcm9tIFwiLi9fZ2VuZXJpY19pbnB1dC50c1wiO1xuaW1wb3J0IHtcbiAgYm9sZCxcbiAgYnJpZ2h0Qmx1ZSxcbiAgZGltLFxuICBkaXJuYW1lLFxuICBqb2luLFxuICBub3JtYWxpemUsXG4gIHN0cmlwQ29sb3IsXG4gIHVuZGVybGluZSxcbn0gZnJvbSBcIi4vZGVwcy50c1wiO1xuaW1wb3J0IHsgRmlndXJlcywgZ2V0RmlndXJlc0J5S2V5cyB9IGZyb20gXCIuL2ZpZ3VyZXMudHNcIjtcbmltcG9ydCB7IGRpc3RhbmNlIH0gZnJvbSBcIi4uL191dGlscy9kaXN0YW5jZS50c1wiO1xuXG5pbnRlcmZhY2UgTG9jYWxTdG9yYWdlIHtcbiAgZ2V0SXRlbShrZXk6IHN0cmluZyk6IHN0cmluZyB8IG51bGw7XG4gIHJlbW92ZUl0ZW0oa2V5OiBzdHJpbmcpOiB2b2lkO1xuICBzZXRJdGVtKGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogdm9pZDtcbn1cblxuLyoqIElucHV0IGtleXMgb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgR2VuZXJpY1N1Z2dlc3Rpb25zS2V5cyBleHRlbmRzIEdlbmVyaWNJbnB1dEtleXMge1xuICBjb21wbGV0ZT86IHN0cmluZ1tdO1xuICBuZXh0Pzogc3RyaW5nW107XG4gIHByZXZpb3VzPzogc3RyaW5nW107XG4gIG5leHRQYWdlPzogc3RyaW5nW107XG4gIHByZXZpb3VzUGFnZT86IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgdHlwZSBTdWdnZXN0aW9uSGFuZGxlciA9IChcbiAgaW5wdXQ6IHN0cmluZyxcbikgPT4gQXJyYXk8c3RyaW5nIHwgbnVtYmVyPiB8IFByb21pc2U8QXJyYXk8c3RyaW5nIHwgbnVtYmVyPj47XG5cbmV4cG9ydCB0eXBlIENvbXBsZXRlSGFuZGxlciA9IChcbiAgaW5wdXQ6IHN0cmluZyxcbiAgc3VnZ2VzdGlvbj86IHN0cmluZyxcbikgPT4gUHJvbWlzZTxzdHJpbmc+IHwgc3RyaW5nO1xuXG4vKiogR2VuZXJpYyBpbnB1dCBwcm9tcHQgb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgR2VuZXJpY1N1Z2dlc3Rpb25zT3B0aW9uczxUVmFsdWUsIFRSYXdWYWx1ZT5cbiAgZXh0ZW5kcyBHZW5lcmljSW5wdXRQcm9tcHRPcHRpb25zPFRWYWx1ZSwgVFJhd1ZhbHVlPiB7XG4gIGtleXM/OiBHZW5lcmljU3VnZ2VzdGlvbnNLZXlzO1xuICBpZD86IHN0cmluZztcbiAgc3VnZ2VzdGlvbnM/OiBBcnJheTxzdHJpbmcgfCBudW1iZXI+IHwgU3VnZ2VzdGlvbkhhbmRsZXI7XG4gIGNvbXBsZXRlPzogQ29tcGxldGVIYW5kbGVyO1xuICBmaWxlcz86IGJvb2xlYW4gfCBSZWdFeHA7XG4gIGxpc3Q/OiBib29sZWFuO1xuICBpbmZvPzogYm9vbGVhbjtcbiAgbGlzdFBvaW50ZXI/OiBzdHJpbmc7XG4gIG1heFJvd3M/OiBudW1iZXI7XG59XG5cbi8qKiBHZW5lcmljIGlucHV0IHByb21wdCBzZXR0aW5ncy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgR2VuZXJpY1N1Z2dlc3Rpb25zU2V0dGluZ3M8VFZhbHVlLCBUUmF3VmFsdWU+XG4gIGV4dGVuZHMgR2VuZXJpY0lucHV0UHJvbXB0U2V0dGluZ3M8VFZhbHVlLCBUUmF3VmFsdWU+IHtcbiAga2V5cz86IEdlbmVyaWNTdWdnZXN0aW9uc0tleXM7XG4gIGlkPzogc3RyaW5nO1xuICBzdWdnZXN0aW9ucz86IEFycmF5PHN0cmluZyB8IG51bWJlcj4gfCBTdWdnZXN0aW9uSGFuZGxlcjtcbiAgY29tcGxldGU/OiBDb21wbGV0ZUhhbmRsZXI7XG4gIGZpbGVzPzogYm9vbGVhbiB8IFJlZ0V4cDtcbiAgbGlzdD86IGJvb2xlYW47XG4gIGluZm8/OiBib29sZWFuO1xuICBsaXN0UG9pbnRlcjogc3RyaW5nO1xuICBtYXhSb3dzOiBudW1iZXI7XG59XG5cbmNvbnN0IHNlcCA9IERlbm8uYnVpbGQub3MgPT09IFwid2luZG93c1wiID8gXCJcXFxcXCIgOiBcIi9cIjtcblxuLyoqIEdlbmVyaWMgaW5wdXQgcHJvbXB0IHJlcHJlc2VudGF0aW9uLiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEdlbmVyaWNTdWdnZXN0aW9uczxcbiAgVFZhbHVlLFxuICBUUmF3VmFsdWUsXG4gIFRTZXR0aW5ncyBleHRlbmRzIEdlbmVyaWNTdWdnZXN0aW9uc1NldHRpbmdzPFRWYWx1ZSwgVFJhd1ZhbHVlPixcbj4gZXh0ZW5kcyBHZW5lcmljSW5wdXQ8VFZhbHVlLCBUUmF3VmFsdWUsIFRTZXR0aW5ncz4ge1xuICBwcm90ZWN0ZWQgc3VnZ2VzdGlvbnNJbmRleCA9IC0xO1xuICBwcm90ZWN0ZWQgc3VnZ2VzdGlvbnNPZmZzZXQgPSAwO1xuICBwcm90ZWN0ZWQgc3VnZ2VzdGlvbnM6IEFycmF5PHN0cmluZyB8IG51bWJlcj4gPSBbXTtcbiAgI2hhc1JlYWRQZXJtaXNzaW9ucz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFByb21wdCBjb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHNldHRpbmdzIFByb21wdCBzZXR0aW5ncy5cbiAgICovXG4gIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihzZXR0aW5nczogVFNldHRpbmdzKSB7XG4gICAgc3VwZXIoe1xuICAgICAgLi4uc2V0dGluZ3MsXG4gICAgICBrZXlzOiB7XG4gICAgICAgIGNvbXBsZXRlOiBbXCJ0YWJcIl0sXG4gICAgICAgIG5leHQ6IFtcInVwXCJdLFxuICAgICAgICBwcmV2aW91czogW1wiZG93blwiXSxcbiAgICAgICAgbmV4dFBhZ2U6IFtcInBhZ2V1cFwiXSxcbiAgICAgICAgcHJldmlvdXNQYWdlOiBbXCJwYWdlZG93blwiXSxcbiAgICAgICAgLi4uKHNldHRpbmdzLmtleXMgPz8ge30pLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXQgbG9jYWxTdG9yYWdlKCk6IExvY2FsU3RvcmFnZSB8IG51bGwge1xuICAgIC8vIEtlZXAgc3VwcG9ydCBmb3IgZGVubyA8IDEuMTAuXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuaWQgJiYgXCJsb2NhbFN0b3JhZ2VcIiBpbiB3aW5kb3cpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICAgIHJldHVybiAod2luZG93IGFzIGFueSkubG9jYWxTdG9yYWdlO1xuICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAvLyBJZ25vcmUgZXJyb3IgaWYgLS1sb2NhdGlvbiBpcyBub3Qgc2V0LlxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByb3RlY3RlZCBsb2FkU3VnZ2VzdGlvbnMoKTogQXJyYXk8c3RyaW5nIHwgbnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuaWQpIHtcbiAgICAgIGNvbnN0IGpzb24gPSB0aGlzLmxvY2FsU3RvcmFnZT8uZ2V0SXRlbSh0aGlzLnNldHRpbmdzLmlkKTtcbiAgICAgIGNvbnN0IHN1Z2dlc3Rpb25zOiBBcnJheTxzdHJpbmcgfCBudW1iZXI+ID0ganNvbiA/IEpTT04ucGFyc2UoanNvbikgOiBbXTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShzdWdnZXN0aW9ucykpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN1Z2dlc3Rpb25zO1xuICAgIH1cbiAgICByZXR1cm4gW107XG4gIH1cblxuICBwcm90ZWN0ZWQgc2F2ZVN1Z2dlc3Rpb25zKC4uLnN1Z2dlc3Rpb25zOiBBcnJheTxzdHJpbmcgfCBudW1iZXI+KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuaWQpIHtcbiAgICAgIHRoaXMubG9jYWxTdG9yYWdlPy5zZXRJdGVtKFxuICAgICAgICB0aGlzLnNldHRpbmdzLmlkLFxuICAgICAgICBKU09OLnN0cmluZ2lmeShbXG4gICAgICAgICAgLi4uc3VnZ2VzdGlvbnMsXG4gICAgICAgICAgLi4udGhpcy5sb2FkU3VnZ2VzdGlvbnMoKSxcbiAgICAgICAgXS5maWx0ZXIodW5pcXVlU3VnZ2VzdGlvbnMpKSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIHJlbmRlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5maWxlcyAmJiB0aGlzLiNoYXNSZWFkUGVybWlzc2lvbnMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgRGVuby5wZXJtaXNzaW9ucy5yZXF1ZXN0KHsgbmFtZTogXCJyZWFkXCIgfSk7XG4gICAgICAvLyBkaXNhYmxlIHBhdGggY29tcGxldGlvbiBpZiByZWFkIHBlcm1pc3Npb25zIGFyZSBkZW5pZWQuXG4gICAgICB0aGlzLiNoYXNSZWFkUGVybWlzc2lvbnMgPSBzdGF0dXMuc3RhdGUgPT09IFwiZ3JhbnRlZFwiO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLm1hdGNoKCk7XG4gICAgcmV0dXJuIHN1cGVyLnJlbmRlcigpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIG1hdGNoKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc3VnZ2VzdGlvbnMgPSBhd2FpdCB0aGlzLmdldFN1Z2dlc3Rpb25zKCk7XG4gICAgdGhpcy5zdWdnZXN0aW9uc0luZGV4ID0gTWF0aC5tYXgoXG4gICAgICB0aGlzLmdldEN1cnJlbnRJbnB1dFZhbHVlKCkudHJpbSgpLmxlbmd0aCA9PT0gMCA/IC0xIDogMCxcbiAgICAgIE1hdGgubWluKHRoaXMuc3VnZ2VzdGlvbnMubGVuZ3RoIC0gMSwgdGhpcy5zdWdnZXN0aW9uc0luZGV4KSxcbiAgICApO1xuICAgIHRoaXMuc3VnZ2VzdGlvbnNPZmZzZXQgPSBNYXRoLm1heChcbiAgICAgIDAsXG4gICAgICBNYXRoLm1pbihcbiAgICAgICAgdGhpcy5zdWdnZXN0aW9ucy5sZW5ndGggLSB0aGlzLmdldExpc3RIZWlnaHQoKSxcbiAgICAgICAgdGhpcy5zdWdnZXN0aW9uc09mZnNldCxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBpbnB1dCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBzdXBlci5pbnB1dCgpICsgZGltKHRoaXMuZ2V0U3VnZ2VzdGlvbigpKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXRTdWdnZXN0aW9uKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuc3VnZ2VzdGlvbnNbdGhpcy5zdWdnZXN0aW9uc0luZGV4XT8udG9TdHJpbmcoKVxuICAgICAgLnN1YnN0cihcbiAgICAgICAgdGhpcy5nZXRDdXJyZW50SW5wdXRWYWx1ZSgpLmxlbmd0aCxcbiAgICAgICkgPz8gXCJcIjtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRVc2VyU3VnZ2VzdGlvbnMoXG4gICAgaW5wdXQ6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxBcnJheTxzdHJpbmcgfCBudW1iZXI+PiB7XG4gICAgcmV0dXJuIHR5cGVvZiB0aGlzLnNldHRpbmdzLnN1Z2dlc3Rpb25zID09PSBcImZ1bmN0aW9uXCJcbiAgICAgID8gYXdhaXQgdGhpcy5zZXR0aW5ncy5zdWdnZXN0aW9ucyhpbnB1dClcbiAgICAgIDogdGhpcy5zZXR0aW5ncy5zdWdnZXN0aW9ucyA/PyBbXTtcbiAgfVxuXG4gICNpc0ZpbGVNb2RlRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF0aGlzLnNldHRpbmdzLmZpbGVzICYmIHRoaXMuI2hhc1JlYWRQZXJtaXNzaW9ucyA9PT0gdHJ1ZTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRGaWxlU3VnZ2VzdGlvbnMoXG4gICAgaW5wdXQ6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxBcnJheTxzdHJpbmcgfCBudW1iZXI+PiB7XG4gICAgaWYgKCF0aGlzLiNpc0ZpbGVNb2RlRW5hYmxlZCgpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IERlbm8uc3RhdChpbnB1dClcbiAgICAgIC50aGVuKChmaWxlKSA9PiBmaWxlLmlzRGlyZWN0b3J5ID8gaW5wdXQgOiBkaXJuYW1lKGlucHV0KSlcbiAgICAgIC5jYXRjaCgoKSA9PiBkaXJuYW1lKGlucHV0KSk7XG5cbiAgICByZXR1cm4gYXdhaXQgbGlzdERpcihwYXRoLCB0aGlzLnNldHRpbmdzLmZpbGVzKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRTdWdnZXN0aW9ucygpOiBQcm9taXNlPEFycmF5PHN0cmluZyB8IG51bWJlcj4+IHtcbiAgICBjb25zdCBpbnB1dCA9IHRoaXMuZ2V0Q3VycmVudElucHV0VmFsdWUoKTtcbiAgICBjb25zdCBzdWdnZXN0aW9ucyA9IFtcbiAgICAgIC4uLnRoaXMubG9hZFN1Z2dlc3Rpb25zKCksXG4gICAgICAuLi5hd2FpdCB0aGlzLmdldFVzZXJTdWdnZXN0aW9ucyhpbnB1dCksXG4gICAgICAuLi5hd2FpdCB0aGlzLmdldEZpbGVTdWdnZXN0aW9ucyhpbnB1dCksXG4gICAgXS5maWx0ZXIodW5pcXVlU3VnZ2VzdGlvbnMpO1xuXG4gICAgaWYgKCFpbnB1dC5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBzdWdnZXN0aW9ucztcbiAgICB9XG5cbiAgICByZXR1cm4gc3VnZ2VzdGlvbnNcbiAgICAgIC5maWx0ZXIoKHZhbHVlOiBzdHJpbmcgfCBudW1iZXIpID0+XG4gICAgICAgIHN0cmlwQ29sb3IodmFsdWUudG9TdHJpbmcoKSlcbiAgICAgICAgICAudG9Mb3dlckNhc2UoKVxuICAgICAgICAgIC5zdGFydHNXaXRoKGlucHV0LnRvTG93ZXJDYXNlKCkpXG4gICAgICApXG4gICAgICAuc29ydCgoYTogc3RyaW5nIHwgbnVtYmVyLCBiOiBzdHJpbmcgfCBudW1iZXIpID0+XG4gICAgICAgIGRpc3RhbmNlKChhIHx8IGEpLnRvU3RyaW5nKCksIGlucHV0KSAtXG4gICAgICAgIGRpc3RhbmNlKChiIHx8IGIpLnRvU3RyaW5nKCksIGlucHV0KVxuICAgICAgKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBib2R5KCk6IHN0cmluZyB8IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0TGlzdCgpICsgdGhpcy5nZXRJbmZvKCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0SW5mbygpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5zZXR0aW5ncy5pbmZvKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgY29uc3Qgc2VsZWN0ZWQ6IG51bWJlciA9IHRoaXMuc3VnZ2VzdGlvbnNJbmRleCArIDE7XG4gICAgY29uc3QgbWF0Y2hlZDogbnVtYmVyID0gdGhpcy5zdWdnZXN0aW9ucy5sZW5ndGg7XG4gICAgY29uc3QgYWN0aW9uczogQXJyYXk8W3N0cmluZywgQXJyYXk8c3RyaW5nPl0+ID0gW107XG5cbiAgICBpZiAodGhpcy5zdWdnZXN0aW9ucy5sZW5ndGgpIHtcbiAgICAgIGlmICh0aGlzLnNldHRpbmdzLmxpc3QpIHtcbiAgICAgICAgYWN0aW9ucy5wdXNoKFxuICAgICAgICAgIFtcIk5leHRcIiwgZ2V0RmlndXJlc0J5S2V5cyh0aGlzLnNldHRpbmdzLmtleXM/Lm5leHQgPz8gW10pXSxcbiAgICAgICAgICBbXCJQcmV2aW91c1wiLCBnZXRGaWd1cmVzQnlLZXlzKHRoaXMuc2V0dGluZ3Mua2V5cz8ucHJldmlvdXMgPz8gW10pXSxcbiAgICAgICAgICBbXCJOZXh0IFBhZ2VcIiwgZ2V0RmlndXJlc0J5S2V5cyh0aGlzLnNldHRpbmdzLmtleXM/Lm5leHRQYWdlID8/IFtdKV0sXG4gICAgICAgICAgW1xuICAgICAgICAgICAgXCJQcmV2aW91cyBQYWdlXCIsXG4gICAgICAgICAgICBnZXRGaWd1cmVzQnlLZXlzKHRoaXMuc2V0dGluZ3Mua2V5cz8ucHJldmlvdXNQYWdlID8/IFtdKSxcbiAgICAgICAgICBdLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWN0aW9ucy5wdXNoKFxuICAgICAgICAgIFtcIk5leHRcIiwgZ2V0RmlndXJlc0J5S2V5cyh0aGlzLnNldHRpbmdzLmtleXM/Lm5leHQgPz8gW10pXSxcbiAgICAgICAgICBbXCJQcmV2aW91c1wiLCBnZXRGaWd1cmVzQnlLZXlzKHRoaXMuc2V0dGluZ3Mua2V5cz8ucHJldmlvdXMgPz8gW10pXSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGFjdGlvbnMucHVzaChcbiAgICAgICAgW1wiQ29tcGxldGVcIiwgZ2V0RmlndXJlc0J5S2V5cyh0aGlzLnNldHRpbmdzLmtleXM/LmNvbXBsZXRlID8/IFtdKV0sXG4gICAgICApO1xuICAgIH1cbiAgICBhY3Rpb25zLnB1c2goXG4gICAgICBbXCJTdWJtaXRcIiwgZ2V0RmlndXJlc0J5S2V5cyh0aGlzLnNldHRpbmdzLmtleXM/LnN1Ym1pdCA/PyBbXSldLFxuICAgICk7XG5cbiAgICBsZXQgaW5mbyA9IHRoaXMuc2V0dGluZ3MuaW5kZW50O1xuICAgIGlmICh0aGlzLnN1Z2dlc3Rpb25zLmxlbmd0aCkge1xuICAgICAgaW5mbyArPSBicmlnaHRCbHVlKEZpZ3VyZXMuSU5GTykgKyBib2xkKGAgJHtzZWxlY3RlZH0vJHttYXRjaGVkfSBgKTtcbiAgICB9XG4gICAgaW5mbyArPSBhY3Rpb25zXG4gICAgICAubWFwKChjdXIpID0+IGAke2N1clswXX06ICR7Ym9sZChjdXJbMV0uam9pbihcIiBcIikpfWApXG4gICAgICAuam9pbihcIiwgXCIpO1xuXG4gICAgcmV0dXJuIGluZm87XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0TGlzdCgpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5zdWdnZXN0aW9ucy5sZW5ndGggfHwgIXRoaXMuc2V0dGluZ3MubGlzdCkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIGNvbnN0IGxpc3Q6IEFycmF5PHN0cmluZz4gPSBbXTtcbiAgICBjb25zdCBoZWlnaHQ6IG51bWJlciA9IHRoaXMuZ2V0TGlzdEhlaWdodCgpO1xuICAgIGZvciAoXG4gICAgICBsZXQgaSA9IHRoaXMuc3VnZ2VzdGlvbnNPZmZzZXQ7XG4gICAgICBpIDwgdGhpcy5zdWdnZXN0aW9uc09mZnNldCArIGhlaWdodDtcbiAgICAgIGkrK1xuICAgICkge1xuICAgICAgbGlzdC5wdXNoKFxuICAgICAgICB0aGlzLmdldExpc3RJdGVtKFxuICAgICAgICAgIHRoaXMuc3VnZ2VzdGlvbnNbaV0sXG4gICAgICAgICAgdGhpcy5zdWdnZXN0aW9uc0luZGV4ID09PSBpLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKGxpc3QubGVuZ3RoICYmIHRoaXMuc2V0dGluZ3MuaW5mbykge1xuICAgICAgbGlzdC5wdXNoKFwiXCIpO1xuICAgIH1cbiAgICByZXR1cm4gbGlzdC5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbmRlciBvcHRpb24uXG4gICAqIEBwYXJhbSB2YWx1ZSAgICAgICAgT3B0aW9uLlxuICAgKiBAcGFyYW0gaXNTZWxlY3RlZCAgU2V0IHRvIHRydWUgaWYgb3B0aW9uIGlzIHNlbGVjdGVkLlxuICAgKi9cbiAgcHJvdGVjdGVkIGdldExpc3RJdGVtKFxuICAgIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIsXG4gICAgaXNTZWxlY3RlZD86IGJvb2xlYW4sXG4gICk6IHN0cmluZyB7XG4gICAgbGV0IGxpbmUgPSB0aGlzLnNldHRpbmdzLmluZGVudCA/PyBcIlwiO1xuICAgIGxpbmUgKz0gaXNTZWxlY3RlZCA/IGAke3RoaXMuc2V0dGluZ3MubGlzdFBvaW50ZXJ9IGAgOiBcIiAgXCI7XG4gICAgaWYgKGlzU2VsZWN0ZWQpIHtcbiAgICAgIGxpbmUgKz0gdW5kZXJsaW5lKHRoaXMuaGlnaGxpZ2h0KHZhbHVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpbmUgKz0gdGhpcy5oaWdobGlnaHQodmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gbGluZTtcbiAgfVxuXG4gIC8qKiBHZXQgc3VnZ2VzdGlvbnMgcm93IGhlaWdodC4gKi9cbiAgcHJvdGVjdGVkIGdldExpc3RIZWlnaHQoXG4gICAgc3VnZ2VzdGlvbnM6IEFycmF5PHN0cmluZyB8IG51bWJlcj4gPSB0aGlzLnN1Z2dlc3Rpb25zLFxuICApOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLm1pbihcbiAgICAgIHN1Z2dlc3Rpb25zLmxlbmd0aCxcbiAgICAgIHRoaXMuc2V0dGluZ3MubWF4Um93cyB8fCBzdWdnZXN0aW9ucy5sZW5ndGgsXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgdXNlciBpbnB1dCBldmVudC5cbiAgICogQHBhcmFtIGV2ZW50IEtleSBldmVudC5cbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBoYW5kbGVFdmVudChldmVudDogS2V5Q29kZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgICAgY2FzZSB0aGlzLmlzS2V5KHRoaXMuc2V0dGluZ3Mua2V5cywgXCJuZXh0XCIsIGV2ZW50KTpcbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MubGlzdCkge1xuICAgICAgICAgIHRoaXMuc2VsZWN0UHJldmlvdXNTdWdnZXN0aW9uKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3ROZXh0U3VnZ2VzdGlvbigpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLmlzS2V5KHRoaXMuc2V0dGluZ3Mua2V5cywgXCJwcmV2aW91c1wiLCBldmVudCk6XG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmxpc3QpIHtcbiAgICAgICAgICB0aGlzLnNlbGVjdE5leHRTdWdnZXN0aW9uKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3RQcmV2aW91c1N1Z2dlc3Rpb24oKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgdGhpcy5pc0tleSh0aGlzLnNldHRpbmdzLmtleXMsIFwibmV4dFBhZ2VcIiwgZXZlbnQpOlxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5saXN0KSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3RQcmV2aW91c1N1Z2dlc3Rpb25zUGFnZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuc2VsZWN0TmV4dFN1Z2dlc3Rpb25zUGFnZSgpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLmlzS2V5KHRoaXMuc2V0dGluZ3Mua2V5cywgXCJwcmV2aW91c1BhZ2VcIiwgZXZlbnQpOlxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5saXN0KSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3ROZXh0U3VnZ2VzdGlvbnNQYWdlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3RQcmV2aW91c1N1Z2dlc3Rpb25zUGFnZSgpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSB0aGlzLmlzS2V5KHRoaXMuc2V0dGluZ3Mua2V5cywgXCJjb21wbGV0ZVwiLCBldmVudCk6XG4gICAgICAgIGF3YWl0IHRoaXMuI2NvbXBsZXRlVmFsdWUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIHRoaXMuaXNLZXkodGhpcy5zZXR0aW5ncy5rZXlzLCBcIm1vdmVDdXJzb3JSaWdodFwiLCBldmVudCk6XG4gICAgICAgIGlmICh0aGlzLmlucHV0SW5kZXggPCB0aGlzLmlucHV0VmFsdWUubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5tb3ZlQ3Vyc29yUmlnaHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLiNjb21wbGV0ZVZhbHVlKCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhd2FpdCBzdXBlci5oYW5kbGVFdmVudChldmVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIERlbGV0ZSBjaGFyIHJpZ2h0LiAqL1xuICBwcm90ZWN0ZWQgZGVsZXRlQ2hhclJpZ2h0KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmlucHV0SW5kZXggPCB0aGlzLmlucHV0VmFsdWUubGVuZ3RoKSB7XG4gICAgICBzdXBlci5kZWxldGVDaGFyUmlnaHQoKTtcbiAgICAgIGlmICghdGhpcy5nZXRDdXJyZW50SW5wdXRWYWx1ZSgpLmxlbmd0aCkge1xuICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zSW5kZXggPSAtMTtcbiAgICAgICAgdGhpcy5zdWdnZXN0aW9uc09mZnNldCA9IDA7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgI2NvbXBsZXRlVmFsdWUoKSB7XG4gICAgdGhpcy5pbnB1dFZhbHVlID0gYXdhaXQgdGhpcy5jb21wbGV0ZSgpO1xuICAgIHRoaXMuaW5wdXRJbmRleCA9IHRoaXMuaW5wdXRWYWx1ZS5sZW5ndGg7XG4gICAgdGhpcy5zdWdnZXN0aW9uc0luZGV4ID0gMDtcbiAgICB0aGlzLnN1Z2dlc3Rpb25zT2Zmc2V0ID0gMDtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBjb21wbGV0ZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBpbnB1dDogc3RyaW5nID0gdGhpcy5nZXRDdXJyZW50SW5wdXRWYWx1ZSgpO1xuICAgIGNvbnN0IHN1Z2dlc3Rpb246IHN0cmluZyB8IHVuZGVmaW5lZCA9IHRoaXNcbiAgICAgIC5zdWdnZXN0aW9uc1t0aGlzLnN1Z2dlc3Rpb25zSW5kZXhdPy50b1N0cmluZygpO1xuXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuY29tcGxldGUpIHtcbiAgICAgIGlucHV0ID0gYXdhaXQgdGhpcy5zZXR0aW5ncy5jb21wbGV0ZShpbnB1dCwgc3VnZ2VzdGlvbik7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHRoaXMuI2lzRmlsZU1vZGVFbmFibGVkKCkgJiZcbiAgICAgIGlucHV0LmF0KC0xKSAhPT0gc2VwICYmXG4gICAgICBhd2FpdCBpc0RpcmVjdG9yeShpbnB1dCkgJiZcbiAgICAgIChcbiAgICAgICAgdGhpcy5nZXRDdXJyZW50SW5wdXRWYWx1ZSgpLmF0KC0xKSAhPT0gXCIuXCIgfHxcbiAgICAgICAgdGhpcy5nZXRDdXJyZW50SW5wdXRWYWx1ZSgpLmVuZHNXaXRoKFwiLi5cIilcbiAgICAgIClcbiAgICApIHtcbiAgICAgIGlucHV0ICs9IHNlcDtcbiAgICB9IGVsc2UgaWYgKHN1Z2dlc3Rpb24pIHtcbiAgICAgIGlucHV0ID0gc3VnZ2VzdGlvbjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy4jaXNGaWxlTW9kZUVuYWJsZWQoKSA/IG5vcm1hbGl6ZShpbnB1dCkgOiBpbnB1dDtcbiAgfVxuXG4gIC8qKiBTZWxlY3QgcHJldmlvdXMgc3VnZ2VzdGlvbi4gKi9cbiAgcHJvdGVjdGVkIHNlbGVjdFByZXZpb3VzU3VnZ2VzdGlvbigpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zdWdnZXN0aW9ucy5sZW5ndGgpIHtcbiAgICAgIGlmICh0aGlzLnN1Z2dlc3Rpb25zSW5kZXggPiAtMSkge1xuICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zSW5kZXgtLTtcbiAgICAgICAgaWYgKHRoaXMuc3VnZ2VzdGlvbnNJbmRleCA8IHRoaXMuc3VnZ2VzdGlvbnNPZmZzZXQpIHtcbiAgICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zT2Zmc2V0LS07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogU2VsZWN0IG5leHQgc3VnZ2VzdGlvbi4gKi9cbiAgcHJvdGVjdGVkIHNlbGVjdE5leHRTdWdnZXN0aW9uKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnN1Z2dlc3Rpb25zLmxlbmd0aCkge1xuICAgICAgaWYgKHRoaXMuc3VnZ2VzdGlvbnNJbmRleCA8IHRoaXMuc3VnZ2VzdGlvbnMubGVuZ3RoIC0gMSkge1xuICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zSW5kZXgrKztcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHRoaXMuc3VnZ2VzdGlvbnNJbmRleCA+PVxuICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9uc09mZnNldCArIHRoaXMuZ2V0TGlzdEhlaWdodCgpXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXMuc3VnZ2VzdGlvbnNPZmZzZXQrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBTZWxlY3QgcHJldmlvdXMgc3VnZ2VzdGlvbnMgcGFnZS4gKi9cbiAgcHJvdGVjdGVkIHNlbGVjdFByZXZpb3VzU3VnZ2VzdGlvbnNQYWdlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnN1Z2dlc3Rpb25zLmxlbmd0aCkge1xuICAgICAgY29uc3QgaGVpZ2h0OiBudW1iZXIgPSB0aGlzLmdldExpc3RIZWlnaHQoKTtcbiAgICAgIGlmICh0aGlzLnN1Z2dlc3Rpb25zT2Zmc2V0ID49IGhlaWdodCkge1xuICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zSW5kZXggLT0gaGVpZ2h0O1xuICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zT2Zmc2V0IC09IGhlaWdodDtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5zdWdnZXN0aW9uc09mZnNldCA+IDApIHtcbiAgICAgICAgdGhpcy5zdWdnZXN0aW9uc0luZGV4IC09IHRoaXMuc3VnZ2VzdGlvbnNPZmZzZXQ7XG4gICAgICAgIHRoaXMuc3VnZ2VzdGlvbnNPZmZzZXQgPSAwO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBTZWxlY3QgbmV4dCBzdWdnZXN0aW9ucyBwYWdlLiAqL1xuICBwcm90ZWN0ZWQgc2VsZWN0TmV4dFN1Z2dlc3Rpb25zUGFnZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zdWdnZXN0aW9ucy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IGhlaWdodDogbnVtYmVyID0gdGhpcy5nZXRMaXN0SGVpZ2h0KCk7XG4gICAgICBpZiAodGhpcy5zdWdnZXN0aW9uc09mZnNldCArIGhlaWdodCArIGhlaWdodCA8IHRoaXMuc3VnZ2VzdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuc3VnZ2VzdGlvbnNJbmRleCArPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuc3VnZ2VzdGlvbnNPZmZzZXQgKz0gaGVpZ2h0O1xuICAgICAgfSBlbHNlIGlmICh0aGlzLnN1Z2dlc3Rpb25zT2Zmc2V0ICsgaGVpZ2h0IDwgdGhpcy5zdWdnZXN0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5zdWdnZXN0aW9ucy5sZW5ndGggLSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuc3VnZ2VzdGlvbnNJbmRleCArPSBvZmZzZXQgLSB0aGlzLnN1Z2dlc3Rpb25zT2Zmc2V0O1xuICAgICAgICB0aGlzLnN1Z2dlc3Rpb25zT2Zmc2V0ID0gb2Zmc2V0O1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB1bmlxdWVTdWdnZXN0aW9ucyhcbiAgdmFsdWU6IHVua25vd24sXG4gIGluZGV4OiBudW1iZXIsXG4gIHNlbGY6IEFycmF5PHVua25vd24+LFxuKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgIT09IFwidW5kZWZpbmVkXCIgJiYgdmFsdWUgIT09IFwiXCIgJiZcbiAgICBzZWxmLmluZGV4T2YodmFsdWUpID09PSBpbmRleDtcbn1cblxuZnVuY3Rpb24gaXNEaXJlY3RvcnkocGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIHJldHVybiBEZW5vLnN0YXQocGF0aClcbiAgICAudGhlbigoZmlsZSkgPT4gZmlsZS5pc0RpcmVjdG9yeSlcbiAgICAuY2F0Y2goKCkgPT4gZmFsc2UpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBsaXN0RGlyKFxuICBwYXRoOiBzdHJpbmcsXG4gIG1vZGU/OiBib29sZWFuIHwgUmVnRXhwLFxuKTogUHJvbWlzZTxBcnJheTxzdHJpbmc+PiB7XG4gIGNvbnN0IGZpbGVOYW1lczogc3RyaW5nW10gPSBbXTtcblxuICBmb3IgYXdhaXQgKGNvbnN0IGZpbGUgb2YgRGVuby5yZWFkRGlyKHBhdGggfHwgXCIuXCIpKSB7XG4gICAgaWYgKFxuICAgICAgbW9kZSA9PT0gdHJ1ZSAmJiAoZmlsZS5uYW1lLnN0YXJ0c1dpdGgoXCIuXCIpIHx8IGZpbGUubmFtZS5lbmRzV2l0aChcIn5cIikpXG4gICAgKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgZmlsZVBhdGggPSBqb2luKHBhdGgsIGZpbGUubmFtZSk7XG5cbiAgICBpZiAobW9kZSBpbnN0YW5jZW9mIFJlZ0V4cCAmJiAhbW9kZS50ZXN0KGZpbGVQYXRoKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGZpbGVOYW1lcy5wdXNoKGZpbGVQYXRoKTtcbiAgfVxuXG4gIHJldHVybiBmaWxlTmFtZXMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhLnRvTG93ZXJDYXNlKCkubG9jYWxlQ29tcGFyZShiLnRvTG93ZXJDYXNlKCkpO1xuICB9KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUNFLFlBQVksUUFJUCxzQkFBc0I7QUFDN0IsU0FDRSxJQUFJLEVBQ0osVUFBVSxFQUNWLEdBQUcsRUFDSCxPQUFPLEVBQ1AsSUFBSSxFQUNKLFNBQVMsRUFDVCxVQUFVLEVBQ1YsU0FBUyxRQUNKLFlBQVk7QUFDbkIsU0FBUyxPQUFPLEVBQUUsZ0JBQWdCLFFBQVEsZUFBZTtBQUN6RCxTQUFTLFFBQVEsUUFBUSx3QkFBd0I7QUFzRGpELE1BQU0sTUFBTSxLQUFLLEtBQUssQ0FBQyxFQUFFLEtBQUssWUFBWSxPQUFPO0FBRWpELHlDQUF5QyxHQUN6QyxPQUFPLE1BQWUsMkJBSVo7RUFDRSxtQkFBbUIsQ0FBQyxFQUFFO0VBQ3RCLG9CQUFvQixFQUFFO0VBQ3RCLGNBQXNDLEVBQUUsQ0FBQztFQUNuRCxDQUFBLGtCQUFtQixDQUFXO0VBRTlCOzs7R0FHQyxHQUNELFlBQXNCLFFBQW1CLENBQUU7SUFDekMsS0FBSyxDQUFDO01BQ0osR0FBRyxRQUFRO01BQ1gsTUFBTTtRQUNKLFVBQVU7VUFBQztTQUFNO1FBQ2pCLE1BQU07VUFBQztTQUFLO1FBQ1osVUFBVTtVQUFDO1NBQU87UUFDbEIsVUFBVTtVQUFDO1NBQVM7UUFDcEIsY0FBYztVQUFDO1NBQVc7UUFDMUIsR0FBSSxTQUFTLElBQUksSUFBSSxDQUFDLENBQUM7TUFDekI7SUFDRjtFQUNGO0VBRUEsSUFBYyxlQUFvQztJQUNoRCxnQ0FBZ0M7SUFDaEMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsSUFBSSxrQkFBa0IsUUFBUTtNQUNoRCxJQUFJO1FBQ0YsbUNBQW1DO1FBQ25DLE9BQU8sQUFBQyxPQUFlLFlBQVk7TUFDckMsRUFBRSxPQUFPLEdBQUc7TUFDVix5Q0FBeUM7TUFDM0M7SUFDRjtJQUNBLE9BQU87RUFDVDtFQUVVLGtCQUEwQztJQUNsRCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFO01BQ3BCLE1BQU0sT0FBTyxJQUFJLENBQUMsWUFBWSxFQUFFLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO01BQ3hELE1BQU0sY0FBc0MsT0FBTyxLQUFLLEtBQUssQ0FBQyxRQUFRLEVBQUU7TUFDeEUsSUFBSSxDQUFDLE1BQU0sT0FBTyxDQUFDLGNBQWM7UUFDL0IsT0FBTyxFQUFFO01BQ1g7TUFDQSxPQUFPO0lBQ1Q7SUFDQSxPQUFPLEVBQUU7RUFDWDtFQUVVLGdCQUFnQixHQUFHLFdBQW1DLEVBQVE7SUFDdEUsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRTtNQUNwQixJQUFJLENBQUMsWUFBWSxFQUFFLFFBQ2pCLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUNoQixLQUFLLFNBQVMsQ0FBQztXQUNWO1dBQ0EsSUFBSSxDQUFDLGVBQWU7T0FDeEIsQ0FBQyxNQUFNLENBQUM7SUFFYjtFQUNGO0VBRUEsTUFBZ0IsU0FBd0I7SUFDdEMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsQ0FBQSxrQkFBbUIsS0FBSyxXQUFXO01BQ2pFLE1BQU0sU0FBUyxNQUFNLEtBQUssV0FBVyxDQUFDLE9BQU8sQ0FBQztRQUFFLE1BQU07TUFBTztNQUM3RCwwREFBMEQ7TUFDMUQsSUFBSSxDQUFDLENBQUEsa0JBQW1CLEdBQUcsT0FBTyxLQUFLLEtBQUs7SUFDOUM7SUFDQSxNQUFNLElBQUksQ0FBQyxLQUFLO0lBQ2hCLE9BQU8sS0FBSyxDQUFDO0VBQ2Y7RUFFQSxNQUFnQixRQUF1QjtJQUNyQyxJQUFJLENBQUMsV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWM7SUFDNUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssR0FBRyxDQUM5QixJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxHQUFHLE1BQU0sS0FBSyxJQUFJLENBQUMsSUFBSSxHQUN2RCxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxnQkFBZ0I7SUFFN0QsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEtBQUssR0FBRyxDQUMvQixHQUNBLEtBQUssR0FBRyxDQUNOLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLElBQzVDLElBQUksQ0FBQyxpQkFBaUI7RUFHNUI7RUFFVSxRQUFnQjtJQUN4QixPQUFPLEtBQUssQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLGFBQWE7RUFDL0M7RUFFVSxnQkFBd0I7SUFDaEMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLFdBQzdDLE9BQ0MsSUFBSSxDQUFDLG9CQUFvQixHQUFHLE1BQU0sS0FDL0I7RUFDVDtFQUVBLE1BQWdCLG1CQUNkLEtBQWEsRUFDb0I7SUFDakMsT0FBTyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxLQUFLLGFBQ3hDLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsU0FDaEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLElBQUksRUFBRTtFQUNyQztFQUVBLENBQUEsaUJBQWtCO0lBQ2hCLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFBLGtCQUFtQixLQUFLO0VBQy9EO0VBRUEsTUFBZ0IsbUJBQ2QsS0FBYSxFQUNvQjtJQUNqQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUEsaUJBQWtCLElBQUk7TUFDOUIsT0FBTyxFQUFFO0lBQ1g7SUFFQSxNQUFNLE9BQU8sTUFBTSxLQUFLLElBQUksQ0FBQyxPQUMxQixJQUFJLENBQUMsQ0FBQyxPQUFTLEtBQUssV0FBVyxHQUFHLFFBQVEsUUFBUSxRQUNsRCxLQUFLLENBQUMsSUFBTSxRQUFRO0lBRXZCLE9BQU8sTUFBTSxRQUFRLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLO0VBQ2hEO0VBRUEsTUFBZ0IsaUJBQWtEO0lBQ2hFLE1BQU0sUUFBUSxJQUFJLENBQUMsb0JBQW9CO0lBQ3ZDLE1BQU0sY0FBYztTQUNmLElBQUksQ0FBQyxlQUFlO1NBQ3BCLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDO1NBQzlCLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDO0tBQ2xDLENBQUMsTUFBTSxDQUFDO0lBRVQsSUFBSSxDQUFDLE1BQU0sTUFBTSxFQUFFO01BQ2pCLE9BQU87SUFDVDtJQUVBLE9BQU8sWUFDSixNQUFNLENBQUMsQ0FBQyxRQUNQLFdBQVcsTUFBTSxRQUFRLElBQ3RCLFdBQVcsR0FDWCxVQUFVLENBQUMsTUFBTSxXQUFXLEtBRWhDLElBQUksQ0FBQyxDQUFDLEdBQW9CLElBQ3pCLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxRQUFRLElBQUksU0FDOUIsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLFFBQVEsSUFBSTtFQUVwQztFQUVVLE9BQWlDO0lBQ3pDLE9BQU8sSUFBSSxDQUFDLE9BQU8sS0FBSyxJQUFJLENBQUMsT0FBTztFQUN0QztFQUVVLFVBQWtCO0lBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRTtNQUN2QixPQUFPO0lBQ1Q7SUFDQSxNQUFNLFdBQW1CLElBQUksQ0FBQyxnQkFBZ0IsR0FBRztJQUNqRCxNQUFNLFVBQWtCLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTTtJQUMvQyxNQUFNLFVBQTBDLEVBQUU7SUFFbEQsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRTtNQUMzQixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFO1FBQ3RCLFFBQVEsSUFBSSxDQUNWO1VBQUM7VUFBUSxpQkFBaUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFO1NBQUUsRUFDMUQ7VUFBQztVQUFZLGlCQUFpQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7U0FBRSxFQUNsRTtVQUFDO1VBQWEsaUJBQWlCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtTQUFFLEVBQ25FO1VBQ0U7VUFDQSxpQkFBaUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7U0FDeEQ7TUFFTCxPQUFPO1FBQ0wsUUFBUSxJQUFJLENBQ1Y7VUFBQztVQUFRLGlCQUFpQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUU7U0FBRSxFQUMxRDtVQUFDO1VBQVksaUJBQWlCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtTQUFFO01BRXRFO01BQ0EsUUFBUSxJQUFJLENBQ1Y7UUFBQztRQUFZLGlCQUFpQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7T0FBRTtJQUV0RTtJQUNBLFFBQVEsSUFBSSxDQUNWO01BQUM7TUFBVSxpQkFBaUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO0tBQUU7SUFHaEUsSUFBSSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTTtJQUMvQixJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFO01BQzNCLFFBQVEsV0FBVyxRQUFRLElBQUksSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3BFO0lBQ0EsUUFBUSxRQUNMLEdBQUcsQ0FBQyxDQUFDLE1BQVEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQ25ELElBQUksQ0FBQztJQUVSLE9BQU87RUFDVDtFQUVVLFVBQWtCO0lBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFO01BQ25ELE9BQU87SUFDVDtJQUNBLE1BQU0sT0FBc0IsRUFBRTtJQUM5QixNQUFNLFNBQWlCLElBQUksQ0FBQyxhQUFhO0lBQ3pDLElBQ0UsSUFBSSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFDOUIsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsUUFDN0IsSUFDQTtNQUNBLEtBQUssSUFBSSxDQUNQLElBQUksQ0FBQyxXQUFXLENBQ2QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQ25CLElBQUksQ0FBQyxnQkFBZ0IsS0FBSztJQUdoQztJQUNBLElBQUksS0FBSyxNQUFNLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUU7TUFDckMsS0FBSyxJQUFJLENBQUM7SUFDWjtJQUNBLE9BQU8sS0FBSyxJQUFJLENBQUM7RUFDbkI7RUFFQTs7OztHQUlDLEdBQ0QsQUFBVSxZQUNSLEtBQXNCLEVBQ3RCLFVBQW9CLEVBQ1o7SUFDUixJQUFJLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLElBQUk7SUFDbkMsUUFBUSxhQUFhLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRztJQUN2RCxJQUFJLFlBQVk7TUFDZCxRQUFRLFVBQVUsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUNuQyxPQUFPO01BQ0wsUUFBUSxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ3pCO0lBQ0EsT0FBTztFQUNUO0VBRUEsZ0NBQWdDLEdBQ2hDLEFBQVUsY0FDUixjQUFzQyxJQUFJLENBQUMsV0FBVyxFQUM5QztJQUNSLE9BQU8sS0FBSyxHQUFHLENBQ2IsWUFBWSxNQUFNLEVBQ2xCLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxJQUFJLFlBQVksTUFBTTtFQUUvQztFQUVBOzs7R0FHQyxHQUNELE1BQWdCLFlBQVksS0FBYyxFQUFpQjtJQUN6RCxPQUFRO01BQ04sS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVE7UUFDMUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRTtVQUN0QixJQUFJLENBQUMsd0JBQXdCO1FBQy9CLE9BQU87VUFDTCxJQUFJLENBQUMsb0JBQW9CO1FBQzNCO1FBQ0E7TUFDRixLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsWUFBWTtRQUM5QyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFO1VBQ3RCLElBQUksQ0FBQyxvQkFBb0I7UUFDM0IsT0FBTztVQUNMLElBQUksQ0FBQyx3QkFBd0I7UUFDL0I7UUFDQTtNQUNGLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxZQUFZO1FBQzlDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUU7VUFDdEIsSUFBSSxDQUFDLDZCQUE2QjtRQUNwQyxPQUFPO1VBQ0wsSUFBSSxDQUFDLHlCQUF5QjtRQUNoQztRQUNBO01BQ0YsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGdCQUFnQjtRQUNsRCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFO1VBQ3RCLElBQUksQ0FBQyx5QkFBeUI7UUFDaEMsT0FBTztVQUNMLElBQUksQ0FBQyw2QkFBNkI7UUFDcEM7UUFDQTtNQUNGLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxZQUFZO1FBQzlDLE1BQU0sSUFBSSxDQUFDLENBQUEsYUFBYztRQUN6QjtNQUNGLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxtQkFBbUI7UUFDckQsSUFBSSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFO1VBQzVDLElBQUksQ0FBQyxlQUFlO1FBQ3RCLE9BQU87VUFDTCxNQUFNLElBQUksQ0FBQyxDQUFBLGFBQWM7UUFDM0I7UUFDQTtNQUNGO1FBQ0UsTUFBTSxLQUFLLENBQUMsWUFBWTtJQUM1QjtFQUNGO0VBRUEsdUJBQXVCLEdBQ3ZCLEFBQVUsa0JBQXdCO0lBQ2hDLElBQUksSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRTtNQUM1QyxLQUFLLENBQUM7TUFDTixJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLE1BQU0sRUFBRTtRQUN2QyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQztRQUN6QixJQUFJLENBQUMsaUJBQWlCLEdBQUc7TUFDM0I7SUFDRjtFQUNGO0VBRUEsTUFBTSxDQUFBLGFBQWM7SUFDbEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRO0lBQ3JDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNO0lBQ3hDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRztJQUN4QixJQUFJLENBQUMsaUJBQWlCLEdBQUc7RUFDM0I7RUFFQSxNQUFnQixXQUE0QjtJQUMxQyxJQUFJLFFBQWdCLElBQUksQ0FBQyxvQkFBb0I7SUFDN0MsTUFBTSxhQUFpQyxJQUFJLENBQ3hDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtJQUV2QyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFO01BQzFCLFFBQVEsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPO0lBQzlDLE9BQU8sSUFDTCxJQUFJLENBQUMsQ0FBQSxpQkFBa0IsTUFDdkIsTUFBTSxFQUFFLENBQUMsQ0FBQyxPQUFPLE9BQ2pCLE1BQU0sWUFBWSxVQUNsQixDQUNFLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxFQUFFLENBQUMsQ0FBQyxPQUFPLE9BQ3ZDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxRQUFRLENBQUMsS0FDdkMsR0FDQTtNQUNBLFNBQVM7SUFDWCxPQUFPLElBQUksWUFBWTtNQUNyQixRQUFRO0lBQ1Y7SUFFQSxPQUFPLElBQUksQ0FBQyxDQUFBLGlCQUFrQixLQUFLLFVBQVUsU0FBUztFQUN4RDtFQUVBLGdDQUFnQyxHQUNoQyxBQUFVLDJCQUFpQztJQUN6QyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFO01BQzNCLElBQUksSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsR0FBRztRQUM5QixJQUFJLENBQUMsZ0JBQWdCO1FBQ3JCLElBQUksSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtVQUNsRCxJQUFJLENBQUMsaUJBQWlCO1FBQ3hCO01BQ0Y7SUFDRjtFQUNGO0VBRUEsNEJBQTRCLEdBQzVCLEFBQVUsdUJBQTZCO0lBQ3JDLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUU7TUFDM0IsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsR0FBRztRQUN2RCxJQUFJLENBQUMsZ0JBQWdCO1FBQ3JCLElBQ0UsSUFBSSxDQUFDLGdCQUFnQixJQUNuQixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLGFBQWEsSUFDN0M7VUFDQSxJQUFJLENBQUMsaUJBQWlCO1FBQ3hCO01BQ0Y7SUFDRjtFQUNGO0VBRUEsc0NBQXNDLEdBQ3RDLEFBQVUsZ0NBQXNDO0lBQzlDLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUU7TUFDM0IsTUFBTSxTQUFpQixJQUFJLENBQUMsYUFBYTtNQUN6QyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxRQUFRO1FBQ3BDLElBQUksQ0FBQyxnQkFBZ0IsSUFBSTtRQUN6QixJQUFJLENBQUMsaUJBQWlCLElBQUk7TUFDNUIsT0FBTyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxHQUFHO1FBQ3JDLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsaUJBQWlCO1FBQy9DLElBQUksQ0FBQyxpQkFBaUIsR0FBRztNQUMzQjtJQUNGO0VBQ0Y7RUFFQSxrQ0FBa0MsR0FDbEMsQUFBVSw0QkFBa0M7SUFDMUMsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRTtNQUMzQixNQUFNLFNBQWlCLElBQUksQ0FBQyxhQUFhO01BQ3pDLElBQUksSUFBSSxDQUFDLGlCQUFpQixHQUFHLFNBQVMsU0FBUyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRTtRQUN0RSxJQUFJLENBQUMsZ0JBQWdCLElBQUk7UUFDekIsSUFBSSxDQUFDLGlCQUFpQixJQUFJO01BQzVCLE9BQU8sSUFBSSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRTtRQUNwRSxNQUFNLFNBQVMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUc7UUFDekMsSUFBSSxDQUFDLGdCQUFnQixJQUFJLFNBQVMsSUFBSSxDQUFDLGlCQUFpQjtRQUN4RCxJQUFJLENBQUMsaUJBQWlCLEdBQUc7TUFDM0I7SUFDRjtFQUNGO0FBQ0Y7QUFFQSxTQUFTLGtCQUNQLEtBQWMsRUFDZCxLQUFhLEVBQ2IsSUFBb0I7RUFFcEIsT0FBTyxPQUFPLFVBQVUsZUFBZSxVQUFVLE1BQy9DLEtBQUssT0FBTyxDQUFDLFdBQVc7QUFDNUI7QUFFQSxTQUFTLFlBQVksSUFBWTtFQUMvQixPQUFPLEtBQUssSUFBSSxDQUFDLE1BQ2QsSUFBSSxDQUFDLENBQUMsT0FBUyxLQUFLLFdBQVcsRUFDL0IsS0FBSyxDQUFDLElBQU07QUFDakI7QUFFQSxlQUFlLFFBQ2IsSUFBWSxFQUNaLElBQXVCO0VBRXZCLE1BQU0sWUFBc0IsRUFBRTtFQUU5QixXQUFXLE1BQU0sUUFBUSxLQUFLLE9BQU8sQ0FBQyxRQUFRLEtBQU07SUFDbEQsSUFDRSxTQUFTLFFBQVEsQ0FBQyxLQUFLLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUN0RTtNQUNBO0lBQ0Y7SUFDQSxNQUFNLFdBQVcsS0FBSyxNQUFNLEtBQUssSUFBSTtJQUVyQyxJQUFJLGdCQUFnQixVQUFVLENBQUMsS0FBSyxJQUFJLENBQUMsV0FBVztNQUNsRDtJQUNGO0lBQ0EsVUFBVSxJQUFJLENBQUM7RUFDakI7RUFFQSxPQUFPLFVBQVUsSUFBSSxDQUFDLFNBQVUsQ0FBQyxFQUFFLENBQUM7SUFDbEMsT0FBTyxFQUFFLFdBQVcsR0FBRyxhQUFhLENBQUMsRUFBRSxXQUFXO0VBQ3BEO0FBQ0YifQ==
// denoCacheMetadata=14273281350021803423,16300285208448375083