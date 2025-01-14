export class MockCommand {
  #cmd;
  #options;
  #shouldSucceed;
  constructor(cmd, options, shouldSucceed = true){
    this.#cmd = cmd.toString();
    this.#options = options ?? {
      args: []
    };
    this.#shouldSucceed = shouldSucceed;
  }
  output() {
    return Promise.resolve({
      code: this.#shouldSucceed ? 0 : 1,
      success: this.#shouldSucceed,
      stdout: new Uint8Array(),
      stderr: new Uint8Array(),
      signal: null
    });
  }
  spawn() {
    return {
      pid: 1234,
      status: Promise.resolve({
        success: this.#shouldSucceed,
        code: this.#shouldSucceed ? 0 : 1,
        signal: null
      }),
      output: ()=>this.output(),
      stderrOutput: ()=>Promise.resolve(new Uint8Array()),
      stdin: new WritableStream(),
      stdout: new ReadableStream(),
      stderr: new ReadableStream(),
      unref () {},
      ref () {},
      kill () {}
    };
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy91dGlscy9tb2NrX2NvbW1hbmQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIE1vY2tDb21tYW5kIGltcGxlbWVudHMgRGVuby5Db21tYW5kIHtcblx0I2NtZDogc3RyaW5nO1xuXHQjb3B0aW9uczogRGVuby5Db21tYW5kT3B0aW9ucztcblx0I3Nob3VsZFN1Y2NlZWQ6IGJvb2xlYW47XG5cblx0Y29uc3RydWN0b3IoXG5cdFx0Y21kOiBzdHJpbmcgfCBVUkwsXG5cdFx0b3B0aW9ucz86IERlbm8uQ29tbWFuZE9wdGlvbnMsXG5cdFx0c2hvdWxkU3VjY2VlZCA9IHRydWUsXG5cdCkge1xuXHRcdHRoaXMuI2NtZCA9IGNtZC50b1N0cmluZygpO1xuXHRcdHRoaXMuI29wdGlvbnMgPSBvcHRpb25zID8/IHsgYXJnczogW10gfTtcblx0XHR0aGlzLiNzaG91bGRTdWNjZWVkID0gc2hvdWxkU3VjY2VlZDtcblx0fVxuXG5cdG91dHB1dCgpOiBQcm9taXNlPERlbm8uQ29tbWFuZE91dHB1dD4ge1xuXHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuXHRcdFx0Y29kZTogdGhpcy4jc2hvdWxkU3VjY2VlZCA/IDAgOiAxLFxuXHRcdFx0c3VjY2VzczogdGhpcy4jc2hvdWxkU3VjY2VlZCxcblx0XHRcdHN0ZG91dDogbmV3IFVpbnQ4QXJyYXkoKSxcblx0XHRcdHN0ZGVycjogbmV3IFVpbnQ4QXJyYXkoKSxcblx0XHRcdHNpZ25hbDogbnVsbCxcblx0XHR9KTtcblx0fVxuXG5cdHNwYXduKCk6IERlbm8uQ2hpbGRQcm9jZXNzIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cGlkOiAxMjM0LFxuXHRcdFx0c3RhdHVzOiBQcm9taXNlLnJlc29sdmUoe1xuXHRcdFx0XHRzdWNjZXNzOiB0aGlzLiNzaG91bGRTdWNjZWVkLFxuXHRcdFx0XHRjb2RlOiB0aGlzLiNzaG91bGRTdWNjZWVkID8gMCA6IDEsXG5cdFx0XHRcdHNpZ25hbDogbnVsbCxcblx0XHRcdH0pLFxuXHRcdFx0b3V0cHV0OiAoKSA9PiB0aGlzLm91dHB1dCgpLFxuXHRcdFx0c3RkZXJyT3V0cHV0OiAoKSA9PiBQcm9taXNlLnJlc29sdmUobmV3IFVpbnQ4QXJyYXkoKSksXG5cdFx0XHRzdGRpbjogbmV3IFdyaXRhYmxlU3RyZWFtKCksXG5cdFx0XHRzdGRvdXQ6IG5ldyBSZWFkYWJsZVN0cmVhbSgpLFxuXHRcdFx0c3RkZXJyOiBuZXcgUmVhZGFibGVTdHJlYW0oKSxcblx0XHRcdHVucmVmKCkge30sXG5cdFx0XHRyZWYoKSB7fSxcblx0XHRcdGtpbGwoKSB7fSxcblx0XHR9O1xuXHR9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxNQUFNO0VBQ1osQ0FBQSxHQUFJLENBQVM7RUFDYixDQUFBLE9BQVEsQ0FBc0I7RUFDOUIsQ0FBQSxhQUFjLENBQVU7RUFFeEIsWUFDQyxHQUFpQixFQUNqQixPQUE2QixFQUM3QixnQkFBZ0IsSUFBSSxDQUNuQjtJQUNELElBQUksQ0FBQyxDQUFBLEdBQUksR0FBRyxJQUFJLFFBQVE7SUFDeEIsSUFBSSxDQUFDLENBQUEsT0FBUSxHQUFHLFdBQVc7TUFBRSxNQUFNLEVBQUU7SUFBQztJQUN0QyxJQUFJLENBQUMsQ0FBQSxhQUFjLEdBQUc7RUFDdkI7RUFFQSxTQUFzQztJQUNyQyxPQUFPLFFBQVEsT0FBTyxDQUFDO01BQ3RCLE1BQU0sSUFBSSxDQUFDLENBQUEsYUFBYyxHQUFHLElBQUk7TUFDaEMsU0FBUyxJQUFJLENBQUMsQ0FBQSxhQUFjO01BQzVCLFFBQVEsSUFBSTtNQUNaLFFBQVEsSUFBSTtNQUNaLFFBQVE7SUFDVDtFQUNEO0VBRUEsUUFBMkI7SUFDMUIsT0FBTztNQUNOLEtBQUs7TUFDTCxRQUFRLFFBQVEsT0FBTyxDQUFDO1FBQ3ZCLFNBQVMsSUFBSSxDQUFDLENBQUEsYUFBYztRQUM1QixNQUFNLElBQUksQ0FBQyxDQUFBLGFBQWMsR0FBRyxJQUFJO1FBQ2hDLFFBQVE7TUFDVDtNQUNBLFFBQVEsSUFBTSxJQUFJLENBQUMsTUFBTTtNQUN6QixjQUFjLElBQU0sUUFBUSxPQUFPLENBQUMsSUFBSTtNQUN4QyxPQUFPLElBQUk7TUFDWCxRQUFRLElBQUk7TUFDWixRQUFRLElBQUk7TUFDWixVQUFTO01BQ1QsUUFBTztNQUNQLFNBQVE7SUFDVDtFQUNEO0FBQ0QifQ==
// denoCacheMetadata=10324651771076423521,17892083013132037607