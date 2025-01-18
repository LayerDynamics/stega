// src/command/suggestions.ts

export interface SuggestionOptions {
    maxSuggestions?: number;
    minSimilarity?: number;
    includeAliases?: boolean;
}

export class CommandSuggestionSystem {
    constructor(private options: SuggestionOptions = {}) {
        this.options = {
            maxSuggestions: 3,
            minSimilarity: 0.4,
            includeAliases: true,
            ...options
        };
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    private levenshteinDistance(str1: string, str2: string): number {
        const matrix: number[][] = [];

        // Initialize matrix
        for (let i = 0; i <= str1.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str2.length; j++) {
            matrix[0][j] = j;
        }

        // Fill matrix
        for (let i = 1; i <= str1.length; i++) {
            for (let j = 1; j <= str2.length; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }

        return matrix[str1.length][str2.length];
    }

    /**
     * Calculate similarity between two strings (0 to 1)
     */
    private calculateSimilarity(str1: string, str2: string): number {
        const maxLength = Math.max(str1.length, str2.length);
        if (maxLength === 0) return 1; // Both strings empty
        const distance = this.levenshteinDistance(str1, str2);
        return 1 - distance / maxLength;
    }

    /**
     * Find similar commands
     */
    public findSimilarCommands(
        input: string,
        availableCommands: string[]
    ): string[] {
        const similarities = availableCommands.map(cmd => ({
            command: cmd,
            similarity: this.calculateSimilarity(input.toLowerCase(), cmd.toLowerCase())
        }));

        // Sort by similarity and filter by minimum threshold
        return similarities
            .filter(s => s.similarity >= (this.options.minSimilarity || 0.4))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, this.options.maxSuggestions)
            .map(s => s.command);
    }

    /**
     * Generate suggestion message
     */
    public generateSuggestionMessage(input: string, availableCommands: string[]): string {
        const suggestions = this.findSimilarCommands(input, availableCommands);

        if (suggestions.length === 0) {
            return `Command "${input}" not found. No similar commands found.`;
        }

        return `Command "${input}" not found. Did you mean:\n${
            suggestions.map(cmd => `    ${cmd}`).join('\n')
        }`;
    }
}

// Factory function
export function createSuggestionSystem(options?: SuggestionOptions): CommandSuggestionSystem {
    return new CommandSuggestionSystem(options);
}
