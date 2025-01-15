// src/i18n.ts
import { Config } from "./config.ts";

export class I18n {
	private messages: Record<string, string> = {};
	private currentLocale = "en";

	constructor(private config: Config) {
		const locale = config["locale"] as string || "en";
		this.currentLocale = locale;
	}

	async load() {
		try {
			const data = await Deno.readTextFile(
				`./src/locales/${this.currentLocale}.json`,
			);
			this.messages = JSON.parse(data);
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error(
					`Failed to load locale ${this.currentLocale}: ${error.message}`,
				);
			} else {
				console.error(
					`Failed to load locale ${this.currentLocale}: ${String(error)}`,
				);
			}
			if (this.currentLocale !== "en") {
				await this.loadLocale("en");
			}
		}
	}

	async loadLocale(locale: string) {
		try {
			const data = await Deno.readTextFile(`./src/locales/${locale}.json`);
			this.messages = JSON.parse(data);
			this.currentLocale = locale;
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error(`Failed to load locale ${locale}: ${error.message}`);
			} else {
				console.error(`Failed to load locale ${locale}: ${String(error)}`);
			}
		}
	}

	t(key: string, placeholders?: Record<string, string | number>): string {
		let message = this.messages[key] || key;
		if (placeholders) {
			for (const [placeholder, value] of Object.entries(placeholders)) {
				message = message.replace(`{${placeholder}}`, String(value));
			}
		}
		return message;
	}
}
