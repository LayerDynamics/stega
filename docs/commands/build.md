# Build Command

Compile the CLI into a standalone binary.

## Usage

```bash
stega build [options]
```

### Options

- --output, -o=<string>: Output binary path (default=./stega)
- --target, -t=<string>: Target platform (linux, windows, darwin)
- --allow, -A=<array>: Permissions to embed (read, write, net, etc.)
- --entry, -e=<string>: Entry point file (default=src/main.ts)

## Example

```bash
stega build --target=windows --allow=read,run --output=dist/stega.exe
```

## Common Issues
1. Missing dependencies: Ensure "deno compile" has permission for all used APIs.  
2. Unsupported OS: The "target" must match the system's architecture.

## Debugging Build Issues
- Use deno --log-level=debug for more verbose output.
- Check version compatibility between your OS and the Deno binary.

## Plugin Extensions
Plugins can modify build steps if they implement beforeBuild or afterBuild hooks.