# Tutorial: Building a Custom CLI with Stega

In this tutorial, we'll walk through creating a simple CLI application using the Stega CLI Framework.

## Step 1: Initialize Your Project

Create a new directory for your CLI application and navigate into it:

```bash
mkdir my-cli-app
cd my-cli-app
```

## Step 2: Install Stega

Install Stega using Deno's install command:

```bash
deno install --allow-all --unstable https://deno.land/x/stega@v1.0.0/mod.ts -n stega
```

This command installs Stega globally, allowing you to use the `stega` command from anywhere.

## Step 3: Create a New Command

Create a `hello.ts` file to define a new command:

```typescript
// hello.ts
import { CLI, Command } from "https://deno.land/x/stega@v1.0.0/mod.ts";

const cli = new CLI();

// Define the 'hello' command
const helloCommand: Command = {
  name: "hello",
  description: "Say hello",
  options: [
    { name: "name", alias: "n", type: "string", required: true },
    { name: "excited", alias: "e", type: "boolean", default: false },
  ],
  action: (args) => {
    const name = args.flags.name;
    const excited = args.flags.excited;
    const greeting = excited ? `Hello, ${name}!!!` : `Hello, ${name}!`;
    console.log(greeting);
  },
};

// Register the 'hello' command
cli.register(helloCommand);

// Run the CLI
await cli.run();
```

**Explanation:**

- **helloCommand:**
  - **Options:**
    - `--name` (`-n`): Required string flag for the user's name.
    - `--excited` (`-e`): Optional boolean flag to add excitement to the greeting.
  - **Action:**
    - Logs a greeting message based on the `excited` flag.

## Step 4: Run Your CLI

Execute the `hello` command with the required flag:

```bash
deno run --allow-all hello.ts hello --name=World
```

**Output:**

```
Hello, World!
```

Enable the `excited` flag:

```bash
deno run --allow-all hello.ts hello --name=World --excited
```

**Output:**

```
Hello, World!!!
```

## Step 5: Add Help

Use the `--help` flag to see available commands and options:

```bash
deno run --allow-all hello.ts --help
```

**Output:**

```
Available Commands:
  hello	Say hello

Use "stega help [command]" for more information on a specific command.
```

Get help for the `hello` command:

```bash
deno run --allow-all hello.ts help hello
```

**Output:**

```
Command: hello

Say hello

Options:
  --name, -n	Name of the user (required)
  --excited, -e	Enable excited output (default: false)

Usage:
  stega hello [options]
```

## Step 6: Configure Default Values

Create a `config.json` file to set default values for flags:

```json
{
  "excited": true
}
```

Now, running the command without the `--excited` flag will use the default value from the configuration:

```bash
deno run --allow-all hello.ts greet --name=Alice
```

**Output:**

```
Hello, Alice!!!
```

## Step 7: Conclusion

You've successfully created a simple CLI application using the Stega CLI Framework! Explore adding more commands, subcommands, and options to enhance your CLI's functionality.

Happy Coding! 🚀
```

---

## **5. Packaging and Distribution**

To make Stega accessible to others, we'll package and distribute it via `deno.land/x`.

### **a. Publishing to `deno.land/x`**

**Steps:**

1. **Ensure Repository is Properly Tagged:**

   - Commit all changes and push them to GitHub.
   - Create a new release with a semantic version tag (e.g., `v1.0.0`).

   ```bash
   git add .
   git commit -m "Release v1.0.0"
   git tag v1.0.0
   git push origin main --tags
   ```

2. **Accessing the Module:**

   After tagging, Stega will be available at:

   ```
   https://deno.land/x/stega@v1.0.0/mod.ts
   ```

3. **Installation Instructions:**

   Update the `README.md` to guide users on how to install Stega:

   ```markdown
   ## Installation

   Install Stega using Deno's install command:

   ```bash
   deno install --allow-all --unstable https://deno.land/x/stega@v1.0.0/mod.ts -n stega
   ```
   ```

**Note:**
Ensure that your GitHub repository is public and follows Deno's naming conventions for modules.

---

## **6. Maintenance and Community Building**

Building a community around Stega encourages contributions, feedback, and continuous improvement.

### **a. Issue Tracking**

Utilize GitHub Issues to manage bugs, feature requests, and discussions. Encourage users to report issues and suggest enhancements.

### **b. Contribution Guidelines**

Create a `CONTRIBUTING.md` file to guide contributors on how to contribute to Stega.

**Code:**

```markdown
# Contributing to Stega

Thank you for considering contributing to Stega! Your contributions are welcome.

## How to Contribute

1. **Fork the Repository**
   - Click the "Fork" button on GitHub to create your own copy.

