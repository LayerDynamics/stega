// src/main.ts
import { CLI } from "./core/core.ts";
import { createCommand } from "./commands/create.ts";
import { loggingMiddleware } from "./middleware/logger.ts";
import { initCommand } from "./commands/init.ts";
import { autocompleteCommand } from "./autocomplete.ts";

const cli = new CLI();

// Register middleware
cli.use(loggingMiddleware);

// Register commands
cli.register(createCommand);
cli.register(initCommand);
cli.register(autocompleteCommand);

// Run the CLI
await cli.run();
