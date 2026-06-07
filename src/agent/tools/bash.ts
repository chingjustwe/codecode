/**
 * Tool for executing shell commands within the current workspace.
 * Uses a 30-second timeout. Commands run via child_process.exec.
 *
 * Exports:
 * - `BashTool` — extends BaseTool; used by the agent loop to run CLI commands
 */
import { BaseTool } from "./tool.js";

export class BashTool extends BaseTool {
  readonly name = "bash";
  readonly description = "Run a shell command in the current workspace.";
  readonly inputSchema = {
    type: "object" as const,
    properties: {
      command: { type: "string" },
    },
    required: ["command"],
  };

  async execute(args: Record<string, unknown>): Promise<string> {
    const command = args.command as string;
    console.log(`  🛠️  Tool called: bash(${JSON.stringify({ command })})`);
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30_000,
      });
      if (stderr) return `stderr:\n${stderr}\n\nstdout:\n${stdout}`;
      return stdout || "(no output)";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return `Error: ${message}`;
    }
  }
}
