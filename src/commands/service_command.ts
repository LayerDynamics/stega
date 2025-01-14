// src/commands/service_command.ts

import { BaseCommand } from "../types.ts";
import { Args, Command } from "../types.ts";
import { logger } from "../logger.ts";
import { CLI } from "../core.ts";

interface ServiceConfig {
	name: string;
	command: string;
	workingDirectory?: string;
	environment?: Record<string, string>;
	autoRestart?: boolean;
	maxRetries?: number;
	healthCheck?: {
		endpoint?: string;
		interval: number;
		timeout: number;
	};
}

interface ServiceStatus {
	name: string;
	status: "running" | "stopped" | "error";
	pid?: number;
	uptime?: number;
	memory?: number;
	cpu?: number;
	lastError?: string;
	healthStatus?: "healthy" | "unhealthy";
}

export class ServiceCommand extends BaseCommand {
	private services: Map<string, Deno.ChildProcess> = new Map();
	private configs: Map<string, ServiceConfig> = new Map();
	private statusMonitors: Map<string, number> = new Map();
	private startTimes: Map<string, number> = new Map();
	private retryCount: Map<string, number> = new Map();
	private cli: CLI;

	constructor(cli: CLI) {
		super({
			name: "service",
			description: "Manage system services",
			category: "service",
			permissions: ["run", "read", "write", "net"],
			subcommands: [
				{
					name: "start",
					description: "Start a service",
					options: [
						{
							name: "name",
							type: "string",
							required: true,
							description: "Service name",
						},
						{
							name: "config",
							type: "string",
							description: "Path to service configuration file",
							required: true,
						},
					],
					action: (args: Args) => this.handleStart(args),
				},
				{
					name: "stop",
					description: "Stop a service",
					options: [
						{
							name: "name",
							type: "string",
							required: true,
							description: "Service name",
						},
						{
							name: "force",
							type: "boolean",
							description: "Force stop the service",
							required: true,
						},
					],
					action: (args: Args) => this.handleStop(args),
				},
				{
					name: "restart",
					description: "Restart a service",
					options: [
						{
							name: "name",
							type: "string",
							required: true,
							description: "Service name",
						},
					],
					action: (args: Args) => this.handleRestart(args),
				},
				{
					name: "status",
					description: "Get service status",
					options: [
						{
							name: "name",
							type: "string",
							description: "Service name (optional)",
						},
						{
							name: "format",
							type: "string",
							description: "Output format (json|table)",
							default: "table",
						},
					],
					action: (args: Args) => this.handleStatus(args),
				},
				{
					name: "logs",
					description: "View service logs",
					options: [
						{
							name: "name",
							type: "string",
							required: true,
							description: "Service name",
						},
						{
							name: "lines",
							type: "number",
							description: "Number of lines to show",
							default: 50,
						},
						{
							name: "follow",
							type: "boolean",
							description: "Follow log output",
							default: false,
						},
					],
					action: (args: Args) => this.handleLogs(args),
				},
			],
		});
		this.cli = cli;

		this.lifecycle = {
			cleanup: async () => {
				await this.stopAllServices();
			},
			onError: async (error: Error) => {
				logger.error(`Service command error: ${error.message}`);
				await this.stopAllServices();
			},
		};
	}

