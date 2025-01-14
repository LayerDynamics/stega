// src/help.ts
export class Help {
  registry;
  i18n;
  constructor(registry, i18n){
    this.registry = registry;
    this.i18n = i18n;
  }
  /**
	 * Generates help text for a specific command or all commands.
	 * @param command The command to generate help for. If undefined, generates general help.
	 * @returns The help text as a string.
	 */ generateHelp(command) {
    let helpText = "";
    if (!command) {
      helpText += `${this.i18n.t("available_commands")}\n`;
      for (const cmd of this.registry.getCommands()){
        helpText += `  ${cmd.name}\t${cmd.description || ""}\n`;
      }
      helpText += `\n${this.i18n.t("use_help")}\n`;
    } else {
      helpText += `\n${this.i18n.t("command")}: ${command.name}\n\n`;
      helpText += `${command.description || ""}\n\n`;
      if (command.options && command.options.length > 0) {
        helpText += `${this.i18n.t("options")}:\n`;
        for (const option of command.options){
          const aliases = option.alias ? `, -${option.alias}` : "";
          const defaultValue = option.default !== undefined ? ` (${this.i18n.t("default")}: ${option.default})` : "";
          helpText += `  --${option.name}${aliases}\t${option.description || ""}${defaultValue}\n`;
        }
        helpText += "\n";
      }
      if (command.subcommands && command.subcommands.length > 0) {
        helpText += "Subcommands:\n";
        for (const sub of command.subcommands){
          helpText += `  ${sub.name}\t${sub.description || ""}\n`;
        }
        helpText += "\n";
      }
      helpText += `Usage:\n  stega ${this.getUsage(command)}\n`;
    }
    return helpText;
  }
  /**
	 * Generates usage information for a command.
	 * @param command The command to generate usage for.
	 * @returns The usage string.
	 */ getUsage(command) {
    let usage = command.name;
    if (command.subcommands && command.subcommands.length > 0) {
      usage += " <subcommand>";
    }
    if (command.options && command.options.length > 0) {
      usage += " [options]";
    }
    return usage;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvaGVscC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBzcmMvaGVscC50c1xuaW1wb3J0IHsgQ29tbWFuZCwgQ29tbWFuZFJlZ2lzdHJ5IH0gZnJvbSBcIi4vY29tbWFuZC50c1wiOyAvLyBJbXBvcnQgQ29tbWFuZCBmcm9tIGNvbW1hbmQudHNcbmltcG9ydCB7IEkxOG4gfSBmcm9tIFwiLi9pMThuLnRzXCI7XG5cbmV4cG9ydCBjbGFzcyBIZWxwIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWdpc3RyeTogQ29tbWFuZFJlZ2lzdHJ5LCBwcml2YXRlIGkxOG46IEkxOG4pIHt9XG5cblx0LyoqXG5cdCAqIEdlbmVyYXRlcyBoZWxwIHRleHQgZm9yIGEgc3BlY2lmaWMgY29tbWFuZCBvciBhbGwgY29tbWFuZHMuXG5cdCAqIEBwYXJhbSBjb21tYW5kIFRoZSBjb21tYW5kIHRvIGdlbmVyYXRlIGhlbHAgZm9yLiBJZiB1bmRlZmluZWQsIGdlbmVyYXRlcyBnZW5lcmFsIGhlbHAuXG5cdCAqIEByZXR1cm5zIFRoZSBoZWxwIHRleHQgYXMgYSBzdHJpbmcuXG5cdCAqL1xuXHRnZW5lcmF0ZUhlbHAoY29tbWFuZD86IENvbW1hbmQpOiBzdHJpbmcge1xuXHRcdGxldCBoZWxwVGV4dCA9IFwiXCI7XG5cblx0XHRpZiAoIWNvbW1hbmQpIHtcblx0XHRcdGhlbHBUZXh0ICs9IGAke3RoaXMuaTE4bi50KFwiYXZhaWxhYmxlX2NvbW1hbmRzXCIpfVxcbmA7XG5cdFx0XHRmb3IgKGNvbnN0IGNtZCBvZiB0aGlzLnJlZ2lzdHJ5LmdldENvbW1hbmRzKCkpIHtcblx0XHRcdFx0aGVscFRleHQgKz0gYCAgJHtjbWQubmFtZX1cXHQke2NtZC5kZXNjcmlwdGlvbiB8fCBcIlwifVxcbmA7XG5cdFx0XHR9XG5cdFx0XHRoZWxwVGV4dCArPSBgXFxuJHt0aGlzLmkxOG4udChcInVzZV9oZWxwXCIpfVxcbmA7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGhlbHBUZXh0ICs9IGBcXG4ke3RoaXMuaTE4bi50KFwiY29tbWFuZFwiKX06ICR7Y29tbWFuZC5uYW1lfVxcblxcbmA7XG5cdFx0XHRoZWxwVGV4dCArPSBgJHtjb21tYW5kLmRlc2NyaXB0aW9uIHx8IFwiXCJ9XFxuXFxuYDtcblxuXHRcdFx0aWYgKGNvbW1hbmQub3B0aW9ucyAmJiBjb21tYW5kLm9wdGlvbnMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRoZWxwVGV4dCArPSBgJHt0aGlzLmkxOG4udChcIm9wdGlvbnNcIil9OlxcbmA7XG5cdFx0XHRcdGZvciAoY29uc3Qgb3B0aW9uIG9mIGNvbW1hbmQub3B0aW9ucykge1xuXHRcdFx0XHRcdGNvbnN0IGFsaWFzZXMgPSBvcHRpb24uYWxpYXMgPyBgLCAtJHtvcHRpb24uYWxpYXN9YCA6IFwiXCI7XG5cdFx0XHRcdFx0Y29uc3QgZGVmYXVsdFZhbHVlID0gb3B0aW9uLmRlZmF1bHQgIT09IHVuZGVmaW5lZFxuXHRcdFx0XHRcdFx0PyBgICgke3RoaXMuaTE4bi50KFwiZGVmYXVsdFwiKX06ICR7b3B0aW9uLmRlZmF1bHR9KWBcblx0XHRcdFx0XHRcdDogXCJcIjtcblx0XHRcdFx0XHRoZWxwVGV4dCArPSBgICAtLSR7b3B0aW9uLm5hbWV9JHthbGlhc2VzfVxcdCR7XG5cdFx0XHRcdFx0XHRvcHRpb24uZGVzY3JpcHRpb24gfHwgXCJcIlxuXHRcdFx0XHRcdH0ke2RlZmF1bHRWYWx1ZX1cXG5gO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGhlbHBUZXh0ICs9IFwiXFxuXCI7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChjb21tYW5kLnN1YmNvbW1hbmRzICYmIGNvbW1hbmQuc3ViY29tbWFuZHMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRoZWxwVGV4dCArPSBcIlN1YmNvbW1hbmRzOlxcblwiO1xuXHRcdFx0XHRmb3IgKGNvbnN0IHN1YiBvZiBjb21tYW5kLnN1YmNvbW1hbmRzKSB7XG5cdFx0XHRcdFx0aGVscFRleHQgKz0gYCAgJHtzdWIubmFtZX1cXHQke3N1Yi5kZXNjcmlwdGlvbiB8fCBcIlwifVxcbmA7XG5cdFx0XHRcdH1cblx0XHRcdFx0aGVscFRleHQgKz0gXCJcXG5cIjtcblx0XHRcdH1cblxuXHRcdFx0aGVscFRleHQgKz0gYFVzYWdlOlxcbiAgc3RlZ2EgJHt0aGlzLmdldFVzYWdlKGNvbW1hbmQpfVxcbmA7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGhlbHBUZXh0O1xuXHR9XG5cblx0LyoqXG5cdCAqIEdlbmVyYXRlcyB1c2FnZSBpbmZvcm1hdGlvbiBmb3IgYSBjb21tYW5kLlxuXHQgKiBAcGFyYW0gY29tbWFuZCBUaGUgY29tbWFuZCB0byBnZW5lcmF0ZSB1c2FnZSBmb3IuXG5cdCAqIEByZXR1cm5zIFRoZSB1c2FnZSBzdHJpbmcuXG5cdCAqL1xuXHRnZXRVc2FnZShjb21tYW5kOiBDb21tYW5kKTogc3RyaW5nIHtcblx0XHRsZXQgdXNhZ2UgPSBjb21tYW5kLm5hbWU7XG5cblx0XHRpZiAoY29tbWFuZC5zdWJjb21tYW5kcyAmJiBjb21tYW5kLnN1YmNvbW1hbmRzLmxlbmd0aCA+IDApIHtcblx0XHRcdHVzYWdlICs9IFwiIDxzdWJjb21tYW5kPlwiO1xuXHRcdH1cblxuXHRcdGlmIChjb21tYW5kLm9wdGlvbnMgJiYgY29tbWFuZC5vcHRpb25zLmxlbmd0aCA+IDApIHtcblx0XHRcdHVzYWdlICs9IFwiIFtvcHRpb25zXVwiO1xuXHRcdH1cblxuXHRcdHJldHVybiB1c2FnZTtcblx0fVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGNBQWM7QUFJZCxPQUFPLE1BQU07OztFQUNaLFlBQVksQUFBUSxRQUF5QixFQUFFLEFBQVEsSUFBVSxDQUFFO1NBQS9DLFdBQUE7U0FBbUMsT0FBQTtFQUFhO0VBRXBFOzs7O0VBSUMsR0FDRCxhQUFhLE9BQWlCLEVBQVU7SUFDdkMsSUFBSSxXQUFXO0lBRWYsSUFBSSxDQUFDLFNBQVM7TUFDYixZQUFZLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO01BQ3BELEtBQUssTUFBTSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxHQUFJO1FBQzlDLFlBQVksQ0FBQyxFQUFFLEVBQUUsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksV0FBVyxJQUFJLEdBQUcsRUFBRSxDQUFDO01BQ3hEO01BQ0EsWUFBWSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUM3QyxPQUFPO01BQ04sWUFBWSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUM7TUFDOUQsWUFBWSxDQUFDLEVBQUUsUUFBUSxXQUFXLElBQUksR0FBRyxJQUFJLENBQUM7TUFFOUMsSUFBSSxRQUFRLE9BQU8sSUFBSSxRQUFRLE9BQU8sQ0FBQyxNQUFNLEdBQUcsR0FBRztRQUNsRCxZQUFZLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLEdBQUcsQ0FBQztRQUMxQyxLQUFLLE1BQU0sVUFBVSxRQUFRLE9BQU8sQ0FBRTtVQUNyQyxNQUFNLFVBQVUsT0FBTyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxLQUFLLENBQUMsQ0FBQyxHQUFHO1VBQ3RELE1BQU0sZUFBZSxPQUFPLE9BQU8sS0FBSyxZQUNyQyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FDakQ7VUFDSCxZQUFZLENBQUMsSUFBSSxFQUFFLE9BQU8sSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQzFDLE9BQU8sV0FBVyxJQUFJLEdBQ3RCLEVBQUUsYUFBYSxFQUFFLENBQUM7UUFDcEI7UUFDQSxZQUFZO01BQ2I7TUFFQSxJQUFJLFFBQVEsV0FBVyxJQUFJLFFBQVEsV0FBVyxDQUFDLE1BQU0sR0FBRyxHQUFHO1FBQzFELFlBQVk7UUFDWixLQUFLLE1BQU0sT0FBTyxRQUFRLFdBQVcsQ0FBRTtVQUN0QyxZQUFZLENBQUMsRUFBRSxFQUFFLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLFdBQVcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUN4RDtRQUNBLFlBQVk7TUFDYjtNQUVBLFlBQVksQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQzFEO0lBRUEsT0FBTztFQUNSO0VBRUE7Ozs7RUFJQyxHQUNELFNBQVMsT0FBZ0IsRUFBVTtJQUNsQyxJQUFJLFFBQVEsUUFBUSxJQUFJO0lBRXhCLElBQUksUUFBUSxXQUFXLElBQUksUUFBUSxXQUFXLENBQUMsTUFBTSxHQUFHLEdBQUc7TUFDMUQsU0FBUztJQUNWO0lBRUEsSUFBSSxRQUFRLE9BQU8sSUFBSSxRQUFRLE9BQU8sQ0FBQyxNQUFNLEdBQUcsR0FBRztNQUNsRCxTQUFTO0lBQ1Y7SUFFQSxPQUFPO0VBQ1I7QUFDRCJ9
// denoCacheMetadata=14857639575490983493,2246785648476505873