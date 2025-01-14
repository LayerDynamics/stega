// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { fnv32, fnv32a } from "./fnv32.ts";
import { fnv64, fnv64a } from "./fnv64.ts";
export function fnv(name, buf) {
  if (!buf) {
    throw new TypeError("no data provided for hashing");
  }
  switch(name){
    case "FNV32":
      return fnv32(buf);
    case "FNV64":
      return fnv64(buf);
    case "FNV32A":
      return fnv32a(buf);
    case "FNV64A":
      return fnv64a(buf);
    default:
      throw new TypeError(`unsupported fnv digest: ${name}`);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIwMy4wL2NyeXB0by9fZm52L21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIzIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBmbnYzMiwgZm52MzJhIH0gZnJvbSBcIi4vZm52MzIudHNcIjtcbmltcG9ydCB7IGZudjY0LCBmbnY2NGEgfSBmcm9tIFwiLi9mbnY2NC50c1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gZm52KG5hbWU6IHN0cmluZywgYnVmPzogVWludDhBcnJheSk6IEFycmF5QnVmZmVyIHtcbiAgaWYgKCFidWYpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwibm8gZGF0YSBwcm92aWRlZCBmb3IgaGFzaGluZ1wiKTtcbiAgfVxuXG4gIHN3aXRjaCAobmFtZSkge1xuICAgIGNhc2UgXCJGTlYzMlwiOlxuICAgICAgcmV0dXJuIGZudjMyKGJ1Zik7XG4gICAgY2FzZSBcIkZOVjY0XCI6XG4gICAgICByZXR1cm4gZm52NjQoYnVmKTtcbiAgICBjYXNlIFwiRk5WMzJBXCI6XG4gICAgICByZXR1cm4gZm52MzJhKGJ1Zik7XG4gICAgY2FzZSBcIkZOVjY0QVwiOlxuICAgICAgcmV0dXJuIGZudjY0YShidWYpO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGB1bnN1cHBvcnRlZCBmbnYgZGlnZXN0OiAke25hbWV9YCk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsS0FBSyxFQUFFLE1BQU0sUUFBUSxhQUFhO0FBQzNDLFNBQVMsS0FBSyxFQUFFLE1BQU0sUUFBUSxhQUFhO0FBRTNDLE9BQU8sU0FBUyxJQUFJLElBQVksRUFBRSxHQUFnQjtFQUNoRCxJQUFJLENBQUMsS0FBSztJQUNSLE1BQU0sSUFBSSxVQUFVO0VBQ3RCO0VBRUEsT0FBUTtJQUNOLEtBQUs7TUFDSCxPQUFPLE1BQU07SUFDZixLQUFLO01BQ0gsT0FBTyxNQUFNO0lBQ2YsS0FBSztNQUNILE9BQU8sT0FBTztJQUNoQixLQUFLO01BQ0gsT0FBTyxPQUFPO0lBQ2hCO01BQ0UsTUFBTSxJQUFJLFVBQVUsQ0FBQyx3QkFBd0IsRUFBRSxLQUFLLENBQUM7RUFDekQ7QUFDRiJ9
// denoCacheMetadata=3350264343310134152,12782526831879847542