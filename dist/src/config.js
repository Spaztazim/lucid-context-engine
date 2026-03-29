/**
 * LUCID Context Engine - Configuration
 * Thresholds, weights, and skip heuristics for QMD-based retrieval.
 */
import { join } from "node:path";
/** Recency multipliers: days since modified -> multiplier */
export const RECENCY_WEIGHTS = [
    { maxDays: 7, weight: 1.5 },
    { maxDays: 30, weight: 1.2 },
    { maxDays: 90, weight: 1.0 },
    { maxDays: Infinity, weight: 0.8 },
];
/** Type weights based on file path patterns */
export const TYPE_WEIGHTS = [
    { pattern: /lesson|correction/i, weight: 2.0 },
    { pattern: /LESSONS\.md$/i, weight: 2.0 },
    { pattern: /decision/i, weight: 1.5 },
    { pattern: /reference|resource/i, weight: 1.0 },
    { pattern: /memory\/\d{4}-\d{2}-\d{2}\.md$/i, weight: 1.0 },
    { pattern: /log\b/i, weight: 0.7 },
];
/** Collection weights: collection name fragment -> multiplier */
export const COLLECTION_WEIGHTS = [
    { pattern: /memory/i, weight: 1.5 },
    { pattern: /codex/i, weight: 1.2 },
    // workspace/clawd defaults to 1.0
];
/** Trivial message patterns that should skip search */
export const TRIVIAL_PATTERNS = [
    /^(ok|okay|yes|no|sure|thanks|thank you|got it|sounds good|perfect|great|nice|cool|lol|haha)\.?$/i,
    /^(good morning|good evening|good night|hello|hi|hey|bye|goodbye)\.?$/i,
    /heartbeat/i,
    /^HEARTBEAT_OK$/,
];
export function resolveConfig(raw) {
    const home = process.env.USERPROFILE || process.env.HOME || "";
    const defaultShim = home
        ? join(home, "clawd", "tools", "qmd-shim.js")
        : "qmd-shim.js";
    return {
        topK: typeof raw.topK === "number" ? Math.floor(raw.topK) : 5,
        threshold: typeof raw.threshold === "number" ? raw.threshold : 0.3,
        qmdShimPath: typeof raw.qmdShimPath === "string" ? raw.qmdShimPath : defaultShim,
        timeoutMs: typeof raw.timeoutMs === "number" ? Math.floor(raw.timeoutMs) : 5000,
    };
}
//# sourceMappingURL=config.js.map