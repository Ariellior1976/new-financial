# Graph Report - new-financial  (2026-09-29)

## Corpus Check
- 36 files · ~105,277 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .css 2)

## Summary
- 206 nodes · 278 edges · 11 communities (10 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Data Layer & Indicators
- FastAPI Backend
- Frontend Dev Tooling
- React Dashboard UI
- News & Podcast Engine
- TS App Config
- TS Node Config
- Dev Dependencies
- Live Screener Fetchers
- Runtime Dependencies
- TS Root Config

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `compilerOptions` - 16 edges
3. `chat_endpoint()` - 8 edges
4. `get_ta100_recommendations()` - 6 edges
5. `DataIngestionModule` - 6 edges
6. `get_podcasts()` - 5 edges
7. `create_edition()` - 5 edges
8. `check_and_update_podcast()` - 5 edges
9. `get_live_screener_results()` - 5 edges
10. `get_live_ta100_recommendations()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `startup_event()` --calls--> `check_and_update_podcast()`  [EXTRACTED]
  stock_screener_app/backend/main.py → stock_screener_app/backend/news_engine.py
- `get_screener_results()` --calls--> `get_live_screener_results()`  [EXTRACTED]
  stock_screener_app/backend/main.py → stock_screener_app/backend/screener.py
- `get_ta100_recommendations()` --calls--> `get_live_ta100_recommendations()`  [EXTRACTED]
  stock_screener_app/backend/main.py → stock_screener_app/backend/screener.py
- `get_live_screener_results()` --calls--> `get_live_screener_results()`  [EXTRACTED]
  stock_screener_app/backend/main.py → stock_screener_app/backend/screener.py
- `get_sectors_deep_dive()` --calls--> `get_sector_deep_dives()`  [EXTRACTED]
  stock_screener_app/backend/main.py → stock_screener_app/backend/screener.py

## Import Cycles
- None detected.

## Communities (11 total, 1 thin omitted)

### Community 0 - "Data Layer & Indicators"
Cohesion: 0.09
Nodes (23): logging, numpy, os, pandas, pandas_ta, requests, sqlite3, get_connection() (+15 more)

### Community 1 - "FastAPI Backend"
Cohesion: 0.08
Nodes (33): apscheduler_schedulers_asyncio, BaseModel, fastapi, fastapi_middleware_cors, fastapi_responses, fastapi_staticfiles, get, on_event (+25 more)

### Community 2 - "Frontend Dev Tooling"
Cohesion: 0.10
Nodes (22): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, react-router-dom, @types/node, @types/react (+14 more)

### Community 3 - "React Dashboard UI"
Cohesion: 0.12
Nodes (19): axios, lucide-react, react, react-dom, recharts, App(), BackgroundSlideshow(), ChartDataPoint (+11 more)

### Community 4 - "News & Podcast Engine"
Cohesion: 0.14
Nodes (18): asyncio, BackgroundTasks, datetime, edge_tts, feedparser, google_generativeai, json, get_latest_market_news() (+10 more)

### Community 5 - "TS App Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 6 - "TS Node Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 7 - "Dev Dependencies"
Cohesion: 0.15
Nodes (13): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @types/node, @types/react (+5 more)

### Community 8 - "Live Screener Fetchers"
Cohesion: 0.31
Nodes (7): get_cached_or_fetch(), get_live_screener_results(), _fetch(), get_live_ta100_recommendations(), get_sector_deep_dives(), _fetch(), yfinance

### Community 9 - "Runtime Dependencies"
Cohesion: 0.29
Nodes (7): dependencies, axios, lucide-react, react, react-dom, react-router-dom, recharts

## Knowledge Gaps
- **76 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+71 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 114 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Dev Dependencies` to `Frontend Dev Tooling`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Dependencies` to `Frontend Dev Tooling`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `chat_endpoint()` (e.g. with `get_latest_market_news()` and `get_live_screener_results()`) actually correct?**
  _`chat_endpoint()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _76 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Data Layer & Indicators` be split into smaller, more focused modules?**
  _Cohesion score 0.08708708708708708 - nodes in this community are weakly interconnected._
- **Should `FastAPI Backend` be split into smaller, more focused modules?**
  _Cohesion score 0.08021390374331551 - nodes in this community are weakly interconnected._
- **Should `Frontend Dev Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._