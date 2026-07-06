/* ScrubiMail Homepage — part 2: Features grid, How it works, Developer section */
(function () {
const { useState: useState2 } = React;
const { Reveal, Eyebrow } = window;
const H2 = window.SM_H;
const {
  ShieldCheck, Server, Database, Globe, Ban, UserCog, Network, Gauge, Zap, Clock,
  Code2, Copy, Check, ArrowRight, Upload, BarChart3, Search, KeyRound, Repeat,
} = window.SM.icons;

/* ----------------------------- stats band ----------------------------- */
function StatsBand() {
  const stats = [
    { v: "~30ms", l: "Typical response", s: "Sub-millisecond on cache hits" },
    { v: "8", l: "Checks per validation", s: "Syntax → MX → SMTP → risk score" },
    { v: "0–100", l: "Composite risk score", s: "Clear Valid / Risky / Invalid verdict" },
    { v: "REST", l: "API + bulk pipeline", s: "Single, CSV & NDJSON" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 dark:border-white/10 dark:bg-white/10 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.l} delay={i * 70} className="bg-white px-6 py-7 dark:bg-[#0b1014]/95">
            <div className="font-['Epilogue'] text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">{s.v}</div>
            <div className="mt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{s.l}</div>
            <div className="mt-0.5 text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">{s.s}</div>
          </Reveal>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] text-zinc-400">Response times reflect typical API performance; figures are representative, not a guarantee.</p>
    </section>
  );
}

/* ----------------------------- features ----------------------------- */
function Features() {
  const items = [
    { Icon: Check, title: "Syntax & IDN", benefit: "Catch typos and malformed addresses instantly.", tech: "RFC 5322 / 6531 with IDN & punycode normalization." },
    { Icon: Globe, title: "DNS & MX", benefit: "Confirm the domain can actually receive mail.", tech: "Live MX / A-record lookups with DNS caching." },
    { Icon: Server, title: "SMTP probe", benefit: "Verify the mailbox exists before you send.", tech: "Real-time SMTP handshake, no message delivered." },
    { Icon: Ban, title: "Disposable detection", benefit: "Block throwaway and temp-mail signups.", tech: "Continuously updated disposable-domain blocklist." },
    { Icon: UserCog, title: "Role accounts", benefit: "Flag shared inboxes like info@ and admin@.", tech: "Role-address classification on the local part." },
    { Icon: Network, title: "Catch-all detection", benefit: "Know when a domain accepts everything.", tech: "Heuristic catch-all probing per domain." },
    { Icon: ShieldCheck, title: "Spam-trap heuristics", benefit: "Avoid the addresses that wreck reputation.", tech: "Pattern & signal-based spam-trap scoring." },
    { Icon: Gauge, title: "Risk score & verdict", benefit: "One number your team can act on.", tech: "Composite 0–100 score → Valid / Risky / Invalid." },
  ];
  return (
    <section id="features" className="bg-zinc-50/70 py-20 dark:bg-white/[0.015] sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <Eyebrow>Every check, one call</Eyebrow>
          <h2 className={H2 + " mt-3 text-3xl sm:text-[2.6rem]"}>A complete verdict on every address</h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">Eight signals run on every validation — from RFC syntax to a live mailbox probe — and collapse into a single, actionable score.</p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={(i % 4) * 70}>
              <div className="group h-full rounded-2xl border border-zinc-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-900/5 dark:border-white/10 dark:bg-[#0e141a]/95 dark:hover:border-[#6effc0]/30">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/10 transition group-hover:bg-emerald-600 group-hover:text-white dark:bg-[#6effc0]/10 dark:text-[#6effc0] dark:ring-[#6effc0]/15 dark:group-hover:bg-[#6effc0] dark:group-hover:text-[#003824]">
                  <it.Icon size={21} />
                </div>
                <h3 className="mt-4 font-['Epilogue'] text-lg font-bold tracking-tight text-zinc-900 dark:text-white">{it.title}</h3>
                <p className="mt-1.5 text-[15px] leading-snug text-zinc-700 dark:text-zinc-300">{it.benefit}</p>
                <p className="mt-2 font-['JetBrains_Mono'] text-[11.5px] leading-relaxed text-zinc-400 dark:text-zinc-500">{it.tech}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- how it works ----------------------------- */
function HowItWorks() {
  const steps = [
    { n: "01", Icon: Upload, title: "Ingest", body: "Send a single address via API, or upload a CSV / NDJSON list for bulk processing." },
    { n: "02", Icon: Search, title: "Validate", body: "Syntax, DNS/MX, SMTP probe, disposable, role and catch-all checks run in parallel." },
    { n: "03", Icon: Gauge, title: "Score", body: "Signals combine into a 0–100 risk score with a clear Valid / Risky / Invalid verdict." },
    { n: "04", Icon: BarChart3, title: "Act", body: "Export the clean list, gate signups in real time, and watch deliverability in analytics." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <Reveal className="max-w-2xl">
        <Eyebrow>How it works</Eyebrow>
        <h2 className={H2 + " mt-3 text-3xl sm:text-[2.6rem]"}>From raw list to clean inbox in four steps</h2>
      </Reveal>
      <div className="relative mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div aria-hidden="true" className="absolute left-0 right-0 top-[34px] hidden h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent dark:via-[#6effc0]/30 lg:block" />
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 80} className="relative">
            <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-[#0e141a]/95">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-[#6effc0]/95 dark:text-[#003824]"><s.Icon size={20} /></div>
                <span className="font-['JetBrains_Mono'] text-sm font-medium text-zinc-300 dark:text-zinc-600">{s.n}</span>
              </div>
              <h3 className="mt-5 font-['Epilogue'] text-xl font-bold tracking-tight text-zinc-900 dark:text-white">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------- developer section ----------------------------- */
const REQ_LINES = [
  [["k", "curl"], ["p", " -X POST https://api.scrubimail.com/v1/validate "], ["c", "\\"]],
  [["p", "  -H "], ["s", '"Authorization: Bearer sk_live_••••"'], ["p", " "], ["c", "\\"]],
  [["p", "  -H "], ["s", '"Content-Type: application/json"'], ["p", " "], ["c", "\\"]],
  [["p", "  -d "], ["s", '\'{ "email": "ada@stripe.com" }\'']],
];
const RES_LINES = [
  [["pn", "{"]],
  [["pn", "  "], ["key", '"email"'], ["pn", ": "], ["s", '"ada@stripe.com"'], ["pn", ","]],
  [["pn", "  "], ["key", '"verdict"'], ["pn", ": "], ["s", '"valid"'], ["pn", ","]],
  [["pn", "  "], ["key", '"score"'], ["pn", ": "], ["num", "96"], ["pn", ","]],
  [["pn", "  "], ["key", '"checks"'], ["pn", ": {"]],
  [["pn", "    "], ["key", '"syntax"'], ["pn", ": "], ["bool", "true"], ["pn", ","]],
  [["pn", "    "], ["key", '"mx"'], ["pn", ": "], ["bool", "true"], ["pn", ","]],
  [["pn", "    "], ["key", '"smtp"'], ["pn", ": "], ["bool", "true"], ["pn", ","]],
  [["pn", "    "], ["key", '"disposable"'], ["pn", ": "], ["bool", "false"], ["pn", ","]],
  [["pn", "    "], ["key", '"role"'], ["pn", ": "], ["bool", "false"], ["pn", ","]],
  [["pn", "    "], ["key", '"catch_all"'], ["pn", ": "], ["bool", "false"]],
  [["pn", "  },"]],
  [["pn", "  "], ["key", '"duration_ms"'], ["pn", ": "], ["num", "28"]],
  [["pn", "}"]],
];
const TOK = {
  k: "text-violet-500 dark:text-violet-300", p: "text-zinc-500 dark:text-zinc-400", c: "text-zinc-400 dark:text-zinc-600",
  s: "text-emerald-600 dark:text-[#6effc0]", pn: "text-zinc-400 dark:text-zinc-500", key: "text-sky-600 dark:text-sky-300",
  num: "text-amber-600 dark:text-amber-300", bool: "text-violet-500 dark:text-violet-300",
};
function CodeBlock({ title, lines, raw }) {
  const [copied, setCopied] = useState2(false);
  const copy = () => {
    try { navigator.clipboard.writeText(raw); } catch (e) { /* noop */ }
    setCopied(true); window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0b0f14] shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-zinc-600" /><span className="h-2.5 w-2.5 rounded-full bg-zinc-600" /><span className="h-2.5 w-2.5 rounded-full bg-zinc-600" /></span>
          <span className="ml-2 font-['Space_Grotesk'] text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">{title}</span>
        </div>
        <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white" aria-label="Copy to clipboard">
          {copied ? <Check size={13} className="text-[#6effc0]" /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-['JetBrains_Mono'] text-[12.5px] leading-relaxed">
        <code>
          {lines.map((ln, i) => (
            <div key={i} className="flex">
              <span className="mr-4 w-5 shrink-0 select-none text-right text-zinc-700">{i + 1}</span>
              <span className="whitespace-pre">{ln.map(([t, txt], j) => <span key={j} className={TOK[t]}>{txt}</span>)}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
function Developer() {
  const reqRaw = 'curl -X POST https://api.scrubimail.com/v1/validate \\\n  -H "Authorization: Bearer sk_live_••••" \\\n  -H "Content-Type: application/json" \\\n  -d \'{ "email": "ada@stripe.com" }\'';
  const resRaw = '{\n  "email": "ada@stripe.com",\n  "verdict": "valid",\n  "score": 96,\n  "checks": { "syntax": true, "mx": true, "smtp": true, "disposable": false, "role": false, "catch_all": false },\n  "duration_ms": 28\n}';
  return (
    <section id="developers" className="relative overflow-hidden bg-[#0a0e12] py-20 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute right-[-10%] top-0 h-[360px] w-[600px] rounded-full bg-[#6effc0]/10 blur-[120px]" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
        <Reveal>
          <Eyebrow>Developer-first</Eyebrow>
          <h2 className="mt-3 font-['Epilogue'] text-3xl font-extrabold tracking-tight text-white sm:text-[2.6rem]">One request. A complete verdict.</h2>
          <p className="mt-4 text-lg leading-relaxed text-zinc-400">A single REST call returns every signal and a composite score — typically in about 30&nbsp;milliseconds. Authenticate with an API key, validate one address or stream millions.</p>
          <ul className="mt-6 space-y-3">
            {[[Zap, "Real-time", "~30ms typical, sub-ms on cache hits"], [KeyRound, "API keys & usage analytics", "Rotate keys, track usage per project"], [Repeat, "Single, CSV & NDJSON", "Same endpoint, single or bulk"]].map(([Ic, t, d], i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6effc0]/10 text-[#6effc0]"><Ic size={16} /></span>
                <span><span className="font-semibold text-white">{t}.</span> <span className="text-zinc-400">{d}</span></span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/api-docs" className="inline-flex items-center gap-2 rounded-xl bg-[#6effc0] px-5 py-2.5 text-sm font-semibold text-[#003824] transition hover:bg-[#47ffb8]">Read the docs <ArrowRight size={16} /></a>
            <a href="/apikeys" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">Get an API key</a>
          </div>
        </Reveal>
        <Reveal delay={120} className="space-y-4">
          <CodeBlock title="Request" lines={REQ_LINES} raw={reqRaw} />
          <CodeBlock title="200 OK · application/json" lines={RES_LINES} raw={resRaw} />
        </Reveal>
      </div>
    </section>
  );
}

window.StatsBand = StatsBand;
window.Features = Features;
window.HowItWorks = HowItWorks;
window.Developer = Developer;
})();
