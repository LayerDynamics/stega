// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { existsSync } from "../fs/exists.ts";
import { FileHandler } from "./file_handler.ts";
/**
 * This handler extends the functionality of the {@linkcode FileHandler} by
 * "rotating" the log file when it reaches a certain size. `maxBytes` specifies
 * the maximum size in bytes that the log file can grow to before rolling over
 * to a new one. If the size of the new log message plus the current log file
 * size exceeds `maxBytes` then a roll-over is triggered. When a roll-over
 * occurs, before the log message is written, the log file is renamed and
 * appended with `.1`. If a `.1` version already existed, it would have been
 * renamed `.2` first and so on. The maximum number of log files to keep is
 * specified by `maxBackupCount`. After the renames are complete the log message
 * is written to the original, now blank, file.
 *
 * Example: Given `log.txt`, `log.txt.1`, `log.txt.2` and `log.txt.3`, a
 * `maxBackupCount` of 3 and a new log message which would cause `log.txt` to
 * exceed `maxBytes`, then `log.txt.2` would be renamed to `log.txt.3` (thereby
 * discarding the original contents of `log.txt.3` since 3 is the maximum number
 * of backups to keep), `log.txt.1` would be renamed to `log.txt.2`, `log.txt`
 * would be renamed to `log.txt.1` and finally `log.txt` would be created from
 * scratch where the new log message would be written.
 *
 * This handler uses a buffer for writing log messages to file. Logs can be
 * manually flushed with `fileHandler.flush()`. Log messages with a log level
 * greater than ERROR are immediately flushed. Logs are also flushed on process
 * completion.
 *
 * Additional notes on `mode` as described above:
 *
 * - `'a'` Default mode. As above, this will pick up where the logs left off in
 *   rotation, or create a new log file if it doesn't exist.
 * - `'w'` in addition to starting with a clean `filename`, this mode will also
 *   cause any existing backups (up to `maxBackupCount`) to be deleted on setup
 *   giving a fully clean slate.
 * - `'x'` requires that neither `filename`, nor any backups (up to
 *   `maxBackupCount`), exist before setup.
 *
 * This handler requires both `--allow-read` and `--allow-write` permissions on
 * the log files.
 */ export class RotatingFileHandler extends FileHandler {
  #maxBytes;
  #maxBackupCount;
  #currentFileSize = 0;
  constructor(levelName, options){
    super(levelName, options);
    this.#maxBytes = options.maxBytes;
    this.#maxBackupCount = options.maxBackupCount;
  }
  setup() {
    if (this.#maxBytes < 1) {
      this.destroy();
      throw new Error("maxBytes cannot be less than 1");
    }
    if (this.#maxBackupCount < 1) {
      this.destroy();
      throw new Error("maxBackupCount cannot be less than 1");
    }
    super.setup();
    if (this._mode === "w") {
      // Remove old backups too as it doesn't make sense to start with a clean
      // log file, but old backups
      for(let i = 1; i <= this.#maxBackupCount; i++){
        try {
          Deno.removeSync(this._filename + "." + i);
        } catch (error) {
          if (!(error instanceof Deno.errors.NotFound)) {
            throw error;
          }
        }
      }
    } else if (this._mode === "x") {
      // Throw if any backups also exist
      for(let i = 1; i <= this.#maxBackupCount; i++){
        if (existsSync(this._filename + "." + i)) {
          this.destroy();
          throw new Deno.errors.AlreadyExists("Backup log file " + this._filename + "." + i + " already exists");
        }
      }
    } else {
      this.#currentFileSize = Deno.statSync(this._filename).size;
    }
  }
  log(msg) {
    const msgByteLength = this._encoder.encode(msg).byteLength + 1;
    if (this.#currentFileSize + msgByteLength > this.#maxBytes) {
      this.rotateLogFiles();
      this.#currentFileSize = 0;
    }
    super.log(msg);
    this.#currentFileSize += msgByteLength;
  }
  rotateLogFiles() {
    this.flush();
    this._file.close();
    for(let i = this.#maxBackupCount - 1; i >= 0; i--){
      const source = this._filename + (i === 0 ? "" : "." + i);
      const dest = this._filename + "." + (i + 1);
      if (existsSync(source)) {
        Deno.renameSync(source, dest);
      }
    }
    this._file = Deno.openSync(this._filename, this._openOptions);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyNC4wL2xvZy9yb3RhdGluZ19maWxlX2hhbmRsZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB0eXBlIHsgTGV2ZWxOYW1lIH0gZnJvbSBcIi4vbGV2ZWxzLnRzXCI7XG5pbXBvcnQgeyBleGlzdHNTeW5jIH0gZnJvbSBcIi4uL2ZzL2V4aXN0cy50c1wiO1xuaW1wb3J0IHsgRmlsZUhhbmRsZXIsIHR5cGUgRmlsZUhhbmRsZXJPcHRpb25zIH0gZnJvbSBcIi4vZmlsZV9oYW5kbGVyLnRzXCI7XG5cbmludGVyZmFjZSBSb3RhdGluZ0ZpbGVIYW5kbGVyT3B0aW9ucyBleHRlbmRzIEZpbGVIYW5kbGVyT3B0aW9ucyB7XG4gIG1heEJ5dGVzOiBudW1iZXI7XG4gIG1heEJhY2t1cENvdW50OiBudW1iZXI7XG59XG5cbi8qKlxuICogVGhpcyBoYW5kbGVyIGV4dGVuZHMgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIHtAbGlua2NvZGUgRmlsZUhhbmRsZXJ9IGJ5XG4gKiBcInJvdGF0aW5nXCIgdGhlIGxvZyBmaWxlIHdoZW4gaXQgcmVhY2hlcyBhIGNlcnRhaW4gc2l6ZS4gYG1heEJ5dGVzYCBzcGVjaWZpZXNcbiAqIHRoZSBtYXhpbXVtIHNpemUgaW4gYnl0ZXMgdGhhdCB0aGUgbG9nIGZpbGUgY2FuIGdyb3cgdG8gYmVmb3JlIHJvbGxpbmcgb3ZlclxuICogdG8gYSBuZXcgb25lLiBJZiB0aGUgc2l6ZSBvZiB0aGUgbmV3IGxvZyBtZXNzYWdlIHBsdXMgdGhlIGN1cnJlbnQgbG9nIGZpbGVcbiAqIHNpemUgZXhjZWVkcyBgbWF4Qnl0ZXNgIHRoZW4gYSByb2xsLW92ZXIgaXMgdHJpZ2dlcmVkLiBXaGVuIGEgcm9sbC1vdmVyXG4gKiBvY2N1cnMsIGJlZm9yZSB0aGUgbG9nIG1lc3NhZ2UgaXMgd3JpdHRlbiwgdGhlIGxvZyBmaWxlIGlzIHJlbmFtZWQgYW5kXG4gKiBhcHBlbmRlZCB3aXRoIGAuMWAuIElmIGEgYC4xYCB2ZXJzaW9uIGFscmVhZHkgZXhpc3RlZCwgaXQgd291bGQgaGF2ZSBiZWVuXG4gKiByZW5hbWVkIGAuMmAgZmlyc3QgYW5kIHNvIG9uLiBUaGUgbWF4aW11bSBudW1iZXIgb2YgbG9nIGZpbGVzIHRvIGtlZXAgaXNcbiAqIHNwZWNpZmllZCBieSBgbWF4QmFja3VwQ291bnRgLiBBZnRlciB0aGUgcmVuYW1lcyBhcmUgY29tcGxldGUgdGhlIGxvZyBtZXNzYWdlXG4gKiBpcyB3cml0dGVuIHRvIHRoZSBvcmlnaW5hbCwgbm93IGJsYW5rLCBmaWxlLlxuICpcbiAqIEV4YW1wbGU6IEdpdmVuIGBsb2cudHh0YCwgYGxvZy50eHQuMWAsIGBsb2cudHh0LjJgIGFuZCBgbG9nLnR4dC4zYCwgYVxuICogYG1heEJhY2t1cENvdW50YCBvZiAzIGFuZCBhIG5ldyBsb2cgbWVzc2FnZSB3aGljaCB3b3VsZCBjYXVzZSBgbG9nLnR4dGAgdG9cbiAqIGV4Y2VlZCBgbWF4Qnl0ZXNgLCB0aGVuIGBsb2cudHh0LjJgIHdvdWxkIGJlIHJlbmFtZWQgdG8gYGxvZy50eHQuM2AgKHRoZXJlYnlcbiAqIGRpc2NhcmRpbmcgdGhlIG9yaWdpbmFsIGNvbnRlbnRzIG9mIGBsb2cudHh0LjNgIHNpbmNlIDMgaXMgdGhlIG1heGltdW0gbnVtYmVyXG4gKiBvZiBiYWNrdXBzIHRvIGtlZXApLCBgbG9nLnR4dC4xYCB3b3VsZCBiZSByZW5hbWVkIHRvIGBsb2cudHh0LjJgLCBgbG9nLnR4dGBcbiAqIHdvdWxkIGJlIHJlbmFtZWQgdG8gYGxvZy50eHQuMWAgYW5kIGZpbmFsbHkgYGxvZy50eHRgIHdvdWxkIGJlIGNyZWF0ZWQgZnJvbVxuICogc2NyYXRjaCB3aGVyZSB0aGUgbmV3IGxvZyBtZXNzYWdlIHdvdWxkIGJlIHdyaXR0ZW4uXG4gKlxuICogVGhpcyBoYW5kbGVyIHVzZXMgYSBidWZmZXIgZm9yIHdyaXRpbmcgbG9nIG1lc3NhZ2VzIHRvIGZpbGUuIExvZ3MgY2FuIGJlXG4gKiBtYW51YWxseSBmbHVzaGVkIHdpdGggYGZpbGVIYW5kbGVyLmZsdXNoKClgLiBMb2cgbWVzc2FnZXMgd2l0aCBhIGxvZyBsZXZlbFxuICogZ3JlYXRlciB0aGFuIEVSUk9SIGFyZSBpbW1lZGlhdGVseSBmbHVzaGVkLiBMb2dzIGFyZSBhbHNvIGZsdXNoZWQgb24gcHJvY2Vzc1xuICogY29tcGxldGlvbi5cbiAqXG4gKiBBZGRpdGlvbmFsIG5vdGVzIG9uIGBtb2RlYCBhcyBkZXNjcmliZWQgYWJvdmU6XG4gKlxuICogLSBgJ2EnYCBEZWZhdWx0IG1vZGUuIEFzIGFib3ZlLCB0aGlzIHdpbGwgcGljayB1cCB3aGVyZSB0aGUgbG9ncyBsZWZ0IG9mZiBpblxuICogICByb3RhdGlvbiwgb3IgY3JlYXRlIGEgbmV3IGxvZyBmaWxlIGlmIGl0IGRvZXNuJ3QgZXhpc3QuXG4gKiAtIGAndydgIGluIGFkZGl0aW9uIHRvIHN0YXJ0aW5nIHdpdGggYSBjbGVhbiBgZmlsZW5hbWVgLCB0aGlzIG1vZGUgd2lsbCBhbHNvXG4gKiAgIGNhdXNlIGFueSBleGlzdGluZyBiYWNrdXBzICh1cCB0byBgbWF4QmFja3VwQ291bnRgKSB0byBiZSBkZWxldGVkIG9uIHNldHVwXG4gKiAgIGdpdmluZyBhIGZ1bGx5IGNsZWFuIHNsYXRlLlxuICogLSBgJ3gnYCByZXF1aXJlcyB0aGF0IG5laXRoZXIgYGZpbGVuYW1lYCwgbm9yIGFueSBiYWNrdXBzICh1cCB0b1xuICogICBgbWF4QmFja3VwQ291bnRgKSwgZXhpc3QgYmVmb3JlIHNldHVwLlxuICpcbiAqIFRoaXMgaGFuZGxlciByZXF1aXJlcyBib3RoIGAtLWFsbG93LXJlYWRgIGFuZCBgLS1hbGxvdy13cml0ZWAgcGVybWlzc2lvbnMgb25cbiAqIHRoZSBsb2cgZmlsZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBSb3RhdGluZ0ZpbGVIYW5kbGVyIGV4dGVuZHMgRmlsZUhhbmRsZXIge1xuICAjbWF4Qnl0ZXM6IG51bWJlcjtcbiAgI21heEJhY2t1cENvdW50OiBudW1iZXI7XG4gICNjdXJyZW50RmlsZVNpemUgPSAwO1xuXG4gIGNvbnN0cnVjdG9yKGxldmVsTmFtZTogTGV2ZWxOYW1lLCBvcHRpb25zOiBSb3RhdGluZ0ZpbGVIYW5kbGVyT3B0aW9ucykge1xuICAgIHN1cGVyKGxldmVsTmFtZSwgb3B0aW9ucyk7XG4gICAgdGhpcy4jbWF4Qnl0ZXMgPSBvcHRpb25zLm1heEJ5dGVzO1xuICAgIHRoaXMuI21heEJhY2t1cENvdW50ID0gb3B0aW9ucy5tYXhCYWNrdXBDb3VudDtcbiAgfVxuXG4gIG92ZXJyaWRlIHNldHVwKCkge1xuICAgIGlmICh0aGlzLiNtYXhCeXRlcyA8IDEpIHtcbiAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwibWF4Qnl0ZXMgY2Fubm90IGJlIGxlc3MgdGhhbiAxXCIpO1xuICAgIH1cbiAgICBpZiAodGhpcy4jbWF4QmFja3VwQ291bnQgPCAxKSB7XG4gICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIm1heEJhY2t1cENvdW50IGNhbm5vdCBiZSBsZXNzIHRoYW4gMVwiKTtcbiAgICB9XG4gICAgc3VwZXIuc2V0dXAoKTtcblxuICAgIGlmICh0aGlzLl9tb2RlID09PSBcIndcIikge1xuICAgICAgLy8gUmVtb3ZlIG9sZCBiYWNrdXBzIHRvbyBhcyBpdCBkb2Vzbid0IG1ha2Ugc2Vuc2UgdG8gc3RhcnQgd2l0aCBhIGNsZWFuXG4gICAgICAvLyBsb2cgZmlsZSwgYnV0IG9sZCBiYWNrdXBzXG4gICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSB0aGlzLiNtYXhCYWNrdXBDb3VudDsgaSsrKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgRGVuby5yZW1vdmVTeW5jKHRoaXMuX2ZpbGVuYW1lICsgXCIuXCIgKyBpKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBpZiAoIShlcnJvciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSkge1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLl9tb2RlID09PSBcInhcIikge1xuICAgICAgLy8gVGhyb3cgaWYgYW55IGJhY2t1cHMgYWxzbyBleGlzdFxuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gdGhpcy4jbWF4QmFja3VwQ291bnQ7IGkrKykge1xuICAgICAgICBpZiAoZXhpc3RzU3luYyh0aGlzLl9maWxlbmFtZSArIFwiLlwiICsgaSkpIHtcbiAgICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuQWxyZWFkeUV4aXN0cyhcbiAgICAgICAgICAgIFwiQmFja3VwIGxvZyBmaWxlIFwiICsgdGhpcy5fZmlsZW5hbWUgKyBcIi5cIiArIGkgKyBcIiBhbHJlYWR5IGV4aXN0c1wiLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jY3VycmVudEZpbGVTaXplID0gKERlbm8uc3RhdFN5bmModGhpcy5fZmlsZW5hbWUpKS5zaXplO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIGxvZyhtc2c6IHN0cmluZykge1xuICAgIGNvbnN0IG1zZ0J5dGVMZW5ndGggPSB0aGlzLl9lbmNvZGVyLmVuY29kZShtc2cpLmJ5dGVMZW5ndGggKyAxO1xuXG4gICAgaWYgKHRoaXMuI2N1cnJlbnRGaWxlU2l6ZSArIG1zZ0J5dGVMZW5ndGggPiB0aGlzLiNtYXhCeXRlcykge1xuICAgICAgdGhpcy5yb3RhdGVMb2dGaWxlcygpO1xuICAgICAgdGhpcy4jY3VycmVudEZpbGVTaXplID0gMDtcbiAgICB9XG5cbiAgICBzdXBlci5sb2cobXNnKTtcblxuICAgIHRoaXMuI2N1cnJlbnRGaWxlU2l6ZSArPSBtc2dCeXRlTGVuZ3RoO1xuICB9XG5cbiAgcm90YXRlTG9nRmlsZXMoKSB7XG4gICAgdGhpcy5mbHVzaCgpO1xuICAgIHRoaXMuX2ZpbGUhLmNsb3NlKCk7XG5cbiAgICBmb3IgKGxldCBpID0gdGhpcy4jbWF4QmFja3VwQ291bnQgLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY29uc3Qgc291cmNlID0gdGhpcy5fZmlsZW5hbWUgKyAoaSA9PT0gMCA/IFwiXCIgOiBcIi5cIiArIGkpO1xuICAgICAgY29uc3QgZGVzdCA9IHRoaXMuX2ZpbGVuYW1lICsgXCIuXCIgKyAoaSArIDEpO1xuXG4gICAgICBpZiAoZXhpc3RzU3luYyhzb3VyY2UpKSB7XG4gICAgICAgIERlbm8ucmVuYW1lU3luYyhzb3VyY2UsIGRlc3QpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX2ZpbGUgPSBEZW5vLm9wZW5TeW5jKHRoaXMuX2ZpbGVuYW1lLCB0aGlzLl9vcGVuT3B0aW9ucyk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFFMUUsU0FBUyxVQUFVLFFBQVEsa0JBQWtCO0FBQzdDLFNBQVMsV0FBVyxRQUFpQyxvQkFBb0I7QUFPekU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FxQ0MsR0FDRCxPQUFPLE1BQU0sNEJBQTRCO0VBQ3ZDLENBQUEsUUFBUyxDQUFTO0VBQ2xCLENBQUEsY0FBZSxDQUFTO0VBQ3hCLENBQUEsZUFBZ0IsR0FBRyxFQUFFO0VBRXJCLFlBQVksU0FBb0IsRUFBRSxPQUFtQyxDQUFFO0lBQ3JFLEtBQUssQ0FBQyxXQUFXO0lBQ2pCLElBQUksQ0FBQyxDQUFBLFFBQVMsR0FBRyxRQUFRLFFBQVE7SUFDakMsSUFBSSxDQUFDLENBQUEsY0FBZSxHQUFHLFFBQVEsY0FBYztFQUMvQztFQUVTLFFBQVE7SUFDZixJQUFJLElBQUksQ0FBQyxDQUFBLFFBQVMsR0FBRyxHQUFHO01BQ3RCLElBQUksQ0FBQyxPQUFPO01BQ1osTUFBTSxJQUFJLE1BQU07SUFDbEI7SUFDQSxJQUFJLElBQUksQ0FBQyxDQUFBLGNBQWUsR0FBRyxHQUFHO01BQzVCLElBQUksQ0FBQyxPQUFPO01BQ1osTUFBTSxJQUFJLE1BQU07SUFDbEI7SUFDQSxLQUFLLENBQUM7SUFFTixJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssS0FBSztNQUN0Qix3RUFBd0U7TUFDeEUsNEJBQTRCO01BQzVCLElBQUssSUFBSSxJQUFJLEdBQUcsS0FBSyxJQUFJLENBQUMsQ0FBQSxjQUFlLEVBQUUsSUFBSztRQUM5QyxJQUFJO1VBQ0YsS0FBSyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNO1FBQ3pDLEVBQUUsT0FBTyxPQUFPO1VBQ2QsSUFBSSxDQUFDLENBQUMsaUJBQWlCLEtBQUssTUFBTSxDQUFDLFFBQVEsR0FBRztZQUM1QyxNQUFNO1VBQ1I7UUFDRjtNQUNGO0lBQ0YsT0FBTyxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssS0FBSztNQUM3QixrQ0FBa0M7TUFDbEMsSUFBSyxJQUFJLElBQUksR0FBRyxLQUFLLElBQUksQ0FBQyxDQUFBLGNBQWUsRUFBRSxJQUFLO1FBQzlDLElBQUksV0FBVyxJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sSUFBSTtVQUN4QyxJQUFJLENBQUMsT0FBTztVQUNaLE1BQU0sSUFBSSxLQUFLLE1BQU0sQ0FBQyxhQUFhLENBQ2pDLHFCQUFxQixJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sSUFBSTtRQUVwRDtNQUNGO0lBQ0YsT0FBTztNQUNMLElBQUksQ0FBQyxDQUFBLGVBQWdCLEdBQUcsQUFBQyxLQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFHLElBQUk7SUFDOUQ7RUFDRjtFQUVTLElBQUksR0FBVyxFQUFFO0lBQ3hCLE1BQU0sZ0JBQWdCLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssVUFBVSxHQUFHO0lBRTdELElBQUksSUFBSSxDQUFDLENBQUEsZUFBZ0IsR0FBRyxnQkFBZ0IsSUFBSSxDQUFDLENBQUEsUUFBUyxFQUFFO01BQzFELElBQUksQ0FBQyxjQUFjO01BQ25CLElBQUksQ0FBQyxDQUFBLGVBQWdCLEdBQUc7SUFDMUI7SUFFQSxLQUFLLENBQUMsSUFBSTtJQUVWLElBQUksQ0FBQyxDQUFBLGVBQWdCLElBQUk7RUFDM0I7RUFFQSxpQkFBaUI7SUFDZixJQUFJLENBQUMsS0FBSztJQUNWLElBQUksQ0FBQyxLQUFLLENBQUUsS0FBSztJQUVqQixJQUFLLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQSxjQUFlLEdBQUcsR0FBRyxLQUFLLEdBQUcsSUFBSztNQUNsRCxNQUFNLFNBQVMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLE1BQU0sSUFBSSxLQUFLLE1BQU0sQ0FBQztNQUN2RCxNQUFNLE9BQU8sSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO01BRTFDLElBQUksV0FBVyxTQUFTO1FBQ3RCLEtBQUssVUFBVSxDQUFDLFFBQVE7TUFDMUI7SUFDRjtJQUVBLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsWUFBWTtFQUM5RDtBQUNGIn0=
// denoCacheMetadata=1814428745468201790,10991417618971214123