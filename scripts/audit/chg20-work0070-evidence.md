# WORK-0070 — CHG-20 project authorization boundary evidence (2026-11-15)

| Area | Evidence | Status |
|---|---|---|
| Owner WORK-0069 build/typecheck | Five commands exit 0 in uploaded logs | Owner-confirmed, previous snapshot |
| Owner intelligence | 2,173 total, 2,164 pass, 0 fail, 9 TODO | Owner-confirmed, previous snapshot |
| Owner broad Electron | 9,095 total, 8,929 pass, 98 fail, 1 cancelled, 67 skipped | Owner-confirmed, not clean |
| Owner focused commands | Two redirections to `/focused-electron.log` failed because LOGDIR unset | Not executed; no test result |
| Confirmed read-boundary bug | planned project ID list reached `read()` before intersection with authorized `projectSourceIds` | Source confirmed ERR-075 |
| Fix behavior | intersect before read, zero reads for missing/empty/disjoint project authorization, preserve result filter | Implemented; Mac pending |
| Isolated verification | TS5.8 transpile; actual Node tests for adapter 10/10 | Agent-executed local |
| WTA follow-up/lineage | Older spoken recall, mixed guard and provider scope/lineage concern | Open ERR-076 |
| Full acceptance | C20-AC1 FAIL; C20-AC2 PENDING; CHG-21 blocked | No acceptance |

The verified patch ZIP contains a README with self-contained log paths under `~/Downloads/Sneak-Peek-WORK0070-logs`; no stage, reset, stash, commit or push. This file records patch preparation, not application to the owner's Mac.
