export interface LucidConfig {
    /** Max number of results to include (default: 5) */
    topK: number;
    /** Minimum final salience score to include a result (default: 0.3) */
    threshold: number;
    /** Path to qmd-shim.js */
    qmdShimPath: string;
    /** Search timeout in milliseconds (default: 5000) */
    timeoutMs: number;
}
/** Recency multipliers: days since modified -> multiplier */
export declare const RECENCY_WEIGHTS: Array<{
    maxDays: number;
    weight: number;
}>;
/** Type weights based on file path patterns */
export declare const TYPE_WEIGHTS: Array<{
    pattern: RegExp;
    weight: number;
}>;
/** Collection weights: collection name fragment -> multiplier */
export declare const COLLECTION_WEIGHTS: Array<{
    pattern: RegExp;
    weight: number;
}>;
/** Trivial message patterns that should skip search */
export declare const TRIVIAL_PATTERNS: RegExp[];
export declare function resolveConfig(raw: Record<string, unknown>): LucidConfig;
//# sourceMappingURL=config.d.ts.map