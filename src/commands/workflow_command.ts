// src/commands/workflow_command.ts
import { BaseCommand } from "../types.ts";
import { Args, Command } from "../types.ts";
import { logger } from "../logger.ts";
import { CLI } from "../core.ts";

interface WorkflowStep {
    name: string;
    command: string | { action: (args: Args) => void | Promise<void> };
    condition?: string;
    retries?: number;
    timeout?: number;
    parallel?: boolean;
    dependsOn?: string[];
}

interface Workflow {
    name: string;
    description?: string;
    steps: WorkflowStep[];
    environment?: Record<string, string>;
    onError?: "continue" | "stop" | "retry";
    maxRetries?: number;
    variables?: Record<string, string>;
}

interface WorkflowExecutionContext {
    variables: Record<string, string>;
    startTime: number;
    stepResults: Map<string, boolean>;
    retryCount: number;
}

export class WorkflowCommand extends BaseCommand {
    private workflows: Map<string, Workflow> = new Map();
    private workflowResults: Map<string, Map<string, boolean>> = new Map();
    private currentWorkflow: string | null = null;
    private cli: CLI;

    constructor(cli: CLI) {
        super({
            name: "workflow",
            description: "Manage and execute workflows",
            category: "automation",
            permissions: ["run", "read", "write"],
            subcommands: [
                {
                    name: "run",
                    description: "Run a workflow",
                    options: [
                        {
                            name: "name",
                            type: "string",
                            required: true,
                            description: "Workflow name",
                        },
                        {
                            name: "variables",
                            type: "string",
                            description: "JSON string of variables",
                            required: false,
                        },
                        {
                            name: "parallel",
                            type: "boolean",
                            description: "Run eligible steps in parallel",
                            default: false,
                        }
                    ],
                    action: (args: Args) => this.runWorkflow(args),
                },
                {
                    name: "list",
                    description: "List available workflows",
                    action: () => this.listWorkflows(),
                },
                {
                    name: "add",
                    description: "Add a new workflow",
                    options: [
                        {
                            name: "name",
                            type: "string",
                            required: true,
                            description: "Workflow name",
                        },
                        {
                            name: "config",
                            type: "string",
                            required: true,
                            description: "Path to workflow configuration file",
                        }
                    ],
                    action: (args: Args) => this.addWorkflow(args),
                },
                {
                    name: "status",
                    description: "Show workflow execution status",
                    options: [
                        {
                            name: "name",
                            type: "string",
                            required: true,
                            description: "Workflow name",
                        }
                    ],
                    action: (args: Args) => this.showWorkflowStatus(args),
                }
            ],
        });
        this.cli = cli;
    }

