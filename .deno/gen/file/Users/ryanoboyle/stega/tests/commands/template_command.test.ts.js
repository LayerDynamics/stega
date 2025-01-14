// tests/commands/template_command.test.ts
import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { createTemplateCommand } from "../../src/commands/template_command.ts";
import { cleanupTempFiles, createTempFile, createTestCLI } from "../test_utils.ts";
Deno.test({
  name: "Template Command - Variable validation with invalid input",
  async fn () {
    const { cli, logger } = await createTestCLI();
    const command = createTemplateCommand(cli);
    cli.register(command);
    // Create test template and config files
    const templatePath = await createTempFile("Email: {{email}}");
    const configPath = await createTempFile(JSON.stringify({
      description: "Test template with validation",
      variables: [
        {
          name: "email",
          type: "string",
          required: true,
          validation: "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
        }
      ]
    }));
    let outputPath1 = "";
    try {
      // Register the template
      await cli.runCommand([
        "template",
        "add",
        "--name=email-template",
        `--source=${templatePath}`,
        `--config=${configPath}`
      ]);
      // Test case: Invalid email
      outputPath1 = await createTempFile("Existing content");
      await assertRejects(async ()=>{
        await cli.runCommand([
          "template",
          "generate",
          "--template=email-template",
          `--output=${outputPath1}`,
          "--variables",
          JSON.stringify({
            email: "invalid-email"
          }),
          "--force"
        ]);
      }, Error, "Variable validation failed");
    // Optionally, verify that the error was logged
    // assert(logger.errors.includes("Validation failed for email: Value does not match pattern"));
    } finally{
      // Clean up all temporary files
      await cleanupTempFiles(templatePath, configPath, outputPath1);
    }
  }
});
Deno.test({
  name: "Template Command - Variable validation with valid input",
  async fn () {
    const { cli, logger } = await createTestCLI();
    const command = createTemplateCommand(cli);
    cli.register(command);
    // Create test template and config files
    const templatePath = await createTempFile("Email: {{email}}");
    const configPath = await createTempFile(JSON.stringify({
      description: "Test template with validation",
      variables: [
        {
          name: "email",
          type: "string",
          required: true,
          validation: "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
        }
      ]
    }));
    let outputPath2 = "";
    try {
      // Register the template
      await cli.runCommand([
        "template",
        "add",
        "--name=email-template-valid",
        `--source=${templatePath}`,
        `--config=${configPath}`
      ]);
      // Test case: Valid email
      outputPath2 = await createTempFile("Existing content");
      await cli.runCommand([
        "template",
        "generate",
        "--template=email-template-valid",
        `--output=${outputPath2}`,
        "--variables",
        JSON.stringify({
          email: "test@example.com"
        }),
        "--force"
      ]);
      const content = await Deno.readTextFile(outputPath2);
      assertEquals(content, "Email: test@example.com");
    } finally{
      // Clean up all temporary files
      await cleanupTempFiles(templatePath, configPath, outputPath2);
    }
  }
});
Deno.test({
  name: "Template Command - Template hooks",
  async fn () {
    const { cli, logger } = await createTestCLI();
    const command = createTemplateCommand(cli);
    cli.register(command);
    // Create test template and config files with hooks
    const templatePath = await createTempFile("Content: {{content}}");
    const configPath = await createTempFile(JSON.stringify({
      description: "Test template with hooks",
      variables: [
        {
          name: "content",
          type: "string",
          required: true
        }
      ],
      hooks: {
        // Hooks manipulate context or content directly
        beforeRender: "context.content = context.content.toUpperCase();",
        afterRender: "return context.replace('Content:', 'Modified:');",
        validate: "return context.includes('Modified:');"
      }
    }));
    let outputPath = "";
    try {
      // Register the template
      await cli.runCommand([
        "template",
        "add",
        "--name=hook-template",
        `--source=${templatePath}`,
        `--config=${configPath}`
      ]);
      // Generate content using the template with hooks
      outputPath = await createTempFile("Existing content");
      await cli.runCommand([
        "template",
        "generate",
        "--template=hook-template",
        `--output=${outputPath}`,
        "--variables",
        JSON.stringify({
          content: "test content"
        }),
        "--force"
      ]);
      const result = await Deno.readTextFile(outputPath);
      assertEquals(result, "Modified: TEST CONTENT");
    } finally{
      // Clean up all temporary files
      await cleanupTempFiles(templatePath, configPath, outputPath);
    }
  }
});
Deno.test({
  name: "Template Command - File handling with nonexistent files",
  async fn () {
    const { cli, logger } = await createTestCLI();
    const command = createTemplateCommand(cli);
    cli.register(command);
    // 1) Test nonexistent file handling
    await assertRejects(async ()=>{
      await cli.runCommand([
        "template",
        "add",
        "--name=missing-template",
        "--source=nonexistent.txt",
        "--config=nonexistent.json"
      ]);
    }, Error, "No such file or directory");
  // Optionally, verify that the error was logged
  // assert(logger.errors.includes("Failed to add template: No such file or directory: nonexistent.txt"));
  }
});
Deno.test({
  name: "Template Command - File handling with existing files",
  async fn () {
    const { cli, logger } = await createTestCLI();
    const command = createTemplateCommand(cli);
    cli.register(command);
    // 2) Test with existing files
    const templatePath = await createTempFile("Test content");
    const configPath = await createTempFile(JSON.stringify({
      description: "Test template for file handling",
      variables: []
    }));
    let outputPath = "";
    try {
      // Register the template
      await cli.runCommand([
        "template",
        "add",
        "--name=file-test",
        `--source=${templatePath}`,
        `--config=${configPath}`
      ]);
      // Test overwrite protection
      outputPath = await createTempFile("Existing content");
      // Should fail without --force
      await assertRejects(async ()=>{
        await cli.runCommand([
          "template",
          "generate",
          "--template=file-test",
          `--output=${outputPath}`
        ]);
      }, Error, "Output file");
      // Should succeed with --force
      await cli.runCommand([
        "template",
        "generate",
        "--template=file-test",
        `--output=${outputPath}`,
        "--force"
      ]);
      const result = await Deno.readTextFile(outputPath);
      assertEquals(result, "Test content");
    } finally{
      // Clean up all temporary files
      await cleanupTempFiles(templatePath, configPath, outputPath);
    }
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS90ZXN0cy9jb21tYW5kcy90ZW1wbGF0ZV9jb21tYW5kLnRlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGVzdHMvY29tbWFuZHMvdGVtcGxhdGVfY29tbWFuZC50ZXN0LnRzXG5pbXBvcnQge1xuXHRhc3NlcnRFcXVhbHMsXG5cdGFzc2VydFJlamVjdHMsXG59IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4yMjQuMC90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbmltcG9ydCB7IGNyZWF0ZVRlbXBsYXRlQ29tbWFuZCB9IGZyb20gXCIuLi8uLi9zcmMvY29tbWFuZHMvdGVtcGxhdGVfY29tbWFuZC50c1wiO1xuaW1wb3J0IHtcblx0Y2xlYW51cFRlbXBGaWxlcyxcblx0Y3JlYXRlVGVtcEZpbGUsXG5cdGNyZWF0ZVRlc3RDTEksXG59IGZyb20gXCIuLi90ZXN0X3V0aWxzLnRzXCI7XG5cbkRlbm8udGVzdCh7XG5cdG5hbWU6IFwiVGVtcGxhdGUgQ29tbWFuZCAtIFZhcmlhYmxlIHZhbGlkYXRpb24gd2l0aCBpbnZhbGlkIGlucHV0XCIsXG5cdGFzeW5jIGZuKCkge1xuXHRcdGNvbnN0IHsgY2xpLCBsb2dnZXIgfSA9IGF3YWl0IGNyZWF0ZVRlc3RDTEkoKTtcblx0XHRjb25zdCBjb21tYW5kID0gY3JlYXRlVGVtcGxhdGVDb21tYW5kKGNsaSk7XG5cdFx0Y2xpLnJlZ2lzdGVyKGNvbW1hbmQpO1xuXG5cdFx0Ly8gQ3JlYXRlIHRlc3QgdGVtcGxhdGUgYW5kIGNvbmZpZyBmaWxlc1xuXHRcdGNvbnN0IHRlbXBsYXRlUGF0aCA9IGF3YWl0IGNyZWF0ZVRlbXBGaWxlKFwiRW1haWw6IHt7ZW1haWx9fVwiKTtcblx0XHRjb25zdCBjb25maWdQYXRoID0gYXdhaXQgY3JlYXRlVGVtcEZpbGUoXG5cdFx0XHRKU09OLnN0cmluZ2lmeSh7XG5cdFx0XHRcdGRlc2NyaXB0aW9uOiBcIlRlc3QgdGVtcGxhdGUgd2l0aCB2YWxpZGF0aW9uXCIsXG5cdFx0XHRcdHZhcmlhYmxlczogW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdG5hbWU6IFwiZW1haWxcIixcblx0XHRcdFx0XHRcdHR5cGU6IFwic3RyaW5nXCIsXG5cdFx0XHRcdFx0XHRyZXF1aXJlZDogdHJ1ZSxcblx0XHRcdFx0XHRcdHZhbGlkYXRpb246IFwiXltBLVphLXowLTkuXyUrLV0rQFtBLVphLXowLTkuLV0rXFxcXC5bQS1aYS16XXsyLH0kXCIsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XSxcblx0XHRcdH0pLFxuXHRcdCk7XG5cblx0XHRsZXQgb3V0cHV0UGF0aDEgPSBcIlwiO1xuXG5cdFx0dHJ5IHtcblx0XHRcdC8vIFJlZ2lzdGVyIHRoZSB0ZW1wbGF0ZVxuXHRcdFx0YXdhaXQgY2xpLnJ1bkNvbW1hbmQoW1xuXHRcdFx0XHRcInRlbXBsYXRlXCIsXG5cdFx0XHRcdFwiYWRkXCIsXG5cdFx0XHRcdFwiLS1uYW1lPWVtYWlsLXRlbXBsYXRlXCIsXG5cdFx0XHRcdGAtLXNvdXJjZT0ke3RlbXBsYXRlUGF0aH1gLFxuXHRcdFx0XHRgLS1jb25maWc9JHtjb25maWdQYXRofWAsXG5cdFx0XHRdKTtcblxuXHRcdFx0Ly8gVGVzdCBjYXNlOiBJbnZhbGlkIGVtYWlsXG5cdFx0XHRvdXRwdXRQYXRoMSA9IGF3YWl0IGNyZWF0ZVRlbXBGaWxlKFwiRXhpc3RpbmcgY29udGVudFwiKTtcblxuXHRcdFx0YXdhaXQgYXNzZXJ0UmVqZWN0cyhcblx0XHRcdFx0YXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdGF3YWl0IGNsaS5ydW5Db21tYW5kKFtcblx0XHRcdFx0XHRcdFwidGVtcGxhdGVcIixcblx0XHRcdFx0XHRcdFwiZ2VuZXJhdGVcIixcblx0XHRcdFx0XHRcdFwiLS10ZW1wbGF0ZT1lbWFpbC10ZW1wbGF0ZVwiLFxuXHRcdFx0XHRcdFx0YC0tb3V0cHV0PSR7b3V0cHV0UGF0aDF9YCxcblx0XHRcdFx0XHRcdFwiLS12YXJpYWJsZXNcIixcblx0XHRcdFx0XHRcdEpTT04uc3RyaW5naWZ5KHsgZW1haWw6IFwiaW52YWxpZC1lbWFpbFwiIH0pLFxuXHRcdFx0XHRcdFx0XCItLWZvcmNlXCIsIC8vIENvcnJlY3RseSBwYXNzaW5nIC0tZm9yY2Ugd2l0aG91dCB2YWx1ZVxuXHRcdFx0XHRcdF0pO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRFcnJvcixcblx0XHRcdFx0XCJWYXJpYWJsZSB2YWxpZGF0aW9uIGZhaWxlZFwiLFxuXHRcdFx0KTtcblxuXHRcdFx0Ly8gT3B0aW9uYWxseSwgdmVyaWZ5IHRoYXQgdGhlIGVycm9yIHdhcyBsb2dnZWRcblx0XHRcdC8vIGFzc2VydChsb2dnZXIuZXJyb3JzLmluY2x1ZGVzKFwiVmFsaWRhdGlvbiBmYWlsZWQgZm9yIGVtYWlsOiBWYWx1ZSBkb2VzIG5vdCBtYXRjaCBwYXR0ZXJuXCIpKTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0Ly8gQ2xlYW4gdXAgYWxsIHRlbXBvcmFyeSBmaWxlc1xuXHRcdFx0YXdhaXQgY2xlYW51cFRlbXBGaWxlcyh0ZW1wbGF0ZVBhdGgsIGNvbmZpZ1BhdGgsIG91dHB1dFBhdGgxKTtcblx0XHR9XG5cdH0sXG59KTtcblxuRGVuby50ZXN0KHtcblx0bmFtZTogXCJUZW1wbGF0ZSBDb21tYW5kIC0gVmFyaWFibGUgdmFsaWRhdGlvbiB3aXRoIHZhbGlkIGlucHV0XCIsXG5cdGFzeW5jIGZuKCkge1xuXHRcdGNvbnN0IHsgY2xpLCBsb2dnZXIgfSA9IGF3YWl0IGNyZWF0ZVRlc3RDTEkoKTtcblx0XHRjb25zdCBjb21tYW5kID0gY3JlYXRlVGVtcGxhdGVDb21tYW5kKGNsaSk7XG5cdFx0Y2xpLnJlZ2lzdGVyKGNvbW1hbmQpO1xuXG5cdFx0Ly8gQ3JlYXRlIHRlc3QgdGVtcGxhdGUgYW5kIGNvbmZpZyBmaWxlc1xuXHRcdGNvbnN0IHRlbXBsYXRlUGF0aCA9IGF3YWl0IGNyZWF0ZVRlbXBGaWxlKFwiRW1haWw6IHt7ZW1haWx9fVwiKTtcblx0XHRjb25zdCBjb25maWdQYXRoID0gYXdhaXQgY3JlYXRlVGVtcEZpbGUoXG5cdFx0XHRKU09OLnN0cmluZ2lmeSh7XG5cdFx0XHRcdGRlc2NyaXB0aW9uOiBcIlRlc3QgdGVtcGxhdGUgd2l0aCB2YWxpZGF0aW9uXCIsXG5cdFx0XHRcdHZhcmlhYmxlczogW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdG5hbWU6IFwiZW1haWxcIixcblx0XHRcdFx0XHRcdHR5cGU6IFwic3RyaW5nXCIsXG5cdFx0XHRcdFx0XHRyZXF1aXJlZDogdHJ1ZSxcblx0XHRcdFx0XHRcdHZhbGlkYXRpb246IFwiXltBLVphLXowLTkuXyUrLV0rQFtBLVphLXowLTkuLV0rXFxcXC5bQS1aYS16XXsyLH0kXCIsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XSxcblx0XHRcdH0pLFxuXHRcdCk7XG5cblx0XHRsZXQgb3V0cHV0UGF0aDIgPSBcIlwiO1xuXG5cdFx0dHJ5IHtcblx0XHRcdC8vIFJlZ2lzdGVyIHRoZSB0ZW1wbGF0ZVxuXHRcdFx0YXdhaXQgY2xpLnJ1bkNvbW1hbmQoW1xuXHRcdFx0XHRcInRlbXBsYXRlXCIsXG5cdFx0XHRcdFwiYWRkXCIsXG5cdFx0XHRcdFwiLS1uYW1lPWVtYWlsLXRlbXBsYXRlLXZhbGlkXCIsXG5cdFx0XHRcdGAtLXNvdXJjZT0ke3RlbXBsYXRlUGF0aH1gLFxuXHRcdFx0XHRgLS1jb25maWc9JHtjb25maWdQYXRofWAsXG5cdFx0XHRdKTtcblxuXHRcdFx0Ly8gVGVzdCBjYXNlOiBWYWxpZCBlbWFpbFxuXHRcdFx0b3V0cHV0UGF0aDIgPSBhd2FpdCBjcmVhdGVUZW1wRmlsZShcIkV4aXN0aW5nIGNvbnRlbnRcIik7XG5cblx0XHRcdGF3YWl0IGNsaS5ydW5Db21tYW5kKFtcblx0XHRcdFx0XCJ0ZW1wbGF0ZVwiLFxuXHRcdFx0XHRcImdlbmVyYXRlXCIsXG5cdFx0XHRcdFwiLS10ZW1wbGF0ZT1lbWFpbC10ZW1wbGF0ZS12YWxpZFwiLFxuXHRcdFx0XHRgLS1vdXRwdXQ9JHtvdXRwdXRQYXRoMn1gLFxuXHRcdFx0XHRcIi0tdmFyaWFibGVzXCIsXG5cdFx0XHRcdEpTT04uc3RyaW5naWZ5KHsgZW1haWw6IFwidGVzdEBleGFtcGxlLmNvbVwiIH0pLFxuXHRcdFx0XHRcIi0tZm9yY2VcIiwgLy8gQ29ycmVjdGx5IHBhc3NpbmcgLS1mb3JjZSB3aXRob3V0IHZhbHVlXG5cdFx0XHRdKTtcblxuXHRcdFx0Y29uc3QgY29udGVudCA9IGF3YWl0IERlbm8ucmVhZFRleHRGaWxlKG91dHB1dFBhdGgyKTtcblx0XHRcdGFzc2VydEVxdWFscyhjb250ZW50LCBcIkVtYWlsOiB0ZXN0QGV4YW1wbGUuY29tXCIpO1xuXHRcdH0gZmluYWxseSB7XG5cdFx0XHQvLyBDbGVhbiB1cCBhbGwgdGVtcG9yYXJ5IGZpbGVzXG5cdFx0XHRhd2FpdCBjbGVhbnVwVGVtcEZpbGVzKHRlbXBsYXRlUGF0aCwgY29uZmlnUGF0aCwgb3V0cHV0UGF0aDIpO1xuXHRcdH1cblx0fSxcbn0pO1xuXG5EZW5vLnRlc3Qoe1xuXHRuYW1lOiBcIlRlbXBsYXRlIENvbW1hbmQgLSBUZW1wbGF0ZSBob29rc1wiLFxuXHRhc3luYyBmbigpIHtcblx0XHRjb25zdCB7IGNsaSwgbG9nZ2VyIH0gPSBhd2FpdCBjcmVhdGVUZXN0Q0xJKCk7XG5cdFx0Y29uc3QgY29tbWFuZCA9IGNyZWF0ZVRlbXBsYXRlQ29tbWFuZChjbGkpO1xuXHRcdGNsaS5yZWdpc3Rlcihjb21tYW5kKTtcblxuXHRcdC8vIENyZWF0ZSB0ZXN0IHRlbXBsYXRlIGFuZCBjb25maWcgZmlsZXMgd2l0aCBob29rc1xuXHRcdGNvbnN0IHRlbXBsYXRlUGF0aCA9IGF3YWl0IGNyZWF0ZVRlbXBGaWxlKFwiQ29udGVudDoge3tjb250ZW50fX1cIik7XG5cdFx0Y29uc3QgY29uZmlnUGF0aCA9IGF3YWl0IGNyZWF0ZVRlbXBGaWxlKFxuXHRcdFx0SlNPTi5zdHJpbmdpZnkoe1xuXHRcdFx0XHRkZXNjcmlwdGlvbjogXCJUZXN0IHRlbXBsYXRlIHdpdGggaG9va3NcIixcblx0XHRcdFx0dmFyaWFibGVzOiBbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bmFtZTogXCJjb250ZW50XCIsXG5cdFx0XHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0XHRcdFx0cmVxdWlyZWQ6IHRydWUsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XSxcblx0XHRcdFx0aG9va3M6IHtcblx0XHRcdFx0XHQvLyBIb29rcyBtYW5pcHVsYXRlIGNvbnRleHQgb3IgY29udGVudCBkaXJlY3RseVxuXHRcdFx0XHRcdGJlZm9yZVJlbmRlcjogXCJjb250ZXh0LmNvbnRlbnQgPSBjb250ZXh0LmNvbnRlbnQudG9VcHBlckNhc2UoKTtcIixcblx0XHRcdFx0XHRhZnRlclJlbmRlcjogXCJyZXR1cm4gY29udGV4dC5yZXBsYWNlKCdDb250ZW50OicsICdNb2RpZmllZDonKTtcIixcblx0XHRcdFx0XHR2YWxpZGF0ZTogXCJyZXR1cm4gY29udGV4dC5pbmNsdWRlcygnTW9kaWZpZWQ6Jyk7XCIsXG5cdFx0XHRcdH0sXG5cdFx0XHR9KSxcblx0XHQpO1xuXG5cdFx0bGV0IG91dHB1dFBhdGggPSBcIlwiO1xuXG5cdFx0dHJ5IHtcblx0XHRcdC8vIFJlZ2lzdGVyIHRoZSB0ZW1wbGF0ZVxuXHRcdFx0YXdhaXQgY2xpLnJ1bkNvbW1hbmQoW1xuXHRcdFx0XHRcInRlbXBsYXRlXCIsXG5cdFx0XHRcdFwiYWRkXCIsXG5cdFx0XHRcdFwiLS1uYW1lPWhvb2stdGVtcGxhdGVcIixcblx0XHRcdFx0YC0tc291cmNlPSR7dGVtcGxhdGVQYXRofWAsXG5cdFx0XHRcdGAtLWNvbmZpZz0ke2NvbmZpZ1BhdGh9YCxcblx0XHRcdF0pO1xuXG5cdFx0XHQvLyBHZW5lcmF0ZSBjb250ZW50IHVzaW5nIHRoZSB0ZW1wbGF0ZSB3aXRoIGhvb2tzXG5cdFx0XHRvdXRwdXRQYXRoID0gYXdhaXQgY3JlYXRlVGVtcEZpbGUoXCJFeGlzdGluZyBjb250ZW50XCIpO1xuXG5cdFx0XHRhd2FpdCBjbGkucnVuQ29tbWFuZChbXG5cdFx0XHRcdFwidGVtcGxhdGVcIixcblx0XHRcdFx0XCJnZW5lcmF0ZVwiLFxuXHRcdFx0XHRcIi0tdGVtcGxhdGU9aG9vay10ZW1wbGF0ZVwiLFxuXHRcdFx0XHRgLS1vdXRwdXQ9JHtvdXRwdXRQYXRofWAsXG5cdFx0XHRcdFwiLS12YXJpYWJsZXNcIixcblx0XHRcdFx0SlNPTi5zdHJpbmdpZnkoeyBjb250ZW50OiBcInRlc3QgY29udGVudFwiIH0pLFxuXHRcdFx0XHRcIi0tZm9yY2VcIiwgLy8gQ29ycmVjdGx5IHBhc3NpbmcgLS1mb3JjZSB3aXRob3V0IHZhbHVlXG5cdFx0XHRdKTtcblxuXHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUob3V0cHV0UGF0aCk7XG5cdFx0XHRhc3NlcnRFcXVhbHMocmVzdWx0LCBcIk1vZGlmaWVkOiBURVNUIENPTlRFTlRcIik7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdC8vIENsZWFuIHVwIGFsbCB0ZW1wb3JhcnkgZmlsZXNcblx0XHRcdGF3YWl0IGNsZWFudXBUZW1wRmlsZXModGVtcGxhdGVQYXRoLCBjb25maWdQYXRoLCBvdXRwdXRQYXRoKTtcblx0XHR9XG5cdH0sXG59KTtcblxuRGVuby50ZXN0KHtcblx0bmFtZTogXCJUZW1wbGF0ZSBDb21tYW5kIC0gRmlsZSBoYW5kbGluZyB3aXRoIG5vbmV4aXN0ZW50IGZpbGVzXCIsXG5cdGFzeW5jIGZuKCkge1xuXHRcdGNvbnN0IHsgY2xpLCBsb2dnZXIgfSA9IGF3YWl0IGNyZWF0ZVRlc3RDTEkoKTtcblx0XHRjb25zdCBjb21tYW5kID0gY3JlYXRlVGVtcGxhdGVDb21tYW5kKGNsaSk7XG5cdFx0Y2xpLnJlZ2lzdGVyKGNvbW1hbmQpO1xuXG5cdFx0Ly8gMSkgVGVzdCBub25leGlzdGVudCBmaWxlIGhhbmRsaW5nXG5cdFx0YXdhaXQgYXNzZXJ0UmVqZWN0cyhcblx0XHRcdGFzeW5jICgpID0+IHtcblx0XHRcdFx0YXdhaXQgY2xpLnJ1bkNvbW1hbmQoW1xuXHRcdFx0XHRcdFwidGVtcGxhdGVcIixcblx0XHRcdFx0XHRcImFkZFwiLFxuXHRcdFx0XHRcdFwiLS1uYW1lPW1pc3NpbmctdGVtcGxhdGVcIixcblx0XHRcdFx0XHRcIi0tc291cmNlPW5vbmV4aXN0ZW50LnR4dFwiLFxuXHRcdFx0XHRcdFwiLS1jb25maWc9bm9uZXhpc3RlbnQuanNvblwiLFxuXHRcdFx0XHRdKTtcblx0XHRcdH0sXG5cdFx0XHRFcnJvcixcblx0XHRcdFwiTm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeVwiLFxuXHRcdCk7XG5cblx0XHQvLyBPcHRpb25hbGx5LCB2ZXJpZnkgdGhhdCB0aGUgZXJyb3Igd2FzIGxvZ2dlZFxuXHRcdC8vIGFzc2VydChsb2dnZXIuZXJyb3JzLmluY2x1ZGVzKFwiRmFpbGVkIHRvIGFkZCB0ZW1wbGF0ZTogTm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeTogbm9uZXhpc3RlbnQudHh0XCIpKTtcblx0fSxcbn0pO1xuXG5EZW5vLnRlc3Qoe1xuXHRuYW1lOiBcIlRlbXBsYXRlIENvbW1hbmQgLSBGaWxlIGhhbmRsaW5nIHdpdGggZXhpc3RpbmcgZmlsZXNcIixcblx0YXN5bmMgZm4oKSB7XG5cdFx0Y29uc3QgeyBjbGksIGxvZ2dlciB9ID0gYXdhaXQgY3JlYXRlVGVzdENMSSgpO1xuXHRcdGNvbnN0IGNvbW1hbmQgPSBjcmVhdGVUZW1wbGF0ZUNvbW1hbmQoY2xpKTtcblx0XHRjbGkucmVnaXN0ZXIoY29tbWFuZCk7XG5cblx0XHQvLyAyKSBUZXN0IHdpdGggZXhpc3RpbmcgZmlsZXNcblx0XHRjb25zdCB0ZW1wbGF0ZVBhdGggPSBhd2FpdCBjcmVhdGVUZW1wRmlsZShcIlRlc3QgY29udGVudFwiKTtcblx0XHRjb25zdCBjb25maWdQYXRoID0gYXdhaXQgY3JlYXRlVGVtcEZpbGUoXG5cdFx0XHRKU09OLnN0cmluZ2lmeSh7XG5cdFx0XHRcdGRlc2NyaXB0aW9uOiBcIlRlc3QgdGVtcGxhdGUgZm9yIGZpbGUgaGFuZGxpbmdcIixcblx0XHRcdFx0dmFyaWFibGVzOiBbXSxcblx0XHRcdH0pLFxuXHRcdCk7XG5cblx0XHRsZXQgb3V0cHV0UGF0aCA9IFwiXCI7XG5cblx0XHR0cnkge1xuXHRcdFx0Ly8gUmVnaXN0ZXIgdGhlIHRlbXBsYXRlXG5cdFx0XHRhd2FpdCBjbGkucnVuQ29tbWFuZChbXG5cdFx0XHRcdFwidGVtcGxhdGVcIixcblx0XHRcdFx0XCJhZGRcIixcblx0XHRcdFx0XCItLW5hbWU9ZmlsZS10ZXN0XCIsXG5cdFx0XHRcdGAtLXNvdXJjZT0ke3RlbXBsYXRlUGF0aH1gLFxuXHRcdFx0XHRgLS1jb25maWc9JHtjb25maWdQYXRofWAsXG5cdFx0XHRdKTtcblxuXHRcdFx0Ly8gVGVzdCBvdmVyd3JpdGUgcHJvdGVjdGlvblxuXHRcdFx0b3V0cHV0UGF0aCA9IGF3YWl0IGNyZWF0ZVRlbXBGaWxlKFwiRXhpc3RpbmcgY29udGVudFwiKTtcblxuXHRcdFx0Ly8gU2hvdWxkIGZhaWwgd2l0aG91dCAtLWZvcmNlXG5cdFx0XHRhd2FpdCBhc3NlcnRSZWplY3RzKFxuXHRcdFx0XHRhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0YXdhaXQgY2xpLnJ1bkNvbW1hbmQoW1xuXHRcdFx0XHRcdFx0XCJ0ZW1wbGF0ZVwiLFxuXHRcdFx0XHRcdFx0XCJnZW5lcmF0ZVwiLFxuXHRcdFx0XHRcdFx0XCItLXRlbXBsYXRlPWZpbGUtdGVzdFwiLFxuXHRcdFx0XHRcdFx0YC0tb3V0cHV0PSR7b3V0cHV0UGF0aH1gLFxuXHRcdFx0XHRcdFx0Ly8gTm8gLS1mb3JjZSBmbGFnXG5cdFx0XHRcdFx0XSk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdEVycm9yLFxuXHRcdFx0XHRcIk91dHB1dCBmaWxlXCIsXG5cdFx0XHQpO1xuXG5cdFx0XHQvLyBTaG91bGQgc3VjY2VlZCB3aXRoIC0tZm9yY2Vcblx0XHRcdGF3YWl0IGNsaS5ydW5Db21tYW5kKFtcblx0XHRcdFx0XCJ0ZW1wbGF0ZVwiLFxuXHRcdFx0XHRcImdlbmVyYXRlXCIsXG5cdFx0XHRcdFwiLS10ZW1wbGF0ZT1maWxlLXRlc3RcIixcblx0XHRcdFx0YC0tb3V0cHV0PSR7b3V0cHV0UGF0aH1gLFxuXHRcdFx0XHRcIi0tZm9yY2VcIiwgLy8gQ29ycmVjdGx5IHBhc3NpbmcgLS1mb3JjZSB3aXRob3V0IHZhbHVlXG5cdFx0XHRdKTtcblxuXHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUob3V0cHV0UGF0aCk7XG5cdFx0XHRhc3NlcnRFcXVhbHMocmVzdWx0LCBcIlRlc3QgY29udGVudFwiKTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0Ly8gQ2xlYW4gdXAgYWxsIHRlbXBvcmFyeSBmaWxlc1xuXHRcdFx0YXdhaXQgY2xlYW51cFRlbXBGaWxlcyh0ZW1wbGF0ZVBhdGgsIGNvbmZpZ1BhdGgsIG91dHB1dFBhdGgpO1xuXHRcdH1cblx0fSxcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBDQUEwQztBQUMxQyxTQUNDLFlBQVksRUFDWixhQUFhLFFBQ1AsbURBQW1EO0FBQzFELFNBQVMscUJBQXFCLFFBQVEseUNBQXlDO0FBQy9FLFNBQ0MsZ0JBQWdCLEVBQ2hCLGNBQWMsRUFDZCxhQUFhLFFBQ1AsbUJBQW1CO0FBRTFCLEtBQUssSUFBSSxDQUFDO0VBQ1QsTUFBTTtFQUNOLE1BQU07SUFDTCxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU07SUFDOUIsTUFBTSxVQUFVLHNCQUFzQjtJQUN0QyxJQUFJLFFBQVEsQ0FBQztJQUViLHdDQUF3QztJQUN4QyxNQUFNLGVBQWUsTUFBTSxlQUFlO0lBQzFDLE1BQU0sYUFBYSxNQUFNLGVBQ3hCLEtBQUssU0FBUyxDQUFDO01BQ2QsYUFBYTtNQUNiLFdBQVc7UUFDVjtVQUNDLE1BQU07VUFDTixNQUFNO1VBQ04sVUFBVTtVQUNWLFlBQVk7UUFDYjtPQUNBO0lBQ0Y7SUFHRCxJQUFJLGNBQWM7SUFFbEIsSUFBSTtNQUNILHdCQUF3QjtNQUN4QixNQUFNLElBQUksVUFBVSxDQUFDO1FBQ3BCO1FBQ0E7UUFDQTtRQUNBLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FB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
// denoCacheMetadata=15176282966809436819,17260155151139188598