// src/help.ts
import { Command, CommandRegistry } from './command.ts'; // Import Command from command.ts
import { I18n } from './i18n.ts';

export class Help {
	constructor(private registry: CommandRegistry, private i18n: I18n) {}

	/**
	 * Generates help text for a specific command or all commands.
	 * @param command The command to generate help for. If undefined, generates general help.
	 * @returns The help text as a string.
	 */
	generateHelp(command?: Command): string {
		let helpText = '';

		if (!command) {
			helpText += `${this.i18n.t('available_commands')}\n`;
			for (const cmd of this.registry.getCommands()) {
				helpText += `  ${cmd.name}\t${cmd.description || ''}\n`;
			}
			helpText += `\n${this.i18n.t('use_help')}\n`;
		} else {
			helpText += `\n${this.i18n.t('command')}: ${command.name}\n\n`;
			helpText += `${command.description || ''}\n\n`;

			if (command.options && command.options.length > 0) {
				helpText += `${this.i18n.t('options')}:\n`;
				for (const option of command.options) {
					const aliases = option.alias ? `, -${option.alias}` : '';
					const defaultValue = option.default !== undefined
						? ` (${this.i18n.t('default')}: ${option.default})`
						: '';
					helpText += `  --${option.name}${aliases}\t${
						option.description || ''
					}${defaultValue}\n`;
				}
				helpText += '\n';
			}

			if (command.subcommands && command.subcommands.length > 0) {
				helpText += 'Subcommands:\n';
				for (const sub of command.subcommands) {
					helpText += `  ${sub.name}\t${sub.description || ''}\n`;
				}
				helpText += '\n';
			}

			helpText += `Usage:\n  stega ${this.getUsage(command)}\n`;
		}

		return helpText;
	}

	/**
	 * Generates usage information for a command.
	 * @param command The command to generate usage for.
	 * @returns The usage string.
	 */
	getUsage(command: Command): string {
		let usage = command.name;

		if (command.subcommands && command.subcommands.length > 0) {
			usage += ' <subcommand>';
		}

		if (command.options && command.options.length > 0) {
			usage += ' [options]';
		}

		return usage;
	}
}
