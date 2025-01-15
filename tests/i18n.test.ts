// tests/i18n.test.ts
import { I18n } from "../src/i18n.ts";
import { ConfigLoader } from "../src/config.ts";
import { assertEquals } from "https://deno.land/std@0.203.0/testing/asserts.ts";

Deno.test("i18n should load and retrieve messages correctly", async () => {
	const configLoader = new ConfigLoader();
	const config = await configLoader.load();
	const i18n = new I18n(config);
	await i18n.loadLocale("en");

	const message = i18n.t("available_commands");
	assertEquals(message, "Available Commands:"); // Message is already formatted by t()
});
