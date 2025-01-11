# Build Command

The `build` command compiles your CLI into a standalone binary executable, enabling distribution without Deno dependencies.

## Usage

```bash
stega build [options]
```

## Options

- `--output, -o`: Output binary path (default: ./stega)
- `--target, -t`: Target platform (linux, windows, darwin)
- `--allow, -A`: Permissions to embed (read, write, net, etc.)
- `--entry, -e`: Entry point file (default: src/main.ts)

## Examples

```bash
# Basic build
stega build --output=./dist/cli

# Cross-platform build
stega build --target=windows --output=./dist/cli.exe

# With permissions
stega build --allow=read --allow-net
```

## Supported Targets

- Linux (x86_64-unknown-linux-gnu)
- Windows (x86_64-pc-windows-msvc)
- macOS (x86_64-apple-darwin)
- Linux ARM (aarch64-unknown-linux-gnu)
- Windows ARM (aarch64-pc-windows-msvc)
- macOS ARM (aarch64-apple-darwin)
