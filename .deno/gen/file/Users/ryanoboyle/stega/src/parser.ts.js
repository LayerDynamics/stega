// src/parser.ts
import { InvalidFlagValueError, MissingFlagError } from "./error.ts"; // Import specific error types
/**
 * Simple CLI argument parser that interprets commands and flags.
 */ export class Parser {
  /**
	 * Parses the command-line arguments.
	 * @param argv The array of command-line arguments (e.g., Deno.args).
	 * @param cli The CLI instance to access command and flag definitions.
	 * @returns An Args object containing commands and flags.
	 */ parse(argv, cli) {
    const args = {
      command: [],
      flags: {},
      cli: cli
    };
    let i = 0;
    while(i < argv.length){
      const arg = argv[i];
      if (arg.startsWith("--")) {
        // Handle long flags: --key or --key=value
        const eqIndex = arg.indexOf("=");
        if (eqIndex !== -1) {
          const key = arg.slice(2, eqIndex);
          const value = arg.slice(eqIndex + 1);
          const flagType = this.getFlagType(key, cli);
          try {
            args.flags[key] = this.parseValue(value, flagType);
          } catch (_error) {
            throw new InvalidFlagValueError(key, flagType); // Passed flagType
          }
        } else {
          const key = arg.slice(2);
          const flagType = this.getFlagType(key, cli);
          const nextArg = argv[i + 1];
          if (flagType !== "boolean" && nextArg && !nextArg.startsWith("-")) {
            // Flag expects a value and next argument is the value
            try {
              args.flags[key] = this.parseValue(nextArg, flagType);
              i++; // Skip the next argument as it's consumed as a value
            } catch (_error) {
              throw new InvalidFlagValueError(key, flagType); // Passed flagType
            }
          } else {
            // Boolean flag without an explicit value
            args.flags[key] = true;
          }
        }
      } else if (arg.startsWith("-") && arg !== "-") {
        // Handle short flags: -k or grouped like -abc
        const flags = arg.slice(1).split("");
        for(let j = 0; j < flags.length; j++){
          const flag = flags[j];
          const flagType = this.getFlagType(flag, cli);
          if (flagType !== "boolean") {
            // Flag expects a value
            const value = argv[i + 1];
            if (value && !value.startsWith("-")) {
              try {
                args.flags[flag] = this.parseValue(value, flagType);
                i++; // Skip the next argument as it's consumed as a value
              } catch (_error) {
                throw new InvalidFlagValueError(flag, flagType); // Passed flagType
              }
            } else {
              throw new MissingFlagError(flag, flagType); // Passed flagType
            }
          } else {
            // Boolean flag
            args.flags[flag] = true;
          }
        }
      } else {
        // Positional argument (command or subcommand)
        args.command.push(arg);
      }
      i++;
    }
    return args;
  }
  /**
	 * Retrieves the type of a flag based on its definition in the CLI.
	 * @param key The flag name or alias.
	 * @param cli The CLI instance to access command definitions.
	 * @returns The type of the flag ("boolean" | "string" | "number" | "array") or "string" if not found.
	 */ getFlagType(key, cli) {
    const flagDef = this.findFlagDefinition(key, cli);
    return flagDef?.type || "string"; // Default to "string" if not found
  }
  /**
	 * Parses a flag value based on its expected type.
	 * @param value The raw string value of the flag.
	 * @param type The expected type of the flag.
	 * @returns The parsed value in the correct type.
	 * @throws InvalidFlagValueError if parsing fails.
	 */ parseValue(value, type) {
    switch(type){
      case "boolean":
        {
          const bool = this.parseBoolean(value);
          // If value is not a recognized boolean string, throw an error
          if (![
            "true",
            "false",
            "1",
            "0",
            "yes",
            "no",
            "y",
            "n"
          ].includes(value.toLowerCase())) {
            throw new Error(`Invalid boolean value: '${value}'.`);
          }
          return bool;
        }
      case "number":
        {
          const num = Number(value);
          if (isNaN(num)) {
            throw new Error(`Expected a number but received '${value}'.`);
          }
          return num;
        }
      case "array":
        {
          return value.split(","); // Assuming comma-separated values
        }
      case "string":
      default:
        return value;
    }
  }
  /**
	 * Parses a string into a boolean.
	 * @param value The string to parse.
	 * @returns The boolean representation.
	 */ parseBoolean(value) {
    const normalized = value.toLowerCase();
    return [
      "true",
      "1",
      "yes",
      "y"
    ].includes(normalized);
  }
  /**
	 * Finds the definition of a flag by its name or alias within all commands and subcommands.
	 * @param key The flag name or alias.
	 * @param cli The CLI instance to access command definitions.
	 * @returns The OptionDefinition of the flag or undefined if not found.
	 */ findFlagDefinition(key, cli) {
    const commands = cli.getCommandRegistry().getCommands(); // Access all registered commands via getCommands()
    for (const cmd of commands){
      // Check in main command options
      if (cmd.options) {
        for (const opt of cmd.options){
          if (opt.name === key || opt.alias === key) {
            return opt;
          }
        }
      }
      // Check in subcommands
      if (cmd.subcommands) {
        for (const subcmd of cmd.subcommands){
          if (subcmd.options) {
            for (const opt of subcmd.options){
              if (opt.name === key || opt.alias === key) {
                return opt;
              }
            }
          }
        }
      }
    }
    return undefined;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvcGFyc2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHNyYy9wYXJzZXIudHNcblxuaW1wb3J0IHR5cGUgeyBBcmdzIH0gZnJvbSBcIi4vdHlwZXMudHNcIjsgLy8gSW1wb3J0IEFyZ3MgdHlwZVxuaW1wb3J0IHR5cGUgeyBDTEkgfSBmcm9tIFwiLi9jb3JlLnRzXCI7IC8vIEltcG9ydCBDTElcbmltcG9ydCB0eXBlIHsgT3B0aW9uIH0gZnJvbSBcIi4vY29tbWFuZC50c1wiOyAvLyBJbXBvcnQgT3B0aW9uIGludGVyZmFjZVxuaW1wb3J0IHsgSW52YWxpZEZsYWdWYWx1ZUVycm9yLCBNaXNzaW5nRmxhZ0Vycm9yIH0gZnJvbSBcIi4vZXJyb3IudHNcIjsgLy8gSW1wb3J0IHNwZWNpZmljIGVycm9yIHR5cGVzXG5cbmV4cG9ydCB0eXBlIEZsYWdWYWx1ZSA9IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBzdHJpbmdbXTtcblxuLyoqXG4gKiBTaW1wbGUgQ0xJIGFyZ3VtZW50IHBhcnNlciB0aGF0IGludGVycHJldHMgY29tbWFuZHMgYW5kIGZsYWdzLlxuICovXG5leHBvcnQgY2xhc3MgUGFyc2VyIHtcblx0LyoqXG5cdCAqIFBhcnNlcyB0aGUgY29tbWFuZC1saW5lIGFyZ3VtZW50cy5cblx0ICogQHBhcmFtIGFyZ3YgVGhlIGFycmF5IG9mIGNvbW1hbmQtbGluZSBhcmd1bWVudHMgKGUuZy4sIERlbm8uYXJncykuXG5cdCAqIEBwYXJhbSBjbGkgVGhlIENMSSBpbnN0YW5jZSB0byBhY2Nlc3MgY29tbWFuZCBhbmQgZmxhZyBkZWZpbml0aW9ucy5cblx0ICogQHJldHVybnMgQW4gQXJncyBvYmplY3QgY29udGFpbmluZyBjb21tYW5kcyBhbmQgZmxhZ3MuXG5cdCAqL1xuXHRwYXJzZShhcmd2OiBzdHJpbmdbXSwgY2xpOiBDTEkpOiBBcmdzIHtcblx0XHRjb25zdCBhcmdzOiBBcmdzID0ge1xuXHRcdFx0Y29tbWFuZDogW10sXG5cdFx0XHRmbGFnczoge30sXG5cdFx0XHRjbGk6IGNsaSwgLy8gQXR0YWNoIHRoZSBDTEkgaW5zdGFuY2Vcblx0XHR9O1xuXG5cdFx0bGV0IGkgPSAwO1xuXG5cdFx0d2hpbGUgKGkgPCBhcmd2Lmxlbmd0aCkge1xuXHRcdFx0Y29uc3QgYXJnID0gYXJndltpXTtcblxuXHRcdFx0aWYgKGFyZy5zdGFydHNXaXRoKFwiLS1cIikpIHtcblx0XHRcdFx0Ly8gSGFuZGxlIGxvbmcgZmxhZ3M6IC0ta2V5IG9yIC0ta2V5PXZhbHVlXG5cdFx0XHRcdGNvbnN0IGVxSW5kZXggPSBhcmcuaW5kZXhPZihcIj1cIik7XG5cdFx0XHRcdGlmIChlcUluZGV4ICE9PSAtMSkge1xuXHRcdFx0XHRcdGNvbnN0IGtleSA9IGFyZy5zbGljZSgyLCBlcUluZGV4KTtcblx0XHRcdFx0XHRjb25zdCB2YWx1ZSA9IGFyZy5zbGljZShlcUluZGV4ICsgMSk7XG5cdFx0XHRcdFx0Y29uc3QgZmxhZ1R5cGUgPSB0aGlzLmdldEZsYWdUeXBlKGtleSwgY2xpKTtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0YXJncy5mbGFnc1trZXldID0gdGhpcy5wYXJzZVZhbHVlKHZhbHVlLCBmbGFnVHlwZSk7XG5cdFx0XHRcdFx0fSBjYXRjaCAoX2Vycm9yKSB7XG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgSW52YWxpZEZsYWdWYWx1ZUVycm9yKGtleSwgZmxhZ1R5cGUpOyAvLyBQYXNzZWQgZmxhZ1R5cGVcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29uc3Qga2V5ID0gYXJnLnNsaWNlKDIpO1xuXHRcdFx0XHRcdGNvbnN0IGZsYWdUeXBlID0gdGhpcy5nZXRGbGFnVHlwZShrZXksIGNsaSk7XG5cdFx0XHRcdFx0Y29uc3QgbmV4dEFyZyA9IGFyZ3ZbaSArIDFdO1xuXG5cdFx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdFx0ZmxhZ1R5cGUgIT09IFwiYm9vbGVhblwiICYmXG5cdFx0XHRcdFx0XHRuZXh0QXJnICYmXG5cdFx0XHRcdFx0XHQhbmV4dEFyZy5zdGFydHNXaXRoKFwiLVwiKVxuXHRcdFx0XHRcdCkge1xuXHRcdFx0XHRcdFx0Ly8gRmxhZyBleHBlY3RzIGEgdmFsdWUgYW5kIG5leHQgYXJndW1lbnQgaXMgdGhlIHZhbHVlXG5cdFx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0XHRhcmdzLmZsYWdzW2tleV0gPSB0aGlzLnBhcnNlVmFsdWUobmV4dEFyZywgZmxhZ1R5cGUpO1xuXHRcdFx0XHRcdFx0XHRpKys7IC8vIFNraXAgdGhlIG5leHQgYXJndW1lbnQgYXMgaXQncyBjb25zdW1lZCBhcyBhIHZhbHVlXG5cdFx0XHRcdFx0XHR9IGNhdGNoIChfZXJyb3IpIHtcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEludmFsaWRGbGFnVmFsdWVFcnJvcihrZXksIGZsYWdUeXBlKTsgLy8gUGFzc2VkIGZsYWdUeXBlXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdC8vIEJvb2xlYW4gZmxhZyB3aXRob3V0IGFuIGV4cGxpY2l0IHZhbHVlXG5cdFx0XHRcdFx0XHRhcmdzLmZsYWdzW2tleV0gPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChhcmcuc3RhcnRzV2l0aChcIi1cIikgJiYgYXJnICE9PSBcIi1cIikge1xuXHRcdFx0XHQvLyBIYW5kbGUgc2hvcnQgZmxhZ3M6IC1rIG9yIGdyb3VwZWQgbGlrZSAtYWJjXG5cdFx0XHRcdGNvbnN0IGZsYWdzID0gYXJnLnNsaWNlKDEpLnNwbGl0KFwiXCIpO1xuXHRcdFx0XHRmb3IgKGxldCBqID0gMDsgaiA8IGZsYWdzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0Y29uc3QgZmxhZyA9IGZsYWdzW2pdO1xuXHRcdFx0XHRcdGNvbnN0IGZsYWdUeXBlID0gdGhpcy5nZXRGbGFnVHlwZShmbGFnLCBjbGkpO1xuXHRcdFx0XHRcdGlmIChmbGFnVHlwZSAhPT0gXCJib29sZWFuXCIpIHtcblx0XHRcdFx0XHRcdC8vIEZsYWcgZXhwZWN0cyBhIHZhbHVlXG5cdFx0XHRcdFx0XHRjb25zdCB2YWx1ZSA9IGFyZ3ZbaSArIDFdO1xuXHRcdFx0XHRcdFx0aWYgKHZhbHVlICYmICF2YWx1ZS5zdGFydHNXaXRoKFwiLVwiKSkge1xuXHRcdFx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0XHRcdGFyZ3MuZmxhZ3NbZmxhZ10gPSB0aGlzLnBhcnNlVmFsdWUodmFsdWUsIGZsYWdUeXBlKTtcblx0XHRcdFx0XHRcdFx0XHRpKys7IC8vIFNraXAgdGhlIG5leHQgYXJndW1lbnQgYXMgaXQncyBjb25zdW1lZCBhcyBhIHZhbHVlXG5cdFx0XHRcdFx0XHRcdH0gY2F0Y2ggKF9lcnJvcikge1xuXHRcdFx0XHRcdFx0XHRcdHRocm93IG5ldyBJbnZhbGlkRmxhZ1ZhbHVlRXJyb3IoZmxhZywgZmxhZ1R5cGUpOyAvLyBQYXNzZWQgZmxhZ1R5cGVcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IE1pc3NpbmdGbGFnRXJyb3IoZmxhZywgZmxhZ1R5cGUpOyAvLyBQYXNzZWQgZmxhZ1R5cGVcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gQm9vbGVhbiBmbGFnXG5cdFx0XHRcdFx0XHRhcmdzLmZsYWdzW2ZsYWddID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIFBvc2l0aW9uYWwgYXJndW1lbnQgKGNvbW1hbmQgb3Igc3ViY29tbWFuZClcblx0XHRcdFx0YXJncy5jb21tYW5kLnB1c2goYXJnKTtcblx0XHRcdH1cblxuXHRcdFx0aSsrO1xuXHRcdH1cblxuXHRcdHJldHVybiBhcmdzO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUgdHlwZSBvZiBhIGZsYWcgYmFzZWQgb24gaXRzIGRlZmluaXRpb24gaW4gdGhlIENMSS5cblx0ICogQHBhcmFtIGtleSBUaGUgZmxhZyBuYW1lIG9yIGFsaWFzLlxuXHQgKiBAcGFyYW0gY2xpIFRoZSBDTEkgaW5zdGFuY2UgdG8gYWNjZXNzIGNvbW1hbmQgZGVmaW5pdGlvbnMuXG5cdCAqIEByZXR1cm5zIFRoZSB0eXBlIG9mIHRoZSBmbGFnIChcImJvb2xlYW5cIiB8IFwic3RyaW5nXCIgfCBcIm51bWJlclwiIHwgXCJhcnJheVwiKSBvciBcInN0cmluZ1wiIGlmIG5vdCBmb3VuZC5cblx0ICovXG5cdHByaXZhdGUgZ2V0RmxhZ1R5cGUoXG5cdFx0a2V5OiBzdHJpbmcsXG5cdFx0Y2xpOiBDTEksXG5cdCk6IFwiYm9vbGVhblwiIHwgXCJzdHJpbmdcIiB8IFwibnVtYmVyXCIgfCBcImFycmF5XCIge1xuXHRcdGNvbnN0IGZsYWdEZWYgPSB0aGlzLmZpbmRGbGFnRGVmaW5pdGlvbihrZXksIGNsaSk7XG5cdFx0cmV0dXJuIGZsYWdEZWY/LnR5cGUgfHwgXCJzdHJpbmdcIjsgLy8gRGVmYXVsdCB0byBcInN0cmluZ1wiIGlmIG5vdCBmb3VuZFxuXHR9XG5cblx0LyoqXG5cdCAqIFBhcnNlcyBhIGZsYWcgdmFsdWUgYmFzZWQgb24gaXRzIGV4cGVjdGVkIHR5cGUuXG5cdCAqIEBwYXJhbSB2YWx1ZSBUaGUgcmF3IHN0cmluZyB2YWx1ZSBvZiB0aGUgZmxhZy5cblx0ICogQHBhcmFtIHR5cGUgVGhlIGV4cGVjdGVkIHR5cGUgb2YgdGhlIGZsYWcuXG5cdCAqIEByZXR1cm5zIFRoZSBwYXJzZWQgdmFsdWUgaW4gdGhlIGNvcnJlY3QgdHlwZS5cblx0ICogQHRocm93cyBJbnZhbGlkRmxhZ1ZhbHVlRXJyb3IgaWYgcGFyc2luZyBmYWlscy5cblx0ICovXG5cdHByaXZhdGUgcGFyc2VWYWx1ZShcblx0XHR2YWx1ZTogc3RyaW5nLFxuXHRcdHR5cGU6IFwiYm9vbGVhblwiIHwgXCJzdHJpbmdcIiB8IFwibnVtYmVyXCIgfCBcImFycmF5XCIsXG5cdCk6IEZsYWdWYWx1ZSB7XG5cdFx0c3dpdGNoICh0eXBlKSB7XG5cdFx0XHRjYXNlIFwiYm9vbGVhblwiOiB7XG5cdFx0XHRcdGNvbnN0IGJvb2wgPSB0aGlzLnBhcnNlQm9vbGVhbih2YWx1ZSk7XG5cdFx0XHRcdC8vIElmIHZhbHVlIGlzIG5vdCBhIHJlY29nbml6ZWQgYm9vbGVhbiBzdHJpbmcsIHRocm93IGFuIGVycm9yXG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHQhW1widHJ1ZVwiLCBcImZhbHNlXCIsIFwiMVwiLCBcIjBcIiwgXCJ5ZXNcIiwgXCJub1wiLCBcInlcIiwgXCJuXCJdLmluY2x1ZGVzKFxuXHRcdFx0XHRcdFx0dmFsdWUudG9Mb3dlckNhc2UoKSxcblx0XHRcdFx0XHQpXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBib29sZWFuIHZhbHVlOiAnJHt2YWx1ZX0nLmApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBib29sO1xuXHRcdFx0fVxuXHRcdFx0Y2FzZSBcIm51bWJlclwiOiB7XG5cdFx0XHRcdGNvbnN0IG51bSA9IE51bWJlcih2YWx1ZSk7XG5cdFx0XHRcdGlmIChpc05hTihudW0pKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBhIG51bWJlciBidXQgcmVjZWl2ZWQgJyR7dmFsdWV9Jy5gKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gbnVtO1xuXHRcdFx0fVxuXHRcdFx0Y2FzZSBcImFycmF5XCI6IHtcblx0XHRcdFx0cmV0dXJuIHZhbHVlLnNwbGl0KFwiLFwiKTsgLy8gQXNzdW1pbmcgY29tbWEtc2VwYXJhdGVkIHZhbHVlc1xuXHRcdFx0fVxuXHRcdFx0Y2FzZSBcInN0cmluZ1wiOlxuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBQYXJzZXMgYSBzdHJpbmcgaW50byBhIGJvb2xlYW4uXG5cdCAqIEBwYXJhbSB2YWx1ZSBUaGUgc3RyaW5nIHRvIHBhcnNlLlxuXHQgKiBAcmV0dXJucyBUaGUgYm9vbGVhbiByZXByZXNlbnRhdGlvbi5cblx0ICovXG5cdHByaXZhdGUgcGFyc2VCb29sZWFuKHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHtcblx0XHRjb25zdCBub3JtYWxpemVkID0gdmFsdWUudG9Mb3dlckNhc2UoKTtcblx0XHRyZXR1cm4gW1widHJ1ZVwiLCBcIjFcIiwgXCJ5ZXNcIiwgXCJ5XCJdLmluY2x1ZGVzKG5vcm1hbGl6ZWQpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEZpbmRzIHRoZSBkZWZpbml0aW9uIG9mIGEgZmxhZyBieSBpdHMgbmFtZSBvciBhbGlhcyB3aXRoaW4gYWxsIGNvbW1hbmRzIGFuZCBzdWJjb21tYW5kcy5cblx0ICogQHBhcmFtIGtleSBUaGUgZmxhZyBuYW1lIG9yIGFsaWFzLlxuXHQgKiBAcGFyYW0gY2xpIFRoZSBDTEkgaW5zdGFuY2UgdG8gYWNjZXNzIGNvbW1hbmQgZGVmaW5pdGlvbnMuXG5cdCAqIEByZXR1cm5zIFRoZSBPcHRpb25EZWZpbml0aW9uIG9mIHRoZSBmbGFnIG9yIHVuZGVmaW5lZCBpZiBub3QgZm91bmQuXG5cdCAqL1xuXHRwcml2YXRlIGZpbmRGbGFnRGVmaW5pdGlvbihrZXk6IHN0cmluZywgY2xpOiBDTEkpOiBPcHRpb24gfCB1bmRlZmluZWQge1xuXHRcdGNvbnN0IGNvbW1hbmRzID0gY2xpLmdldENvbW1hbmRSZWdpc3RyeSgpLmdldENvbW1hbmRzKCk7IC8vIEFjY2VzcyBhbGwgcmVnaXN0ZXJlZCBjb21tYW5kcyB2aWEgZ2V0Q29tbWFuZHMoKVxuXHRcdGZvciAoY29uc3QgY21kIG9mIGNvbW1hbmRzKSB7XG5cdFx0XHQvLyBDaGVjayBpbiBtYWluIGNvbW1hbmQgb3B0aW9uc1xuXHRcdFx0aWYgKGNtZC5vcHRpb25zKSB7XG5cdFx0XHRcdGZvciAoY29uc3Qgb3B0IG9mIGNtZC5vcHRpb25zKSB7XG5cdFx0XHRcdFx0aWYgKG9wdC5uYW1lID09PSBrZXkgfHwgb3B0LmFsaWFzID09PSBrZXkpIHtcblx0XHRcdFx0XHRcdHJldHVybiBvcHQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIENoZWNrIGluIHN1YmNvbW1hbmRzXG5cdFx0XHRpZiAoY21kLnN1YmNvbW1hbmRzKSB7XG5cdFx0XHRcdGZvciAoY29uc3Qgc3ViY21kIG9mIGNtZC5zdWJjb21tYW5kcykge1xuXHRcdFx0XHRcdGlmIChzdWJjbWQub3B0aW9ucykge1xuXHRcdFx0XHRcdFx0Zm9yIChjb25zdCBvcHQgb2Ygc3ViY21kLm9wdGlvbnMpIHtcblx0XHRcdFx0XHRcdFx0aWYgKG9wdC5uYW1lID09PSBrZXkgfHwgb3B0LmFsaWFzID09PSBrZXkpIHtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gb3B0O1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxnQkFBZ0I7QUFLaEIsU0FBUyxxQkFBcUIsRUFBRSxnQkFBZ0IsUUFBUSxhQUFhLENBQUMsOEJBQThCO0FBSXBHOztDQUVDLEdBQ0QsT0FBTyxNQUFNO0VBQ1o7Ozs7O0VBS0MsR0FDRCxNQUFNLElBQWMsRUFBRSxHQUFRLEVBQVE7SUFDckMsTUFBTSxPQUFhO01BQ2xCLFNBQVMsRUFBRTtNQUNYLE9BQU8sQ0FBQztNQUNSLEtBQUs7SUFDTjtJQUVBLElBQUksSUFBSTtJQUVSLE1BQU8sSUFBSSxLQUFLLE1BQU0sQ0FBRTtNQUN2QixNQUFNLE1BQU0sSUFBSSxDQUFDLEVBQUU7TUFFbkIsSUFBSSxJQUFJLFVBQVUsQ0FBQyxPQUFPO1FBQ3pCLDBDQUEwQztRQUMxQyxNQUFNLFVBQVUsSUFBSSxPQUFPLENBQUM7UUFDNUIsSUFBSSxZQUFZLENBQUMsR0FBRztVQUNuQixNQUFNLE1BQU0sSUFBSSxLQUFLLENBQUMs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
// denoCacheMetadata=4237440470464972356,16048033852286788239