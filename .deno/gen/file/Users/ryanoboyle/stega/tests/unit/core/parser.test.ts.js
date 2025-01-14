// tests/unit/core/parser.test.ts
import { Parser } from "../../../src/parser.ts";
import { TestHarness } from "../../utils/test_harness.ts";
import { assertEquals, assertRejects } from "@std/assert";
import { MissingFlagError } from "../../../src/error.ts";
import { createTestCLI } from "../../test_utils.ts";
Deno.test("Parser - comprehensive argument parsing", async (t)=>{
  const harness = new TestHarness();
  const { cli, logger } = await createTestCLI();
  await t.step("handles complex flag combinations", async ()=>{
    const parser = new Parser();
    cli.register({
      name: "test",
      options: [
        {
          name: "string",
          type: "string",
          required: true
        },
        {
          name: "number",
          type: "number"
        },
        {
          name: "boolean",
          type: "boolean"
        },
        {
          name: "array",
          type: "array"
        }
      ],
      action: ()=>{}
    });
    const args = parser.parse([
      "test",
      "--string=value",
      "--number=42",
      "--boolean",
      "--array=a,b,c"
    ], cli); // Pass CLI instance directly
    assertEquals(args.command, [
      "test"
    ]);
    assertEquals(args.flags.string, "value");
    assertEquals(args.flags.number, 42);
    assertEquals(args.flags.boolean, true);
    assertEquals(args.flags.array, [
      "a",
      "b",
      "c"
    ]);
  });
  await t.step("validates required flags", async ()=>{
    const parser = new Parser();
    // Register command with required flag
    cli.register({
      name: "validate-test",
      options: [
        {
          name: "required",
          type: "string",
          required: true
        }
      ],
      action: ()=>{}
    });
    // Should throw MissingFlagError
    await assertRejects(async ()=>{
      await cli.runCommand([
        "validate-test"
      ]);
    }, MissingFlagError, "Missing required flag: --required");
  });
  await harness.cleanup();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy91bml0L2NvcmUvcGFyc2VyLnRlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGVzdHMvdW5pdC9jb3JlL3BhcnNlci50ZXN0LnRzXG5pbXBvcnQgeyBQYXJzZXIgfSBmcm9tIFwiLi4vLi4vLi4vc3JjL3BhcnNlci50c1wiO1xuaW1wb3J0IHsgVGVzdEhhcm5lc3MgfSBmcm9tIFwiLi4vLi4vdXRpbHMvdGVzdF9oYXJuZXNzLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnRFcXVhbHMsIGFzc2VydFJlamVjdHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbmltcG9ydCB7IE1pc3NpbmdGbGFnRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vc3JjL2Vycm9yLnRzXCI7XG5pbXBvcnQgeyBjcmVhdGVUZXN0Q0xJIH0gZnJvbSBcIi4uLy4uL3Rlc3RfdXRpbHMudHNcIjtcblxuRGVuby50ZXN0KFwiUGFyc2VyIC0gY29tcHJlaGVuc2l2ZSBhcmd1bWVudCBwYXJzaW5nXCIsIGFzeW5jICh0KSA9PiB7XG5cdGNvbnN0IGhhcm5lc3MgPSBuZXcgVGVzdEhhcm5lc3MoKTtcblx0Y29uc3QgeyBjbGksIGxvZ2dlciB9ID0gYXdhaXQgY3JlYXRlVGVzdENMSSgpO1xuXG5cdGF3YWl0IHQuc3RlcChcImhhbmRsZXMgY29tcGxleCBmbGFnIGNvbWJpbmF0aW9uc1wiLCBhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgcGFyc2VyID0gbmV3IFBhcnNlcigpO1xuXHRcdGNsaS5yZWdpc3Rlcih7XG5cdFx0XHRuYW1lOiBcInRlc3RcIixcblx0XHRcdG9wdGlvbnM6IFtcblx0XHRcdFx0eyBuYW1lOiBcInN0cmluZ1wiLCB0eXBlOiBcInN0cmluZ1wiLCByZXF1aXJlZDogdHJ1ZSB9LFxuXHRcdFx0XHR7IG5hbWU6IFwibnVtYmVyXCIsIHR5cGU6IFwibnVtYmVyXCIgfSxcblx0XHRcdFx0eyBuYW1lOiBcImJvb2xlYW5cIiwgdHlwZTogXCJib29sZWFuXCIgfSxcblx0XHRcdFx0eyBuYW1lOiBcImFycmF5XCIsIHR5cGU6IFwiYXJyYXlcIiB9LFxuXHRcdFx0XSxcblx0XHRcdGFjdGlvbjogKCkgPT4ge30sXG5cdFx0fSk7XG5cblx0XHRjb25zdCBhcmdzID0gcGFyc2VyLnBhcnNlKFtcblx0XHRcdFwidGVzdFwiLFxuXHRcdFx0XCItLXN0cmluZz12YWx1ZVwiLFxuXHRcdFx0XCItLW51bWJlcj00MlwiLFxuXHRcdFx0XCItLWJvb2xlYW5cIixcblx0XHRcdFwiLS1hcnJheT1hLGIsY1wiLFxuXHRcdF0sIGNsaSk7IC8vIFBhc3MgQ0xJIGluc3RhbmNlIGRpcmVjdGx5XG5cblx0XHRhc3NlcnRFcXVhbHMoYXJncy5jb21tYW5kLCBbXCJ0ZXN0XCJdKTtcblx0XHRhc3NlcnRFcXVhbHMoYXJncy5mbGFncy5zdHJpbmcsIFwidmFsdWVcIik7XG5cdFx0YXNzZXJ0RXF1YWxzKGFyZ3MuZmxhZ3MubnVtYmVyLCA0Mik7XG5cdFx0YXNzZXJ0RXF1YWxzKGFyZ3MuZmxhZ3MuYm9vbGVhbiwgdHJ1ZSk7XG5cdFx0YXNzZXJ0RXF1YWxzKGFyZ3MuZmxhZ3MuYXJyYXksIFtcImFcIiwgXCJiXCIsIFwiY1wiXSk7XG5cdH0pO1xuXG5cdGF3YWl0IHQuc3RlcChcInZhbGlkYXRlcyByZXF1aXJlZCBmbGFnc1wiLCBhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgcGFyc2VyID0gbmV3IFBhcnNlcigpO1xuXG5cdFx0Ly8gUmVnaXN0ZXIgY29tbWFuZCB3aXRoIHJlcXVpcmVkIGZsYWdcblx0XHRjbGkucmVnaXN0ZXIoe1xuXHRcdFx0bmFtZTogXCJ2YWxpZGF0ZS10ZXN0XCIsXG5cdFx0XHRvcHRpb25zOiBbe1xuXHRcdFx0XHRuYW1lOiBcInJlcXVpcmVkXCIsXG5cdFx0XHRcdHR5cGU6IFwic3RyaW5nXCIsXG5cdFx0XHRcdHJlcXVpcmVkOiB0cnVlLFxuXHRcdFx0fV0sXG5cdFx0XHRhY3Rpb246ICgpID0+IHt9LFxuXHRcdH0pO1xuXG5cdFx0Ly8gU2hvdWxkIHRocm93IE1pc3NpbmdGbGFnRXJyb3Jcblx0XHRhd2FpdCBhc3NlcnRSZWplY3RzKFxuXHRcdFx0YXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRhd2FpdCBjbGkucnVuQ29tbWFuZChbXCJ2YWxpZGF0ZS10ZXN0XCJdKTtcblx0XHRcdH0sXG5cdFx0XHRNaXNzaW5nRmxhZ0Vycm9yLFxuXHRcdFx0XCJNaXNzaW5nIHJlcXVpcmVkIGZsYWc6IC0tcmVxdWlyZWRcIixcblx0XHQpO1xuXHR9KTtcblxuXHRhd2FpdCBoYXJuZXNzLmNsZWFudXAoKTtcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGlDQUFpQztBQUNqQyxTQUFTLE1BQU0sUUFBUSx5QkFBeUI7QUFDaEQsU0FBUyxXQUFXLFFBQVEsOEJBQThCO0FBQzFELFNBQVMsWUFBWSxFQUFFLGFBQWEsUUFBUSxjQUFjO0FBQzFELFNBQVMsZ0JBQWdCLFFBQVEsd0JBQXdCO0FBQ3pELFNBQVMsYUFBYSxRQUFRLHNCQUFzQjtBQUVwRCxLQUFLLElBQUksQ0FBQywyQ0FBMkMsT0FBTztFQUMzRCxNQUFNLFVBQVUsSUFBSTtFQUNwQixNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU07RUFFOUIsTUFBTSxFQUFFLElBQUksQ0FBQyxxQ0FBcUM7SUFDakQsTUFBTSxTQUFTLElBQUk7SUFDbkIsSUFBSSxRQUFRLENBQUM7TUFDWixNQUFNO01BQ04sU0FBUztRQUNSO1VBQUUsTUFBTTtVQUFVLE1BQU07VUFBVSxVQUFVO1FBQUs7UUFDakQ7VUFBRSxNQUFNO1VBQVUsTUFBTTtRQUFTO1FBQ2pDO1VBQUUsTUFBTTtVQUFXLE1BQU07UUFBVTtRQUNuQztVQUFFLE1BQU07VUFBUyxNQUFNO1FBQVE7T0FDL0I7TUFDRCxRQUFRLEtBQU87SUFDaEI7SUFFQSxNQUFNLE9BQU8sT0FBTyxLQUFLLENBQUM7TUFDekI7TUFDQTtNQUNBO01BQ0E7TUFDQTtLQUNBLEVBQUUsTUFBTSw2QkFBNkI7SUFFdEMsYUFBYSxLQUFLLE9BQU8sRUFBRTtNQUFDO0tBQU87SUFDbkMsYUFBYSxLQUFLLEtBQUssQ0FBQyxNQUFNLEVBQUU7SUFDaEMsYUFBYSxLQUFLLEtBQUssQ0FBQyxNQUFNLEVBQUU7SUFDaEMsYUFBYSxLQUFLLEtBQUssQ0FBQyxPQUFPLEVBQUU7SUFDakMsYUFBYSxLQUFLLEtBQUssQ0FBQyxLQUFLLEVBQUU7TUFBQztNQUFLO01BQUs7S0FBSTtFQUMvQztFQUVBLE1BQU0sRUFBRSxJQUFJLENBQUMsNEJBQTRCO0lBQ3hDLE1BQU0sU0FBUyxJQUFJO0lBRW5CLHNDQUFzQztJQUN0QyxJQUFJLFFBQVEsQ0FBQztNQUNaLE1BQU07TUFDTixTQUFTO1FBQUM7VUFDVCxNQUFNO1VBQ04sTUFBTTtVQUNOLFVBQVU7UUFDWDtPQUFFO01BQ0YsUUFBUSxLQUFPO0lBQ2hCO0lBRUEsZ0NBQWdDO0lBQ2hDLE1BQU0sY0FDTDtNQUNDLE1BQU0sSUFBSSxVQUFVLENBQUM7UUFBQztPQUFnQjtJQUN2QyxHQUNBLGtCQUNBO0VBRUY7RUFFQSxNQUFNLFFBQVEsT0FBTztBQUN0QiJ9
// denoCacheMetadata=16065961434009780912,14276036847187667978