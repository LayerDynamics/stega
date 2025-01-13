import { CLI } from "../../src/core.ts";
import { MockLogger } from "./mock_logger.ts";

export async function createTempFile(content: string): Promise<string> {
    const path = await Deno.makeTempFile();
    await Deno.writeTextFile(path, content);
    return path;
}

export function createTestCLI(): CLI {
    return new CLI(undefined, true, true, new MockLogger());
}
