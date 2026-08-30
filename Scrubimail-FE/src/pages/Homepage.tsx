/**
 * ScrubiMail — marketing Homepage (v2 redesign)
 * Modern, clean SaaS landing page. Keeps the brand DNA (Epilogue display,
 * Inter body, Space Grotesk micro-labels, emerald→mint accent) but drops the
 * terminal/jargon look in favour of generous whitespace and soft depth.
 *
 * Dependencies: NONE added. Uses the existing stack only —
 *   react, react-router-dom (<Link>), lucide-react, Tailwind (class-based dark
 *   mode). All motion is CSS (see <Styles/>), respecting prefers-reduced-motion.
 *
 * Fonts (Epilogue / Inter / Space Grotesk / JetBrains Mono) are expected to be
 * loaded by the app shell, per the design system. Mono is used only in code.
 */
import { useEffect, useRef, useState, type ReactNode, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Mail, ArrowRight, Check, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap,
  Search, Loader2, Code2, Server, Globe, Ban, UserCog, Network, Gauge, Copy, Upload,
  BarChart3, KeyRound, Repeat, Star, Quote, Lock, ShieldHalf, Fingerprint,
  type LucideIcon,
} from "lucide-react";
// Existing top navigation. If your TopBar uses a named export, switch to:
//   import { TopBar } from "../components/TopBar";
import TopBar from "../components/TopBar";
import Logo from "../components/Logo";

/* ============================== shared bits ============================== */

const HEAD = "font-['Epilogue'] font-extrabold tracking-tight text-zinc-900 dark:text-white";
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-[#6effc0] dark:focus-visible:ring-offset-[#0a0e12]";

function Styles() {
  return (
    <style>{`
      .sm-reveal{opacity:0;transform:translateY(18px);transition:transform .7s cubic-bezier(.22,1,.36,1),opacity .7s cubic-bezier(.22,1,.36,1)}
      .sm-reveal.in-view{opacity:1;transform:none}
      @keyframes sm-floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
      .sm-float{animation:sm-floaty 6s ease-in-out infinite}
      @keyframes sm-spin{to{transform:rotate(360deg)}}
      .sm-spin{animation:sm-spin .8s linear infinite}
      @keyframes sm-pop{0%{opacity:0;transform:translateY(10px) scale(.99)}100%{opacity:1;transform:none}}
      .sm-pop{animation:sm-pop .5s cubic-bezier(.22,1,.36,1) both}
      @keyframes sm-ping{75%,100%{transform:scale(2.2);opacity:0}}
      .sm-ping{animation:sm-ping 1.4s cubic-bezier(0,0,.2,1) infinite}
      @keyframes sm-caret{50%{opacity:0}}
      .sm-caret{animation:sm-caret 1s steps(1) infinite}
      @keyframes sm-floaty2{0%,100%{transform:translateY(0)}50%{transform:translateY(-13px)}}
      .sm-float2{animation:sm-floaty2 7s ease-in-out infinite}
      @media (prefers-reduced-motion: reduce){
        .sm-reveal{opacity:1!important;transform:none!important;transition:none!important}
        .sm-float,.sm-float2,.sm-spin,.sm-pop,.sm-ping,.sm-caret{animation:none!important}
      }
    `}</style>
  );
}

interface RevealProps { children: ReactNode; className?: string; delay?: number; }
function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
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
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={"sm-reveal " + className} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={"font-['Space_Grotesk'] text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-[#6effc0] " + className}>
      {children}
    </span>
  );
}

/* ============================== validator logic ============================== */

type Verdict = "Valid" | "Risky" | "Invalid";
type CheckStatus = "pass" | "warn" | "fail";
interface CheckResult { key: string; label: string; note: string; status: CheckStatus; }
interface ValidationResult {
  email: string; domain: string; score: number; verdict: Verdict;
  checks: CheckResult[]; catchAll: boolean; free: boolean;
}

const DISPOSABLE = ["mailinator.com","tempmail.com","temp-mail.org","guerrillamail.com","10minutemail.com","trashmail.com","yopmail.com","sharklasers.com","getnada.com","throwaway.email","dispostable.com","maildrop.cc","fakeinbox.com"];
const ROLE = ["info","admin","support","sales","contact","hello","billing","noreply","no-reply","team","help","office","marketing","webmaster","postmaster","abuse"];
const FREE = ["gmail.com","yahoo.com","outlook.com","hotmail.com","icloud.com","aol.com","proton.me","protonmail.com","gmx.com","live.com"];

