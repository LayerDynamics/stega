import { CommandNotFoundError } from "../error.ts";
export function createBatchCommand(cli) {
  return {
    name: "batch",
    description: "Execute multiple commands in sequence or parallel",
    options: [
      {
        name: "commands",
        alias: "c",
        type: "string",
        description: "Comma-separated list of commands to execute",
        required: true
      },
      {
        name: "parallel",
        alias: "p",
        type: "boolean",
        description: "Execute commands in parallel",
        default: false
      }
    ],
    action: async (args)=>{
      const commandsInput = args.flags.commands;
      const isParallel = args.flags.parallel === true;
      const commandNames = commandsInput.split(",").map((name)=>name.trim()).filter(Boolean);
      if (!commandNames.length) {
        throw new Error("No valid commands provided for batch execution");
      }
      cli.logger.info(`Executing ${commandNames.length} command(s) ${isParallel ? "in parallel" : "sequentially"}`);
      const results = [];
      const executeCommand = async (cmdName)=>{
        const cmd = cli.findCommand(cmdName);
        if (!cmd) {
          const error = new CommandNotFoundError(cmdName);
          cli.logger.error(`Command "${cmdName}" not found.`);
          return {
            command: cmdName,
            success: false,
            error
          };
        }
        const cmdArgs = {
          command: [
            cmdName
          ],
          flags: {},
          cli: cli
        };
        try {
          await Promise.resolve(cmd.action(cmdArgs));
          cli.logger.info(`Command "${cmdName}" executed successfully`);
          return {
            command: cmdName,
            success: true
          };
        } catch (error) {
          const execError = error instanceof Error ? error : new Error(String(error));
          cli.logger.error(`Command "${cmdName}" failed: ${execError.message}`);
          return {
            command: cmdName,
            success: false,
            error: execError
          };
        }
      };
      try {
        if (isParallel) {
          const executions = await Promise.all(commandNames.map((cmdName)=>executeCommand(cmdName)));
          results.push(...executions);
        } else {
          for (const cmdName of commandNames){
            const result = await executeCommand(cmdName);
            results.push(result);
            if (!result.success) break;
          }
        }
        const failedCommands = results.filter((r)=>!r.success);
        if (failedCommands.length > 0) {
          const firstFailure = failedCommands[0];
          if (firstFailure.error instanceof CommandNotFoundError) {
            throw firstFailure.error;
          }
          throw new Error(`Batch execution failed: ${firstFailure.error?.message || "Unknown error"}`);
        }
        cli.logger.info("Batch execution completed successfully");
      } catch (error) {
        if (error instanceof CommandNotFoundError) {
          throw error;
        }
        throw new Error(`Batch execution failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29tbWFuZHMvYmF0Y2hfY29tbWFuZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21tYW5kIH0gZnJvbSBcIi4uL2NvbW1hbmQudHNcIjtcbmltcG9ydCB7IENMSSB9IGZyb20gXCIuLi9jb3JlLnRzXCI7XG5pbXBvcnQgeyBGbGFnVmFsdWUgfSBmcm9tIFwiLi4vZmxhZy50c1wiO1xuaW1wb3J0IHsgQ29tbWFuZE5vdEZvdW5kRXJyb3IgfSBmcm9tIFwiLi4vZXJyb3IudHNcIjtcbmltcG9ydCB0eXBlIHsgQXJncyB9IGZyb20gXCIuLi90eXBlcy50c1wiO1xuXG5pbnRlcmZhY2UgQ29tbWFuZEV4ZWN1dGlvblJlc3VsdCB7XG5cdGNvbW1hbmQ6IHN0cmluZztcblx0c3VjY2VzczogYm9vbGVhbjtcblx0ZXJyb3I/OiBFcnJvcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUJhdGNoQ29tbWFuZChjbGk6IENMSSk6IENvbW1hbmQge1xuXHRyZXR1cm4ge1xuXHRcdG5hbWU6IFwiYmF0Y2hcIixcblx0XHRkZXNjcmlwdGlvbjogXCJFeGVjdXRlIG11bHRpcGxlIGNvbW1hbmRzIGluIHNlcXVlbmNlIG9yIHBhcmFsbGVsXCIsXG5cdFx0b3B0aW9uczogW1xuXHRcdFx0e1xuXHRcdFx0XHRuYW1lOiBcImNvbW1hbmRzXCIsXG5cdFx0XHRcdGFsaWFzOiBcImNcIixcblx0XHRcdFx0dHlwZTogXCJzdHJpbmdcIixcblx0XHRcdFx0ZGVzY3JpcHRpb246IFwiQ29tbWEtc2VwYXJhdGVkIGxpc3Qgb2YgY29tbWFuZHMgdG8gZXhlY3V0ZVwiLFxuXHRcdFx0XHRyZXF1aXJlZDogdHJ1ZSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5hbWU6IFwicGFyYWxsZWxcIixcblx0XHRcdFx0YWxpYXM6IFwicFwiLFxuXHRcdFx0XHR0eXBlOiBcImJvb2xlYW5cIixcblx0XHRcdFx0ZGVzY3JpcHRpb246IFwiRXhlY3V0ZSBjb21tYW5kcyBpbiBwYXJhbGxlbFwiLFxuXHRcdFx0XHRkZWZhdWx0OiBmYWxzZSxcblx0XHRcdH0sXG5cdFx0XSxcblx0XHRhY3Rpb246IGFzeW5jIChhcmdzOiBBcmdzKTogUHJvbWlzZTx2b2lkPiA9PiB7XG5cdFx0XHRjb25zdCBjb21tYW5kc0lucHV0ID0gYXJncy5mbGFncy5jb21tYW5kcyBhcyBzdHJpbmc7XG5cdFx0XHRjb25zdCBpc1BhcmFsbGVsID0gYXJncy5mbGFncy5wYXJhbGxlbCA9PT0gdHJ1ZTtcblx0XHRcdGNvbnN0IGNvbW1hbmROYW1lcyA9IGNvbW1hbmRzSW5wdXRcblx0XHRcdFx0LnNwbGl0KFwiLFwiKVxuXHRcdFx0XHQubWFwKChuYW1lKSA9PiBuYW1lLnRyaW0oKSlcblx0XHRcdFx0LmZpbHRlcihCb29sZWFuKTtcblxuXHRcdFx0aWYgKCFjb21tYW5kTmFtZXMubGVuZ3RoKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIk5vIHZhbGlkIGNvbW1hbmRzIHByb3ZpZGVkIGZvciBiYXRjaCBleGVjdXRpb25cIik7XG5cdFx0XHR9XG5cblx0XHRcdGNsaS5sb2dnZXIuaW5mbyhcblx0XHRcdFx0YEV4ZWN1dGluZyAke2NvbW1hbmROYW1lcy5sZW5ndGh9IGNvbW1hbmQocykgJHtcblx0XHRcdFx0XHRpc1BhcmFsbGVsID8gXCJpbiBwYXJhbGxlbFwiIDogXCJzZXF1ZW50aWFsbHlcIlxuXHRcdFx0XHR9YCxcblx0XHRcdCk7XG5cblx0XHRcdGNvbnN0IHJlc3VsdHM6IENvbW1hbmRFeGVjdXRpb25SZXN1bHRbXSA9IFtdO1xuXG5cdFx0XHRjb25zdCBleGVjdXRlQ29tbWFuZCA9IGFzeW5jIChcblx0XHRcdFx0Y21kTmFtZTogc3RyaW5nLFxuXHRcdFx0KTogUHJvbWlzZTxDb21tYW5kRXhlY3V0aW9uUmVzdWx0PiA9PiB7XG5cdFx0XHRcdGNvbnN0IGNtZCA9IGNsaS5maW5kQ29tbWFuZChjbWROYW1lKTtcblx0XHRcdFx0aWYgKCFjbWQpIHtcblx0XHRcdFx0XHRjb25zdCBlcnJvciA9IG5ldyBDb21tYW5kTm90Rm91bmRFcnJvcihjbWROYW1lKTtcblx0XHRcdFx0XHRjbGkubG9nZ2VyLmVycm9yKGBDb21tYW5kIFwiJHtjbWROYW1lfVwiIG5vdCBmb3VuZC5gKTtcblx0XHRcdFx0XHRyZXR1cm4geyBjb21tYW5kOiBjbWROYW1lLCBzdWNjZXNzOiBmYWxzZSwgZXJyb3IgfTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGNtZEFyZ3MgPSB7XG5cdFx0XHRcdFx0Y29tbWFuZDogW2NtZE5hbWVdLFxuXHRcdFx0XHRcdGZsYWdzOiB7fSxcblx0XHRcdFx0XHRjbGk6IGNsaSxcblx0XHRcdFx0fTtcblxuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGF3YWl0IFByb21pc2UucmVzb2x2ZShjbWQuYWN0aW9uKGNtZEFyZ3MpKTtcblx0XHRcdFx0XHRjbGkubG9nZ2VyLmluZm8oYENvbW1hbmQgXCIke2NtZE5hbWV9XCIgZXhlY3V0ZWQgc3VjY2Vzc2Z1bGx5YCk7XG5cdFx0XHRcdFx0cmV0dXJuIHsgY29tbWFuZDogY21kTmFtZSwgc3VjY2VzczogdHJ1ZSB9O1xuXHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdGNvbnN0IGV4ZWNFcnJvciA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3Jcblx0XHRcdFx0XHRcdD8gZXJyb3Jcblx0XHRcdFx0XHRcdDogbmV3IEVycm9yKFN0cmluZyhlcnJvcikpO1xuXHRcdFx0XHRcdGNsaS5sb2dnZXIuZXJyb3IoYENvbW1hbmQgXCIke2NtZE5hbWV9XCIgZmFpbGVkOiAke2V4ZWNFcnJvci5tZXNzYWdlfWApO1xuXHRcdFx0XHRcdHJldHVybiB7IGNvbW1hbmQ6IGNtZE5hbWUsIHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXhlY0Vycm9yIH07XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGlmIChpc1BhcmFsbGVsKSB7XG5cdFx0XHRcdFx0Y29uc3QgZXhlY3V0aW9ucyA9IGF3YWl0IFByb21pc2UuYWxsKFxuXHRcdFx0XHRcdFx0Y29tbWFuZE5hbWVzLm1hcCgoY21kTmFtZSkgPT4gZXhlY3V0ZUNvbW1hbmQoY21kTmFtZSkpLFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0cmVzdWx0cy5wdXNoKC4uLmV4ZWN1dGlvbnMpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGZvciAoY29uc3QgY21kTmFtZSBvZiBjb21tYW5kTmFtZXMpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4ZWN1dGVDb21tYW5kKGNtZE5hbWUpO1xuXHRcdFx0XHRcdFx0cmVzdWx0cy5wdXNoKHJlc3VsdCk7XG5cdFx0XHRcdFx0XHRpZiAoIXJlc3VsdC5zdWNjZXNzKSBicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBmYWlsZWRDb21tYW5kcyA9IHJlc3VsdHMuZmlsdGVyKChyKSA9PiAhci5zdWNjZXNzKTtcblx0XHRcdFx0aWYgKGZhaWxlZENvbW1hbmRzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRjb25zdCBmaXJzdEZhaWx1cmUgPSBmYWlsZWRDb21tYW5kc1swXTtcblx0XHRcdFx0XHRpZiAoZmlyc3RGYWlsdXJlLmVycm9yIGluc3RhbmNlb2YgQ29tbWFuZE5vdEZvdW5kRXJyb3IpIHtcblx0XHRcdFx0XHRcdHRocm93IGZpcnN0RmFpbHVyZS5lcnJvcjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHRcdFx0YEJhdGNoIGV4ZWN1dGlvbiBmYWlsZWQ6ICR7XG5cdFx0XHRcdFx0XHRcdGZpcnN0RmFpbHVyZS5lcnJvcj8ubWVzc2FnZSB8fCBcIlVua25vd24gZXJyb3JcIlxuXHRcdFx0XHRcdFx0fWAsXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNsaS5sb2dnZXIuaW5mbyhcIkJhdGNoIGV4ZWN1dGlvbiBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5XCIpO1xuXHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0aWYgKGVycm9yIGluc3RhbmNlb2YgQ29tbWFuZE5vdEZvdW5kRXJyb3IpIHtcblx0XHRcdFx0XHR0aHJvdyBlcnJvcjtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdFx0YEJhdGNoIGV4ZWN1dGlvbiBmYWlsZWQ6ICR7XG5cdFx0XHRcdFx0XHRlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcblx0XHRcdFx0XHR9YCxcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9LFxuXHR9O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBLFNBQVMsb0JBQW9CLFFBQVEsY0FBYztBQVNuRCxPQUFPLFNBQVMsbUJBQW1CLEdBQVE7RUFDMUMsT0FBTztJQUNOLE1BQU07SUFDTixhQUFhO0lBQ2IsU0FBUztNQUNSO1FBQ0MsTUFBTTtRQUNOLE9BQU87UUFDUCxNQUFNO1FBQ04sYUFBYTtRQUNiLFVBQVU7TUFDWDtNQUNBO1FBQ0MsTUFBTTtRQUNOLE9BQU87UUFDUCxNQUFNO1FBQ04sYUFBYTtRQUNiLFNBQVM7TUFDVjtLQUNBO0lBQ0QsUUFBUSxPQUFPO01BQ2QsTUFBTSxnQkFBZ0IsS0FBSyxLQUFLLENBQUMsUUFBUTtNQUN6QyxNQUFNLGFBQWEsS0FBSyxLQUFLLENBQUMsUUFBUSxLQUFLO01BQzNDLE1BQU0sZUFBZSxjQUNuQixLQUFLLENBQUMsS0FDTixHQUFHLENBQUMsQ0FBQyxPQUFTLEtBQUssSUFBSSxJQUN2QixNQUFNLENBQUM7TUFFVCxJQUFJLENBQUMsYUFBYSxNQUFNLEVBQUU7UUFDekIsTUFBTSxJQUFJLE1BQU07TUFDakI7TUFFQSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQ2QsQ0FBQyxVQUFVLEVBQUUsYUFBYSxNQUFNLENBQUMsWUFBWSxFQUM1QyxhQUFhLGdCQUFnQixlQUM3QixDQUFDO01BR0gsTUFBTSxVQUFvQyxFQUFFO01BRTVDLE1BQU0saUJBQWlCLE9BQ3RCO1FBRUEsTUFBTSxNQUFNLElBQUksV0FBVyxDQUFDO1FBQzVCLElBQUksQ0FBQyxLQUFLO1VBQ1QsTUFBTSxRQUFRLElBQUkscUJBQXFCO1VBQ3ZDLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsRUFBRSxRQUFRLFlBQVksQ0FBQztVQUNsRCxPQUFPO1lBQUUsU0FBUztZQUFTLFNBQVM7WUFBTztVQUFNO1FBQ2xEO1FBRUEsTUFBTSxVQUFVO1VBQ2YsU0FBUztZQUFDO1dBQVE7VUFDbEIsT0FBTyxDQUFDO1VBQ1IsS0FBSztRQUNOO1FBRUEsSUFBSTtVQUNILE1BQU0sUUFBUSxPQUFPLENBQUMsSUFBSSxNQUFNLENBQUM7VUFDakMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxFQUFFLFFBQVEsdUJBQXVCLENBQUM7VUFDNUQsT0FBTztZQUFFLFNBQVM7WUFBUyxTQUFTO1VBQUs7UUFDMUMsRUFBRSxPQUFPLE9BQU87VUFDZixNQUFNLFlBQVksaUJBQWlCLFFBQ2hDLFFBQ0EsSUFBSSxNQUFNLE9BQU87VUFDcEIsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxFQUFFLFFBQVEsVUFBVSxFQUFFLFVBQVUsT0FBTyxDQUFDLENBQUM7VUFDcEUsT0FBTztZQUFFLFNBQVM7WUFBUyxTQUFTO1lBQU8sT0FBTztVQUFVO1FBQzdEO01BQ0Q7TUFFQSxJQUFJO1FBQ0gsSUFBSSxZQUFZO1VBQ2YsTUFBTSxhQUFhLE1BQU0sUUFBUSxHQUFHLENBQ25DLGFBQWEsR0FBRyxDQUFDLENBQUMsVUFBWSxlQUFlO1VBRTlDLFFBQVEsSUFBSSxJQUFJO1FBQ2pCLE9BQU87VUFDTixLQUFLLE1BQU0sV0FBVyxhQUFjO1lBQ25DLE1BQU0sU0FBUyxNQUFNLGVBQWU7WUFDcEMsUUFBUSxJQUFJLENBQUM7WUFDYixJQUFJLENBQUMsT0FBTyxPQUFPLEVBQUU7VUFDdEI7UUFDRDtRQUVBLE1BQU0saUJBQWlCLFFBQVEsTUFBTSxDQUFDLENBQUMsSUFBTSxDQUFDLEVBQUUsT0FBTztRQUN2RCxJQUFJLGVBQWUsTUFBTSxHQUFHLEdBQUc7VUFDOUIsTUFBTSxlQUFlLGNBQWMsQ0FBQyxFQUFFO1VBQ3RDLElBQUksYUFBYSxLQUFLLFlBQVksc0JBQXNCO1lBQ3ZELE1BQU0sYUFBYSxLQUFLO1VBQ3pCO1VBQ0EsTUFBTSxJQUFJLE1BQ1QsQ0FBQyx3QkFBd0IsRUFDeEIsYUFBYSxLQUFLLEVBQUUsV0FBVyxnQkFDL0IsQ0FBQztRQUVKO1FBRUEsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDO01BQ2pCLEVBQUUsT0FBTyxPQUFPO1FBQ2YsSUFBSSxpQkFBaUIsc0JBQXNCO1VBQzFDLE1BQU07UUFDUDtRQUNBLE1BQU0sSUFBSSxNQUNULENBQUMsd0JBQXdCLEVBQ3hCLGlCQUFpQixRQUFRLE1BQU0sT0FBTyxHQUFHLE9BQU8sT0FDaEQsQ0FBQztNQUVKO0lBQ0Q7RUFDRDtBQUNEIn0=
// denoCacheMetadata=17361160179203527229,10973166193192101412