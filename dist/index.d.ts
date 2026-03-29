/**
 * LUCID Context Engine - Plugin Entry Point
 *
 * Registers the LUCID retrieval-augmented context engine with OpenClaw.
 * Set plugins.slots.contextEngine = "lucid" to activate.
 */
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
declare const _default: {
    id: string;
    name: string;
    description: string;
    kind: "context-engine";
    configSchema: {
        parse(value: unknown): import("./src/config.js").LucidConfig;
    };
    register(api: OpenClawPluginApi): void;
};
export default _default;
//# sourceMappingURL=index.d.ts.map