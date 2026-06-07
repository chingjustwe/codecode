/**
 * Central registry for tools. Tools are registered by name and can be
 * retrieved individually or as a list of ToolDefinitions for LLM API calls.
 *
 * Exports:
 * - `ToolRegistry` — class with register/get/list/definitions methods
 * - `toolRegistry` — singleton default instance (used by the agent loop)
 */
import type { Tool, ToolDefinition } from "../../types/index.js";
import { BaseTool } from "./tool.js";

export class ToolRegistry {
  private _tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this._tools.set(tool.definition.name, tool);
  }

  registerFrom(baseTool: BaseTool): void {
    this.register(baseTool);
  }

  unregister(name: string): boolean {
    return this._tools.delete(name);
  }

  get(name: string): Tool | undefined {
    return this._tools.get(name);
  }

  has(name: string): boolean {
    return this._tools.has(name);
  }

  list(): string[] {
    return [...this._tools.keys()];
  }

  definitions(): ToolDefinition[] {
    return [...this._tools.values()].map((t) => t.definition);
  }

  toRecord(): Record<string, Tool> {
    return Object.fromEntries(this._tools);
  }
}

export const toolRegistry = new ToolRegistry();
