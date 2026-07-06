/* ScrubiMail — marketing Homepage (PREVIEW build)
   This JSX is the design source of truth; it is ported near-verbatim into
   src/pages/Homepage.tsx (imports swap in for the window.SM harness). */
(function () {
const { useState, useEffect, useRef, useMemo } = React;
const { Link, TopBar } = window.SM;
const {
  Mail, ArrowRight, Check, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap,
  Clock, Server, Database, Globe, Code2, Copy, Upload, BarChart3, KeyRound, Lock,
  Repeat, Star, Sparkles, FileSpreadsheet, Ban, UserCog, Network, Gauge, Quote,
  ShieldHalf, Fingerprint, Search, Loader2,
} = window.SM.icons;

/* ============================== shared bits ============================== */

function Styles() {
  return (
    <style>{`
      .reveal{opacity:0;transform:translateY(18px);transition:transform .7s cubic-bezier(.22,1,.36,1)}
      .reveal.in-view{opacity:1;transform:none}
      @keyframes sm-floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
      .sm-float{animation:sm-floaty 6s ease-in-out infinite}
      @keyframes sm-spin{to{transform:rotate(360deg)}}
      .sm-spin{animation:sm-spin .8s linear infinite}
      @keyframes sm-pop{0%{transform:translateY(10px)}100%{transform:none}}
      .sm-pop{animation:sm-pop .5s cubic-bezier(.22,1,.36,1) both}
      @keyframes sm-grow{from{stroke-dashoffset:var(--c)}}
      @keyframes sm-ping{75%,100%{transform:scale(2.2);opacity:0}}
      @keyframes sm-caret{50%{opacity:0}}
      @keyframes sm-floaty2{0%,100%{transform:translateY(0)}50%{transform:translateY(-13px)}}
      .sm-float2{animation:sm-floaty2 7s ease-in-out infinite}
      @media (prefers-reduced-motion: reduce){
        .reveal{opacity:1!important;transform:none!important;transition:none!important}
        .sm-float,.sm-float2,.sm-spin,.sm-pop{animation:none!important}
        html{scroll-behavior:auto}
      }
    `}</style>
  );
}

function Reveal({ children, className = "", delay = 0, as: Tag = "div" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reveal = () => el.classList.add("in-view");
    if (typeof IntersectionObserver === "undefined") { reveal(); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { reveal(); io.unobserve(el); } }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    // Reveal immediately if already in the initial viewport (covers above-the-fold).
    const r = el.getBoundingClientRect();
    if (r.top < (window.innerHeight || 800)) requestAnimationFrame(reveal);
    // Safety net for environments where IntersectionObserver never delivers.
    const t = window.setTimeout(reveal, 1400);
    return () => { io.disconnect(); window.clearTimeout(t); };
  }, []);
  return <Tag ref={ref} className={"reveal " + className} style={{ transitionDelay: delay + "ms" }}>{children}</Tag>;
}

function Eyebrow({ children, className = "" }) {
  return (
    <span className={"font-['Space_Grotesk'] text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-[#6effc0] " + className}>
      {children}
    </span>
  );
}

const H = "font-['Epilogue'] font-extrabold tracking-tight text-zinc-900 dark:text-white";

/* ============================== validator logic ============================== */

const DISPOSABLE = ["mailinator.com","tempmail.com","temp-mail.org","guerrillamail.com","10minutemail.com","trashmail.com","yopmail.com","sharklasers.com","getnada.com","throwaway.email","dispostable.com","maildrop.cc","fakeinbox.com"];
const ROLE = ["info","admin","support","sales","contact","hello","billing","noreply","no-reply","team","help","office","marketing","webmaster","postmaster","abuse"];
const FREE = ["gmail.com","yahoo.com","outlook.com","hotmail.com","icloud.com","aol.com","proton.me","protonmail.com","gmx.com","live.com"];

function validateEmail(raw) {
  const email = (raw || "").trim();
  const at = email.lastIndexOf("@");
  const local = at > 0 ? email.slice(0, at) : "";
  const domain = at > 0 ? email.slice(at + 1).toLowerCase() : "";
  const syntaxOk = /^[^\s@"]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && !email.includes("..") && local.length > 0;
  const hasMx = syntaxOk && domain.includes(".") && !/(^|\.)(test|invalid|example|localhost)$/.test(domain);
  const disposable = DISPOSABLE.includes(domain);
  const role = ROLE.includes(local.toLowerCase());
  const free = FREE.includes(domain);
  const h = [...email].reduce((a, c) => ((a * 31) + c.charCodeAt(0)) >>> 0, 7);
  const catchAll = hasMx && !free && h % 5 === 0;
  const smtpOk = syntaxOk && hasMx && !disposable;

  let score = 100;
  if (!syntaxOk) score -= 72;
  if (!hasMx) score -= 28;
  if (disposable) score -= 56;
  if (role) score -= 17;
  if (catchAll) score -= 11;
  if (!smtpOk && syntaxOk && hasMx) score -= 18;
  score = Math.max(3, Math.min(100, score));

  let verdict = "Valid";
  if (!syntaxOk || !hasMx) verdict = "Invalid";
  else if (disposable || score < 55) verdict = "Invalid";
  else if (role || catchAll || score < 80) verdict = "Risky";

  const checks = [
    { key: "syntax", label: "Syntax", note: syntaxOk ? "RFC 5322 / 6531 + IDN" : "Malformed address", status: syntaxOk ? "pass" : "fail" },
    { key: "mx", label: "DNS / MX", note: hasMx ? (domain || "—") : "No mail records", status: hasMx ? "pass" : "fail" },
    { key: "smtp", label: "SMTP mailbox", note: smtpOk ? "Mailbox accepts mail" : syntaxOk && hasMx ? "Could not verify" : "Not reachable", status: smtpOk ? "pass" : syntaxOk && hasMx ? "warn" : "fail" },
    { key: "disposable", label: "Disposable", note: disposable ? "Temp-mail domain" : "Not disposable", status: disposable ? "fail" : "pass" },
    { key: "role", label: "Role account", note: role ? "Shared inbox (info@, admin@)" : "Individual mailbox", status: role ? "warn" : "pass" },
    { key: "catchall", label: "Catch-all", note: catchAll ? "Domain accepts all mail" : "Specific mailbox", status: catchAll ? "warn" : "pass" },
  ];
  return { email, domain, score, verdict, checks, catchAll, free };
}

const VERDICT_STYLE = {
  Valid:   { ring: "#10b981", chip: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-[#6effc0] dark:ring-[#6effc0]/25", Icon: CheckCircle2 },
  Risky:   { ring: "#f59e0b", chip: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25", Icon: AlertTriangle },
  Invalid: { ring: "#ef4444", chip: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25", Icon: XCircle },
};
const STATUS_ICON = {
  pass: { Icon: CheckCircle2, cls: "text-emerald-600 dark:text-[#6effc0]" },
  warn: { Icon: AlertTriangle, cls: "text-amber-500 dark:text-amber-300" },
  fail: { Icon: XCircle, cls: "text-rose-500 dark:text-rose-400" },
};

/* circular score gauge */
function ScoreRing({ score, color }) {
  const r = 34, c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  return (
    <div className="relative h-[88px] w-[88px] shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-zinc-200/70 dark:stroke-white/10" />
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" stroke={color} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} style={{ transition: "stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-['Epilogue'] text-2xl font-extrabold leading-none text-zinc-900 dark:text-white">{score}</span>
        <span className="font-['Space_Grotesk'] text-[8px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Score</span>
      </div>
    </div>
  );
}

function LiveValidator() {
  const samples = ["ada@stripe.com", "info@acme.io", "user@mailinator.com", "jordan@gmail.com"];
  const [value, setValue] = useState(samples[0]);
  const [phase, setPhase] = useState("done"); // typing | loading | done
  const [result, setResult] = useState(() => validateEmail(samples[0]));
  const [auto, setAuto] = useState(true);
  const [playing, setPlaying] = useState(samples[0]);

  const autoRef = useRef(true);
  const timers = useRef([]);
  const idxRef = useRef(1);
  const pushT = (fn, ms) => { const t = window.setTimeout(fn, ms); timers.current.push(t); return t; };
  const clearTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  const stopAuto = () => { if (!autoRef.current) return; autoRef.current = false; setAuto(false); clearTimers(); };

  // Auto-play: type the next sample, validate, pause, repeat — until the user takes over.
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // honor reduced-motion: leave the static first result in place
    const wait = (ms) => new Promise((res) => pushT(res, ms));
    let cancelled = false;
    const guard = () => cancelled || !autoRef.current;

    async function typeEmail(email) {
      setPhase("typing");
      setPlaying(email);
      setValue("");
      for (let i = 1; i <= email.length; i++) {
        if (guard()) return;
        setValue(email.slice(0, i));
        await wait(34 + Math.random() * 46);
      }
    }
    async function loop() {
      await wait(2000); // let the initial populated card breathe
      while (!guard()) {
        const email = samples[idxRef.current % samples.length];
        await typeEmail(email);
        if (guard()) return;
        setPhase("loading");
        await wait(720);
        if (guard()) return;
        setResult(validateEmail(email));
        setPhase("done");
        await wait(2600);
        idxRef.current += 1;
      }
    }
    loop();
    return () => { cancelled = true; clearTimers(); };
  }, []);

  const run = (email) => {
    stopAuto();
    const e = (email ?? value).trim();
    if (!e) return;
    setPhase("loading");
    pushT(() => { setResult(validateEmail(e)); setPhase("done"); }, 720);
  };

  const onSubmit = (ev) => { ev.preventDefault(); run(); };
  const v = result ? VERDICT_STYLE[result.verdict] : VERDICT_STYLE.Valid;
  const typing = phase === "typing";

  return (
    <div className="w-full rounded-2xl border border-zinc-200/80 bg-white/90 p-4 shadow-2xl shadow-emerald-900/5 ring-1 ring-black/[0.02] backdrop-blur dark:border-white/10 dark:bg-[#0e141a]/90 dark:shadow-black/40 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-emerald-600 dark:text-[#6effc0]" />
          <span className="whitespace-nowrap font-['Space_Grotesk'] text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Live validator</span>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
          <span className={"relative flex h-1.5 w-1.5"}>
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70" style={auto ? { animation: "sm-ping 1.4s cubic-bezier(0,0,.2,1) infinite" } : undefined} />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          {auto ? "Auto-cycling" : "~30ms"}
        </span>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Mail size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text" inputMode="email" value={value}
            onChange={(e) => { stopAuto(); setValue(e.target.value); }}
            onFocus={stopAuto}
            aria-label="Email address to validate" placeholder="you@company.com" autoComplete="off" spellCheck={false}
            className="w-full appearance-none rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-8 text-[15px] text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 dark:border-white/15 dark:bg-[#0a0e12]/95 dark:text-white dark:placeholder:text-zinc-500 dark:[color-scheme:dark] dark:focus:border-[#6effc0] dark:focus:ring-[#6effc0]/15"
          />
          {typing && <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-px -translate-y-1/2 bg-emerald-500 dark:bg-[#6effc0]" style={{ animation: "sm-caret 1s steps(1) infinite" }} />}
        </div>
        <button type="submit" disabled={phase === "loading" || typing}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-70 dark:bg-[#6effc0]/95 dark:text-[#003824] dark:hover:bg-[#47ffb8]">
          {phase === "loading" ? <Loader2 size={17} className="sm-spin" /> : <Search size={17} />}
          {phase === "loading" ? "Checking" : "Validate"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {samples.map((s) => {
          const active = auto && playing === s;
          return (
            <button key={s} type="button" onClick={() => { setValue(s); run(s); }}
              className={"rounded-full border px-2.5 py-1 font-['JetBrains_Mono'] text-[11px] transition " + (active
                ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-[#6effc0]/40 dark:bg-[#6effc0]/10 dark:text-[#6effc0]"
                : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-emerald-400 hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:border-[#6effc0]/40 dark:hover:text-[#6effc0]")}>{s}</button>
          );
        })}
      </div>

      {result && (
        <div key={result.email + phase} className={phase === "done" ? "sm-pop mt-4" : "mt-4 opacity-60"}>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center gap-4">
              <ScoreRing score={result.score} color={v.ring} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset " + v.chip}>
                    <v.Icon size={14} /> {result.verdict}
                  </span>
                  {result.free && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-white/5 dark:text-zinc-400">Free provider</span>}
                  {result.catchAll && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-white/5 dark:text-zinc-400">Catch-all</span>}
                </div>
                <p className="mt-1.5 truncate font-['JetBrains_Mono'] text-[13px] text-zinc-500 dark:text-zinc-400">{result.email}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 dark:border-white/10 dark:bg-white/10 sm:grid-cols-2">
              {result.checks.map((ch, i) => {
                const s = STATUS_ICON[ch.status];
                return (
                  <div key={ch.key} className="flex items-center justify-between gap-2 bg-white px-3 py-2 dark:bg-[#0e141a]/95" style={{ animationDelay: 60 + i * 55 + "ms" }}>
                    <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-200">{ch.label}</span>
                    <span className="flex items-center gap-1.5 text-[12px] text-zinc-400">
                      <span className="hidden truncate sm:inline">{ch.note}</span>
                      <s.Icon size={16} className={s.cls} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== hero ============================== */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* layered brand glow + grid */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12%] h-[460px] w-[880px] -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[130px] dark:bg-[#6effc0]/10" />
        <div className="absolute right-[6%] top-[18%] h-[340px] w-[340px] rounded-full bg-teal-300/20 blur-[120px] dark:bg-emerald-500/10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-24 lg:pt-20">
        <div>
          <Reveal>
            <a href="/changelog" className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 py-1 pl-1.5 pr-3 text-xs font-medium text-zinc-600 shadow-sm backdrop-blur transition hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white dark:bg-[#6effc0]/95 dark:text-[#003824]">New</span>
              Spam-trap heuristics + risk scoring
              <ArrowRight size={13} />
            </a>
          </Reveal>
          <Reveal delay={60}>
            <h1 className={H + " mt-5 text-[2.6rem] leading-[1.04] sm:text-6xl"}>
              Clean lists.<br />Protected<br />
              <span className="text-emerald-600 dark:text-[#6effc0]">sender reputation.</span>
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              ScrubiMail verifies email addresses in real time — syntax, DNS/MX, live SMTP probe, disposable and role detection — and returns a clear verdict in about <span className="font-semibold text-zinc-900 dark:text-white">30&nbsp;milliseconds</span>. Stop bounces before they reach the inbox.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/register" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 dark:bg-[#6effc0]/95 dark:text-[#003824] dark:shadow-[#6effc0]/10 dark:hover:bg-[#47ffb8]">
                Start free <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/api-docs" className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3 text-base font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                <Code2 size={18} /> View API docs
              </Link>
            </div>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5"><Check size={15} className="text-emerald-600 dark:text-[#6effc0]" /> 1,000 free validations / month</span>
              <span className="inline-flex items-center gap-1.5"><Check size={15} className="text-emerald-600 dark:text-[#6effc0]" /> No credit card</span>
            </p>
          </Reveal>
        </div>

        <Reveal delay={120} className="relative">
          <div aria-hidden="true" className="absolute -right-5 -top-6 z-10 hidden h-14 w-14 rotate-6 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-lg sm:flex dark:border-white/10 dark:bg-[#0e141a]/95 sm-float">
            <ShieldCheck size={24} className="text-emerald-600 dark:text-[#6effc0]" />
          </div>
          <div aria-hidden="true" className="absolute -left-6 top-1/3 z-10 hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-lg backdrop-blur dark:border-[#6effc0]/25 dark:bg-[#0e141a]/95 dark:text-[#6effc0] lg:flex sm-float2">
            <CheckCircle2 size={14} /> Valid
          </div>
          <div aria-hidden="true" className="absolute -bottom-5 right-8 z-10 hidden items-center gap-1.5 rounded-full border border-rose-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-lg backdrop-blur dark:border-rose-500/25 dark:bg-[#0e141a]/95 dark:text-rose-300 lg:flex sm-float" style={{ animationDelay: "1.5s" }}>
            <Ban size={14} /> Disposable blocked
          </div>
          <LiveValidator />
        </Reveal>
      </div>
    </section>
  );
}

/* ============================== trust strip ============================== */

function TrustStrip() {
  const logos = ["Northwind", "Lumen", "Cascade", "Vela", "Quanta", "Beacon"];
  return (
    <section className="border-y border-zinc-200/70 bg-zinc-50/60 py-8 dark:border-white/[0.06] dark:bg-white/[0.015]">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">Trusted by growth & platform teams who care about deliverability</p>
        <div className="mt-6 grid grid-cols-3 items-center gap-y-6 opacity-70 sm:grid-cols-6">
          {logos.map((l) => (
            <div key={l} className="flex items-center justify-center gap-2 text-zinc-400 dark:text-zinc-500">
              <span className="h-4 w-4 rounded bg-zinc-300 dark:bg-zinc-600" />
              <span className="font-['Epilogue'] text-[15px] font-bold tracking-tight">{l}</span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-[11px] text-zinc-400">Logos shown are illustrative placeholders.</p>
      </div>
    </section>
  );
}

window.Hero = Hero;
window.LiveValidator = LiveValidator;
window.TrustStrip = TrustStrip;
window.Reveal = Reveal;
window.Eyebrow = Eyebrow;
window.Styles = Styles;
window.SM_H = H;
})();