2. **Clone the Forked Repository**
   ```bash
   git clone https://github.com/yourusername/stega.git
   cd stega
   ```

3. **Create a New Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Your Changes**
   - Implement your feature or fix.
   - Write tests for your changes.

5. **Commit Your Changes**
   ```bash
   git commit -m "Add feature X"
   ```

6. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Go to the original repository and create a pull request from your fork.

## Code Standards

- Follow TypeScript best practices.
- Ensure code is well-documented.
- Write tests for new features.

## Reporting Issues

- Search existing issues to avoid duplicates.
- Provide clear and detailed information.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
```

### **c. Community Engagement**

- **Enable GitHub Discussions:**
  Allow users to ask questions, suggest features, and discuss improvements.

- **Set Up Communication Channels:**
  Consider setting up Discord or Slack channels for real-time communication and collaboration.

- **Label Issues Appropriately:**
  Use labels like "good first issue" to attract new contributors.

- **Acknowledge Contributors:**
  Thank contributors in pull requests and issues to encourage ongoing participation.

### **d. Regular Updates**

- **Release New Versions:**
  Incorporate bug fixes, new features, and improvements based on feedback.

- **Respond to Feedback:**
  Actively engage with user feedback to enhance Stega's functionality and usability.

---

## **7. Additional Considerations**

### **a. Performance Optimization**

- **Lazy Loading:**
  Load commands and subcommands only when needed to reduce startup time.

- **Asynchronous Operations:**
  Utilize asynchronous functions for non-blocking operations, especially for I/O tasks.

### **b. Cross-Platform Compatibility**

- **Testing Across OSes:**
  Test Stega on Windows, macOS, and Linux to ensure consistent behavior.

- **Handle OS-Specific Nuances:**
  Address differences in path separators, permissions, and other OS-specific features.

### **c. Security**

- **Input Sanitization:**
  Validate and sanitize all user inputs to prevent potential security vulnerabilities.

- **Permission Management:**
  Use the least required permissions when running the CLI to minimize security risks.

### **d. Accessibility**

- **Clear Messaging:**
  Ensure help texts and error messages are clear and concise.

- **Readable Output:**
  Use formatting to enhance readability, such as aligning help text and using consistent spacing.

- **Support for Assistive Technologies:**
  Ensure that output is compatible with screen readers and other assistive technologies.

---

## **8. Conclusion**

Congratulations! You've successfully implemented **Stega**, a comprehensive CLI framework using Deno. Here's a recap of what we've accomplished:

1. **Core Modules Implementation:**
   Defined interfaces, created the Command Registry, implemented argument parsing, developed the CLI core, and established error handling and flag utilities.

2. **Command Registration System:**
   Enabled registration and management of commands and subcommands with an example in `sample-cli.ts`.

3. **Handling Flags and Options:**
   Managed various flag types, required flags, default values, and validation.

4. **Help Module:**
   Automated help and usage information generation based on registered commands and their options.

5. **Error Handling and Validation:**
   Ensured graceful error handling with meaningful feedback through custom error classes.

6. **Supporting Subcommands:**
   Enabled nested subcommands for granular command structures.

7. **Configuration Support:**
   Allowed configuration via files (`config.json`) and environment variables, prioritizing CLI arguments over configuration sources.

8. **Testing Stega:**
   Implemented unit tests for the parser and command registry, and integration tests for the CLI's overall functionality.

9. **Documentation:**
   Provided comprehensive user guides, API documentation, and tutorials to assist users and developers.

10. **Packaging and Distribution:**
    Prepared Stega for public distribution on `deno.land/x`, making it accessible to the Deno community.

11. **Maintenance and Community Building:**
    Established guidelines and practices to encourage contributions, manage issues, and engage with the community.

12. **Additional Considerations:**
    Addressed performance optimization, cross-platform compatibility, security, and accessibility to ensure Stega is robust and user-friendly.

### **Next Steps**

- **Expand Functionality:**
  Add more advanced features like command chaining, middleware support, or plugin systems to enhance Stega's capabilities.

- **Improve Documentation:**
  Continuously update and enhance documentation based on user feedback and new features.

- **Gather Feedback:**
  Encourage users to provide feedback and contribute to the framework's improvement through issues and pull requests.

- **Monitor and Update Dependencies:**
  Keep dependencies up-to-date to benefit from security patches and new features.

- **Enhance Testing:**
  Add more comprehensive tests, including edge cases and performance benchmarks, to ensure reliability.

- **Develop Advanced Features:**
  Implement features such as command history, scripting support, or interactive prompts to provide a richer user experience.

Feel free to reach out if you encounter challenges or need further assistance as you continue developing and refining Stega. Happy coding!

---

**Happy Coding with Stega! 🚀**
