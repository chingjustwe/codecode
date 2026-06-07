/**
 * ChatModel factory — reads environment variables to create the correct model
 * instance. Dispatches to OpenAIChatModel or AnthropicChatModel based on the
 * provider's `apiFramework` field (not the provider name itself).
 *
 * Exports:
 * - `createModel()` — factory function, reads config from env vars
 * - `printAvailableProviders()` — logs all registered provider names
 *
 * Dependencies:
 * - `src/llm/providers.ts` — provider config registry
 * - `src/llm/openai-chat-model.ts` — OpenAI-compatible model class
 * - `src/llm/anthropic-chat-model.ts` — Anthropic API model class
 * - `dotenv` — loads .env into process.env
 */
import "dotenv/config";
import { OpenAIChatModel } from "./openai-chat-model.js";
import { AnthropicChatModel } from "./anthropic-chat-model.js";
import { getProvider, listProviders } from "./providers.js";
import type { ChatModel, ApiFramework } from "../types/index.js";

/**
 * Create a ChatModel instance based on environment variables.
 *
 * Dispatches to the correct model class based on the provider's apiFramework:
 *   - "openai"   → OpenAIChatModel  (POST /v1/chat/completions)
 *   - "anthropic" → AnthropicChatModel (POST /v1/messages)
 *
 * Env vars:
 *   LLM_PROVIDER  — provider name (default: "anthropic")
 *   LLM_API_KEY   — fallback API key for any provider
 *   LLM_MODEL     — override the default model name
 *   {PROVIDER}_API_KEY — provider-specific key (e.g. OPENAI_API_KEY)
 */
export function createModel(): ChatModel {
  const providerName = process.env.LLM_PROVIDER ?? "anthropic";
  const provider = getProvider(providerName);

  const apiKey = process.env.LLM_API_KEY ?? process.env[provider.envKey];

  if (!apiKey) {
    throw new Error(
      `Missing API key. Set LLM_API_KEY or ${provider.envKey} environment variable.`
    );
  }

  const modelName = process.env.LLM_MODEL ?? provider.defaultModel;

  const temperature = Number(process.env.LLM_TEMPERATURE ?? provider.temperature ?? 0);

  console.log(`  🔧 Model: ${providerName}/${modelName}`);

  return createModelForFramework(provider.apiFramework, {
    apiKey,
    endpoint: provider.endpoint,
    model: modelName,
    temperature,
  });
}

/**
 * Dispatch to the correct ChatModel implementation based on the API framework.
 */
function createModelForFramework(
  framework: ApiFramework,
  config: { apiKey: string; endpoint: string; model: string; temperature: number }
): ChatModel {
  switch (framework) {
    case "anthropic":
      return new AnthropicChatModel(config);
    case "openai":
      return new OpenAIChatModel(config);
    default: {
      // Exhaustiveness check — if you add a new framework, TS will error here
      const _exhaustive: never = framework;
      throw new Error(`Unknown API framework: ${_exhaustive}`);
    }
  }
}

/** Print available providers to console */
export function printAvailableProviders(): void {
  console.log(`  📋 Providers: ${listProviders().join(" · ")}`);
}