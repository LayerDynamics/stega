# Batch Command

Execute multiple commands in sequence or parallel.

## Usage

```bash
stega batch [options]
```

### Options

- --commands, -c=<string>: Comma-separated list of commands to execute
- --parallel, -p=<boolean>: Run commands in parallel (default=false)

## Examples

- Run commands in sequence:
  ```bash
  stega batch --commands="init,build"
  ```
- Run commands in parallel:
  ```bash
  stega batch --commands="init,build,test" --parallel
  ```

## Advanced Chaining
Combine parallel and sequential batches for complex tasks:
```bash
stega batch --commands="init,build" && stega batch --parallel --commands="test,deploy"
```

## Scheduling
Use OS schedulers (cron, systemd) to run “batch” commands on a schedule for recurring tasks.

## Concurrency Limits
When --parallel is true, consider system resource constraints if running many commands concurrently.