import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { CLI } from "../../src/core/core.ts";
import { MockLogger } from "./mock_logger.ts";

export interface TestContext {
	cli: CLI;
	logger: MockLogger;
	cleanup: () => Promise<void>;
}

export async function createTempFile(
	contentOrOptions: string | Deno.MakeTempOptions = {},
): Promise<string> {
	const tmpDir = Deno.env.get("TMPDIR") || "/tmp/test_tmp";
	await ensureDir(tmpDir);

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
	const baseDir = join(Deno.cwd(), "tests", "fixtures", "tmp");
	await ensureDir(baseDir);

	const tempDir = await Deno.makeTempDir({
		...options,
		dir: baseDir,
	});

	return tempDir;
}

export function createTestCLI(): CLI {
	return new CLI(undefined, true, true, new MockLogger());
}

export async function createTestPluginFile(content: string): Promise<string> {
	const pluginsDir = join(Deno.cwd(), "tests", "fixtures", "plugins");
	await ensureDir(pluginsDir);

	// Create deterministic filename based on content hash
	const encoder = new TextEncoder();
	const data = encoder.encode(content);
	const hash = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hash));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(
		"",
	);
	const filename = `test-plugin-${hashHex.slice(0, 8)}.ts`;

	const path = join(pluginsDir, filename);
	await Deno.writeTextFile(path, content);

	return path;
}

export async function createTestContext(): Promise<TestContext> {
	const logger = new MockLogger();
	const cli = new CLI(undefined, true, true, logger);

	// Create test directories
	const pluginsDir = join(Deno.cwd(), "tests", "fixtures", "plugins");
	const tmpDir = join(Deno.cwd(), "tests", "fixtures", "tmp");

	await Promise.all([
		ensureDir(pluginsDir),
		ensureDir(tmpDir),
	]);

	return {
		cli,
		logger,
		cleanup: async () => {
			logger.clear();

			// Preserve files if PRESERVE_TEST_FILES is set
			if (!Deno.env.get("PRESERVE_TEST_FILES")) {
				try {
					const entries = await Deno.readDir(pluginsDir);
					for await (const entry of entries) {
						if (entry.isFile && entry.name.endsWith(".ts")) {
							await Deno.remove(join(pluginsDir, entry.name))
								.catch((error) => {
									if (!(error instanceof Deno.errors.NotFound)) {
										console.warn(
											`Failed to remove file ${entry.name}: ${error}`,
										);
									}
								});
						}
					}
				} catch (error) {
					if (!(error instanceof Deno.errors.NotFound)) {
						console.warn(`Failed to cleanup test files: ${error}`);
					}
				}
			}
		},
	};
}
