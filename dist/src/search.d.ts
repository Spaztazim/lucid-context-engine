import { type LucidConfig } from "./config.js";
export interface QmdRawResult {
    docid: string;
    score: number;
    file: string;
    title?: string;
    snippet?: string;
}
export interface ScoredResult {
    file: string;
    title: string;
    snippet: string;
    qmdScore: number;
    salienceScore: number;
}
/**
 * Run QMD BM25 search. Uses "search" subcommand (no LLM expansion) for speed.
 */
export declare function qmdSearch(prompt: string, n: number, config: LucidConfig): Promise<QmdRawResult[]>;
export declare function scoreBySalience(results: QmdRawResult[]): ScoredResult[];
export declare function searchAndScore(prompt: string, config: LucidConfig): Promise<ScoredResult[]>;
export declare function formatResultsAsContext(results: ScoredResult[]): string;
//# sourceMappingURL=search.d.ts.map