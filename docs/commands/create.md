# Create Command

Create a new project with optional prompts.

## Usage

```bash
stega create [options]
```

### Options

- --name, -n: Project name
- --force, -f: Skip confirmation prompts
- --output, -o: Specify output format

## Example

```bash
stega create --name=mynewapp --force
```

## Customization
Mix prompt flags with config files to automate project creation. Example:
```bash
stega create --name=demo --force --output=json
```
Results can be redirected into scripts for further processing.

## Advanced Scaffolding
Include additional templates or recipes by specifying --template. This helps with preset config files.

## Integration
Combine "create" with "init" and "build" in script form to automate full project setup.