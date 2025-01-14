// src/autocomplete.ts
import { Command } from './core.ts';

export const autocompleteCommand: Command = {
	name: 'autocomplete',
	description: 'Generate shell autocomplete scripts',
	options: [
		{
			name: 'shell',
			alias: 's',
			type: 'string',
			description: 'Shell type (bash, zsh, fish)',
			required: true,
		},
	],
	action: (args) => {
		const shell = args.flags.shell as string;
		let script = '';

		switch (shell) {
			case 'bash':
				script = generateBashCompletion();
				break;
			case 'zsh':
				script = generateZshCompletion();
				break;
			case 'fish':
				script = generateFishCompletion();
				break;
			default:
				console.error(`Unsupported shell: ${shell}`);
				Deno.exit(1);
		}

		console.log(script);
	},
};

/**
 * Placeholder functions to generate completion scripts.
 * Implement actual script generation based on command registry.
 */
function generateBashCompletion(): string {
	return `# Bash completion script for Stega
_stega_completion() {
    COMPREPLY=($(compgen -W "$(stega help | grep '^  ' | awk '{print $1}')" -- "\\\${COMP_WORDS[COMP_CWORD]}"))
}
complete -F _stega_completion stega`;
}

function generateZshCompletion(): string {
	return `# Zsh completion script for Stega
#compdef stega

_stega_completion() {
    local commands
    commands=$(stega help | grep '^  ' | awk '{print $1}')
    _arguments "1: :(\\\${commands})"
}

compdef _stega_completion stega`;
}

function generateFishCompletion(): string {
	return `# Fish completion script for Stega
complete -c stega -f -a "(stega help | grep '^  ' | awk '{print $1}')" -d "Available commands"`;
}
