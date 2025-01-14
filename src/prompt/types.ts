export interface PromptOptions {
	message: string;
	default?: unknown;
	prefix?: string;
	indent?: string;
	transform?: (value: string) => string | Promise<string>;
	validate?: (value: string) => boolean | string | Promise<boolean | string>;
}

export interface InputOptions extends PromptOptions {
	minLength?: number;
	maxLength?: number;
	secret?: boolean;
	suggestions?: string[];
}

export interface SelectOptions extends PromptOptions {
	options: Array<{ name: string; value: string }>;
	searchable?: boolean;
	hint?: string;
	pointer?: string;
}

export type KeyPressEvent = {
	key: string;
	ctrl: boolean;
	meta: boolean;
	shift: boolean;
	sequence: string;
};

export interface PromptState {
	value: string;
	cursorOffset: number;
	done: boolean;
	aborted: boolean;
}
