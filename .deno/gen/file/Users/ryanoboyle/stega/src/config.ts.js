// src/config.ts
export class ConfigLoader {
  configPath;
  config;
  constructor(configPath = "./config.json"){
    this.configPath = configPath;
    this.config = {};
  }
  /**
	 * Loads the configuration from the config file and environment variables.
	 * @returns The loaded configuration object.
	 */ async load() {
    try {
      const data = await Deno.readTextFile(this.configPath);
      this.config = JSON.parse(data);
    } catch (error) {
      // If the config file doesn't exist, proceed with empty config
      if (error instanceof Deno.errors.NotFound) {
        this.config = {};
      } else {
        throw error;
      }
    }
    // Override with environment variables if present
    for(const key in Deno.env.toObject()){
      const lowerKey = key.toLowerCase();
      if (lowerKey in this.config) {
        this.config[lowerKey] = Deno.env.get(key);
      }
    }
    return this.config;
  }
  /**
	 * Retrieves a configuration value by key.
	 * @param key The configuration key.
	 * @returns The configuration value.
	 */ get(key) {
    return this.config[key];
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29uZmlnLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHNyYy9jb25maWcudHNcbmltcG9ydCB0eXBlIHsgRmxhZ1ZhbHVlIH0gZnJvbSBcIi4vZmxhZy50c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIENvbmZpZyB7XG5cdFtrZXk6IHN0cmluZ106IEZsYWdWYWx1ZSB8IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGNsYXNzIENvbmZpZ0xvYWRlciB7XG5cdHByaXZhdGUgY29uZmlnOiBDb25maWcgPSB7fTtcblxuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbmZpZ1BhdGg6IHN0cmluZyA9IFwiLi9jb25maWcuanNvblwiKSB7fVxuXG5cdC8qKlxuXHQgKiBMb2FkcyB0aGUgY29uZmlndXJhdGlvbiBmcm9tIHRoZSBjb25maWcgZmlsZSBhbmQgZW52aXJvbm1lbnQgdmFyaWFibGVzLlxuXHQgKiBAcmV0dXJucyBUaGUgbG9hZGVkIGNvbmZpZ3VyYXRpb24gb2JqZWN0LlxuXHQgKi9cblx0YXN5bmMgbG9hZCgpOiBQcm9taXNlPENvbmZpZz4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBkYXRhID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUodGhpcy5jb25maWdQYXRoKTtcblx0XHRcdHRoaXMuY29uZmlnID0gSlNPTi5wYXJzZShkYXRhKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Ly8gSWYgdGhlIGNvbmZpZyBmaWxlIGRvZXNuJ3QgZXhpc3QsIHByb2NlZWQgd2l0aCBlbXB0eSBjb25maWdcblx0XHRcdGlmIChlcnJvciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSB7XG5cdFx0XHRcdHRoaXMuY29uZmlnID0ge307XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBlcnJvcjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBPdmVycmlkZSB3aXRoIGVudmlyb25tZW50IHZhcmlhYmxlcyBpZiBwcmVzZW50XG5cdFx0Zm9yIChjb25zdCBrZXkgaW4gRGVuby5lbnYudG9PYmplY3QoKSkge1xuXHRcdFx0Y29uc3QgbG93ZXJLZXkgPSBrZXkudG9Mb3dlckNhc2UoKTtcblx0XHRcdGlmIChsb3dlcktleSBpbiB0aGlzLmNvbmZpZykge1xuXHRcdFx0XHR0aGlzLmNvbmZpZ1tsb3dlcktleV0gPSBEZW5vLmVudi5nZXQoa2V5KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5jb25maWc7XG5cdH1cblxuXHQvKipcblx0ICogUmV0cmlldmVzIGEgY29uZmlndXJhdGlvbiB2YWx1ZSBieSBrZXkuXG5cdCAqIEBwYXJhbSBrZXkgVGhlIGNvbmZpZ3VyYXRpb24ga2V5LlxuXHQgKiBAcmV0dXJucyBUaGUgY29uZmlndXJhdGlvbiB2YWx1ZS5cblx0ICovXG5cdGdldChrZXk6IHN0cmluZyk6IEZsYWdWYWx1ZSB8IHVuZGVmaW5lZCB7XG5cdFx0cmV0dXJuIHRoaXMuY29uZmlnW2tleV07XG5cdH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxnQkFBZ0I7QUFPaEIsT0FBTyxNQUFNOztFQUNKLE9BQW9CO0VBRTVCLFlBQVksQUFBUSxhQUFxQixlQUFlLENBQUU7U0FBdEMsYUFBQTtTQUZaLFNBQWlCLENBQUM7RUFFaUM7RUFFM0Q7OztFQUdDLEdBQ0QsTUFBTSxPQUF3QjtJQUM3QixJQUFJO01BQ0gsTUFBTSxPQUFPLE1BQU0sS0FBSyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVU7TUFDcEQsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLEtBQUssQ0FBQztJQUMxQixFQUFFLE9BQU8sT0FBTztNQUNmLDhEQUE4RDtNQUM5RCxJQUFJLGlCQUFpQixLQUFLLE1BQU0sQ0FBQyxRQUFRLEVBQUU7UUFDMUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDO01BQ2hCLE9BQU87UUFDTixNQUFNO01BQ1A7SUFDRDtJQUVBLGlEQUFpRDtJQUNqRCxJQUFLLE1BQU0sT0FBTyxLQUFLLEdBQUcsQ0FBQyxRQUFRLEdBQUk7TUFDdEMsTUFBTSxXQUFXLElBQUksV0FBVztNQUNoQyxJQUFJLFlBQVksSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUM7TUFDdEM7SUFDRDtJQUVBLE9BQU8sSUFBSSxDQUFDLE1BQU07RUFDbkI7RUFFQTs7OztFQUlDLEdBQ0QsSUFBSSxHQUFXLEVBQXlCO0lBQ3ZDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJO0VBQ3hCO0FBQ0QifQ==
// denoCacheMetadata=2238501629156757009,14333909328689951373