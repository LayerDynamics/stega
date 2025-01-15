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

export async function createTempDir(): Promise<string> {
	const tmpDir = join(Deno.cwd(), "tests", "fixtures", "tmp");
	await ensureDir(tmpDir);
	return tmpDir;
}

export function createTestCLI(): CLI {
	return new CLI(undefined, true, true, new MockLogger());
}

export async function createTestPluginFile(content: string): Promise<string> {
	// Use a fixed plugins directory under test fixtures
	const pluginsDir = join(Deno.cwd(), "tests", "fixtures", "plugins");
	await ensureDir(pluginsDir);

	// Create a deterministic filename based on content hash
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

	// Ensure test directories exist
	await ensureDir(join(Deno.cwd(), "tests", "fixtures", "plugins"));
	await ensureDir(join(Deno.cwd(), "tests", "fixtures", "tmp"));

	return {
		cli,
		logger,
		cleanup: async () => {
			logger.clear();
			// Files are preserved for coverage when PRESERVE_TEST_FILES is set
			if (!Deno.env.get("PRESERVE_TEST_FILES")) {
				const pluginsDir = join(Deno.cwd(), "tests", "fixtures", "plugins");
				try {
					for (const entry of Deno.readDirSync(pluginsDir)) {
						if (entry.isFile && entry.name.endsWith(".ts")) {
							await Deno.remove(join(pluginsDir, entry.name));
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
