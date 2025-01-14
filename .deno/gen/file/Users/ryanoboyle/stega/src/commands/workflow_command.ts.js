// src/commands/workflow_command.ts
import { BaseCommand } from "../types.ts";
import { logger } from "../logger.ts";
export class WorkflowCommand extends BaseCommand {
  workflows = new Map();
  workflowResults = new Map();
  currentWorkflow = null;
  cli;
  constructor(cli){
    super({
      name: "workflow",
      description: "Manage and execute workflows",
      category: "automation",
      permissions: [
        "run",
        "read",
        "write"
      ],
      subcommands: [
        {
          name: "run",
          description: "Run a workflow",
          options: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "Workflow name"
            },
            {
              name: "variables",
              type: "string",
              description: "JSON string of variables",
              required: false
            },
            {
              name: "parallel",
              type: "boolean",
              description: "Run eligible steps in parallel",
              default: false
            }
          ],
          action: (args)=>this.runWorkflow(args)
        },
        {
          name: "list",
          description: "List available workflows",
          action: ()=>this.listWorkflows()
        },
        {
          name: "add",
          description: "Add a new workflow",
          options: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "Workflow name"
            },
            {
              name: "config",
              type: "string",
              required: true,
              description: "Path to workflow configuration file"
            }
          ],
          action: (args)=>this.addWorkflow(args)
        },
        {
          name: "status",
          description: "Show workflow execution status",
          options: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "Workflow name"
            }
          ],
          action: (args)=>this.showWorkflowStatus(args)
        }
      ]
    });
    this.cli = cli;
  }
  async action(args) {
    const subcommand = args.command[1];
    switch(subcommand){
      case "run":
        await this.runWorkflow(args);
        break;
      case "list":
        this.listWorkflows();
        break;
      case "add":
        await this.addWorkflow(args);
        break;
      case "status":
        this.showWorkflowStatus(args);
        break;
      default:
        throw new Error(`Unknown subcommand: ${subcommand}`);
    }
  }
  evaluateCondition(condition, context) {
    const variables = context.variables;
    try {
      // Create a safe evaluation context with variables
      const evalContext = {
        ...variables
      };
      // Using Function constructor to create a sandboxed evaluation
      const evalFunc = new Function(...Object.keys(evalContext), `return ${condition};`);
      return evalFunc(...Object.values(evalContext));
    } catch (error) {
      logger.error(`Error evaluating condition "${condition}": ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  async executeStep(step, workflow, context) {
    if (step.condition && !this.evaluateCondition(step.condition, context)) {
      logger.info(`Skipping step "${step.name}" - condition not met`);
      return true;
    }
    if (step.dependsOn?.length) {
      for (const dep of step.dependsOn){
        if (!context.stepResults.get(dep)) {
          logger.error(`Step "${step.name}" dependency "${dep}" failed or not executed`);
          return false;
        }
      }
    }
    const execute = async ()=>{
      try {
        if (typeof step.command === "string") {
          // Parse command string and execute
          const [cmdName, ...args] = step.command.split(" ");
          const command = this.cli.findCommand(cmdName);
          if (!command) {
            throw new Error(`Command "${cmdName}" not found`);
          }
          await command.action({
            command: [
              cmdName,
              ...args
            ],
            flags: {},
            cli: this.cli
          });
        } else {
          // Execute Command object directly
          await step.command.action({
            command: [
              step.name
            ],
            flags: {},
            cli: this.cli
          });
        }
        return true;
      } catch (error) {
        logger.error(`Step "${step.name}" failed: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    };
    let attempts = 0;
    const maxRetries = step.retries || workflow.maxRetries || 0;
    while(attempts <= maxRetries){
      if (attempts > 0) {
        logger.info(`Retrying step "${step.name}" (attempt ${attempts + 1}/${maxRetries + 1})`);
      }
      const success = await Promise.race([
        execute(),
        step.timeout ? new Promise((resolve)=>{
          setTimeout(()=>{
            logger.error(`Step "${step.name}" timed out after ${step.timeout}ms`);
            resolve(false);
          }, step.timeout);
        }) : Promise.resolve(true)
      ]);
      if (success) {
        return true;
      }
      attempts++;
      if (attempts <= maxRetries) {
        await new Promise((resolve)=>setTimeout(resolve, 1000 * attempts));
      }
    }
    return false;
  }
  async executeWorkflow(workflow, context, parallel) {
    const steps = workflow.steps;
    const stepResults = context.stepResults;
    if (parallel) {
      // Group steps by their dependencies
      const stepGroups = [];
      const processedSteps = new Set();
      while(processedSteps.size < steps.length){
        const eligibleSteps = steps.filter((step)=>{
          if (processedSteps.has(step.name)) return false;
          return !step.dependsOn?.some((dep)=>!processedSteps.has(dep));
        });
        if (eligibleSteps.length === 0 && processedSteps.size < steps.length) {
          throw new Error("Circular dependency detected in workflow");
        }
        stepGroups.push(eligibleSteps);
        eligibleSteps.forEach((step)=>processedSteps.add(step.name));
      }
      // Execute step groups in sequence, but steps within groups in parallel
      for (const group of stepGroups){
        const results = await Promise.all(group.map((step)=>this.executeStep(step, workflow, context)));
        group.forEach((step, index)=>{
          stepResults.set(step.name, results[index]);
        });
        if (results.includes(false) && workflow.onError === "stop") {
          return false;
        }
      }
    } else {
      // Sequential execution
      for (const step of steps){
        const success = await this.executeStep(step, workflow, context);
        stepResults.set(step.name, success);
        if (!success && workflow.onError === "stop") {
          return false;
        }
      }
    }
    return true;
  }
  async runWorkflow(args) {
    const name = args.flags.name;
    const workflow = this.workflows.get(name);
    if (!workflow) {
      throw new Error(`Workflow "${name}" not found`);
    }
    this.currentWorkflow = name;
    const context = {
      variables: {
        ...workflow.variables
      },
      startTime: Date.now(),
      stepResults: new Map(),
      retryCount: 0
    };
    // Parse additional variables if provided
    if (args.flags.variables) {
      try {
        const additionalVars = JSON.parse(args.flags.variables);
        Object.assign(context.variables, additionalVars);
      } catch (error) {
        throw new Error(`Invalid variables JSON: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    const parallel = args.flags.parallel;
    try {
      // Set up environment variables
      const originalEnv = {
        ...Deno.env.toObject()
      };
      if (workflow.environment) {
        for (const [key, value] of Object.entries(workflow.environment)){
          Deno.env.set(key, value);
        }
      }
      logger.info(`Starting workflow "${name}"`);
      const success = await this.executeWorkflow(workflow, context, parallel);
      // Restore original environment
      for (const key of Object.keys(Deno.env.toObject())){
        if (key in originalEnv) {
          Deno.env.set(key, originalEnv[key]);
        } else {
          Deno.env.delete(key);
        }
      }
      this.workflowResults.set(name, context.stepResults);
      if (success) {
        logger.info(`Workflow "${name}" completed successfully`);
      } else {
        throw new Error(`Workflow "${name}" failed`);
      }
    } finally{
      this.currentWorkflow = null;
    }
  }
  async addWorkflow(args) {
    const name = args.flags.name;
    const configPath = args.flags.config;
    if (this.workflows.has(name)) {
      throw new Error(`Workflow "${name}" already exists`);
    }
    try {
      const configContent = await Deno.readTextFile(configPath);
      const workflow = JSON.parse(configContent);
      workflow.name = name;
      // Validate workflow configuration
      if (!Array.isArray(workflow.steps) || workflow.steps.length === 0) {
        throw new Error("Workflow must contain at least one step");
      }
      // Validate step dependencies
      const stepNames = new Set(workflow.steps.map((step)=>step.name));
      for (const step of workflow.steps){
        if (step.dependsOn) {
          for (const dep of step.dependsOn){
            if (!stepNames.has(dep)) {
              throw new Error(`Step "${step.name}" depends on unknown step "${dep}"`);
            }
          }
        }
      }
      this.workflows.set(name, workflow);
      logger.info(`Workflow "${name}" added successfully`);
    } catch (error) {
      throw new Error(`Failed to add workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  listWorkflows() {
    if (this.workflows.size === 0) {
      console.log("No workflows available");
      return;
    }
    console.log("\nAvailable Workflows:");
    console.log("===================");
    for (const [name, workflow] of this.workflows){
      console.log(`\nName: ${name}`);
      if (workflow.description) {
        console.log(`Description: ${workflow.description}`);
      }
      console.log(`Steps: ${workflow.steps.length}`);
      console.log("Steps:");
      workflow.steps.forEach((step)=>{
        console.log(`  - ${step.name}${step.parallel ? " (parallel)" : ""}${step.dependsOn?.length ? ` (depends on: ${step.dependsOn.join(", ")})` : ""}`);
      });
    }
  }
  showWorkflowStatus(args) {
    const name = args.flags.name;
    const results = this.workflowResults.get(name);
    if (!results) {
      console.log(`No execution history for workflow "${name}"`);
      return;
    }
    console.log(`\nWorkflow "${name}" Status:`);
    console.log("=====================");
    for (const [step, success] of results){
      console.log(`${step}: ${success ? "✓ Success" : "✗ Failed"}`);
    }
  }
}
export function createWorkflowCommand(cli) {
  return new WorkflowCommand(cli);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29tbWFuZHMvd29ya2Zsb3dfY29tbWFuZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBzcmMvY29tbWFuZHMvd29ya2Zsb3dfY29tbWFuZC50c1xuaW1wb3J0IHsgQmFzZUNvbW1hbmQgfSBmcm9tIFwiLi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IEFyZ3MsIENvbW1hbmQgfSBmcm9tIFwiLi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gXCIuLi9sb2dnZXIudHNcIjtcbmltcG9ydCB7IENMSSB9IGZyb20gXCIuLi9jb3JlLnRzXCI7XG5cbmludGVyZmFjZSBXb3JrZmxvd1N0ZXAge1xuXHRuYW1lOiBzdHJpbmc7XG5cdGNvbW1hbmQ6IHN0cmluZyB8IHsgYWN0aW9uOiAoYXJnczogQXJncykgPT4gdm9pZCB8IFByb21pc2U8dm9pZD4gfTtcblx0Y29uZGl0aW9uPzogc3RyaW5nO1xuXHRyZXRyaWVzPzogbnVtYmVyO1xuXHR0aW1lb3V0PzogbnVtYmVyO1xuXHRwYXJhbGxlbD86IGJvb2xlYW47XG5cdGRlcGVuZHNPbj86IHN0cmluZ1tdO1xufVxuXG5pbnRlcmZhY2UgV29ya2Zsb3cge1xuXHRuYW1lOiBzdHJpbmc7XG5cdGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuXHRzdGVwczogV29ya2Zsb3dTdGVwW107XG5cdGVudmlyb25tZW50PzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblx0b25FcnJvcj86IFwiY29udGludWVcIiB8IFwic3RvcFwiIHwgXCJyZXRyeVwiO1xuXHRtYXhSZXRyaWVzPzogbnVtYmVyO1xuXHR2YXJpYWJsZXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5pbnRlcmZhY2UgV29ya2Zsb3dFeGVjdXRpb25Db250ZXh0IHtcblx0dmFyaWFibGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuXHRzdGFydFRpbWU6IG51bWJlcjtcblx0c3RlcFJlc3VsdHM6IE1hcDxzdHJpbmcsIGJvb2xlYW4+O1xuXHRyZXRyeUNvdW50OiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBXb3JrZmxvd0NvbW1hbmQgZXh0ZW5kcyBCYXNlQ29tbWFuZCB7XG5cdHByaXZhdGUgd29ya2Zsb3dzOiBNYXA8c3RyaW5nLCBXb3JrZmxvdz4gPSBuZXcgTWFwKCk7XG5cdHByaXZhdGUgd29ya2Zsb3dSZXN1bHRzOiBNYXA8c3RyaW5nLCBNYXA8c3RyaW5nLCBib29sZWFuPj4gPSBuZXcgTWFwKCk7XG5cdHByaXZhdGUgY3VycmVudFdvcmtmbG93OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblx0cHJpdmF0ZSBjbGk6IENMSTtcblxuXHRjb25zdHJ1Y3RvcihjbGk6IENMSSkge1xuXHRcdHN1cGVyKHtcblx0XHRcdG5hbWU6IFwid29ya2Zsb3dcIixcblx0XHRcdGRlc2NyaXB0aW9uOiBcIk1hbmFnZSBhbmQgZXhlY3V0ZSB3b3JrZmxvd3NcIixcblx0XHRcdGNhdGVnb3J5OiBcImF1dG9tYXRpb25cIixcblx0XHRcdHBlcm1pc3Npb25zOiBbXCJydW5cIiwgXCJyZWFkXCIsIFwid3JpdGVcIl0sXG5cdFx0XHRzdWJjb21tYW5kczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bmFtZTogXCJydW5cIixcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJSdW4gYSB3b3JrZmxvd1wiLFxuXHRcdFx0XHRcdG9wdGlvbnM6IFtcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bmFtZTogXCJuYW1lXCIsXG5cdFx0XHRcdFx0XHRcdHR5cGU6IFwic3RyaW5nXCIsXG5cdFx0XHRcdFx0XHRcdHJlcXVpcmVkOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJXb3JrZmxvdyBuYW1lXCIsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRuYW1lOiBcInZhcmlhYmxlc1wiLFxuXHRcdFx0XHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJKU09OIHN0cmluZyBvZiB2YXJpYWJsZXNcIixcblx0XHRcdFx0XHRcdFx0cmVxdWlyZWQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bmFtZTogXCJwYXJhbGxlbFwiLFxuXHRcdFx0XHRcdFx0XHR0eXBlOiBcImJvb2xlYW5cIixcblx0XHRcdFx0XHRcdFx0ZGVzY3JpcHRpb246IFwiUnVuIGVsaWdpYmxlIHN0ZXBzIGluIHBhcmFsbGVsXCIsXG5cdFx0XHRcdFx0XHRcdGRlZmF1bHQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdGFjdGlvbjogKGFyZ3M6IEFyZ3MpID0+IHRoaXMucnVuV29ya2Zsb3coYXJncyksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRuYW1lOiBcImxpc3RcIixcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJMaXN0IGF2YWlsYWJsZSB3b3JrZmxvd3NcIixcblx0XHRcdFx0XHRhY3Rpb246ICgpID0+IHRoaXMubGlzdFdvcmtmbG93cygpLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bmFtZTogXCJhZGRcIixcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJBZGQgYSBuZXcgd29ya2Zsb3dcIixcblx0XHRcdFx0XHRvcHRpb25zOiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdG5hbWU6IFwibmFtZVwiLFxuXHRcdFx0XHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0XHRcdFx0XHRyZXF1aXJlZDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0ZGVzY3JpcHRpb246IFwiV29ya2Zsb3cgbmFtZVwiLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bmFtZTogXCJjb25maWdcIixcblx0XHRcdFx0XHRcdFx0dHlwZTogXCJzdHJpbmdcIixcblx0XHRcdFx0XHRcdFx0cmVxdWlyZWQ6IHRydWUsXG5cdFx0XHRcdFx0XHRcdGRlc2NyaXB0aW9uOiBcIlBhdGggdG8gd29ya2Zsb3cgY29uZmlndXJhdGlvbiBmaWxlXCIsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0YWN0aW9uOiAoYXJnczogQXJncykgPT4gdGhpcy5hZGRXb3JrZmxvdyhhcmdzKSxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG5hbWU6IFwic3RhdHVzXCIsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IFwiU2hvdyB3b3JrZmxvdyBleGVjdXRpb24gc3RhdHVzXCIsXG5cdFx0XHRcdFx0b3B0aW9uczogW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRuYW1lOiBcIm5hbWVcIixcblx0XHRcdFx0XHRcdFx0dHlwZTogXCJzdHJpbmdcIixcblx0XHRcdFx0XHRcdFx0cmVxdWlyZWQ6IHRydWUsXG5cdFx0XHRcdFx0XHRcdGRlc2NyaXB0aW9uOiBcIldvcmtmbG93IG5hbWVcIixcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRhY3Rpb246IChhcmdzOiBBcmdzKSA9PiB0aGlzLnNob3dXb3JrZmxvd1N0YXR1cyhhcmdzKSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fSk7XG5cdFx0dGhpcy5jbGkgPSBjbGk7XG5cdH1cblxuXHRhc3luYyBhY3Rpb24oYXJnczogQXJncyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHN1YmNvbW1hbmQgPSBhcmdzLmNvbW1hbmRbMV07XG5cdFx0c3dpdGNoIChzdWJjb21tYW5kKSB7XG5cdFx0XHRjYXNlIFwicnVuXCI6XG5cdFx0XHRcdGF3YWl0IHRoaXMucnVuV29ya2Zsb3coYXJncyk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcImxpc3RcIjpcblx0XHRcdFx0dGhpcy5saXN0V29ya2Zsb3dzKCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcImFkZFwiOlxuXHRcdFx0XHRhd2FpdCB0aGlzLmFkZFdvcmtmbG93KGFyZ3MpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgXCJzdGF0dXNcIjpcblx0XHRcdFx0dGhpcy5zaG93V29ya2Zsb3dTdGF0dXMoYXJncyk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHN1YmNvbW1hbmQ6ICR7c3ViY29tbWFuZH1gKTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGV2YWx1YXRlQ29uZGl0aW9uKFxuXHRcdGNvbmRpdGlvbjogc3RyaW5nLFxuXHRcdGNvbnRleHQ6IFdvcmtmbG93RXhlY3V0aW9uQ29udGV4dCxcblx0KTogYm9vbGVhbiB7XG5cdFx0Y29uc3QgdmFyaWFibGVzID0gY29udGV4dC52YXJpYWJsZXM7XG5cdFx0dHJ5IHtcblx0XHRcdC8vIENyZWF0ZSBhIHNhZmUgZXZhbHVhdGlvbiBjb250ZXh0IHdpdGggdmFyaWFibGVzXG5cdFx0XHRjb25zdCBldmFsQ29udGV4dCA9IHsgLi4udmFyaWFibGVzIH07XG5cdFx0XHQvLyBVc2luZyBGdW5jdGlvbiBjb25zdHJ1Y3RvciB0byBjcmVhdGUgYSBzYW5kYm94ZWQgZXZhbHVhdGlvblxuXHRcdFx0Y29uc3QgZXZhbEZ1bmMgPSBuZXcgRnVuY3Rpb24oXG5cdFx0XHRcdC4uLk9iamVjdC5rZXlzKGV2YWxDb250ZXh0KSxcblx0XHRcdFx0YHJldHVybiAke2NvbmRpdGlvbn07YCxcblx0XHRcdCk7XG5cdFx0XHRyZXR1cm4gZXZhbEZ1bmMoLi4uT2JqZWN0LnZhbHVlcyhldmFsQ29udGV4dCkpO1xuXHRcdH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XG5cdFx0XHRsb2dnZXIuZXJyb3IoXG5cdFx0XHRcdGBFcnJvciBldmFsdWF0aW5nIGNvbmRpdGlvbiBcIiR7Y29uZGl0aW9ufVwiOiAke1xuXHRcdFx0XHRcdGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuXHRcdFx0XHR9YCxcblx0XHRcdCk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBleGVjdXRlU3RlcChcblx0XHRzdGVwOiBXb3JrZmxvd1N0ZXAsXG5cdFx0d29ya2Zsb3c6IFdvcmtmbG93LFxuXHRcdGNvbnRleHQ6IFdvcmtmbG93RXhlY3V0aW9uQ29udGV4dCxcblx0KTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0aWYgKHN0ZXAuY29uZGl0aW9uICYmICF0aGlzLmV2YWx1YXRlQ29uZGl0aW9uKHN0ZXAuY29uZGl0aW9uLCBjb250ZXh0KSkge1xuXHRcdFx0bG9nZ2VyLmluZm8oYFNraXBwaW5nIHN0ZXAgXCIke3N0ZXAubmFtZX1cIiAtIGNvbmRpdGlvbiBub3QgbWV0YCk7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoc3RlcC5kZXBlbmRzT24/Lmxlbmd0aCkge1xuXHRcdFx0Zm9yIChjb25zdCBkZXAgb2Ygc3RlcC5kZXBlbmRzT24pIHtcblx0XHRcdFx0aWYgKCFjb250ZXh0LnN0ZXBSZXN1bHRzLmdldChkZXApKSB7XG5cdFx0XHRcdFx0bG9nZ2VyLmVycm9yKFxuXHRcdFx0XHRcdFx0YFN0ZXAgXCIke3N0ZXAubmFtZX1cIiBkZXBlbmRlbmN5IFwiJHtkZXB9XCIgZmFpbGVkIG9yIG5vdCBleGVjdXRlZGAsXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBleGVjdXRlID0gYXN5bmMgKCk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0aWYgKHR5cGVvZiBzdGVwLmNvbW1hbmQgPT09IFwic3RyaW5nXCIpIHtcblx0XHRcdFx0XHQvLyBQYXJzZSBjb21tYW5kIHN0cmluZyBhbmQgZXhlY3V0ZVxuXHRcdFx0XHRcdGNvbnN0IFtjbWROYW1lLCAuLi5hcmdzXSA9IHN0ZXAuY29tbWFuZC5zcGxpdChcIiBcIik7XG5cdFx0XHRcdFx0Y29uc3QgY29tbWFuZCA9IHRoaXMuY2xpLmZpbmRDb21tYW5kKGNtZE5hbWUpO1xuXHRcdFx0XHRcdGlmICghY29tbWFuZCkge1xuXHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBDb21tYW5kIFwiJHtjbWROYW1lfVwiIG5vdCBmb3VuZGApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRhd2FpdCBjb21tYW5kLmFjdGlvbih7XG5cdFx0XHRcdFx0XHRjb21tYW5kOiBbY21kTmFtZSwgLi4uYXJnc10sXG5cdFx0XHRcdFx0XHRmbGFnczoge30sXG5cdFx0XHRcdFx0XHRjbGk6IHRoaXMuY2xpLFxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIEV4ZWN1dGUgQ29tbWFuZCBvYmplY3QgZGlyZWN0bHlcblx0XHRcdFx0XHRhd2FpdCBzdGVwLmNvbW1hbmQuYWN0aW9uKHtcblx0XHRcdFx0XHRcdGNvbW1hbmQ6IFtzdGVwLm5hbWVdLFxuXHRcdFx0XHRcdFx0ZmxhZ3M6IHt9LFxuXHRcdFx0XHRcdFx0Y2xpOiB0aGlzLmNsaSxcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XG5cdFx0XHRcdGxvZ2dlci5lcnJvcihcblx0XHRcdFx0XHRgU3RlcCBcIiR7c3RlcC5uYW1lfVwiIGZhaWxlZDogJHtcblx0XHRcdFx0XHRcdGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuXHRcdFx0XHRcdH1gLFxuXHRcdFx0XHQpO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGxldCBhdHRlbXB0cyA9IDA7XG5cdFx0Y29uc3QgbWF4UmV0cmllcyA9IHN0ZXAucmV0cmllcyB8fCB3b3JrZmxvdy5tYXhSZXRyaWVzIHx8IDA7XG5cblx0XHR3aGlsZSAoYXR0ZW1wdHMgPD0gbWF4UmV0cmllcykge1xuXHRcdFx0aWYgKGF0dGVtcHRzID4gMCkge1xuXHRcdFx0XHRsb2dnZXIuaW5mbyhcblx0XHRcdFx0XHRgUmV0cnlpbmcgc3RlcCBcIiR7c3RlcC5uYW1lfVwiIChhdHRlbXB0ICR7YXR0ZW1wdHMgKyAxfS8ke1xuXHRcdFx0XHRcdFx0bWF4UmV0cmllcyArIDFcblx0XHRcdFx0XHR9KWAsXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHN1Y2Nlc3MgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuXHRcdFx0XHRleGVjdXRlKCksXG5cdFx0XHRcdHN0ZXAudGltZW91dFxuXHRcdFx0XHRcdD8gbmV3IFByb21pc2U8Ym9vbGVhbj4oKHJlc29sdmUpID0+IHtcblx0XHRcdFx0XHRcdHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRsb2dnZXIuZXJyb3IoXG5cdFx0XHRcdFx0XHRcdFx0YFN0ZXAgXCIke3N0ZXAubmFtZX1cIiB0aW1lZCBvdXQgYWZ0ZXIgJHtzdGVwLnRpbWVvdXR9bXNgLFxuXHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0XHRyZXNvbHZlKGZhbHNlKTtcblx0XHRcdFx0XHRcdH0sIHN0ZXAudGltZW91dCk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQ6IFByb21pc2UucmVzb2x2ZSh0cnVlKSxcblx0XHRcdF0pO1xuXG5cdFx0XHRpZiAoc3VjY2Vzcykge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0YXR0ZW1wdHMrKztcblx0XHRcdGlmIChhdHRlbXB0cyA8PSBtYXhSZXRyaWVzKSB7XG5cdFx0XHRcdGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMDAgKiBhdHRlbXB0cykpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZXhlY3V0ZVdvcmtmbG93KFxuXHRcdHdvcmtmbG93OiBXb3JrZmxvdyxcblx0XHRjb250ZXh0OiBXb3JrZmxvd0V4ZWN1dGlvbkNvbnRleHQsXG5cdFx0cGFyYWxsZWw6IGJvb2xlYW4sXG5cdCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IHN0ZXBzID0gd29ya2Zsb3cuc3RlcHM7XG5cdFx0Y29uc3Qgc3RlcFJlc3VsdHMgPSBjb250ZXh0LnN0ZXBSZXN1bHRzO1xuXG5cdFx0aWYgKHBhcmFsbGVsKSB7XG5cdFx0XHQvLyBHcm91cCBzdGVwcyBieSB0aGVpciBkZXBlbmRlbmNpZXNcblx0XHRcdGNvbnN0IHN0ZXBHcm91cHM6IFdvcmtmbG93U3RlcFtdW10gPSBbXTtcblx0XHRcdGNvbnN0IHByb2Nlc3NlZFN0ZXBzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cblx0XHRcdHdoaWxlIChwcm9jZXNzZWRTdGVwcy5zaXplIDwgc3RlcHMubGVuZ3RoKSB7XG5cdFx0XHRcdGNvbnN0IGVsaWdpYmxlU3RlcHMgPSBzdGVwcy5maWx0ZXIoKHN0ZXApID0+IHtcblx0XHRcdFx0XHRpZiAocHJvY2Vzc2VkU3RlcHMuaGFzKHN0ZXAubmFtZSkpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRyZXR1cm4gIXN0ZXAuZGVwZW5kc09uPy5zb21lKChkZXApID0+ICFwcm9jZXNzZWRTdGVwcy5oYXMoZGVwKSk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGlmIChlbGlnaWJsZVN0ZXBzLmxlbmd0aCA9PT0gMCAmJiBwcm9jZXNzZWRTdGVwcy5zaXplIDwgc3RlcHMubGVuZ3RoKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiQ2lyY3VsYXIgZGVwZW5kZW5jeSBkZXRlY3RlZCBpbiB3b3JrZmxvd1wiKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHN0ZXBHcm91cHMucHVzaChlbGlnaWJsZVN0ZXBzKTtcblx0XHRcdFx0ZWxpZ2libGVTdGVwcy5mb3JFYWNoKChzdGVwKSA9PiBwcm9jZXNzZWRTdGVwcy5hZGQoc3RlcC5uYW1lKSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEV4ZWN1dGUgc3RlcCBncm91cHMgaW4gc2VxdWVuY2UsIGJ1dCBzdGVwcyB3aXRoaW4gZ3JvdXBzIGluIHBhcmFsbGVsXG5cdFx0XHRmb3IgKGNvbnN0IGdyb3VwIG9mIHN0ZXBHcm91cHMpIHtcblx0XHRcdFx0Y29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuXHRcdFx0XHRcdGdyb3VwLm1hcCgoc3RlcCkgPT4gdGhpcy5leGVjdXRlU3RlcChzdGVwLCB3b3JrZmxvdywgY29udGV4dCkpLFxuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdGdyb3VwLmZvckVhY2goKHN0ZXAsIGluZGV4KSA9PiB7XG5cdFx0XHRcdFx0c3RlcFJlc3VsdHMuc2V0KHN0ZXAubmFtZSwgcmVzdWx0c1tpbmRleF0pO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRpZiAocmVzdWx0cy5pbmNsdWRlcyhmYWxzZSkgJiYgd29ya2Zsb3cub25FcnJvciA9PT0gXCJzdG9wXCIpIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gU2VxdWVudGlhbCBleGVjdXRpb25cblx0XHRcdGZvciAoY29uc3Qgc3RlcCBvZiBzdGVwcykge1xuXHRcdFx0XHRjb25zdCBzdWNjZXNzID0gYXdhaXQgdGhpcy5leGVjdXRlU3RlcChzdGVwLCB3b3JrZmxvdywgY29udGV4dCk7XG5cdFx0XHRcdHN0ZXBSZXN1bHRzLnNldChzdGVwLm5hbWUsIHN1Y2Nlc3MpO1xuXG5cdFx0XHRcdGlmICghc3VjY2VzcyAmJiB3b3JrZmxvdy5vbkVycm9yID09PSBcInN0b3BcIikge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBydW5Xb3JrZmxvdyhhcmdzOiBBcmdzKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgbmFtZSA9IGFyZ3MuZmxhZ3MubmFtZSBhcyBzdHJpbmc7XG5cdFx0Y29uc3Qgd29ya2Zsb3cgPSB0aGlzLndvcmtmbG93cy5nZXQobmFtZSk7XG5cblx0XHRpZiAoIXdvcmtmbG93KSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYFdvcmtmbG93IFwiJHtuYW1lfVwiIG5vdCBmb3VuZGApO1xuXHRcdH1cblxuXHRcdHRoaXMuY3VycmVudFdvcmtmbG93ID0gbmFtZTtcblx0XHRjb25zdCBjb250ZXh0OiBXb3JrZmxvd0V4ZWN1dGlvbkNvbnRleHQgPSB7XG5cdFx0XHR2YXJpYWJsZXM6IHsgLi4ud29ya2Zsb3cudmFyaWFibGVzIH0sXG5cdFx0XHRzdGFydFRpbWU6IERhdGUubm93KCksXG5cdFx0XHRzdGVwUmVzdWx0czogbmV3IE1hcCgpLFxuXHRcdFx0cmV0cnlDb3VudDogMCxcblx0XHR9O1xuXG5cdFx0Ly8gUGFyc2UgYWRkaXRpb25hbCB2YXJpYWJsZXMgaWYgcHJvdmlkZWRcblx0XHRpZiAoYXJncy5mbGFncy52YXJpYWJsZXMpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IGFkZGl0aW9uYWxWYXJzID0gSlNPTi5wYXJzZShhcmdzLmZsYWdzLnZhcmlhYmxlcyBhcyBzdHJpbmcpO1xuXHRcdFx0XHRPYmplY3QuYXNzaWduKGNvbnRleHQudmFyaWFibGVzLCBhZGRpdGlvbmFsVmFycyk7XG5cdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdFx0YEludmFsaWQgdmFyaWFibGVzIEpTT046ICR7XG5cdFx0XHRcdFx0XHRlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcblx0XHRcdFx0XHR9YCxcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBwYXJhbGxlbCA9IGFyZ3MuZmxhZ3MucGFyYWxsZWwgYXMgYm9vbGVhbjtcblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBTZXQgdXAgZW52aXJvbm1lbnQgdmFyaWFibGVzXG5cdFx0XHRjb25zdCBvcmlnaW5hbEVudiA9IHsgLi4uRGVuby5lbnYudG9PYmplY3QoKSB9O1xuXHRcdFx0aWYgKHdvcmtmbG93LmVudmlyb25tZW50KSB7XG5cdFx0XHRcdGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHdvcmtmbG93LmVudmlyb25tZW50KSkge1xuXHRcdFx0XHRcdERlbm8uZW52LnNldChrZXksIHZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRsb2dnZXIuaW5mbyhgU3RhcnRpbmcgd29ya2Zsb3cgXCIke25hbWV9XCJgKTtcblx0XHRcdGNvbnN0IHN1Y2Nlc3MgPSBhd2FpdCB0aGlzLmV4ZWN1dGVXb3JrZmxvdyh3b3JrZmxvdywgY29udGV4dCwgcGFyYWxsZWwpO1xuXG5cdFx0XHQvLyBSZXN0b3JlIG9yaWdpbmFsIGVudmlyb25tZW50XG5cdFx0XHRmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhEZW5vLmVudi50b09iamVjdCgpKSkge1xuXHRcdFx0XHRpZiAoa2V5IGluIG9yaWdpbmFsRW52KSB7XG5cdFx0XHRcdFx0RGVuby5lbnYuc2V0KGtleSwgb3JpZ2luYWxFbnZba2V5XSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0RGVuby5lbnYuZGVsZXRlKGtleSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dGhpcy53b3JrZmxvd1Jlc3VsdHMuc2V0KG5hbWUsIGNvbnRleHQuc3RlcFJlc3VsdHMpO1xuXG5cdFx0XHRpZiAoc3VjY2Vzcykge1xuXHRcdFx0XHRsb2dnZXIuaW5mbyhgV29ya2Zsb3cgXCIke25hbWV9XCIgY29tcGxldGVkIHN1Y2Nlc3NmdWxseWApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBXb3JrZmxvdyBcIiR7bmFtZX1cIiBmYWlsZWRgKTtcblx0XHRcdH1cblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0dGhpcy5jdXJyZW50V29ya2Zsb3cgPSBudWxsO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgYWRkV29ya2Zsb3coYXJnczogQXJncyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IG5hbWUgPSBhcmdzLmZsYWdzLm5hbWUgYXMgc3RyaW5nO1xuXHRcdGNvbnN0IGNvbmZpZ1BhdGggPSBhcmdzLmZsYWdzLmNvbmZpZyBhcyBzdHJpbmc7XG5cblx0XHRpZiAodGhpcy53b3JrZmxvd3MuaGFzKG5hbWUpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYFdvcmtmbG93IFwiJHtuYW1lfVwiIGFscmVhZHkgZXhpc3RzYCk7XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IGNvbmZpZ0NvbnRlbnQgPSBhd2FpdCBEZW5vLnJlYWRUZXh0RmlsZShjb25maWdQYXRoKTtcblx0XHRcdGNvbnN0IHdvcmtmbG93OiBXb3JrZmxvdyA9IEpTT04ucGFyc2UoY29uZmlnQ29udGVudCk7XG5cdFx0XHR3b3JrZmxvdy5uYW1lID0gbmFtZTtcblxuXHRcdFx0Ly8gVmFsaWRhdGUgd29ya2Zsb3cgY29uZmlndXJhdGlvblxuXHRcdFx0aWYgKCFBcnJheS5pc0FycmF5KHdvcmtmbG93LnN0ZXBzKSB8fCB3b3JrZmxvdy5zdGVwcy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiV29ya2Zsb3cgbXVzdCBjb250YWluIGF0IGxlYXN0IG9uZSBzdGVwXCIpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBWYWxpZGF0ZSBzdGVwIGRlcGVuZGVuY2llc1xuXHRcdFx0Y29uc3Qgc3RlcE5hbWVzID0gbmV3IFNldCh3b3JrZmxvdy5zdGVwcy5tYXAoKHN0ZXApID0+IHN0ZXAubmFtZSkpO1xuXHRcdFx0Zm9yIChjb25zdCBzdGVwIG9mIHdvcmtmbG93LnN0ZXBzKSB7XG5cdFx0XHRcdGlmIChzdGVwLmRlcGVuZHNPbikge1xuXHRcdFx0XHRcdGZvciAoY29uc3QgZGVwIG9mIHN0ZXAuZGVwZW5kc09uKSB7XG5cdFx0XHRcdFx0XHRpZiAoIXN0ZXBOYW1lcy5oYXMoZGVwKSkge1xuXHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdFx0XHRcdFx0YFN0ZXAgXCIke3N0ZXAubmFtZX1cIiBkZXBlbmRzIG9uIHVua25vd24gc3RlcCBcIiR7ZGVwfVwiYCxcblx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dGhpcy53b3JrZmxvd3Muc2V0KG5hbWUsIHdvcmtmbG93KTtcblx0XHRcdGxvZ2dlci5pbmZvKGBXb3JrZmxvdyBcIiR7bmFtZX1cIiBhZGRlZCBzdWNjZXNzZnVsbHlgKTtcblx0XHR9IGNhdGNoIChlcnJvcjogdW5rbm93bikge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHRgRmFpbGVkIHRvIGFkZCB3b3JrZmxvdzogJHtcblx0XHRcdFx0XHRlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcblx0XHRcdFx0fWAsXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgbGlzdFdvcmtmbG93cygpOiB2b2lkIHtcblx0XHRpZiAodGhpcy53b3JrZmxvd3Muc2l6ZSA9PT0gMCkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJObyB3b3JrZmxvd3MgYXZhaWxhYmxlXCIpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnNvbGUubG9nKFwiXFxuQXZhaWxhYmxlIFdvcmtmbG93czpcIik7XG5cdFx0Y29uc29sZS5sb2coXCI9PT09PT09PT09PT09PT09PT09XCIpO1xuXG5cdFx0Zm9yIChjb25zdCBbbmFtZSwgd29ya2Zsb3ddIG9mIHRoaXMud29ya2Zsb3dzKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhgXFxuTmFtZTogJHtuYW1lfWApO1xuXHRcdFx0aWYgKHdvcmtmbG93LmRlc2NyaXB0aW9uKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBEZXNjcmlwdGlvbjogJHt3b3JrZmxvdy5kZXNjcmlwdGlvbn1gKTtcblx0XHRcdH1cblx0XHRcdGNvbnNvbGUubG9nKGBTdGVwczogJHt3b3JrZmxvdy5zdGVwcy5sZW5ndGh9YCk7XG5cdFx0XHRjb25zb2xlLmxvZyhcIlN0ZXBzOlwiKTtcblx0XHRcdHdvcmtmbG93LnN0ZXBzLmZvckVhY2goKHN0ZXApID0+IHtcblx0XHRcdFx0Y29uc29sZS5sb2coXG5cdFx0XHRcdFx0YCAgLSAke3N0ZXAubmFtZX0ke3N0ZXAucGFyYWxsZWwgPyBcIiAocGFyYWxsZWwpXCIgOiBcIlwifSR7XG5cdFx0XHRcdFx0XHRzdGVwLmRlcGVuZHNPbj8ubGVuZ3RoXG5cdFx0XHRcdFx0XHRcdD8gYCAoZGVwZW5kcyBvbjogJHtzdGVwLmRlcGVuZHNPbi5qb2luKFwiLCBcIil9KWBcblx0XHRcdFx0XHRcdFx0OiBcIlwiXG5cdFx0XHRcdFx0fWAsXG5cdFx0XHRcdCk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHNob3dXb3JrZmxvd1N0YXR1cyhhcmdzOiBBcmdzKTogdm9pZCB7XG5cdFx0Y29uc3QgbmFtZSA9IGFyZ3MuZmxhZ3MubmFtZSBhcyBzdHJpbmc7XG5cdFx0Y29uc3QgcmVzdWx0cyA9IHRoaXMud29ya2Zsb3dSZXN1bHRzLmdldChuYW1lKTtcblxuXHRcdGlmICghcmVzdWx0cykge1xuXHRcdFx0Y29uc29sZS5sb2coYE5vIGV4ZWN1dGlvbiBoaXN0b3J5IGZvciB3b3JrZmxvdyBcIiR7bmFtZX1cImApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnNvbGUubG9nKGBcXG5Xb3JrZmxvdyBcIiR7bmFtZX1cIiBTdGF0dXM6YCk7XG5cdFx0Y29uc29sZS5sb2coXCI9PT09PT09PT09PT09PT09PT09PT1cIik7XG5cblx0XHRmb3IgKGNvbnN0IFtzdGVwLCBzdWNjZXNzXSBvZiByZXN1bHRzKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhgJHtzdGVwfTogJHtzdWNjZXNzID8gXCLinJMgU3VjY2Vzc1wiIDogXCLinJcgRmFpbGVkXCJ9YCk7XG5cdFx0fVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVXb3JrZmxvd0NvbW1hbmQoY2xpOiBDTEkpOiBDb21tYW5kIHtcblx0cmV0dXJuIG5ldyBXb3JrZmxvd0NvbW1hbmQoY2xpKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxtQ0FBbUM7QUFDbkMsU0FBUyxXQUFXLFFBQVEsY0FBYztBQUUxQyxTQUFTLE1BQU0sUUFBUSxlQUFlO0FBOEJ0QyxPQUFPLE1BQU0sd0JBQXdCO0VBQzVCLFlBQW1DLElBQUksTUFBTTtFQUM3QyxrQkFBcUQsSUFBSSxNQUFNO0VBQy9ELGtCQUFpQyxLQUFLO0VBQ3RDLElBQVM7RUFFakIsWUFBWSxHQUFRLENBQUU7SUFDckIsS0FBSyxDQUFDO01BQ0wsTUFBTTtNQUNOLGFBQWE7TUFDYixVQUFVO01BQ1YsYUFBYTtRQUFDO1FBQU87UUFBUTtPQUFRO01BQ3JDLGFBQWE7UUFDWjtVQUNDLE1BQU07VUFDTixhQUFhO1VBQ2IsU0FBUztZQUNSO2NBQ0MsTUFBTTtjQUNOLE1BQU07Y0FDTixVQUFVO2NBQ1YsYUFBYTtZQUNkO1lBQ0E7Y0FDQyxNQUFNO2NBQ04sTUFBTTtjQUNOLGFBQWE7Y0FDYixVQUFVO1lBQ1g7WUFDQTtjQUNDLE1BQU07Y0FDTixNQUFNO2NBQ04sYUFBYTtjQUNiLFNBQVM7WUFDVjtXQUNBO1VBQ0QsUUFBUSxDQUFDLE9BQWUsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUMxQztRQUNBO1VBQ0MsTUFBTTtVQUNOLGFBQWE7VUFDYixRQUFRLElBQU0sSUFBSSxDQUFDLGFBQWE7UUFDakM7UUFDQTtVQUNDLE1BQU07VUFDTixhQUFhO1VBQ2IsU0FBUztZQUNSO2NBQ0MsTUFBTTtjQUNOLE1BQU07Y0FDTixVQUFVO2NBQ1YsYUFBYTtZQUNkO1lBQ0E7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
// denoCacheMetadata=13422826803577670409,2982788687291820819