/** Mocked client-side validation — deterministic, no backend. */
function validateEmail(raw: string): ValidationResult {
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

  let verdict: Verdict = "Valid";
  if (!syntaxOk || !hasMx) verdict = "Invalid";
  else if (disposable || score < 55) verdict = "Invalid";
  else if (role || catchAll || score < 80) verdict = "Risky";

  const checks: CheckResult[] = [
    { key: "syntax", label: "Syntax", note: syntaxOk ? "RFC 5322 / 6531 + IDN" : "Malformed address", status: syntaxOk ? "pass" : "fail" },
    { key: "mx", label: "DNS / MX", note: hasMx ? (domain || "—") : "No mail records", status: hasMx ? "pass" : "fail" },
    { key: "smtp", label: "SMTP mailbox", note: smtpOk ? "Mailbox accepts mail" : syntaxOk && hasMx ? "Could not verify" : "Not reachable", status: smtpOk ? "pass" : syntaxOk && hasMx ? "warn" : "fail" },
    { key: "disposable", label: "Disposable", note: disposable ? "Temp-mail domain" : "Not disposable", status: disposable ? "fail" : "pass" },
    { key: "role", label: "Role account", note: role ? "Shared inbox (info@, admin@)" : "Individual mailbox", status: role ? "warn" : "pass" },
    { key: "catchall", label: "Catch-all", note: catchAll ? "Domain accepts all mail" : "Specific mailbox", status: catchAll ? "warn" : "pass" },
  ];
  return { email, domain, score, verdict, checks, catchAll, free };
}

