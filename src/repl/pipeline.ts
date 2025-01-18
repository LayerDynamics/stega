// src/repl/pipeline.ts

interface PipelineStage {
	command: string;
	args: string[];
	input?: string;
	output?: string;
}

interface PipelineResult {
	success: boolean;
	output: string;
	error?: string;
}

/**
 * A pipeline that parses and executes command-line style operations in sequence.
 * Supports piping of output between commands and handles quoted strings.
 * 
 * @example
 * ```typescript
 * const pipeline = new CommandPipeline();
 * pipeline.parse('command1 "arg with spaces" | command2 arg2');
 * await pipeline.execute({ eval: myEvalFunction });
 * ```
 * 
 * @class CommandPipeline
 * @property {PipelineStage[]} stages - Array of pipeline stages to be executed
 * 
 * @interface PipelineStage
 * @property {string} command - The command to be executed
 * @property {string[]} args - Arguments for the command
 * 
 * @interface PipelineResult
 * @property {boolean} success - Indicates if the pipeline executed successfully
 * @property {string} output - The final output of the pipeline
 * @property {string} [error] - Error message if pipeline execution failed
 */
export class CommandPipeline {
	private stages: PipelineStage[]=[];

	/**
	 * Parse a command line into pipeline stages
	 */
	public parse(line: string): PipelineStage[] {
		// Split on pipe operator while preserving quoted strings
		const parts=line.match(/(?:[^"|']|"[^"]*"|'[^']*')+/g)||[];

		this.stages=parts.map(part => {
			const trimmed=part.trim().replace(/[|]/g,'');
			const tokens=trimmed.match(/(?:[^\s"|']|"[^"]*"|'[^']*')+/g)||[];
			const [command,...args]=tokens.map(t => t.replace(/^["']|["']$/g,''));

			return {
				command,
				args,
			};
		});

		return this.stages;
	}

	/**
	 * Execute the pipeline stages in sequence
	 */
	public async execute(context: {
		eval: (command: string,args: string[],input?: string) => Promise<string>;
	}): Promise<PipelineResult> {
		let currentInput: string|undefined;

		for(const stage of this.stages) {
			try {
				// Execute command with input from previous stage
				const output=await context.eval(stage.command,stage.args,currentInput);

				// Store output for next stage
				currentInput=output;
			} catch(error) {
				return {
					success: false,
					output: currentInput||'',
					error: error instanceof Error? error.message:String(error)
				};
			}
		}

		return {
			success: true,
			output: currentInput||''
		};
	}
}

/**
 * Pipeline operator for string manipulation
 */
export class StringOperator {
	static async transform(input: string,operation: string,args: string[]): Promise<string> {
		switch(operation) {
			case 'uppercase':
				return input.toUpperCase();

			case 'lowercase':
				return input.toLowerCase();

			case 'trim':
				return input.trim();

			case 'replace': {
				const [search,replace]=args;
				return input.replace(new RegExp(search,'g'),replace);
			}

			case 'split': {
				const [delimiter]=args;
				return input.split(delimiter).join('\n');
			}

			case 'join': {
				const [delimiter]=args;
				return input.split('\n').join(delimiter);
			}

			case 'grep': {
				const [pattern]=args;
				const matches=input.split('\n')
					.filter(line => new RegExp(pattern).test(line));
				return matches.join('\n');
			}

			default:
				throw new Error(`Unknown string operation: ${operation}`);
		}
	}
}

/**
 * Helper to integrate pipeline with REPL
 */
export function createPipelineEvaluator(repl: {
	eval: (line: string) => Promise<string>;
}) {
	return async (command: string,args: string[],input?: string): Promise<string> => {
		// Check if this is a string operation
		if(command.startsWith('.')) {
			const operation=command.slice(1);
			return StringOperator.transform(input||'',operation,args);
		}

		// Otherwise evaluate as normal command
		const result=await repl.eval(`${command} ${args.join(' ')}`);
		return result;
	};
}
