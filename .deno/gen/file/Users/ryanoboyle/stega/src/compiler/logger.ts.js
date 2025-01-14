// /src/compiler/logger.ts
/**
 * Simple logger utility for the compiler.
 * Provides standardized logging methods for info, warning, and error messages.
 */ export const logger = {
  info: (...args)=>{
    console.log("[INFO]", ...args);
  },
  warn: (...args)=>{
    console.warn("[WARN]", ...args);
  },
  error: (...args)=>{
    console.error("[ERROR]", ...args);
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29tcGlsZXIvbG9nZ2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIC9zcmMvY29tcGlsZXIvbG9nZ2VyLnRzXG5cbi8qKlxuICogU2ltcGxlIGxvZ2dlciB1dGlsaXR5IGZvciB0aGUgY29tcGlsZXIuXG4gKiBQcm92aWRlcyBzdGFuZGFyZGl6ZWQgbG9nZ2luZyBtZXRob2RzIGZvciBpbmZvLCB3YXJuaW5nLCBhbmQgZXJyb3IgbWVzc2FnZXMuXG4gKi9cbmV4cG9ydCBjb25zdCBsb2dnZXIgPSB7XG5cdGluZm86ICguLi5hcmdzOiB1bmtub3duW10pID0+IHtcblx0XHRjb25zb2xlLmxvZyhcIltJTkZPXVwiLCAuLi5hcmdzKTtcblx0fSxcblx0d2FybjogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4ge1xuXHRcdGNvbnNvbGUud2FybihcIltXQVJOXVwiLCAuLi5hcmdzKTtcblx0fSxcblx0ZXJyb3I6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHtcblx0XHRjb25zb2xlLmVycm9yKFwiW0VSUk9SXVwiLCAuLi5hcmdzKTtcblx0fSxcbn07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsMEJBQTBCO0FBRTFCOzs7Q0FHQyxHQUNELE9BQU8sTUFBTSxTQUFTO0VBQ3JCLE1BQU0sQ0FBQyxHQUFHO0lBQ1QsUUFBUSxHQUFHLENBQUMsYUFBYTtFQUMxQjtFQUNBLE1BQU0sQ0FBQyxHQUFHO0lBQ1QsUUFBUSxJQUFJLENBQUMsYUFBYTtFQUMzQjtFQUNBLE9BQU8sQ0FBQyxHQUFHO0lBQ1YsUUFBUSxLQUFLLENBQUMsY0FBYztFQUM3QjtBQUNELEVBQUUifQ==
// denoCacheMetadata=17285109808991143065,338209968147968778