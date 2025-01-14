import { logger } from "../logger.ts";
export const initCommand = {
  name: "init",
  description: "Initialize the application",
  options: [
    {
      name: "log-level",
      alias: "l",
      type: "string",
      description: "Set the logging level (DEBUG, INFO, WARN, ERROR)",
      default: "INFO"
    }
  ],
  action: (_args)=>{
    logger.info("Initialization started.");
  // ... command logic
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29tbWFuZHMvaW5pdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21tYW5kIH0gZnJvbSBcIi4uL2NvcmUudHNcIjtcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gXCIuLi9sb2dnZXIudHNcIjtcblxuZXhwb3J0IGNvbnN0IGluaXRDb21tYW5kOiBDb21tYW5kID0ge1xuXHRuYW1lOiBcImluaXRcIixcblx0ZGVzY3JpcHRpb246IFwiSW5pdGlhbGl6ZSB0aGUgYXBwbGljYXRpb25cIixcblx0b3B0aW9uczogW1xuXHRcdHtcblx0XHRcdG5hbWU6IFwibG9nLWxldmVsXCIsXG5cdFx0XHRhbGlhczogXCJsXCIsXG5cdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0ZGVzY3JpcHRpb246IFwiU2V0IHRoZSBsb2dnaW5nIGxldmVsIChERUJVRywgSU5GTywgV0FSTiwgRVJST1IpXCIsXG5cdFx0XHRkZWZhdWx0OiBcIklORk9cIixcblx0XHR9LFxuXHRdLFxuXHRhY3Rpb246IChfYXJncykgPT4ge1xuXHRcdGxvZ2dlci5pbmZvKFwiSW5pdGlhbGl6YXRpb24gc3RhcnRlZC5cIik7XG5cdFx0Ly8gLi4uIGNvbW1hbmQgbG9naWNcblx0fSxcbn07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBUyxNQUFNLFFBQVEsZUFBZTtBQUV0QyxPQUFPLE1BQU0sY0FBdUI7RUFDbkMsTUFBTTtFQUNOLGFBQWE7RUFDYixTQUFTO0lBQ1I7TUFDQyxNQUFNO01BQ04sT0FBTztNQUNQLE1BQU07TUFDTixhQUFhO01BQ2IsU0FBUztJQUNWO0dBQ0E7RUFDRCxRQUFRLENBQUM7SUFDUixPQUFPLElBQUksQ0FBQztFQUNaLG9CQUFvQjtFQUNyQjtBQUNELEVBQUUifQ==
// denoCacheMetadata=12018847801469286786,8408932787727787470