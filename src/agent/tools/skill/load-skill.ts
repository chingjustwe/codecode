/**
 * `load_skill` tool — loads the full body of a named skill into the current
 * agent context. Used by the agent loop when the model requests a skill's
 * contents (by name) to include in its reasoning.
 *
 * Exports:
 * - `LoadSkillTool` — tool class extending `BaseTool`, registered in `src/agent/tools/index.ts`
 *
 * Dependencies: `./skill-registry.ts` — the `defaultRegistry` singleton
 * Used by: agent loop via tool registry dispatch
 */
import { BaseTool } from "../tool.js";
import { defaultRegistry } from "./skill-registry.js";

export class LoadSkillTool extends BaseTool {
  readonly name = "load_skill";
  readonly description =
    "Load the full body of a named skill into the current context.";
  readonly inputSchema = {
    type: "object" as const,
    properties: {
      name: { type: "string" },
    },
    required: ["name"],
  };

  execute(args: Record<string, unknown>): string {
    console.log(`  🛠️  Tool called: load_skill(${JSON.stringify(args)})`);
    return defaultRegistry.loadFullText(args.name as string);
  }
}
