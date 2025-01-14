/**
 * prettyTime options
 * - withSpaces Whether to use spaces to separate times, `1d2h3m5s` or `1d 2h 3m 5s`, default false
 * - toFixedVal value pass to toFixed for seconds, default 1
 * - longFormat Whether to use a long format, default false, `1d2h3m5s` or `1days 2hours 3minutes 5seconds`
 */ /**
 * Convert time duration to a human readable string: 5d1h20m30s
 *
 * - milliseconds The number to format, unit milliseconds
 */ export function prettyTime(milliseconds, options = {
  withSpaces: false,
  toFixedVal: 1,
  longFormat: false
}) {
  let second = milliseconds / 1000;
  if (second < 60) {
    return unitToString(second, 0, options);
  }
  let minute = Math.floor(second / 60);
  second %= 60;
  if (minute < 60) {
    return unitToString(minute, 1, options) + unitToString(second, 0, options);
  }
  let hour = Math.floor(minute / 60);
  minute %= 60;
  if (hour < 24) {
    return unitToString(hour, 2, options) + unitToString(minute, 1, options) + unitToString(second, 0, options);
  }
  const day = Math.floor(hour / 24);
  hour %= 24;
  return unitToString(day, 3, options) + unitToString(hour, 2, options) + unitToString(minute, 1, options) + unitToString(second, 0, options);
}
function unitToString(val, i, { withSpaces = false, toFixedVal = 1, longFormat = false }) {
  const units = longFormat ? [
    "second",
    "minute",
    "hour",
    "day"
  ] : [
    "s",
    "m",
    "h",
    "d"
  ];
  const unit = longFormat && (val >= 2 || val > 1 && toFixedVal > 0) ? units[i] + "s" : units[i];
  if (i == 0) {
    return val.toFixed(toFixedVal) + unit;
  }
  return val + (withSpaces ? unit + " " : unit);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvcHJvZ3Jlc3NAdjEuMy44L3RpbWUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBwcmV0dHlUaW1lIG9wdGlvbnNcbiAqIC0gd2l0aFNwYWNlcyBXaGV0aGVyIHRvIHVzZSBzcGFjZXMgdG8gc2VwYXJhdGUgdGltZXMsIGAxZDJoM201c2Agb3IgYDFkIDJoIDNtIDVzYCwgZGVmYXVsdCBmYWxzZVxuICogLSB0b0ZpeGVkVmFsIHZhbHVlIHBhc3MgdG8gdG9GaXhlZCBmb3Igc2Vjb25kcywgZGVmYXVsdCAxXG4gKiAtIGxvbmdGb3JtYXQgV2hldGhlciB0byB1c2UgYSBsb25nIGZvcm1hdCwgZGVmYXVsdCBmYWxzZSwgYDFkMmgzbTVzYCBvciBgMWRheXMgMmhvdXJzIDNtaW51dGVzIDVzZWNvbmRzYFxuICovXG5leHBvcnQgaW50ZXJmYWNlIHByZXR0eVRpbWVPcHRpb25zIHtcbiAgd2l0aFNwYWNlcz86IGJvb2xlYW47XG4gIHRvRml4ZWRWYWw/OiBudW1iZXI7XG4gIGxvbmdGb3JtYXQ/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIENvbnZlcnQgdGltZSBkdXJhdGlvbiB0byBhIGh1bWFuIHJlYWRhYmxlIHN0cmluZzogNWQxaDIwbTMwc1xuICpcbiAqIC0gbWlsbGlzZWNvbmRzIFRoZSBudW1iZXIgdG8gZm9ybWF0LCB1bml0IG1pbGxpc2Vjb25kc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcHJldHR5VGltZShtaWxsaXNlY29uZHM6IG51bWJlciwgb3B0aW9uczogcHJldHR5VGltZU9wdGlvbnMgPSB7XG4gIHdpdGhTcGFjZXM6IGZhbHNlLFxuICB0b0ZpeGVkVmFsOiAxLFxuICBsb25nRm9ybWF0OiBmYWxzZSxcbn0pOiBzdHJpbmcge1xuICBsZXQgc2Vjb25kID0gbWlsbGlzZWNvbmRzIC8gMTAwMDtcbiAgaWYgKHNlY29uZCA8IDYwKSB7XG4gICAgcmV0dXJuIHVuaXRUb1N0cmluZyhzZWNvbmQsIDAsIG9wdGlvbnMpO1xuICB9XG4gIGxldCBtaW51dGUgPSBNYXRoLmZsb29yKHNlY29uZCAvIDYwKTtcbiAgc2Vjb25kICU9IDYwO1xuICBpZiAobWludXRlIDwgNjApIHtcbiAgICByZXR1cm4gdW5pdFRvU3RyaW5nKG1pbnV0ZSwgMSwgb3B0aW9ucykgKyB1bml0VG9TdHJpbmcoc2Vjb25kLCAwLCBvcHRpb25zKTtcbiAgfVxuICBsZXQgaG91ciA9IE1hdGguZmxvb3IobWludXRlIC8gNjApO1xuICBtaW51dGUgJT0gNjA7XG4gIGlmIChob3VyIDwgMjQpIHtcbiAgICByZXR1cm4gdW5pdFRvU3RyaW5nKGhvdXIsIDIsIG9wdGlvbnMpICsgdW5pdFRvU3RyaW5nKG1pbnV0ZSwgMSwgb3B0aW9ucykgK1xuICAgICAgdW5pdFRvU3RyaW5nKHNlY29uZCwgMCwgb3B0aW9ucyk7XG4gIH1cbiAgY29uc3QgZGF5ID0gTWF0aC5mbG9vcihob3VyIC8gMjQpO1xuICBob3VyICU9IDI0O1xuICByZXR1cm4gdW5pdFRvU3RyaW5nKGRheSwgMywgb3B0aW9ucykgKyB1bml0VG9TdHJpbmcoaG91ciwgMiwgb3B0aW9ucykgK1xuICAgIHVuaXRUb1N0cmluZyhtaW51dGUsIDEsIG9wdGlvbnMpICtcbiAgICB1bml0VG9TdHJpbmcoc2Vjb25kLCAwLCBvcHRpb25zKTtcbn1cblxuZnVuY3Rpb24gdW5pdFRvU3RyaW5nKFxuICB2YWw6IG51bWJlcixcbiAgaTogbnVtYmVyLFxuICB7IHdpdGhTcGFjZXMgPSBmYWxzZSwgdG9GaXhlZFZhbCA9IDEsIGxvbmdGb3JtYXQgPSBmYWxzZSB9OiBwcmV0dHlUaW1lT3B0aW9ucyxcbik6IHN0cmluZyB7XG4gIGNvbnN0IHVuaXRzID0gbG9uZ0Zvcm1hdFxuICAgID8gW1wic2Vjb25kXCIsIFwibWludXRlXCIsIFwiaG91clwiLCBcImRheVwiXVxuICAgIDogW1wic1wiLCBcIm1cIiwgXCJoXCIsIFwiZFwiXTtcbiAgY29uc3QgdW5pdCA9IGxvbmdGb3JtYXQgJiYgKHZhbCA+PSAyIHx8ICh2YWwgPiAxICYmIHRvRml4ZWRWYWwgPiAwKSlcbiAgICA/IHVuaXRzW2ldICsgXCJzXCJcbiAgICA6IHVuaXRzW2ldO1xuICBpZiAoaSA9PSAwKSB7XG4gICAgcmV0dXJuIHZhbC50b0ZpeGVkKHRvRml4ZWRWYWwpICsgdW5pdDtcbiAgfVxuICByZXR1cm4gdmFsICsgKHdpdGhTcGFjZXMgPyB1bml0ICsgXCIgXCIgOiB1bml0KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Q0FLQyxHQU9EOzs7O0NBSUMsR0FDRCxPQUFPLFNBQVMsV0FBVyxZQUFvQixFQUFFLFVBQTZCO0VBQzVFLFlBQVk7RUFDWixZQUFZO0VBQ1osWUFBWTtBQUNkLENBQUM7RUFDQyxJQUFJLFNBQVMsZUFBZTtFQUM1QixJQUFJLFNBQVMsSUFBSTtJQUNmLE9BQU8sYUFBYSxRQUFRLEdBQUc7RUFDakM7RUFDQSxJQUFJLFNBQVMsS0FBSyxLQUFLLENBQUMsU0FBUztFQUNqQyxVQUFVO0VBQ1YsSUFBSSxTQUFTLElBQUk7SUFDZixPQUFPLGFBQWEsUUFBUSxHQUFHLFdBQVcsYUFBYSxRQUFRLEdBQUc7RUFDcEU7RUFDQSxJQUFJLE9BQU8sS0FBSyxLQUFLLENBQUMsU0FBUztFQUMvQixVQUFVO0VBQ1YsSUFBSSxPQUFPLElBQUk7SUFDYixPQUFPLGFBQWEsTUFBTSxHQUFHLFdBQVcsYUFBYSxRQUFRLEdBQUcsV0FDOUQsYUFBYSxRQUFRLEdBQUc7RUFDNUI7RUFDQSxNQUFNLE1BQU0sS0FBSyxLQUFLLENBQUMsT0FBTztFQUM5QixRQUFRO0VBQ1IsT0FBTyxhQUFhLEtBQUssR0FBRyxXQUFXLGFBQWEsTUFBTSxHQUFHLFdBQzNELGFBQWEsUUFBUSxHQUFHLFdBQ3hCLGFBQWEsUUFBUSxHQUFHO0FBQzVCO0FBRUEsU0FBUyxhQUNQLEdBQVcsRUFDWCxDQUFTLEVBQ1QsRUFBRSxhQUFhLEtBQUssRUFBRSxhQUFhLENBQUMsRUFBRSxhQUFhLEtBQUssRUFBcUI7RUFFN0UsTUFBTSxRQUFRLGFBQ1Y7SUFBQztJQUFVO0lBQVU7SUFBUTtHQUFNLEdBQ25DO0lBQUM7SUFBSztJQUFLO0lBQUs7R0FBSTtFQUN4QixNQUFNLE9BQU8sY0FBYyxDQUFDLE9BQU8sS0FBTSxNQUFNLEtBQUssYUFBYSxDQUFFLElBQy9ELEtBQUssQ0FBQyxFQUFFLEdBQUcsTUFDWCxLQUFLLENBQUMsRUFBRTtFQUNaLElBQUksS0FBSyxHQUFHO0lBQ1YsT0FBTyxJQUFJLE9BQU8sQ0FBQyxjQUFjO0VBQ25DO0VBQ0EsT0FBTyxNQUFNLENBQUMsYUFBYSxPQUFPLE1BQU0sSUFBSTtBQUM5QyJ9
// denoCacheMetadata=15000689158661969117,9626943704010222124