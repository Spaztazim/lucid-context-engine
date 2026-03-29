# LUCID Context Engine

**Autonomous pre-search memory retrieval for OpenClaw agents.**

LUCID hooks into OpenClaw's ContextEngine API (v3.7+) to automatically search your QMD workspace knowledge base before every model response. No manual retrieval needed — just install, activate, and your agent starts remembering things.

## Installation

```bash
git clone https://github.com/Spaztazim/lucid-context-engine.git ~/.openclaw/extensions/lucid-context-engine
```

Pre-built JS is included in `dist/` — no build step required.

## Activation

Add to your OpenClaw config or agent config:

```json
{
  "plugins": {
    "slots": {
      "contextEngine": "lucid"
    },
    "entries": {
      "lucid-context-engine": {
        "enabled": true
      }
    }
  }
}
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `topK` | `5` | Max results to inject per message |
| `threshold` | `0.3` | Minimum salience score (0.0–1.0) |
| `qmdShimPath` | auto | Path to `qmd-shim.js` |
| `timeoutMs` | `5000` | QMD search timeout in ms |

### Example with custom options:

```json
{
  "plugins": {
    "entries": {
      "lucid-context-engine": {
        "enabled": true,
        "topK": 8,
        "threshold": 0.2,
        "timeoutMs": 3000
      }
    }
  }
}
```

## How It Works

Every non-trivial message triggers:
1. QMD hybrid search (BM25 + semantic) across your indexed workspace
2. Salience scoring: `relevance × recency × file_type × collection`
3. Top results injected into system prompt before the model responds

Trivial messages ("ok", "thanks", heartbeats) are skipped automatically.

## Requirements

- OpenClaw v3.7+
- QMD workspace search daemon running
- Node.js 18+

## Troubleshooting

**No context being injected:**
- Verify QMD is running: `qmd.cmd search "test" -n 3`
- Check `qmdShimPath` points to a valid `qmd-shim.js`
- Lower the `threshold` (try `0.1`) to see if results are just scoring below cutoff
- Check agent logs for `[lucid-context-engine] QMD search failed` messages

**Search timing out:**
- Increase `timeoutMs` (default 5000ms)
- Check QMD daemon health

**Too much noise in context:**
- Raise `threshold` (try `0.5` or `0.7`)
- Lower `topK` (try `3`)

**Context not relevant:**
- LUCID scores by salience (recency × relevance × type) — if old files are scoring high, check your QMD index for stale content
- Lessons and correction files are weighted 2× by default; adjust `TYPE_WEIGHTS` in `src/config.ts` and rebuild if needed

## Architecture Notes

LUCID is structurally compatible with OpenClaw's `ContextEngine` interface and registers via `api.registerContextEngine("lucid", ...)`. It implements `ingest()`, `assemble()`, and `compact()`. Compaction is delegated to the runtime.

The search uses QMD's BM25 subcommand (`qmd search`) for speed — no LLM expansion, no semantic overhead on every keystroke.
