#!/usr/bin/env node
// ScrubiMail /validate load harness — zero-dependency (Node 18+ global fetch).
//
// Answers the diagnostic's open question: does the on-request-path work
// (credit decrement + the ~3 BillingProfile reads + the connection held across
// the egress wait) degrade under concurrency, and how does verify_ms behave
// under deep-mode load. Records verify_ms / persist_ms / request_time straight
// from the response body, plus client-side latency and HTTP outcome, at rising
// concurrency levels.
//
// Auth: X-API-Key header (SCRUBI_API_KEY) or JWT (SCRUBI_JWT -> Authorization: Bearer).
// Secrets come from the ENVIRONMENT, never the command line, so they stay out
// of shell history and this file.
//
// Usage:
//   SCRUBI_BASE="https://staging.example/scrubimail/api/v1" \
//   SCRUBI_API_KEY="..." \
//   node loadtest.mjs --preflight-only
//
//   ... node loadtest.mjs --mode deep --email-mode fixed --levels 10,50,100,200 --per-level 60
//
// Flags:
//   --levels a,b,c        concurrency levels to ramp through   (default 10,50,100,200)
//   --per-level N         requests fired at each level         (default 60)
//   --mode deep|fast      deep = wait on egress SMTP (default) | fast = syntax/DNS only
//   --email-mode fixed|distinct|domainmix
//        fixed     one address -> after the 1st, all cache hits. SAFE: stresses the
//                  billing/persist/pool path at concurrency with NO repeated SMTP. (default)
//        distinct  loadtest-<uuid>@<domain> -> every request is a cache MISS = a real
//                  SMTP probe from the egress box. Measures true verify_ms but HAMMERS
//                  real mail servers. Requires --domains and --i-understand-smtp-load.
//        domainmix like distinct but round-robins --domains.
//   --domains d1,d2       domains for distinct/domainmix (use ones you control if possible)
//   --details             send ?details=true (bigger payload; closer to real clients that ask for it)
//   --timeout-ms N        client-side per-request timeout (default 20000; keep > realtime budget)
//   --gap-ms N            pause between concurrency levels (default 3000; lets the egress limiter settle)
//   --max-total N         hard safety cap on total requests (default = sum(levels*per-level))
//   --out FILE            JSONL of every raw sample (default ./loadtest-<ts>.jsonl)
//   --preflight-only      fire ONE request, print the full response, exit (verify auth/plan/egress)
//   --yes                 skip the confirmation prompt
//   --force               continue the ramp even if preflight is non-200

