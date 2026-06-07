/**
 * Command registry — stores all slash commands and their aliases, providing
 * lookup by name or alias. A singleton `commandRegistry` instance is exported
 * for use across the application.
 *
 * Exports:
 * - `CommandRegistry` — class; register(), get(), has(), list() methods
 * - `commandRegistry` — singleton CommandRegistry instance
 *
 * Dependencies: `./command.ts` — the Command abstract class
 * Used by: `src/agent/commands/index.ts` (registration),
 *          `src/cli/repl.ts` (dispatch)
 */
import { Command } from "./command.js";

export class CommandRegistry {
  private _commands = new Map<string, Command>();
  private _aliases = new Map<string, string>();

  register(command: Command): void {
    this._commands.set(command.name, command);
    if (command.aliases) {
      for (const alias of command.aliases) {
        this._aliases.set(alias, command.name);
      }
    }
  }

  get(name: string): Command | undefined {
    return this._commands.get(name) ?? this._commands.get(this._aliases.get(name) ?? "");
  }

  has(name: string): boolean {
    return this._commands.has(name) || this._aliases.has(name);
  }

  list(): Command[] {
    return [...this._commands.values()];
  }
}

export const commandRegistry = new CommandRegistry();
