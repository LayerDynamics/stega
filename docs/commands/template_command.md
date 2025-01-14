# Template Command Documentation

## Overview

The Template Command provides a powerful system for generating content from templates with variable substitution, custom hooks, and validation. This system is ideal for scaffolding projects, generating code, or creating standardized documents.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Template Syntax](#template-syntax)
3. [Variables](#variables)
4. [Hooks](#hooks)
5. [Validation](#validation)
6. [Advanced Features](#advanced-features)
7. [Best Practices](#best-practices)

## Basic Usage

### Command Structure

```bash
stega template <subcommand> [options]
```

### Subcommands

1. **generate**
   - Generate content from a template
   ```bash
   stega template generate --template=name --output=path --variables=json
   ```

2. **list**
   - List available templates
   ```bash
   stega template list
   ```

3. **add**
   - Add a new template
   ```bash
   stega template add --name=name --source=path --config=path
   ```

## Template Syntax

### Basic Substitution

Templates use double curly braces for variable substitution:

```
Hello, {{name}}!

This is a {{type}} template.
```

### Conditional Sections

Use conditional blocks for optional content:

```
{{#if hasTests}}
## Testing

Run tests using:
\`\`\`bash
npm test
\`\`\`
{{/if}}
```

### Loops

Iterate over arrays of items:

```
{{#each dependencies}}
import {{this}} from '{{this}}';
{{/each}}
```

## Variables

### Variable Definition

Define variables in the template configuration:

```json
{
    "variables": [
        {
            "name": "componentName",
            "type": "string",
            "required": true,
            "description": "Name of the React component",
            "validation": "^[A-Z][a-zA-Z]*$"
        },
        {
            "name": "props",
            "type": "array",
            "description": "Component props",
            "default": []
        }
    ]
}
```

### Variable Types

- `string`: Text values
- `number`: Numeric values
- `boolean`: True/false values
- `array`: Lists of values
- `object`: Complex structured data

### Default Values

Specify defaults in the template configuration:

```json
{
    "variables": [
        {
            "name": "version",
            "type": "string",
            "default": "1.0.0"
        }
    ]
}
```

## Hooks

### Hook Types

1. **beforeRender**
   - Executes before template rendering
   - Can modify variables
   ```json
   {
       "hooks": {
           "beforeRender": "context.version = 'v' + context.version;"
       }
   }
   ```

2. **afterRender**
   - Executes after template rendering
   - Can modify generated content
   ```json
   {
       "hooks": {
           "afterRender": "return content.replace(/\\n{3,}/g, '\\n\\n');"
       }
   }
   ```

3. **validate**
   - Custom validation logic
   ```json
   {
       "hooks": {
           "validate": "return context.name.length <= 50;"
       }
   }
   ```

### Hook Context

Hooks receive a context object containing:

- All template variables
- Generated content (in afterRender)
- Configuration settings

## Validation

The template system provides multiple levels of validation to ensure generated content meets requirements.

### Variable Validation

Each variable can specify validation rules:

```json
{
    "variables": [
        {
            "name": "email",
            "type": "string",
            "validation": "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
            "description": "Valid email address"
        },
        {
            "name": "age",
            "type": "number",
            "validation": "value >= 0 && value <= 120",
            "description": "Age between 0 and 120"
        }
    ]
}
```

### Custom Validation

Implement complex validation using the validate hook:

```json
{
    "hooks": {
        "validate": `
            if (context.password !== context.confirmPassword) {
                throw new Error('Passwords do not match');
            }
            return true;
        `
    }
}
```

### Pattern Validation

Validate against predefined patterns:

```json
{
    "patterns": {
        "identifier": "^[a-zA-Z_][a-zA-Z0-9_]*$",
        "version": "^\\d+\\.\\d+\\.\\d+$",
        "path": "^[a-zA-Z0-9_/.-]+$"
    }
}
```

## Advanced Features

### Template Inheritance

Templates can extend base templates:

```json
{
    "extends": "base-component",
    "variables": {
        "additional": "value"
    }
}
```

### Custom Transformations

Apply transformations to variables:

```json
{
    "transformations": {
        "componentName": ["pascalCase", "validateComponent"],
        "description": ["trim", "capitalize"]
    }
}
```

### Dynamic Templates

Generate templates programmatically:

```typescript
const template = await cli.runCommand([
    "template",
    "generate",
    "--template=dynamic",
    "--variables",
    JSON.stringify({
        schema: await loadDatabaseSchema(),
        options: {
            generateTests: true,
            includeValidation: true
        }
    })
]);
```

### Template Composition

Combine multiple templates:

```json
{
    "compose": [
        {
            "template": "component",
            "output": "src/components/{{name}}.tsx"
        },
        {
            "template": "test",
            "output": "tests/components/{{name}}.test.tsx"
        },
        {
            "template": "story",
            "output": "stories/{{name}}.stories.tsx"
        }
    ]
}
```

## Best Practices

### Template Organization

Organize templates in a clear structure:

```
templates/
  ├── components/
  │   ├── class.tsx.template
  │   └── functional.tsx.template
  ├── tests/
  │   ├── unit.test.ts.template
  │   └── integration.test.ts.template
  └── config/
      ├── component.json
      └── test.json
```

### Variable Naming

Follow consistent naming conventions:

```json
{
    "variables": [
        {
            "name": "componentName",
            "description": "PascalCase name for the component"
        },
        {
            "name": "testDescription",
            "description": "Clear description of test purpose"
        }
    ]
}
```

### Error Handling

Implement robust error handling:

```typescript
try {
    await cli.runCommand([
        "template",
        "generate",
        "--template=component",
        "--output=src/Button.tsx",
        "--variables",
        JSON.stringify({
            name: "Button",
            props: ["label", "onClick"]
        })
    ]);
} catch (error) {
    if (error instanceof ValidationError) {
        console.error("Validation failed:", error.message);
        // Handle validation errors
    } else if (error instanceof TemplateError) {
        console.error("Template error:", error.message);
        // Handle template processing errors
    } else {
        throw error; // Rethrow unexpected errors
    }
}
```

### Performance Optimization

Optimize template processing:

```json
{
    "optimization": {
        "cacheTemplates": true,
        "precompileRegex": true,
        "lazyTransformations": true
    }
}
```

## Examples

### React Component Template

```typescript
// Template: component.tsx.template
import React from 'react';

{{#if typescript}}
interface {{name}}Props {
    {{#each props}}
    {{name}}: {{type}};
    {{/each}}
}
{{/if}}

export const {{name}} = ({{#if typescript}}props: {{name}}Props{{else}}props{{/if}}) => {
    return (
        <div>
            {{#each props}}
            <div>{props.{{name}}}</div>
            {{/each}}
        </div>
    );
};
```

### Test Template

```typescript
// Template: test.tsx.template
import { render, screen } from '@testing-library/react';
import { {{name}} } from './{{name}}';

describe('{{name}}', () => {
    {{#each testCases}}
    it('{{description}}', () => {
        {{#if setup}}
        {{{setup}}}
        {{/if}}

        render(<{{../name}} {...props} />);

        {{#each assertions}}
        {{this}}
        {{/each}}
    });
    {{/each}}
});
```

## Troubleshooting

### Common Issues

1. Variable Resolution
   ```bash
   # Check variable values
   stega template generate --template=debug --debug
   ```

2. Hook Execution
   ```bash
   # Enable hook debugging
   STEGA_HOOK_DEBUG=true stega template generate ...
   ```

3. Template Processing
   ```bash
   # Verbose template processing
   stega template generate --verbose ...
   ```

## API Reference

### Command Options

```typescript
interface TemplateCommandOptions {
    template: string;          // Template name
    output: string;           // Output path
    variables?: string;       // JSON string of variables
    force?: boolean;          // Overwrite existing files
    debug?: boolean;          // Enable debug output
    validate?: boolean;       // Run validation
    hooks?: boolean;          // Enable hooks
}
```

### Template Configuration

```typescript
interface TemplateConfig {
    variables: TemplateVariable[];
    hooks?: {
        beforeRender?: string;
        afterRender?: string;
        validate?: string;
    };
    patterns?: Record<string, string>;
    transformations?: Record<string, string[]>;
    extends?: string;
    compose?: TemplateComposition[];
    optimization?: TemplateOptimization;
}

