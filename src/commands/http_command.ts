// File: HttpCommand.ts

import { BaseCommand } from "../types/types.ts";
import { Args, Command } from "../types/types.ts";
import { logger } from "../logger/logger.ts";

interface HttpCommandOptions {
	headers?: Record<string, string>;
	timeout?: number;
	retries?: number;
	validateStatus?: (status: number) => boolean;
}

interface ActiveRequest {
	controller: AbortController;
	timer: number | undefined;
}

export class HttpCommand extends BaseCommand {
	private readonly httpOptions: HttpCommandOptions;
	private activeRequests: Set<ActiveRequest>;
	private activeDelays: Set<number>;

	constructor(config: Partial<Command> & { httpOptions?: HttpCommandOptions }) {
		super({
			...config,
			name: "http",
			description: "Make HTTP requests",
			category: "api",
			permissions: ["net"],
			options: [
				{
					name: "method",
					type: "string",
					description: "HTTP method (GET, POST, PUT, DELETE)",
					required: true,
				},
				{
					name: "url",
					type: "string",
					description: "Request URL",
					required: true,
				},
				{
					name: "data",
					type: "string",
					description: "Request body data",
				},
				{
					name: "headers",
					type: "string",
					description: "Request headers (comma-separated key:value pairs)",
				},
			],
		});

		this.httpOptions = config.httpOptions || {};
		this.activeRequests = new Set();
		this.activeDelays = new Set();

		// Bind methods to preserve context
		this.cleanupRequests = this.cleanupRequests.bind(this);
		this.makeRequest = this.makeRequest.bind(this);
		this.action = this.action.bind(this);

		// Add lifecycle hooks
		this.lifecycle = {
			cleanup: async () => await this.cleanupRequests(),
			onError: async (error: Error) => {
				await this.cleanupRequests();
				throw error;
			},
		};
	}

	/**
	 * Cleans up all active requests and delay timers by aborting controllers and clearing timers.
	 */
	private async cleanupRequests(): Promise<void> {
		// Clean up active HTTP requests
		const requestCleanupPromises = Array.from(this.activeRequests).map(
			(request) => {
				request.controller.abort();
				if (request.timer) {
					clearTimeout(request.timer);
				}
				return Promise.resolve();
			},
		);

		// Clean up active delay timers
		const delayCleanupPromises = Array.from(this.activeDelays).map(
			(delayTimer) => {
				clearTimeout(delayTimer);
				return Promise.resolve();
			},
		);

		await Promise.all([...requestCleanupPromises, ...delayCleanupPromises]);

		this.activeRequests.clear();
		this.activeDelays.clear();
	}

	/**
	 * Parses the headers string into a Record<string, string>.
	 * @param headerString Comma-separated key:value pairs.
	 * @returns Parsed headers as an object.
	 */
	private parseHeaders(headerString?: string): Record<string, string> {
		if (!headerString) return {};
		return headerString.split(",").reduce((acc, curr) => {
			const [key, value] = curr.split(":");
			if (key && value) {
				acc[key.trim()] = value.trim();
			}
			return acc;
		}, {} as Record<string, string>);
	}

	/**
	 * Makes an HTTP request with the given parameters.
	 * @param method HTTP method.
	 * @param url Request URL.
	 * @param data Request body data.
	 * @param headers Request headers.
	 * @returns The HTTP response.
	 */
	private async makeRequest(
		method: string,
		url: string,
		data?: string,
		headers?: Record<string, string>,
	): Promise<Response> {
		const controller = new AbortController();
		const request: ActiveRequest = { controller, timer: undefined };
		this.activeRequests.add(request);

		try {
			const timeoutPromise = new Promise<never>((_, reject) => {
				request.timer = setTimeout(() => {
					controller.abort();
					reject(new Error("Network error: Request timeout"));
				}, this.httpOptions.timeout || 30000);
			});

			const fetchPromise = fetch(url, {
				method,
				headers: {
					...this.httpOptions.headers,
					...headers,
					"Content-Type": "application/json",
				},
				body: data,
				signal: controller.signal,
			});

			const response = await Promise.race([fetchPromise, timeoutPromise]);

			if (
				this.httpOptions.validateStatus &&
				!this.httpOptions.validateStatus(response.status)
			) {
				throw new Error(
					`HTTP error ${response.status}: ${response.statusText}`,
				);
			}

			return response;
		} catch (error) {
			if (error instanceof Error) {
				if (error.name === "AbortError") {
					throw new Error("Network error: Request timeout");
				}
				if (error.message.includes("Failed to fetch")) {
					throw new Error("Network error: Failed to connect");
				}
				throw error; // Preserve the original error message for other cases
			}
			throw new Error("Network error: Unknown error occurred");
		} finally {
			if (request.timer) {
				clearTimeout(request.timer);
			}
			this.activeRequests.delete(request);
		}
	}

	/**
	 * Executes the HTTP command action with retries and proper timer management.
	 * @param args Command arguments.
	 */
	public async action(args: Args): Promise<void> {
		try {
			const method = (args.flags.method as string).toUpperCase();
			const url = args.flags.url as string;
			const data = args.flags.data as string;
			const headers = this.parseHeaders(args.flags.headers as string);

			const maxRetries = this.httpOptions.retries || 3;
			let attempt = 0;
			let lastError: Error | null = null;

			while (attempt <= maxRetries) {
				try {
					logger.info(
						`Making ${method} request to ${url} (attempt ${attempt + 1}/${
							maxRetries + 1
						})`,
					);
					const response = await this.makeRequest(method, url, data, headers);
					const responseData = await response.json();
					logger.info(
						`Request successful (${response.status} ${response.statusText})`,
					);
					console.log(JSON.stringify(responseData, null, 2));
					return;
				} catch (error) {
					lastError = error instanceof Error ? error : new Error(String(error));

					if (attempt === maxRetries) {
						throw lastError;
					}

					logger.warn(
						`Request failed, retrying... (${attempt + 1}/${maxRetries})`,
					);
					attempt++;

					// Wait before retrying
					await new Promise<void>((resolve) => {
						const delayDuration = 1000 * attempt; // Exponential backoff
						const delayTimer = setTimeout(() => {
							resolve();
							// Remove the delayTimer from activeDelays after completion to prevent leaks
							this.activeDelays.delete(delayTimer);
						}, delayDuration);

						this.activeDelays.add(delayTimer);
					});
				}
			}

			if (lastError) {
				throw lastError;
			}
		} finally {
			await this.cleanupRequests();
		}
	}
}

/**
 * Factory function to create a new HttpCommand instance.
 * @param config Command configuration.
 * @returns A new HttpCommand instance.
 */
export function createHttpCommand(
	config: Partial<Command> & { httpOptions?: HttpCommandOptions },
): Command {
	return new HttpCommand(config);
}
