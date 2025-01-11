// tests/middleware.test.ts
import {CLI} from "../src/core.ts";
import {assertEquals} from "https://deno.land/std@0.203.0/testing/asserts.ts";

Deno.test("Middleware should execute before command action",async () => {
    const cli=new CLI(undefined,true,true);

    let middlewareExecuted=false;
    let actionExecuted=false;

    // Register middleware
    cli.use((_args, _command) => {
        middlewareExecuted=true;
    });

    // Register command
    cli.register({
        name: "test",
        action: () => {
            actionExecuted=true;
        },
    });

    // Mock Deno.args
    const originalArgs=Deno.args;
    Object.defineProperty(Deno,'args',{value: ["test"]});

    await cli.run();

    // Restore Deno.args
    Object.defineProperty(Deno,'args',{value: originalArgs});

    assertEquals(middlewareExecuted,true);
    assertEquals(actionExecuted,true);
});
