/**
 * LUCID Context Engine - QMD Search + Salience Scoring
 */
import { spawn } from "node:child_process";
import { RECENCY_WEIGHTS, TYPE_WEIGHTS, COLLECTION_WEIGHTS, } from "./config.js";
/**
 * Run QMD BM25 search. Uses "search" subcommand (no LLM expansion) for speed.
 */
export async function qmdSearch(prompt, n, config) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [config.qmdShimPath, "search", prompt, "-n", String(n), "--json"], { env: process.env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
        let stdout = "";
        let settled = false;
        const timer = setTimeout(() => {
            if (!settled) {
                settled = true;
                child.kill();
                reject(new Error(`QMD search timed out after ${config.timeoutMs}ms`));
            }
        }, config.timeoutMs);
        child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
        child.on("close", (code) => {
            clearTimeout(timer);
            if (settled)
                return;
            settled = true;
            if (code !== 0) {
                resolve([]);
                return;
            }
            try {
                const start = stdout.indexOf("[");
                const end = stdout.lastIndexOf("]");
                if (start === -1 || end === -1) {
                    resolve([]);
                    return;
                }
                const parsed = JSON.parse(stdout.slice(start, end + 1));
                resolve(Array.isArray(parsed) ? parsed : []);
            }
            catch {
                resolve([]);
            }
        });
        child.on("error", (err) => {
            clearTimeout(timer);
            if (!settled) {
                settled = true;
                reject(err);
            }
        });
    });
}
function getRecencyMultiplier(filePath) {
    const m = filePath.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!m)
        return 1.0;
    const fileDate = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
    const daysDiff = (Date.now() - fileDate.getTime()) / 86_400_000;
    for (const { maxDays, weight } of RECENCY_WEIGHTS) {
        if (daysDiff <= maxDays)
            return weight;
    }
    return 0.8;
}
function getTypeWeight(filePath) {
    for (const { pattern, weight } of TYPE_WEIGHTS) {
        if (pattern.test(filePath))
            return weight;
    }
    return 1.0;
}
function getCollectionWeight(filePath) {
    for (const { pattern, weight } of COLLECTION_WEIGHTS) {
        if (pattern.test(filePath))
            return weight;
    }
    return 1.0;
}
export function scoreBySalience(results) {
    return results
        .map((r) => ({
        file: r.file,
        title: r.title || r.file,
        snippet: r.snippet || "",
        qmdScore: r.score,
        salienceScore: r.score * getRecencyMultiplier(r.file) * getTypeWeight(r.file) * getCollectionWeight(r.file),
    }))
        .sort((a, b) => b.salienceScore - a.salienceScore);
}
export async function searchAndScore(prompt, config) {
    const raw = await qmdSearch(prompt, config.topK * 2, config);
    return scoreBySalience(raw)
        .filter((r) => r.salienceScore >= config.threshold)
        .slice(0, config.topK);
}
export function formatResultsAsContext(results) {
    if (results.length === 0)
        return "";
    const lines = [
        "## Recalled Context (auto-retrieved from workspace knowledge base)",
        "",
    ];
    for (const r of results) {
        const displayPath = r.file.replace(/^qmd:\/\/[^/]+\//, "");
        lines.push(`### [${displayPath}] (salience: ${r.salienceScore.toFixed(2)})`);
        const clean = r.snippet
            .replace(/^@@ -\d+,\d+ @@ \(\d+ before, \d+ after\)\n/, "")
            .trim();
        if (r.title && r.title !== r.file)
            lines.push(`*${r.title}*`);
        if (clean)
            lines.push(clean);
        lines.push("");
    }
    lines.push("---");
    lines.push("_Context retrieved automatically. May or may not be directly relevant._");
    return lines.join("\n");
}
//# sourceMappingURL=search.js.map