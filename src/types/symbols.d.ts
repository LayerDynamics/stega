declare global {
	interface SymbolConstructor {
		readonly asyncDispose: unique symbol;
	}

	interface AsyncDisposable {
		[Symbol.asyncDispose](): Promise<void>;
	}
}

export {};