# Stega User Guide

## Introduction

Stega is a comprehensive CLI framework built with Deno, featuring advanced command management, plugin support, and extensive customization options. This guide will walk you through using Stega effectively in your projects.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core Concepts](#core-concepts)
3. [Command System](#command-system)
4. [Configuration](#configuration)
5. [Plugins](#plugins)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### Installation

Install Stega using Deno:

```bash
deno install --allow-all -n stega mod.ts
```

### Basic Usage

Create a new CLI application:

```typescript
import { CLI, Command } from "./mod.ts";

const cli = new CLI();

// Register a simple command
const greetCommand: Command = {
    name: "greet",
    description: "Greet a user",
    options: [
        {
            name: "name",
            type: "string",
            required: true,
            description: "Name to greet"
        }
    ],
    action: (args) => {
        console.log(`Hello, ${args.flags.name}!`);
    }
};

cli.register(greetCommand);

// Run the CLI
await cli.run();
```

## Core Concepts

### Commands

Commands are the basic building blocks of your CLI application. Each command has:

- A unique name
- Optional description
- Configurable options/flags
- An action to execute
- Optional subcommands

### Flags and Options

Flags modify command behavior:

```typescript
const command: Command = {
    name: "example",
    options: [
        {
            name: "verbose",
            alias: "v",
            type: "boolean",
            description: "Enable verbose output"
        },
        {
            name: "output",
            alias: "o",
            type: "string",
            required: true,
            description: "Output file path"
        }
    ],
    action: (args) => {
        // Access flags via args.flags
        const verbose = args.flags.verbose;
        const output = args.flags.output;
    }
};
```

### Subcommands

Create hierarchical command structures:

```typescript
const parentCommand: Command = {
    name: "parent",
    subcommands: [
        {
            name: "child",
            action: () => {
                console.log("Child command executed");
            }
        }
    ],
    action: () => {
        console.log("Parent command executed");
    }
};
```

## Configuration

### Configuration File

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

### Environment Variables

Override configuration using environment variables:

```bash
STEGA_LOG_LEVEL=debug stega command
```

## Plugins

### Using Plugins

Load plugins in your CLI:

```typescript
const cli = new CLI();
await cli.loadPlugins([
    "./plugins/custom-plugin.ts"
]);
```

### Creating Plugins

Create a plugin:

```typescript
const plugin: Plugin = {
    metadata: {
        name: "my-plugin",
        version: "1.0.0"
    },
    init: async (cli) => {
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

## Advanced Features

### Middleware

Add middleware for cross-cutting concerns:

```typescript
cli.use(async (args, command, next) => {
    console.log(`Executing command: ${command.name}`);
    const start = Date.now();
    await next();
    console.log(`Execution time: ${Date.now() - start}ms`);
});
```

### Templates

Use the template system:

```typescript
await cli.runCommand([
    "template",
    "generate",
    "--template=component",
    "--output=src/Button.tsx",
    "--variables",
    JSON.stringify({
        name: "Button",
        props: ["label", "onClick"]
    })
]);
```

### Workflows

Create automated workflows:

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

## Troubleshooting

### Common Issues

1. **Command Not Found**
   - Ensure command is registered
   - Check command name spelling
   - Verify plugin loading

2. **Permission Errors**
   - Check Deno permissions
   - Verify file access rights
   - Review environment variables

3. **Plugin Loading Failures**
   - Validate plugin format
   - Check plugin compatibility
   - Review plugin dependencies

### Debugging

Enable debug logging:

```bash
STEGA_LOG_LEVEL=debug stega command
```

### Getting Help

Use the built-in help system:

```bash
stega help [command]
```

## Best Practices

1. **Command Organization**
   - Group related commands
   - Use meaningful command names
   - Provide clear descriptions

2. **Error Handling**
   - Validate inputs
   - Provide meaningful errors
   - Handle edge cases

3. **Performance**
   - Use lazy loading
   - Optimize plugin loading
   - Cache when appropriate

4. **Security**
   - Validate all inputs
   - Use minimum required permissions
   - Follow security guidelines

## Further Reading

- [API Documentation](./api.md)
- [Plugin Development Guide](./plugins.md)
- [Command Reference](./commands.md)
- [Security Guidelines](./security.md)