    async action(args: Args): Promise<void> {
        const subcommand = args.command[1];
        switch (subcommand) {
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

    private evaluateCondition(condition: string, context: WorkflowExecutionContext): boolean {
        const variables = context.variables;
        try {
            // Create a safe evaluation context with variables
            const evalContext = { ...variables };
            // Using Function constructor to create a sandboxed evaluation
            const evalFunc = new Function(...Object.keys(evalContext), `return ${condition};`);
            return evalFunc(...Object.values(evalContext));
        } catch (error: unknown) {
            logger.error(`Error evaluating condition "${condition}": ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }

    private async executeStep(
        step: WorkflowStep,
        workflow: Workflow,
        context: WorkflowExecutionContext
    ): Promise<boolean> {
        if (step.condition && !this.evaluateCondition(step.condition, context)) {
            logger.info(`Skipping step "${step.name}" - condition not met`);
            return true;
        }

        if (step.dependsOn?.length) {
            for (const dep of step.dependsOn) {
                if (!context.stepResults.get(dep)) {
                    logger.error(`Step "${step.name}" dependency "${dep}" failed or not executed`);
                    return false;
                }
            }
        }

        const execute = async (): Promise<boolean> => {
            try {
                if (typeof step.command === 'string') {
                    // Parse command string and execute
                    const [cmdName, ...args] = step.command.split(' ');
                    const command = this.cli.findCommand(cmdName);
                    if (!command) {
                        throw new Error(`Command "${cmdName}" not found`);
                    }
                    await command.action({ command: [cmdName, ...args], flags: {}, cli: this.cli });
                } else {
                    // Execute Command object directly
                    await step.command.action({ command: [step.name], flags: {}, cli: this.cli });
                }
                return true;
            } catch (error: unknown) {
                logger.error(`Step "${step.name}" failed: ${error instanceof Error ? error.message : String(error)}`);
                return false;
            }
        };

        let attempts = 0;
        const maxRetries = step.retries || workflow.maxRetries || 0;

        while (attempts <= maxRetries) {
            if (attempts > 0) {
                logger.info(`Retrying step "${step.name}" (attempt ${attempts + 1}/${maxRetries + 1})`);
            }

            const success = await Promise.race([
                execute(),
                step.timeout
                    ? new Promise<boolean>((resolve) => {
                        setTimeout(() => {
                            logger.error(`Step "${step.name}" timed out after ${step.timeout}ms`);
                            resolve(false);
                        }, step.timeout);
                    })
                    : Promise.resolve(true)
            ]);

            if (success) {
                return true;
            }

            attempts++;
            if (attempts <= maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
        }

        return false;
    }

    private async executeWorkflow(
        workflow: Workflow,
        context: WorkflowExecutionContext,
        parallel: boolean
    ): Promise<boolean> {
        const steps = workflow.steps;
        const stepResults = context.stepResults;

        if (parallel) {
            // Group steps by their dependencies
            const stepGroups: WorkflowStep[][] = [];
            const processedSteps = new Set<string>();

            while (processedSteps.size < steps.length) {
                const eligibleSteps = steps.filter(step => {
                    if (processedSteps.has(step.name)) return false;
                    return !step.dependsOn?.some(dep => !processedSteps.has(dep));
                });

                if (eligibleSteps.length === 0 && processedSteps.size < steps.length) {
                    throw new Error("Circular dependency detected in workflow");
                }

                stepGroups.push(eligibleSteps);
                eligibleSteps.forEach(step => processedSteps.add(step.name));
            }

            // Execute step groups in sequence, but steps within groups in parallel
            for (const group of stepGroups) {
                const results = await Promise.all(
                    group.map(step => this.executeStep(step, workflow, context))
                );

                group.forEach((step, index) => {
                    stepResults.set(step.name, results[index]);
                });

                if (results.includes(false) && workflow.onError === "stop") {
                    return false;
                }
            }
        } else {
            // Sequential execution
            for (const step of steps) {
                const success = await this.executeStep(step, workflow, context);
                stepResults.set(step.name, success);

                if (!success && workflow.onError === "stop") {
                    return false;
                }
            }
        }

        return true;
    }

    private async runWorkflow(args: Args): Promise<void> {
        const name = args.flags.name as string;
        const workflow = this.workflows.get(name);

        if (!workflow) {
            throw new Error(`Workflow "${name}" not found`);
        }

        this.currentWorkflow = name;
        const context: WorkflowExecutionContext = {
            variables: { ...workflow.variables },
            startTime: Date.now(),
            stepResults: new Map(),
            retryCount: 0
        };

        // Parse additional variables if provided
        if (args.flags.variables) {
            try {
                const additionalVars = JSON.parse(args.flags.variables as string);
                Object.assign(context.variables, additionalVars);
            } catch (error) {
                throw new Error(`Invalid variables JSON: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        const parallel = args.flags.parallel as boolean;

        try {
            // Set up environment variables
            const originalEnv = { ...Deno.env.toObject() };
            if (workflow.environment) {
                for (const [key, value] of Object.entries(workflow.environment)) {
                    Deno.env.set(key, value);
                }
            }

            logger.info(`Starting workflow "${name}"`);
            const success = await this.executeWorkflow(workflow, context, parallel);

            // Restore original environment
            for (const key of Object.keys(Deno.env.toObject())) {
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
        } finally {
            this.currentWorkflow = null;
        }
    }

    private async addWorkflow(args: Args): Promise<void> {
        const name = args.flags.name as string;
        const configPath = args.flags.config as string;

        if (this.workflows.has(name)) {
            throw new Error(`Workflow "${name}" already exists`);
        }

        try {
            const configContent = await Deno.readTextFile(configPath);
            const workflow: Workflow = JSON.parse(configContent);
            workflow.name = name;

            // Validate workflow configuration
            if (!Array.isArray(workflow.steps) || workflow.steps.length === 0) {
                throw new Error("Workflow must contain at least one step");
            }

            // Validate step dependencies
            const stepNames = new Set(workflow.steps.map(step => step.name));
            for (const step of workflow.steps) {
                if (step.dependsOn) {
                    for (const dep of step.dependsOn) {
                        if (!stepNames.has(dep)) {
                            throw new Error(`Step "${step.name}" depends on unknown step "${dep}"`);
                        }
                    }
                }
            }

            this.workflows.set(name, workflow);
            logger.info(`Workflow "${name}" added successfully`);
        } catch (error: unknown) {
            throw new Error(`Failed to add workflow: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private listWorkflows(): void {
        if (this.workflows.size === 0) {
            console.log("No workflows available");
            return;
        }

        console.log("\nAvailable Workflows:");
        console.log("===================");

        for (const [name, workflow] of this.workflows) {
            console.log(`\nName: ${name}`);
            if (workflow.description) {
                console.log(`Description: ${workflow.description}`);
            }
            console.log(`Steps: ${workflow.steps.length}`);
            console.log("Steps:");
            workflow.steps.forEach(step => {
                console.log(`  - ${step.name}${step.parallel ? ' (parallel)' : ''}${step.dependsOn?.length ? ` (depends on: ${step.dependsOn.join(', ')})` : ''
                    }`);
            });
        }
    }

    private showWorkflowStatus(args: Args): void {
        const name = args.flags.name as string;
        const results = this.workflowResults.get(name);

        if (!results) {
            console.log(`No execution history for workflow "${name}"`);
            return;
        }

        console.log(`\nWorkflow "${name}" Status:`);
        console.log("=====================");

        for (const [step, success] of results) {
            console.log(`${step}: ${success ? '✓ Success' : '✗ Failed'}`);
        }
    }
}

export function createWorkflowCommand(cli: CLI): Command {
    return new WorkflowCommand(cli);
}