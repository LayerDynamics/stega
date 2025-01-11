// src/error.ts

export class StegaError extends Error {
    constructor(message: string) {
        super(message);
        this.name="StegaError";
    }
}

export class MissingFlagError extends StegaError {
    constructor(flagName: string) {
        super(`Missing required flag: --${flagName}`);
        this.name="MissingFlagError";
    }
}

export class InvalidFlagValueError extends StegaError {
    constructor(flagName: string,expectedType: string) {
        super(`Invalid value for flag --${flagName}: expected a ${expectedType}.`);
        this.name="InvalidFlagValueError";
    }
}

export class CommandNotFoundError extends StegaError {
    constructor(commandName: string) {
        super(`Command "${commandName}" not found.`);
        this.name="CommandNotFoundError";
    }
}

export class SubcommandNotFoundError extends StegaError {
    constructor(subcommandName: string) {
        super(`Subcommand "${subcommandName}" not found.`);
        this.name="SubcommandNotFoundError";
    }
}