import { setTimeout as sleep } from "node:timers/promises";
import { randomUUID } from "node:crypto";
import { appendFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

// ---------------------------------------------------------------- arg parsing
const argv = process.argv.slice(2);
function flag(name, def = undefined) {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const next = argv[i + 1];
  if (next === undefined || next.startsWith("--")) return true; // boolean flag
  return next;
}
const has = (name) => argv.includes(`--${name}`);

const BASE = process.env.SCRUBI_BASE?.replace(/\/+$/, "");
const ENDPOINT = process.env.SCRUBI_ENDPOINT || (BASE ? `${BASE}/validate/` : null);
const API_KEY = process.env.SCRUBI_API_KEY || null;
const API_KEYS = (process.env.SCRUBI_API_KEYS || "").split(",").map((s) => s.trim()).filter(Boolean);
const JWT = process.env.SCRUBI_JWT || null;

const MODE = String(flag("mode", "deep"));
const EMAIL_MODE = String(flag("email-mode", "fixed"));
const LEVELS = String(flag("levels", "10,50,100,200")).split(",").map((n) => parseInt(n, 10)).filter((n) => n > 0);
const PER_LEVEL = parseInt(flag("per-level", "60"), 10);
const DOMAINS = String(flag("domains", "example.com")).split(",").map((s) => s.trim()).filter(Boolean);
const DETAILS = has("details");
const TIMEOUT_MS = parseInt(flag("timeout-ms", "20000"), 10);
const GAP_MS = parseInt(flag("gap-ms", "3000"), 10);
const PREFLIGHT_ONLY = has("preflight-only");
const YES = has("yes");
const FORCE = has("force");
const I_UNDERSTAND = has("i-understand-smtp-load");

const plannedTotal = LEVELS.reduce((a, l) => a + PER_LEVEL, 0);
const MAX_TOTAL = parseInt(flag("max-total", String(plannedTotal)), 10);
const OUT = String(flag("out", `./loadtest-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`));

// ---------------------------------------------------------------- validation
function die(msg) {
  console.error(`\x1b[31mERROR:\x1b[0m ${msg}`);
  process.exit(1);
}
if (!ENDPOINT) die("Set SCRUBI_BASE (e.g. https://host/scrubimail/api/v1) or SCRUBI_ENDPOINT.");
if (!API_KEY && !JWT && API_KEYS.length === 0)
  die("Set SCRUBI_API_KEY (or SCRUBI_API_KEYS=a,b,c) or SCRUBI_JWT for auth.");
if (!["deep", "fast"].includes(MODE)) die(`--mode must be deep|fast, got ${MODE}`);
if (!["fixed", "distinct", "domainmix"].includes(EMAIL_MODE)) die(`--email-mode invalid: ${EMAIL_MODE}`);
if ((EMAIL_MODE === "distinct" || EMAIL_MODE === "domainmix") && MODE === "deep" && !I_UNDERSTAND)
  die(
    `--email-mode ${EMAIL_MODE} + --mode deep sends a REAL, UNIQUE SMTP probe per request from the\n` +
      `       egress box to ${DOMAINS.join(", ")}. This can burn IP reputation and trip provider rate\n` +
      `       limits. Re-run with --i-understand-smtp-load if that is intended (and prefer domains you own).`
  );

// -------------------------------------------------------------- auth headers
function headersFor(keyOverride) {
  const h = { "Content-Type": "application/json", Accept: "application/json" };
  const key = keyOverride || API_KEY;
  if (key) h["X-API-Key"] = key;
  else if (JWT) h["Authorization"] = `Bearer ${JWT}`;
  return h;
}
const keyRing = API_KEYS.length ? API_KEYS : API_KEY ? [API_KEY] : [null];
let keyCursor = 0;
const nextKey = () => keyRing[keyCursor++ % keyRing.length];

// ------------------------------------------------------------- email builder
let emailCursor = 0;
function nextEmail() {
  const i = emailCursor++;
  if (EMAIL_MODE === "fixed") return `loadtest-fixed@${DOMAINS[0]}`;
  const domain = EMAIL_MODE === "domainmix" ? DOMAINS[i % DOMAINS.length] : DOMAINS[0];
  return `loadtest-${randomUUID()}@${domain}`;
}

// -------------------------------------------------------------- URL assembly
function urlFor() {
  const u = new URL(ENDPOINT);
  if (MODE === "fast") u.searchParams.set("mode", "fast");
  if (DETAILS) u.searchParams.set("details", "true");
  return u.toString();
}
const REQ_URL = urlFor();

// ------------------------------------------------------------- one request
async function fireOne() {
  const email = nextEmail();
  const key = nextKey();
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const t0 = performance.now();
  let httpStatus = 0;
  let body = null;
  let errText = null;
  try {
    const res = await fetch(REQ_URL, {
      method: "POST",
      headers: headersFor(key),
      body: JSON.stringify({ email }),
      signal: ctrl.signal,
    });
    httpStatus = res.status;
    const text = await res.text();
    try {
      body = JSON.parse(text);
    } catch {
      errText = text.slice(0, 300);
    }
  } catch (e) {
    errText = e.name === "AbortError" ? `client-timeout>${TIMEOUT_MS}ms` : String(e.message || e);
  } finally {
    clearTimeout(to);
  }
  const client_ms = Math.round(performance.now() - t0);
  const timing = body?.timing || {};
  return {
    ts: Date.now(),
    email,
    http_status: httpStatus,
    client_ms,
    request_time_ms: body?.request_time != null ? Math.round(body.request_time * 1000) : null,
    verify_ms: timing.verify_ms ?? null,
    persist_ms: timing.persist_ms ?? null,
    cached: body?.cached ?? null,
    resp_mode: body?.mode ?? null,
    verification_status: body?.verification_status ?? null,
    sub_status: body?.sub_status ?? null,
    error: errText,
  };
}

// ------------------------------------------------------------- concurrency pool
async function runLevel(concurrency, count) {
  const samples = [];
  let launched = 0;
  const levelStart = performance.now();
  async function worker() {
    while (launched < count) {
      launched++;
      const s = await fireOne();
      samples.push(s);
      appendFileSync(OUT, JSON.stringify({ level: concurrency, ...s }) + "\n");
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, count) }, worker));
  const wallSec = (performance.now() - levelStart) / 1000;
  return { samples, wallSec, throughput: count / wallSec };
}

