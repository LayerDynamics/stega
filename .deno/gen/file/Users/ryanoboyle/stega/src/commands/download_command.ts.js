import { logger } from "../logger.ts";
import ProgressBar from "https://deno.land/x/progress@v1.3.8/mod.ts";
export const downloadCommand = {
  name: "download",
  description: "Download a file from a URL",
  options: [
    {
      name: "url",
      alias: "u",
      type: "string",
      description: "URL to download from",
      required: true
    },
    {
      name: "output",
      alias: "o",
      type: "string",
      description: "Output file path",
      required: false
    }
  ],
  action: async (args)=>{
    const url = args.flags.url;
    const output = args.flags.output || new URL(url).pathname.split("/").pop() || "download";
    logger.info(`Downloading ${url} to ${output}`);
    try {
      const response = await fetch(url);
      if (!response.ok || !response.body) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }
      const total = Number(response.headers.get("content-length")) || 0;
      const progress = new ProgressBar({
        title: "Downloading",
        total,
        complete: "=",
        incomplete: "-"
      });
      const file = await Deno.open(output, {
        write: true,
        create: true
      });
      const writer = file.writable.getWriter();
      let downloaded = 0;
      const reader = response.body.getReader();
      while(true){
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value);
        downloaded += value.length;
        progress.render(downloaded);
      }
      await writer.close();
      file.close();
      logger.info(`Download completed: ${output}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Download failed: ${errorMessage}`);
      throw error;
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29tbWFuZHMvZG93bmxvYWRfY29tbWFuZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21tYW5kIH0gZnJvbSBcIi4uL2NvcmUudHNcIjtcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gXCIuLi9sb2dnZXIudHNcIjtcbmltcG9ydCBQcm9ncmVzc0JhciBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9wcm9ncmVzc0B2MS4zLjgvbW9kLnRzXCI7XG5cbmV4cG9ydCBjb25zdCBkb3dubG9hZENvbW1hbmQ6IENvbW1hbmQgPSB7XG5cdG5hbWU6IFwiZG93bmxvYWRcIixcblx0ZGVzY3JpcHRpb246IFwiRG93bmxvYWQgYSBmaWxlIGZyb20gYSBVUkxcIixcblx0b3B0aW9uczogW1xuXHRcdHtcblx0XHRcdG5hbWU6IFwidXJsXCIsXG5cdFx0XHRhbGlhczogXCJ1XCIsXG5cdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0ZGVzY3JpcHRpb246IFwiVVJMIHRvIGRvd25sb2FkIGZyb21cIixcblx0XHRcdHJlcXVpcmVkOiB0cnVlLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0bmFtZTogXCJvdXRwdXRcIixcblx0XHRcdGFsaWFzOiBcIm9cIixcblx0XHRcdHR5cGU6IFwic3RyaW5nXCIsXG5cdFx0XHRkZXNjcmlwdGlvbjogXCJPdXRwdXQgZmlsZSBwYXRoXCIsXG5cdFx0XHRyZXF1aXJlZDogZmFsc2UsXG5cdFx0fSxcblx0XSxcblx0YWN0aW9uOiBhc3luYyAoYXJncykgPT4ge1xuXHRcdGNvbnN0IHVybCA9IGFyZ3MuZmxhZ3MudXJsIGFzIHN0cmluZztcblx0XHRjb25zdCBvdXRwdXQgPSBhcmdzLmZsYWdzLm91dHB1dCBhcyBzdHJpbmcgfHxcblx0XHRcdG5ldyBVUkwodXJsKS5wYXRobmFtZS5zcGxpdChcIi9cIikucG9wKCkgfHwgXCJkb3dubG9hZFwiO1xuXG5cdFx0bG9nZ2VyLmluZm8oYERvd25sb2FkaW5nICR7dXJsfSB0byAke291dHB1dH1gKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCk7XG5cdFx0XHRpZiAoIXJlc3BvbnNlLm9rIHx8ICFyZXNwb25zZS5ib2R5KSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGRvd25sb2FkOiAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YCk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHRvdGFsID0gTnVtYmVyKHJlc3BvbnNlLmhlYWRlcnMuZ2V0KFwiY29udGVudC1sZW5ndGhcIikpIHx8IDA7XG5cdFx0XHRjb25zdCBwcm9ncmVzcyA9IG5ldyBQcm9ncmVzc0Jhcih7XG5cdFx0XHRcdHRpdGxlOiBcIkRvd25sb2FkaW5nXCIsXG5cdFx0XHRcdHRvdGFsLFxuXHRcdFx0XHRjb21wbGV0ZTogXCI9XCIsXG5cdFx0XHRcdGluY29tcGxldGU6IFwiLVwiLFxuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IGZpbGUgPSBhd2FpdCBEZW5vLm9wZW4ob3V0cHV0LCB7IHdyaXRlOiB0cnVlLCBjcmVhdGU6IHRydWUgfSk7XG5cdFx0XHRjb25zdCB3cml0ZXIgPSBmaWxlLndyaXRhYmxlLmdldFdyaXRlcigpO1xuXG5cdFx0XHRsZXQgZG93bmxvYWRlZCA9IDA7XG5cdFx0XHRjb25zdCByZWFkZXIgPSByZXNwb25zZS5ib2R5LmdldFJlYWRlcigpO1xuXG5cdFx0XHR3aGlsZSAodHJ1ZSkge1xuXHRcdFx0XHRjb25zdCB7IGRvbmUsIHZhbHVlIH0gPSBhd2FpdCByZWFkZXIucmVhZCgpO1xuXHRcdFx0XHRpZiAoZG9uZSkgYnJlYWs7XG5cblx0XHRcdFx0YXdhaXQgd3JpdGVyLndyaXRlKHZhbHVlKTtcblx0XHRcdFx0ZG93bmxvYWRlZCArPSB2YWx1ZS5sZW5ndGg7XG5cdFx0XHRcdHByb2dyZXNzLnJlbmRlcihkb3dubG9hZGVkKTtcblx0XHRcdH1cblxuXHRcdFx0YXdhaXQgd3JpdGVyLmNsb3NlKCk7XG5cdFx0XHRmaWxlLmNsb3NlKCk7XG5cdFx0XHRsb2dnZXIuaW5mbyhgRG93bmxvYWQgY29tcGxldGVkOiAke291dHB1dH1gKTtcblx0XHR9IGNhdGNoIChlcnJvcjogdW5rbm93bikge1xuXHRcdFx0Y29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvclxuXHRcdFx0XHQ/IGVycm9yLm1lc3NhZ2Vcblx0XHRcdFx0OiBTdHJpbmcoZXJyb3IpO1xuXHRcdFx0bG9nZ2VyLmVycm9yKGBEb3dubG9hZCBmYWlsZWQ6ICR7ZXJyb3JNZXNzYWdlfWApO1xuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fVxuXHR9LFxufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxTQUFTLE1BQU0sUUFBUSxlQUFlO0FBQ3RDLE9BQU8saUJBQWlCLDZDQUE2QztBQUVyRSxPQUFPLE1BQU0sa0JBQTJCO0VBQ3ZDLE1BQU07RUFDTixhQUFhO0VBQ2IsU0FBUztJQUNSO01BQ0MsTUFBTTtNQUNOLE9BQU87TUFDUCxNQUFNO01BQ04sYUFBYTtNQUNiLFVBQVU7SUFDWDtJQUNBO01BQ0MsTUFBTTtNQUNOLE9BQU87TUFDUCxNQUFNO01BQ04sYUFBYTtNQUNiLFVBQVU7SUFDWDtHQUNBO0VBQ0QsUUFBUSxPQUFPO0lBQ2QsTUFBTSxNQUFNLEtBQUssS0FBSyxDQUFDLEdBQUc7SUFDMUIsTUFBTSxTQUFTLEtBQUssS0FBSyxDQUFDLE1BQU0sSUFDL0IsSUFBSSxJQUFJLEtBQUssUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsTUFBTTtJQUUzQyxPQUFPLElBQUksQ0FBQyxDQUFDLFlBQVksRUFBRSxJQUFJLElBQUksRUFBRSxPQUFPLENBQUM7SUFFN0MsSUFBSTtNQUNILE1BQU0sV0FBVyxNQUFNLE1BQU07TUFDN0IsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxJQUFJLEVBQUU7UUFDbkMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxTQUFTLFVBQVUsQ0FBQyxDQUFDO01BQzdEO01BRUEsTUFBTSxRQUFRLE9BQU8sU0FBUyxPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQjtNQUNoRSxNQUFNLFdBQVcsSUFBSSxZQUFZO1FBQ2hDLE9BQU87UUFDUDtRQUNBLFVBQVU7UUFDVixZQUFZO01BQ2I7TUFFQSxNQUFNLE9BQU8sTUFBTSxLQUFLLElBQUksQ0FBQyxRQUFRO1FBQUUsT0FBTztRQUFNLFFBQVE7TUFBSztNQUNqRSxNQUFNLFNBQVMsS0FBSyxRQUFRLENBQUMsU0FBUztNQUV0QyxJQUFJLGFBQWE7TUFDakIsTUFBTSxTQUFTLFNBQVMsSUFBSSxDQUFDLFNBQVM7TUFFdEMsTUFBTyxLQUFNO1FBQ1osTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxNQUFNLE9BQU8sSUFBSTtRQUN6QyxJQUFJLE1BQU07UUFFVixNQUFNLE9BQU8sS0FBSyxDQUFDO1FBQ25CLGNBQWMsTUFBTSxNQUFNO1FBQzFCLFNBQVMsTUFBTSxDQUFDO01BQ2pCO01BRUEsTUFBTSxPQUFPLEtBQUs7TUFDbEIsS0FBSyxLQUFLO01BQ1YsT0FBTyxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsRUFBRSxPQUFPLENBQUM7SUFDNUMsRUFBRSxPQUFPLE9BQWdCO01BQ3hCLE1BQU0sZUFBZSxpQkFBaUIsUUFDbkMsTUFBTSxPQUFPLEdBQ2IsT0FBTztNQUNWLE9BQU8sS0FBSyxDQUFDLENBQUMsaUJBQWlCLEVBQUUsYUFBYSxDQUFDO01BQy9DLE1BQU07SUFDUDtFQUNEO0FBQ0QsRUFBRSJ9
// denoCacheMetadata=8314731765824913576,10506340656857461339