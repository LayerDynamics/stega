// File: HttpCommand.ts
import { BaseCommand } from "../types.ts";
import { logger } from "../logger.ts";
export class HttpCommand extends BaseCommand {
  httpOptions;
  activeRequests;
  activeDelays;
  constructor(config){
    super({
      ...config,
      name: "http",
      description: "Make HTTP requests",
      category: "api",
      permissions: [
        "net"
      ],
      options: [
        {
          name: "method",
          type: "string",
          description: "HTTP method (GET, POST, PUT, DELETE)",
          required: true
        },
        {
          name: "url",
          type: "string",
          description: "Request URL",
          required: true
        },
        {
          name: "data",
          type: "string",
          description: "Request body data"
        },
        {
          name: "headers",
          type: "string",
          description: "Request headers (comma-separated key:value pairs)"
        }
      ]
    });
    this.httpOptions = config.httpOptions || {};
    this.activeRequests = new Set();
    this.activeDelays = new Set();
    // Bind methods to preserve context
    this.cleanupRequests = this.cleanupRequests.bind(this);
    this.makeRequest = this.makeRequest.bind(this);
    this.action = this.action.bind(this);
    // Add lifecycle hooks
    this.lifecycle = {
      cleanup: async ()=>await this.cleanupRequests(),
      onError: async (error)=>{
        await this.cleanupRequests();
        throw error;
      }
    };
  }
  /**
	 * Cleans up all active requests and delay timers by aborting controllers and clearing timers.
	 */ async cleanupRequests() {
    // Clean up active HTTP requests
    const requestCleanupPromises = Array.from(this.activeRequests).map((request)=>{
      request.controller.abort();
      if (request.timer) {
        clearTimeout(request.timer);
      }
      return Promise.resolve();
    });
    // Clean up active delay timers
    const delayCleanupPromises = Array.from(this.activeDelays).map((delayTimer)=>{
      clearTimeout(delayTimer);
      return Promise.resolve();
    });
    await Promise.all([
      ...requestCleanupPromises,
      ...delayCleanupPromises
    ]);
    this.activeRequests.clear();
    this.activeDelays.clear();
  }
  /**
	 * Parses the headers string into a Record<string, string>.
	 * @param headerString Comma-separated key:value pairs.
	 * @returns Parsed headers as an object.
	 */ parseHeaders(headerString) {
    if (!headerString) return {};
    return headerString.split(",").reduce((acc, curr)=>{
      const [key, value] = curr.split(":");
      if (key && value) {
        acc[key.trim()] = value.trim();
      }
      return acc;
    }, {});
  }
  /**
	 * Makes an HTTP request with the given parameters.
	 * @param method HTTP method.
	 * @param url Request URL.
	 * @param data Request body data.
	 * @param headers Request headers.
	 * @returns The HTTP response.
	 */ async makeRequest(method, url, data, headers) {
    const controller = new AbortController();
    const request = {
      controller,
      timer: undefined
    };
    this.activeRequests.add(request);
    try {
      const timeoutPromise = new Promise((_, reject)=>{
        request.timer = setTimeout(()=>{
          controller.abort();
          reject(new Error("Network error: Request timeout"));
        }, this.httpOptions.timeout || 30000);
      });
      const fetchPromise = fetch(url, {
        method,
        headers: {
          ...this.httpOptions.headers,
          ...headers,
          "Content-Type": "application/json"
        },
        body: data,
        signal: controller.signal
      });
      const response = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]);
      if (this.httpOptions.validateStatus && !this.httpOptions.validateStatus(response.status)) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("Network error: Request timeout");
        }
        if (error.message.includes("Failed to fetch")) {
          throw new Error("Network error: Failed to connect");
        }
        throw error; // Preserve the original error message for other cases
      }
      throw new Error("Network error: Unknown error occurred");
    } finally{
      if (request.timer) {
        clearTimeout(request.timer);
      }
      this.activeRequests.delete(request);
    }
  }
  /**
	 * Executes the HTTP command action with retries and proper timer management.
	 * @param args Command arguments.
	 */ async action(args) {
    try {
      const method = args.flags.method.toUpperCase();
      const url = args.flags.url;
      const data = args.flags.data;
      const headers = this.parseHeaders(args.flags.headers);
      const maxRetries = this.httpOptions.retries || 3;
      let attempt = 0;
      let lastError = null;
      while(attempt <= maxRetries){
        try {
          logger.info(`Making ${method} request to ${url} (attempt ${attempt + 1}/${maxRetries + 1})`);
          const response = await this.makeRequest(method, url, data, headers);
          const responseData = await response.json();
          logger.info(`Request successful (${response.status} ${response.statusText})`);
          console.log(JSON.stringify(responseData, null, 2));
          return;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (attempt === maxRetries) {
            throw lastError;
          }
          logger.warn(`Request failed, retrying... (${attempt + 1}/${maxRetries})`);
          attempt++;
          // Wait before retrying
          await new Promise((resolve)=>{
            const delayDuration = 1000 * attempt; // Exponential backoff
            const delayTimer = setTimeout(()=>{
              resolve();
              // Remove the delayTimer from activeDelays after completion to prevent leaks
              this.activeDelays.delete(delayTimer);
            }, delayDuration);
            this.activeDelays.add(delayTimer);
          });
        }
      }
      if (lastError) {
        throw lastError;
      }
    } finally{
      await this.cleanupRequests();
    }
  }
}
/**
 * Factory function to create a new HttpCommand instance.
 * @param config Command configuration.
 * @returns A new HttpCommand instance.
 */ export function createHttpCommand(config) {
  return new HttpCommand(config);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29tbWFuZHMvaHR0cF9jb21tYW5kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIEZpbGU6IEh0dHBDb21tYW5kLnRzXG5cbmltcG9ydCB7IEJhc2VDb21tYW5kIH0gZnJvbSBcIi4uL3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBBcmdzLCBDb21tYW5kIH0gZnJvbSBcIi4uL3R5cGVzLnRzXCI7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tIFwiLi4vbG9nZ2VyLnRzXCI7XG5cbmludGVyZmFjZSBIdHRwQ29tbWFuZE9wdGlvbnMge1xuXHRoZWFkZXJzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblx0dGltZW91dD86IG51bWJlcjtcblx0cmV0cmllcz86IG51bWJlcjtcblx0dmFsaWRhdGVTdGF0dXM/OiAoc3RhdHVzOiBudW1iZXIpID0+IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBBY3RpdmVSZXF1ZXN0IHtcblx0Y29udHJvbGxlcjogQWJvcnRDb250cm9sbGVyO1xuXHR0aW1lcjogbnVtYmVyIHwgdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgY2xhc3MgSHR0cENvbW1hbmQgZXh0ZW5kcyBCYXNlQ29tbWFuZCB7XG5cdHByaXZhdGUgcmVhZG9ubHkgaHR0cE9wdGlvbnM6IEh0dHBDb21tYW5kT3B0aW9ucztcblx0cHJpdmF0ZSBhY3RpdmVSZXF1ZXN0czogU2V0PEFjdGl2ZVJlcXVlc3Q+O1xuXHRwcml2YXRlIGFjdGl2ZURlbGF5czogU2V0PG51bWJlcj47XG5cblx0Y29uc3RydWN0b3IoY29uZmlnOiBQYXJ0aWFsPENvbW1hbmQ+ICYgeyBodHRwT3B0aW9ucz86IEh0dHBDb21tYW5kT3B0aW9ucyB9KSB7XG5cdFx0c3VwZXIoe1xuXHRcdFx0Li4uY29uZmlnLFxuXHRcdFx0bmFtZTogXCJodHRwXCIsXG5cdFx0XHRkZXNjcmlwdGlvbjogXCJNYWtlIEhUVFAgcmVxdWVzdHNcIixcblx0XHRcdGNhdGVnb3J5OiBcImFwaVwiLFxuXHRcdFx0cGVybWlzc2lvbnM6IFtcIm5ldFwiXSxcblx0XHRcdG9wdGlvbnM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG5hbWU6IFwibWV0aG9kXCIsXG5cdFx0XHRcdFx0dHlwZTogXCJzdHJpbmdcIixcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJIVFRQIG1ldGhvZCAoR0VULCBQT1NULCBQVVQsIERFTEVURSlcIixcblx0XHRcdFx0XHRyZXF1aXJlZDogdHJ1ZSxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG5hbWU6IFwidXJsXCIsXG5cdFx0XHRcdFx0dHlwZTogXCJzdHJpbmdcIixcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJSZXF1ZXN0IFVSTFwiLFxuXHRcdFx0XHRcdHJlcXVpcmVkOiB0cnVlLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bmFtZTogXCJkYXRhXCIsXG5cdFx0XHRcdFx0dHlwZTogXCJzdHJpbmdcIixcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJSZXF1ZXN0IGJvZHkgZGF0YVwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bmFtZTogXCJoZWFkZXJzXCIsXG5cdFx0XHRcdFx0dHlwZTogXCJzdHJpbmdcIixcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJSZXF1ZXN0IGhlYWRlcnMgKGNvbW1hLXNlcGFyYXRlZCBrZXk6dmFsdWUgcGFpcnMpXCIsXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0pO1xuXG5cdFx0dGhpcy5odHRwT3B0aW9ucyA9IGNvbmZpZy5odHRwT3B0aW9ucyB8fCB7fTtcblx0XHR0aGlzLmFjdGl2ZVJlcXVlc3RzID0gbmV3IFNldCgpO1xuXHRcdHRoaXMuYWN0aXZlRGVsYXlzID0gbmV3IFNldCgpO1xuXG5cdFx0Ly8gQmluZCBtZXRob2RzIHRvIHByZXNlcnZlIGNvbnRleHRcblx0XHR0aGlzLmNsZWFudXBSZXF1ZXN0cyA9IHRoaXMuY2xlYW51cFJlcXVlc3RzLmJpbmQodGhpcyk7XG5cdFx0dGhpcy5tYWtlUmVxdWVzdCA9IHRoaXMubWFrZVJlcXVlc3QuYmluZCh0aGlzKTtcblx0XHR0aGlzLmFjdGlvbiA9IHRoaXMuYWN0aW9uLmJpbmQodGhpcyk7XG5cblx0XHQvLyBBZGQgbGlmZWN5Y2xlIGhvb2tzXG5cdFx0dGhpcy5saWZlY3ljbGUgPSB7XG5cdFx0XHRjbGVhbnVwOiBhc3luYyAoKSA9PiBhd2FpdCB0aGlzLmNsZWFudXBSZXF1ZXN0cygpLFxuXHRcdFx0b25FcnJvcjogYXN5bmMgKGVycm9yOiBFcnJvcikgPT4ge1xuXHRcdFx0XHRhd2FpdCB0aGlzLmNsZWFudXBSZXF1ZXN0cygpO1xuXHRcdFx0XHR0aHJvdyBlcnJvcjtcblx0XHRcdH0sXG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDbGVhbnMgdXAgYWxsIGFjdGl2ZSByZXF1ZXN0cyBhbmQgZGVsYXkgdGltZXJzIGJ5IGFib3J0aW5nIGNvbnRyb2xsZXJzIGFuZCBjbGVhcmluZyB0aW1lcnMuXG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIGNsZWFudXBSZXF1ZXN0cygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHQvLyBDbGVhbiB1cCBhY3RpdmUgSFRUUCByZXF1ZXN0c1xuXHRcdGNvbnN0IHJlcXVlc3RDbGVhbnVwUHJvbWlzZXMgPSBBcnJheS5mcm9tKHRoaXMuYWN0aXZlUmVxdWVzdHMpLm1hcChcblx0XHRcdChyZXF1ZXN0KSA9PiB7XG5cdFx0XHRcdHJlcXVlc3QuY29udHJvbGxlci5hYm9ydCgpO1xuXHRcdFx0XHRpZiAocmVxdWVzdC50aW1lcikge1xuXHRcdFx0XHRcdGNsZWFyVGltZW91dChyZXF1ZXN0LnRpbWVyKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG5cdFx0XHR9LFxuXHRcdCk7XG5cblx0XHQvLyBDbGVhbiB1cCBhY3RpdmUgZGVsYXkgdGltZXJzXG5cdFx0Y29uc3QgZGVsYXlDbGVhbnVwUHJvbWlzZXMgPSBBcnJheS5mcm9tKHRoaXMuYWN0aXZlRGVsYXlzKS5tYXAoXG5cdFx0XHQoZGVsYXlUaW1lcikgPT4ge1xuXHRcdFx0XHRjbGVhclRpbWVvdXQoZGVsYXlUaW1lcik7XG5cdFx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcblx0XHRcdH0sXG5cdFx0KTtcblxuXHRcdGF3YWl0IFByb21pc2UuYWxsKFsuLi5yZXF1ZXN0Q2xlYW51cFByb21pc2VzLCAuLi5kZWxheUNsZWFudXBQcm9taXNlc10pO1xuXG5cdFx0dGhpcy5hY3RpdmVSZXF1ZXN0cy5jbGVhcigpO1xuXHRcdHRoaXMuYWN0aXZlRGVsYXlzLmNsZWFyKCk7XG5cdH1cblxuXHQvKipcblx0ICogUGFyc2VzIHRoZSBoZWFkZXJzIHN0cmluZyBpbnRvIGEgUmVjb3JkPHN0cmluZywgc3RyaW5nPi5cblx0ICogQHBhcmFtIGhlYWRlclN0cmluZyBDb21tYS1zZXBhcmF0ZWQga2V5OnZhbHVlIHBhaXJzLlxuXHQgKiBAcmV0dXJucyBQYXJzZWQgaGVhZGVycyBhcyBhbiBvYmplY3QuXG5cdCAqL1xuXHRwcml2YXRlIHBhcnNlSGVhZGVycyhoZWFkZXJTdHJpbmc/OiBzdHJpbmcpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHtcblx0XHRpZiAoIWhlYWRlclN0cmluZykgcmV0dXJuIHt9O1xuXHRcdHJldHVybiBoZWFkZXJTdHJpbmcuc3BsaXQoXCIsXCIpLnJlZHVjZSgoYWNjLCBjdXJyKSA9PiB7XG5cdFx0XHRjb25zdCBba2V5LCB2YWx1ZV0gPSBjdXJyLnNwbGl0KFwiOlwiKTtcblx0XHRcdGlmIChrZXkgJiYgdmFsdWUpIHtcblx0XHRcdFx0YWNjW2tleS50cmltKCldID0gdmFsdWUudHJpbSgpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGFjYztcblx0XHR9LCB7fSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBNYWtlcyBhbiBIVFRQIHJlcXVlc3Qgd2l0aCB0aGUgZ2l2ZW4gcGFyYW1ldGVycy5cblx0ICogQHBhcmFtIG1ldGhvZCBIVFRQIG1ldGhvZC5cblx0ICogQHBhcmFtIHVybCBSZXF1ZXN0IFVSTC5cblx0ICogQHBhcmFtIGRhdGEgUmVxdWVzdCBib2R5IGRhdGEuXG5cdCAqIEBwYXJhbSBoZWFkZXJzIFJlcXVlc3QgaGVhZGVycy5cblx0ICogQHJldHVybnMgVGhlIEhUVFAgcmVzcG9uc2UuXG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIG1ha2VSZXF1ZXN0KFxuXHRcdG1ldGhvZDogc3RyaW5nLFxuXHRcdHVybDogc3RyaW5nLFxuXHRcdGRhdGE/OiBzdHJpbmcsXG5cdFx0aGVhZGVycz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXG5cdCk6IFByb21pc2U8UmVzcG9uc2U+IHtcblx0XHRjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuXHRcdGNvbnN0IHJlcXVlc3Q6IEFjdGl2ZVJlcXVlc3QgPSB7IGNvbnRyb2xsZXIsIHRpbWVyOiB1bmRlZmluZWQgfTtcblx0XHR0aGlzLmFjdGl2ZVJlcXVlc3RzLmFkZChyZXF1ZXN0KTtcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCB0aW1lb3V0UHJvbWlzZSA9IG5ldyBQcm9taXNlPG5ldmVyPigoXywgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdHJlcXVlc3QudGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0XHRjb250cm9sbGVyLmFib3J0KCk7XG5cdFx0XHRcdFx0cmVqZWN0KG5ldyBFcnJvcihcIk5ldHdvcmsgZXJyb3I6IFJlcXVlc3QgdGltZW91dFwiKSk7XG5cdFx0XHRcdH0sIHRoaXMuaHR0cE9wdGlvbnMudGltZW91dCB8fCAzMDAwMCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Y29uc3QgZmV0Y2hQcm9taXNlID0gZmV0Y2godXJsLCB7XG5cdFx0XHRcdG1ldGhvZCxcblx0XHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcdC4uLnRoaXMuaHR0cE9wdGlvbnMuaGVhZGVycyxcblx0XHRcdFx0XHQuLi5oZWFkZXJzLFxuXHRcdFx0XHRcdFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRib2R5OiBkYXRhLFxuXHRcdFx0XHRzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtmZXRjaFByb21pc2UsIHRpbWVvdXRQcm9taXNlXSk7XG5cblx0XHRcdGlmIChcblx0XHRcdFx0dGhpcy5odHRwT3B0aW9ucy52YWxpZGF0ZVN0YXR1cyAmJlxuXHRcdFx0XHQhdGhpcy5odHRwT3B0aW9ucy52YWxpZGF0ZVN0YXR1cyhyZXNwb25zZS5zdGF0dXMpXG5cdFx0XHQpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHRcdGBIVFRQIGVycm9yICR7cmVzcG9uc2Uuc3RhdHVzfTogJHtyZXNwb25zZS5zdGF0dXNUZXh0fWAsXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiByZXNwb25zZTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0aWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcblx0XHRcdFx0aWYgKGVycm9yLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiTmV0d29yayBlcnJvcjogUmVxdWVzdCB0aW1lb3V0XCIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChlcnJvci5tZXNzYWdlLmluY2x1ZGVzKFwiRmFpbGVkIHRvIGZldGNoXCIpKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiTmV0d29yayBlcnJvcjogRmFpbGVkIHRvIGNvbm5lY3RcIik7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGhyb3cgZXJyb3I7IC8vIFByZXNlcnZlIHRoZSBvcmlnaW5hbCBlcnJvciBtZXNzYWdlIGZvciBvdGhlciBjYXNlc1xuXHRcdFx0fVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiTmV0d29yayBlcnJvcjogVW5rbm93biBlcnJvciBvY2N1cnJlZFwiKTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0aWYgKHJlcXVlc3QudGltZXIpIHtcblx0XHRcdFx0Y2xlYXJUaW1lb3V0KHJlcXVlc3QudGltZXIpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5hY3RpdmVSZXF1ZXN0cy5kZWxldGUocmVxdWVzdCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEV4ZWN1dGVzIHRoZSBIVFRQIGNvbW1hbmQgYWN0aW9uIHdpdGggcmV0cmllcyBhbmQgcHJvcGVyIHRpbWVyIG1hbmFnZW1lbnQuXG5cdCAqIEBwYXJhbSBhcmdzIENvbW1hbmQgYXJndW1lbnRzLlxuXHQgKi9cblx0cHVibGljIGFzeW5jIGFjdGlvbihhcmdzOiBBcmdzKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IG1ldGhvZCA9IChhcmdzLmZsYWdzLm1ldGhvZCBhcyBzdHJpbmcpLnRvVXBwZXJDYXNlKCk7XG5cdFx0XHRjb25zdCB1cmwgPSBhcmdzLmZsYWdzLnVybCBhcyBzdHJpbmc7XG5cdFx0XHRjb25zdCBkYXRhID0gYXJncy5mbGFncy5kYXRhIGFzIHN0cmluZztcblx0XHRcdGNvbnN0IGhlYWRlcnMgPSB0aGlzLnBhcnNlSGVhZGVycyhhcmdzLmZsYWdzLmhlYWRlcnMgYXMgc3RyaW5nKTtcblxuXHRcdFx0Y29uc3QgbWF4UmV0cmllcyA9IHRoaXMuaHR0cE9wdGlvbnMucmV0cmllcyB8fCAzO1xuXHRcdFx0bGV0IGF0dGVtcHQgPSAwO1xuXHRcdFx0bGV0IGxhc3RFcnJvcjogRXJyb3IgfCBudWxsID0gbnVsbDtcblxuXHRcdFx0d2hpbGUgKGF0dGVtcHQgPD0gbWF4UmV0cmllcykge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGxvZ2dlci5pbmZvKFxuXHRcdFx0XHRcdFx0YE1ha2luZyAke21ldGhvZH0gcmVxdWVzdCB0byAke3VybH0gKGF0dGVtcHQgJHthdHRlbXB0ICsgMX0vJHtcblx0XHRcdFx0XHRcdFx0bWF4UmV0cmllcyArIDFcblx0XHRcdFx0XHRcdH0pYCxcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5tYWtlUmVxdWVzdChtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycyk7XG5cdFx0XHRcdFx0Y29uc3QgcmVzcG9uc2VEYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuXHRcdFx0XHRcdGxvZ2dlci5pbmZvKFxuXHRcdFx0XHRcdFx0YFJlcXVlc3Qgc3VjY2Vzc2Z1bCAoJHtyZXNwb25zZS5zdGF0dXN9ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH0pYCxcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlRGF0YSwgbnVsbCwgMikpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0XHRsYXN0RXJyb3IgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IgOiBuZXcgRXJyb3IoU3RyaW5nKGVycm9yKSk7XG5cblx0XHRcdFx0XHRpZiAoYXR0ZW1wdCA9PT0gbWF4UmV0cmllcykge1xuXHRcdFx0XHRcdFx0dGhyb3cgbGFzdEVycm9yO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGxvZ2dlci53YXJuKFxuXHRcdFx0XHRcdFx0YFJlcXVlc3QgZmFpbGVkLCByZXRyeWluZy4uLiAoJHthdHRlbXB0ICsgMX0vJHttYXhSZXRyaWVzfSlgLFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0YXR0ZW1wdCsrO1xuXG5cdFx0XHRcdFx0Ly8gV2FpdCBiZWZvcmUgcmV0cnlpbmdcblx0XHRcdFx0XHRhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3QgZGVsYXlEdXJhdGlvbiA9IDEwMDAgKiBhdHRlbXB0OyAvLyBFeHBvbmVudGlhbCBiYWNrb2ZmXG5cdFx0XHRcdFx0XHRjb25zdCBkZWxheVRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdFx0XHRcdFx0Ly8gUmVtb3ZlIHRoZSBkZWxheVRpbWVyIGZyb20gYWN0aXZlRGVsYXlzIGFmdGVyIGNvbXBsZXRpb24gdG8gcHJldmVudCBsZWFrc1xuXHRcdFx0XHRcdFx0XHR0aGlzLmFjdGl2ZURlbGF5cy5kZWxldGUoZGVsYXlUaW1lcik7XG5cdFx0XHRcdFx0XHR9LCBkZWxheUR1cmF0aW9uKTtcblxuXHRcdFx0XHRcdFx0dGhpcy5hY3RpdmVEZWxheXMuYWRkKGRlbGF5VGltZXIpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChsYXN0RXJyb3IpIHtcblx0XHRcdFx0dGhyb3cgbGFzdEVycm9yO1xuXHRcdFx0fVxuXHRcdH0gZmluYWxseSB7XG5cdFx0XHRhd2FpdCB0aGlzLmNsZWFudXBSZXF1ZXN0cygpO1xuXHRcdH1cblx0fVxufVxuXG4vKipcbiAqIEZhY3RvcnkgZnVuY3Rpb24gdG8gY3JlYXRlIGEgbmV3IEh0dHBDb21tYW5kIGluc3RhbmNlLlxuICogQHBhcmFtIGNvbmZpZyBDb21tYW5kIGNvbmZpZ3VyYXRpb24uXG4gKiBAcmV0dXJucyBBIG5ldyBIdHRwQ29tbWFuZCBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUh0dHBDb21tYW5kKFxuXHRjb25maWc6IFBhcnRpYWw8Q29tbWFuZD4gJiB7IGh0dHBPcHRpb25zPzogSHR0cENvbW1hbmRPcHRpb25zIH0sXG4pOiBDb21tYW5kIHtcblx0cmV0dXJuIG5ldyBIdHRwQ29tbWFuZChjb25maWcpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHVCQUF1QjtBQUV2QixTQUFTLFdBQVcsUUFBUSxjQUFjO0FBRTFDLFNBQVMsTUFBTSxRQUFRLGVBQWU7QUFjdEMsT0FBTyxNQUFN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
// denoCacheMetadata=12322047351280865630,716939440134096213