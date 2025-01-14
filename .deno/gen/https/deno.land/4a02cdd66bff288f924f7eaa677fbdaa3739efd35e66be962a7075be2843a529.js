// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { LogLevels } from "./levels.ts";
import { BaseHandler } from "./base_handler.ts";
import { writeAllSync } from "../io/write_all.ts";
const PAGE_SIZE = 4096;
/**
 * This handler will output to a file using an optional mode (default is `a`,
 * e.g. append). The file will grow indefinitely. It uses a buffer for writing
 * to file. Logs can be manually flushed with `fileHandler.flush()`. Log
 * messages with a log level greater than error are immediately flushed. Logs
 * are also flushed on process completion.
 *
 * Behavior of the log modes is as follows:
 *
 * - `'a'` - Default mode. Appends new log messages to the end of an existing log
 *   file, or create a new log file if none exists.
 * - `'w'` - Upon creation of the handler, any existing log file will be removed
 *   and a new one created.
 * - `'x'` - This will create a new log file and throw an error if one already
 *   exists.
 *
 * This handler requires `--allow-write` permission on the log file.
 */ export class FileHandler extends BaseHandler {
  _file;
  _buf = new Uint8Array(PAGE_SIZE);
  _pointer = 0;
  _filename;
  _mode;
  _openOptions;
  _encoder = new TextEncoder();
  #unloadCallback = (()=>{
    this.destroy();
  }).bind(this);
  constructor(levelName, options){
    super(levelName, options);
    this._filename = options.filename;
    // default to append mode, write only
    this._mode = options.mode ? options.mode : "a";
    this._openOptions = {
      createNew: this._mode === "x",
      create: this._mode !== "x",
      append: this._mode === "a",
      truncate: this._mode !== "a",
      write: true
    };
  }
  setup() {
    this._file = Deno.openSync(this._filename, this._openOptions);
    this.#resetBuffer();
    addEventListener("unload", this.#unloadCallback);
  }
  handle(logRecord) {
    super.handle(logRecord);
    // Immediately flush if log level is higher than ERROR
    if (logRecord.level > LogLevels.ERROR) {
      this.flush();
    }
  }
  log(msg) {
    const bytes = this._encoder.encode(msg + "\n");
    if (bytes.byteLength > this._buf.byteLength - this._pointer) {
      this.flush();
    }
    if (bytes.byteLength > this._buf.byteLength) {
      writeAllSync(this._file, bytes);
    } else {
      this._buf.set(bytes, this._pointer);
      this._pointer += bytes.byteLength;
    }
  }
  flush() {
    if (this._pointer > 0 && this._file) {
      let written = 0;
      while(written < this._pointer){
        written += this._file.writeSync(this._buf.subarray(written, this._pointer));
      }
      this.#resetBuffer();
    }
  }
  #resetBuffer() {
    this._pointer = 0;
  }
  destroy() {
    this.flush();
    this._file?.close();
    this._file = undefined;
    removeEventListener("unload", this.#unloadCallback);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyNC4wL2xvZy9maWxlX2hhbmRsZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7IHR5cGUgTGV2ZWxOYW1lLCBMb2dMZXZlbHMgfSBmcm9tIFwiLi9sZXZlbHMudHNcIjtcbmltcG9ydCB0eXBlIHsgTG9nUmVjb3JkIH0gZnJvbSBcIi4vbG9nZ2VyLnRzXCI7XG5pbXBvcnQgeyBCYXNlSGFuZGxlciwgdHlwZSBCYXNlSGFuZGxlck9wdGlvbnMgfSBmcm9tIFwiLi9iYXNlX2hhbmRsZXIudHNcIjtcbmltcG9ydCB7IHdyaXRlQWxsU3luYyB9IGZyb20gXCIuLi9pby93cml0ZV9hbGwudHNcIjtcblxuY29uc3QgUEFHRV9TSVpFID0gNDA5NjtcbmV4cG9ydCB0eXBlIExvZ01vZGUgPSBcImFcIiB8IFwid1wiIHwgXCJ4XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmlsZUhhbmRsZXJPcHRpb25zIGV4dGVuZHMgQmFzZUhhbmRsZXJPcHRpb25zIHtcbiAgZmlsZW5hbWU6IHN0cmluZztcbiAgbW9kZT86IExvZ01vZGU7XG59XG5cbi8qKlxuICogVGhpcyBoYW5kbGVyIHdpbGwgb3V0cHV0IHRvIGEgZmlsZSB1c2luZyBhbiBvcHRpb25hbCBtb2RlIChkZWZhdWx0IGlzIGBhYCxcbiAqIGUuZy4gYXBwZW5kKS4gVGhlIGZpbGUgd2lsbCBncm93IGluZGVmaW5pdGVseS4gSXQgdXNlcyBhIGJ1ZmZlciBmb3Igd3JpdGluZ1xuICogdG8gZmlsZS4gTG9ncyBjYW4gYmUgbWFudWFsbHkgZmx1c2hlZCB3aXRoIGBmaWxlSGFuZGxlci5mbHVzaCgpYC4gTG9nXG4gKiBtZXNzYWdlcyB3aXRoIGEgbG9nIGxldmVsIGdyZWF0ZXIgdGhhbiBlcnJvciBhcmUgaW1tZWRpYXRlbHkgZmx1c2hlZC4gTG9nc1xuICogYXJlIGFsc28gZmx1c2hlZCBvbiBwcm9jZXNzIGNvbXBsZXRpb24uXG4gKlxuICogQmVoYXZpb3Igb2YgdGhlIGxvZyBtb2RlcyBpcyBhcyBmb2xsb3dzOlxuICpcbiAqIC0gYCdhJ2AgLSBEZWZhdWx0IG1vZGUuIEFwcGVuZHMgbmV3IGxvZyBtZXNzYWdlcyB0byB0aGUgZW5kIG9mIGFuIGV4aXN0aW5nIGxvZ1xuICogICBmaWxlLCBvciBjcmVhdGUgYSBuZXcgbG9nIGZpbGUgaWYgbm9uZSBleGlzdHMuXG4gKiAtIGAndydgIC0gVXBvbiBjcmVhdGlvbiBvZiB0aGUgaGFuZGxlciwgYW55IGV4aXN0aW5nIGxvZyBmaWxlIHdpbGwgYmUgcmVtb3ZlZFxuICogICBhbmQgYSBuZXcgb25lIGNyZWF0ZWQuXG4gKiAtIGAneCdgIC0gVGhpcyB3aWxsIGNyZWF0ZSBhIG5ldyBsb2cgZmlsZSBhbmQgdGhyb3cgYW4gZXJyb3IgaWYgb25lIGFscmVhZHlcbiAqICAgZXhpc3RzLlxuICpcbiAqIFRoaXMgaGFuZGxlciByZXF1aXJlcyBgLS1hbGxvdy13cml0ZWAgcGVybWlzc2lvbiBvbiB0aGUgbG9nIGZpbGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBGaWxlSGFuZGxlciBleHRlbmRzIEJhc2VIYW5kbGVyIHtcbiAgcHJvdGVjdGVkIF9maWxlOiBEZW5vLkZzRmlsZSB8IHVuZGVmaW5lZDtcbiAgcHJvdGVjdGVkIF9idWY6IFVpbnQ4QXJyYXkgPSBuZXcgVWludDhBcnJheShQQUdFX1NJWkUpO1xuICBwcm90ZWN0ZWQgX3BvaW50ZXIgPSAwO1xuICBwcm90ZWN0ZWQgX2ZpbGVuYW1lOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBfbW9kZTogTG9nTW9kZTtcbiAgcHJvdGVjdGVkIF9vcGVuT3B0aW9uczogRGVuby5PcGVuT3B0aW9ucztcbiAgcHJvdGVjdGVkIF9lbmNvZGVyOiBUZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAjdW5sb2FkQ2FsbGJhY2sgPSAoKCkgPT4ge1xuICAgIHRoaXMuZGVzdHJveSgpO1xuICB9KS5iaW5kKHRoaXMpO1xuXG4gIGNvbnN0cnVjdG9yKGxldmVsTmFtZTogTGV2ZWxOYW1lLCBvcHRpb25zOiBGaWxlSGFuZGxlck9wdGlvbnMpIHtcbiAgICBzdXBlcihsZXZlbE5hbWUsIG9wdGlvbnMpO1xuICAgIHRoaXMuX2ZpbGVuYW1lID0gb3B0aW9ucy5maWxlbmFtZTtcbiAgICAvLyBkZWZhdWx0IHRvIGFwcGVuZCBtb2RlLCB3cml0ZSBvbmx5XG4gICAgdGhpcy5fbW9kZSA9IG9wdGlvbnMubW9kZSA/IG9wdGlvbnMubW9kZSA6IFwiYVwiO1xuICAgIHRoaXMuX29wZW5PcHRpb25zID0ge1xuICAgICAgY3JlYXRlTmV3OiB0aGlzLl9tb2RlID09PSBcInhcIixcbiAgICAgIGNyZWF0ZTogdGhpcy5fbW9kZSAhPT0gXCJ4XCIsXG4gICAgICBhcHBlbmQ6IHRoaXMuX21vZGUgPT09IFwiYVwiLFxuICAgICAgdHJ1bmNhdGU6IHRoaXMuX21vZGUgIT09IFwiYVwiLFxuICAgICAgd3JpdGU6IHRydWUsXG4gICAgfTtcbiAgfVxuXG4gIG92ZXJyaWRlIHNldHVwKCkge1xuICAgIHRoaXMuX2ZpbGUgPSBEZW5vLm9wZW5TeW5jKHRoaXMuX2ZpbGVuYW1lLCB0aGlzLl9vcGVuT3B0aW9ucyk7XG4gICAgdGhpcy4jcmVzZXRCdWZmZXIoKTtcblxuICAgIGFkZEV2ZW50TGlzdGVuZXIoXCJ1bmxvYWRcIiwgdGhpcy4jdW5sb2FkQ2FsbGJhY2spO1xuICB9XG5cbiAgb3ZlcnJpZGUgaGFuZGxlKGxvZ1JlY29yZDogTG9nUmVjb3JkKSB7XG4gICAgc3VwZXIuaGFuZGxlKGxvZ1JlY29yZCk7XG5cbiAgICAvLyBJbW1lZGlhdGVseSBmbHVzaCBpZiBsb2cgbGV2ZWwgaXMgaGlnaGVyIHRoYW4gRVJST1JcbiAgICBpZiAobG9nUmVjb3JkLmxldmVsID4gTG9nTGV2ZWxzLkVSUk9SKSB7XG4gICAgICB0aGlzLmZsdXNoKCk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgbG9nKG1zZzogc3RyaW5nKSB7XG4gICAgY29uc3QgYnl0ZXMgPSB0aGlzLl9lbmNvZGVyLmVuY29kZShtc2cgKyBcIlxcblwiKTtcbiAgICBpZiAoYnl0ZXMuYnl0ZUxlbmd0aCA+IHRoaXMuX2J1Zi5ieXRlTGVuZ3RoIC0gdGhpcy5fcG9pbnRlcikge1xuICAgICAgdGhpcy5mbHVzaCgpO1xuICAgIH1cbiAgICBpZiAoYnl0ZXMuYnl0ZUxlbmd0aCA+IHRoaXMuX2J1Zi5ieXRlTGVuZ3RoKSB7XG4gICAgICB3cml0ZUFsbFN5bmModGhpcy5fZmlsZSEsIGJ5dGVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYnVmLnNldChieXRlcywgdGhpcy5fcG9pbnRlcik7XG4gICAgICB0aGlzLl9wb2ludGVyICs9IGJ5dGVzLmJ5dGVMZW5ndGg7XG4gICAgfVxuICB9XG5cbiAgZmx1c2goKSB7XG4gICAgaWYgKHRoaXMuX3BvaW50ZXIgPiAwICYmIHRoaXMuX2ZpbGUpIHtcbiAgICAgIGxldCB3cml0dGVuID0gMDtcbiAgICAgIHdoaWxlICh3cml0dGVuIDwgdGhpcy5fcG9pbnRlcikge1xuICAgICAgICB3cml0dGVuICs9IHRoaXMuX2ZpbGUud3JpdGVTeW5jKFxuICAgICAgICAgIHRoaXMuX2J1Zi5zdWJhcnJheSh3cml0dGVuLCB0aGlzLl9wb2ludGVyKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuI3Jlc2V0QnVmZmVyKCk7XG4gICAgfVxuICB9XG5cbiAgI3Jlc2V0QnVmZmVyKCkge1xuICAgIHRoaXMuX3BvaW50ZXIgPSAwO1xuICB9XG5cbiAgb3ZlcnJpZGUgZGVzdHJveSgpIHtcbiAgICB0aGlzLmZsdXNoKCk7XG4gICAgdGhpcy5fZmlsZT8uY2xvc2UoKTtcbiAgICB0aGlzLl9maWxlID0gdW5kZWZpbmVkO1xuICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ1bmxvYWRcIiwgdGhpcy4jdW5sb2FkQ2FsbGJhY2spO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJt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
// denoCacheMetadata=3640204529515164973,7882952735998311955