const VERDICT_STYLE: Record<Verdict, { ring: string; chip: string; Icon: LucideIcon }> = {
  Valid:   { ring: "#10b981", chip: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-[#6effc0] dark:ring-[#6effc0]/25", Icon: CheckCircle2 },
  Risky:   { ring: "#f59e0b", chip: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25", Icon: AlertTriangle },
  Invalid: { ring: "#ef4444", chip: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25", Icon: XCircle },
};
const STATUS_ICON: Record<CheckStatus, { Icon: LucideIcon; cls: string }> = {
  pass: { Icon: CheckCircle2, cls: "text-emerald-600 dark:text-[#6effc0]" },
  warn: { Icon: AlertTriangle, cls: "text-amber-500 dark:text-amber-300" },
  fail: { Icon: XCircle, cls: "text-rose-500 dark:text-rose-400" },
};

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 34, c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  return (
    <div className="relative h-[88px] w-[88px] shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden="true">
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

type Phase = "typing" | "loading" | "done";
function LiveValidator() {
  // Demo inputs only — the validator below is a deterministic client-side mock
  // (see validateEmail); it never calls the API. Cycled purely for animation.
  const samples = ["amara@tradehut.store", "info@morevans.co.uk", "user@mailinator.com", "jordan@gmail.com"];
  const [value, setValue] = useState(samples[0]);
  const [phase, setPhase] = useState<Phase>("done");
  const [result, setResult] = useState<ValidationResult>(() => validateEmail(samples[0]));
  const [auto, setAuto] = useState(true);
  const [playing, setPlaying] = useState(samples[0]);

  const autoRef = useRef(true);
  const timers = useRef<number[]>([]);
  const idxRef = useRef(1);
  const pushT = (fn: () => void, ms: number) => { const t = window.setTimeout(fn, ms); timers.current.push(t); return t; };
  const clearTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  const stopAuto = () => { if (!autoRef.current) return; autoRef.current = false; setAuto(false); clearTimers(); };

  // Auto-play: type the next sample, validate, pause, repeat — until the user takes over.
  useEffect(() => {
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // honor reduced-motion: leave the static first result in place
    const wait = (ms: number) => new Promise<void>((res) => pushT(res, ms));
    let cancelled = false;
    const guard = () => cancelled || !autoRef.current;

    async function typeEmail(email: string) {
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
    void loop();
    return () => { cancelled = true; clearTimers(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = (email?: string) => {
    stopAuto();
    const e = (email ?? value).trim();
    if (!e) return;
    setPhase("loading");
    pushT(() => { setResult(validateEmail(e)); setPhase("done"); }, 720);
  };
  const onSubmit = (ev: FormEvent) => { ev.preventDefault(); run(); };
  const v = VERDICT_STYLE[result.verdict];
  const typing = phase === "typing";

  return (
    <div className="w-full rounded-2xl border border-zinc-200/80 bg-white/90 p-4 shadow-2xl shadow-emerald-900/5 ring-1 ring-black/[0.02] backdrop-blur dark:border-white/10 dark:bg-[#0e141a]/90 dark:shadow-black/40 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-emerald-600 dark:text-[#6effc0]" />
          <span className="whitespace-nowrap font-['Space_Grotesk'] text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Live validator</span>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
          <span className="relative flex h-1.5 w-1.5">
            {auto && <span className="sm-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70" />}
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
            className="w-full appearance-none rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-8 text-[15px] text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 dark:border-white/15 dark:bg-[#0a0e12] dark:text-white dark:placeholder:text-zinc-500 dark:[color-scheme:dark] dark:focus:border-[#6effc0] dark:focus:ring-[#6effc0]/15"
          />
          {typing && <span aria-hidden="true" className="sm-caret pointer-events-none absolute right-3 top-1/2 h-4 w-px -translate-y-1/2 bg-emerald-500 dark:bg-[#6effc0]" />}
        </div>
        <button type="submit" disabled={phase === "loading" || typing}
          className={"inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-70 dark:bg-[#6effc0] dark:text-[#003824] dark:hover:bg-[#47ffb8] " + FOCUS}>
          {phase === "loading" ? <Loader2 size={17} className="sm-spin" /> : <Search size={17} />}
          {phase === "loading" ? "Checking" : "Validate"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {samples.map((s) => {
          const active = auto && playing === s;
          return (
            <button key={s} type="button" onClick={() => { setValue(s); run(s); }}
              className={"rounded-full border px-2.5 py-1 font-['JetBrains_Mono'] text-[11px] transition " + FOCUS + " " + (active
                ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-[#6effc0]/40 dark:bg-[#6effc0]/10 dark:text-[#6effc0]"
                : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-emerald-400 hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:border-[#6effc0]/40 dark:hover:text-[#6effc0]")}>{s}</button>
          );
        })}
      </div>

      <div key={result.email + phase} className={phase === "done" ? "sm-pop mt-4" : "mt-4 opacity-60"}>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <ScoreRing score={result.score} color={v.ring} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
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
            {result.checks.map((ch) => {
              const s = STATUS_ICON[ch.status];
              return (
                <div key={ch.key} className="flex items-center justify-between gap-2 bg-white px-3 py-2 dark:bg-[#0e141a]">
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
    </div>
  );
}

/* ============================== hero ============================== */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12%] h-[460px] w-[880px] -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[130px] dark:bg-[#6effc0]/10" />
        <div className="absolute right-[6%] top-[18%] h-[340px] w-[340px] rounded-full bg-teal-300/20 blur-[120px] dark:bg-emerald-500/10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-24 lg:pt-20">
        <div>
          <Reveal>
            <Link to="/changelog" className={"inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 py-1 pl-1.5 pr-3 text-xs font-medium text-zinc-600 shadow-sm backdrop-blur transition hover:border-emerald-300 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 " + FOCUS}>
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white dark:bg-[#6effc0] dark:text-[#003824]">New</span>
              Spam-trap heuristics + risk scoring
              <ArrowRight size={13} />
            </Link>
          </Reveal>
          <Reveal delay={60}>
            <h1 className={HEAD + " mt-5 text-[2.6rem] leading-[1.04] sm:text-6xl"}>
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
              <Link to="/register" className={"group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 dark:bg-[#6effc0] dark:text-[#003824] dark:shadow-[#6effc0]/10 dark:hover:bg-[#47ffb8] " + FOCUS}>
                Start free <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/api-docs" className={"inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3 text-base font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 " + FOCUS}>
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
          <div aria-hidden="true" className="absolute -right-5 -top-6 z-10 hidden h-14 w-14 rotate-6 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#0e141a] sm:flex sm-float">
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
  const customers = ["TradeHut Store", "Morevans UK"];
  return (
    <section className="border-y border-zinc-200/70 bg-zinc-50/60 py-8 dark:border-white/[0.06] dark:bg-white/[0.015]">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">Trusted by teams who care about deliverability</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {customers.map((c) => (
            <div key={c} className="flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-300">
              <span className="h-4 w-4 rounded bg-zinc-300 dark:bg-zinc-600" />
              <span className="font-['Epilogue'] text-[15px] font-bold tracking-tight">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================== stats band ============================== */

function StatsBand() {
  const stats = [
    { v: "~300ms", l: "Full verification", s: "Sub-100ms on the fast path & cache hits" },
    { v: "8", l: "Checks per validation", s: "Syntax → MX → SMTP → risk score" },
    { v: "0–100", l: "Composite risk score", s: "Clear Valid / Risky / Invalid verdict" },
    { v: "REST", l: "API + bulk pipeline", s: "Single, CSV & NDJSON" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 dark:border-white/10 dark:bg-white/10 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.l} delay={i * 70} className="bg-white px-6 py-7 dark:bg-[#0b1014]">
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

/* ============================== features ============================== */

function Features() {
  const items: { Icon: LucideIcon; title: string; benefit: string; tech: string }[] = [
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
          <h2 className={HEAD + " mt-3 text-3xl sm:text-[2.6rem]"}>A complete verdict on every address</h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">Eight signals run on every validation — from RFC syntax to a live mailbox probe — and collapse into a single, actionable score.</p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={(i % 4) * 70}>
              <div className="group h-full rounded-2xl border border-zinc-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-900/5 dark:border-white/10 dark:bg-[#0e141a] dark:hover:border-[#6effc0]/30">
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

/* ============================== how it works ============================== */

function HowItWorks() {
  const steps: { n: string; Icon: LucideIcon; title: string; body: string }[] = [
    { n: "01", Icon: Upload, title: "Ingest", body: "Send a single address via API, or upload a CSV / NDJSON list for bulk processing." },
    { n: "02", Icon: Search, title: "Validate", body: "Syntax, DNS/MX, SMTP probe, disposable, role and catch-all checks run in parallel." },
    { n: "03", Icon: Gauge, title: "Score", body: "Signals combine into a 0–100 risk score with a clear Valid / Risky / Invalid verdict." },
    { n: "04", Icon: BarChart3, title: "Act", body: "Export the clean list, gate signups in real time, and watch deliverability in analytics." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <Reveal className="max-w-2xl">
        <Eyebrow>How it works</Eyebrow>
        <h2 className={HEAD + " mt-3 text-3xl sm:text-[2.6rem]"}>From raw list to clean inbox in four steps</h2>
      </Reveal>
      <div className="relative mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div aria-hidden="true" className="absolute left-0 right-0 top-[34px] hidden h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent dark:via-[#6effc0]/30 lg:block" />
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 80} className="relative">
            <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-[#0e141a]">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-[#6effc0] dark:text-[#003824]"><s.Icon size={20} /></div>
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

/* ============================== developer ============================== */

type Tok = "k" | "p" | "c" | "s" | "pn" | "key" | "num" | "bool";
type Seg = [Tok, string];
type CodeLine = Seg[];

const REQ_LINES: CodeLine[] = [
  [["k", "curl"], ["p", " -X POST https://api.scrubimail.com/v1/validate "], ["c", "\\"]],
  [["p", "  -H "], ["s", '"Authorization: Bearer sk_live_••••"'], ["p", " "], ["c", "\\"]],
  [["p", "  -H "], ["s", '"Content-Type: application/json"'], ["p", " "], ["c", "\\"]],
  [["p", "  -d "], ["s", '\'{ "email": "ada@stripe.com" }\'']],
];
const RES_LINES: CodeLine[] = [
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
const TOK: Record<Tok, string> = {
  k: "text-violet-500 dark:text-violet-300", p: "text-zinc-500 dark:text-zinc-400", c: "text-zinc-400 dark:text-zinc-600",
  s: "text-emerald-600 dark:text-[#6effc0]", pn: "text-zinc-400 dark:text-zinc-500", key: "text-sky-600 dark:text-sky-300",
  num: "text-amber-600 dark:text-amber-300", bool: "text-violet-500 dark:text-violet-300",
};

function CodeBlock({ title, lines, raw }: { title: string; lines: CodeLine[]; raw: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    try { void navigator.clipboard?.writeText(raw); } catch { /* clipboard unavailable */ }
    setCopied(true); window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0b0f14] shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-zinc-600" /><span className="h-2.5 w-2.5 rounded-full bg-zinc-600" /><span className="h-2.5 w-2.5 rounded-full bg-zinc-600" /></span>
          <span className="ml-2 font-['Space_Grotesk'] text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">{title}</span>
        </div>
        <button onClick={copy} className={"inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white " + FOCUS} aria-label="Copy code to clipboard">
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
  const points: [LucideIcon, string, string][] = [
    [Zap, "Real-time", "~30ms typical, sub-ms on cache hits"],
    [KeyRound, "API keys & usage analytics", "Rotate keys, track usage per project"],
    [Repeat, "Single, CSV & NDJSON", "Same endpoint, single or bulk"],
  ];
  return (
    <section id="developers" className="relative overflow-hidden bg-[#0a0e12] py-20 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute right-[-10%] top-0 h-[360px] w-[600px] rounded-full bg-[#6effc0]/10 blur-[120px]" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
        <Reveal>
          <Eyebrow>Developer-first</Eyebrow>
          <h2 className="mt-3 font-['Epilogue'] text-3xl font-extrabold tracking-tight text-white sm:text-[2.6rem]">One request. A complete verdict.</h2>
          <p className="mt-4 text-lg leading-relaxed text-zinc-400">A single REST call returns every signal and a composite score — typically in a few hundred&nbsp;milliseconds. Authenticate with an API key, validate one address or a bulk list.</p>
          <ul className="mt-6 space-y-3">
            {points.map(([Ic, t, d]) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6effc0]/10 text-[#6effc0]"><Ic size={16} /></span>
                <span><span className="font-semibold text-white">{t}.</span> <span className="text-zinc-400">{d}</span></span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/api-docs" className={"inline-flex items-center gap-2 rounded-xl bg-[#6effc0] px-5 py-2.5 text-sm font-semibold text-[#003824] transition hover:bg-[#47ffb8] " + FOCUS}>Read the docs <ArrowRight size={16} /></Link>
            <Link to="/apikeys" className={"inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 " + FOCUS}>Get an API key</Link>
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

/* ============================== pricing ============================== */

interface Tier {
  name: string; priceM: number | null; priceA: number | null; blurb: string;
  quota: string; cta: string; to: string; recommended?: boolean; features: string[];
}
const TIERS: Tier[] = [
  { name: "Free", priceM: 0, priceA: 0, blurb: "Kick the tires on real validations.", quota: "1,000 validations / mo", cta: "Start free", to: "/register",
    features: ["Single + bulk validation", "Full check suite & risk score", "REST API + 1 API key", "Community support"] },
  { name: "Pro", priceM: 49, priceA: 39, blurb: "For growing apps that send daily.", quota: "50,000 validations / mo", cta: "Start free trial", to: "/register", recommended: true,
    features: ["Everything in Free", "CSV / NDJSON bulk pipeline", "Usage analytics dashboard", "5 API keys", "Email support"] },
  { name: "Business", priceM: 199, priceA: 159, blurb: "Scale list hygiene across teams.", quota: "500,000 validations / mo", cta: "Start free trial", to: "/register",
    features: ["Everything in Pro", "Priority validation queue", "Team members & roles", "Unlimited API keys", "Priority support"] },
  { name: "Enterprise", priceM: null, priceA: null, blurb: "Volume pricing with an SLA.", quota: "Custom volume + SLA", cta: "Contact sales", to: "mailto:sales@scrubimail.com",
    features: ["Everything in Business", "Volume discounts", "Uptime & support SLA", "SSO & security review", "Dedicated manager"] },
];

function Pricing() {
  const [annual, setAnnual] = useState(true);
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Eyebrow>Pricing</Eyebrow>
        <h2 className={HEAD + " mt-3 text-3xl sm:text-[2.6rem]"}>Simple plans that scale with you</h2>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">Start free, upgrade when you grow. Every plan includes the full check suite.</p>
      </Reveal>

      <div className="mt-8 flex items-center justify-center gap-3">
        <span className={"text-sm font-medium " + (!annual ? "text-zinc-900 dark:text-white" : "text-zinc-400")}>Monthly</span>
        <button role="switch" aria-checked={annual} aria-label="Toggle annual billing" onClick={() => setAnnual((a) => !a)}
          className={"relative h-7 w-12 rounded-full transition-colors " + FOCUS + " " + (annual ? "bg-emerald-600 dark:bg-[#6effc0]" : "bg-zinc-300 dark:bg-white/15")}>
          <span className={"absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all dark:bg-[#03150e] " + (annual ? "left-6" : "left-1")} />
        </button>
        <span className={"text-sm font-medium " + (annual ? "text-zinc-900 dark:text-white" : "text-zinc-400")}>Annual</span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-[#6effc0]/10 dark:text-[#6effc0] dark:ring-[#6effc0]/25">Save ~20%</span>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t) => {
          const price = annual ? t.priceA : t.priceM;
          const rec = t.recommended;
          return (
            <Reveal key={t.name}>
              <div className={"relative flex h-full flex-col rounded-2xl border p-6 transition " +
                (rec ? "border-emerald-500/60 bg-white shadow-2xl shadow-emerald-900/10 dark:border-[#6effc0]/40 dark:bg-[#0e141a] dark:shadow-[#6effc0]/5 lg:-mt-2 lg:mb-2"
                     : "border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0b1014]")}>
                {rec && <span className="absolute -top-3 left-6 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white dark:bg-[#6effc0] dark:text-[#003824]">Recommended</span>}
                <h3 className="font-['Epilogue'] text-lg font-bold tracking-tight text-zinc-900 dark:text-white">{t.name}</h3>
                <p className="mt-1 text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">{t.blurb}</p>
                <div className="mt-5 flex items-end gap-1">
                  {price === null ? (
                    <span className="font-['Epilogue'] text-3xl font-extrabold text-zinc-900 dark:text-white">Custom</span>
                  ) : (
                    <>
                      <span className="font-['Epilogue'] text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">${price}</span>
                      <span className="mb-1 text-sm text-zinc-400">/mo{annual && price > 0 ? ", billed yearly" : ""}</span>
                    </>
                  )}
                </div>
                <p className="mt-2 font-['JetBrains_Mono'] text-[12px] text-emerald-700 dark:text-[#6effc0]">{t.quota}</p>
                <Link to={t.to} className={"mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition " + FOCUS + " " +
                  (rec ? "bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-[#6effc0] dark:text-[#003824] dark:hover:bg-[#47ffb8]"
                       : "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10")}>
                  {t.cta}
                </Link>
                <ul className="mt-6 space-y-2.5 border-t border-zinc-100 pt-5 dark:border-white/[0.06]">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13.5px] text-zinc-600 dark:text-zinc-300">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-[#6effc0]" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ============================== testimonials ============================== */

function Testimonials() {
  const cards = [
    { quote: "We cut hard bounces by a third in the first week. Our domain reputation recovered and campaign open rates followed.", name: "Maya Okonkwo", role: "Lifecycle Marketing, illustrative" },
    { quote: "Dropped it in front of signup in an afternoon. The SMTP probe catches mistyped addresses our regex never could.", name: "Daniel Reyes", role: "Staff Engineer, illustrative" },
    { quote: "The single risk score is what sold the team — no more arguing about which checks matter. One number, clear action.", name: "Priya Nair", role: "Head of Growth, illustrative" },
  ];
  return (
    <section className="bg-zinc-50/70 py-20 dark:bg-white/[0.015] sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <Eyebrow>Social proof</Eyebrow>
          <h2 className={HEAD + " mt-3 text-3xl sm:text-[2.6rem]"}>Teams ship with confidence</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.name} delay={i * 80}>
              <figure className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-[#0e141a]">
                <Quote size={26} className="text-emerald-300 dark:text-[#6effc0]/40" />
                <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-200">{c.quote}</blockquote>
                <div className="mt-1 flex gap-0.5 text-amber-400" aria-hidden="true">{[0,1,2,3,4].map((s) => <Star key={s} size={14} />)}</div>
                <figcaption className="mt-4 flex items-center gap-3 border-t border-zinc-100 pt-4 dark:border-white/[0.06]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 font-['Epilogue'] text-sm font-bold text-emerald-700 dark:bg-[#6effc0]/15 dark:text-[#6effc0]">{c.name.split(" ").map((w) => w[0]).join("")}</span>
                  <span><span className="block text-sm font-semibold text-zinc-900 dark:text-white">{c.name}</span><span className="block text-[12px] text-zinc-400">{c.role}</span></span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="mt-5 text-[11px] text-zinc-400">Testimonials are illustrative placeholders pending customer approval.</p>
      </div>
    </section>
  );
}

/* ============================== security ============================== */

function Security() {
  const items: { Icon: LucideIcon; title: string; body: string }[] = [
    { Icon: Lock, title: "Encrypted in transit", body: "All API traffic is served over TLS 1.2+. Keys are scoped and revocable." },
    { Icon: ShieldHalf, title: "Minimal data handling", body: "We validate addresses, not inboxes — no message contents are ever read or stored." },
    { Icon: Fingerprint, title: "Access controls", body: "Per-project API keys with usage tracking and instant rotation." },
    { Icon: Server, title: "Resilient infrastructure", body: "Caching and graceful degradation keep validation fast under load." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 dark:border-white/10 dark:bg-[#0b1014] sm:p-10">
        <Reveal className="max-w-2xl">
          <Eyebrow>Security & compliance</Eyebrow>
          <h2 className={HEAD + " mt-3 text-2xl sm:text-3xl"}>Built to protect your data and your reputation</h2>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 70} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/10 dark:bg-[#6effc0]/10 dark:text-[#6effc0] dark:ring-[#6effc0]/15"><it.Icon size={19} /></span>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{it.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{it.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================== final CTA ============================== */

function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-zinc-900 px-6 py-14 text-center dark:bg-gradient-to-b dark:from-[#0e1a16] dark:to-[#0a0e12] sm:px-10 sm:py-20">
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-64 w-[640px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[110px] dark:bg-[#6effc0]/15" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-['Epilogue'] text-3xl font-extrabold tracking-tight text-white sm:text-5xl">Send to real people, not bounces.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-300">Start with 1,000 free validations a month. No credit card, no setup — just cleaner lists and a healthier sender reputation.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register" className={"inline-flex items-center justify-center gap-2 rounded-xl bg-[#6effc0] px-6 py-3 text-base font-semibold text-[#003824] transition hover:bg-[#47ffb8] " + FOCUS + " focus-visible:ring-offset-zinc-900"}>Start free <ArrowRight size={18} /></Link>
              <Link to="/api-docs" className={"inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10 " + FOCUS + " focus-visible:ring-offset-zinc-900"}>View API docs</Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ============================== footer ============================== */

const FOOT: Record<string, [string, string][]> = {
  Product: [["Validate", "/validate"], ["Bulk upload", "/bulk-upload"], ["Analytics", "/analytics"], ["API keys", "/apikeys"], ["Pricing", "/pricing"], ["Integrations", "/integrations"]],
  Company: [["About", "/about"], ["Contact", "/contact"], ["Changelog", "/changelog"]],
  Resources: [["API docs", "/api-docs"], ["Help center", "/help"], ["Integrations", "/integrations"]],
  Legal: [["Privacy", "/privacy"], ["Terms", "/terms"]],
};

function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50/80 dark:border-white/[0.06] dark:bg-[#070a0d]">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 lg:col-span-2">
            <Logo to="/" tone="auto" className="h-8 w-auto" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">Emails flowing safely into inboxes. Real-time email validation that protects sender reputation and improves deliverability.</p>
          </div>
          {Object.entries(FOOT).map(([group, links]) => (
            <div key={group}>
              <h4 className="font-['Space_Grotesk'] text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{group}</h4>
              <ul className="mt-4 space-y-2.5">
                {links.map(([l, to]) => (
                  <li key={l}><Link to={to} className="text-sm text-zinc-600 transition-colors hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-[#6effc0]">{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-zinc-200 pt-6 dark:border-white/[0.06] sm:flex-row sm:items-center">
          <p className="text-[13px] text-zinc-400">© {new Date().getFullYear()} ScrubiMail. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-[13px] text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200">Privacy</Link>
            <Link to="/terms" className="text-[13px] text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200">Terms</Link>
            <a href="mailto:hello@scrubimail.com" className="inline-flex items-center gap-1.5 text-[13px] text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"><Mail size={14} /> hello@scrubimail.com</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================== page ============================== */

export default function Homepage() {
  return (
    <div className="min-h-screen bg-white font-['Inter'] text-zinc-600 antialiased dark:bg-[#0a0e12] dark:text-zinc-400">
      <Styles />
      <TopBar />
      <main>
        <Hero />
        <TrustStrip />
        <StatsBand />
        <Features />
        <HowItWorks />
        <Developer />
        <Pricing />
        {/* Testimonials hidden until we have real, approved customer quotes —
            the previous cards were fabricated ("illustrative") personas.
            Restore <Testimonials /> once TradeHut Store / Morevans UK (or others)
            provide quotes we can attribute. */}
        {/* <Testimonials /> */}
        <Security />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
