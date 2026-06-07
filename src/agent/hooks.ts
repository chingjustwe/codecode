/**
 * Hooks / listener system for the agent loop. Allows external modules
 * (e.g. TodoManager) to observe and inject into each round of the
 * agent's reasoning loop.
 *
 * Exports:
 * - `RoundContext` — context passed to listeners on each round
 * - `ToolCallInfo` — info about a single tool invocation (name + success)
 * - `LoopListener` — interface; implement to observe round start/end
 * - `registerLoopListener(l)` — register a listener singleton
 * - `getLoopListeners()` — retrieve all registered listeners
 */
export interface RoundContext {
  roundIndex: number;
  maxRounds: number;
  messageCount: number;
}

export interface ToolCallInfo {
  name: string;
  success: boolean;
}

export interface LoopListener {
  onRoundStart?(ctx: RoundContext): string | null;
  onRoundEnd?(ctx: RoundContext, toolCalls: ToolCallInfo[]): void;
}

const listeners: LoopListener[] = [];

export function registerLoopListener(listener: LoopListener): void {
  listeners.push(listener);
}

export function getLoopListeners(): LoopListener[] {
  return listeners;
}
