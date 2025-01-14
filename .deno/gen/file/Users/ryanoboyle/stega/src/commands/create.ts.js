import { promptConfirm, promptString } from "../prompts.ts";
export const createCommand = {
  name: "create",
  description: "Create a new project",
  options: [
    {
      name: "name",
      alias: "n",
      type: "string",
      description: "Project name"
    },
    {
      name: "force",
      alias: "f",
      type: "boolean",
      description: "Force creation"
    },
    {
      name: "output",
      alias: "o",
      type: "string",
      description: "Output format"
    }
  ],
  action: async (args)=>{
    const cli = args.cli;
    let projectName = args.flags.name;
    if (!projectName) {
      projectName = await promptString(cli.t("enter_project_name"));
    }
    const force = args.flags.force;
    if (!force) {
      const confirm = await promptConfirm(cli.t("confirm_create_project", {
        name: projectName
      }));
      if (!confirm) {
        console.log(cli.t("project_creation_cancelled"));
        return;
      }
    }
    // Project creation logic here
    const result = {
      project: projectName,
      status: "created"
    };
    console.log(cli.formatOutput(result));
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29tbWFuZHMvY3JlYXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENMSSwgQ29tbWFuZCB9IGZyb20gXCIuLi9jb3JlLnRzXCI7XG5pbXBvcnQgeyBwcm9tcHRDb25maXJtLCBwcm9tcHRTdHJpbmcgfSBmcm9tIFwiLi4vcHJvbXB0cy50c1wiO1xuXG5leHBvcnQgY29uc3QgY3JlYXRlQ29tbWFuZDogQ29tbWFuZCA9IHtcblx0bmFtZTogXCJjcmVhdGVcIixcblx0ZGVzY3JpcHRpb246IFwiQ3JlYXRlIGEgbmV3IHByb2plY3RcIixcblx0b3B0aW9uczogW1xuXHRcdHsgbmFtZTogXCJuYW1lXCIsIGFsaWFzOiBcIm5cIiwgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUHJvamVjdCBuYW1lXCIgfSxcblx0XHR7XG5cdFx0XHRuYW1lOiBcImZvcmNlXCIsXG5cdFx0XHRhbGlhczogXCJmXCIsXG5cdFx0XHR0eXBlOiBcImJvb2xlYW5cIixcblx0XHRcdGRlc2NyaXB0aW9uOiBcIkZvcmNlIGNyZWF0aW9uXCIsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRuYW1lOiBcIm91dHB1dFwiLFxuXHRcdFx0YWxpYXM6IFwib1wiLFxuXHRcdFx0dHlwZTogXCJzdHJpbmdcIixcblx0XHRcdGRlc2NyaXB0aW9uOiBcIk91dHB1dCBmb3JtYXRcIixcblx0XHR9LFxuXHRdLFxuXHRhY3Rpb246IGFzeW5jIChhcmdzKSA9PiB7XG5cdFx0Y29uc3QgY2xpID0gYXJncy5jbGkgYXMgQ0xJO1xuXHRcdGxldCBwcm9qZWN0TmFtZSA9IGFyZ3MuZmxhZ3MubmFtZSBhcyBzdHJpbmc7XG5cblx0XHRpZiAoIXByb2plY3ROYW1lKSB7XG5cdFx0XHRwcm9qZWN0TmFtZSA9IGF3YWl0IHByb21wdFN0cmluZyhjbGkudChcImVudGVyX3Byb2plY3RfbmFtZVwiKSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZm9yY2UgPSBhcmdzLmZsYWdzLmZvcmNlIGFzIGJvb2xlYW47XG5cblx0XHRpZiAoIWZvcmNlKSB7XG5cdFx0XHRjb25zdCBjb25maXJtID0gYXdhaXQgcHJvbXB0Q29uZmlybShcblx0XHRcdFx0Y2xpLnQoXCJjb25maXJtX2NyZWF0ZV9wcm9qZWN0XCIsIHsgbmFtZTogcHJvamVjdE5hbWUgfSksXG5cdFx0XHQpO1xuXHRcdFx0aWYgKCFjb25maXJtKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGNsaS50KFwicHJvamVjdF9jcmVhdGlvbl9jYW5jZWxsZWRcIikpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gUHJvamVjdCBjcmVhdGlvbiBsb2dpYyBoZXJlXG5cdFx0Y29uc3QgcmVzdWx0ID0geyBwcm9qZWN0OiBwcm9qZWN0TmFtZSwgc3RhdHVzOiBcImNyZWF0ZWRcIiB9O1xuXHRcdGNvbnNvbGUubG9nKGNsaS5mb3JtYXRPdXRwdXQocmVzdWx0KSk7XG5cdH0sXG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLFNBQVMsYUFBYSxFQUFFLFlBQVksUUFBUSxnQkFBZ0I7QUFFNUQsT0FBTyxNQUFNLGdCQUF5QjtFQUNyQyxNQUFNO0VBQ04sYUFBYTtFQUNiLFNBQVM7SUFDUjtNQUFFLE1BQU07TUFBUSxPQUFPO01BQUssTUFBTTtNQUFVLGFBQWE7SUFBZTtJQUN4RTtNQUNDLE1BQU07TUFDTixPQUFPO01BQ1AsTUFBTTtNQUNOLGFBQWE7SUFDZDtJQUNBO01BQ0MsTUFBTTtNQUNOLE9BQU87TUFDUCxNQUFNO01BQ04sYUFBYTtJQUNkO0dBQ0E7RUFDRCxRQUFRLE9BQU87SUFDZCxNQUFNLE1BQU0sS0FBSyxHQUFHO0lBQ3BCLElBQUksY0FBYyxLQUFLLEtBQUssQ0FBQyxJQUFJO0lBRWpDLElBQUksQ0FBQyxhQUFhO01BQ2pCLGNBQWMsTUFBTSxhQUFhLElBQUksQ0FBQyxDQUFDO0lBQ3hDO0lBRUEsTUFBTSxRQUFRLEtBQUssS0FBSyxDQUFDLEtBQUs7SUFFOUIsSUFBSSxDQUFDLE9BQU87TUFDWCxNQUFNLFVBQVUsTUFBTSxjQUNyQixJQUFJLENBQUMsQ0FBQywwQkFBMEI7UUFBRSxNQUFNO01BQVk7TUFFckQsSUFBSSxDQUFDLFNBQVM7UUFDYixRQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQjtNQUNEO0lBQ0Q7SUFFQSw4QkFBOEI7SUFDOUIsTUFBTSxTQUFTO01BQUUsU0FBUztNQUFhLFFBQVE7SUFBVTtJQUN6RCxRQUFRLEdBQUcsQ0FBQyxJQUFJLFlBQVksQ0FBQztFQUM5QjtBQUNELEVBQUUifQ==
// denoCacheMetadata=5092652827609457166,5776566882066882046