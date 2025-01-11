
// src/types.d.ts
declare global {

    namespace Deno {
        interface RunOptions {
            cmd: string[];
            stdout?: "inherit" | "piped" | "null" | number;
            stderr?: "inherit" | "piped" | "null" | number;
        }

        interface Process {
            status(): Promise<{ success: boolean }>;
            close(): void;
            stdout?: ReadableStream;
            stderr?: ReadableStream;
        }
    }
}

export {};
