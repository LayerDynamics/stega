import { GenericInput } from "./_generic_input.ts";
import { bold, brightBlue, dim, stripColor, yellow } from "./deps.ts";
import { Figures, getFiguresByKeys } from "./_figures.ts";
import { distance } from "../_utils/distance.ts";
/** Generic list prompt representation. */ export class GenericList extends GenericInput {
  parentOptions = [];
  get selectedOption() {
    return this.options.at(this.listIndex);
  }
  /**
   * Create list separator.
   *
   * @param label Separator label.
   */ static separator(label = "------------") {
    return {
      name: label
    };
  }
  getDefaultSettings({ groupIcon = true, groupOpenIcon = groupIcon, ...options }) {
    const settings = super.getDefaultSettings(options);
    return {
      ...settings,
      listPointer: options.listPointer ?? brightBlue(Figures.POINTER),
      searchLabel: options.searchLabel ?? brightBlue(Figures.SEARCH),
      backPointer: options.backPointer ?? brightBlue(Figures.POINTER_LEFT),
      groupPointer: options.groupPointer ?? options.listPointer ?? brightBlue(Figures.POINTER),
      groupIcon: !groupIcon ? false : typeof groupIcon === "string" ? groupIcon : Figures.FOLDER,
      groupOpenIcon: !groupOpenIcon ? false : typeof groupOpenIcon === "string" ? groupOpenIcon : Figures.FOLDER_OPEN,
      maxBreadcrumbItems: options.maxBreadcrumbItems ?? 5,
      breadcrumbSeparator: options.breadcrumbSeparator ?? ` ${Figures.POINTER_SMALL} `,
      maxRows: options.maxRows ?? 10,
      options: this.mapOptions(options, options.options),
      keys: {
        next: options.search ? [
          "down"
        ] : [
          "down",
          "d",
          "n",
          "2"
        ],
        previous: options.search ? [
          "up"
        ] : [
          "up",
          "u",
          "p",
          "8"
        ],
        nextPage: [
          "pagedown",
          "right"
        ],
        previousPage: [
          "pageup",
          "left"
        ],
        open: [
          "right",
          "enter",
          "return"
        ],
        back: [
          "left",
          "escape",
          "enter",
          "return"
        ],
        ...settings.keys ?? {}
      }
    };
  }
  mapOption(options, option) {
    if (isOption(option)) {
      return {
        value: option.value,
        name: typeof option.name === "undefined" ? options.format?.(option.value) ?? String(option.value) : option.name,
        disabled: "disabled" in option && option.disabled === true,
        indentLevel: 0
      };
    } else {
      return {
        value: null,
        name: option.name,
        disabled: true,
        indentLevel: 0
      };
    }
  }
  mapOptionGroup(options, option, recursive = true) {
    return {
      name: option.name,
      disabled: !!option.disabled,
      indentLevel: 0,
      options: recursive ? this.mapOptions(options, option.options) : []
    };
  }
  match() {
    const input = this.getCurrentInputValue().toLowerCase();
    let options = this.getCurrentOptions().slice();
    if (input.length) {
      const matches = matchOptions(input, this.getCurrentOptions());
      options = flatMatchedOptions(matches);
    }
    this.setOptions(options);
  }
  setOptions(options) {
    this.options = [
      ...options
    ];
    const parent = this.getParentOption();
    if (parent && this.options[0] !== parent) {
      this.options.unshift(parent);
    }
    this.listIndex = Math.max(0, Math.min(this.options.length - 1, this.listIndex));
    this.listOffset = Math.max(0, Math.min(this.options.length - this.getListHeight(), this.listOffset));
  }
  getCurrentOptions() {
    return this.getParentOption()?.options ?? this.settings.options;
  }
  getParentOption(index = -1) {
    return this.parentOptions.at(index);
  }
  submitBackButton() {
    const parentOption = this.parentOptions.pop();
    if (!parentOption) {
      return;
    }
    this.match();
    this.listIndex = this.options.indexOf(parentOption);
  }
  submitGroupOption(selectedOption) {
    this.parentOptions.push(selectedOption);
    this.match();
    this.listIndex = 1;
  }
  isBackButton(option) {
    return option === this.getParentOption();
  }
  hasParent() {
    return this.parentOptions.length > 0;
  }
  isSearching() {
    return this.getCurrentInputValue() !== "";
  }
  message() {
    let message = `${this.settings.indent}${this.settings.prefix}` + bold(this.settings.message) + this.defaults();
    if (this.settings.search) {
      const input = this.isSearchSelected() ? this.input() : dim(this.input());
      message += " " + this.settings.searchLabel + " ";
      this.cursor.x = stripColor(message).length + this.inputIndex + 1;
      message += input;
    }
    return message;
  }
  /** Render options. */ body() {
    return this.getList() + this.getInfo();
  }
  getInfo() {
    if (!this.settings.info) {
      return "";
    }
    const selected = this.listIndex + 1;
    const hasGroups = this.options.some((option)=>isOptionGroup(option));
    const groupActions = hasGroups ? [
      [
        "Open",
        getFiguresByKeys(this.settings.keys.open ?? [])
      ],
      [
        "Back",
        getFiguresByKeys(this.settings.keys.back ?? [])
      ]
    ] : [];
    const actions = [
      [
        "Next",
        getFiguresByKeys(this.settings.keys.next ?? [])
      ],
      [
        "Previous",
        getFiguresByKeys(this.settings.keys.previous ?? [])
      ],
      ...groupActions,
      [
        "Next Page",
        getFiguresByKeys(this.settings.keys.nextPage ?? [])
      ],
      [
        "Previous Page",
        getFiguresByKeys(this.settings.keys.previousPage ?? [])
      ],
      [
        "Submit",
        getFiguresByKeys(this.settings.keys.submit ?? [])
      ]
    ];
    return "\n" + this.settings.indent + brightBlue(Figures.INFO) + bold(` ${selected}/${this.options.length} `) + actions.map((cur)=>`${cur[0]}: ${bold(cur[1].join(", "))}`).join(", ");
  }
  /** Render options list. */ getList() {
    const list = [];
    const height = this.getListHeight();
    for(let i = this.listOffset; i < this.listOffset + height; i++){
      list.push(this.getListItem(this.options[i], this.listIndex === i));
    }
    if (!list.length) {
      list.push(this.settings.indent + dim("  No matches..."));
    }
    return list.join("\n");
  }
  /**
   * Render option.
   * @param option        Option.
   * @param isSelected  Set to true if option is selected.
   */ getListItem(option, isSelected) {
    let line = this.getListItemIndent(option);
    line += this.getListItemPointer(option, isSelected);
    line += this.getListItemIcon(option);
    line += this.getListItemLabel(option, isSelected);
    return line;
  }
  getListItemIndent(option) {
    const indentLevel = this.isSearching() ? option.indentLevel : this.hasParent() && !this.isBackButton(option) ? 1 : 0;
    return this.settings.indent + " ".repeat(indentLevel);
  }
  getListItemPointer(option, isSelected) {
    if (!isSelected) {
      return "  ";
    }
    if (this.isBackButton(option)) {
      return this.settings.backPointer + " ";
    } else if (isOptionGroup(option)) {
      return this.settings.groupPointer + " ";
    }
    return this.settings.listPointer + " ";
  }
  getListItemIcon(option) {
    if (this.isBackButton(option)) {
      return this.settings.groupOpenIcon ? this.settings.groupOpenIcon + " " : "";
    } else if (isOptionGroup(option)) {
      return this.settings.groupIcon ? this.settings.groupIcon + " " : "";
    }
    return "";
  }
  getListItemLabel(option, isSelected) {
    let label = option.name;
    if (this.isBackButton(option)) {
      label = this.getBreadCrumb();
      label = isSelected && !option.disabled ? label : yellow(label);
    } else {
      label = isSelected && !option.disabled ? this.highlight(label, (val)=>val) : this.highlight(label);
    }
    if (this.isBackButton(option) || isOptionGroup(option)) {
      label = bold(label);
    }
    return label;
  }
  getBreadCrumb() {
    if (!this.parentOptions.length || !this.settings.maxBreadcrumbItems) {
      return "";
    }
    const names = this.parentOptions.map((option)=>option.name);
    const breadCrumb = names.length > this.settings.maxBreadcrumbItems ? [
      names[0],
      "..",
      ...names.slice(-this.settings.maxBreadcrumbItems + 1)
    ] : names;
    return breadCrumb.join(this.settings.breadcrumbSeparator);
  }
  /** Get options row height. */ getListHeight() {
    return Math.min(this.options.length, this.settings.maxRows || this.options.length);
  }
  getListIndex(value) {
    return Math.max(0, typeof value === "undefined" ? this.options.findIndex((option)=>!option.disabled) || 0 : this.options.findIndex((option)=>isOption(option) && option.value === value) || 0);
  }
  getPageOffset(index) {
    if (index === 0) {
      return 0;
    }
    const height = this.getListHeight();
    return Math.floor(index / height) * height;
  }
  /**
   * Find option by value.
   * @param value Value of the option.
   */ getOptionByValue(value) {
    const option = this.options.find((option)=>isOption(option) && option.value === value);
    return option && isOptionGroup(option) ? undefined : option;
  }
  /** Read user input. */ read() {
    if (!this.settings.search) {
      this.settings.tty.cursorHide();
    }
    return super.read();
  }
  selectSearch() {
    this.listIndex = -1;
  }
  isSearchSelected() {
    return this.listIndex === -1;
  }
  /**
   * Handle user input event.
   * @param event Key event.
   */ async handleEvent(event) {
    if (this.isKey(this.settings.keys, "open", event) && isOptionGroup(this.selectedOption) && !this.isBackButton(this.selectedOption) && !this.isSearchSelected()) {
      this.submitGroupOption(this.selectedOption);
    } else if (this.isKey(this.settings.keys, "back", event) && (this.isBackButton(this.selectedOption) || event.name === "escape") && !this.isSearchSelected()) {
      this.submitBackButton();
    } else if (this.isKey(this.settings.keys, "next", event)) {
      this.selectNext();
    } else if (this.isKey(this.settings.keys, "previous", event)) {
      this.selectPrevious();
    } else if (this.isKey(this.settings.keys, "nextPage", event) && !this.isSearchSelected()) {
      this.selectNextPage();
    } else if (this.isKey(this.settings.keys, "previousPage", event) && !this.isSearchSelected()) {
      this.selectPreviousPage();
    } else {
      await super.handleEvent(event);
    }
  }
  async submit() {
    if (this.isSearchSelected()) {
      this.selectNext();
      return;
    }
    await super.submit();
  }
  moveCursorLeft() {
    if (this.settings.search) {
      super.moveCursorLeft();
    }
  }
  moveCursorRight() {
    if (this.settings.search) {
      super.moveCursorRight();
    }
  }
  deleteChar() {
    if (this.settings.search) {
      super.deleteChar();
    }
  }
  deleteCharRight() {
    if (this.settings.search) {
      super.deleteCharRight();
      this.match();
    }
  }
  addChar(char) {
    if (this.settings.search) {
      super.addChar(char);
      this.match();
    }
  }
  /** Select previous option. */ selectPrevious(loop = true) {
    if (this.options.length < 2 && !this.isSearchSelected()) {
      return;
    }
    if (this.listIndex > 0) {
      this.listIndex--;
      if (this.listIndex < this.listOffset) {
        this.listOffset--;
      }
      if (this.selectedOption?.disabled) {
        this.selectPrevious();
      }
    } else if (this.settings.search && this.listIndex === 0 && this.getCurrentInputValue().length) {
      this.listIndex = -1;
    } else if (loop) {
      this.listIndex = this.options.length - 1;
      this.listOffset = this.options.length - this.getListHeight();
      if (this.selectedOption?.disabled) {
        this.selectPrevious();
      }
    }
  }
  /** Select next option. */ selectNext(loop = true) {
    if (this.options.length < 2 && !this.isSearchSelected()) {
      return;
    }
    if (this.listIndex < this.options.length - 1) {
      this.listIndex++;
      if (this.listIndex >= this.listOffset + this.getListHeight()) {
        this.listOffset++;
      }
      if (this.selectedOption?.disabled) {
        this.selectNext();
      }
    } else if (this.settings.search && this.listIndex === this.options.length - 1 && this.getCurrentInputValue().length) {
      this.listIndex = -1;
    } else if (loop) {
      this.listIndex = this.listOffset = 0;
      if (this.selectedOption?.disabled) {
        this.selectNext();
      }
    }
  }
  /** Select previous page. */ selectPreviousPage() {
    if (this.options?.length) {
      const height = this.getListHeight();
      if (this.listOffset >= height) {
        this.listIndex -= height;
        this.listOffset -= height;
      } else if (this.listOffset > 0) {
        this.listIndex -= this.listOffset;
        this.listOffset = 0;
      } else {
        this.listIndex = 0;
      }
      if (this.selectedOption?.disabled) {
        this.selectPrevious(false);
      }
      if (this.selectedOption?.disabled) {
        this.selectNext(false);
      }
    }
  }
  /** Select next page. */ selectNextPage() {
    if (this.options?.length) {
      const height = this.getListHeight();
      if (this.listOffset + height + height < this.options.length) {
        this.listIndex += height;
        this.listOffset += height;
      } else if (this.listOffset + height < this.options.length) {
        const offset = this.options.length - height;
        this.listIndex += offset - this.listOffset;
        this.listOffset = offset;
      } else {
        this.listIndex = this.options.length - 1;
      }
      if (this.selectedOption?.disabled) {
        this.selectNext(false);
      }
      if (this.selectedOption?.disabled) {
        this.selectPrevious(false);
      }
    }
  }
}
export function isOption(option) {
  return !!option && typeof option === "object" && "value" in option;
}
export function isOptionGroup(option) {
  return option !== null && typeof option === "object" && "options" in option && Array.isArray(option.options);
}
function matchOptions(searchInput, options) {
  const matched = [];
  for (const option of options){
    if (isOptionGroup(option)) {
      const children = matchOptions(searchInput, option.options).sort(sortByDistance);
      if (children.length) {
        matched.push({
          option,
          distance: Math.min(...children.map((item)=>item.distance)),
          children
        });
        continue;
      }
    }
    if (matchOption(searchInput, option)) {
      matched.push({
        option,
        distance: distance(option.name, searchInput),
        children: []
      });
    }
  }
  return matched.sort(sortByDistance);
  function sortByDistance(a, b) {
    return a.distance - b.distance;
  }
}
function matchOption(inputString, option) {
  return matchInput(inputString, option.name) || isOption(option) && option.name !== option.value && matchInput(inputString, String(option.value));
}
function matchInput(inputString, value) {
  return stripColor(value).toLowerCase().includes(inputString);
}
function flatMatchedOptions(matches, indentLevel = 0, result = []) {
  for (const { option, children } of matches){
    option.indentLevel = indentLevel;
    result.push(option);
    flatMatchedOptions(children, indentLevel + 1, result);
  }
  return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYxLjAuMC1yYy4zL3Byb21wdC9fZ2VuZXJpY19saXN0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgS2V5Q29kZSB9IGZyb20gXCIuLi9rZXljb2RlL2tleV9jb2RlLnRzXCI7XG5pbXBvcnQge1xuICBHZW5lcmljSW5wdXQsXG4gIEdlbmVyaWNJbnB1dEtleXMsXG4gIEdlbmVyaWNJbnB1dFByb21wdE9wdGlvbnMsXG4gIEdlbmVyaWNJbnB1dFByb21wdFNldHRpbmdzLFxufSBmcm9tIFwiLi9fZ2VuZXJpY19pbnB1dC50c1wiO1xuaW1wb3J0IHsgV2lkZW5UeXBlIH0gZnJvbSBcIi4vX3V0aWxzLnRzXCI7XG5pbXBvcnQgeyBib2xkLCBicmlnaHRCbHVlLCBkaW0sIHN0cmlwQ29sb3IsIHllbGxvdyB9IGZyb20gXCIuL2RlcHMudHNcIjtcbmltcG9ydCB7IEZpZ3VyZXMsIGdldEZpZ3VyZXNCeUtleXMgfSBmcm9tIFwiLi9fZmlndXJlcy50c1wiO1xuaW1wb3J0IHsgZGlzdGFuY2UgfSBmcm9tIFwiLi4vX3V0aWxzL2Rpc3RhbmNlLnRzXCI7XG5cbnR5cGUgVW5zdXBwb3J0ZWRJbnB1dE9wdGlvbnMgPSBcInN1Z2dlc3Rpb25zXCIgfCBcImxpc3RcIjtcblxuLyoqIEdlbmVyaWMgbGlzdCBwcm9tcHQgb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgR2VuZXJpY0xpc3RPcHRpb25zPFRWYWx1ZSwgVFJldHVyblZhbHVlLCBUUmF3VmFsdWU+XG4gIGV4dGVuZHNcbiAgICBPbWl0PFxuICAgICAgR2VuZXJpY0lucHV0UHJvbXB0T3B0aW9uczxUUmV0dXJuVmFsdWUsIFRSYXdWYWx1ZT4sXG4gICAgICBVbnN1cHBvcnRlZElucHV0T3B0aW9uc1xuICAgID4ge1xuICBvcHRpb25zOiBBcnJheTxcbiAgICB8IEV4dHJhY3Q8VFZhbHVlLCBzdHJpbmcgfCBudW1iZXI+XG4gICAgfCBFeHRyYWN0PFdpZGVuVHlwZTxUVmFsdWU+LCBzdHJpbmcgfCBudW1iZXI+XG4gICAgfCBHZW5lcmljTGlzdE9wdGlvbjxUVmFsdWU+XG4gICAgfCBHZW5lcmljTGlzdE9wdGlvbkdyb3VwPFRWYWx1ZSwgR2VuZXJpY0xpc3RPcHRpb248VFZhbHVlPj5cbiAgICB8IEdlbmVyaWNMaXN0U2VwYXJhdG9yT3B0aW9uXG4gID47XG4gIC8qKiBLZXltYXAgdG8gYXNzaWduIGtleSBuYW1lcyB0byBwcm9tcHQgYWN0aW9ucy4gKi9cbiAga2V5cz86IEdlbmVyaWNMaXN0S2V5cztcbiAgLyoqIENoYW5nZSBsaXN0IHBvaW50ZXIuIERlZmF1bHQgaXMgYGJyaWdodEJsdWUoXCLina9cIilgLiAqL1xuICBsaXN0UG9pbnRlcj86IHN0cmluZztcbiAgLyoqIExpbWl0IG1heCBkaXNwbGF5ZWQgcm93cyBwZXIgcGFnZS4gKi9cbiAgbWF4Um93cz86IG51bWJlcjtcbiAgLyoqIENoYW5nZSBzZWFyY2ggbGFiZWwuIERlZmF1bHQgaXMgYGJyaWdodEJsdWUoXCLwn5SOXCIpYC4gKi9cbiAgc2VhcmNoTGFiZWw/OiBzdHJpbmc7XG4gIC8qKiBFbmFibGUgc2VhcmNoLiAqL1xuICBzZWFyY2g/OiBib29sZWFuO1xuICAvKiogRGlzcGxheSBwcm9tcHQgaW5mby4gKi9cbiAgaW5mbz86IGJvb2xlYW47XG4gIC8qKiBMaW1pdCBtYXhpbXVtIGFtb3VudCBvZiBicmVhZGNydW1iIGl0ZW1zLiAqL1xuICBtYXhCcmVhZGNydW1iSXRlbXM/OiBudW1iZXI7XG4gIC8qKiBDaGFuZ2UgYnJlYWRjcnVtYiBzZXBhcmF0b3IuIERlZmF1bHQgaXMgYCDigLogYC4gKi9cbiAgYnJlYWRjcnVtYlNlcGFyYXRvcj86IHN0cmluZztcbiAgLyoqIENoYW5nZSBiYWNrIHBvaW50ZXIuIERlZmF1bHQgaXMgYOKdrmAuICovXG4gIGJhY2tQb2ludGVyPzogc3RyaW5nO1xuICAvKiogQ2hhbmdlIGdyb3VwIHBvaW50ZXIuIERlZmF1bHQgaXMgYOKdr2AuICovXG4gIGdyb3VwUG9pbnRlcj86IHN0cmluZztcbiAgLyoqIENoYW5nZSBncm91cCBpY29uLiBEZWZhdWx0IGlzIGDwn5OBYC4gKi9cbiAgZ3JvdXBJY29uPzogc3RyaW5nIHwgYm9vbGVhbjtcbiAgLyoqIENoYW5nZSBvcGVuZWQgZ3JvdXAgaWNvbi4gRGVmYXVsdCBpcyBg8J+TgmAuICovXG4gIGdyb3VwT3Blbkljb24/OiBzdHJpbmcgfCBib29sZWFuO1xuICAvKiogRm9ybWF0IG9wdGlvbiB2YWx1ZS4gKi9cbiAgZm9ybWF0PzogKHZhbHVlOiBUVmFsdWUpID0+IHN0cmluZztcbn1cblxuLyoqIEdlbmVyaWMgbGlzdCBwcm9tcHQgc2V0dGluZ3MuICovXG5leHBvcnQgaW50ZXJmYWNlIEdlbmVyaWNMaXN0U2V0dGluZ3M8XG4gIFRWYWx1ZSxcbiAgVFJldHVyblZhbHVlLFxuICBUUmF3VmFsdWUsXG4gIFRPcHRpb24gZXh0ZW5kcyBHZW5lcmljTGlzdE9wdGlvblNldHRpbmdzPFRWYWx1ZT4sXG4gIFRHcm91cCBleHRlbmRzIEdlbmVyaWNMaXN0T3B0aW9uR3JvdXBTZXR0aW5nczxUVmFsdWUsIFRPcHRpb24+LFxuPiBleHRlbmRzIEdlbmVyaWNJbnB1dFByb21wdFNldHRpbmdzPFRSZXR1cm5WYWx1ZSwgVFJhd1ZhbHVlPiB7XG4gIG9wdGlvbnM6IEFycmF5PFRPcHRpb24gfCBUR3JvdXA+O1xuICBrZXlzOiBHZW5lcmljTGlzdEtleXM7XG4gIGxpc3RQb2ludGVyOiBzdHJpbmc7XG4gIG1heFJvd3M6IG51bWJlcjtcbiAgc2VhcmNoTGFiZWw6IHN0cmluZztcbiAgc2VhcmNoPzogYm9vbGVhbjtcbiAgaW5mbz86IGJvb2xlYW47XG4gIG1heEJyZWFkY3J1bWJJdGVtczogbnVtYmVyO1xuICBicmVhZGNydW1iU2VwYXJhdG9yOiBzdHJpbmc7XG4gIGJhY2tQb2ludGVyOiBzdHJpbmc7XG4gIGdyb3VwUG9pbnRlcjogc3RyaW5nO1xuICBncm91cEljb246IHN0cmluZyB8IGZhbHNlO1xuICBncm91cE9wZW5JY29uOiBzdHJpbmcgfCBmYWxzZTtcbiAgZm9ybWF0PzogKHZhbHVlOiBUVmFsdWUpID0+IHN0cmluZztcbn1cblxuLyoqIEdlbmVyaWMgbGlzdCBzZXBhcmF0b3Igb3B0aW9uIG9wdGlvbnMuICovXG5leHBvcnQgaW50ZXJmYWNlIEdlbmVyaWNMaXN0U2VwYXJhdG9yT3B0aW9uIHtcbiAgLyoqIFRoZSBzZXBhcmF0b3IgbGFiZWwuICovXG4gIG5hbWU6IHN0cmluZztcbn1cblxuLyoqIEdlbmVyaWMgbGlzdCBvcHRpb24gb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgR2VuZXJpY0xpc3RPcHRpb248VFZhbHVlPiB7XG4gIC8qKiBUaGUgb3B0aW9uIHZhbHVlLiAqL1xuICB2YWx1ZTogVFZhbHVlO1xuICAvKiogVGhlIG9wdGlvbiBsYWJlbC4gKi9cbiAgbmFtZT86IHN0cmluZztcbiAgLyoqIERpc2FibGUgb3B0aW9uLiBEaXNhYmxlZCBvcHRpb25zIGFyZSBkaXNwbGF5ZWQgYnV0IGNhbm5vdCBiZSBzZWxlY3RlZC4gKi9cbiAgZGlzYWJsZWQ/OiBib29sZWFuO1xufVxuXG4vKiogR2VuZXJpYyBsaXN0IG9wdGlvbiBncm91cCBvcHRpb25zLiAqL1xuZXhwb3J0IGludGVyZmFjZSBHZW5lcmljTGlzdE9wdGlvbkdyb3VwPFxuICBUVmFsdWUsXG4gIFRPcHRpb24gZXh0ZW5kcyBHZW5lcmljTGlzdE9wdGlvbjxUVmFsdWU+LFxuPiB7XG4gIC8qKiBUaGUgb3B0aW9uIGxhYmVsLiAqL1xuICBuYW1lOiBzdHJpbmc7XG4gIC8qKiBBbiBhcnJheSBvZiBjaGlsZCBvcHRpb25zLiAqL1xuICBvcHRpb25zOiBBcnJheTxcbiAgICB8IEV4dHJhY3Q8VFZhbHVlLCBzdHJpbmcgfCBudW1iZXI+XG4gICAgfCBFeHRyYWN0PFdpZGVuVHlwZTxUVmFsdWU+LCBzdHJpbmcgfCBudW1iZXI+XG4gICAgfCBUT3B0aW9uXG4gICAgfCB0aGlzXG4gICAgfCBHZW5lcmljTGlzdFNlcGFyYXRvck9wdGlvblxuICA+O1xuICAvKiogRGlzYWJsZSBvcHRpb24uIERpc2FibGVkIG9wdGlvbnMgYXJlIGRpc3BsYXllZCBidXQgY2Fubm90IGJlIHNlbGVjdGVkLiAqL1xuICBkaXNhYmxlZD86IGJvb2xlYW47XG59XG5cbi8qKiBHZW5lcmljIGxpc3Qgb3B0aW9uIHNldHRpbmdzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBHZW5lcmljTGlzdE9wdGlvblNldHRpbmdzPFRWYWx1ZT5cbiAgZXh0ZW5kcyBHZW5lcmljTGlzdE9wdGlvbjxUVmFsdWU+IHtcbiAgbmFtZTogc3RyaW5nO1xuICBkaXNhYmxlZDogYm9vbGVhbjtcbiAgaW5kZW50TGV2ZWw6IG51bWJlcjtcbn1cblxuLyoqIEdlbmVyaWMgbGlzdCBvcHRpb24gZ3JvdXAgc2V0dGluZ3MuICovXG5leHBvcnQgaW50ZXJmYWNlIEdlbmVyaWNMaXN0T3B0aW9uR3JvdXBTZXR0aW5nczxcbiAgVFZhbHVlLFxuICBUT3B0aW9uIGV4dGVuZHMgR2VuZXJpY0xpc3RPcHRpb25TZXR0aW5nczxUVmFsdWU+LFxuPiBleHRlbmRzIEdlbmVyaWNMaXN0T3B0aW9uR3JvdXA8VFZhbHVlLCBUT3B0aW9uPiB7XG4gIGRpc2FibGVkOiBib29sZWFuO1xuICBpbmRlbnRMZXZlbDogbnVtYmVyO1xuICBvcHRpb25zOiBBcnJheTxUT3B0aW9uIHwgdGhpcz47XG59XG5cbi8qKiBHZW5lcmljTGlzdCBrZXkgb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgR2VuZXJpY0xpc3RLZXlzIGV4dGVuZHMgR2VuZXJpY0lucHV0S2V5cyB7XG4gIC8qKiBTZWxlY3QgbmV4dCBvcHRpb24ga2V5bWFwLiBEZWZhdWx0IGlzIGBbXCJkb3duXCIsIFwiZFwiLCBcIm5cIiwgXCIyXCJdYC4gKi9cbiAgbmV4dD86IHN0cmluZ1tdO1xuICAvKiogU2VsZWN0IHByZXZpb3VzIG9wdGlvbiBrZXltYXAuIERlZmF1bHQgaXMgYFtcInVwXCIsIFwidVwiLCBcInBcIiwgXCI4XCJdYC4gKi9cbiAgcHJldmlvdXM/OiBzdHJpbmdbXTtcbiAgLyoqIFNlbGVjdCBuZXh0IHBhZ2Uga2V5bWFwLiBEZWZhdWx0IGlzIGBbXCJwYWdlZG93blwiLCBcInJpZ2h0XCJdYC4gKi9cbiAgbmV4dFBhZ2U/OiBzdHJpbmdbXTtcbiAgLyoqIFNlbGVjdCBwcmV2aW91cyBwYWdlIGtleW1hcC4gRGVmYXVsdCBpcyBgW1wicGFnZXVwXCIsIFwibGVmdFwiXWAuICovXG4gIHByZXZpb3VzUGFnZT86IHN0cmluZ1tdO1xuICAvKiogU2VsZWN0IG5leHQgb3B0aW9uIGtleW1hcC4gRGVmYXVsdCBpcyBgW1wicmlnaHRcIiwgXCJlbnRlclwiLCBcInJldHVyblwiXWAuICovXG4gIG9wZW4/OiBzdHJpbmdbXTtcbiAgLyoqIFNlbGVjdCBuZXh0IG9wdGlvbiBrZXltYXAuIERlZmF1bHQgaXMgYFtcImxlZnRcIiwgXCJlc2NhcGVcIiwgXCJlbnRlclwiLCBcInJldHVyblwiXWAuICovXG4gIGJhY2s/OiBzdHJpbmdbXTtcbn1cblxuaW50ZXJmYWNlIE1hdGNoZWRPcHRpb248XG4gIFRWYWx1ZSxcbiAgVE9wdGlvbiBleHRlbmRzIEdlbmVyaWNMaXN0T3B0aW9uU2V0dGluZ3M8VFZhbHVlPixcbiAgVEdyb3VwIGV4dGVuZHMgR2VuZXJpY0xpc3RPcHRpb25Hcm91cFNldHRpbmdzPFRWYWx1ZSwgVE9wdGlvbj4sXG4+IHtcbiAgb3B0aW9uOiBUT3B0aW9uIHwgVEdyb3VwO1xuICBkaXN0YW5jZTogbnVtYmVyO1xuICBjaGlsZHJlbjogQXJyYXk8TWF0Y2hlZE9wdGlvbjxUVmFsdWUsIFRPcHRpb24sIFRHcm91cD4+O1xufVxuXG4vKiogR2VuZXJpYyBsaXN0IHByb21wdCByZXByZXNlbnRhdGlvbi4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBHZW5lcmljTGlzdDxcbiAgVFZhbHVlLFxuICBUUmV0dXJuVmFsdWUsXG4gIFRSYXdWYWx1ZSxcbiAgVE9wdGlvbiBleHRlbmRzIEdlbmVyaWNMaXN0T3B0aW9uU2V0dGluZ3M8VFZhbHVlPixcbiAgVEdyb3VwIGV4dGVuZHMgR2VuZXJpY0xpc3RPcHRpb25Hcm91cFNldHRpbmdzPFRWYWx1ZSwgVE9wdGlvbj4sXG4+IGV4dGVuZHMgR2VuZXJpY0lucHV0PFRSZXR1cm5WYWx1ZSwgVFJhd1ZhbHVlPiB7XG4gIHByb3RlY3RlZCBhYnN0cmFjdCByZWFkb25seSBzZXR0aW5nczogR2VuZXJpY0xpc3RTZXR0aW5nczxcbiAgICBUVmFsdWUsXG4gICAgVFJldHVyblZhbHVlLFxuICAgIFRSYXdWYWx1ZSxcbiAgICBUT3B0aW9uLFxuICAgIFRHcm91cFxuICA+O1xuICBwcm90ZWN0ZWQgYWJzdHJhY3Qgb3B0aW9uczogQXJyYXk8VE9wdGlvbiB8IFRHcm91cD47XG4gIHByb3RlY3RlZCBhYnN0cmFjdCBsaXN0SW5kZXg6IG51bWJlcjtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IGxpc3RPZmZzZXQ6IG51bWJlcjtcbiAgcHJvdGVjdGVkIHBhcmVudE9wdGlvbnM6IEFycmF5PFRHcm91cD4gPSBbXTtcblxuICBwcm90ZWN0ZWQgZ2V0IHNlbGVjdGVkT3B0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYXQodGhpcy5saXN0SW5kZXgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBsaXN0IHNlcGFyYXRvci5cbiAgICpcbiAgICogQHBhcmFtIGxhYmVsIFNlcGFyYXRvciBsYWJlbC5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgc2VwYXJhdG9yKGxhYmVsID0gXCItLS0tLS0tLS0tLS1cIik6IEdlbmVyaWNMaXN0U2VwYXJhdG9yT3B0aW9uIHtcbiAgICByZXR1cm4geyBuYW1lOiBsYWJlbCB9O1xuICB9XG5cbiAgcHVibGljIGdldERlZmF1bHRTZXR0aW5ncyhcbiAgICB7XG4gICAgICBncm91cEljb24gPSB0cnVlLFxuICAgICAgZ3JvdXBPcGVuSWNvbiA9IGdyb3VwSWNvbixcbiAgICAgIC4uLm9wdGlvbnNcbiAgICB9OiBHZW5lcmljTGlzdE9wdGlvbnM8VFZhbHVlLCBUUmV0dXJuVmFsdWUsIFRSYXdWYWx1ZT4sXG4gICk6IEdlbmVyaWNMaXN0U2V0dGluZ3M8VFZhbHVlLCBUUmV0dXJuVmFsdWUsIFRSYXdWYWx1ZSwgVE9wdGlvbiwgVEdyb3VwPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSBzdXBlci5nZXREZWZhdWx0U2V0dGluZ3Mob3B0aW9ucyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnNldHRpbmdzLFxuICAgICAgbGlzdFBvaW50ZXI6IG9wdGlvbnMubGlzdFBvaW50ZXIgPz8gYnJpZ2h0Qmx1ZShGaWd1cmVzLlBPSU5URVIpLFxuICAgICAgc2VhcmNoTGFiZWw6IG9wdGlvbnMuc2VhcmNoTGFiZWwgPz8gYnJpZ2h0Qmx1ZShGaWd1cmVzLlNFQVJDSCksXG4gICAgICBiYWNrUG9pbnRlcjogb3B0aW9ucy5iYWNrUG9pbnRlciA/PyBicmlnaHRCbHVlKEZpZ3VyZXMuUE9JTlRFUl9MRUZUKSxcbiAgICAgIGdyb3VwUG9pbnRlcjogb3B0aW9ucy5ncm91cFBvaW50ZXIgPz8gb3B0aW9ucy5saXN0UG9pbnRlciA/P1xuICAgICAgICBicmlnaHRCbHVlKEZpZ3VyZXMuUE9JTlRFUiksXG4gICAgICBncm91cEljb246ICFncm91cEljb25cbiAgICAgICAgPyBmYWxzZVxuICAgICAgICA6IHR5cGVvZiBncm91cEljb24gPT09IFwic3RyaW5nXCJcbiAgICAgICAgPyBncm91cEljb25cbiAgICAgICAgOiBGaWd1cmVzLkZPTERFUixcbiAgICAgIGdyb3VwT3Blbkljb246ICFncm91cE9wZW5JY29uXG4gICAgICAgID8gZmFsc2VcbiAgICAgICAgOiB0eXBlb2YgZ3JvdXBPcGVuSWNvbiA9PT0gXCJzdHJpbmdcIlxuICAgICAgICA/IGdyb3VwT3Blbkljb25cbiAgICAgICAgOiBGaWd1cmVzLkZPTERFUl9PUEVOLFxuICAgICAgbWF4QnJlYWRjcnVtYkl0ZW1zOiBvcHRpb25zLm1heEJyZWFkY3J1bWJJdGVtcyA/PyA1LFxuICAgICAgYnJlYWRjcnVtYlNlcGFyYXRvcjogb3B0aW9ucy5icmVhZGNydW1iU2VwYXJhdG9yID8/XG4gICAgICAgIGAgJHtGaWd1cmVzLlBPSU5URVJfU01BTEx9IGAsXG4gICAgICBtYXhSb3dzOiBvcHRpb25zLm1heFJvd3MgPz8gMTAsXG4gICAgICBvcHRpb25zOiB0aGlzLm1hcE9wdGlvbnMob3B0aW9ucywgb3B0aW9ucy5vcHRpb25zKSxcbiAgICAgIGtleXM6IHtcbiAgICAgICAgbmV4dDogb3B0aW9ucy5zZWFyY2ggPyBbXCJkb3duXCJdIDogW1wiZG93blwiLCBcImRcIiwgXCJuXCIsIFwiMlwiXSxcbiAgICAgICAgcHJldmlvdXM6IG9wdGlvbnMuc2VhcmNoID8gW1widXBcIl0gOiBbXCJ1cFwiLCBcInVcIiwgXCJwXCIsIFwiOFwiXSxcbiAgICAgICAgbmV4dFBhZ2U6IFtcInBhZ2Vkb3duXCIsIFwicmlnaHRcIl0sXG4gICAgICAgIHByZXZpb3VzUGFnZTogW1wicGFnZXVwXCIsIFwibGVmdFwiXSxcbiAgICAgICAgb3BlbjogW1wicmlnaHRcIiwgXCJlbnRlclwiLCBcInJldHVyblwiXSxcbiAgICAgICAgYmFjazogW1wibGVmdFwiLCBcImVzY2FwZVwiLCBcImVudGVyXCIsIFwicmV0dXJuXCJdLFxuICAgICAgICAuLi4oc2V0dGluZ3Mua2V5cyA/PyB7fSksXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBwcm90ZWN0ZWQgYWJzdHJhY3QgbWFwT3B0aW9ucyhcbiAgICBwcm9tcHRPcHRpb25zOiBHZW5lcmljTGlzdE9wdGlvbnM8VFZhbHVlLCBUUmV0dXJuVmFsdWUsIFRSYXdWYWx1ZT4sXG4gICAgb3B0aW9uczogQXJyYXk8XG4gICAgICB8IEV4dHJhY3Q8VFZhbHVlLCBzdHJpbmcgfCBudW1iZXI+XG4gICAgICB8IEV4dHJhY3Q8V2lkZW5UeXBlPFRWYWx1ZT4sIHN0cmluZyB8IG51bWJlcj5cbiAgICAgIHwgR2VuZXJpY0xpc3RPcHRpb248VFZhbHVlPlxuICAgICAgfCBHZW5lcmljTGlzdE9wdGlvbkdyb3VwPFRWYWx1ZSwgR2VuZXJpY0xpc3RPcHRpb248VFZhbHVlPj5cbiAgICAgIHwgR2VuZXJpY0xpc3RTZXBhcmF0b3JPcHRpb25cbiAgICA+LFxuICApOiBBcnJheTxUT3B0aW9uIHwgVEdyb3VwPjtcblxuICBwcm90ZWN0ZWQgbWFwT3B0aW9uKFxuICAgIG9wdGlvbnM6IEdlbmVyaWNMaXN0T3B0aW9uczxUVmFsdWUsIFRSZXR1cm5WYWx1ZSwgVFJhd1ZhbHVlPixcbiAgICBvcHRpb246IEdlbmVyaWNMaXN0T3B0aW9uPFRWYWx1ZT4gfCBHZW5lcmljTGlzdFNlcGFyYXRvck9wdGlvbixcbiAgKTogR2VuZXJpY0xpc3RPcHRpb25TZXR0aW5nczxUVmFsdWU+IHtcbiAgICBpZiAoaXNPcHRpb24ob3B0aW9uKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IG9wdGlvbi52YWx1ZSxcbiAgICAgICAgbmFtZTogdHlwZW9mIG9wdGlvbi5uYW1lID09PSBcInVuZGVmaW5lZFwiXG4gICAgICAgICAgPyBvcHRpb25zLmZvcm1hdD8uKG9wdGlvbi52YWx1ZSkgPz8gU3RyaW5nKG9wdGlvbi52YWx1ZSlcbiAgICAgICAgICA6IG9wdGlvbi5uYW1lLFxuICAgICAgICBkaXNhYmxlZDogXCJkaXNhYmxlZFwiIGluIG9wdGlvbiAmJiBvcHRpb24uZGlzYWJsZWQgPT09IHRydWUsXG4gICAgICAgIGluZGVudExldmVsOiAwLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IG51bGwgYXMgVFZhbHVlLFxuICAgICAgICBuYW1lOiBvcHRpb24ubmFtZSxcbiAgICAgICAgZGlzYWJsZWQ6IHRydWUsXG4gICAgICAgIGluZGVudExldmVsOiAwLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgbWFwT3B0aW9uR3JvdXAoXG4gICAgb3B0aW9uczogR2VuZXJpY0xpc3RPcHRpb25zPFRWYWx1ZSwgVFJldHVyblZhbHVlLCBUUmF3VmFsdWU+LFxuICAgIG9wdGlvbjogR2VuZXJpY0xpc3RPcHRpb25Hcm91cDxUVmFsdWUsIEdlbmVyaWNMaXN0T3B0aW9uPFRWYWx1ZT4+LFxuICAgIHJlY3Vyc2l2ZSA9IHRydWUsXG4gICk6IEdlbmVyaWNMaXN0T3B0aW9uR3JvdXBTZXR0aW5nczxUVmFsdWUsIEdlbmVyaWNMaXN0T3B0aW9uU2V0dGluZ3M8VFZhbHVlPj4ge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBvcHRpb24ubmFtZSxcbiAgICAgIGRpc2FibGVkOiAhIW9wdGlvbi5kaXNhYmxlZCxcbiAgICAgIGluZGVudExldmVsOiAwLFxuICAgICAgb3B0aW9uczogcmVjdXJzaXZlID8gdGhpcy5tYXBPcHRpb25zKG9wdGlvbnMsIG9wdGlvbi5vcHRpb25zKSA6IFtdLFxuICAgIH07XG4gIH1cblxuICBwcm90ZWN0ZWQgbWF0Y2goKTogdm9pZCB7XG4gICAgY29uc3QgaW5wdXQ6IHN0cmluZyA9IHRoaXMuZ2V0Q3VycmVudElucHV0VmFsdWUoKS50b0xvd2VyQ2FzZSgpO1xuICAgIGxldCBvcHRpb25zOiBBcnJheTxUT3B0aW9uIHwgVEdyb3VwPiA9IHRoaXMuZ2V0Q3VycmVudE9wdGlvbnMoKS5zbGljZSgpO1xuXG4gICAgaWYgKGlucHV0Lmxlbmd0aCkge1xuICAgICAgY29uc3QgbWF0Y2hlcyA9IG1hdGNoT3B0aW9uczxUVmFsdWUsIFRPcHRpb24sIFRHcm91cD4oXG4gICAgICAgIGlucHV0LFxuICAgICAgICB0aGlzLmdldEN1cnJlbnRPcHRpb25zKCksXG4gICAgICApO1xuICAgICAgb3B0aW9ucyA9IGZsYXRNYXRjaGVkT3B0aW9ucyhtYXRjaGVzKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldE9wdGlvbnMob3B0aW9ucyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgc2V0T3B0aW9ucyhvcHRpb25zOiBBcnJheTxUT3B0aW9uIHwgVEdyb3VwPikge1xuICAgIHRoaXMub3B0aW9ucyA9IFsuLi5vcHRpb25zXTtcblxuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuZ2V0UGFyZW50T3B0aW9uKCk7XG4gICAgaWYgKHBhcmVudCAmJiB0aGlzLm9wdGlvbnNbMF0gIT09IHBhcmVudCkge1xuICAgICAgdGhpcy5vcHRpb25zLnVuc2hpZnQocGFyZW50KTtcbiAgICB9XG5cbiAgICB0aGlzLmxpc3RJbmRleCA9IE1hdGgubWF4KFxuICAgICAgMCxcbiAgICAgIE1hdGgubWluKHRoaXMub3B0aW9ucy5sZW5ndGggLSAxLCB0aGlzLmxpc3RJbmRleCksXG4gICAgKTtcbiAgICB0aGlzLmxpc3RPZmZzZXQgPSBNYXRoLm1heChcbiAgICAgIDAsXG4gICAgICBNYXRoLm1pbihcbiAgICAgICAgdGhpcy5vcHRpb25zLmxlbmd0aCAtIHRoaXMuZ2V0TGlzdEhlaWdodCgpLFxuICAgICAgICB0aGlzLmxpc3RPZmZzZXQsXG4gICAgICApLFxuICAgICk7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0Q3VycmVudE9wdGlvbnMoKTogQXJyYXk8VE9wdGlvbiB8IFRHcm91cD4ge1xuICAgIHJldHVybiB0aGlzLmdldFBhcmVudE9wdGlvbigpPy5vcHRpb25zID8/IHRoaXMuc2V0dGluZ3Mub3B0aW9ucztcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXRQYXJlbnRPcHRpb24oaW5kZXggPSAtMSk6IFRHcm91cCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMucGFyZW50T3B0aW9ucy5hdChpbmRleCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgc3VibWl0QmFja0J1dHRvbigpIHtcbiAgICBjb25zdCBwYXJlbnRPcHRpb24gPSB0aGlzLnBhcmVudE9wdGlvbnMucG9wKCk7XG4gICAgaWYgKCFwYXJlbnRPcHRpb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5tYXRjaCgpO1xuICAgIHRoaXMubGlzdEluZGV4ID0gdGhpcy5vcHRpb25zLmluZGV4T2YocGFyZW50T3B0aW9uKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzdWJtaXRHcm91cE9wdGlvbihzZWxlY3RlZE9wdGlvbjogVEdyb3VwKSB7XG4gICAgdGhpcy5wYXJlbnRPcHRpb25zLnB1c2goc2VsZWN0ZWRPcHRpb24pO1xuICAgIHRoaXMubWF0Y2goKTtcbiAgICB0aGlzLmxpc3RJbmRleCA9IDE7XG4gIH1cblxuICBwcm90ZWN0ZWQgaXNCYWNrQnV0dG9uKG9wdGlvbjogVE9wdGlvbiB8IFRHcm91cCB8IHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBvcHRpb24gPT09IHRoaXMuZ2V0UGFyZW50T3B0aW9uKCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgaGFzUGFyZW50KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnBhcmVudE9wdGlvbnMubGVuZ3RoID4gMDtcbiAgfVxuXG4gIHByb3RlY3RlZCBpc1NlYXJjaGluZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5nZXRDdXJyZW50SW5wdXRWYWx1ZSgpICE9PSBcIlwiO1xuICB9XG5cbiAgcHJvdGVjdGVkIG1lc3NhZ2UoKTogc3RyaW5nIHtcbiAgICBsZXQgbWVzc2FnZSA9IGAke3RoaXMuc2V0dGluZ3MuaW5kZW50fSR7dGhpcy5zZXR0aW5ncy5wcmVmaXh9YCArXG4gICAgICBib2xkKHRoaXMuc2V0dGluZ3MubWVzc2FnZSkgK1xuICAgICAgdGhpcy5kZWZhdWx0cygpO1xuXG4gICAgaWYgKHRoaXMuc2V0dGluZ3Muc2VhcmNoKSB7XG4gICAgICBjb25zdCBpbnB1dCA9IHRoaXMuaXNTZWFyY2hTZWxlY3RlZCgpID8gdGhpcy5pbnB1dCgpIDogZGltKHRoaXMuaW5wdXQoKSk7XG4gICAgICBtZXNzYWdlICs9IFwiIFwiICsgdGhpcy5zZXR0aW5ncy5zZWFyY2hMYWJlbCArIFwiIFwiO1xuICAgICAgdGhpcy5jdXJzb3IueCA9IHN0cmlwQ29sb3IobWVzc2FnZSkubGVuZ3RoICsgdGhpcy5pbnB1dEluZGV4ICsgMTtcbiAgICAgIG1lc3NhZ2UgKz0gaW5wdXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH1cblxuICAvKiogUmVuZGVyIG9wdGlvbnMuICovXG4gIHByb3RlY3RlZCBib2R5KCk6IHN0cmluZyB8IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0TGlzdCgpICsgdGhpcy5nZXRJbmZvKCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0SW5mbygpOiBzdHJpbmcge1xuICAgIGlmICghdGhpcy5zZXR0aW5ncy5pbmZvKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgY29uc3Qgc2VsZWN0ZWQ6IG51bWJlciA9IHRoaXMubGlzdEluZGV4ICsgMTtcbiAgICBjb25zdCBoYXNHcm91cHMgPSB0aGlzLm9wdGlvbnMuc29tZSgob3B0aW9uKSA9PiBpc09wdGlvbkdyb3VwKG9wdGlvbikpO1xuXG4gICAgY29uc3QgZ3JvdXBBY3Rpb25zOiBBcnJheTxbc3RyaW5nLCBBcnJheTxzdHJpbmc+XT4gPSBoYXNHcm91cHNcbiAgICAgID8gW1xuICAgICAgICBbXCJPcGVuXCIsIGdldEZpZ3VyZXNCeUtleXModGhpcy5zZXR0aW5ncy5rZXlzLm9wZW4gPz8gW10pXSxcbiAgICAgICAgW1wiQmFja1wiLCBnZXRGaWd1cmVzQnlLZXlzKHRoaXMuc2V0dGluZ3Mua2V5cy5iYWNrID8/IFtdKV0sXG4gICAgICBdXG4gICAgICA6IFtdO1xuXG4gICAgY29uc3QgYWN0aW9uczogQXJyYXk8W3N0cmluZywgQXJyYXk8c3RyaW5nPl0+ID0gW1xuICAgICAgW1wiTmV4dFwiLCBnZXRGaWd1cmVzQnlLZXlzKHRoaXMuc2V0dGluZ3Mua2V5cy5uZXh0ID8/IFtdKV0sXG4gICAgICBbXCJQcmV2aW91c1wiLCBnZXRGaWd1cmVzQnlLZXlzKHRoaXMuc2V0dGluZ3Mua2V5cy5wcmV2aW91cyA/PyBbXSldLFxuICAgICAgLi4uZ3JvdXBBY3Rpb25zLFxuICAgICAgW1wiTmV4dCBQYWdlXCIsIGdldEZpZ3VyZXNCeUtleXModGhpcy5zZXR0aW5ncy5rZXlzLm5leHRQYWdlID8/IFtdKV0sXG4gICAgICBbXG4gICAgICAgIFwiUHJldmlvdXMgUGFnZVwiLFxuICAgICAgICBnZXRGaWd1cmVzQnlLZXlzKHRoaXMuc2V0dGluZ3Mua2V5cy5wcmV2aW91c1BhZ2UgPz8gW10pLFxuICAgICAgXSxcbiAgICAgIFtcIlN1Ym1pdFwiLCBnZXRGaWd1cmVzQnlLZXlzKHRoaXMuc2V0dGluZ3Mua2V5cy5zdWJtaXQgPz8gW10pXSxcbiAgICBdO1xuXG4gICAgcmV0dXJuIFwiXFxuXCIgKyB0aGlzLnNldHRpbmdzLmluZGVudCArIGJyaWdodEJsdWUoRmlndXJlcy5JTkZPKSArXG4gICAgICBib2xkKGAgJHtzZWxlY3RlZH0vJHt0aGlzLm9wdGlvbnMubGVuZ3RofSBgKSArXG4gICAgICBhY3Rpb25zXG4gICAgICAgIC5tYXAoKGN1cikgPT4gYCR7Y3VyWzBdfTogJHtib2xkKGN1clsxXS5qb2luKFwiLCBcIikpfWApXG4gICAgICAgIC5qb2luKFwiLCBcIik7XG4gIH1cblxuICAvKiogUmVuZGVyIG9wdGlvbnMgbGlzdC4gKi9cbiAgcHJvdGVjdGVkIGdldExpc3QoKTogc3RyaW5nIHtcbiAgICBjb25zdCBsaXN0OiBBcnJheTxzdHJpbmc+ID0gW107XG4gICAgY29uc3QgaGVpZ2h0OiBudW1iZXIgPSB0aGlzLmdldExpc3RIZWlnaHQoKTtcbiAgICBmb3IgKGxldCBpID0gdGhpcy5saXN0T2Zmc2V0OyBpIDwgdGhpcy5saXN0T2Zmc2V0ICsgaGVpZ2h0OyBpKyspIHtcbiAgICAgIGxpc3QucHVzaChcbiAgICAgICAgdGhpcy5nZXRMaXN0SXRlbShcbiAgICAgICAgICB0aGlzLm9wdGlvbnNbaV0sXG4gICAgICAgICAgdGhpcy5saXN0SW5kZXggPT09IGksXG4gICAgICAgICksXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoIWxpc3QubGVuZ3RoKSB7XG4gICAgICBsaXN0LnB1c2goXG4gICAgICAgIHRoaXMuc2V0dGluZ3MuaW5kZW50ICsgZGltKFwiICBObyBtYXRjaGVzLi4uXCIpLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIGxpc3Quam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5kZXIgb3B0aW9uLlxuICAgKiBAcGFyYW0gb3B0aW9uICAgICAgICBPcHRpb24uXG4gICAqIEBwYXJhbSBpc1NlbGVjdGVkICBTZXQgdG8gdHJ1ZSBpZiBvcHRpb24gaXMgc2VsZWN0ZWQuXG4gICAqL1xuICBwcm90ZWN0ZWQgZ2V0TGlzdEl0ZW0oXG4gICAgb3B0aW9uOiBUT3B0aW9uIHwgVEdyb3VwLFxuICAgIGlzU2VsZWN0ZWQ/OiBib29sZWFuLFxuICApOiBzdHJpbmcge1xuICAgIGxldCBsaW5lID0gdGhpcy5nZXRMaXN0SXRlbUluZGVudChvcHRpb24pO1xuICAgIGxpbmUgKz0gdGhpcy5nZXRMaXN0SXRlbVBvaW50ZXIob3B0aW9uLCBpc1NlbGVjdGVkKTtcbiAgICBsaW5lICs9IHRoaXMuZ2V0TGlzdEl0ZW1JY29uKG9wdGlvbik7XG4gICAgbGluZSArPSB0aGlzLmdldExpc3RJdGVtTGFiZWwob3B0aW9uLCBpc1NlbGVjdGVkKTtcblxuICAgIHJldHVybiBsaW5lO1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldExpc3RJdGVtSW5kZW50KG9wdGlvbjogVE9wdGlvbiB8IFRHcm91cCkge1xuICAgIGNvbnN0IGluZGVudExldmVsID0gdGhpcy5pc1NlYXJjaGluZygpXG4gICAgICA/IG9wdGlvbi5pbmRlbnRMZXZlbFxuICAgICAgOiB0aGlzLmhhc1BhcmVudCgpICYmICF0aGlzLmlzQmFja0J1dHRvbihvcHRpb24pXG4gICAgICA/IDFcbiAgICAgIDogMDtcblxuICAgIHJldHVybiB0aGlzLnNldHRpbmdzLmluZGVudCArIFwiIFwiLnJlcGVhdChpbmRlbnRMZXZlbCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0TGlzdEl0ZW1Qb2ludGVyKG9wdGlvbjogVE9wdGlvbiB8IFRHcm91cCwgaXNTZWxlY3RlZD86IGJvb2xlYW4pIHtcbiAgICBpZiAoIWlzU2VsZWN0ZWQpIHtcbiAgICAgIHJldHVybiBcIiAgXCI7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaXNCYWNrQnV0dG9uKG9wdGlvbikpIHtcbiAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLmJhY2tQb2ludGVyICsgXCIgXCI7XG4gICAgfSBlbHNlIGlmIChpc09wdGlvbkdyb3VwKG9wdGlvbikpIHtcbiAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLmdyb3VwUG9pbnRlciArIFwiIFwiO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnNldHRpbmdzLmxpc3RQb2ludGVyICsgXCIgXCI7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0TGlzdEl0ZW1JY29uKG9wdGlvbjogVE9wdGlvbiB8IFRHcm91cCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMuaXNCYWNrQnV0dG9uKG9wdGlvbikpIHtcbiAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLmdyb3VwT3Blbkljb25cbiAgICAgICAgPyB0aGlzLnNldHRpbmdzLmdyb3VwT3Blbkljb24gKyBcIiBcIlxuICAgICAgICA6IFwiXCI7XG4gICAgfSBlbHNlIGlmIChpc09wdGlvbkdyb3VwKG9wdGlvbikpIHtcbiAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLmdyb3VwSWNvbiA/IHRoaXMuc2V0dGluZ3MuZ3JvdXBJY29uICsgXCIgXCIgOiBcIlwiO1xuICAgIH1cblxuICAgIHJldHVybiBcIlwiO1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldExpc3RJdGVtTGFiZWwoXG4gICAgb3B0aW9uOiBUT3B0aW9uIHwgVEdyb3VwLFxuICAgIGlzU2VsZWN0ZWQ/OiBib29sZWFuLFxuICApOiBzdHJpbmcge1xuICAgIGxldCBsYWJlbCA9IG9wdGlvbi5uYW1lO1xuXG4gICAgaWYgKHRoaXMuaXNCYWNrQnV0dG9uKG9wdGlvbikpIHtcbiAgICAgIGxhYmVsID0gdGhpcy5nZXRCcmVhZENydW1iKCk7XG4gICAgICBsYWJlbCA9IGlzU2VsZWN0ZWQgJiYgIW9wdGlvbi5kaXNhYmxlZCA/IGxhYmVsIDogeWVsbG93KGxhYmVsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGFiZWwgPSBpc1NlbGVjdGVkICYmICFvcHRpb24uZGlzYWJsZWRcbiAgICAgICAgPyB0aGlzLmhpZ2hsaWdodChsYWJlbCwgKHZhbCkgPT4gdmFsKVxuICAgICAgICA6IHRoaXMuaGlnaGxpZ2h0KGxhYmVsKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc0JhY2tCdXR0b24ob3B0aW9uKSB8fCBpc09wdGlvbkdyb3VwKG9wdGlvbikpIHtcbiAgICAgIGxhYmVsID0gYm9sZChsYWJlbCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxhYmVsO1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldEJyZWFkQ3J1bWIoKSB7XG4gICAgaWYgKCF0aGlzLnBhcmVudE9wdGlvbnMubGVuZ3RoIHx8ICF0aGlzLnNldHRpbmdzLm1heEJyZWFkY3J1bWJJdGVtcykge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIGNvbnN0IG5hbWVzID0gdGhpcy5wYXJlbnRPcHRpb25zLm1hcCgob3B0aW9uKSA9PiBvcHRpb24ubmFtZSk7XG4gICAgY29uc3QgYnJlYWRDcnVtYiA9IG5hbWVzLmxlbmd0aCA+IHRoaXMuc2V0dGluZ3MubWF4QnJlYWRjcnVtYkl0ZW1zXG4gICAgICA/IFtuYW1lc1swXSwgXCIuLlwiLCAuLi5uYW1lcy5zbGljZSgtdGhpcy5zZXR0aW5ncy5tYXhCcmVhZGNydW1iSXRlbXMgKyAxKV1cbiAgICAgIDogbmFtZXM7XG5cbiAgICByZXR1cm4gYnJlYWRDcnVtYi5qb2luKHRoaXMuc2V0dGluZ3MuYnJlYWRjcnVtYlNlcGFyYXRvcik7XG4gIH1cblxuICAvKiogR2V0IG9wdGlvbnMgcm93IGhlaWdodC4gKi9cbiAgcHJvdGVjdGVkIGdldExpc3RIZWlnaHQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gTWF0aC5taW4oXG4gICAgICB0aGlzLm9wdGlvbnMubGVuZ3RoLFxuICAgICAgdGhpcy5zZXR0aW5ncy5tYXhSb3dzIHx8IHRoaXMub3B0aW9ucy5sZW5ndGgsXG4gICAgKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXRMaXN0SW5kZXgodmFsdWU/OiBUVmFsdWUpIHtcbiAgICByZXR1cm4gTWF0aC5tYXgoXG4gICAgICAwLFxuICAgICAgdHlwZW9mIHZhbHVlID09PSBcInVuZGVmaW5lZFwiXG4gICAgICAgID8gdGhpcy5vcHRpb25zLmZpbmRJbmRleCgob3B0aW9uOiBUT3B0aW9uIHwgVEdyb3VwKSA9PlxuICAgICAgICAgICFvcHRpb24uZGlzYWJsZWRcbiAgICAgICAgKSB8fCAwXG4gICAgICAgIDogdGhpcy5vcHRpb25zLmZpbmRJbmRleCgob3B0aW9uOiBUT3B0aW9uIHwgVEdyb3VwKSA9PlxuICAgICAgICAgIGlzT3B0aW9uKG9wdGlvbikgJiYgb3B0aW9uLnZhbHVlID09PSB2YWx1ZVxuICAgICAgICApIHx8XG4gICAgICAgICAgMCxcbiAgICApO1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldFBhZ2VPZmZzZXQoaW5kZXg6IG51bWJlcikge1xuICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGNvbnN0IGhlaWdodDogbnVtYmVyID0gdGhpcy5nZXRMaXN0SGVpZ2h0KCk7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoaW5kZXggLyBoZWlnaHQpICogaGVpZ2h0O1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmQgb3B0aW9uIGJ5IHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgVmFsdWUgb2YgdGhlIG9wdGlvbi5cbiAgICovXG4gIHByb3RlY3RlZCBnZXRPcHRpb25CeVZhbHVlKFxuICAgIHZhbHVlOiBUVmFsdWUsXG4gICk6IFRPcHRpb24gfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IG9wdGlvbiA9IHRoaXMub3B0aW9ucy5maW5kKChvcHRpb24pID0+XG4gICAgICBpc09wdGlvbihvcHRpb24pICYmIG9wdGlvbi52YWx1ZSA9PT0gdmFsdWVcbiAgICApO1xuXG4gICAgcmV0dXJuIG9wdGlvbiAmJiBpc09wdGlvbkdyb3VwKG9wdGlvbikgPyB1bmRlZmluZWQgOiBvcHRpb247XG4gIH1cblxuICAvKiogUmVhZCB1c2VyIGlucHV0LiAqL1xuICBwcm90ZWN0ZWQgcmVhZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAoIXRoaXMuc2V0dGluZ3Muc2VhcmNoKSB7XG4gICAgICB0aGlzLnNldHRpbmdzLnR0eS5jdXJzb3JIaWRlKCk7XG4gICAgfVxuICAgIHJldHVybiBzdXBlci5yZWFkKCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgc2VsZWN0U2VhcmNoKCkge1xuICAgIHRoaXMubGlzdEluZGV4ID0gLTE7XG4gIH1cblxuICBwcm90ZWN0ZWQgaXNTZWFyY2hTZWxlY3RlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5saXN0SW5kZXggPT09IC0xO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSB1c2VyIGlucHV0IGV2ZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgS2V5IGV2ZW50LlxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIGhhbmRsZUV2ZW50KGV2ZW50OiBLZXlDb2RlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5pc0tleSh0aGlzLnNldHRpbmdzLmtleXMsIFwib3BlblwiLCBldmVudCkgJiZcbiAgICAgIGlzT3B0aW9uR3JvdXAodGhpcy5zZWxlY3RlZE9wdGlvbikgJiZcbiAgICAgICF0aGlzLmlzQmFja0J1dHRvbih0aGlzLnNlbGVjdGVkT3B0aW9uKSAmJlxuICAgICAgIXRoaXMuaXNTZWFyY2hTZWxlY3RlZCgpXG4gICAgKSB7XG4gICAgICB0aGlzLnN1Ym1pdEdyb3VwT3B0aW9uKHRoaXMuc2VsZWN0ZWRPcHRpb24pO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICB0aGlzLmlzS2V5KHRoaXMuc2V0dGluZ3Mua2V5cywgXCJiYWNrXCIsIGV2ZW50KSAmJlxuICAgICAgKHRoaXMuaXNCYWNrQnV0dG9uKHRoaXMuc2VsZWN0ZWRPcHRpb24pIHx8IGV2ZW50Lm5hbWUgPT09IFwiZXNjYXBlXCIpICYmXG4gICAgICAhdGhpcy5pc1NlYXJjaFNlbGVjdGVkKClcbiAgICApIHtcbiAgICAgIHRoaXMuc3VibWl0QmFja0J1dHRvbigpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5pc0tleSh0aGlzLnNldHRpbmdzLmtleXMsIFwibmV4dFwiLCBldmVudCkpIHtcbiAgICAgIHRoaXMuc2VsZWN0TmV4dCgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5pc0tleSh0aGlzLnNldHRpbmdzLmtleXMsIFwicHJldmlvdXNcIiwgZXZlbnQpKSB7XG4gICAgICB0aGlzLnNlbGVjdFByZXZpb3VzKCk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHRoaXMuaXNLZXkodGhpcy5zZXR0aW5ncy5rZXlzLCBcIm5leHRQYWdlXCIsIGV2ZW50KSAmJlxuICAgICAgIXRoaXMuaXNTZWFyY2hTZWxlY3RlZCgpXG4gICAgKSB7XG4gICAgICB0aGlzLnNlbGVjdE5leHRQYWdlKCk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHRoaXMuaXNLZXkodGhpcy5zZXR0aW5ncy5rZXlzLCBcInByZXZpb3VzUGFnZVwiLCBldmVudCkgJiZcbiAgICAgICF0aGlzLmlzU2VhcmNoU2VsZWN0ZWQoKVxuICAgICkge1xuICAgICAgdGhpcy5zZWxlY3RQcmV2aW91c1BhZ2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgc3VwZXIuaGFuZGxlRXZlbnQoZXZlbnQpO1xuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBzdWJtaXQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuaXNTZWFyY2hTZWxlY3RlZCgpKSB7XG4gICAgICB0aGlzLnNlbGVjdE5leHQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgc3VwZXIuc3VibWl0KCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgbW92ZUN1cnNvckxlZnQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2V0dGluZ3Muc2VhcmNoKSB7XG4gICAgICBzdXBlci5tb3ZlQ3Vyc29yTGVmdCgpO1xuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBtb3ZlQ3Vyc29yUmlnaHQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2V0dGluZ3Muc2VhcmNoKSB7XG4gICAgICBzdXBlci5tb3ZlQ3Vyc29yUmlnaHQoKTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgZGVsZXRlQ2hhcigpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5zZWFyY2gpIHtcbiAgICAgIHN1cGVyLmRlbGV0ZUNoYXIoKTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgZGVsZXRlQ2hhclJpZ2h0KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNldHRpbmdzLnNlYXJjaCkge1xuICAgICAgc3VwZXIuZGVsZXRlQ2hhclJpZ2h0KCk7XG4gICAgICB0aGlzLm1hdGNoKCk7XG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIGFkZENoYXIoY2hhcjogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2V0dGluZ3Muc2VhcmNoKSB7XG4gICAgICBzdXBlci5hZGRDaGFyKGNoYXIpO1xuICAgICAgdGhpcy5tYXRjaCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZWxlY3QgcHJldmlvdXMgb3B0aW9uLiAqL1xuICBwcm90ZWN0ZWQgc2VsZWN0UHJldmlvdXMobG9vcCA9IHRydWUpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmxlbmd0aCA8IDIgJiYgIXRoaXMuaXNTZWFyY2hTZWxlY3RlZCgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLmxpc3RJbmRleCA+IDApIHtcbiAgICAgIHRoaXMubGlzdEluZGV4LS07XG4gICAgICBpZiAodGhpcy5saXN0SW5kZXggPCB0aGlzLmxpc3RPZmZzZXQpIHtcbiAgICAgICAgdGhpcy5saXN0T2Zmc2V0LS07XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5zZWxlY3RlZE9wdGlvbj8uZGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RQcmV2aW91cygpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoXG4gICAgICB0aGlzLnNldHRpbmdzLnNlYXJjaCAmJiB0aGlzLmxpc3RJbmRleCA9PT0gMCAmJlxuICAgICAgdGhpcy5nZXRDdXJyZW50SW5wdXRWYWx1ZSgpLmxlbmd0aFxuICAgICkge1xuICAgICAgdGhpcy5saXN0SW5kZXggPSAtMTtcbiAgICB9IGVsc2UgaWYgKGxvb3ApIHtcbiAgICAgIHRoaXMubGlzdEluZGV4ID0gdGhpcy5vcHRpb25zLmxlbmd0aCAtIDE7XG4gICAgICB0aGlzLmxpc3RPZmZzZXQgPSB0aGlzLm9wdGlvbnMubGVuZ3RoIC0gdGhpcy5nZXRMaXN0SGVpZ2h0KCk7XG4gICAgICBpZiAodGhpcy5zZWxlY3RlZE9wdGlvbj8uZGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RQcmV2aW91cygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBTZWxlY3QgbmV4dCBvcHRpb24uICovXG4gIHByb3RlY3RlZCBzZWxlY3ROZXh0KGxvb3AgPSB0cnVlKTogdm9pZCB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5sZW5ndGggPCAyICYmICF0aGlzLmlzU2VhcmNoU2VsZWN0ZWQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5saXN0SW5kZXggPCB0aGlzLm9wdGlvbnMubGVuZ3RoIC0gMSkge1xuICAgICAgdGhpcy5saXN0SW5kZXgrKztcbiAgICAgIGlmICh0aGlzLmxpc3RJbmRleCA+PSB0aGlzLmxpc3RPZmZzZXQgKyB0aGlzLmdldExpc3RIZWlnaHQoKSkge1xuICAgICAgICB0aGlzLmxpc3RPZmZzZXQrKztcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnNlbGVjdGVkT3B0aW9uPy5kaXNhYmxlZCkge1xuICAgICAgICB0aGlzLnNlbGVjdE5leHQoKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKFxuICAgICAgdGhpcy5zZXR0aW5ncy5zZWFyY2ggJiYgdGhpcy5saXN0SW5kZXggPT09IHRoaXMub3B0aW9ucy5sZW5ndGggLSAxICYmXG4gICAgICB0aGlzLmdldEN1cnJlbnRJbnB1dFZhbHVlKCkubGVuZ3RoXG4gICAgKSB7XG4gICAgICB0aGlzLmxpc3RJbmRleCA9IC0xO1xuICAgIH0gZWxzZSBpZiAobG9vcCkge1xuICAgICAgdGhpcy5saXN0SW5kZXggPSB0aGlzLmxpc3RPZmZzZXQgPSAwO1xuICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRPcHRpb24/LmRpc2FibGVkKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0TmV4dCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiBTZWxlY3QgcHJldmlvdXMgcGFnZS4gKi9cbiAgcHJvdGVjdGVkIHNlbGVjdFByZXZpb3VzUGFnZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5vcHRpb25zPy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IGhlaWdodDogbnVtYmVyID0gdGhpcy5nZXRMaXN0SGVpZ2h0KCk7XG4gICAgICBpZiAodGhpcy5saXN0T2Zmc2V0ID49IGhlaWdodCkge1xuICAgICAgICB0aGlzLmxpc3RJbmRleCAtPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMubGlzdE9mZnNldCAtPSBoZWlnaHQ7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubGlzdE9mZnNldCA+IDApIHtcbiAgICAgICAgdGhpcy5saXN0SW5kZXggLT0gdGhpcy5saXN0T2Zmc2V0O1xuICAgICAgICB0aGlzLmxpc3RPZmZzZXQgPSAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5saXN0SW5kZXggPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRPcHRpb24/LmRpc2FibGVkKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0UHJldmlvdXMoZmFsc2UpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRPcHRpb24/LmRpc2FibGVkKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0TmV4dChmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIFNlbGVjdCBuZXh0IHBhZ2UuICovXG4gIHByb3RlY3RlZCBzZWxlY3ROZXh0UGFnZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5vcHRpb25zPy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IGhlaWdodDogbnVtYmVyID0gdGhpcy5nZXRMaXN0SGVpZ2h0KCk7XG4gICAgICBpZiAodGhpcy5saXN0T2Zmc2V0ICsgaGVpZ2h0ICsgaGVpZ2h0IDwgdGhpcy5vcHRpb25zLmxlbmd0aCkge1xuICAgICAgICB0aGlzLmxpc3RJbmRleCArPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMubGlzdE9mZnNldCArPSBoZWlnaHQ7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubGlzdE9mZnNldCArIGhlaWdodCA8IHRoaXMub3B0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5vcHRpb25zLmxlbmd0aCAtIGhlaWdodDtcbiAgICAgICAgdGhpcy5saXN0SW5kZXggKz0gb2Zmc2V0IC0gdGhpcy5saXN0T2Zmc2V0O1xuICAgICAgICB0aGlzLmxpc3RPZmZzZXQgPSBvZmZzZXQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxpc3RJbmRleCA9IHRoaXMub3B0aW9ucy5sZW5ndGggLSAxO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRPcHRpb24/LmRpc2FibGVkKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0TmV4dChmYWxzZSk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5zZWxlY3RlZE9wdGlvbj8uZGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RQcmV2aW91cyhmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc09wdGlvbjxcbiAgVFZhbHVlLFxuICBUT3B0aW9uIGV4dGVuZHMgR2VuZXJpY0xpc3RPcHRpb248VFZhbHVlPixcbj4oXG4gIG9wdGlvbjpcbiAgICB8IFRPcHRpb25cbiAgICB8IEdlbmVyaWNMaXN0T3B0aW9uR3JvdXA8VFZhbHVlLCBHZW5lcmljTGlzdE9wdGlvbjxUVmFsdWU+PlxuICAgIHwgR2VuZXJpY0xpc3RTZXBhcmF0b3JPcHRpb25cbiAgICB8IHVuZGVmaW5lZCxcbik6IG9wdGlvbiBpcyBUT3B0aW9uIHtcbiAgcmV0dXJuICEhb3B0aW9uICYmIHR5cGVvZiBvcHRpb24gPT09IFwib2JqZWN0XCIgJiYgXCJ2YWx1ZVwiIGluIG9wdGlvbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzT3B0aW9uR3JvdXA8XG4gIFRWYWx1ZSxcbiAgVEdyb3VwIGV4dGVuZHMgR2VuZXJpY0xpc3RPcHRpb25Hcm91cDxUVmFsdWUsIEdlbmVyaWNMaXN0T3B0aW9uPFRWYWx1ZT4+LFxuPihcbiAgb3B0aW9uOlxuICAgIHwgVEdyb3VwXG4gICAgfCBUVmFsdWVcbiAgICB8IEdlbmVyaWNMaXN0T3B0aW9uPFRWYWx1ZT5cbiAgICB8IEdlbmVyaWNMaXN0U2VwYXJhdG9yT3B0aW9uXG4gICAgfCB1bmRlZmluZWQsXG4pOiBvcHRpb24gaXMgVEdyb3VwIHtcbiAgcmV0dXJuIG9wdGlvbiAhPT0gbnVsbCAmJiB0eXBlb2Ygb3B0aW9uID09PSBcIm9iamVjdFwiICYmIFwib3B0aW9uc1wiIGluIG9wdGlvbiAmJlxuICAgIEFycmF5LmlzQXJyYXkob3B0aW9uLm9wdGlvbnMpO1xufVxuXG5mdW5jdGlvbiBtYXRjaE9wdGlvbnM8XG4gIFRWYWx1ZSxcbiAgVE9wdGlvbiBleHRlbmRzIEdlbmVyaWNMaXN0T3B0aW9uU2V0dGluZ3M8VFZhbHVlPixcbiAgVEdyb3VwIGV4dGVuZHMgR2VuZXJpY0xpc3RPcHRpb25Hcm91cFNldHRpbmdzPFRWYWx1ZSwgVE9wdGlvbj4sXG4+KFxuICBzZWFyY2hJbnB1dDogc3RyaW5nLFxuICBvcHRpb25zOiBBcnJheTxUT3B0aW9uIHwgVEdyb3VwPixcbik6IEFycmF5PE1hdGNoZWRPcHRpb248VFZhbHVlLCBUT3B0aW9uLCBUR3JvdXA+PiB7XG4gIGNvbnN0IG1hdGNoZWQ6IEFycmF5PE1hdGNoZWRPcHRpb248VFZhbHVlLCBUT3B0aW9uLCBUR3JvdXA+PiA9IFtdO1xuXG4gIGZvciAoY29uc3Qgb3B0aW9uIG9mIG9wdGlvbnMpIHtcbiAgICBpZiAoaXNPcHRpb25Hcm91cChvcHRpb24pKSB7XG4gICAgICBjb25zdCBjaGlsZHJlbiA9IG1hdGNoT3B0aW9ucyhzZWFyY2hJbnB1dCwgb3B0aW9uLm9wdGlvbnMpXG4gICAgICAgIC5zb3J0KHNvcnRCeURpc3RhbmNlKTtcblxuICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICBtYXRjaGVkLnB1c2goe1xuICAgICAgICAgIG9wdGlvbixcbiAgICAgICAgICBkaXN0YW5jZTogTWF0aC5taW4oLi4uY2hpbGRyZW4ubWFwKChpdGVtKSA9PiBpdGVtLmRpc3RhbmNlKSksXG4gICAgICAgICAgY2hpbGRyZW4sXG4gICAgICAgIH0pO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobWF0Y2hPcHRpb24oc2VhcmNoSW5wdXQsIG9wdGlvbikpIHtcbiAgICAgIG1hdGNoZWQucHVzaCh7XG4gICAgICAgIG9wdGlvbixcbiAgICAgICAgZGlzdGFuY2U6IGRpc3RhbmNlKG9wdGlvbi5uYW1lLCBzZWFyY2hJbnB1dCksXG4gICAgICAgIGNoaWxkcmVuOiBbXSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtYXRjaGVkLnNvcnQoc29ydEJ5RGlzdGFuY2UpO1xuXG4gIGZ1bmN0aW9uIHNvcnRCeURpc3RhbmNlKFxuICAgIGE6IE1hdGNoZWRPcHRpb248VFZhbHVlLCBUT3B0aW9uLCBUR3JvdXA+LFxuICAgIGI6IE1hdGNoZWRPcHRpb248VFZhbHVlLCBUT3B0aW9uLCBUR3JvdXA+LFxuICApOiBudW1iZXIge1xuICAgIHJldHVybiBhLmRpc3RhbmNlIC0gYi5kaXN0YW5jZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXRjaE9wdGlvbjxcbiAgVFZhbHVlLFxuICBUT3B0aW9uIGV4dGVuZHMgR2VuZXJpY0xpc3RPcHRpb25TZXR0aW5nczxUVmFsdWU+LFxuICBUR3JvdXAgZXh0ZW5kcyBHZW5lcmljTGlzdE9wdGlvbkdyb3VwU2V0dGluZ3M8VFZhbHVlLCBUT3B0aW9uPixcbj4oXG4gIGlucHV0U3RyaW5nOiBzdHJpbmcsXG4gIG9wdGlvbjogVE9wdGlvbiB8IFRHcm91cCxcbik6IGJvb2xlYW4ge1xuICByZXR1cm4gbWF0Y2hJbnB1dChpbnB1dFN0cmluZywgb3B0aW9uLm5hbWUpIHx8IChcbiAgICBpc09wdGlvbihvcHRpb24pICYmXG4gICAgb3B0aW9uLm5hbWUgIT09IG9wdGlvbi52YWx1ZSAmJlxuICAgIG1hdGNoSW5wdXQoaW5wdXRTdHJpbmcsIFN0cmluZyhvcHRpb24udmFsdWUpKVxuICApO1xufVxuXG5mdW5jdGlvbiBtYXRjaElucHV0KGlucHV0U3RyaW5nOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIHN0cmlwQ29sb3IodmFsdWUpXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAuaW5jbHVkZXMoaW5wdXRTdHJpbmcpO1xufVxuXG5mdW5jdGlvbiBmbGF0TWF0Y2hlZE9wdGlvbnM8XG4gIFRWYWx1ZSxcbiAgVE9wdGlvbiBleHRlbmRzIEdlbmVyaWNMaXN0T3B0aW9uU2V0dGluZ3M8VFZhbHVlPixcbiAgVEdyb3VwIGV4dGVuZHMgR2VuZXJpY0xpc3RPcHRpb25Hcm91cFNldHRpbmdzPFRWYWx1ZSwgVE9wdGlvbj4sXG4+KFxuICBtYXRjaGVzOiBBcnJheTxNYXRjaGVkT3B0aW9uPFRWYWx1ZSwgVE9wdGlvbiwgVEdyb3VwPj4sXG4gIGluZGVudExldmVsID0gMCxcbiAgcmVzdWx0OiBBcnJheTxUT3B0aW9uIHwgVEdyb3VwPiA9IFtdLFxuKTogQXJyYXk8VE9wdGlvbiB8IFRHcm91cD4ge1xuICBmb3IgKGNvbnN0IHsgb3B0aW9uLCBjaGlsZHJlbiB9IG9mIG1hdGNoZXMpIHtcbiAgICBvcHRpb24uaW5kZW50TGV2ZWwgPSBpbmRlbnRMZXZlbDtcbiAgICByZXN1bHQucHVzaChvcHRpb24pO1xuICAgIGZsYXRNYXRjaGVkT3B0aW9ucyhjaGlsZHJlbiwgaW5kZW50TGV2ZWwgKyAxLCByZXN1bHQpO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBHZW5lcmljTGlzdCBvcHRpb25zIHR5cGUuXG4gKlxuICogQGRlcHJlY2F0ZWQgVXNlIGBBcnJheTxzdHJpbmcgfCBHZW5lcmljTGlzdE9wdGlvbj5gIGluc3RlYWQuXG4gKi9cbmV4cG9ydCB0eXBlIEdlbmVyaWNMaXN0VmFsdWVPcHRpb25zID0gQXJyYXk8c3RyaW5nIHwgR2VuZXJpY0xpc3RPcHRpb248c3RyaW5nPj47XG4vKiogQGRlcHJlY2F0ZWQgVXNlIGBBcnJheTxHZW5lcmljTGlzdE9wdGlvblNldHRpbmdzPmAgaW5zdGVhZC4gKi9cbmV4cG9ydCB0eXBlIEdlbmVyaWNMaXN0VmFsdWVTZXR0aW5ncyA9IEFycmF5PEdlbmVyaWNMaXN0T3B0aW9uU2V0dGluZ3M8c3RyaW5nPj47XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsU0FDRSxZQUFZLFFBSVAsc0JBQXNCO0FBRTdCLFNBQVMsSUFBSSxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLE1BQU0sUUFBUSxZQUFZO0FBQ3RFLFNBQVMsT0FBTyxFQUFFLGdCQUFnQixRQUFRLGdCQUFnQjtBQUMxRCxTQUFTLFFBQVEsUUFBUSx3QkFBd0I7QUFxSmpELHdDQUF3QyxHQUN4QyxPQUFPLE1BQWUsb0JBTVo7RUFXRSxnQkFBK0IsRUFBRSxDQUFDO0VBRTVDLElBQWMsaUJBQWlCO0lBQzdCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVM7RUFDdkM7RUFFQTs7OztHQUlDLEdBQ0QsT0FBYyxVQUFVLFFBQVEsY0FBYyxFQUE4QjtJQUMxRSxPQUFPO01BQUUsTUFBTTtJQUFNO0VBQ3ZCO0VBRU8sbUJBQ0ws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
// denoCacheMetadata=15080144029807049034,2533230429489508709