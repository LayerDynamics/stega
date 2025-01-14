// tests/flag.test.ts
import { convertFlagValue } from "../src/flag.ts";
import { assertEquals, assertThrows } from "@std/assert";
Deno.test("Flag - converts boolean values", ()=>{
  assertEquals(convertFlagValue("true", "boolean"), true);
  assertEquals(convertFlagValue("1", "boolean"), true);
  assertEquals(convertFlagValue("false", "boolean"), false);
  assertEquals(convertFlagValue("0", "boolean"), false);
});
Deno.test("Flag - converts number values", ()=>{
  assertEquals(convertFlagValue("123", "number"), 123);
  assertEquals(convertFlagValue("-456", "number"), -456);
  assertEquals(convertFlagValue("3.14", "number"), 3.14);
  assertThrows(()=>{
    convertFlagValue("not-a-number", "number");
  }, Error, "Invalid number value");
});
Deno.test("Flag - converts array values", ()=>{
  assertEquals(convertFlagValue("a,b,c", "array"), [
    "a",
    "b",
    "c"
  ]);
  assertEquals(convertFlagValue("single", "array"), [
    "single"
  ]);
});
Deno.test("Flag - handles string values", ()=>{
  assertEquals(convertFlagValue("test", "string"), "test");
  assertEquals(convertFlagValue("123", "string"), "123");
  assertEquals(convertFlagValue("true", "string"), "true");
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9mbGFnLnRlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGVzdHMvZmxhZy50ZXN0LnRzXG5pbXBvcnQgeyBjb252ZXJ0RmxhZ1ZhbHVlIH0gZnJvbSBcIi4uL3NyYy9mbGFnLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnRFcXVhbHMsIGFzc2VydFRocm93cyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuXG5EZW5vLnRlc3QoXCJGbGFnIC0gY29udmVydHMgYm9vbGVhbiB2YWx1ZXNcIiwgKCkgPT4ge1xuXHRhc3NlcnRFcXVhbHMoY29udmVydEZsYWdWYWx1ZShcInRydWVcIiwgXCJib29sZWFuXCIpLCB0cnVlKTtcblx0YXNzZXJ0RXF1YWxzKGNvbnZlcnRGbGFnVmFsdWUoXCIxXCIsIFwiYm9vbGVhblwiKSwgdHJ1ZSk7XG5cdGFzc2VydEVxdWFscyhjb252ZXJ0RmxhZ1ZhbHVlKFwiZmFsc2VcIiwgXCJib29sZWFuXCIpLCBmYWxzZSk7XG5cdGFzc2VydEVxdWFscyhjb252ZXJ0RmxhZ1ZhbHVlKFwiMFwiLCBcImJvb2xlYW5cIiksIGZhbHNlKTtcbn0pO1xuXG5EZW5vLnRlc3QoXCJGbGFnIC0gY29udmVydHMgbnVtYmVyIHZhbHVlc1wiLCAoKSA9PiB7XG5cdGFzc2VydEVxdWFscyhjb252ZXJ0RmxhZ1ZhbHVlKFwiMTIzXCIsIFwibnVtYmVyXCIpLCAxMjMpO1xuXHRhc3NlcnRFcXVhbHMoY29udmVydEZsYWdWYWx1ZShcIi00NTZcIiwgXCJudW1iZXJcIiksIC00NTYpO1xuXHRhc3NlcnRFcXVhbHMoY29udmVydEZsYWdWYWx1ZShcIjMuMTRcIiwgXCJudW1iZXJcIiksIDMuMTQpO1xuXG5cdGFzc2VydFRocm93cyhcblx0XHQoKSA9PiB7XG5cdFx0XHRjb252ZXJ0RmxhZ1ZhbHVlKFwibm90LWEtbnVtYmVyXCIsIFwibnVtYmVyXCIpO1xuXHRcdH0sXG5cdFx0RXJyb3IsXG5cdFx0XCJJbnZhbGlkIG51bWJlciB2YWx1ZVwiLFxuXHQpO1xufSk7XG5cbkRlbm8udGVzdChcIkZsYWcgLSBjb252ZXJ0cyBhcnJheSB2YWx1ZXNcIiwgKCkgPT4ge1xuXHRhc3NlcnRFcXVhbHMoXG5cdFx0Y29udmVydEZsYWdWYWx1ZShcImEsYixjXCIsIFwiYXJyYXlcIiksXG5cdFx0W1wiYVwiLCBcImJcIiwgXCJjXCJdLFxuXHQpO1xuXHRhc3NlcnRFcXVhbHMoXG5cdFx0Y29udmVydEZsYWdWYWx1ZShcInNpbmdsZVwiLCBcImFycmF5XCIpLFxuXHRcdFtcInNpbmdsZVwiXSxcblx0KTtcbn0pO1xuXG5EZW5vLnRlc3QoXCJGbGFnIC0gaGFuZGxlcyBzdHJpbmcgdmFsdWVzXCIsICgpID0+IHtcblx0YXNzZXJ0RXF1YWxzKGNvbnZlcnRGbGFnVmFsdWUoXCJ0ZXN0XCIsIFwic3RyaW5nXCIpLCBcInRlc3RcIik7XG5cdGFzc2VydEVxdWFscyhjb252ZXJ0RmxhZ1ZhbHVlKFwiMTIzXCIsIFwic3RyaW5nXCIpLCBcIjEyM1wiKTtcblx0YXNzZXJ0RXF1YWxzKGNvbnZlcnRGbGFnVmFsdWUoXCJ0cnVlXCIsIFwic3RyaW5nXCIpLCBcInRydWVcIik7XG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxQkFBcUI7QUFDckIsU0FBUyxnQkFBZ0IsUUFBUSxpQkFBaUI7QUFDbEQsU0FBUyxZQUFZLEVBQUUsWUFBWSxRQUFRLGNBQWM7QUFFekQsS0FBSyxJQUFJLENBQUMsa0NBQWtDO0VBQzNDLGFBQWEsaUJBQWlCLFFBQVEsWUFBWTtFQUNsRCxhQUFhLGlCQUFpQixLQUFLLFlBQVk7RUFDL0MsYUFBYSxpQkFBaUIsU0FBUyxZQUFZO0VBQ25ELGFBQWEsaUJBQWlCLEtBQUssWUFBWTtBQUNoRDtBQUVBLEtBQUssSUFBSSxDQUFDLGlDQUFpQztFQUMxQyxhQUFhLGlCQUFpQixPQUFPLFdBQVc7RUFDaEQsYUFBYSxpQkFBaUIsUUFBUSxXQUFXLENBQUM7RUFDbEQsYUFBYSxpQkFBaUIsUUFBUSxXQUFXO0VBRWpELGFBQ0M7SUFDQyxpQkFBaUIsZ0JBQWdCO0VBQ2xDLEdBQ0EsT0FDQTtBQUVGO0FBRUEsS0FBSyxJQUFJLENBQUMsZ0NBQWdDO0VBQ3pDLGFBQ0MsaUJBQWlCLFNBQVMsVUFDMUI7SUFBQztJQUFLO0lBQUs7R0FBSTtFQUVoQixhQUNDLGlCQUFpQixVQUFVLFVBQzNCO0lBQUM7R0FBUztBQUVaO0FBRUEsS0FBSyxJQUFJLENBQUMsZ0NBQWdDO0VBQ3pDLGFBQWEsaUJBQWlCLFFBQVEsV0FBVztFQUNqRCxhQUFhLGlCQUFpQixPQUFPLFdBQVc7RUFDaEQsYUFBYSxpQkFBaUIsUUFBUSxXQUFXO0FBQ2xEIn0=
// denoCacheMetadata=12647670485232257741,5360793649164547219