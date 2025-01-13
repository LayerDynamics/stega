# Service Command

Manage system services with start, stop, restart, status, and logs subcommands.

## Usage

```bash
stega service <subcommand> [options]
```

### Subcommands

1. start:
   - --name=<string>: Service name (required)
   - --config=<string>: Path to service config file (required)

2. stop:
   - --name=<string>: Service name (required)
   - --force=<boolean>: Force stop (required)

3. restart:
   - --name=<string>: Service name (required)

4. status:
   - --name=<string>: Optional service name
   - --format=<string>: Output format (json|table)

5. logs:
   - --name=<string>: Service name (required)
   - --lines=<number>: Number of lines to show (default=50)
   - --follow=<boolean>: Follow log output (default=false)

## Examples

- Start a service:
  ```bash
  stega service start --name=api --config=services/api.json
  ```

- Stop a service with force:
  ```bash
  stega service stop --name=api --force=true
  ```

- Check service status in JSON format:
  ```bash
  stega service status --format=json
  ```

## Advanced Usage
Use the "autoRestart" setting in the service config to restart services on failure:
```json
{
  "name": "myapp",
  "command": "deno run mod.ts",
  "autoRestart": true,
  "maxRetries": 5,
  "healthCheck": {
    "endpoint": "http://localhost:8080/health",
    "interval": 30000,
    "timeout": 2000
  }
}
```
This restarts the service automatically up to five times.

## Troubleshooting
If a service does not start, ensure the "workingDirectory" is correct and the system has necessary permissions.

## Best Practices
- Carefully manage environment variables for each service to avoid conflicts.
- Use the healthCheck to detect issues early and trigger autoRestart for mission-critical services.

## Resource Management
- Set maxRetries to a reasonable value to prevent infinite restarts.
- Monitor CPU and memory usage using external tools or system logs.