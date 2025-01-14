// src/commands/build.ts
import { logger } from "../logger.ts";
import { Select } from "https://deno.land/x/cliffy@v0.25.7/prompt/mod.ts";
const supportedTargets = [
  "x86_64-unknown-linux-gnu",
  "x86_64-pc-windows-msvc",
  "x86_64-apple-darwin"
];
const validPermissions = [
  "read",
  "write",
  "net",
  "env",
  "run",
  "ffi",
  "hrtime",
  "plugin",
  "unstable"
];
const targetAliases = {
  linux: "x86_64-unknown-linux-gnu",
  windows: "x86_64-pc-windows-msvc",
  darwin: "x86_64-apple-darwin"
};
async function runPluginHooks(plugins, hookName, buildOptions, success) {
  for (const plugin of plugins){
    try {
      if (hookName === "beforeBuild" && plugin.beforeBuild) {
        const result = await plugin.beforeBuild(buildOptions);
        if (result === false) {
          logger.info(`Build cancelled by plugin: ${plugin.metadata.name}`);
          return false;
        }
      } else if (hookName === "afterBuild" && plugin.afterBuild) {
        await plugin.afterBuild(buildOptions, success ?? false);
      }
    } catch (error) {
      logger.error(`Plugin ${plugin.metadata.name} ${hookName} hook failed: ${error}`);
      if (hookName === "beforeBuild") return false;
    }
  }
  return true;
}
/**
 * Factory function to create the build command with access to the CLI instance.
 * @param cli The CLI instance.
 * @returns A Command object.
 */ export function createBuildCommand(cli) {
  return {
    name: "build",
    description: "Compile the CLI into a standalone binary executable",
    options: [
      {
        name: "output",
        alias: "o",
        type: "string",
        description: "Path for the output binary",
        required: false,
        default: "./stega"
      },
      {
        name: "target",
        alias: "t",
        type: "string",
        description: "Target platform (linux, windows, darwin)",
        required: false
      },
      {
        name: "allow",
        alias: "A",
        type: "array",
        description: "Permissions to embed (read, write, net, etc.)",
        required: false,
        default: []
      },
      {
        name: "entry",
        alias: "e",
        type: "string",
        description: "Entry point file",
        required: false,
        default: "src/main.ts"
      }
    ],
    action: async (args)=>{
      const output = args.flags.output;
      let target = args.flags.target;
      const allowPermissions = args.flags.allow;
      const entry = args.flags.entry;
      if (!output) {
      // If output not provided, prompt the user
      // This requires 'cliffy' or similar for interactive prompts
      // For simplicity, let's set a default
      }
      if (!target) {
        target = await Select.prompt({
          message: "Select target platform:",
          options: [
            {
              name: "Linux",
              value: "linux"
            },
            {
              name: "Windows",
              value: "windows"
            },
            {
              name: "macOS",
              value: "darwin"
            }
          ]
        });
      }
      if (target in targetAliases) {
        target = targetAliases[target];
        logger.info(`Using target: ${target}`);
      }
      if (!supportedTargets.includes(target)) {
        logger.error(`Unsupported target: ${target}`);
        throw new Error(`Unsupported target: ${target}`);
      }
      for (const perm of allowPermissions){
        if (!validPermissions.includes(perm)) {
          logger.warn(`Unrecognized permission: --allow-${perm}`);
        }
      }
      const buildOptions = {
        output,
        target,
        allowPermissions,
        entry
      };
      const plugins = cli.getLoadedPlugins?.() || [];
      try {
        // Execute beforeBuild hooks
        const shouldContinue = await runPluginHooks(plugins, "beforeBuild", buildOptions);
        if (!shouldContinue) {
          throw new Error("Build cancelled by plugin");
        }
        const success = await executeBuild(buildOptions);
        // Execute afterBuild hooks
        await runPluginHooks(plugins, "afterBuild", buildOptions, success);
        if (!success) {
          throw new Error("Build failed");
        }
      } catch (error) {
        logger.error(`Build failed: ${error instanceof Error ? error.message : String(error)}`);
        // Call plugin afterBuild hooks with failure
        await runPluginHooks(plugins, "afterBuild", buildOptions, false);
        throw error;
      }
    }
  };
}
async function executeBuild(options) {
  const commandArgs = [
    "compile",
    ...options.allowPermissions.map((p)=>`--allow-${p}`),
    `--target=${options.target}`,
    `--output=${options.output}`,
    options.entry
  ];
  const commandOptions = {
    args: commandArgs,
    stdout: "inherit",
    stderr: "inherit"
  };
  const command = new Deno.Command("deno", commandOptions);
  const process = command.spawn();
  const status = await process.status;
  if (status.success) {
    logger.info(`Successfully created binary: ${options.output}`);
  } else {
    logger.error("Build failed");
  }
  return status.success;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29tbWFuZHMvYnVpbGQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gc3JjL2NvbW1hbmRzL2J1aWxkLnRzXG5pbXBvcnQgeyBDb21tYW5kIH0gZnJvbSBcIi4uL2NvbW1hbmQudHNcIjtcbmltcG9ydCB7IENMSSB9IGZyb20gXCIuLi9jb3JlLnRzXCI7XG5pbXBvcnQgeyBGbGFnVmFsdWUgfSBmcm9tIFwiLi4vZmxhZy50c1wiO1xuaW1wb3J0IHsgQ29tbWFuZE5vdEZvdW5kRXJyb3IgfSBmcm9tIFwiLi4vZXJyb3IudHNcIjtcbmltcG9ydCB0eXBlIHsgQXJncywgQnVpbGRPcHRpb25zIH0gZnJvbSBcIi4uL3R5cGVzLnRzXCI7IC8vIENvcnJlY3QgaW1wb3J0XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tIFwiLi4vbG9nZ2VyLnRzXCI7XG5pbXBvcnQge1xuXHRJbnB1dCxcblx0U2VsZWN0LFxufSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9jbGlmZnlAdjAuMjUuNy9wcm9tcHQvbW9kLnRzXCI7XG5pbXBvcnQgdHlwZSB7IFBsdWdpbiB9IGZyb20gXCIuLi9wbHVnaW4udHNcIjtcblxuY29uc3Qgc3VwcG9ydGVkVGFyZ2V0cyA9IFtcblx0XCJ4ODZfNjQtdW5rbm93bi1saW51eC1nbnVcIixcblx0XCJ4ODZfNjQtcGMtd2luZG93cy1tc3ZjXCIsXG5cdFwieDg2XzY0LWFwcGxlLWRhcndpblwiLFxuXTtcblxuY29uc3QgdmFsaWRQZXJtaXNzaW9ucyA9IFtcblx0XCJyZWFkXCIsXG5cdFwid3JpdGVcIixcblx0XCJuZXRcIixcblx0XCJlbnZcIixcblx0XCJydW5cIixcblx0XCJmZmlcIixcblx0XCJocnRpbWVcIixcblx0XCJwbHVnaW5cIixcblx0XCJ1bnN0YWJsZVwiLFxuXTtcblxuY29uc3QgdGFyZ2V0QWxpYXNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcblx0bGludXg6IFwieDg2XzY0LXVua25vd24tbGludXgtZ251XCIsXG5cdHdpbmRvd3M6IFwieDg2XzY0LXBjLXdpbmRvd3MtbXN2Y1wiLFxuXHRkYXJ3aW46IFwieDg2XzY0LWFwcGxlLWRhcndpblwiLFxufTtcblxuYXN5bmMgZnVuY3Rpb24gcnVuUGx1Z2luSG9va3MoXG5cdHBsdWdpbnM6IFBsdWdpbltdLFxuXHRob29rTmFtZTogXCJiZWZvcmVCdWlsZFwiIHwgXCJhZnRlckJ1aWxkXCIsXG5cdGJ1aWxkT3B0aW9uczogQnVpbGRPcHRpb25zLFxuXHRzdWNjZXNzPzogYm9vbGVhbixcbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRmb3IgKGNvbnN0IHBsdWdpbiBvZiBwbHVnaW5zKSB7XG5cdFx0dHJ5IHtcblx0XHRcdGlmIChob29rTmFtZSA9PT0gXCJiZWZvcmVCdWlsZFwiICYmIHBsdWdpbi5iZWZvcmVCdWlsZCkge1xuXHRcdFx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCBwbHVnaW4uYmVmb3JlQnVpbGQoYnVpbGRPcHRpb25zKTtcblx0XHRcdFx0aWYgKHJlc3VsdCA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHRsb2dnZXIuaW5mbyhgQnVpbGQgY2FuY2VsbGVkIGJ5IHBsdWdpbjogJHtwbHVnaW4ubWV0YWRhdGEubmFtZX1gKTtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoaG9va05hbWUgPT09IFwiYWZ0ZXJCdWlsZFwiICYmIHBsdWdpbi5hZnRlckJ1aWxkKSB7XG5cdFx0XHRcdGF3YWl0IHBsdWdpbi5hZnRlckJ1aWxkKGJ1aWxkT3B0aW9ucywgc3VjY2VzcyA/PyBmYWxzZSk7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGxvZ2dlci5lcnJvcihcblx0XHRcdFx0YFBsdWdpbiAke3BsdWdpbi5tZXRhZGF0YS5uYW1lfSAke2hvb2tOYW1lfSBob29rIGZhaWxlZDogJHtlcnJvcn1gLFxuXHRcdFx0KTtcblx0XHRcdGlmIChob29rTmFtZSA9PT0gXCJiZWZvcmVCdWlsZFwiKSByZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cdHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIEZhY3RvcnkgZnVuY3Rpb24gdG8gY3JlYXRlIHRoZSBidWlsZCBjb21tYW5kIHdpdGggYWNjZXNzIHRvIHRoZSBDTEkgaW5zdGFuY2UuXG4gKiBAcGFyYW0gY2xpIFRoZSBDTEkgaW5zdGFuY2UuXG4gKiBAcmV0dXJucyBBIENvbW1hbmQgb2JqZWN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQnVpbGRDb21tYW5kKGNsaTogQ0xJKTogQ29tbWFuZCB7XG5cdHJldHVybiB7XG5cdFx0bmFtZTogXCJidWlsZFwiLFxuXHRcdGRlc2NyaXB0aW9uOiBcIkNvbXBpbGUgdGhlIENMSSBpbnRvIGEgc3RhbmRhbG9uZSBiaW5hcnkgZXhlY3V0YWJsZVwiLFxuXHRcdG9wdGlvbnM6IFtcblx0XHRcdHtcblx0XHRcdFx0bmFtZTogXCJvdXRwdXRcIixcblx0XHRcdFx0YWxpYXM6IFwib1wiLFxuXHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjogXCJQYXRoIGZvciB0aGUgb3V0cHV0IGJpbmFyeVwiLFxuXHRcdFx0XHRyZXF1aXJlZDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHQ6IFwiLi9zdGVnYVwiLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZTogXCJ0YXJnZXRcIixcblx0XHRcdFx0YWxpYXM6IFwidFwiLFxuXHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjogXCJUYXJnZXQgcGxhdGZvcm0gKGxpbnV4LCB3aW5kb3dzLCBkYXJ3aW4pXCIsXG5cdFx0XHRcdHJlcXVpcmVkOiBmYWxzZSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWU6IFwiYWxsb3dcIixcblx0XHRcdFx0YWxpYXM6IFwiQVwiLFxuXHRcdFx0XHR0eXBlOiBcImFycmF5XCIsXG5cdFx0XHRcdGRlc2NyaXB0aW9uOiBcIlBlcm1pc3Npb25zIHRvIGVtYmVkIChyZWFkLCB3cml0ZSwgbmV0LCBldGMuKVwiLFxuXHRcdFx0XHRyZXF1aXJlZDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHQ6IFtdLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bmFtZTogXCJlbnRyeVwiLFxuXHRcdFx0XHRhbGlhczogXCJlXCIsXG5cdFx0XHRcdHR5cGU6IFwic3RyaW5nXCIsXG5cdFx0XHRcdGRlc2NyaXB0aW9uOiBcIkVudHJ5IHBvaW50IGZpbGVcIixcblx0XHRcdFx0cmVxdWlyZWQ6IGZhbHNlLFxuXHRcdFx0XHRkZWZhdWx0OiBcInNyYy9tYWluLnRzXCIsXG5cdFx0XHR9LFxuXHRcdF0sXG5cdFx0YWN0aW9uOiBhc3luYyAoYXJnczogQXJncyk6IFByb21pc2U8dm9pZD4gPT4ge1xuXHRcdFx0Y29uc3Qgb3V0cHV0ID0gYXJncy5mbGFncy5vdXRwdXQgYXMgc3RyaW5nO1xuXHRcdFx0bGV0IHRhcmdldCA9IGFyZ3MuZmxhZ3MudGFyZ2V0IGFzIHN0cmluZztcblx0XHRcdGNvbnN0IGFsbG93UGVybWlzc2lvbnMgPSBhcmdzLmZsYWdzLmFsbG93IGFzIHN0cmluZ1tdO1xuXHRcdFx0Y29uc3QgZW50cnkgPSBhcmdzLmZsYWdzLmVudHJ5IGFzIHN0cmluZztcblxuXHRcdFx0aWYgKCFvdXRwdXQpIHtcblx0XHRcdFx0Ly8gSWYgb3V0cHV0IG5vdCBwcm92aWRlZCwgcHJvbXB0IHRoZSB1c2VyXG5cdFx0XHRcdC8vIFRoaXMgcmVxdWlyZXMgJ2NsaWZmeScgb3Igc2ltaWxhciBmb3IgaW50ZXJhY3RpdmUgcHJvbXB0c1xuXHRcdFx0XHQvLyBGb3Igc2ltcGxpY2l0eSwgbGV0J3Mgc2V0IGEgZGVmYXVsdFxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXRhcmdldCkge1xuXHRcdFx0XHR0YXJnZXQgPSBhd2FpdCBTZWxlY3QucHJvbXB0KHtcblx0XHRcdFx0XHRtZXNzYWdlOiBcIlNlbGVjdCB0YXJnZXQgcGxhdGZvcm06XCIsXG5cdFx0XHRcdFx0b3B0aW9uczogW1xuXHRcdFx0XHRcdFx0eyBuYW1lOiBcIkxpbnV4XCIsIHZhbHVlOiBcImxpbnV4XCIgfSxcblx0XHRcdFx0XHRcdHsgbmFtZTogXCJXaW5kb3dzXCIsIHZhbHVlOiBcIndpbmRvd3NcIiB9LFxuXHRcdFx0XHRcdFx0eyBuYW1lOiBcIm1hY09TXCIsIHZhbHVlOiBcImRhcndpblwiIH0sXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0YXJnZXQgaW4gdGFyZ2V0QWxpYXNlcykge1xuXHRcdFx0XHR0YXJnZXQgPSB0YXJnZXRBbGlhc2VzW3RhcmdldF07XG5cdFx0XHRcdGxvZ2dlci5pbmZvKGBVc2luZyB0YXJnZXQ6ICR7dGFyZ2V0fWApO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXN1cHBvcnRlZFRhcmdldHMuaW5jbHVkZXModGFyZ2V0KSkge1xuXHRcdFx0XHRsb2dnZXIuZXJyb3IoYFVuc3VwcG9ydGVkIHRhcmdldDogJHt0YXJnZXR9YCk7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgdGFyZ2V0OiAke3RhcmdldH1gKTtcblx0XHRcdH1cblxuXHRcdFx0Zm9yIChjb25zdCBwZXJtIG9mIGFsbG93UGVybWlzc2lvbnMpIHtcblx0XHRcdFx0aWYgKCF2YWxpZFBlcm1pc3Npb25zLmluY2x1ZGVzKHBlcm0pKSB7XG5cdFx0XHRcdFx0bG9nZ2VyLndhcm4oYFVucmVjb2duaXplZCBwZXJtaXNzaW9uOiAtLWFsbG93LSR7cGVybX1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBidWlsZE9wdGlvbnM6IEJ1aWxkT3B0aW9ucyA9IHtcblx0XHRcdFx0b3V0cHV0LFxuXHRcdFx0XHR0YXJnZXQsXG5cdFx0XHRcdGFsbG93UGVybWlzc2lvbnMsXG5cdFx0XHRcdGVudHJ5LFxuXHRcdFx0fTtcblxuXHRcdFx0Y29uc3QgcGx1Z2lucyA9IGNsaS5nZXRMb2FkZWRQbHVnaW5zPy4oKSB8fCBbXTtcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Ly8gRXhlY3V0ZSBiZWZvcmVCdWlsZCBob29rc1xuXHRcdFx0XHRjb25zdCBzaG91bGRDb250aW51ZSA9IGF3YWl0IHJ1blBsdWdpbkhvb2tzKFxuXHRcdFx0XHRcdHBsdWdpbnMsXG5cdFx0XHRcdFx0XCJiZWZvcmVCdWlsZFwiLFxuXHRcdFx0XHRcdGJ1aWxkT3B0aW9ucyxcblx0XHRcdFx0KTtcblx0XHRcdFx0aWYgKCFzaG91bGRDb250aW51ZSkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIkJ1aWxkIGNhbmNlbGxlZCBieSBwbHVnaW5cIik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBzdWNjZXNzID0gYXdhaXQgZXhlY3V0ZUJ1aWxkKGJ1aWxkT3B0aW9ucyk7XG5cblx0XHRcdFx0Ly8gRXhlY3V0ZSBhZnRlckJ1aWxkIGhvb2tzXG5cdFx0XHRcdGF3YWl0IHJ1blBsdWdpbkhvb2tzKHBsdWdpbnMsIFwiYWZ0ZXJCdWlsZFwiLCBidWlsZE9wdGlvbnMsIHN1Y2Nlc3MpO1xuXG5cdFx0XHRcdGlmICghc3VjY2Vzcykge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIkJ1aWxkIGZhaWxlZFwiKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0bG9nZ2VyLmVycm9yKFxuXHRcdFx0XHRcdGBCdWlsZCBmYWlsZWQ6ICR7XG5cdFx0XHRcdFx0XHRlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcblx0XHRcdFx0XHR9YCxcblx0XHRcdFx0KTtcblxuXHRcdFx0XHQvLyBDYWxsIHBsdWdpbiBhZnRlckJ1aWxkIGhvb2tzIHdpdGggZmFpbHVyZVxuXHRcdFx0XHRhd2FpdCBydW5QbHVnaW5Ib29rcyhwbHVnaW5zLCBcImFmdGVyQnVpbGRcIiwgYnVpbGRPcHRpb25zLCBmYWxzZSk7XG5cblx0XHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0XHR9XG5cdFx0fSxcblx0fTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZXhlY3V0ZUJ1aWxkKG9wdGlvbnM6IEJ1aWxkT3B0aW9ucyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRjb25zdCBjb21tYW5kQXJncyA9IFtcblx0XHRcImNvbXBpbGVcIixcblx0XHQuLi5vcHRpb25zLmFsbG93UGVybWlzc2lvbnMubWFwKChwOiBzdHJpbmcpID0+IGAtLWFsbG93LSR7cH1gKSxcblx0XHRgLS10YXJnZXQ9JHtvcHRpb25zLnRhcmdldH1gLFxuXHRcdGAtLW91dHB1dD0ke29wdGlvbnMub3V0cHV0fWAsXG5cdFx0b3B0aW9ucy5lbnRyeSxcblx0XTtcblxuXHRjb25zdCBjb21tYW5kT3B0aW9uczogRGVuby5Db21tYW5kT3B0aW9ucyA9IHtcblx0XHRhcmdzOiBjb21tYW5kQXJncyxcblx0XHRzdGRvdXQ6IFwiaW5oZXJpdFwiLFxuXHRcdHN0ZGVycjogXCJpbmhlcml0XCIsXG5cdH07XG5cblx0Y29uc3QgY29tbWFuZCA9IG5ldyBEZW5vLkNvbW1hbmQoXCJkZW5vXCIsIGNvbW1hbmRPcHRpb25zKTtcblx0Y29uc3QgcHJvY2VzcyA9IGNvbW1hbmQuc3Bhd24oKTtcblx0Y29uc3Qgc3RhdHVzID0gYXdhaXQgcHJvY2Vzcy5zdGF0dXM7XG5cblx0aWYgKHN0YXR1cy5zdWNjZXNzKSB7XG5cdFx0bG9nZ2VyLmluZm8oYFN1Y2Nlc3NmdWxseSBjcmVhdGVkIGJpbmFyeTogJHtvcHRpb25zLm91dHB1dH1gKTtcblx0fSBlbHNlIHtcblx0XHRsb2dnZXIuZXJyb3IoXCJCdWlsZCBmYWlsZWRcIik7XG5cdH1cblxuXHRyZXR1cm4gc3RhdHVzLnN1Y2Nlc3M7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsd0JBQXdCO0FBTXhCLFNBQVMsTUFBTSxRQUFRLGVBQWU7QUFDdEMsU0FFQyxNQUFNLFFBQ0EsbURBQW1EO0FBRzFELE1BQU0sbUJBQW1CO0VBQ3hCO0VBQ0E7RUFDQTtD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
// denoCacheMetadata=4773953418285161748,13831598901908412627