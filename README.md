# LUCID Context Engine

**Autonomous memory retrieval for OpenClaw agents.** LUCID hooks into OpenClaw's native ContextEngine API to automatically search your knowledge base *before* the model ever sees your message — no manual retrieval, no extra steps.

> Available since OpenClaw v3.7. Requires QMD (the OpenClaw workspace search daemon) to be running.

---

## Why LUCID?

Most agents treat memory as an afterthought. You ask a question, they answer from their training data, and relevant context sitting in your files stays invisible.

LUCID flips that. Every time you send a message, LUCID:

1. **Pre-searches your workspace** using QMD's hybrid BM25 + semantic search
2. **Scores results by salience** — not just relevance, but recency, file type, and collection priority
3. **Injects what fits** into the system prompt, respecting your context budget
4. **Skips the search** for trivial messages ("ok", "thanks", heartbeats) — no wasted cycles

The result: your agent actually *remembers* things across sessions, pulls in relevant decisions and lessons automatically, and doesn't need to be told to "check your notes."

### How it compares to standalone scoring libraries

Standalone scoring/ranking libraries let you compute relevance scores — but you still have to wire up the retrieval pipeline yourself: call QMD, fetch results, format them, inject them at the right point in the prompt. That's plumbing work that has to happen on every message.

LUCID handles the full pipeline. Plug it in once, and it runs automatically on every turn, without any changes to your prompts or tools.

---

## Features

- **Pre-search**: runs QMD hybrid search on every non-trivial prompt, before the model responds
- **Salience scoring**: `relevance × recency × type_weight × collection_weight` — recent lessons score higher than old logs, memory files score higher than reference docs
- **Context budget awareness**: injects results up to your remaining context window
- **Trivial prompt filtering**: skips search on short acknowledgements and heartbeats
- **Cross-agent memory**: reads from any QMD-indexed collection — works across Lux, Deckard, Lyra, or any other agent sharing the same workspace
- **Zero config required**: auto-detects QMD shim path, sensible defaults out of the box
- **Graceful fallback**: if QMD is unavailable or times out, silently falls back — no errors, no interruptions

---

## Installation

### Via OpenClaw Extensions

```bash
# Copy to your OpenClaw extensions directory
cp -r lucid-context-engine ~/.openclaw/extensions/

# Or clone directly
git clone https://github.com/Spaztazim/lucid-context-engine.git ~/.openclaw/extensions/lucid-context-engine
```

### Activate the Engine

In your OpenClaw config (`~/.openclaw/config.json` or per-agent config):

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

That's it. LUCID will start running on your next session.

---

## Configuration

All config is optional — defaults work out of the box.

```json
{
  "plugins": {
    "entries": {
      "lucid-context-engine": {
        "enabled": true,
        "topK": 5,
        "threshold": 0.3,
        "qmdShimPath": "~/clawd/tools/qmd-shim.js",
        "timeoutMs": 5000
      }
    }
  }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `topK` | `5` | Max results to inject per turn |
| `threshold` | `0.3` | Minimum salience score (0.0–1.0) to include a result |
| `qmdShimPath` | auto-detected | Path to `qmd-shim.js` (resolved from `USERPROFILE/clawd/tools/`) |
| `timeoutMs` | `5000` | Max ms to wait for QMD before falling back |

---

## Architecture

```
User Message
    │
    ▼
┌─────────────────────────────┐
│  LUCID Context Engine       │
│  (ContextEngine API hook)   │
│                             │
│  1. Trivial filter?  ──yes──▶ skip, pass through
│           │ no
│  2. QMD hybrid search       │
│     (BM25 + semantic)       │
│           │                 │
│  3. Salience scoring        │
│     relevance × recency     │
│     × type × collection     │
│           │                 │
│  4. Threshold filter        │
│  5. Inject top-K into       │
│     system prompt addition  │
└─────────────────────────────┘
    │
    ▼
Model sees: [system prompt] + [recalled context] + [your message]
```

### Salience Scoring

Each result gets a composite score:

```
salience = qmd_score × recency_weight × type_weight × collection_weight
```

**Recency weights** (days since file was last modified):
- ≤7 days: 1.5×
- ≤30 days: 1.2×
- ≤90 days: 1.0×
- Older: 0.8×

**Type weights** (based on filename patterns):
- `LESSONS.md`, `lesson`, `correction`: 2.0×
- `decision`: 1.5×
- `memory/YYYY-MM-DD.md`: 1.0×
- `log`: 0.7×

**Collection weights** (based on QMD collection name):
- `memory` collection: 1.5×
- `codex` collection: 1.2×
- Everything else: 1.0×

---

## How It Works

LUCID registers itself via OpenClaw's `registerContextEngine` API (available since v3.7). When activated via `plugins.slots.contextEngine = "lucid"`, it intercepts every `assemble()` call in the prompt pipeline.

The `assemble()` method:
1. Checks if the prompt is trivial (< 10 chars, or matches patterns like "ok", "thanks", heartbeat)
2. If not trivial, spawns a `qmd search` subprocess with a timeout
3. Applies salience scoring to the raw results
4. Filters by threshold and returns the top-K as a `systemPromptAddition`

The runtime then appends this context to the system prompt automatically. The model sees it as part of its instructions, not as a user message.

---

## Requirements

- OpenClaw v3.7+
- QMD workspace search daemon (ships with OpenClaw)
- Node.js 18+ (for the subprocess spawn)

---

## Building from Source

```bash
npm install
npm run build
```

Output goes to `dist/`.

---

## License

MIT © 2026 Almost Spec Labs
