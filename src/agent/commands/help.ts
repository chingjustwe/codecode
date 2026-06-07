/**
 * `/help` command — displays available slash commands and AI tools.
 * Supports `help [command]` for detailed info on a specific command.
 *
 * Exports:
 * - `HelpCommand` — class extending `Command`, registered in `src/agent/commands/index.ts`
 *
 * Dependencies:
 * - `commandRegistry` — to list all registered slash commands
 * - `toolRegistry` — to list all available AI tool definitions
 */
import { Command } from "./command.js";
import { commandRegistry } from "./command-registry.js";
import { toolRegistry } from "../tools/tool-registry.js";

export class HelpCommand extends Command {
  readonly name = "help";
  readonly description = "Show help information";
  readonly aliases = ["h"];
  readonly usage = "/help [command]";

  execute(args: string[]): string {
    if (args.length > 0) {
      return this.showCommandHelp(args[0]);
    }
    return this.showAllHelp();
  }

  private showCommandHelp(name: string): string {
    const cmd = commandRegistry.get(name);
    if (!cmd) {
      return `Unknown command: /${name}. Try /help to list all commands.`;
    }
    const lines: string[] = [];
    lines.push(`Command: /${cmd.name}`);
    lines.push(`  ${cmd.description}`);
    if (cmd.usage) lines.push(`  Usage: ${cmd.usage}`);
    if (cmd.aliases?.length) {
      lines.push(`  Aliases: ${cmd.aliases.map((a) => `/${a}`).join(", ")}`);
    }
    return lines.join("\n");
  }

  private showAllHelp(): string {
    const lines: string[] = [];
    lines.push("╔══════════════════════════════════════════╗");
    lines.push("║           CodeCode — Help               ║");
    lines.push("╚══════════════════════════════════════════╝");
    lines.push("");

    lines.push("Commands:");
    lines.push("");
    for (const cmd of commandRegistry.list()) {
      const aliasStr =
        cmd.aliases?.length
          ? ` (${cmd.aliases.map((a) => `/${a}`).join(", ")})`
          : "";
      lines.push(`  /${cmd.name.padEnd(12)} ${cmd.description}${aliasStr}`);
    }

    lines.push("");
    lines.push("Tools (available to the AI):");
    lines.push("");
    for (const name of toolRegistry.list()) {
      const tool = toolRegistry.get(name);
      if (tool) {
        lines.push(`  ${name.padEnd(20)} ${tool.definition.description}`);
      }
    }

    lines.push("");
    lines.push("Special:");
    lines.push("  exit               Exit the REPL");
    lines.push("");
    lines.push("Type /help <command> for details on a specific command.");

    return lines.join("\n");
  }
}
