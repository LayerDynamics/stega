# Stega: Advanced CLI Framework for Deno

> A powerful, type-safe CLI framework for Deno featuring comprehensive command management, workflow automation, and plugin architecture.

[![CI Status](https://github.com/layerdynamics/stega/workflows/CI/badge.svg)](https://github.com/layerdynamics/stega/actions)
[![Documentation](https://img.shields.io/badge/docs-latest-blue.svg)](https://github.com/layerdynamics/stega/wiki)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

Stega is a modern CLI framework built for Deno that enables developers to create sophisticated command-line applications with features like workflow automation, template generation, and service management. It combines type safety with powerful abstractions to streamline CLI development.

### Key Features

- **Type-Safe Command System**: Declarative command definitions with TypeScript support
- **Advanced Workflow Automation**: Define and execute complex task sequences
- **Template Engine**: Generate code and content using customizable templates
- **Service Management**: Control and monitor long-running services
- **HTTP Client**: Make HTTP requests directly from the command line
- **Plugin Architecture**: Extend functionality through a modular plugin system
- **Internationalization**: Built-in i18n support for multiple languages
- **Configuration Management**: Flexible configuration through files and environment variables

## Installation

```bash
# Install from deno.land/x
deno install --allow-all -n stega https://deno.land/x/stega/mod.ts

# Or clone and install locally
git clone https://github.com/layerdynamics/stega.git
cd stega
deno install --allow-all -n stega mod.ts
```

## Quick Start

1. Create a new CLI application:

```typescript
// main.ts
import { CLI, Command } from "https://deno.land/x/stega/mod.ts";

const cli = new CLI();

// Define a command
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

// Register and run
cli.register(greetCommand);
await cli.run();
```

2. Run your CLI:

```bash
deno run --allow-all main.ts greet --name="World" --excited
```

## Core Features

### Command Management

Define commands with rich metadata and validation:

```typescript
const command: Command = {
    name: "deploy",
    description: "Deploy the application",
    category: "operations",
    options: [
        {
            name: "environment",
            type: "string",
            required: true,
            description: "Target environment"
        }
    ],
    action: async (args) => {
        // Command implementation
    }
};
```

### Workflow Automation

Create complex automation workflows:

```json
{
    "name": "deploy-pipeline",
    "steps": [
        {
            "name": "build",
            "command": "build --target=production"
        },
        {
            "name": "test",
            "command": "test --coverage",
            "parallel": true
        },
        {
            "name": "deploy",
            "command": "deploy --env=prod",
            "condition": "process.env.BRANCH === 'main'"
        }
    ]
}
```

### Template Generation

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

### Service Management

Control and monitor services:

```bash
# Start a service
stega service start --name=api --config=services/api.json

# Monitor service status
stega service status --name=api --format=json

# View service logs
stega service logs --name=api --follow
```

### HTTP Client

Make HTTP requests:

```bash
stega http --method=POST \
           --url=https://api.example.com/data \
           --data='{"key": "value"}' \
           --headers="Content-Type:application/json"
```

## Plugin System

Extend functionality through plugins:

```typescript
const plugin: Plugin = {
    metadata: {
        name: "custom-plugin",
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

## Configuration

Create a `stega.config.json` for project-wide settings:

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

## Development

```bash
# Clone repository
git clone https://github.com/layerdynamics/stega.git
cd stega

# Install dependencies
deno cache mod.ts

# Run tests
deno task test

# Build
deno task build

# Format code
deno task fmt
```

## Documentation

- [User Guide](docs/user-guide.md)
- [API Reference](docs/api.md)
- [Plugin Development](docs/plugins.md)
- [Command Reference](docs/commands.md)
- [Advanced Features](docs/advanced.md)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- [GitHub Issues](https://github.com/layerdynamics/stega/issues)
- [Documentation](https://github.com/layerdynamics/stega/wiki)
- [Discord Community](https://discord.gg/stega)

## Acknowledgments

Special thanks to all our contributors and the Deno community.
