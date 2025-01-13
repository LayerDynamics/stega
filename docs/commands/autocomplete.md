# Autocomplete Command

Generate shell autocompletion scripts.

## Usage

```bash
stega autocomplete [options]
```

### Options

- --shell, -s=<string>: Shell type (bash, zsh, fish)

## Example

```bash
# For Bash:
stega autocomplete --shell=bash > ~/.bashrc

# For Zsh:
stega autocomplete --shell=zsh >> ~/.zshrc
```

## Persistence
Add the generated script to shell startup files:
```bash
stega autocomplete --shell=zsh >> ~/.zshrc
```
Reloading ensures autocompletion is always active.

## Advanced Subcommand Completions
Enhance the generated scripts to autocomplete sub-subcommands or frequent flags.

## Multi-Argument Suggestions
Prompt-based completions can offer multiple argument possibilities for more complex commands.