// tests/commands/http_command.test.ts
import {
	assertEquals,
	assertRejects,
} from "https://deno.land/std@0.224.0/testing/asserts.ts";
import {createHttpCommand} from "../../src/commands/http_command.ts";
import {createTestCLI,mockFetchWithAbort} from "../test_utils.ts";

interface MockResponse {
	success?: boolean;
	message?: string;
	error?: string;
	[key: string]: unknown;
}

Deno.test("HTTP Command - Basic GET request",async (t) => {
	await t.step("handles requests", async () => {
		const { cli } = await createTestCLI();
		const command=createHttpCommand({});
		cli.register(command);

		let capturedRequest: RequestInit|undefined;
		const originalFetch=globalThis.fetch;
		globalThis.fetch=async (input: string|URL|Request,init?: RequestInit) => {
			capturedRequest=init;
			return new Response(JSON.stringify({success: true}),{status: 200});
		};

		try {
			await cli.runCommand([
				"http",
				"--method=GET",
				"--url=https://api.example.com/test",
				"--headers=Accept:application/json",
			]);

			assertEquals(capturedRequest?.method,"GET");
			assertEquals(
				(capturedRequest?.headers as Record<string,string>)["Accept"],
				"application/json"
			);
		} finally {
			globalThis.fetch=originalFetch;
		}
	});
});

Deno.test("HTTP Command - POST request with data",async (t) => {
	await t.step("handles requests", async () => {
		const { cli } = await createTestCLI();
		const command=createHttpCommand({});
		cli.register(command);

		let capturedRequest: {
			method?: string;
			body?: string;
			headers?: Record<string,string>;
		}={};
		const originalFetch=globalThis.fetch;

		globalThis.fetch=async (input: string|URL|Request,init?: RequestInit) => {
			if(init) {
				capturedRequest={
					method: init.method,
					body: init.body as string,
					headers:
						init.headers instanceof Headers
							? Object.fromEntries(init.headers.entries())
							:(init.headers as Record<string,string>),
				};
			}
			return new Response(JSON.stringify({success: true}),{status: 200});
		};

		try {
			const testData={test: "value"};
			await cli.runCommand([
				"http",
				"--method=POST",
				"--url=https://api.example.com/test",
				`--data=${JSON.stringify(testData)}`,
				"--headers=Content-Type:application/json",
			]);

			assertEquals(capturedRequest.method,"POST");
			assertEquals(JSON.parse(capturedRequest.body||"{}"),testData);
			assertEquals(capturedRequest.headers?.["Content-Type"],"application/json");
		} finally {
			globalThis.fetch=originalFetch;
		}
	});
});

Deno.test("HTTP Command - Handles network errors",async (t) => {
	await t.step("handles requests", async () => {
		const { cli } = await createTestCLI();
		const command=createHttpCommand({});
		cli.register(command);

		const originalFetch=globalThis.fetch;
		globalThis.fetch=() => {
			throw new TypeError("Failed to fetch");
		};

		try {
			await assertRejects(
				() =>
					cli.runCommand([
						"http",
						"--method=GET",
						"--url=https://api.example.com/test",
					]),
				Error,
				"Network error"
			);
		} finally {
			globalThis.fetch=originalFetch;
		}
	});
});

Deno.test("HTTP Command - Handles timeout",async (t) => {
	await t.step("handles requests", async () => {
		const { cli } = await createTestCLI();
		const command=createHttpCommand({
			httpOptions: {
				timeout: 100, // Short timeout for testing
			},
		});
		cli.register(command);

		const originalFetch=globalThis.fetch;
		globalThis.fetch=mockFetchWithAbort(200,{success: true},200); // Delay longer than timeout

		try {
			await assertRejects(
				() =>
					cli.runCommand([
						"http",
						"--method=GET",
						"--url=https://api.example.com/test",
					]),
				Error,
				"Network error: Request timeout"
			);
		} finally {
			globalThis.fetch=originalFetch;
		}
	});
});

Deno.test("HTTP Command - Handles retry logic",async (t) => {
	await t.step("handles requests", async () => {
		const { cli } = await createTestCLI();
		let attempts=0;

		const command=createHttpCommand({
			httpOptions: {
				retries: 2,
			},
		});
		cli.register(command);

		const originalFetch=globalThis.fetch;
		globalThis.fetch=mockFetchWithAbort(200,{success: true},100);
		// Modify the mock to fail the first two attempts
		globalThis.fetch=(input: string|URL|Request,init?: RequestInit) => {
			attempts++;
			if(attempts<3) {
				return new Promise<Response>((_,reject) => {
					const timer=setTimeout(() => {
						reject(new Error("Temporary failure"));
					},100);
					if(init?.signal) {
						init.signal.addEventListener("abort",() => {
							clearTimeout(timer);
							reject(new DOMException("Aborted","AbortError"));
						});
					}
				});
			}
			return mockFetchWithAbort(200,{success: true},100)(input,init);
		};

		try {
			await cli.runCommand([
				"http",
				"--method=GET",
				"--url=https://api.example.com/test",
			]);

			assertEquals(attempts,3,"Should have attempted 3 times");
		} finally {
			globalThis.fetch=originalFetch;
		}
	});
});

Deno.test("HTTP Command - Handles HTTP errors",async (t) => {
	await t.step("handles requests", async () => {
		const { cli } = await createTestCLI();
		const command=createHttpCommand({
			httpOptions: {
				validateStatus: (status) => status===200,
			},
		});
		cli.register(command);

		const originalFetch=globalThis.fetch;
		globalThis.fetch=mockFetchWithAbort(404,{success: false,message: "Not found"});

		try {
			await assertRejects(
				() =>
					cli.runCommand([
						"http",
						"--method=GET",
						"--url=https://api.example.com/test",
					]),
				Error,
				"HTTP error 404"
			);
		} finally {
			globalThis.fetch=originalFetch;
		}
	});
});
