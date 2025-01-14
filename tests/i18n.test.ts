// tests/i18n.test.ts
import { I18n } from "../src/i18n.ts";
import { ConfigLoader } from "../src/config.ts";
import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";

Deno.test("i18n should load and retrieve messages correctly", async () => {
	// Mock ConfigLoader with English locale
	const loader = new ConfigLoader();
	const config = { locale: "en" };
	loader.load = () => Promise.resolve(config);
	const i18n = new I18n(config);
	await i18n.load();

	assertEquals(i18n.t("available_commands"), "Available Commands:");
	assertEquals(
		i18n.t("command_not_found", { command: "test" }),
		'Command "test" not found.',
	);
});
