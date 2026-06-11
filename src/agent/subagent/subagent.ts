/**
 * Subagent execution engine — spawns an LLM instance with a fresh context
 * and a restricted, read-only toolset. Returns only a final text summary
 * to the parent agent; the subagent's conversation history is discarded.
 *
 * Exports:
 * - `SUBAGENT_SYSTEM` — system prompt template for subagent instances
 * - `runSubagent(prompt)` — runs a subagent, returns summary
 *
 * Dependencies:
 * - `currentModel` from `src/llm/factory.ts` — global ChatModel singleton
 * - `toolRegistry` from `src/agent/tools/tool-registry.ts` — global tool registry
 *
 * Used by: `DispatchTaskTool` (src/agent/subagent/subagent-tool.ts)
 */
import { HumanMessage, BaseMessage } from "../../types/messages.js";
import type { Tool } from "../../types/index.js";
import { currentModel } from "../../llm/factory.js";
import { toolRegistry } from "../tools/tool-registry.js";

const WORKDIR = process.cwd();
const MAX_SUBAGENT_TURNS = 30;

export const SUBAGENT_SYSTEM = `You are a coding subagent at ${WORKDIR}. Complete the given task, then summarize your findings. You have access to read-only tools. Do NOT ask for additional tools — use what you have. When done, provide a concise summary of what you found or accomplished.`;

/**
 * Patterns that indicate a bash command may write to the filesystem or
 * otherwise mutate state. Used to enforce read-only mode for subagents.
 */
const WRITE_PATTERNS = [
  />/,
  /</,
  /\|/,
  /\brm\b/,
  /\bmv\b/,
  /\bcp\b/,
  /\bmkdir\b/,
  /\btouch\b/,
  /\bchmod\b/,
  /\bchown\b/,
  /\bln\b/,
  /\bdd\b/,
  /\bmkfs/,
  /\bshutdown\b/,
  /\breboot\b/,
  /\bwget\b/,
  /\bcurl\b/,
  /\bsudo\b/,
  /\bapt\b/,
  /\byum\b/,
  /\bbrew\b/,
  /\bpip install\b/,
  /\bnpm install\b/,
  /\bnpx\b/,
  /\bkill\b/,
];

function isReadonlyCommand(command: string): boolean {
  return !WRITE_PATTERNS.some((pattern) => pattern.test(command));
}

/** Tool names available to subagents (excludes mutation and dispatch_task). */
const SUBAGENT_TOOL_NAMES = ["read", "bash", "calculate"];

/**
 * Build a restricted tool record for subagent execution.
 * - `read` and `calculate` are passed through as-is
 * - `bash` is wrapped to reject write commands
 */
function buildSubagentToolRecord(): Record<string, Tool> {
  const tools: Record<string, Tool> = {};

  for (const name of SUBAGENT_TOOL_NAMES) {
    const original = toolRegistry.get(name);
    if (!original) continue;

    if (name === "bash") {
      tools[name] = {
        definition: original.definition,
        fn: (args: unknown) => {
          const cmd = (args as { command?: string })?.command || "";
          if (!isReadonlyCommand(cmd)) {
            return `Error: This bash command is not allowed in subagent mode (read-only). Command was: ${cmd}`;
          }
          return original.fn(args);
        },
      };
    } else {
      tools[name] = original;
    }
  }

  return tools;
}

/**
 * Run a subagent with a fresh message context and restricted toolset.
 * The subagent shares the filesystem but not the parent's conversation history.
 *
 * Safety limits:
 * - Max 30 LLM-invoke turns
 * - Tool errors cause immediate termination with an error summary
 * - Bash is restricted to read-only commands
 *
 * @returns The subagent's final text summary
 */
export async function runSubagent(prompt: string): Promise<string> {
  if (!currentModel) {
    return "[Subagent error: ChatModel not initialized]";
  }

  const subTools = buildSubagentToolRecord();
  const toolDefs = Object.values(subTools).map((t) => t.definition);

  const messages: BaseMessage[] = [new HumanMessage(prompt)];

  let lastResponse = "";

  for (let turn = 0; turn < MAX_SUBAGENT_TURNS; turn++) {
    const result = await currentModel.invoke({
      system: SUBAGENT_SYSTEM,
      messages,
      tools: toolDefs,
      maxTokens: 8096,
    });

    messages.push(result.message);
    lastResponse = result.message.content;

    if (!result.toolCalls || result.toolCalls.length === 0) {
      return lastResponse || "(no summary)";
    }

    for (const toolCall of result.toolCalls) {
      const tool = subTools[toolCall.name];
      if (!tool) {
        messages.push(
          new HumanMessage(
            `Error: Tool "${toolCall.name}" is not available to subagents.`
          )
        );
        continue;
      }

      try {
        const observation = await Promise.resolve(tool.fn(toolCall.arguments));
        messages.push(
          new HumanMessage(
            `Tool "${toolCall.name}" returned:\n${String(observation).slice(0, 50000)}`
          )
        );
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        messages.push(
          new HumanMessage(`Tool "${toolCall.name}" error: ${errMsg}`)
        );
        return `[Subagent stopped due to tool error: ${errMsg}]`;
      }
    }
  }

  return `[Subagent reached max turns (${MAX_SUBAGENT_TURNS}) without completing]`;
}
