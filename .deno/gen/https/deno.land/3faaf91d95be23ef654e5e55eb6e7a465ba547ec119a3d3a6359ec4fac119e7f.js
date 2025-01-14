// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
export function _common(paths, sep) {
  const [first = "", ...remaining] = paths;
  const parts = first.split(sep);
  let endOfPrefix = parts.length;
  let append = "";
  for (const path of remaining){
    const compare = path.split(sep);
    if (compare.length <= endOfPrefix) {
      endOfPrefix = compare.length;
      append = "";
    }
    for(let i = 0; i < endOfPrefix; i++){
      if (compare[i] !== parts[i]) {
        endOfPrefix = i;
        append = i === 0 ? "" : sep;
        break;
      }
    }
  }
  return parts.slice(0, endOfPrefix).join(sep) + append;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyNC4wL3BhdGgvX2NvbW1vbi9jb21tb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuZXhwb3J0IGZ1bmN0aW9uIF9jb21tb24ocGF0aHM6IHN0cmluZ1tdLCBzZXA6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IFtmaXJzdCA9IFwiXCIsIC4uLnJlbWFpbmluZ10gPSBwYXRocztcbiAgY29uc3QgcGFydHMgPSBmaXJzdC5zcGxpdChzZXApO1xuXG4gIGxldCBlbmRPZlByZWZpeCA9IHBhcnRzLmxlbmd0aDtcbiAgbGV0IGFwcGVuZCA9IFwiXCI7XG4gIGZvciAoY29uc3QgcGF0aCBvZiByZW1haW5pbmcpIHtcbiAgICBjb25zdCBjb21wYXJlID0gcGF0aC5zcGxpdChzZXApO1xuICAgIGlmIChjb21wYXJlLmxlbmd0aCA8PSBlbmRPZlByZWZpeCkge1xuICAgICAgZW5kT2ZQcmVmaXggPSBjb21wYXJlLmxlbmd0aDtcbiAgICAgIGFwcGVuZCA9IFwiXCI7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbmRPZlByZWZpeDsgaSsrKSB7XG4gICAgICBpZiAoY29tcGFyZVtpXSAhPT0gcGFydHNbaV0pIHtcbiAgICAgICAgZW5kT2ZQcmVmaXggPSBpO1xuICAgICAgICBhcHBlbmQgPSBpID09PSAwID8gXCJcIiA6IHNlcDtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBwYXJ0cy5zbGljZSgwLCBlbmRPZlByZWZpeCkuam9pbihzZXApICsgYXBwZW5kO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsT0FBTyxTQUFTLFFBQVEsS0FBZSxFQUFFLEdBQVc7RUFDbEQsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsVUFBVSxHQUFHO0VBQ25DLE1BQU0sUUFBUSxNQUFNLEtBQUssQ0FBQztFQUUxQixJQUFJLGNBQWMsTUFBTSxNQUFNO0VBQzlCLElBQUksU0FBUztFQUNiLEtBQUssTUFBTSxRQUFRLFVBQVc7SUFDNUIsTUFBTSxVQUFVLEtBQUssS0FBSyxDQUFDO0lBQzNCLElBQUksUUFBUSxNQUFNLElBQUksYUFBYTtNQUNqQyxjQUFjLFFBQVEsTUFBTTtNQUM1QixTQUFTO0lBQ1g7SUFFQSxJQUFLLElBQUksSUFBSSxHQUFHLElBQUksYUFBYSxJQUFLO01BQ3BDLElBQUksT0FBTyxDQUFDLEVBQUUsS0FBSyxLQUFLLENBQUMsRUFBRSxFQUFFO1FBQzNCLGNBQWM7UUFDZCxTQUFTLE1BQU0sSUFBSSxLQUFLO1FBQ3hCO01BQ0Y7SUFDRjtFQUNGO0VBQ0EsT0FBTyxNQUFNLEtBQUssQ0FBQyxHQUFHLGFBQWEsSUFBSSxDQUFDLE9BQU87QUFDakQifQ==
// denoCacheMetadata=6471636539814244763,14615935372036384259