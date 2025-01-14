// src/commands/service_command.ts
import { BaseCommand } from "../types.ts";
import { logger } from "../logger.ts";
export class ServiceCommand extends BaseCommand {
  services = new Map();
  configs = new Map();
  statusMonitors = new Map();
  startTimes = new Map();
  retryCount = new Map();
  cli;
  constructor(cli){
    super({
      name: "service",
      description: "Manage system services",
      category: "service",
      permissions: [
        "run",
        "read",
        "write",
        "net"
      ],
      subcommands: [
        {
          name: "start",
          description: "Start a service",
          options: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "Service name"
            },
            {
              name: "config",
              type: "string",
              description: "Path to service configuration file",
              required: true
            }
          ],
          action: (args)=>this.handleStart(args)
        },
        {
          name: "stop",
          description: "Stop a service",
          options: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "Service name"
            },
            {
              name: "force",
              type: "boolean",
              description: "Force stop the service",
              required: true
            }
          ],
          action: (args)=>this.handleStop(args)
        },
        {
          name: "restart",
          description: "Restart a service",
          options: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "Service name"
            }
          ],
          action: (args)=>this.handleRestart(args)
        },
        {
          name: "status",
          description: "Get service status",
          options: [
            {
              name: "name",
              type: "string",
              description: "Service name (optional)"
            },
            {
              name: "format",
              type: "string",
              description: "Output format (json|table)",
              default: "table"
            }
          ],
          action: (args)=>this.handleStatus(args)
        },
        {
          name: "logs",
          description: "View service logs",
          options: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "Service name"
            },
            {
              name: "lines",
              type: "number",
              description: "Number of lines to show",
              default: 50
            },
            {
              name: "follow",
              type: "boolean",
              description: "Follow log output",
              default: false
            }
          ],
          action: (args)=>this.handleLogs(args)
        }
      ]
    });
    this.cli = cli;
    this.lifecycle = {
      cleanup: async ()=>{
        await this.stopAllServices();
      },
      onError: async (error)=>{
        logger.error(`Service command error: ${error.message}`);
        await this.stopAllServices();
      }
    };
  }
  async loadServiceConfig(path) {
    try {
      const content = await Deno.readTextFile(path);
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load service configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async startProcess(config) {
    const cmd = config.command.split(" ");
    const command = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      cwd: config.workingDirectory,
      env: config.environment,
      stdout: "piped",
      stderr: "piped"
    });
    const process = command.spawn();
    this.startTimes.set(config.name, Date.now());
    this.setupProcessMonitoring(process, config);
    await this.handleProcessOutput(process, config.name);
    return process;
  }
  setupProcessMonitoring(process, config) {
    // Output handling
    this.handleProcessOutput(process, config.name);
    // Health checking
    if (config.healthCheck) {
      const intervalId = setInterval(()=>this.checkServiceHealth(config), config.healthCheck.interval);
      this.statusMonitors.set(config.name, intervalId);
    }
    // Process monitoring
    this.monitorProcess(process, config);
  }
  async handleProcessOutput(process, serviceName) {
    const decoder = new TextDecoder();
    if (process.stdout) {
      for await (const chunk of process.stdout){
        const text = decoder.decode(chunk);
        logger.info(`[${serviceName}] ${text.trim()}`);
      }
    }
    if (process.stderr) {
      for await (const chunk of process.stderr){
        const text = decoder.decode(chunk);
        logger.error(`[${serviceName}] ${text.trim()}`);
      }
    }
  }
  async checkServiceHealth(config) {
    if (!config.healthCheck?.endpoint) return true;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(()=>controller.abort(), config.healthCheck.timeout);
      const response = await fetch(config.healthCheck.endpoint, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      return response.ok;
    } catch  {
      return false;
    }
  }
  async monitorProcess(process, config) {
    try {
      const status = await process.status;
      if (!status.success) {
        logger.error(`Service ${config.name} exited with code ${status.code}`);
        const retries = this.retryCount.get(config.name) || 0;
        if (config.autoRestart && retries < (config.maxRetries || 3)) {
          logger.info(`Attempting to restart service ${config.name}`);
          this.retryCount.set(config.name, retries + 1);
          const newProcess = await this.startProcess(config);
          this.services.set(config.name, newProcess);
        } else {
          logger.error(`Service ${config.name} failed to restart after ${retries} attempts`);
          this.services.delete(config.name);
          this.cleanup(config.name);
        }
      }
    } catch (error) {
      logger.error(`Error monitoring service ${config.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  cleanup(serviceName) {
    const monitorId = this.statusMonitors.get(serviceName);
    if (monitorId) {
      clearInterval(monitorId);
      this.statusMonitors.delete(serviceName);
    }
    this.startTimes.delete(serviceName);
    this.retryCount.delete(serviceName);
  }
  async action(args) {
    const subcommand = args.command[1];
    switch(subcommand){
      case "start":
        await this.handleStart(args);
        break;
      case "stop":
        await this.handleStop(args);
        break;
      case "restart":
        await this.handleRestart(args);
        break;
      case "status":
        await this.handleStatus(args);
        break;
      case "logs":
        await this.handleLogs(args);
        break;
      default:
        throw new Error(`Unknown subcommand: ${subcommand}`);
    }
  }
  async handleStart(args) {
    const name = args.flags.name;
    const configPath = args.flags.config;
    if (this.services.has(name)) {
      throw new Error(`Service ${name} is already running`);
    }
    let config;
    if (configPath) {
      config = await this.loadServiceConfig(configPath);
      this.configs.set(name, config);
    } else {
      const existingConfig = this.configs.get(name);
      if (!existingConfig) {
        throw new Error(`No configuration found for service ${name}`);
      }
      config = existingConfig;
    }
    const process = await this.startProcess(config);
    this.services.set(name, process);
    logger.info(`Service ${name} started successfully`);
  }
  async handleStop(args) {
    const name = args.flags.name;
    const force = args.flags.force;
    const process = this.services.get(name);
    if (!process) {
      throw new Error(`Service ${name} is not running`);
    }
    try {
      if (force) {
        Deno.kill(process.pid, "SIGKILL");
      } else {
        Deno.kill(process.pid, "SIGTERM");
        // Wait for graceful shutdown
        await Promise.race([
          process.status,
          new Promise((resolve)=>setTimeout(resolve, 5000))
        ]);
        if (this.services.has(name)) {
          Deno.kill(process.pid, "SIGKILL");
        }
      }
    } catch (error) {
      throw new Error(`Failed to stop service: ${error instanceof Error ? error.message : String(error)}`);
    }
    this.cleanup(name);
    this.services.delete(name);
    logger.info(`Service ${name} stopped`);
  }
  async handleRestart(args) {
    await this.handleStop({
      ...args,
      flags: {
        ...args.flags,
        force: false
      }
    });
    await this.handleStart(args);
  }
  async handleStatus(args) {
    const name = args.flags.name;
    const format = args.flags.format;
    const getServiceStatus = async (serviceName, process)=>{
      const startTime = this.startTimes.get(serviceName);
      const uptime = startTime ? Date.now() - startTime : 0;
      const health = await this.checkServiceHealth(this.configs.get(serviceName));
      return {
        name: serviceName,
        status: "running",
        pid: process.pid,
        uptime,
        healthStatus: health ? "healthy" : "unhealthy"
      };
    };
    if (name) {
      const process = this.services.get(name);
      if (!process) {
        console.log(`Service ${name} is not running`);
        return;
      }
      const status = await getServiceStatus(name, process);
      this.displayStatus([
        status
      ], format);
    } else {
      const statuses = await Promise.all(Array.from(this.services.entries()).map(([name, process])=>getServiceStatus(name, process)));
      this.displayStatus(statuses, format);
    }
  }
  displayStatus(statuses, format) {
    if (format === "json") {
      console.log(JSON.stringify(statuses, null, 2));
      return;
    }
    // Display as table
    console.log("\nService Status:");
    console.log("==============");
    for (const status of statuses){
      console.log(`\nName: ${status.name}`);
      console.log(`Status: ${status.status}`);
      console.log(`PID: ${status.pid}`);
      console.log(`Uptime: ${Math.floor(status.uptime / 1000)}s`);
      console.log(`Health: ${status.healthStatus}`);
      if (status.lastError) {
        console.log(`Last Error: ${status.lastError}`);
      }
    }
  }
  async handleLogs(args) {
    const name = args.flags.name;
    const lines = args.flags.lines;
    const follow = args.flags.follow;
    const process = this.services.get(name);
    if (!process || !process.stdout) {
      throw new Error(`Service ${name} is not running`);
    }
    const decoder = new TextDecoder();
    const logBuffer = [];
    if (follow) {
      console.log(`Following logs for service ${name}...\n`);
      for await (const chunk of process.stdout){
        const text = decoder.decode(chunk);
        console.log(text);
      }
    } else {
      // Show last N lines
      for await (const chunk of process.stdout){
        const text = decoder.decode(chunk);
        logBuffer.push(...text.split("\n"));
        if (logBuffer.length > lines) {
          logBuffer.splice(0, logBuffer.length - lines);
        }
      }
      console.log(logBuffer.join("\n"));
    }
  }
  async stopAllServices() {
    for (const [name] of this.services){
      await this.handleStop({
        command: [
          "service",
          "stop"
        ],
        flags: {
          name,
          force: true
        },
        cli: this.cli
      });
    }
  }
}
export function createServiceCommand(cli) {
  return new ServiceCommand(cli);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29tbWFuZHMvc2VydmljZV9jb21tYW5kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHNyYy9jb21tYW5kcy9zZXJ2aWNlX2NvbW1hbmQudHNcblxuaW1wb3J0IHsgQmFzZUNvbW1hbmQgfSBmcm9tIFwiLi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IEFyZ3MsIENvbW1hbmQgfSBmcm9tIFwiLi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gXCIuLi9sb2dnZXIudHNcIjtcbmltcG9ydCB7IENMSSB9IGZyb20gXCIuLi9jb3JlLnRzXCI7XG5cbmludGVyZmFjZSBTZXJ2aWNlQ29uZmlnIHtcblx0bmFtZTogc3RyaW5nO1xuXHRjb21tYW5kOiBzdHJpbmc7XG5cdHdvcmtpbmdEaXJlY3Rvcnk/OiBzdHJpbmc7XG5cdGVudmlyb25tZW50PzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblx0YXV0b1Jlc3RhcnQ/OiBib29sZWFuO1xuXHRtYXhSZXRyaWVzPzogbnVtYmVyO1xuXHRoZWFsdGhDaGVjaz86IHtcblx0XHRlbmRwb2ludD86IHN0cmluZztcblx0XHRpbnRlcnZhbDogbnVtYmVyO1xuXHRcdHRpbWVvdXQ6IG51bWJlcjtcblx0fTtcbn1cblxuaW50ZXJmYWNlIFNlcnZpY2VTdGF0dXMge1xuXHRuYW1lOiBzdHJpbmc7XG5cdHN0YXR1czogXCJydW5uaW5nXCIgfCBcInN0b3BwZWRcIiB8IFwiZXJyb3JcIjtcblx0cGlkPzogbnVtYmVyO1xuXHR1cHRpbWU/OiBudW1iZXI7XG5cdG1lbW9yeT86IG51bWJlcjtcblx0Y3B1PzogbnVtYmVyO1xuXHRsYXN0RXJyb3I/OiBzdHJpbmc7XG5cdGhlYWx0aFN0YXR1cz86IFwiaGVhbHRoeVwiIHwgXCJ1bmhlYWx0aHlcIjtcbn1cblxuZXhwb3J0IGNsYXNzIFNlcnZpY2VDb21tYW5kIGV4dGVuZHMgQmFzZUNvbW1hbmQge1xuXHRwcml2YXRlIHNlcnZpY2VzOiBNYXA8c3RyaW5nLCBEZW5vLkNoaWxkUHJvY2Vzcz4gPSBuZXcgTWFwKCk7XG5cdHByaXZhdGUgY29uZmlnczogTWFwPHN0cmluZywgU2VydmljZUNvbmZpZz4gPSBuZXcgTWFwKCk7XG5cdHByaXZhdGUgc3RhdHVzTW9uaXRvcnM6IE1hcDxzdHJpbmcsIG51bWJlcj4gPSBuZXcgTWFwKCk7XG5cdHByaXZhdGUgc3RhcnRUaW1lczogTWFwPHN0cmluZywgbnVtYmVyPiA9IG5ldyBNYXAoKTtcblx0cHJpdmF0ZSByZXRyeUNvdW50OiBNYXA8c3RyaW5nLCBudW1iZXI+ID0gbmV3IE1hcCgpO1xuXHRwcml2YXRlIGNsaTogQ0xJO1xuXG5cdGNvbnN0cnVjdG9yKGNsaTogQ0xJKSB7XG5cdFx0c3VwZXIoe1xuXHRcdFx0bmFtZTogXCJzZXJ2aWNlXCIsXG5cdFx0XHRkZXNjcmlwdGlvbjogXCJNYW5hZ2Ugc3lzdGVtIHNlcnZpY2VzXCIsXG5cdFx0XHRjYXRlZ29yeTogXCJzZXJ2aWNlXCIsXG5cdFx0XHRwZXJtaXNzaW9uczogW1wicnVuXCIsIFwicmVhZFwiLCBcIndyaXRlXCIsIFwibmV0XCJdLFxuXHRcdFx0c3ViY29tbWFuZHM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG5hbWU6IFwic3RhcnRcIixcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJTdGFydCBhIHNlcnZpY2VcIixcblx0XHRcdFx0XHRvcHRpb25zOiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdG5hbWU6IFwibmFtZVwiLFxuXHRcdFx0XHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0XHRcdFx0XHRyZXF1aXJlZDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0ZGVzY3JpcHRpb246IFwiU2VydmljZSBuYW1lXCIsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRuYW1lOiBcImNvbmZpZ1wiLFxuXHRcdFx0XHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJQYXRoIHRvIHNlcnZpY2UgY29uZmlndXJhdGlvbiBmaWxlXCIsXG5cdFx0XHRcdFx0XHRcdHJlcXVpcmVkOiB0cnVlLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdGFjdGlvbjogKGFyZ3M6IEFyZ3MpID0+IHRoaXMuaGFuZGxlU3RhcnQoYXJncyksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRuYW1lOiBcInN0b3BcIixcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJTdG9wIGEgc2VydmljZVwiLFxuXHRcdFx0XHRcdG9wdGlvbnM6IFtcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bmFtZTogXCJuYW1lXCIsXG5cdFx0XHRcdFx0XHRcdHR5cGU6IFwic3RyaW5nXCIsXG5cdFx0XHRcdFx0XHRcdHJlcXVpcmVkOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJTZXJ2aWNlIG5hbWVcIixcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdG5hbWU6IFwiZm9yY2VcIixcblx0XHRcdFx0XHRcdFx0dHlwZTogXCJib29sZWFuXCIsXG5cdFx0XHRcdFx0XHRcdGRlc2NyaXB0aW9uOiBcIkZvcmNlIHN0b3AgdGhlIHNlcnZpY2VcIixcblx0XHRcdFx0XHRcdFx0cmVxdWlyZWQ6IHRydWUsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0YWN0aW9uOiAoYXJnczogQXJncykgPT4gdGhpcy5oYW5kbGVTdG9wKGFyZ3MpLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bmFtZTogXCJyZXN0YXJ0XCIsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IFwiUmVzdGFydCBhIHNlcnZpY2VcIixcblx0XHRcdFx0XHRvcHRpb25zOiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdG5hbWU6IFwibmFtZVwiLFxuXHRcdFx0XHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0XHRcdFx0XHRyZXF1aXJlZDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0ZGVzY3JpcHRpb246IFwiU2VydmljZSBuYW1lXCIsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0YWN0aW9uOiAoYXJnczogQXJncykgPT4gdGhpcy5oYW5kbGVSZXN0YXJ0KGFyZ3MpLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bmFtZTogXCJzdGF0dXNcIixcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJHZXQgc2VydmljZSBzdGF0dXNcIixcblx0XHRcdFx0XHRvcHRpb25zOiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdG5hbWU6IFwibmFtZVwiLFxuXHRcdFx0XHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJTZXJ2aWNlIG5hbWUgKG9wdGlvbmFsKVwiLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bmFtZTogXCJmb3JtYXRcIixcblx0XHRcdFx0XHRcdFx0dHlwZTogXCJzdHJpbmdcIixcblx0XHRcdFx0XHRcdFx0ZGVzY3JpcHRpb246IFwiT3V0cHV0IGZvcm1hdCAoanNvbnx0YWJsZSlcIixcblx0XHRcdFx0XHRcdFx0ZGVmYXVsdDogXCJ0YWJsZVwiLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdGFjdGlvbjogKGFyZ3M6IEFyZ3MpID0+IHRoaXMuaGFuZGxlU3RhdHVzKGFyZ3MpLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bmFtZTogXCJsb2dzXCIsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IFwiVmlldyBzZXJ2aWNlIGxvZ3NcIixcblx0XHRcdFx0XHRvcHRpb25zOiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdG5hbWU6IFwibmFtZVwiLFxuXHRcdFx0XHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0XHRcdFx0XHRyZXF1aXJlZDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0ZGVzY3JpcHRpb246IFwiU2VydmljZSBuYW1lXCIsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRuYW1lOiBcImxpbmVzXCIsXG5cdFx0XHRcdFx0XHRcdHR5cGU6IFwibnVtYmVyXCIsXG5cdFx0XHRcdFx0XHRcdGRlc2NyaXB0aW9uOiBcIk51bWJlciBvZiBsaW5lcyB0byBzaG93XCIsXG5cdFx0XHRcdFx0XHRcdGRlZmF1bHQ6IDUwLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bmFtZTogXCJmb2xsb3dcIixcblx0XHRcdFx0XHRcdFx0dHlwZTogXCJib29sZWFuXCIsXG5cdFx0XHRcdFx0XHRcdGRlc2NyaXB0aW9uOiBcIkZvbGxvdyBsb2cgb3V0cHV0XCIsXG5cdFx0XHRcdFx0XHRcdGRlZmF1bHQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdGFjdGlvbjogKGFyZ3M6IEFyZ3MpID0+IHRoaXMuaGFuZGxlTG9ncyhhcmdzKSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fSk7XG5cdFx0dGhpcy5jbGkgPSBjbGk7XG5cblx0XHR0aGlzLmxpZmVjeWNsZSA9IHtcblx0XHRcdGNsZWFudXA6IGFzeW5jICgpID0+IHtcblx0XHRcdFx0YXdhaXQgdGhpcy5zdG9wQWxsU2VydmljZXMoKTtcblx0XHRcdH0sXG5cdFx0XHRvbkVycm9yOiBhc3luYyAoZXJyb3I6IEVycm9yKSA9PiB7XG5cdFx0XHRcdGxvZ2dlci5lcnJvcihgU2VydmljZSBjb21tYW5kIGVycm9yOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG5cdFx0XHRcdGF3YWl0IHRoaXMuc3RvcEFsbFNlcnZpY2VzKCk7XG5cdFx0XHR9LFxuXHRcdH07XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGxvYWRTZXJ2aWNlQ29uZmlnKHBhdGg6IHN0cmluZyk6IFByb21pc2U8U2VydmljZUNvbmZpZz4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBjb250ZW50ID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUocGF0aCk7XG5cdFx0XHRyZXR1cm4gSlNPTi5wYXJzZShjb250ZW50KTtcblx0XHR9IGNhdGNoIChlcnJvcjogdW5rbm93bikge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHRgRmFpbGVkIHRvIGxvYWQgc2VydmljZSBjb25maWd1cmF0aW9uOiAke1xuXHRcdFx0XHRcdGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuXHRcdFx0XHR9YCxcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzdGFydFByb2Nlc3MoXG5cdFx0Y29uZmlnOiBTZXJ2aWNlQ29uZmlnLFxuXHQpOiBQcm9taXNlPERlbm8uQ2hpbGRQcm9jZXNzPiB7XG5cdFx0Y29uc3QgY21kID0gY29uZmlnLmNvbW1hbmQuc3BsaXQoXCIgXCIpO1xuXHRcdGNvbnN0IGNvbW1hbmQgPSBuZXcgRGVuby5Db21tYW5kKGNtZFswXSwge1xuXHRcdFx0YXJnczogY21kLnNsaWNlKDEpLFxuXHRcdFx0Y3dkOiBjb25maWcud29ya2luZ0RpcmVjdG9yeSxcblx0XHRcdGVudjogY29uZmlnLmVudmlyb25tZW50LFxuXHRcdFx0c3Rkb3V0OiBcInBpcGVkXCIsXG5cdFx0XHRzdGRlcnI6IFwicGlwZWRcIixcblx0XHR9KTtcblxuXHRcdGNvbnN0IHByb2Nlc3MgPSBjb21tYW5kLnNwYXduKCk7XG5cdFx0dGhpcy5zdGFydFRpbWVzLnNldChjb25maWcubmFtZSwgRGF0ZS5ub3coKSk7XG5cdFx0dGhpcy5zZXR1cFByb2Nlc3NNb25pdG9yaW5nKHByb2Nlc3MsIGNvbmZpZyk7XG5cdFx0YXdhaXQgdGhpcy5oYW5kbGVQcm9jZXNzT3V0cHV0KHByb2Nlc3MsIGNvbmZpZy5uYW1lKTtcblxuXHRcdHJldHVybiBwcm9jZXNzO1xuXHR9XG5cblx0cHJpdmF0ZSBzZXR1cFByb2Nlc3NNb25pdG9yaW5nKFxuXHRcdHByb2Nlc3M6IERlbm8uQ2hpbGRQcm9jZXNzLFxuXHRcdGNvbmZpZzogU2VydmljZUNvbmZpZyxcblx0KTogdm9pZCB7XG5cdFx0Ly8gT3V0cHV0IGhhbmRsaW5nXG5cdFx0dGhpcy5oYW5kbGVQcm9jZXNzT3V0cHV0KHByb2Nlc3MsIGNvbmZpZy5uYW1lKTtcblxuXHRcdC8vIEhlYWx0aCBjaGVja2luZ1xuXHRcdGlmIChjb25maWcuaGVhbHRoQ2hlY2spIHtcblx0XHRcdGNvbnN0IGludGVydmFsSWQgPSBzZXRJbnRlcnZhbChcblx0XHRcdFx0KCkgPT4gdGhpcy5jaGVja1NlcnZpY2VIZWFsdGgoY29uZmlnKSxcblx0XHRcdFx0Y29uZmlnLmhlYWx0aENoZWNrLmludGVydmFsLFxuXHRcdFx0KTtcblx0XHRcdHRoaXMuc3RhdHVzTW9uaXRvcnMuc2V0KGNvbmZpZy5uYW1lLCBpbnRlcnZhbElkKTtcblx0XHR9XG5cblx0XHQvLyBQcm9jZXNzIG1vbml0b3Jpbmdcblx0XHR0aGlzLm1vbml0b3JQcm9jZXNzKHByb2Nlc3MsIGNvbmZpZyk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGhhbmRsZVByb2Nlc3NPdXRwdXQoXG5cdFx0cHJvY2VzczogRGVuby5DaGlsZFByb2Nlc3MsXG5cdFx0c2VydmljZU5hbWU6IHN0cmluZyxcblx0KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpO1xuXHRcdGlmIChwcm9jZXNzLnN0ZG91dCkge1xuXHRcdFx0Zm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiBwcm9jZXNzLnN0ZG91dCkge1xuXHRcdFx0XHRjb25zdCB0ZXh0ID0gZGVjb2Rlci5kZWNvZGUoY2h1bmspO1xuXHRcdFx0XHRsb2dnZXIuaW5mbyhgWyR7c2VydmljZU5hbWV9XSAke3RleHQudHJpbSgpfWApO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAocHJvY2Vzcy5zdGRlcnIpIHtcblx0XHRcdGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2YgcHJvY2Vzcy5zdGRlcnIpIHtcblx0XHRcdFx0Y29uc3QgdGV4dCA9IGRlY29kZXIuZGVjb2RlKGNodW5rKTtcblx0XHRcdFx0bG9nZ2VyLmVycm9yKGBbJHtzZXJ2aWNlTmFtZX1dICR7dGV4dC50cmltKCl9YCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBjaGVja1NlcnZpY2VIZWFsdGgoY29uZmlnOiBTZXJ2aWNlQ29uZmlnKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0aWYgKCFjb25maWcuaGVhbHRoQ2hlY2s/LmVuZHBvaW50KSByZXR1cm4gdHJ1ZTtcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuXHRcdFx0Y29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoXG5cdFx0XHRcdCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSxcblx0XHRcdFx0Y29uZmlnLmhlYWx0aENoZWNrLnRpbWVvdXQsXG5cdFx0XHQpO1xuXG5cdFx0XHRjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGNvbmZpZy5oZWFsdGhDaGVjay5lbmRwb2ludCwge1xuXHRcdFx0XHRzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuXHRcdFx0fSk7XG5cblx0XHRcdGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblx0XHRcdHJldHVybiByZXNwb25zZS5vaztcblx0XHR9IGNhdGNoIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIG1vbml0b3JQcm9jZXNzKFxuXHRcdHByb2Nlc3M6IERlbm8uQ2hpbGRQcm9jZXNzLFxuXHRcdGNvbmZpZzogU2VydmljZUNvbmZpZyxcblx0KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHN0YXR1cyA9IGF3YWl0IHByb2Nlc3Muc3RhdHVzO1xuXG5cdFx0XHRpZiAoIXN0YXR1cy5zdWNjZXNzKSB7XG5cdFx0XHRcdGxvZ2dlci5lcnJvcihgU2VydmljZSAke2NvbmZpZy5uYW1lfSBleGl0ZWQgd2l0aCBjb2RlICR7c3RhdHVzLmNvZGV9YCk7XG5cdFx0XHRcdGNvbnN0IHJldHJpZXMgPSB0aGlzLnJldHJ5Q291bnQuZ2V0KGNvbmZpZy5uYW1lKSB8fCAwO1xuXG5cdFx0XHRcdGlmIChjb25maWcuYXV0b1Jlc3RhcnQgJiYgcmV0cmllcyA8IChjb25maWcubWF4UmV0cmllcyB8fCAzKSkge1xuXHRcdFx0XHRcdGxvZ2dlci5pbmZvKGBBdHRlbXB0aW5nIHRvIHJlc3RhcnQgc2VydmljZSAke2NvbmZpZy5uYW1lfWApO1xuXHRcdFx0XHRcdHRoaXMucmV0cnlDb3VudC5zZXQoY29uZmlnLm5hbWUsIHJldHJpZXMgKyAxKTtcblx0XHRcdFx0XHRjb25zdCBuZXdQcm9jZXNzID0gYXdhaXQgdGhpcy5zdGFydFByb2Nlc3MoY29uZmlnKTtcblx0XHRcdFx0XHR0aGlzLnNlcnZpY2VzLnNldChjb25maWcubmFtZSwgbmV3UHJvY2Vzcyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0bG9nZ2VyLmVycm9yKFxuXHRcdFx0XHRcdFx0YFNlcnZpY2UgJHtjb25maWcubmFtZX0gZmFpbGVkIHRvIHJlc3RhcnQgYWZ0ZXIgJHtyZXRyaWVzfSBhdHRlbXB0c2AsXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR0aGlzLnNlcnZpY2VzLmRlbGV0ZShjb25maWcubmFtZSk7XG5cdFx0XHRcdFx0dGhpcy5jbGVhbnVwKGNvbmZpZy5uYW1lKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRsb2dnZXIuZXJyb3IoXG5cdFx0XHRcdGBFcnJvciBtb25pdG9yaW5nIHNlcnZpY2UgJHtjb25maWcubmFtZX06ICR7XG5cdFx0XHRcdFx0ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG5cdFx0XHRcdH1gLFxuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGNsZWFudXAoc2VydmljZU5hbWU6IHN0cmluZyk6IHZvaWQge1xuXHRcdGNvbnN0IG1vbml0b3JJZCA9IHRoaXMuc3RhdHVzTW9uaXRvcnMuZ2V0KHNlcnZpY2VOYW1lKTtcblx0XHRpZiAobW9uaXRvcklkKSB7XG5cdFx0XHRjbGVhckludGVydmFsKG1vbml0b3JJZCk7XG5cdFx0XHR0aGlzLnN0YXR1c01vbml0b3JzLmRlbGV0ZShzZXJ2aWNlTmFtZSk7XG5cdFx0fVxuXHRcdHRoaXMuc3RhcnRUaW1lcy5kZWxldGUoc2VydmljZU5hbWUpO1xuXHRcdHRoaXMucmV0cnlDb3VudC5kZWxldGUoc2VydmljZU5hbWUpO1xuXHR9XG5cblx0YXN5bmMgYWN0aW9uKGFyZ3M6IEFyZ3MpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBzdWJjb21tYW5kID0gYXJncy5jb21tYW5kWzFdO1xuXG5cdFx0c3dpdGNoIChzdWJjb21tYW5kKSB7XG5cdFx0XHRjYXNlIFwic3RhcnRcIjpcblx0XHRcdFx0YXdhaXQgdGhpcy5oYW5kbGVTdGFydChhcmdzKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFwic3RvcFwiOlxuXHRcdFx0XHRhd2FpdCB0aGlzLmhhbmRsZVN0b3AoYXJncyk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcInJlc3RhcnRcIjpcblx0XHRcdFx0YXdhaXQgdGhpcy5oYW5kbGVSZXN0YXJ0KGFyZ3MpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgXCJzdGF0dXNcIjpcblx0XHRcdFx0YXdhaXQgdGhpcy5oYW5kbGVTdGF0dXMoYXJncyk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcImxvZ3NcIjpcblx0XHRcdFx0YXdhaXQgdGhpcy5oYW5kbGVMb2dzKGFyZ3MpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgVW5rbm93biBzdWJjb21tYW5kOiAke3N1YmNvbW1hbmR9YCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBoYW5kbGVTdGFydChhcmdzOiBBcmdzKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgbmFtZSA9IGFyZ3MuZmxhZ3MubmFtZSBhcyBzdHJpbmc7XG5cdFx0Y29uc3QgY29uZmlnUGF0aCA9IGFyZ3MuZmxhZ3MuY29uZmlnIGFzIHN0cmluZztcblxuXHRcdGlmICh0aGlzLnNlcnZpY2VzLmhhcyhuYW1lKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBTZXJ2aWNlICR7bmFtZX0gaXMgYWxyZWFkeSBydW5uaW5nYCk7XG5cdFx0fVxuXG5cdFx0bGV0IGNvbmZpZzogU2VydmljZUNvbmZpZztcblx0XHRpZiAoY29uZmlnUGF0aCkge1xuXHRcdFx0Y29uZmlnID0gYXdhaXQgdGhpcy5sb2FkU2VydmljZUNvbmZpZyhjb25maWdQYXRoKTtcblx0XHRcdHRoaXMuY29uZmlncy5zZXQobmFtZSwgY29uZmlnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgZXhpc3RpbmdDb25maWcgPSB0aGlzLmNvbmZpZ3MuZ2V0KG5hbWUpO1xuXHRcdFx0aWYgKCFleGlzdGluZ0NvbmZpZykge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE5vIGNvbmZpZ3VyYXRpb24gZm91bmQgZm9yIHNlcnZpY2UgJHtuYW1lfWApO1xuXHRcdFx0fVxuXHRcdFx0Y29uZmlnID0gZXhpc3RpbmdDb25maWc7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcHJvY2VzcyA9IGF3YWl0IHRoaXMuc3RhcnRQcm9jZXNzKGNvbmZpZyk7XG5cdFx0dGhpcy5zZXJ2aWNlcy5zZXQobmFtZSwgcHJvY2Vzcyk7XG5cdFx0bG9nZ2VyLmluZm8oYFNlcnZpY2UgJHtuYW1lfSBzdGFydGVkIHN1Y2Nlc3NmdWxseWApO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBoYW5kbGVTdG9wKGFyZ3M6IEFyZ3MpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBuYW1lID0gYXJncy5mbGFncy5uYW1lIGFzIHN0cmluZztcblx0XHRjb25zdCBmb3JjZSA9IGFyZ3MuZmxhZ3MuZm9yY2UgYXMgYm9vbGVhbjtcblxuXHRcdGNvbnN0IHByb2Nlc3MgPSB0aGlzLnNlcnZpY2VzLmdldChuYW1lKTtcblx0XHRpZiAoIXByb2Nlc3MpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgU2VydmljZSAke25hbWV9IGlzIG5vdCBydW5uaW5nYCk7XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGlmIChmb3JjZSkge1xuXHRcdFx0XHREZW5vLmtpbGwocHJvY2Vzcy5waWQsIFwiU0lHS0lMTFwiKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdERlbm8ua2lsbChwcm9jZXNzLnBpZCwgXCJTSUdURVJNXCIpO1xuXHRcdFx0XHQvLyBXYWl0IGZvciBncmFjZWZ1bCBzaHV0ZG93blxuXHRcdFx0XHRhd2FpdCBQcm9taXNlLnJhY2UoW1xuXHRcdFx0XHRcdHByb2Nlc3Muc3RhdHVzLFxuXHRcdFx0XHRcdG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwMDApKSxcblx0XHRcdFx0XSk7XG5cdFx0XHRcdGlmICh0aGlzLnNlcnZpY2VzLmhhcyhuYW1lKSkge1xuXHRcdFx0XHRcdERlbm8ua2lsbChwcm9jZXNzLnBpZCwgXCJTSUdLSUxMXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZXJyb3I6IHVua25vd24pIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdFx0YEZhaWxlZCB0byBzdG9wIHNlcnZpY2U6ICR7XG5cdFx0XHRcdFx0ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpXG5cdFx0XHRcdH1gLFxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHR0aGlzLmNsZWFudXAobmFtZSk7XG5cdFx0dGhpcy5zZXJ2aWNlcy5kZWxldGUobmFtZSk7XG5cdFx0bG9nZ2VyLmluZm8oYFNlcnZpY2UgJHtuYW1lfSBzdG9wcGVkYCk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGhhbmRsZVJlc3RhcnQoYXJnczogQXJncyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGF3YWl0IHRoaXMuaGFuZGxlU3RvcCh7IC4uLmFyZ3MsIGZsYWdzOiB7IC4uLmFyZ3MuZmxhZ3MsIGZvcmNlOiBmYWxzZSB9IH0pO1xuXHRcdGF3YWl0IHRoaXMuaGFuZGxlU3RhcnQoYXJncyk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGhhbmRsZVN0YXR1cyhhcmdzOiBBcmdzKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgbmFtZSA9IGFyZ3MuZmxhZ3MubmFtZSBhcyBzdHJpbmc7XG5cdFx0Y29uc3QgZm9ybWF0ID0gYXJncy5mbGFncy5mb3JtYXQgYXMgc3RyaW5nO1xuXG5cdFx0Y29uc3QgZ2V0U2VydmljZVN0YXR1cyA9IGFzeW5jIChcblx0XHRcdHNlcnZpY2VOYW1lOiBzdHJpbmcsXG5cdFx0XHRwcm9jZXNzOiBEZW5vLkNoaWxkUHJvY2Vzcyxcblx0XHQpOiBQcm9taXNlPFNlcnZpY2VTdGF0dXM+ID0+IHtcblx0XHRcdGNvbnN0IHN0YXJ0VGltZSA9IHRoaXMuc3RhcnRUaW1lcy5nZXQoc2VydmljZU5hbWUpO1xuXHRcdFx0Y29uc3QgdXB0aW1lID0gc3RhcnRUaW1lID8gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSA6IDA7XG5cdFx0XHRjb25zdCBoZWFsdGggPSBhd2FpdCB0aGlzLmNoZWNrU2VydmljZUhlYWx0aChcblx0XHRcdFx0dGhpcy5jb25maWdzLmdldChzZXJ2aWNlTmFtZSkhLFxuXHRcdFx0KTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0bmFtZTogc2VydmljZU5hbWUsXG5cdFx0XHRcdHN0YXR1czogXCJydW5uaW5nXCIsXG5cdFx0XHRcdHBpZDogcHJvY2Vzcy5waWQsXG5cdFx0XHRcdHVwdGltZSxcblx0XHRcdFx0aGVhbHRoU3RhdHVzOiBoZWFsdGggPyBcImhlYWx0aHlcIiA6IFwidW5oZWFsdGh5XCIsXG5cdFx0XHR9O1xuXHRcdH07XG5cblx0XHRpZiAobmFtZSkge1xuXHRcdFx0Y29uc3QgcHJvY2VzcyA9IHRoaXMuc2VydmljZXMuZ2V0KG5hbWUpO1xuXHRcdFx0aWYgKCFwcm9jZXNzKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBTZXJ2aWNlICR7bmFtZX0gaXMgbm90IHJ1bm5pbmdgKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0Y29uc3Qgc3RhdHVzID0gYXdhaXQgZ2V0U2VydmljZVN0YXR1cyhuYW1lLCBwcm9jZXNzKTtcblx0XHRcdHRoaXMuZGlzcGxheVN0YXR1cyhbc3RhdHVzXSwgZm9ybWF0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3Qgc3RhdHVzZXMgPSBhd2FpdCBQcm9taXNlLmFsbChcblx0XHRcdFx0QXJyYXkuZnJvbSh0aGlzLnNlcnZpY2VzLmVudHJpZXMoKSkubWFwKFxuXHRcdFx0XHRcdChbbmFtZSwgcHJvY2Vzc10pID0+IGdldFNlcnZpY2VTdGF0dXMobmFtZSwgcHJvY2VzcyksXG5cdFx0XHRcdCksXG5cdFx0XHQpO1xuXHRcdFx0dGhpcy5kaXNwbGF5U3RhdHVzKHN0YXR1c2VzLCBmb3JtYXQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgZGlzcGxheVN0YXR1cyhzdGF0dXNlczogU2VydmljZVN0YXR1c1tdLCBmb3JtYXQ6IHN0cmluZyk6IHZvaWQge1xuXHRcdGlmIChmb3JtYXQgPT09IFwianNvblwiKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShzdGF0dXNlcywgbnVsbCwgMikpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIERpc3BsYXkgYXMgdGFibGVcblx0XHRjb25zb2xlLmxvZyhcIlxcblNlcnZpY2UgU3RhdHVzOlwiKTtcblx0XHRjb25zb2xlLmxvZyhcIj09PT09PT09PT09PT09XCIpO1xuXHRcdGZvciAoY29uc3Qgc3RhdHVzIG9mIHN0YXR1c2VzKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhgXFxuTmFtZTogJHtzdGF0dXMubmFtZX1gKTtcblx0XHRcdGNvbnNvbGUubG9nKGBTdGF0dXM6ICR7c3RhdHVzLnN0YXR1c31gKTtcblx0XHRcdGNvbnNvbGUubG9nKGBQSUQ6ICR7c3RhdHVzLnBpZH1gKTtcblx0XHRcdGNvbnNvbGUubG9nKGBVcHRpbWU6ICR7TWF0aC5mbG9vcihzdGF0dXMudXB0aW1lISAvIDEwMDApfXNgKTtcblx0XHRcdGNvbnNvbGUubG9nKGBIZWFsdGg6ICR7c3RhdHVzLmhlYWx0aFN0YXR1c31gKTtcblx0XHRcdGlmIChzdGF0dXMubGFzdEVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBMYXN0IEVycm9yOiAke3N0YXR1cy5sYXN0RXJyb3J9YCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBoYW5kbGVMb2dzKGFyZ3M6IEFyZ3MpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBuYW1lID0gYXJncy5mbGFncy5uYW1lIGFzIHN0cmluZztcblx0XHRjb25zdCBsaW5lcyA9IGFyZ3MuZmxhZ3MubGluZXMgYXMgbnVtYmVyO1xuXHRcdGNvbnN0IGZvbGxvdyA9IGFyZ3MuZmxhZ3MuZm9sbG93IGFzIGJvb2xlYW47XG5cblx0XHRjb25zdCBwcm9jZXNzID0gdGhpcy5zZXJ2aWNlcy5nZXQobmFtZSk7XG5cdFx0aWYgKCFwcm9jZXNzIHx8ICFwcm9jZXNzLnN0ZG91dCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBTZXJ2aWNlICR7bmFtZX0gaXMgbm90IHJ1bm5pbmdgKTtcblx0XHR9XG5cblx0XHRjb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG5cdFx0Y29uc3QgbG9nQnVmZmVyOiBzdHJpbmdbXSA9IFtdO1xuXG5cdFx0aWYgKGZvbGxvdykge1xuXHRcdFx0Y29uc29sZS5sb2coYEZvbGxvd2luZyBsb2dzIGZvciBzZXJ2aWNlICR7bmFtZX0uLi5cXG5gKTtcblx0XHRcdGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2YgcHJvY2Vzcy5zdGRvdXQpIHtcblx0XHRcdFx0Y29uc3QgdGV4dCA9IGRlY29kZXIuZGVjb2RlKGNodW5rKTtcblx0XHRcdFx0Y29uc29sZS5sb2codGV4dCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIFNob3cgbGFzdCBOIGxpbmVzXG5cdFx0XHRmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIHByb2Nlc3Muc3Rkb3V0KSB7XG5cdFx0XHRcdGNvbnN0IHRleHQgPSBkZWNvZGVyLmRlY29kZShjaHVuayk7XG5cdFx0XHRcdGxvZ0J1ZmZlci5wdXNoKC4uLnRleHQuc3BsaXQoXCJcXG5cIikpO1xuXHRcdFx0XHRpZiAobG9nQnVmZmVyLmxlbmd0aCA+IGxpbmVzKSB7XG5cdFx0XHRcdFx0bG9nQnVmZmVyLnNwbGljZSgwLCBsb2dCdWZmZXIubGVuZ3RoIC0gbGluZXMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRjb25zb2xlLmxvZyhsb2dCdWZmZXIuam9pbihcIlxcblwiKSk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzdG9wQWxsU2VydmljZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Zm9yIChjb25zdCBbbmFtZV0gb2YgdGhpcy5zZXJ2aWNlcykge1xuXHRcdFx0YXdhaXQgdGhpcy5oYW5kbGVTdG9wKHtcblx0XHRcdFx0Y29tbWFuZDogW1wic2VydmljZVwiLCBcInN0b3BcIl0sXG5cdFx0XHRcdGZsYWdzOiB7IG5hbWUsIGZvcmNlOiB0cnVlIH0sXG5cdFx0XHRcdGNsaTogdGhpcy5jbGksXG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNlcnZpY2VDb21tYW5kKGNsaTogQ0xJKTogQ29tbWFuZCB7XG5cdHJldHVybiBuZXcgU2VydmljZUNvbW1hbmQoY2xp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
// denoCacheMetadata=232988088828122875,15987656522026526447