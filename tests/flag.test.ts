// tests/flag.test.ts
import {convertFlagValue} from "../src/flag.ts";
import { assertEquals, assertThrows } from "@std/assert";

Deno.test("Flag - converts boolean values", () => {
    assertEquals(convertFlagValue("true", "boolean"), true);
    assertEquals(convertFlagValue("1", "boolean"), true);
    assertEquals(convertFlagValue("false", "boolean"), false);
    assertEquals(convertFlagValue("0", "boolean"), false);
});

Deno.test("Flag - converts number values", () => {
    assertEquals(convertFlagValue("123", "number"), 123);
    assertEquals(convertFlagValue("-456", "number"), -456);
    assertEquals(convertFlagValue("3.14", "number"), 3.14);

    assertThrows(() => {
        convertFlagValue("not-a-number", "number");
    }, Error, "Invalid number value");
});


Deno.test("Flag - converts array values", () => {
    assertEquals(
        convertFlagValue("a,b,c", "array"),
        ["a", "b", "c"]
    );
    assertEquals(
        convertFlagValue("single", "array"),
        ["single"]
    );
});

Deno.test("Flag - handles string values", () => {
    assertEquals(convertFlagValue("test", "string"), "test");
    assertEquals(convertFlagValue("123", "string"), "123");
    assertEquals(convertFlagValue("true", "string"), "true");
});

