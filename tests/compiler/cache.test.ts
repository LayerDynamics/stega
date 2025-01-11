import {assertEquals} from "@std/assert";
import {Cache} from "../../src/compiler/cache.ts";

Deno.test("Cache - stores and retrieves values",async () => {
	const cache=new Cache();
	const key="test-key";
	const value={foo: "bar"};
	const contents="some content";

	await cache.set(key,value,contents); // Provided all 3 arguments
	const retrieved=await cache.get(key,contents); // Provided both key and contents
	assertEquals(retrieved,value);
});

Deno.test("Cache - handles non-existent keys",async () => {
	const cache=new Cache();
	const contents="non-existent content";
	const retrieved=await cache.get("non-existent",contents); // Provided both key and contents
	assertEquals(retrieved,undefined);
});
