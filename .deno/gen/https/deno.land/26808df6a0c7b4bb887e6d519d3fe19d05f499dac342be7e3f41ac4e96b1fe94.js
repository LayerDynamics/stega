// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assert } from "../assert/assert.ts";
import { Logger } from "./logger.ts";
import { state } from "./_state.ts";
/** Get a logger instance. If not specified `name`, get the default logger. */ export function getLogger(name) {
  if (!name) {
    const d = state.loggers.get("default");
    assert(d !== undefined, `"default" logger must be set for getting logger without name`);
    return d;
  }
  const result = state.loggers.get(name);
  if (!result) {
    const logger = new Logger(name, "NOTSET", {
      handlers: []
    });
    state.loggers.set(name, logger);
    return logger;
  }
  return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyNC4wL2xvZy9nZXRfbG9nZ2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjQgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCIuLi9hc3NlcnQvYXNzZXJ0LnRzXCI7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiLi9sb2dnZXIudHNcIjtcbmltcG9ydCB7IHN0YXRlIH0gZnJvbSBcIi4vX3N0YXRlLnRzXCI7XG5cbi8qKiBHZXQgYSBsb2dnZXIgaW5zdGFuY2UuIElmIG5vdCBzcGVjaWZpZWQgYG5hbWVgLCBnZXQgdGhlIGRlZmF1bHQgbG9nZ2VyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvZ2dlcihuYW1lPzogc3RyaW5nKTogTG9nZ2VyIHtcbiAgaWYgKCFuYW1lKSB7XG4gICAgY29uc3QgZCA9IHN0YXRlLmxvZ2dlcnMuZ2V0KFwiZGVmYXVsdFwiKTtcbiAgICBhc3NlcnQoXG4gICAgICBkICE9PSB1bmRlZmluZWQsXG4gICAgICBgXCJkZWZhdWx0XCIgbG9nZ2VyIG11c3QgYmUgc2V0IGZvciBnZXR0aW5nIGxvZ2dlciB3aXRob3V0IG5hbWVgLFxuICAgICk7XG4gICAgcmV0dXJuIGQ7XG4gIH1cbiAgY29uc3QgcmVzdWx0ID0gc3RhdGUubG9nZ2Vycy5nZXQobmFtZSk7XG4gIGlmICghcmVzdWx0KSB7XG4gICAgY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcihuYW1lLCBcIk5PVFNFVFwiLCB7IGhhbmRsZXJzOiBbXSB9KTtcbiAgICBzdGF0ZS5sb2dnZXJzLnNldChuYW1lLCBsb2dnZXIpO1xuICAgIHJldHVybiBsb2dnZXI7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsTUFBTSxRQUFRLHNCQUFzQjtBQUM3QyxTQUFTLE1BQU0sUUFBUSxjQUFjO0FBQ3JDLFNBQVMsS0FBSyxRQUFRLGNBQWM7QUFFcEMsNEVBQTRFLEdBQzVFLE9BQU8sU0FBUyxVQUFVLElBQWE7RUFDckMsSUFBSSxDQUFDLE1BQU07SUFDVCxNQUFNLElBQUksTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO0lBQzVCLE9BQ0UsTUFBTSxXQUNOLENBQUMsNERBQTRELENBQUM7SUFFaEUsT0FBTztFQUNUO0VBQ0EsTUFBTSxTQUFTLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztFQUNqQyxJQUFJLENBQUMsUUFBUTtJQUNYLE1BQU0sU0FBUyxJQUFJLE9BQU8sTUFBTSxVQUFVO01BQUUsVUFBVSxFQUFFO0lBQUM7SUFDekQsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU07SUFDeEIsT0FBTztFQUNUO0VBQ0EsT0FBTztBQUNUIn0=
// denoCacheMetadata=15253141586538762585,12183235341091428470