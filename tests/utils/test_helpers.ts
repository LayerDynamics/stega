import { CLI } from "../../src/core/core.ts";
import { MockLogger } from "./mock_logger.ts";
import { ensureDirSync } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";

export async function createTempFile(
	contentOrOptions: string | Deno.MakeTempOptions = {},
): Promise<string> {
	const tmpDir = Deno.env.get("TMPDIR") || "/tmp/test_tmp";
	ensureDirSync(tmpDir);

	const options = typeof contentOrOptions === "string" ? {} : contentOrOptions;

	const path = await Deno.makeTempFile({
		...options,
		dir: tmpDir,
	});

	if (typeof contentOrOptions === "string") {
		await Deno.writeTextFile(path, contentOrOptions);
	}

	return path;
}

export async function createTempDir(
	options: Deno.MakeTempOptions = {},
): Promise<string> {
	const tmpDir = Deno.env.get("TMPDIR") || "/tmp/test_tmp";
	ensureDirSync(tmpDir);
	return await Deno.makeTempDir({
		...options,
		dir: tmpDir,
	});
}

export function createTestCLI(): CLI {
	return new CLI(undefined, true, true, new MockLogger());
}