// ------------------------------------------------------------- stats helpers
function pct(sorted, p) {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}
function summarize(nums) {
  const s = nums.filter((n) => n != null).sort((a, b) => a - b);
  if (!s.length) return { n: 0, p50: null, p90: null, p95: null, p99: null, max: null };
  return { n: s.length, p50: pct(s, 50), p90: pct(s, 90), p95: pct(s, 95), p99: pct(s, 99), max: s[s.length - 1] };
}
function tally(items) {
  const m = {};
  for (const it of items) if (it != null) m[it] = (m[it] || 0) + 1;
  return m;
}

function reportLevel(level, r) {
  const ok = r.samples.filter((s) => s.http_status === 200);
  const throttled = r.samples.filter((s) => s.http_status === 429).length;
  const denied = r.samples.filter((s) => [402, 403].includes(s.http_status)).length;
  const errored = r.samples.filter((s) => s.http_status === 0 || s.http_status >= 500 || s.error).length;
  const cacheHits = ok.filter((s) => s.cached === true).length;

  const client = summarize(r.samples.map((s) => s.client_ms));
  const verify = summarize(ok.map((s) => s.verify_ms));
  const persist = summarize(ok.map((s) => s.persist_ms));

  console.log(`\n\x1b[1m── concurrency ${level} \x1b[0m(${r.samples.length} reqs, ${r.wallSec.toFixed(1)}s, ${r.throughput.toFixed(1)} req/s)`);
  console.log(`   outcome   200=${ok.length}  429=${throttled}  402/403=${denied}  err/5xx=${errored}   cache-hit=${cacheHits}/${ok.length}`);
  const row = (label, x) => x.n ? `   ${label.padEnd(9)} p50=${String(x.p50).padStart(5)}  p90=${String(x.p90).padStart(5)}  p95=${String(x.p95).padStart(5)}  p99=${String(x.p99).padStart(5)}  max=${String(x.max).padStart(6)}  (ms)` : `   ${label.padEnd(9)} —`;
  console.log(row("client", client));
  console.log(row("verify", verify));
  console.log(row("persist", persist));
  const subs = tally(ok.map((s) => s.sub_status));
  const vstat = tally(ok.map((s) => s.verification_status));
  if (Object.keys(vstat).length) console.log(`   status    ${JSON.stringify(vstat)}`);
  if (Object.keys(subs).length) console.log(`   sub_status ${JSON.stringify(subs)}`);
  return {
    level, requests: r.samples.length, throughput_rps: +r.throughput.toFixed(2),
    ok: ok.length, throttled, denied, errored, cache_hits: cacheHits,
    client_ms: client, verify_ms: verify, persist_ms: persist,
    verification_status: vstat, sub_status: subs,
  };
}

// ------------------------------------------------------------- confirmation
async function confirm(prompt) {
  if (YES) return true;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ans = await new Promise((res) => rl.question(prompt, res));
  rl.close();
  return /^y(es)?$/i.test(ans.trim());
}

