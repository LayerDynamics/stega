import { dim, underline } from "./deps.ts";
import { GenericPrompt } from "./_generic_prompt.ts";
/**
 * Toggle prompt representation.
 *
 * ```ts
 * import { Toggle } from "./mod.ts";
 *
 * const password: boolean = await Toggle.prompt("Please confirm");
 * ```
 */ export class Toggle extends GenericPrompt {
  settings;
  status;
  /** Execute the prompt. */ static prompt(options) {
    return new this(options).prompt();
  }
  constructor(options){
    super();
    if (typeof options === "string") {
      options = {
        message: options
      };
    }
    this.settings = this.getDefaultSettings(options);
    this.status = typeof this.settings.default !== "undefined" ? this.format(this.settings.default) : "";
  }
  getDefaultSettings(options) {
    const settings = super.getDefaultSettings(options);
    return {
      ...settings,
      active: options.active || "Yes",
      inactive: options.inactive || "No",
      keys: {
        active: [
          "right",
          "y",
          "j",
          "s",
          "o"
        ],
        inactive: [
          "left",
          "n"
        ],
        ...settings.keys ?? {}
      }
    };
  }
  message() {
    let message = super.message() + " " + this.settings.pointer + " ";
    if (this.status === this.settings.active) {
      message += dim(this.settings.inactive + " / ") + underline(this.settings.active);
    } else if (this.status === this.settings.inactive) {
      message += underline(this.settings.inactive) + dim(" / " + this.settings.active);
    } else {
      message += dim(this.settings.inactive + " / " + this.settings.active);
    }
    return message;
  }
  /** Read user input from stdin, handle events and validate user input. */ read() {
    this.settings.tty.cursorHide();
    return super.read();
  }
  /**
   * Handle user input event.
   * @param event Key event.
   */ async handleEvent(event) {
    switch(true){
      case event.sequence === this.settings.inactive[0].toLowerCase():
      case this.isKey(this.settings.keys, "inactive", event):
        this.selectInactive();
        break;
      case event.sequence === this.settings.active[0].toLowerCase():
      case this.isKey(this.settings.keys, "active", event):
        this.selectActive();
        break;
      default:
        await super.handleEvent(event);
    }
  }
  /** Set active. */ selectActive() {
    this.status = this.settings.active;
  }
  /** Set inactive. */ selectInactive() {
    this.status = this.settings.inactive;
  }
  /**
   * Validate input value.
   * @param value User input value.
   * @return True on success, false or error message on error.
   */ validate(value) {
    return [
      this.settings.active,
      this.settings.inactive
    ].indexOf(value) !== -1;
  }
  /**
   * Map input value to output value.
   * @param value Input value.
   * @return Output value.
   */ transform(value) {
    switch(value){
      case this.settings.active:
        return true;
      case this.settings.inactive:
        return false;
    }
  }
  /**
   * Format output value.
   * @param value Output value.
   */ format(value) {
    return value ? this.settings.active : this.settings.inactive;
  }
  /** Get input value. */ getValue() {
    return this.status;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYxLjAuMC1yYy4zL3Byb21wdC90b2dnbGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBLZXlDb2RlIH0gZnJvbSBcIi4uL2tleWNvZGUva2V5X2NvZGUudHNcIjtcbmltcG9ydCB7IGRpbSwgdW5kZXJsaW5lIH0gZnJvbSBcIi4vZGVwcy50c1wiO1xuaW1wb3J0IHtcbiAgR2VuZXJpY1Byb21wdCxcbiAgR2VuZXJpY1Byb21wdEtleXMsXG4gIEdlbmVyaWNQcm9tcHRPcHRpb25zLFxuICBHZW5lcmljUHJvbXB0U2V0dGluZ3MsXG59IGZyb20gXCIuL19nZW5lcmljX3Byb21wdC50c1wiO1xuXG4vKiogR2VuZXJpYyBwcm9tcHQgb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVG9nZ2xlT3B0aW9ucyBleHRlbmRzIEdlbmVyaWNQcm9tcHRPcHRpb25zPGJvb2xlYW4sIHN0cmluZz4ge1xuICAvKiogS2V5bWFwIHRvIGFzc2lnbiBrZXkgbmFtZXMgdG8gcHJvbXB0IGFjdGlvbnMuICovXG4gIGtleXM/OiBUb2dnbGVLZXlzO1xuICAvKiogQ2hhbmdlIGFjdGl2ZSBsYWJlbC4gRGVmYXVsdCBpcyBgXCJZZXNcImAuICovXG4gIGFjdGl2ZT86IHN0cmluZztcbiAgLyoqIENoYW5nZSBpbmFjdGl2ZSBsYWJlbC4gRGVmYXVsdCBpcyBgXCJOb1wiYC4gKi9cbiAgaW5hY3RpdmU/OiBzdHJpbmc7XG59XG5cbi8qKiBUb2dnbGUgcHJvbXB0IHNldHRpbmdzLiAqL1xuaW50ZXJmYWNlIFRvZ2dsZVNldHRpbmdzIGV4dGVuZHMgR2VuZXJpY1Byb21wdFNldHRpbmdzPGJvb2xlYW4sIHN0cmluZz4ge1xuICBrZXlzOiBUb2dnbGVLZXlzO1xuICBhY3RpdmU6IHN0cmluZztcbiAgaW5hY3RpdmU6IHN0cmluZztcbn1cblxuLyoqIFRvZ2dsZSBwcm9tcHQga2V5bWFwLiAqL1xuZXhwb3J0IGludGVyZmFjZSBUb2dnbGVLZXlzIGV4dGVuZHMgR2VuZXJpY1Byb21wdEtleXMge1xuICAvKiogQWN0aXZhdGUga2V5bWFwLiBEZWZhdWx0IGlzIGBbXCJyaWdodFwiLCBcInlcIiwgXCJqXCIsIFwic1wiLCBcIm9cIl1gLiAqL1xuICBhY3RpdmU/OiBzdHJpbmdbXTtcbiAgLyoqIERlYWN0aXZhdGUga2V5bWFwLiBEZWZhdWx0IGlzIGBbXCJsZWZ0XCIsIFwiblwiXWAuICovXG4gIGluYWN0aXZlPzogc3RyaW5nW107XG59XG5cbi8qKlxuICogVG9nZ2xlIHByb21wdCByZXByZXNlbnRhdGlvbi5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgVG9nZ2xlIH0gZnJvbSBcIi4vbW9kLnRzXCI7XG4gKlxuICogY29uc3QgcGFzc3dvcmQ6IGJvb2xlYW4gPSBhd2FpdCBUb2dnbGUucHJvbXB0KFwiUGxlYXNlIGNvbmZpcm1cIik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFRvZ2dsZSBleHRlbmRzIEdlbmVyaWNQcm9tcHQ8Ym9vbGVhbiwgc3RyaW5nPiB7XG4gIHByb3RlY3RlZCByZWFkb25seSBzZXR0aW5nczogVG9nZ2xlU2V0dGluZ3M7XG4gIHByb3RlY3RlZCBzdGF0dXM6IHN0cmluZztcblxuICAvKiogRXhlY3V0ZSB0aGUgcHJvbXB0LiAqL1xuICBwdWJsaWMgc3RhdGljIHByb21wdChcbiAgICBvcHRpb25zOiBzdHJpbmcgfCBUb2dnbGVPcHRpb25zLFxuICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gbmV3IHRoaXMob3B0aW9ucykucHJvbXB0KCk7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBzdHJpbmcgfCBUb2dnbGVPcHRpb25zKSB7XG4gICAgc3VwZXIoKTtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIG9wdGlvbnMgPSB7IG1lc3NhZ2U6IG9wdGlvbnMgfTtcbiAgICB9XG4gICAgdGhpcy5zZXR0aW5ncyA9IHRoaXMuZ2V0RGVmYXVsdFNldHRpbmdzKG9wdGlvbnMpO1xuICAgIHRoaXMuc3RhdHVzID0gdHlwZW9mIHRoaXMuc2V0dGluZ3MuZGVmYXVsdCAhPT0gXCJ1bmRlZmluZWRcIlxuICAgICAgPyB0aGlzLmZvcm1hdCh0aGlzLnNldHRpbmdzLmRlZmF1bHQpXG4gICAgICA6IFwiXCI7XG4gIH1cblxuICBwdWJsaWMgZ2V0RGVmYXVsdFNldHRpbmdzKG9wdGlvbnM6IFRvZ2dsZU9wdGlvbnMpOiBUb2dnbGVTZXR0aW5ncyB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSBzdXBlci5nZXREZWZhdWx0U2V0dGluZ3Mob3B0aW9ucyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnNldHRpbmdzLFxuICAgICAgYWN0aXZlOiBvcHRpb25zLmFjdGl2ZSB8fCBcIlllc1wiLFxuICAgICAgaW5hY3RpdmU6IG9wdGlvbnMuaW5hY3RpdmUgfHwgXCJOb1wiLFxuICAgICAga2V5czoge1xuICAgICAgICBhY3RpdmU6IFtcInJpZ2h0XCIsIFwieVwiLCBcImpcIiwgXCJzXCIsIFwib1wiXSxcbiAgICAgICAgaW5hY3RpdmU6IFtcImxlZnRcIiwgXCJuXCJdLFxuICAgICAgICAuLi4oc2V0dGluZ3Mua2V5cyA/PyB7fSksXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBwcm90ZWN0ZWQgbWVzc2FnZSgpOiBzdHJpbmcge1xuICAgIGxldCBtZXNzYWdlID0gc3VwZXIubWVzc2FnZSgpICsgXCIgXCIgKyB0aGlzLnNldHRpbmdzLnBvaW50ZXIgKyBcIiBcIjtcblxuICAgIGlmICh0aGlzLnN0YXR1cyA9PT0gdGhpcy5zZXR0aW5ncy5hY3RpdmUpIHtcbiAgICAgIG1lc3NhZ2UgKz0gZGltKHRoaXMuc2V0dGluZ3MuaW5hY3RpdmUgKyBcIiAvIFwiKSArXG4gICAgICAgIHVuZGVybGluZSh0aGlzLnNldHRpbmdzLmFjdGl2ZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLnN0YXR1cyA9PT0gdGhpcy5zZXR0aW5ncy5pbmFjdGl2ZSkge1xuICAgICAgbWVzc2FnZSArPSB1bmRlcmxpbmUodGhpcy5zZXR0aW5ncy5pbmFjdGl2ZSkgK1xuICAgICAgICBkaW0oXCIgLyBcIiArIHRoaXMuc2V0dGluZ3MuYWN0aXZlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWVzc2FnZSArPSBkaW0odGhpcy5zZXR0aW5ncy5pbmFjdGl2ZSArIFwiIC8gXCIgKyB0aGlzLnNldHRpbmdzLmFjdGl2ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH1cblxuICAvKiogUmVhZCB1c2VyIGlucHV0IGZyb20gc3RkaW4sIGhhbmRsZSBldmVudHMgYW5kIHZhbGlkYXRlIHVzZXIgaW5wdXQuICovXG4gIHByb3RlY3RlZCByZWFkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRoaXMuc2V0dGluZ3MudHR5LmN1cnNvckhpZGUoKTtcbiAgICByZXR1cm4gc3VwZXIucmVhZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSB1c2VyIGlucHV0IGV2ZW50LlxuICAgKiBAcGFyYW0gZXZlbnQgS2V5IGV2ZW50LlxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIGhhbmRsZUV2ZW50KGV2ZW50OiBLZXlDb2RlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgc3dpdGNoICh0cnVlKSB7XG4gICAgICBjYXNlIGV2ZW50LnNlcXVlbmNlID09PSB0aGlzLnNldHRpbmdzLmluYWN0aXZlWzBdLnRvTG93ZXJDYXNlKCk6XG4gICAgICBjYXNlIHRoaXMuaXNLZXkodGhpcy5zZXR0aW5ncy5rZXlzLCBcImluYWN0aXZlXCIsIGV2ZW50KTpcbiAgICAgICAgdGhpcy5zZWxlY3RJbmFjdGl2ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZXZlbnQuc2VxdWVuY2UgPT09IHRoaXMuc2V0dGluZ3MuYWN0aXZlWzBdLnRvTG93ZXJDYXNlKCk6XG4gICAgICBjYXNlIHRoaXMuaXNLZXkodGhpcy5zZXR0aW5ncy5rZXlzLCBcImFjdGl2ZVwiLCBldmVudCk6XG4gICAgICAgIHRoaXMuc2VsZWN0QWN0aXZlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYXdhaXQgc3VwZXIuaGFuZGxlRXZlbnQoZXZlbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBTZXQgYWN0aXZlLiAqL1xuICBwcm90ZWN0ZWQgc2VsZWN0QWN0aXZlKCkge1xuICAgIHRoaXMuc3RhdHVzID0gdGhpcy5zZXR0aW5ncy5hY3RpdmU7XG4gIH1cblxuICAvKiogU2V0IGluYWN0aXZlLiAqL1xuICBwcm90ZWN0ZWQgc2VsZWN0SW5hY3RpdmUoKSB7XG4gICAgdGhpcy5zdGF0dXMgPSB0aGlzLnNldHRpbmdzLmluYWN0aXZlO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIGlucHV0IHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgVXNlciBpbnB1dCB2YWx1ZS5cbiAgICogQHJldHVybiBUcnVlIG9uIHN1Y2Nlc3MsIGZhbHNlIG9yIGVycm9yIG1lc3NhZ2Ugb24gZXJyb3IuXG4gICAqL1xuICBwcm90ZWN0ZWQgdmFsaWRhdGUodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4gfCBzdHJpbmcge1xuICAgIHJldHVybiBbdGhpcy5zZXR0aW5ncy5hY3RpdmUsIHRoaXMuc2V0dGluZ3MuaW5hY3RpdmVdLmluZGV4T2YodmFsdWUpICE9PSAtMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXAgaW5wdXQgdmFsdWUgdG8gb3V0cHV0IHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgSW5wdXQgdmFsdWUuXG4gICAqIEByZXR1cm4gT3V0cHV0IHZhbHVlLlxuICAgKi9cbiAgcHJvdGVjdGVkIHRyYW5zZm9ybSh2YWx1ZTogc3RyaW5nKTogYm9vbGVhbiB8IHVuZGVmaW5lZCB7XG4gICAgc3dpdGNoICh2YWx1ZSkge1xuICAgICAgY2FzZSB0aGlzLnNldHRpbmdzLmFjdGl2ZTpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBjYXNlIHRoaXMuc2V0dGluZ3MuaW5hY3RpdmU6XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRm9ybWF0IG91dHB1dCB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIE91dHB1dCB2YWx1ZS5cbiAgICovXG4gIHByb3RlY3RlZCBmb3JtYXQodmFsdWU6IGJvb2xlYW4pOiBzdHJpbmcge1xuICAgIHJldHVybiB2YWx1ZSA/IHRoaXMuc2V0dGluZ3MuYWN0aXZlIDogdGhpcy5zZXR0aW5ncy5pbmFjdGl2ZTtcbiAgfVxuXG4gIC8qKiBHZXQgaW5wdXQgdmFsdWUuICovXG4gIHByb3RlY3RlZCBnZXRWYWx1ZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnN0YXR1cztcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLFNBQVMsR0FBRyxFQUFFLFNBQVMsUUFBUSxZQUFZO0FBQzNDLFNBQ0UsYUFBYSxRQUlSLHVCQUF1QjtBQTJCOUI7Ozs7Ozs7O0NBUUMsR0FDRCxPQUFPLE1BQU0sZUFBZTtFQUNQLFNBQXlCO0VBQ2xDLE9BQWU7RUFFekIsd0JBQXdCLEdBQ3hCLE9BQWMsT0FDWixPQUErQixFQUNiO0lBQ2xCLE9BQU8sSUFBSSxJQUFJLENBQUMsU0FBUyxNQUFNO0VBQ2pDO0VBRUEsWUFBWSxPQUErQixDQUFFO0lBQzNDLEtBQUs7SUFDTCxJQUFJLE9BQU8sWUFBWSxVQUFVO01BQy9CLFVBQVU7UUFBRSxTQUFTO01BQVE7SUFDL0I7SUFDQSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztJQUN4QyxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEtBQUssY0FDM0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sSUFDakM7RUFDTjtFQUVPLG1CQUFtQixPQUFzQixFQUFrQjtJQUNoRSxNQUFNLFdBQVcsS0FBSyxDQUFDLG1CQUFtQjtJQUMxQyxPQUFPO01BQ0wsR0FBRyxRQUFR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
// denoCacheMetadata=3372450318418475377,7347152841892796438