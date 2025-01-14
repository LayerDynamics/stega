// src/flag.ts
/**
 * Converts a string value to the specified type.
 * @param value The string value to convert.
 * @param type The target type.
 * @returns The converted value.
 */ export function convertFlagValue(value, type) {
  switch(type){
    case "boolean":
      {
        return value === "true" || value === "1";
      }
    case "number":
      {
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error(`Invalid number value: ${value}`);
        }
        return num;
      }
    case "array":
      {
        return value.split(",");
      }
    case "string":
    default:
      {
        return value;
      }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvZmxhZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBzcmMvZmxhZy50c1xuXG5leHBvcnQgdHlwZSBGbGFnVHlwZSA9IFwiYm9vbGVhblwiIHwgXCJzdHJpbmdcIiB8IFwibnVtYmVyXCIgfCBcImFycmF5XCI7XG5leHBvcnQgdHlwZSBGbGFnVmFsdWUgPSBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgc3RyaW5nW107XG5cbi8qKlxuICogQ29udmVydHMgYSBzdHJpbmcgdmFsdWUgdG8gdGhlIHNwZWNpZmllZCB0eXBlLlxuICogQHBhcmFtIHZhbHVlIFRoZSBzdHJpbmcgdmFsdWUgdG8gY29udmVydC5cbiAqIEBwYXJhbSB0eXBlIFRoZSB0YXJnZXQgdHlwZS5cbiAqIEByZXR1cm5zIFRoZSBjb252ZXJ0ZWQgdmFsdWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0RmxhZ1ZhbHVlKHZhbHVlOiBzdHJpbmcsIHR5cGU6IEZsYWdUeXBlKTogRmxhZ1ZhbHVlIHtcblx0c3dpdGNoICh0eXBlKSB7XG5cdFx0Y2FzZSBcImJvb2xlYW5cIjoge1xuXHRcdFx0cmV0dXJuIHZhbHVlID09PSBcInRydWVcIiB8fCB2YWx1ZSA9PT0gXCIxXCI7XG5cdFx0fVxuXHRcdGNhc2UgXCJudW1iZXJcIjoge1xuXHRcdFx0Y29uc3QgbnVtID0gTnVtYmVyKHZhbHVlKTtcblx0XHRcdGlmIChpc05hTihudW0pKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBudW1iZXIgdmFsdWU6ICR7dmFsdWV9YCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbnVtO1xuXHRcdH1cblx0XHRjYXNlIFwiYXJyYXlcIjoge1xuXHRcdFx0cmV0dXJuIHZhbHVlLnNwbGl0KFwiLFwiKTtcblx0XHR9XG5cdFx0Y2FzZSBcInN0cmluZ1wiOlxuXHRcdGRlZmF1bHQ6IHtcblx0XHRcdHJldHVybiB2YWx1ZTtcblx0XHR9XG5cdH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxjQUFjO0FBS2Q7Ozs7O0NBS0MsR0FDRCxPQUFPLFNBQVMsaUJBQWlCLEtBQWEsRUFBRSxJQUFjO0VBQzdELE9BQVE7SUFDUCxLQUFLO01BQVc7UUFDZixPQUFPLFVBQVUsVUFBVSxVQUFVO01BQ3RDO0lBQ0EsS0FBSztNQUFVO1FBQ2QsTUFBTSxNQUFNLE9BQU87UUFDbkIsSUFBSSxNQUFNLE1BQU07VUFDZixNQUFNLElBQUksTUFBTSxDQUFDLHNCQUFzQixFQUFFLE1BQU0sQ0FBQztRQUNqRDtRQUNBLE9BQU87TUFDUjtJQUNBLEtBQUs7TUFBUztRQUNiLE9BQU8sTUFBTSxLQUFLLENBQUM7TUFDcEI7SUFDQSxLQUFLO0lBQ0w7TUFBUztRQUNSLE9BQU87TUFDUjtFQUNEO0FBQ0QifQ==
// denoCacheMetadata=9104394381853989073,2138974336977768382