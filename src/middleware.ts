import type { Args } from './types.ts'; // Change import source to types.ts
import type { Command } from './command.ts';

export type MiddlewareFunction = (
	args: Args,
	command: Command,
) => void | Promise<void>;

export class MiddlewareRegistry {
	private middlewares: MiddlewareFunction[] = [];

	/**
	 * Registers a middleware function.
	 * @param middleware The middleware function to register.
	 */
	use(middleware: MiddlewareFunction) {
		this.middlewares.push(middleware);
	}

	/**
	 * Executes all registered middleware functions in order.
	 * @param args The parsed command-line arguments.
	 * @param command The command being executed.
	 */
	async execute(args: Args, command: Command) {
		for (const middleware of this.middlewares) {
			await middleware(args, command);
		}
	}
}
