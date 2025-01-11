
import {Command} from "../core.ts";
import { CLI } from "../core.ts";

export const autocompleteCommand: Command = {
    name: "autocomplete",
    description: "Generate shell autocompletion scripts",
    options: [
        {
            name: "shell",
            alias: "s",
            type: "string",
            description: "Shell type (bash, zsh, fish)",
            required: true,
        },
    ],
    action: async (args) => {
        const cli = args.cli as CLI;
        const shell = args.flags.shell as string;
        const commands = cli.getCommands().map(cmd => cmd.name).join(" ");

        switch (shell) {
            case "bash":
                console.log(generateBashCompletion(commands));
                break;
            case "zsh":
                console.log(generateZshCompletion(commands));
                break;
            case "fish":
                console.log(generateFishCompletion(commands));

                break;
            default:
                console.error(cli.i18n.t("unsupported_shell", { shell }));
                Deno.exit(1);
        }
    },
};

function generateBashCompletion(commands: string): string {
    return `# Bash completion script for stega
_stega_completion() {
    local cur prev commands
    commands="${commands}"
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    case "\${prev}" in
        stega)
            COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
            return 0
            ;;
        *)
            COMPREPLY=()
            return 0
            ;;
    esac
}

complete -F _stega_completion stega`;
}

function generateZshCompletion(commands: string): string {
    return `#compdef stega

_stega() {
    local -a commands
    commands=(${commands.split(" ").map(cmd => `"${cmd}:stega command"`).join(" ")})

    _arguments '1: :->command' '*: :->args'

    case $state in
        command)
            _describe 'command' commands
            ;;
    esac
}

_stega`;
}

function generateFishCompletion(commands: string): string {
    return `# Fish completion for stega
complete -c stega -f
${commands.split(" ").map(cmd =>
    `complete -c stega -n "__fish_use_subcommand" -a "${cmd}" -d "stega command"`
).join("\n")}`;
}