	private async loadServiceConfig(path: string): Promise<ServiceConfig> {
		try {
			const content = await Deno.readTextFile(path);
			return JSON.parse(content);
		} catch (error: unknown) {
			throw new Error(
				`Failed to load service configuration: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	}

	private async startProcess(
		config: ServiceConfig,
	): Promise<Deno.ChildProcess> {
		const cmd = config.command.split(" ");
		const command = new Deno.Command(cmd[0], {
			args: cmd.slice(1),
			cwd: config.workingDirectory,
			env: config.environment,
			stdout: "piped",
			stderr: "piped",
		});

		const process = command.spawn();
		this.startTimes.set(config.name, Date.now());
		this.setupProcessMonitoring(process, config);
		await this.handleProcessOutput(process, config.name);

		return process;
	}

	private setupProcessMonitoring(
		process: Deno.ChildProcess,
		config: ServiceConfig,
	): void {
		// Output handling
		this.handleProcessOutput(process, config.name);

		// Health checking
		if (config.healthCheck) {
			const intervalId = setInterval(
				() => this.checkServiceHealth(config),
				config.healthCheck.interval,
			);
			this.statusMonitors.set(config.name, intervalId);
		}

		// Process monitoring
		this.monitorProcess(process, config);
	}

	private async handleProcessOutput(
		process: Deno.ChildProcess,
		serviceName: string,
	): Promise<void> {
		const decoder = new TextDecoder();
		if (process.stdout) {
			for await (const chunk of process.stdout) {
				const text = decoder.decode(chunk);
				logger.info(`[${serviceName}] ${text.trim()}`);
			}
		}
		if (process.stderr) {
			for await (const chunk of process.stderr) {
				const text = decoder.decode(chunk);
				logger.error(`[${serviceName}] ${text.trim()}`);
			}
		}
	}

	private async checkServiceHealth(config: ServiceConfig): Promise<boolean> {
		if (!config.healthCheck?.endpoint) return true;

		try {
			const controller = new AbortController();
			const timeout = setTimeout(
				() => controller.abort(),
				config.healthCheck.timeout,
			);

			const response = await fetch(config.healthCheck.endpoint, {
				signal: controller.signal,
			});

			clearTimeout(timeout);
			return response.ok;
		} catch {
			return false;
		}
	}

	private async monitorProcess(
		process: Deno.ChildProcess,
		config: ServiceConfig,
	): Promise<void> {
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
					logger.error(
						`Service ${config.name} failed to restart after ${retries} attempts`,
					);
					this.services.delete(config.name);
					this.cleanup(config.name);
				}
			}
		} catch (error) {
			logger.error(
				`Error monitoring service ${config.name}: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	}

	private cleanup(serviceName: string): void {
		const monitorId = this.statusMonitors.get(serviceName);
		if (monitorId) {
			clearInterval(monitorId);
			this.statusMonitors.delete(serviceName);
		}
		this.startTimes.delete(serviceName);
		this.retryCount.delete(serviceName);
	}

	async action(args: Args): Promise<void> {
		const subcommand = args.command[1];

		switch (subcommand) {
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

	private async handleStart(args: Args): Promise<void> {
		const name = args.flags.name as string;
		const configPath = args.flags.config as string;

		if (this.services.has(name)) {
			throw new Error(`Service ${name} is already running`);
		}

		let config: ServiceConfig;
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

	private async handleStop(args: Args): Promise<void> {
		const name = args.flags.name as string;
		const force = args.flags.force as boolean;

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
					new Promise((resolve) => setTimeout(resolve, 5000)),
				]);
				if (this.services.has(name)) {
					Deno.kill(process.pid, "SIGKILL");
				}
			}
		} catch (error: unknown) {
			throw new Error(
				`Failed to stop service: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}

		this.cleanup(name);
		this.services.delete(name);
		logger.info(`Service ${name} stopped`);
	}

	private async handleRestart(args: Args): Promise<void> {
		await this.handleStop({ ...args, flags: { ...args.flags, force: false } });
		await this.handleStart(args);
	}

	private async handleStatus(args: Args): Promise<void> {
		const name = args.flags.name as string;
		const format = args.flags.format as string;

		const getServiceStatus = async (
			serviceName: string,
			process: Deno.ChildProcess,
		): Promise<ServiceStatus> => {
			const startTime = this.startTimes.get(serviceName);
			const uptime = startTime ? Date.now() - startTime : 0;
			const health = await this.checkServiceHealth(
				this.configs.get(serviceName)!,
			);

			return {
				name: serviceName,
				status: "running",
				pid: process.pid,
				uptime,
				healthStatus: health ? "healthy" : "unhealthy",
			};
		};

		if (name) {
			const process = this.services.get(name);
			if (!process) {
				console.log(`Service ${name} is not running`);
				return;
			}
			const status = await getServiceStatus(name, process);
			this.displayStatus([status], format);
		} else {
			const statuses = await Promise.all(
				Array.from(this.services.entries()).map(
					([name, process]) => getServiceStatus(name, process),
				),
			);
			this.displayStatus(statuses, format);
		}
	}

	private displayStatus(statuses: ServiceStatus[], format: string): void {
		if (format === "json") {
			console.log(JSON.stringify(statuses, null, 2));
			return;
		}

		// Display as table
		console.log("\nService Status:");
		console.log("==============");
		for (const status of statuses) {
			console.log(`\nName: ${status.name}`);
			console.log(`Status: ${status.status}`);
			console.log(`PID: ${status.pid}`);
			console.log(`Uptime: ${Math.floor(status.uptime! / 1000)}s`);
			console.log(`Health: ${status.healthStatus}`);
			if (status.lastError) {
				console.log(`Last Error: ${status.lastError}`);
			}
		}
	}

	private async handleLogs(args: Args): Promise<void> {
		const name = args.flags.name as string;
		const lines = args.flags.lines as number;
		const follow = args.flags.follow as boolean;

		const process = this.services.get(name);
		if (!process || !process.stdout) {
			throw new Error(`Service ${name} is not running`);
		}

		const decoder = new TextDecoder();
		const logBuffer: string[] = [];

		if (follow) {
			console.log(`Following logs for service ${name}...\n`);
			for await (const chunk of process.stdout) {
				const text = decoder.decode(chunk);
				console.log(text);
			}
		} else {
			// Show last N lines
			for await (const chunk of process.stdout) {
				const text = decoder.decode(chunk);
				logBuffer.push(...text.split("\n"));
				if (logBuffer.length > lines) {
					logBuffer.splice(0, logBuffer.length - lines);
				}
			}
			console.log(logBuffer.join("\n"));
		}
	}

	private async stopAllServices(): Promise<void> {
		for (const [name] of this.services) {
			await this.handleStop({
				command: ["service", "stop"],
				flags: { name, force: true },
				cli: this.cli,
			});
		}
	}
}

export function createServiceCommand(cli: CLI): Command {
	return new ServiceCommand(cli);
}
