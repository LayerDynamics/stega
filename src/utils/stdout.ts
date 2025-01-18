import { encode } from "./encode.ts";


/**
 * ANSI escape codes for terminal text formatting and colors.
 * @constant
 * @readonly
 * @type {Object}
 * @property {string} reset - Resets all text formatting
 * @property {string} bright - Makes text bold/bright
 * @property {string} dim - Reduces text intensity
 * @property {string} italic - Makes text italic
 * @property {string} underscore - Underlines text
 * @property {string} black - Sets text color to black
 * @property {string} red - Sets text color to red
 * @property {string} green - Sets text color to green
 * @property {string} yellow - Sets text color to yellow
 * @property {string} blue - Sets text color to blue
 * @property {string} magenta - Sets text color to magenta
 * @property {string} cyan - Sets text color to cyan
 * @property {string} white - Sets text color to white
 * @property {string} bgBlack - Sets background color to black
 * @property {string} bgRed - Sets background color to red
 * @property {string} bgGreen - Sets background color to green
 * @property {string} bgYellow - Sets background color to yellow
 * @property {string} bgBlue - Sets background color to blue
 * @property {string} bgMagenta - Sets background color to magenta
 * @property {string} bgCyan - Sets background color to cyan
 * @property {string} bgWhite - Sets background color to white
 */
const COLORS = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    italic: "\x1b[3m",
    underscore: "\x1b[4m",
    // Foreground colors
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    // Background colors
    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m"
} as const;

/**
 * Interface defining options for stdout formatting and styling
 * @interface
 * @property {boolean} [newline] - Whether to append a newline character at the end
 * @property {keyof typeof COLORS} [color] - Foreground color for the text
 * @property {keyof typeof COLORS} [background] - Background color for the text
 * @property {Array<keyof typeof COLORS>} [styles] - Array of style attributes to apply (bold, italic, etc.)
 * @property {number} [indent] - Number of spaces to indent the text
 * @property {boolean} [timestamp] - Whether to prepend a timestamp to the output
 */
export interface StdoutOptions {
    newline?: boolean;
    color?: keyof typeof COLORS;
    background?: keyof typeof COLORS;
    styles?: Array<keyof typeof COLORS>;
    indent?: number;
    timestamp?: boolean;
}

/**
 * A utility class for managing stdout operations with advanced formatting capabilities.
 * Provides methods for writing text to stdout with various styling options, cursor control,
 * and output buffering.
 *
 * @example
 * ```typescript
 * const stdout = new Stdout();
 *
 * // Write a simple line
 * await stdout.writeLine("Hello, world!");
 *
 * // Write with formatting
 * await stdout.writeSuccess("Operation completed!");
 * await stdout.writeError("Something went wrong!");
 *
 * // Use buffering
 * stdout.startBuffer();
 * // ... multiple write operations
 * await stdout.flushBuffer();
 * ```
 *
 * Features:
 * - Text formatting with colors and styles
 * - Indentation support
 * - Timestamp prefixing
 * - Success, error, warning, and info message formatting
 * - Debug output (controlled by DEBUG environment variable)
 * - Output buffering
 * - Screen clearing and cursor control
 * - TTY detection and conditional formatting
 *
 * @remarks
 * The class automatically detects whether the output is being written to a terminal
 * and applies ANSI color codes only when appropriate. All color and style formatting
 * is stripped when output is not directed to a TTY.
 */
class Stdout {
    private isEnabled = true;
    private indentSize = 2;
    private buffer: string[] = [];
    private isTTY: boolean;

    constructor() {
        this.isTTY = Deno.stdout.isTerminal();
    }

    /**
     * Write raw text to stdout
     */
    async write(text: string, options: StdoutOptions = {}): Promise<void> {
        if (!this.isEnabled) return;

        let output = text;

        // Apply indentation
        if (options.indent) {
            const indent = " ".repeat(options.indent * this.indentSize);
            output = output.split("\n").map(line => indent + line).join("\n");
        }

        // Apply timestamp
        if (options.timestamp) {
            const timestamp = new Date().toISOString();
            output = `[${timestamp}] ${output}`;
        }

        // Apply colors and styles if terminal supports it
        if (this.isTTY) {
            if (options.color) {
                output = COLORS[options.color] + output + COLORS.reset;
            }
            if (options.background) {
                output = COLORS[options.background] + output + COLORS.reset;
            }
            if (options.styles?.length) {
                output = options.styles.map(style => COLORS[style]).join("") + output + COLORS.reset;
            }
        }

        // Add newline if requested
        if (options.newline) {
            output += "\n";
        }

        await Deno.stdout.write(encode(output));
    }

    /**
     * Write a line of text
     */
    async writeLine(text: string, options: StdoutOptions = {}): Promise<void> {
        await this.write(text, { ...options, newline: true });
    }

    /**
     * Write success message
     */
    async writeSuccess(text: string, options: StdoutOptions = {}): Promise<void> {
        await this.write(`✓ ${text}`, {
            ...options,
            newline: true,
            color: "green",
            styles: ["bright"]
        });
    }

    /**
     * Write error message
     */
    async writeError(text: string, options: StdoutOptions = {}): Promise<void> {
        await this.write(`✗ ${text}`, {
            ...options,
            newline: true,
            color: "red",
            styles: ["bright"]
        });
    }

    /**
     * Write warning message
     */
    async writeWarning(text: string, options: StdoutOptions = {}): Promise<void> {
        await this.write(`⚠ ${text}`, {
            ...options,
            newline: true,
            color: "yellow",
            styles: ["bright"]
        });
    }

    /**
     * Write info message
     */
    async writeInfo(text: string, options: StdoutOptions = {}): Promise<void> {
        await this.write(`ℹ ${text}`, {
            ...options,
            newline: true,
            color: "blue",
            styles: ["bright"]
        });
    }

    /**
     * Write debug message
     */
    async writeDebug(text: string, options: StdoutOptions = {}): Promise<void> {
        if (Deno.env.get("DEBUG")) {
            await this.write(`🔍 ${text}`, {
                ...options,
                newline: true,
                color: "magenta",
                styles: ["dim"]
            });
        }
    }

    /**
     * Start buffering output
     */
    startBuffer(): void {
        this.buffer = [];
        this.isEnabled = false;
    }

    /**
     * Flush buffered output
     */
    async flushBuffer(): Promise<void> {
        this.isEnabled = true;
        for (const text of this.buffer) {
            await this.write(text);
        }
        this.buffer = [];
    }

    /**
     * Clear the screen
     */
    async clear(): Promise<void> {
        if (this.isTTY) {
            await this.write("\x1b[2J\x1b[H");
        }
    }


    /**
     * Move the cursor up by a specified number of lines.
     * @param lines - The number of lines to move the cursor up. Defaults to 1.
     */
    async moveUp(lines = 1): Promise<void> {
        if (this.isTTY) {
            await this.write(`\x1b[${lines}A`);
        }
    }


    /**
     * Move the cursor down by a specified number of lines.
     * @param lines - The number of lines to move the cursor down. Defaults to 1.
     */

    async moveDown(lines = 1): Promise<void> {
        if (this.isTTY) {
            await this.write(`\x1b[${lines}B`);
        }
    }

	/**
	 * Sets whether stdout is enabled or disabled
	 * @param enabled - Boolean flag indicating if stdout should be enabled (true) or disabled (false)
	 */
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
    }

    /**
     * Check if stdout is a TTY
     */
    isTTYOutput(): boolean {
        return this.isTTY;
    }
}

// Export singleton instance
export default new Stdout();
