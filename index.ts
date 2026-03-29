/**
 * LUCID Context Engine - Plugin Entry Point
 *
 * Registers the LUCID retrieval-augmented context engine with OpenClaw.
 * Set plugins.slots.contextEngine = "lucid" to activate.
 */
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import type { ContextEngine } from "openclaw/plugin-sdk";
import { resolveConfig } from "./src/config.js";
import { LucidContextEngine } from "./src/engine.js";

export default {
  id: "lucid-context-engine",
  name: "LUCID Context Engine",
  description:
    "Retrieval-augmented context assembly via QMD workspace search. " +
    "Injects relevant knowledge into the system prompt on every turn.",
  kind: "context-engine" as const,

  configSchema: {
    ...emptyPluginConfigSchema,
    parse(value: unknown) {
      const raw =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : {};
      return resolveConfig(raw);
    },
  },

  register(api: OpenClawPluginApi) {
    const rawConfig =
      (api.config as unknown as {
        plugins?: { entries?: Record<string, unknown> };
      })?.plugins?.entries?.["lucid-context-engine"] ?? {};

    const config = resolveConfig(
      typeof rawConfig === "object" && rawConfig !== null && !Array.isArray(rawConfig)
        ? (rawConfig as Record<string, unknown>)
        : {}
    );

    const engine = new LucidContextEngine(config) as unknown as ContextEngine;
    api.registerContextEngine("lucid", () => engine);
  },
};
