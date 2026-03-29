import type { ContextEngine } from "openclaw/plugin-sdk";
import { type LucidConfig } from "./config.js";
type AnyMessage = Parameters<ContextEngine["assemble"]>[0]["messages"][number];
type AssembleParams = Parameters<ContextEngine["assemble"]>[0];
type CompactParams = Parameters<ContextEngine["compact"]>[0];
export declare class LucidContextEngine {
    private readonly config;
    readonly info: {
        id: string;
        name: string;
        version: string;
        ownsCompaction: boolean;
    };
    constructor(config: LucidConfig);
    private isTrivialPrompt;
    ingest(_params: {
        sessionId: string;
        sessionKey?: string;
        message: AnyMessage;
        isHeartbeat?: boolean;
    }): Promise<{
        ingested: boolean;
    }>;
    assemble(params: AssembleParams): Promise<{
        messages: AnyMessage[];
        estimatedTokens: number;
        systemPromptAddition?: string;
    }>;
    compact(params: CompactParams): ReturnType<ContextEngine["compact"]>;
}
export {};
//# sourceMappingURL=engine.d.ts.map