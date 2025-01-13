# Init Command

Initialize the application environment.

## Usage

```bash
stega init [options]
```

### Options

- --log-level=<string>: Set logging level (DEBUG, INFO, WARN, ERROR)

## Example

```bash
stega init --log-level=DEBUG
```

## Plugin Initialization
If your CLI uses plugins, "init" can load them automatically. Place plugin references in "stega.config.json" under "plugins".

## Advanced Logging
Set more granular logging levels like DEBUG for plugin initialization details.

## Environment Configuration
By default, "init" can load environment variables from .env files if available for easier local setup.