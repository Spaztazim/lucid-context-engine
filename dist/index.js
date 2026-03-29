import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { resolveConfig } from "./src/config.js";
import { LucidContextEngine } from "./src/engine.js";
export default {
    id: "lucid-context-engine",
    name: "LUCID Context Engine",
    description: "Retrieval-augmented context assembly via QMD workspace search. " +
        "Injects relevant knowledge into the system prompt on every turn.",
    kind: "context-engine",
    configSchema: {
        ...emptyPluginConfigSchema,
        parse(value) {
            const raw = value && typeof value === "object" && !Array.isArray(value)
                ? value
                : {};
            return resolveConfig(raw);
        },
    },
    register(api) {
        const rawConfig = api.config?.plugins?.entries?.["lucid-context-engine"] ?? {};
        const config = resolveConfig(typeof rawConfig === "object" && rawConfig !== null && !Array.isArray(rawConfig)
            ? rawConfig
            : {});
        const engine = new LucidContextEngine(config);
        api.registerContextEngine("lucid", () => engine);
    },
};
//# sourceMappingURL=index.js.map