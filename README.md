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
deno install --allow-all -n stega ./src/index.ts
```

## Building Executables

Stega includes a powerful build command for generating standalone executables. For example:

```bash
# Build for current platform
stega build --output=./dist/stega

# Build for specific platforms
deno task build:linux    # Linux binary
deno task build:windows  # Windows executable
deno task build:macos   # macOS binary

# Build for all platforms
deno task build:all
```

See [Build Command Documentation](docs/build.md) for more details.
