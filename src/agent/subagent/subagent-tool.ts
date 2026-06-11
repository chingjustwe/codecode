/**
 * `dispatch_task` tool — available only to the parent agent. Spawns a subagent
 * with a fresh context, restricted read-only toolset, and returns only the
 * subagent's final summary. The subagent's conversation history is discarded.
 *
 * Exports:
 * - `DispatchTaskTool` — extends BaseTool; registered in the tool registry
 *
 * Dependencies:
 * - `subagent.ts` — `runSubagent()` reads `currentModel` and `toolRegistry`
 *   singletons directly, so no manual init() wiring is needed.
 */
import { BaseTool } from "../tools/tool.js";
import { runSubagent } from "./subagent.js";

export class DispatchTaskTool extends BaseTool {
  readonly name = "dispatch_task";
  readonly description =
    "Spawn a subagent with a fresh context. It shares your filesystem but not your conversation history. Use this for complex sub-tasks that would benefit from a clean context — the subagent reads files, searches, runs read-only tools, then returns a summary.";
  readonly inputSchema = {
    type: "object" as const,
    properties: {
      prompt: {
        type: "string",
        description: "The task for the subagent to complete",
      },
      description: {
        type: "string",
        description: "Short label (for logging) describing what the subagent is doing",
      },
    },
    required: ["prompt"],
  };

  async execute(args: Record<string, unknown>): Promise<string> {
    const prompt = args.prompt as string;
    const desc = (args.description as string) || prompt.slice(0, 60);

    console.log(`  🧵 Subagent spawned: ${desc}`);

    try {
      const summary = await runSubagent(prompt);
      console.log(`  🧵 Subagent finished: ${desc}`);
      return summary;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  🧵 Subagent error: ${desc}`);
      return `[Subagent error: ${msg}]`;
    }
  }
}
