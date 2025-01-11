
---

### **b. `docs/api.md`**

**Purpose:**
Provide detailed API documentation for developers who wish to extend or integrate with Stega.

**Content:**

```markdown
# API Documentation

## Classes

### `CLI`

The main class to initialize and run the CLI application.

**Methods:**

- `register(command: Command)`: Registers a new command.
- `run()`: Parses arguments and executes the appropriate command.

### `CommandRegistry`

Manages the registration and retrieval of commands.

**Methods:**

- `register(command: Command)`: Adds a new command to the registry.
- `getCommands(): Command[]`: Returns all registered commands.
- `findCommand(name: string): Command | undefined`: Finds a command by name or alias.
- `findSubcommand(command: Command, subcommandPath: string[]): Command | undefined`: Finds a subcommand based on the provided path.

### `Parser`

Parses command-line arguments into commands and flags.

**Methods:**

- `parse(argv: string[]): Args`: Parses the provided arguments.

### `Help`

Generates help and usage information.

**Methods:**

- `generateHelp(command?: Command): string`: Generates help text for a specific command or all commands.
- `getUsage(command: Command): string`: Generates usage information for a command.

### `ConfigLoader`

Loads configuration from a file and environment variables.

**Methods:**

- `load(): Promise<Config>`: Loads the configuration.
- `get(key: string): any`: Retrieves a configuration value by key.

### `StegaError` and Subclasses

Custom error classes for Stega.

- `StegaError`: Base error class.
- `MissingFlagError`: Thrown when a required flag is missing.
- `InvalidFlagValueError`: Thrown when a flag has an invalid value type.
- `CommandNotFoundError`: Thrown when a specified command doesn't exist.
- `SubcommandNotFoundError`: Thrown when a specified subcommand doesn't exist.

## Interfaces

### `Command`

Represents a CLI command.

**Properties:**

- `name: string`: The name of the command.
- `description?: string`: A brief description of the command.
- `options?: Option[]`: An array of options/flags for the command.
- `subcommands?: Command[]`: An array of subcommands.
- `action: (args: Args) => void | Promise<void>`: The function to execute when the command is invoked.
- `aliases?: string[]`: Alternative names for the command.

### `Option`

Represents a command-line option or flag.

**Properties:**

- `name: string`: The long name of the flag (e.g., `verbose` for `--verbose`).
- `alias?: string`: The short alias for the flag (e.g., `v` for `-v`).
- `description?: string`: A brief description of the flag.
- `type: 'boolean' | 'string' | 'number' | 'array'`: The type of the flag value.
- `default?: any`: The default value if the flag is not provided.
- `required?: boolean`: Whether the flag is required.

### `Args`

Represents parsed arguments.

**Properties:**

- `command: string[]`: An array of commands and subcommands.
- `flags: Record<string, any>`: An object containing flag names and their values.
