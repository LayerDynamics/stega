// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { LogLevels } from "./levels.ts";
import { blue, bold, red, yellow } from "../fmt/colors.ts";
import { BaseHandler } from "./base_handler.ts";
/**
 * This is the default logger. It will output color coded log messages to the
 * console via `console.log()`.
 */ export class ConsoleHandler extends BaseHandler {
  #useColors;
  constructor(levelName, options = {}){
    super(levelName, options);
    this.#useColors = options.useColors ?? true;
  }
  format(logRecord) {
    let msg = super.format(logRecord);
    if (this.#useColors) {
      msg = this.applyColors(msg, logRecord.level);
    }
    return msg;
  }
  applyColors(msg, level) {
    switch(level){
      case LogLevels.INFO:
        msg = blue(msg);
        break;
      case LogLevels.WARN:
        msg = yellow(msg);
        break;
      case LogLevels.ERROR:
        msg = red(msg);
        break;
      case LogLevels.CRITICAL:
        msg = bold(red(msg));
        break;
      default:
        break;
    }
    return msg;
  }
  log(msg) {
    console.log(msg);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyNC4wL2xvZy9jb25zb2xlX2hhbmRsZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cbmltcG9ydCB7IHR5cGUgTGV2ZWxOYW1lLCBMb2dMZXZlbHMgfSBmcm9tIFwiLi9sZXZlbHMudHNcIjtcbmltcG9ydCB0eXBlIHsgTG9nUmVjb3JkIH0gZnJvbSBcIi4vbG9nZ2VyLnRzXCI7XG5pbXBvcnQgeyBibHVlLCBib2xkLCByZWQsIHllbGxvdyB9IGZyb20gXCIuLi9mbXQvY29sb3JzLnRzXCI7XG5pbXBvcnQgeyBCYXNlSGFuZGxlciwgdHlwZSBCYXNlSGFuZGxlck9wdGlvbnMgfSBmcm9tIFwiLi9iYXNlX2hhbmRsZXIudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBDb25zb2xlSGFuZGxlck9wdGlvbnMgZXh0ZW5kcyBCYXNlSGFuZGxlck9wdGlvbnMge1xuICB1c2VDb2xvcnM/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIFRoaXMgaXMgdGhlIGRlZmF1bHQgbG9nZ2VyLiBJdCB3aWxsIG91dHB1dCBjb2xvciBjb2RlZCBsb2cgbWVzc2FnZXMgdG8gdGhlXG4gKiBjb25zb2xlIHZpYSBgY29uc29sZS5sb2coKWAuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb25zb2xlSGFuZGxlciBleHRlbmRzIEJhc2VIYW5kbGVyIHtcbiAgI3VzZUNvbG9ycz86IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3IobGV2ZWxOYW1lOiBMZXZlbE5hbWUsIG9wdGlvbnM6IENvbnNvbGVIYW5kbGVyT3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIobGV2ZWxOYW1lLCBvcHRpb25zKTtcbiAgICB0aGlzLiN1c2VDb2xvcnMgPSBvcHRpb25zLnVzZUNvbG9ycyA/PyB0cnVlO1xuICB9XG5cbiAgb3ZlcnJpZGUgZm9ybWF0KGxvZ1JlY29yZDogTG9nUmVjb3JkKTogc3RyaW5nIHtcbiAgICBsZXQgbXNnID0gc3VwZXIuZm9ybWF0KGxvZ1JlY29yZCk7XG5cbiAgICBpZiAodGhpcy4jdXNlQ29sb3JzKSB7XG4gICAgICBtc2cgPSB0aGlzLmFwcGx5Q29sb3JzKG1zZywgbG9nUmVjb3JkLmxldmVsKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbXNnO1xuICB9XG5cbiAgYXBwbHlDb2xvcnMobXNnOiBzdHJpbmcsIGxldmVsOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHN3aXRjaCAobGV2ZWwpIHtcbiAgICAgIGNhc2UgTG9nTGV2ZWxzLklORk86XG4gICAgICAgIG1zZyA9IGJsdWUobXNnKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIExvZ0xldmVscy5XQVJOOlxuICAgICAgICBtc2cgPSB5ZWxsb3cobXNnKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIExvZ0xldmVscy5FUlJPUjpcbiAgICAgICAgbXNnID0gcmVkKG1zZyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBMb2dMZXZlbHMuQ1JJVElDQUw6XG4gICAgICAgIG1zZyA9IGJvbGQocmVkKG1zZykpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiBtc2c7XG4gIH1cblxuICBvdmVycmlkZSBsb2cobXNnOiBzdHJpbmcpIHtcbiAgICBjb25zb2xlLmxvZyhtc2cpO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUNyQyxTQUF5QixTQUFTLFFBQVEsY0FBYztBQUV4RCxTQUFTLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLE1BQU0sUUFBUSxtQkFBbUI7QUFDM0QsU0FBUyxXQUFXLFFBQWlDLG9CQUFvQjtBQU16RTs7O0NBR0MsR0FDRCxPQUFPLE1BQU0sdUJBQXVCO0VBQ2xDLENBQUEsU0FBVSxDQUFXO0VBRXJCLFlBQVksU0FBb0IsRUFBRSxVQUFpQyxDQUFDLENBQUMsQ0FBRTtJQUNyRSxLQUFLLENBQUMsV0FBVztJQUNqQixJQUFJLENBQUMsQ0FBQSxTQUFVLEdBQUcsUUFBUSxTQUFTLElBQUk7RUFDekM7RUFFUyxPQUFPLFNBQW9CLEVBQVU7SUFDNUMsSUFBSSxNQUFNLEtBQUssQ0FBQyxPQUFPO0lBRXZCLElBQUksSUFBSSxDQUFDLENBQUEsU0FBVSxFQUFFO01BQ25CLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLFVBQVUsS0FBSztJQUM3QztJQUVBLE9BQU87RUFDVDtFQUVBLFlBQVksR0FBVyxFQUFFLEtBQWEsRUFBVTtJQUM5QyxPQUFRO01BQ04sS0FBSyxVQUFVLElBQUk7UUFDakIsTUFBTSxLQUFLO1FBQ1g7TUFDRixLQUFLLFVBQVUsSUFBSTtRQUNqQixNQUFNLE9BQU87UUFDYjtNQUNGLEtBQUssVUFBVSxLQUFLO1FBQ2xCLE1BQU0sSUFBSTtRQUNWO01BQ0YsS0FBSyxVQUFVLFFBQVE7UUFDckIsTUFBTSxLQUFLLElBQUk7UUFDZjtNQUNGO1FBQ0U7SUFDSjtJQUVBLE9BQU87RUFDVDtFQUVTLElBQUksR0FBVyxFQUFFO0lBQ3hCLFFBQVEsR0FBRyxDQUFDO0VBQ2Q7QUFDRiJ9
// denoCacheMetadata=18149563399485909586,1762350642914424649