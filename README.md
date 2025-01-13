# Stega - A Comprehensive Deno CLI Framework

Stega is a lightweight and modular CLI framework built with Deno, featuring argument parsing, flags, and subcommands.

## Features

- **Middleware Support**
- **Logging Integration**
- **Autocompletion Support**
- **Interactive Prompts**
- **Plugin System**
- **Output Formatting**
- **Enhanced Configuration**
- **Internationalization (i18n)**
- **Binary Executable Generation**

## Installation

```bash
deno install --allow-all -n stega mod.ts
```

## Core Features

### Command Management

Stega makes it easy to create and manage CLI commands:

```typescript
import { CLI, Command } from "./mod.ts";

const cli = new CLI();

const greetCommand: Command = {
    name: "greet",
    description: "Greet a user",
    options: [
        {
            name: "name",
            alias: "n",
            type: "string",
            required: true,
            description: "Name to greet"
        },
        {
            name: "excited",
            alias: "e",
            type: "boolean",
            default: false,
            description: "Add excitement"
        }
    ],
    action: (args) => {
        const name = args.flags.name;
        const excited = args.flags.excited;
        console.log(`Hello, ${name}${excited ? "!" : "."}`);
    }
};

cli.register(greetCommand);
```

### Plugin System

Extend functionality through plugins:

```typescript
const plugin = {
    metadata: {
        name: "my-plugin",
        version: "1.0.0"
    },
    init: (cli) => {
        cli.register({
            name: "custom-command",
            action: () => {
                console.log("Custom command executed");
            }
        });
    }
};

export default plugin;
```

### Template Engine

Generate code and content using templates:

```typescript
await cli.runCommand([
    "template",
    "generate",
    "--template=component",
    "--output=src/components/Button.tsx",
    "--variables",
    JSON.stringify({
        name: "Button",
        props: ["label", "onClick"]
    })
]);
```

### Workflow Automation

Automate sequences of commands:

```json
{
    "name": "build-and-deploy",
    "steps": [
        {
            "name": "build",
            "command": "build --target=production"
        },
        {
            "name": "test",
            "command": "test --coverage"
        },
        {
            "name": "deploy",
            "command": "deploy --env=prod",
            "condition": "process.env.BRANCH === 'main'"
        }
    ]
}
```

### Service Management

Manage long-running services:

```typescript
await cli.runCommand([
    "service",
    "start",
    "--name=api",
    "--config=services/api.json"
]);
```

### HTTP Commands

Make HTTP requests directly from the CLI:

```bash
stega http --method=POST \
           --url=https://api.example.com/data \
           --data='{"key": "value"}' \
           --headers="Content-Type:application/json,Authorization:Bearer token"
```

## Building Executables

Generate standalone executables for different platforms:

```bash
# Build for specific platform
stega build --target=linux --output=dist/stega

# Build for all platforms
stega build:all
```

## Configuration

Create a `stega.config.json` in your project root:

```json
{
    "plugins": [
        "stega-plugin-typescript",
        "stega-plugin-docker"
    ],
    "commands": {
        "build": {
            "target": "es2020",
            "outDir": "dist"
        }
    },
    "i18n": {
        "defaultLocale": "en",
        "locales": ["en", "es", "fr"]
    }
}
```

## Middleware

Add custom middleware for cross-cutting concerns:

```typescript
cli.use(async (args, command) => {
    console.log(`Executing command: ${command.name}`);
    const start = Date.now();
    await next();
    console.log(`Execution time: ${Date.now() - start}ms`);
});
```

## Shell Completion

Generate shell completion scripts:

```bash
# Generate completion script for bash
stega autocomplete --shell=bash > ~/.bashrc.d/stega-completion.bash

# Generate completion script for zsh
stega autocomplete --shell=zsh > ~/.zshrc.d/stega-completion.zsh
```

## Documentation

For detailed documentation on specific features:

- [Command System](docs/commands.md)
- [Plugin Development](docs/plugins.md)
- [Template Engine](docs/templates.md)
- [Workflow System](docs/workflows.md)
- [Service Management](docs/services.md)
- [Build System](docs/build.md)
- [i18n Support](docs/i18n.md)

## License

MIT License

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.
