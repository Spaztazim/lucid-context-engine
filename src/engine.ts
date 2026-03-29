/**
 * LUCID Context Engine - Core Implementation
 *
 * Does NOT use `implements ContextEngine` to avoid CompactResult type-identity
 * conflicts caused by openclaw resolving from two different module paths.
 * The class is structurally compatible and cast to ContextEngine at registration.
 */
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk";
import type { ContextEngine } from "openclaw/plugin-sdk";
import { type LucidConfig, TRIVIAL_PATTERNS } from "./config.js";
import { searchAndScore, formatResultsAsContext } from "./search.js";

// Pull AgentMessage from the same openclaw package so types align
type AnyMessage = Parameters<ContextEngine["assemble"]>[0]["messages"][number];
type AssembleParams = Parameters<ContextEngine["assemble"]>[0];
type CompactParams = Parameters<ContextEngine["compact"]>[0];

export class LucidContextEngine {
  readonly info = {
    id: "lucid",
    name: "LUCID Context Engine",
    version: "0.1.0",
    ownsCompaction: false,
  };

  constructor(private readonly config: LucidConfig) {}

  private isTrivialPrompt(prompt: string | undefined): boolean {
    if (!prompt) return true;
    const trimmed = prompt.trim();
    if (trimmed.length < 10) return true;
    for (const pattern of TRIVIAL_PATTERNS) {
      if (pattern.test(trimmed)) return true;
    }
    return false;
  }

  async ingest(_params: {
    sessionId: string;
    sessionKey?: string;
    message: AnyMessage;
    isHeartbeat?: boolean;
  }): Promise<{ ingested: boolean }> {
    return { ingested: false };
  }

  async assemble(params: AssembleParams): Promise<{
    messages: AnyMessage[];
    estimatedTokens: number;
    systemPromptAddition?: string;
  }> {
    const base = {
      messages: params.messages,
      estimatedTokens: estimateTokens(params.messages),
    };

    if (this.isTrivialPrompt(params.prompt)) {
      return base;
    }

    try {
      const results = await searchAndScore(params.prompt!, this.config);
      if (results.length === 0) return base;
      return { ...base, systemPromptAddition: formatResultsAsContext(results) };
    } catch (err) {
      console.warn(
        `[lucid-context-engine] QMD search failed, falling back: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      return base;
    }
  }

  async compact(params: CompactParams): ReturnType<ContextEngine["compact"]> {
    return delegateCompactionToRuntime(params);
  }
}

function estimateTokens(messages: AnyMessage[]): number {
  let total = 0;
  for (const msg of messages) {
    const m = msg as unknown as { content?: unknown };
    if (typeof m.content === "string") {
      total += Math.ceil(m.content.length / 4);
    } else if (Array.isArray(m.content)) {
      for (const part of m.content) {
        if (typeof part === "object" && part !== null && "text" in part) {
          total += Math.ceil(String((part as { text: unknown }).text).length / 4);
        }
      }
    }
  }
  return total;
}
