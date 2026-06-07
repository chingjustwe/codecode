/**
 * Base tool abstraction: implements the `Tool` interface and provides
 * derived `definition` and `fn` getters used by the agent loop and
 * ToolRegistry.
 *
 * Exports:
 * - `BaseTool` — abstract class; concrete tools (BashTool, ReadTool, etc.)
 *   extend this and provide `name`, `description`, `inputSchema`, and `execute`.
 */
import type { Tool, ToolDefinition, ToolParameterProperty } from "../../types/index.js";

export abstract class BaseTool implements Tool {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly inputSchema: {
    type: "object";
    properties: Record<string, ToolParameterProperty>;
    required?: string[];
  };

  abstract execute(args: Record<string, unknown>): string | Promise<string>;

  get definition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      input_schema: this.inputSchema,
    };
  }

  get fn(): (args: unknown) => string | Promise<string> {
    return (args: unknown) => this.execute(args as Record<string, unknown>);
  }
}
