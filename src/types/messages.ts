/**
 * Message classes for the agent loop — custom types that replace the
 * LangChain.js dependency. Provides Human, AI, and System message classes
 * with string content, used across all layers of the application.
 *
 * Exports:
 * - `BaseMessage` — base class with `content` and `role` fields
 * - `HumanMessage` — user/human message (role: "user")
 * - `AIMessage` — assistant/AI message (role: "assistant")
 * - `SystemMessage` — system prompt message (role: "system")
 * - `MessageRole` — union type: "system" | "user" | "assistant"
 *
 * Re-exported from: `src/types/index.ts`
 */

export type MessageRole = "system" | "user" | "assistant";

/**
 * Base message interface.
 * All message types share this shape.
 */
export interface BaseMessageFields {
  content: string;
  role: MessageRole;
}

export class BaseMessage {
  content: string;
  role: MessageRole;

  constructor(fields: BaseMessageFields) {
    this.content = fields.content;
    this.role = fields.role;
  }
}

export class HumanMessage extends BaseMessage {
  constructor(content: string) {
    super({ content, role: "user" });
  }
}

export class AIMessage extends BaseMessage {
  constructor(content: string) {
    super({ content, role: "assistant" });
  }
}

export class SystemMessage extends BaseMessage {
  constructor(content: string) {
    super({ content, role: "system" });
  }
}