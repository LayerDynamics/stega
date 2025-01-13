import { assertRejects } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { createServiceCommand } from "../../src/commands/service_command.ts";
import type { Command } from "../../src/command.ts";
import { createTestCLI, createTempFile } from "../utils/test_helpers.ts";

// ...existing service command tests...