// ------------------------------------------------------------------ main
async function main() {
  const host = new URL(REQ_URL).host;
  console.log(`\x1b[1mScrubiMail /validate load harness\x1b[0m`);
  console.log(`  target       ${REQ_URL}`);
  console.log(`  host         ${host}`);
  console.log(`  auth         ${API_KEYS.length ? `${API_KEYS.length} API keys (round-robin)` : API_KEY ? "X-API-Key" : "JWT Bearer"}`);
  console.log(`  mode         ${MODE}${MODE === "deep" ? "  (waits on egress SMTP; spends 1 credit/req)" : "  (syntax/DNS only)"}`);
  console.log(`  email-mode   ${EMAIL_MODE}  domains=[${DOMAINS.join(", ")}]`);
  console.log(`  levels       ${LEVELS.join(", ")}   per-level=${PER_LEVEL}`);
  console.log(`  out          ${OUT}`);
  writeFileSync(OUT, ""); // truncate/create

  // Preflight: one request, full dump.
  console.log(`\n\x1b[1mPreflight\x1b[0m — single request to confirm auth / plan / egress …`);
  const pf = await fireOne();
  console.log(`  http ${pf.http_status}  client_ms=${pf.client_ms}  verify_ms=${pf.verify_ms}  persist_ms=${pf.persist_ms}  cached=${pf.cached}`);
  console.log(`  verification_status=${pf.verification_status}  sub_status=${pf.sub_status}  resp_mode=${pf.resp_mode}`);
  if (pf.error) console.log(`  \x1b[31merror:\x1b[0m ${pf.error}`);
  if (pf.http_status === 429) console.log(`  \x1b[33m⚠ 429 on the very first request — the plan's max_api_calls_per_hour is throttling.\n     Put the test account on an Enterprise/unlimited tier (>=10000/hr) before ramping.\x1b[0m`);
  if (pf.http_status === 200 && MODE === "deep" && pf.verify_ms != null && pf.verify_ms < 50 && pf.cached === false)
    console.log(`  \x1b[33m⚠ deep verify returned in <50ms uncached — likely terminal-local (invalid/disposable), not a real SMTP probe.\x1b[0m`);

  if (PREFLIGHT_ONLY) { console.log(`\n(preflight-only) done. Raw sample in ${OUT}`); return; }
  if (pf.http_status !== 200 && !FORCE) die(`Preflight was not 200 (got ${pf.http_status}). Fix auth/plan, or pass --force to ramp anyway.`);

  const est = Math.min(MAX_TOTAL, plannedTotal);
  const creditNote = MODE === "deep" ? ` This will spend up to ~${est} credits.` : "";
  const smtpNote = MODE === "deep" && EMAIL_MODE !== "fixed" ? ` And fire ~${est} real SMTP probes from the egress box.` : "";
  const okGo = await confirm(`\nRamp ${LEVELS.join("/")} × ${PER_LEVEL} = up to ${est} requests against ${host}.${creditNote}${smtpNote}\nProceed? [y/N] `);
  if (!okGo) { console.log("Aborted."); return; }

  const results = [];
  let done = 0;
  for (const level of LEVELS) {
    if (done >= MAX_TOTAL) { console.log(`\nReached --max-total ${MAX_TOTAL}; stopping.`); break; }
    const count = Math.min(PER_LEVEL, MAX_TOTAL - done);
    const r = await runLevel(level, count);
    done += r.samples.length;
    results.push(reportLevel(level, r));
    if (level !== LEVELS[LEVELS.length - 1]) await sleep(GAP_MS);
  }

  // ---- final comparison table: does persist_ms / verify_ms climb with concurrency?
  console.log(`\n\x1b[1m═══ summary — p95 (ms) vs concurrency ═══\x1b[0m`);
  console.log(`  ${"conc".padStart(5)} ${"rps".padStart(7)} ${"ok".padStart(5)} ${"429".padStart(5)} ${"err".padStart(5)} ${"client".padStart(8)} ${"verify".padStart(8)} ${"persist".padStart(8)}`);
  for (const r of results)
    console.log(`  ${String(r.level).padStart(5)} ${String(r.throughput_rps).padStart(7)} ${String(r.ok).padStart(5)} ${String(r.throttled).padStart(5)} ${String(r.errored).padStart(5)} ${String(r.client_ms.p95 ?? "—").padStart(8)} ${String(r.verify_ms.p95 ?? "—").padStart(8)} ${String(r.persist_ms.p95 ?? "—").padStart(8)}`);

  const summaryFile = OUT.replace(/\.jsonl$/, "") + ".summary.json";
  writeFileSync(summaryFile, JSON.stringify({ endpoint: REQ_URL, mode: MODE, email_mode: EMAIL_MODE, levels: LEVELS, per_level: PER_LEVEL, results }, null, 2));
  console.log(`\nRaw samples: ${OUT}\nSummary:     ${summaryFile}`);
  console.log(`\nRead: if persist_ms p95 climbs with concurrency → on-path DB contention (credit decrement row-lock / connection pool).`);
  console.log(`      if verify_ms p95 pins near the realtime budget and sub_status shifts to smtp_unavailable → egress saturation, not DB.`);
}

main().catch((e) => die(e.stack || String(e)));
