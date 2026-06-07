/**
 * Abstract base class for all slash commands in the REPL.
 * Commands are invoked by typing `/` followed by the command name (e.g. `/help`).
 *
 * Exports:
 * - `Command` — abstract class; subclasses must implement `name`, `description`, and `execute()`
 *
 * Implementations: `src/agent/commands/help.ts`
 * Used by: `src/agent/commands/command-registry.ts`
 */
export abstract class Command {
  abstract readonly name: string;
  abstract readonly description: string;
  readonly aliases?: string[];
  readonly usage?: string;

  abstract execute(args: string[]): string | Promise<string>;
}
