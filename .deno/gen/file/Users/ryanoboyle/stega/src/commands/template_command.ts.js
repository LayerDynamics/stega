// src/commands/template_command.ts
import { BaseCommand } from "../types.ts";
import { logger } from "../logger.ts";
export class TemplateCommand extends BaseCommand {
  templates = new Map();
  config = {};
  constructor(){
    super({
      name: "template",
      description: "Manage and generate from templates",
      category: "templates",
      permissions: [
        "read",
        "write"
      ],
      subcommands: [
        {
          name: "generate",
          description: "Generate content from a template",
          options: [
            {
              name: "template",
              type: "string",
              required: true,
              description: "Template name"
            },
            {
              name: "output",
              type: "string",
              description: "Output file path",
              required: true
            },
            {
              name: "variables",
              type: "string",
              description: "Variables in JSON format",
              required: false
            },
            {
              name: "force",
              type: "boolean",
              description: "Overwrite existing files",
              default: false
            }
          ],
          action: (args)=>this.generateFromTemplate(args)
        },
        {
          name: "list",
          description: "List available templates",
          action: ()=>this.listTemplates()
        },
        {
          name: "add",
          description: "Add a new template",
          options: [
            {
              name: "name",
              type: "string",
              required: true,
              description: "Template name"
            },
            {
              name: "source",
              type: "string",
              required: true,
              description: "Template source file path"
            },
            {
              name: "config",
              type: "string",
              required: false,
              description: "Template configuration file path"
            }
          ],
          action: (args)=>this.addTemplate(args)
        }
      ]
    });
  }
  async action(args) {
    const subcommand = args.command[1];
    switch(subcommand){
      case "generate":
        await this.generateFromTemplate(args);
        break;
      case "list":
        await this.listTemplates();
        break;
      case "add":
        await this.addTemplate(args);
        break;
      default:
        throw new Error(`Unknown subcommand: ${subcommand}`);
    }
  }
  loadTemplate(name) {
    const template = this.templates.get(name);
    if (!template) {
      logger.error(`Template '${name}' not found`);
      return undefined;
    }
    return template;
  }
  async validatePattern(pattern) {
    try {
      // Handle /pattern/flags format
      if (pattern.startsWith("/") && pattern.match(/\/[gimsuy]*$/)) {
        const matches = pattern.match(/^\/(.+)\/([gimsuy]*)$/);
        if (matches) {
          return new RegExp(matches[1], matches[2]);
        }
      }
      // Otherwise, treat as a normal pattern
      return new RegExp(pattern);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid regular expression pattern: ${errorMessage}`);
    }
  }
  async validateVariable(validation, value, variableName) {
    try {
      const regex = await this.validatePattern(validation);
      const isValid = regex.test(value);
      if (!isValid) {
        logger.error(`Validation failed for ${variableName}: Value does not match pattern`);
      }
      return isValid;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Validation error for ${variableName}: ${errorMessage}`);
      return false;
    }
  }
  async validateVariables(template, variables) {
    for (const templateVar of template.variables){
      const value = variables[templateVar.name];
      if (templateVar.required && value === undefined) {
        logger.error(`Missing required variable: ${templateVar.name}`);
        return false;
      }
      // If provided, validate the variable
      if (value !== undefined && templateVar.validation) {
        const isValid = await this.validateVariable(templateVar.validation, String(value), templateVar.name);
        if (!isValid) {
          return false;
        }
      }
    }
    return true;
  }
  createHookFunction(hookScript) {
    return new Function("context", `"use strict";
      try {
        ${hookScript}
        return context;
      } catch (error) {
        throw new Error('Hook execution failed: ' + error.message);
      }`);
  }
  async executeHook(hookScript, context) {
    if (!hookScript) {
      return context;
    }
    try {
      const hookFn = this.createHookFunction(hookScript);
      const result = await Promise.resolve(hookFn(context));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Hook execution failed: ${errorMessage}`);
    }
  }
  async renderTemplate(template, variables) {
    let content = template.source;
    // beforeRender hook
    if (template.hooks?.beforeRender) {
      await this.executeHook(template.hooks.beforeRender, variables);
    }
    // Replace all variables in the template
    for (const [key, value] of Object.entries(variables)){
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      content = content.replace(regex, value);
    }
    // afterRender hook
    if (template.hooks?.afterRender) {
      const result = await this.executeHook(template.hooks.afterRender, content);
      content = String(result);
    }
    return content;
  }
  async verifySourceFile(filePath) {
    try {
      const stat = await Deno.stat(filePath);
      if (!stat.isFile) {
        throw new Error("Source path is not a file");
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new Error(`No such file or directory: ${filePath}`);
      }
      throw error;
    }
  }
  async generateFromTemplate(args) {
    const templateName = args.flags.template;
    const outputPath = args.flags.output;
    // Correctly interpret 'force' as a boolean
    const force = typeof args.flags.force === "boolean" ? args.flags.force : false;
    // Debug log to verify the force flag and all flags
    logger.debug(`Force flag value: ${force} (${typeof force})`);
    logger.debug(`All flags: ${JSON.stringify(args.flags)}`);
    const template = this.loadTemplate(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }
    let variables = {};
    if (args.flags.variables) {
      try {
        variables = JSON.parse(args.flags.variables);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid variables JSON: ${errorMessage}`);
      }
    }
    // Merge with default variables
    if (this.config.defaultVariables) {
      variables = {
        ...this.config.defaultVariables,
        ...variables
      };
    }
    // Validate variables
    if (!await this.validateVariables(template, variables)) {
      throw new Error("Variable validation failed");
    }
    // Render the template
    const content = await this.renderTemplate(template, variables);
    // Optional validate hook
    if (template.hooks?.validate) {
      const isValid = await this.executeHook(template.hooks.validate, content);
      if (!isValid) {
        throw new Error("Template validation failed");
      }
    }
    // Write out the file
    try {
      const fileExists = await Deno.stat(outputPath).then(()=>true).catch(()=>false);
      if (!force && fileExists) {
        throw new Error(`Output file ${outputPath} already exists`);
      }
      await Deno.writeTextFile(outputPath, content);
      logger.info(`Generated content written to ${outputPath}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to write output: ${errorMessage}`);
    }
  }
  listTemplates() {
    if (this.templates.size === 0) {
      console.log("No templates available");
      return;
    }
    console.log("\nAvailable Templates:");
    console.log("===================");
    for (const [name, template] of this.templates){
      console.log(`\nName: ${name}`);
      if (template.description) {
        console.log(`Description: ${template.description}`);
      }
      if (template.variables.length > 0) {
        console.log("Variables:");
        template.variables.forEach((variable)=>{
          console.log(`  - ${variable.name}${variable.required ? " (required)" : ""}${variable.description ? `: ${variable.description}` : ""}`);
        });
      }
    }
  }
  async addTemplate(args) {
    const name = args.flags.name;
    const sourcePath = args.flags.source;
    const configPath = args.flags.config;
    if (this.templates.has(name)) {
      throw new Error(`Template '${name}' already exists`);
    }
    try {
      // Verify the main source file
      await this.verifySourceFile(sourcePath);
      const source = await Deno.readTextFile(sourcePath);
      // Optionally load config
      let config = {};
      if (configPath) {
        await this.verifySourceFile(configPath);
        const configContent = await Deno.readTextFile(configPath);
        config = JSON.parse(configContent);
        // Validate any regex patterns in variables
        if (config.variables) {
          for (const variable of config.variables){
            if (variable.validation) {
              await this.validatePattern(variable.validation);
            }
          }
        }
        // Validate hooks
        if (config.hooks) {
          for (const [hookName, hookScript] of Object.entries(config.hooks)){
            if (hookScript) {
              try {
                this.createHookFunction(hookScript);
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                throw new Error(`Invalid ${hookName} hook: ${errorMessage}`);
              }
            }
          }
        }
      }
      // Build the final template
      const template = {
        name,
        description: config.description,
        source,
        variables: config.variables || [],
        hooks: config.hooks
      };
      this.templates.set(name, template);
      logger.info(`Template '${name}' added successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to add template: ${errorMessage}`);
    }
  }
}
export function createTemplateCommand(_cli) {
  return new TemplateCommand();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvcnlhbm9ib3lsZS9zdGVnYS9zcmMvY29tbWFuZHMvdGVtcGxhdGVfY29tbWFuZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBzcmMvY29tbWFuZHMvdGVtcGxhdGVfY29tbWFuZC50c1xuaW1wb3J0IHsgQmFzZUNvbW1hbmQgfSBmcm9tIFwiLi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IEFyZ3MsIENvbW1hbmQgfSBmcm9tIFwiLi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gXCIuLi9sb2dnZXIudHNcIjtcbmltcG9ydCB7IENMSSB9IGZyb20gXCIuLi9jb3JlLnRzXCI7XG5cbmludGVyZmFjZSBUZW1wbGF0ZVZhcmlhYmxlIHtcblx0bmFtZTogc3RyaW5nO1xuXHRkZXNjcmlwdGlvbj86IHN0cmluZztcblx0ZGVmYXVsdD86IHN0cmluZztcblx0cmVxdWlyZWQ/OiBib29sZWFuO1xuXHR0eXBlPzogXCJzdHJpbmdcIiB8IFwibnVtYmVyXCIgfCBcImJvb2xlYW5cIjtcblx0dmFsaWRhdGlvbj86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFRlbXBsYXRlIHtcblx0bmFtZTogc3RyaW5nO1xuXHRkZXNjcmlwdGlvbj86IHN0cmluZztcblx0c291cmNlOiBzdHJpbmc7XG5cdHZhcmlhYmxlczogVGVtcGxhdGVWYXJpYWJsZVtdO1xuXHRob29rcz86IHtcblx0XHRiZWZvcmVSZW5kZXI/OiBzdHJpbmc7XG5cdFx0YWZ0ZXJSZW5kZXI/OiBzdHJpbmc7XG5cdFx0dmFsaWRhdGU/OiBzdHJpbmc7XG5cdH07XG59XG5cbmludGVyZmFjZSBUZW1wbGF0ZUNvbmZpZyB7XG5cdHRlbXBsYXRlczogVGVtcGxhdGVbXTtcblx0ZGVmYXVsdFZhcmlhYmxlcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG5cdG91dHB1dFBhdGg/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZUNvbW1hbmQgZXh0ZW5kcyBCYXNlQ29tbWFuZCB7XG5cdHByaXZhdGUgdGVtcGxhdGVzOiBNYXA8c3RyaW5nLCBUZW1wbGF0ZT4gPSBuZXcgTWFwKCk7XG5cdHByaXZhdGUgY29uZmlnOiBQYXJ0aWFsPFRlbXBsYXRlQ29uZmlnPiA9IHt9O1xuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKHtcblx0XHRcdG5hbWU6IFwidGVtcGxhdGVcIixcblx0XHRcdGRlc2NyaXB0aW9uOiBcIk1hbmFnZSBhbmQgZ2VuZXJhdGUgZnJvbSB0ZW1wbGF0ZXNcIixcblx0XHRcdGNhdGVnb3J5OiBcInRlbXBsYXRlc1wiLFxuXHRcdFx0cGVybWlzc2lvbnM6IFtcInJlYWRcIiwgXCJ3cml0ZVwiXSxcblx0XHRcdHN1YmNvbW1hbmRzOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRuYW1lOiBcImdlbmVyYXRlXCIsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IFwiR2VuZXJhdGUgY29udGVudCBmcm9tIGEgdGVtcGxhdGVcIixcblx0XHRcdFx0XHRvcHRpb25zOiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdG5hbWU6IFwidGVtcGxhdGVcIixcblx0XHRcdFx0XHRcdFx0dHlwZTogXCJzdHJpbmdcIixcblx0XHRcdFx0XHRcdFx0cmVxdWlyZWQ6IHRydWUsXG5cdFx0XHRcdFx0XHRcdGRlc2NyaXB0aW9uOiBcIlRlbXBsYXRlIG5hbWVcIixcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdG5hbWU6IFwib3V0cHV0XCIsXG5cdFx0XHRcdFx0XHRcdHR5cGU6IFwic3RyaW5nXCIsXG5cdFx0XHRcdFx0XHRcdGRlc2NyaXB0aW9uOiBcIk91dHB1dCBmaWxlIHBhdGhcIixcblx0XHRcdFx0XHRcdFx0cmVxdWlyZWQ6IHRydWUsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRuYW1lOiBcInZhcmlhYmxlc1wiLFxuXHRcdFx0XHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJWYXJpYWJsZXMgaW4gSlNPTiBmb3JtYXRcIixcblx0XHRcdFx0XHRcdFx0cmVxdWlyZWQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bmFtZTogXCJmb3JjZVwiLFxuXHRcdFx0XHRcdFx0XHR0eXBlOiBcImJvb2xlYW5cIixcblx0XHRcdFx0XHRcdFx0ZGVzY3JpcHRpb246IFwiT3ZlcndyaXRlIGV4aXN0aW5nIGZpbGVzXCIsXG5cdFx0XHRcdFx0XHRcdGRlZmF1bHQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdGFjdGlvbjogKGFyZ3M6IEFyZ3MpID0+IHRoaXMuZ2VuZXJhdGVGcm9tVGVtcGxhdGUoYXJncyksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRuYW1lOiBcImxpc3RcIixcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJMaXN0IGF2YWlsYWJsZSB0ZW1wbGF0ZXNcIixcblx0XHRcdFx0XHRhY3Rpb246ICgpID0+IHRoaXMubGlzdFRlbXBsYXRlcygpLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bmFtZTogXCJhZGRcIixcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogXCJBZGQgYSBuZXcgdGVtcGxhdGVcIixcblx0XHRcdFx0XHRvcHRpb25zOiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdG5hbWU6IFwibmFtZVwiLFxuXHRcdFx0XHRcdFx0XHR0eXBlOiBcInN0cmluZ1wiLFxuXHRcdFx0XHRcdFx0XHRyZXF1aXJlZDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0ZGVzY3JpcHRpb246IFwiVGVtcGxhdGUgbmFtZVwiLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bmFtZTogXCJzb3VyY2VcIixcblx0XHRcdFx0XHRcdFx0dHlwZTogXCJzdHJpbmdcIixcblx0XHRcdFx0XHRcdFx0cmVxdWlyZWQ6IHRydWUsXG5cdFx0XHRcdFx0XHRcdGRlc2NyaXB0aW9uOiBcIlRlbXBsYXRlIHNvdXJjZSBmaWxlIHBhdGhcIixcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdG5hbWU6IFwiY29uZmlnXCIsXG5cdFx0XHRcdFx0XHRcdHR5cGU6IFwic3RyaW5nXCIsXG5cdFx0XHRcdFx0XHRcdHJlcXVpcmVkOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0ZGVzY3JpcHRpb246IFwiVGVtcGxhdGUgY29uZmlndXJhdGlvbiBmaWxlIHBhdGhcIixcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRhY3Rpb246IChhcmdzOiBBcmdzKSA9PiB0aGlzLmFkZFRlbXBsYXRlKGFyZ3MpLFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHR9KTtcblx0fVxuXG5cdGFzeW5jIGFjdGlvbihhcmdzOiBBcmdzKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3Qgc3ViY29tbWFuZCA9IGFyZ3MuY29tbWFuZFsxXTtcblx0XHRzd2l0Y2ggKHN1YmNvbW1hbmQpIHtcblx0XHRcdGNhc2UgXCJnZW5lcmF0ZVwiOlxuXHRcdFx0XHRhd2FpdCB0aGlzLmdlbmVyYXRlRnJvbVRlbXBsYXRlKGFyZ3MpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgXCJsaXN0XCI6XG5cdFx0XHRcdGF3YWl0IHRoaXMubGlzdFRlbXBsYXRlcygpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgXCJhZGRcIjpcblx0XHRcdFx0YXdhaXQgdGhpcy5hZGRUZW1wbGF0ZShhcmdzKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gc3ViY29tbWFuZDogJHtzdWJjb21tYW5kfWApO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgbG9hZFRlbXBsYXRlKG5hbWU6IHN0cmluZyk6IFRlbXBsYXRlIHwgdW5kZWZpbmVkIHtcblx0XHRjb25zdCB0ZW1wbGF0ZSA9IHRoaXMudGVtcGxhdGVzLmdldChuYW1lKTtcblx0XHRpZiAoIXRlbXBsYXRlKSB7XG5cdFx0XHRsb2dnZXIuZXJyb3IoYFRlbXBsYXRlICcke25hbWV9JyBub3QgZm91bmRgKTtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdHJldHVybiB0ZW1wbGF0ZTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgdmFsaWRhdGVQYXR0ZXJuKHBhdHRlcm46IHN0cmluZyk6IFByb21pc2U8UmVnRXhwPiB7XG5cdFx0dHJ5IHtcblx0XHRcdC8vIEhhbmRsZSAvcGF0dGVybi9mbGFncyBmb3JtYXRcblx0XHRcdGlmIChwYXR0ZXJuLnN0YXJ0c1dpdGgoXCIvXCIpICYmIHBhdHRlcm4ubWF0Y2goL1xcL1tnaW1zdXldKiQvKSkge1xuXHRcdFx0XHRjb25zdCBtYXRjaGVzID0gcGF0dGVybi5tYXRjaCgvXlxcLyguKylcXC8oW2dpbXN1eV0qKSQvKTtcblx0XHRcdFx0aWYgKG1hdGNoZXMpIHtcblx0XHRcdFx0XHRyZXR1cm4gbmV3IFJlZ0V4cChtYXRjaGVzWzFdLCBtYXRjaGVzWzJdKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0Ly8gT3RoZXJ3aXNlLCB0cmVhdCBhcyBhIG5vcm1hbCBwYXR0ZXJuXG5cdFx0XHRyZXR1cm4gbmV3IFJlZ0V4cChwYXR0ZXJuKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvclxuXHRcdFx0XHQ/IGVycm9yLm1lc3NhZ2Vcblx0XHRcdFx0OiBTdHJpbmcoZXJyb3IpO1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHRgSW52YWxpZCByZWd1bGFyIGV4cHJlc3Npb24gcGF0dGVybjogJHtlcnJvck1lc3NhZ2V9YCxcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyB2YWxpZGF0ZVZhcmlhYmxlKFxuXHRcdHZhbGlkYXRpb246IHN0cmluZyxcblx0XHR2YWx1ZTogc3RyaW5nLFxuXHRcdHZhcmlhYmxlTmFtZTogc3RyaW5nLFxuXHQpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgcmVnZXggPSBhd2FpdCB0aGlzLnZhbGlkYXRlUGF0dGVybih2YWxpZGF0aW9uKTtcblx0XHRcdGNvbnN0IGlzVmFsaWQgPSByZWdleC50ZXN0KHZhbHVlKTtcblx0XHRcdGlmICghaXNWYWxpZCkge1xuXHRcdFx0XHRsb2dnZXIuZXJyb3IoXG5cdFx0XHRcdFx0YFZhbGlkYXRpb24gZmFpbGVkIGZvciAke3ZhcmlhYmxlTmFtZX06IFZhbHVlIGRvZXMgbm90IG1hdGNoIHBhdHRlcm5gLFxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGlzVmFsaWQ7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnN0IGVycm9yTWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3Jcblx0XHRcdFx0PyBlcnJvci5tZXNzYWdlXG5cdFx0XHRcdDogU3RyaW5nKGVycm9yKTtcblx0XHRcdGxvZ2dlci5lcnJvcihgVmFsaWRhdGlvbiBlcnJvciBmb3IgJHt2YXJpYWJsZU5hbWV9OiAke2Vycm9yTWVzc2FnZX1gKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHZhbGlkYXRlVmFyaWFibGVzKFxuXHRcdHRlbXBsYXRlOiBUZW1wbGF0ZSxcblx0XHR2YXJpYWJsZXM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuXHQpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRmb3IgKGNvbnN0IHRlbXBsYXRlVmFyIG9mIHRlbXBsYXRlLnZhcmlhYmxlcykge1xuXHRcdFx0Y29uc3QgdmFsdWUgPSB2YXJpYWJsZXNbdGVtcGxhdGVWYXIubmFtZV07XG5cblx0XHRcdGlmICh0ZW1wbGF0ZVZhci5yZXF1aXJlZCAmJiB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGxvZ2dlci5lcnJvcihgTWlzc2luZyByZXF1aXJlZCB2YXJpYWJsZTogJHt0ZW1wbGF0ZVZhci5uYW1lfWApO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdC8vIElmIHByb3ZpZGVkLCB2YWxpZGF0ZSB0aGUgdmFyaWFibGVcblx0XHRcdGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHRlbXBsYXRlVmFyLnZhbGlkYXRpb24pIHtcblx0XHRcdFx0Y29uc3QgaXNWYWxpZCA9IGF3YWl0IHRoaXMudmFsaWRhdGVWYXJpYWJsZShcblx0XHRcdFx0XHR0ZW1wbGF0ZVZhci52YWxpZGF0aW9uLFxuXHRcdFx0XHRcdFN0cmluZyh2YWx1ZSksXG5cdFx0XHRcdFx0dGVtcGxhdGVWYXIubmFtZSxcblx0XHRcdFx0KTtcblx0XHRcdFx0aWYgKCFpc1ZhbGlkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0cHJpdmF0ZSBjcmVhdGVIb29rRnVuY3Rpb24oXG5cdFx0aG9va1NjcmlwdDogc3RyaW5nLFxuXHQpOiAoY29udGV4dDogdW5rbm93bikgPT4gdW5rbm93biB7XG5cdFx0cmV0dXJuIG5ldyBGdW5jdGlvbihcblx0XHRcdFwiY29udGV4dFwiLFxuXHRcdFx0YFwidXNlIHN0cmljdFwiO1xuICAgICAgdHJ5IHtcbiAgICAgICAgJHtob29rU2NyaXB0fVxuICAgICAgICByZXR1cm4gY29udGV4dDtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSG9vayBleGVjdXRpb24gZmFpbGVkOiAnICsgZXJyb3IubWVzc2FnZSk7XG4gICAgICB9YCxcblx0XHQpIGFzIChjb250ZXh0OiB1bmtub3duKSA9PiB1bmtub3duO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBleGVjdXRlSG9vayhcblx0XHRob29rU2NyaXB0OiBzdHJpbmcgfCB1bmRlZmluZWQsXG5cdFx0Y29udGV4dDogdW5rbm93bixcblx0KTogUHJvbWlzZTx1bmtub3duPiB7XG5cdFx0aWYgKCFob29rU2NyaXB0KSB7XG5cdFx0XHRyZXR1cm4gY29udGV4dDtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgaG9va0ZuID0gdGhpcy5jcmVhdGVIb29rRnVuY3Rpb24oaG9va1NjcmlwdCk7XG5cdFx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCBQcm9taXNlLnJlc29sdmUoaG9va0ZuKGNvbnRleHQpKTtcblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnN0IGVycm9yTWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3Jcblx0XHRcdFx0PyBlcnJvci5tZXNzYWdlXG5cdFx0XHRcdDogU3RyaW5nKGVycm9yKTtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgSG9vayBleGVjdXRpb24gZmFpbGVkOiAke2Vycm9yTWVzc2FnZX1gKTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHJlbmRlclRlbXBsYXRlKFxuXHRcdHRlbXBsYXRlOiBUZW1wbGF0ZSxcblx0XHR2YXJpYWJsZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXG5cdCk6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0bGV0IGNvbnRlbnQgPSB0ZW1wbGF0ZS5zb3VyY2U7XG5cblx0XHQvLyBiZWZvcmVSZW5kZXIgaG9va1xuXHRcdGlmICh0ZW1wbGF0ZS5ob29rcz8uYmVmb3JlUmVuZGVyKSB7XG5cdFx0XHRhd2FpdCB0aGlzLmV4ZWN1dGVIb29rKHRlbXBsYXRlLmhvb2tzLmJlZm9yZVJlbmRlciwgdmFyaWFibGVzKTtcblx0XHR9XG5cblx0XHQvLyBSZXBsYWNlIGFsbCB2YXJpYWJsZXMgaW4gdGhlIHRlbXBsYXRlXG5cdFx0Zm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModmFyaWFibGVzKSkge1xuXHRcdFx0Y29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKGBcXFxce1xcXFx7XFxcXHMqJHtrZXl9XFxcXHMqXFxcXH1cXFxcfWAsIFwiZ1wiKTtcblx0XHRcdGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UocmVnZXgsIHZhbHVlKTtcblx0XHR9XG5cblx0XHQvLyBhZnRlclJlbmRlciBob29rXG5cdFx0aWYgKHRlbXBsYXRlLmhvb2tzPy5hZnRlclJlbmRlcikge1xuXHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5leGVjdXRlSG9vayhcblx0XHRcdFx0dGVtcGxhdGUuaG9va3MuYWZ0ZXJSZW5kZXIsXG5cdFx0XHRcdGNvbnRlbnQsXG5cdFx0XHQpO1xuXHRcdFx0Y29udGVudCA9IFN0cmluZyhyZXN1bHQpO1xuXHRcdH1cblxuXHRcdHJldHVybiBjb250ZW50O1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyB2ZXJpZnlTb3VyY2VGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3Qgc3RhdCA9IGF3YWl0IERlbm8uc3RhdChmaWxlUGF0aCk7XG5cdFx0XHRpZiAoIXN0YXQuaXNGaWxlKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIlNvdXJjZSBwYXRoIGlzIG5vdCBhIGZpbGVcIik7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGlmIChlcnJvciBpbnN0YW5jZW9mIERlbm8uZXJyb3JzLk5vdEZvdW5kKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgTm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeTogJHtmaWxlUGF0aH1gKTtcblx0XHRcdH1cblx0XHRcdHRocm93IGVycm9yO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVGcm9tVGVtcGxhdGUoYXJnczogQXJncyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHRlbXBsYXRlTmFtZSA9IGFyZ3MuZmxhZ3MudGVtcGxhdGUgYXMgc3RyaW5nO1xuXHRcdGNvbnN0IG91dHB1dFBhdGggPSBhcmdzLmZsYWdzLm91dHB1dCBhcyBzdHJpbmc7XG5cdFx0Ly8gQ29ycmVjdGx5IGludGVycHJldCAnZm9yY2UnIGFzIGEgYm9vbGVhblxuXHRcdGNvbnN0IGZvcmNlID0gdHlwZW9mIGFyZ3MuZmxhZ3MuZm9yY2UgPT09IFwiYm9vbGVhblwiXG5cdFx0XHQ/IGFyZ3MuZmxhZ3MuZm9yY2Vcblx0XHRcdDogZmFsc2U7XG5cblx0XHQvLyBEZWJ1ZyBsb2cgdG8gdmVyaWZ5IHRoZSBmb3JjZSBmbGFnIGFuZCBhbGwgZmxhZ3Ncblx0XHRsb2dnZXIuZGVidWcoYEZvcmNlIGZsYWcgdmFsdWU6ICR7Zm9yY2V9ICgke3R5cGVvZiBmb3JjZX0pYCk7XG5cdFx0bG9nZ2VyLmRlYnVnKGBBbGwgZmxhZ3M6ICR7SlNPTi5zdHJpbmdpZnkoYXJncy5mbGFncyl9YCk7XG5cblx0XHRjb25zdCB0ZW1wbGF0ZSA9IHRoaXMubG9hZFRlbXBsYXRlKHRlbXBsYXRlTmFtZSk7XG5cdFx0aWYgKCF0ZW1wbGF0ZSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBUZW1wbGF0ZSAnJHt0ZW1wbGF0ZU5hbWV9JyBub3QgZm91bmRgKTtcblx0XHR9XG5cblx0XHRsZXQgdmFyaWFibGVzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuXHRcdGlmIChhcmdzLmZsYWdzLnZhcmlhYmxlcykge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0dmFyaWFibGVzID0gSlNPTi5wYXJzZShhcmdzLmZsYWdzLnZhcmlhYmxlcyBhcyBzdHJpbmcpO1xuXHRcdFx0fSBjYXRjaCAoZXJyb3I6IHVua25vd24pIHtcblx0XHRcdFx0Y29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvclxuXHRcdFx0XHRcdD8gZXJyb3IubWVzc2FnZVxuXHRcdFx0XHRcdDogU3RyaW5nKGVycm9yKTtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHZhcmlhYmxlcyBKU09OOiAke2Vycm9yTWVzc2FnZX1gKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBNZXJnZSB3aXRoIGRlZmF1bHQgdmFyaWFibGVzXG5cdFx0aWYgKHRoaXMuY29uZmlnLmRlZmF1bHRWYXJpYWJsZXMpIHtcblx0XHRcdHZhcmlhYmxlcyA9IHsgLi4udGhpcy5jb25maWcuZGVmYXVsdFZhcmlhYmxlcywgLi4udmFyaWFibGVzIH07XG5cdFx0fVxuXG5cdFx0Ly8gVmFsaWRhdGUgdmFyaWFibGVzXG5cdFx0aWYgKCEoYXdhaXQgdGhpcy52YWxpZGF0ZVZhcmlhYmxlcyh0ZW1wbGF0ZSwgdmFyaWFibGVzKSkpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlZhcmlhYmxlIHZhbGlkYXRpb24gZmFpbGVkXCIpO1xuXHRcdH1cblxuXHRcdC8vIFJlbmRlciB0aGUgdGVtcGxhdGVcblx0XHRjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy5yZW5kZXJUZW1wbGF0ZShcblx0XHRcdHRlbXBsYXRlLFxuXHRcdFx0dmFyaWFibGVzIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXG5cdFx0KTtcblxuXHRcdC8vIE9wdGlvbmFsIHZhbGlkYXRlIGhvb2tcblx0XHRpZiAodGVtcGxhdGUuaG9va3M/LnZhbGlkYXRlKSB7XG5cdFx0XHRjb25zdCBpc1ZhbGlkID0gYXdhaXQgdGhpcy5leGVjdXRlSG9vayh0ZW1wbGF0ZS5ob29rcy52YWxpZGF0ZSwgY29udGVudCk7XG5cdFx0XHRpZiAoIWlzVmFsaWQpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiVGVtcGxhdGUgdmFsaWRhdGlvbiBmYWlsZWRcIik7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gV3JpdGUgb3V0IHRoZSBmaWxlXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IGZpbGVFeGlzdHMgPSBhd2FpdCBEZW5vLnN0YXQob3V0cHV0UGF0aClcblx0XHRcdFx0LnRoZW4oKCkgPT4gdHJ1ZSlcblx0XHRcdFx0LmNhdGNoKCgpID0+IGZhbHNlKTtcblxuXHRcdFx0aWYgKCFmb3JjZSAmJiBmaWxlRXhpc3RzKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgT3V0cHV0IGZpbGUgJHtvdXRwdXRQYXRofSBhbHJlYWR5IGV4aXN0c2ApO1xuXHRcdFx0fVxuXHRcdFx0YXdhaXQgRGVuby53cml0ZVRleHRGaWxlKG91dHB1dFBhdGgsIGNvbnRlbnQpO1xuXHRcdFx0bG9nZ2VyLmluZm8oYEdlbmVyYXRlZCBjb250ZW50IHdyaXR0ZW4gdG8gJHtvdXRwdXRQYXRofWApO1xuXHRcdH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XG5cdFx0XHRjb25zdCBlcnJvck1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yXG5cdFx0XHRcdD8gZXJyb3IubWVzc2FnZVxuXHRcdFx0XHQ6IFN0cmluZyhlcnJvcik7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byB3cml0ZSBvdXRwdXQ6ICR7ZXJyb3JNZXNzYWdlfWApO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgbGlzdFRlbXBsYXRlcygpOiB2b2lkIHtcblx0XHRpZiAodGhpcy50ZW1wbGF0ZXMuc2l6ZSA9PT0gMCkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJObyB0ZW1wbGF0ZXMgYXZhaWxhYmxlXCIpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnNvbGUubG9nKFwiXFxuQXZhaWxhYmxlIFRlbXBsYXRlczpcIik7XG5cdFx0Y29uc29sZS5sb2coXCI9PT09PT09PT09PT09PT09PT09XCIpO1xuXG5cdFx0Zm9yIChjb25zdCBbbmFtZSwgdGVtcGxhdGVdIG9mIHRoaXMudGVtcGxhdGVzKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhgXFxuTmFtZTogJHtuYW1lfWApO1xuXHRcdFx0aWYgKHRlbXBsYXRlLmRlc2NyaXB0aW9uKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBEZXNjcmlwdGlvbjogJHt0ZW1wbGF0ZS5kZXNjcmlwdGlvbn1gKTtcblx0XHRcdH1cblx0XHRcdGlmICh0ZW1wbGF0ZS52YXJpYWJsZXMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIlZhcmlhYmxlczpcIik7XG5cdFx0XHRcdHRlbXBsYXRlLnZhcmlhYmxlcy5mb3JFYWNoKCh2YXJpYWJsZSkgPT4ge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFxuXHRcdFx0XHRcdFx0YCAgLSAke3ZhcmlhYmxlLm5hbWV9JHt2YXJpYWJsZS5yZXF1aXJlZCA/IFwiIChyZXF1aXJlZClcIiA6IFwiXCJ9JHtcblx0XHRcdFx0XHRcdFx0dmFyaWFibGUuZGVzY3JpcHRpb24gPyBgOiAke3ZhcmlhYmxlLmRlc2NyaXB0aW9ufWAgOiBcIlwiXG5cdFx0XHRcdFx0XHR9YCxcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGFkZFRlbXBsYXRlKGFyZ3M6IEFyZ3MpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBuYW1lID0gYXJncy5mbGFncy5uYW1lIGFzIHN0cmluZztcblx0XHRjb25zdCBzb3VyY2VQYXRoID0gYXJncy5mbGFncy5zb3VyY2UgYXMgc3RyaW5nO1xuXHRcdGNvbnN0IGNvbmZpZ1BhdGggPSBhcmdzLmZsYWdzLmNvbmZpZyBhcyBzdHJpbmc7XG5cblx0XHRpZiAodGhpcy50ZW1wbGF0ZXMuaGFzKG5hbWUpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYFRlbXBsYXRlICcke25hbWV9JyBhbHJlYWR5IGV4aXN0c2ApO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBWZXJpZnkgdGhlIG1haW4gc291cmNlIGZpbGVcblx0XHRcdGF3YWl0IHRoaXMudmVyaWZ5U291cmNlRmlsZShzb3VyY2VQYXRoKTtcblx0XHRcdGNvbnN0IHNvdXJjZSA9IGF3YWl0IERlbm8ucmVhZFRleHRGaWxlKHNvdXJjZVBhdGgpO1xuXG5cdFx0XHQvLyBPcHRpb25hbGx5IGxvYWQgY29uZmlnXG5cdFx0XHRsZXQgY29uZmlnOiBQYXJ0aWFsPFRlbXBsYXRlPiA9IHt9O1xuXHRcdFx0aWYgKGNvbmZpZ1BhdGgpIHtcblx0XHRcdFx0YXdhaXQgdGhpcy52ZXJpZnlTb3VyY2VGaWxlKGNvbmZpZ1BhdGgpO1xuXHRcdFx0XHRjb25zdCBjb25maWdDb250ZW50ID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUoY29uZmlnUGF0aCk7XG5cdFx0XHRcdGNvbmZpZyA9IEpTT04ucGFyc2UoY29uZmlnQ29udGVudCk7XG5cblx0XHRcdFx0Ly8gVmFsaWRhdGUgYW55IHJlZ2V4IHBhdHRlcm5zIGluIHZhcmlhYmxlc1xuXHRcdFx0XHRpZiAoY29uZmlnLnZhcmlhYmxlcykge1xuXHRcdFx0XHRcdGZvciAoY29uc3QgdmFyaWFibGUgb2YgY29uZmlnLnZhcmlhYmxlcykge1xuXHRcdFx0XHRcdFx0aWYgKHZhcmlhYmxlLnZhbGlkYXRpb24pIHtcblx0XHRcdFx0XHRcdFx0YXdhaXQgdGhpcy52YWxpZGF0ZVBhdHRlcm4odmFyaWFibGUudmFsaWRhdGlvbik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gVmFsaWRhdGUgaG9va3Ncblx0XHRcdFx0aWYgKGNvbmZpZy5ob29rcykge1xuXHRcdFx0XHRcdGZvciAoXG5cdFx0XHRcdFx0XHRjb25zdCBbaG9va05hbWUsIGhvb2tTY3JpcHRdIG9mIE9iamVjdC5lbnRyaWVzKFxuXHRcdFx0XHRcdFx0XHRjb25maWcuaG9va3MsXG5cdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHRpZiAoaG9va1NjcmlwdCkge1xuXHRcdFx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuY3JlYXRlSG9va0Z1bmN0aW9uKGhvb2tTY3JpcHQpO1xuXHRcdFx0XHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IGVycm9yTWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3Jcblx0XHRcdFx0XHRcdFx0XHRcdD8gZXJyb3IubWVzc2FnZVxuXHRcdFx0XHRcdFx0XHRcdFx0OiBTdHJpbmcoZXJyb3IpO1xuXHRcdFx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdFx0XHRcdFx0XHRcdGBJbnZhbGlkICR7aG9va05hbWV9IGhvb2s6ICR7ZXJyb3JNZXNzYWdlfWAsXG5cdFx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBCdWlsZCB0aGUgZmluYWwgdGVtcGxhdGVcblx0XHRcdGNvbnN0IHRlbXBsYXRlOiBUZW1wbGF0ZSA9IHtcblx0XHRcdFx0bmFtZSxcblx0XHRcdFx0ZGVzY3JpcHRpb246IGNvbmZpZy5kZXNjcmlwdGlvbixcblx0XHRcdFx0c291cmNlLFxuXHRcdFx0XHR2YXJpYWJsZXM6IGNvbmZpZy52YXJpYWJsZXMgfHwgW10sXG5cdFx0XHRcdGhvb2tzOiBjb25maWcuaG9va3MsXG5cdFx0XHR9O1xuXG5cdFx0XHR0aGlzLnRlbXBsYXRlcy5zZXQobmFtZSwgdGVtcGxhdGUpO1xuXHRcdFx0bG9nZ2VyLmluZm8oYFRlbXBsYXRlICcke25hbWV9JyBhZGRlZCBzdWNjZXNzZnVsbHlgKTtcblx0XHR9IGNhdGNoIChlcnJvcjogdW5rbm93bikge1xuXHRcdFx0Y29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvclxuXHRcdFx0XHQ/IGVycm9yLm1lc3NhZ2Vcblx0XHRcdFx0OiBTdHJpbmcoZXJyb3IpO1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gYWRkIHRlbXBsYXRlOiAke2Vycm9yTWVzc2FnZX1gKTtcblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRlbXBsYXRlQ29tbWFuZChfY2xpOiBDTEkpOiBDb21tYW5kIHtcblx0cmV0dXJuIG5l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
// denoCacheMetadata=14924120172354888375,178199332357908880