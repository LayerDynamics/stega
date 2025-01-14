// tests/config.test.ts
import { ConfigLoader } from "../src/config.ts";

import { assertEquals, assertRejects } from "@std/assert";

const TEST_CONFIG = {
	"test": "value",
	"number": 123,
	"boolean": true,
};

async function createTestConfig(content: unknown): Promise<string> {
	const path = await Deno.makeTempFile({ suffix: ".json" });
	await Deno.writeTextFile(path, JSON.stringify(content));
	return path;
}

Deno.test("Config - loads configuration file", async () => {
	const configPath = await createTestConfig(TEST_CONFIG);
	try {
		const loader = new ConfigLoader(configPath);
		const config = await loader.load();
		assertEquals(config.test, "value");
		assertEquals(config.number, 123);
		assertEquals(config.boolean, true);
	} finally {
		await Deno.remove(configPath);
	}
});

Deno.test("Config - handles missing config file", async () => {
	const loader = new ConfigLoader("/non/existent/path.json");
	const config = await loader.load();
	assertEquals(config, {});
});

Deno.test("Config - handles malformed JSON", async () => {
	const configPath = await Deno.makeTempFile();
	try {
		await Deno.writeTextFile(configPath, "invalid json");
		const loader = new ConfigLoader(configPath);
		await assertRejects(
			() => loader.load(),
			SyntaxError,
		);
	} finally {
		await Deno.remove(configPath);
	}
});

Deno.test("Config - environment variables override config", async () => {
	const configPath = await createTestConfig({ "test": "original" });
	try {
		Deno.env.set("TEST", "overridden");
		const loader = new ConfigLoader(configPath);
		const config = await loader.load();
		assertEquals(config.test, "overridden");
	} finally {
		Deno.env.delete("TEST");
		await Deno.remove(configPath);
	}
});

Deno.test("Config - get method returns correct values", async () => {
	const configPath = await createTestConfig(TEST_CONFIG);
	try {
		const loader = new ConfigLoader(configPath);
		await loader.load();
		assertEquals(loader.get("test"), "value");
		assertEquals(loader.get("number"), 123);
		assertEquals(loader.get("boolean"), true);
		assertEquals(loader.get("nonexistent"), undefined);
	} finally {
		await Deno.remove(configPath);
	}
});
