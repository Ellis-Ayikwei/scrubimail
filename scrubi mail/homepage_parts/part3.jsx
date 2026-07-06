/* ScrubiMail Homepage — part 3: Pricing, Testimonials, Security, Final CTA, Footer, root */
(function () {
const { useState: useState3 } = React;
const { Reveal, Eyebrow, Styles, Hero, TrustStrip, StatsBand, Features, HowItWorks, Developer } = window;
const H3 = window.SM_H;
const {
  Check, ArrowRight, Star, Quote, Lock, ShieldHalf, Fingerprint, Server, Database,
  ShieldCheck, Mail,
} = window.SM.icons;

/* ----------------------------- pricing ----------------------------- */
const TIERS = [
  { name: "Free", priceM: 0, priceA: 0, blurb: "Kick the tires on real validations.", quota: "1,000 validations / mo", cta: "Start free", to: "/register",
    features: ["Single + bulk validation", "Full check suite & risk score", "REST API + 1 API key", "Community support"] },
  { name: "Pro", priceM: 49, priceA: 39, blurb: "For growing apps that send daily.", quota: "50,000 validations / mo", cta: "Start free trial", to: "/register", recommended: true,
    features: ["Everything in Free", "CSV / NDJSON bulk pipeline", "Usage analytics dashboard", "5 API keys", "Email support"] },
  { name: "Business", priceM: 199, priceA: 159, blurb: "Scale list hygiene across teams.", quota: "500,000 validations / mo", cta: "Start free trial", to: "/register",
    features: ["Everything in Pro", "Priority validation queue", "Team members & roles", "Unlimited API keys", "Priority support"] },
  { name: "Enterprise", priceM: null, priceA: null, blurb: "Volume pricing with an SLA.", quota: "Custom volume + SLA", cta: "Contact sales", to: "mailto:sales@scrubimail.com", mailto: true,
    features: ["Everything in Business", "Volume discounts", "Uptime & support SLA", "SSO & security review", "Dedicated manager"] },
];
function Pricing() {
  const [annual, setAnnual] = useState3(true);
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Eyebrow>Pricing</Eyebrow>
        <h2 className={H3 + " mt-3 text-3xl sm:text-[2.6rem]"}>Simple plans that scale with you</h2>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">Start free, upgrade when you grow. Every plan includes the full check suite.</p>
      </Reveal>

      <div className="mt-8 flex items-center justify-center gap-3">
        <span className={"text-sm font-medium " + (!annual ? "text-zinc-900 dark:text-white" : "text-zinc-400")}>Monthly</span>
        <button role="switch" aria-checked={annual} aria-label="Toggle annual billing" onClick={() => setAnnual((a) => !a)}
          className={"relative h-7 w-12 rounded-full transition-colors " + (annual ? "bg-emerald-600 dark:bg-[#6effc0]/95" : "bg-zinc-300 dark:bg-white/15")}>
          <span className={"absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all dark:bg-[#03150e]/95 " + (annual ? "left-6" : "left-1")} />
        </button>
        <span className={"text-sm font-medium " + (annual ? "text-zinc-900 dark:text-white" : "text-zinc-400")}>Annual</span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-[#6effc0]/10 dark:text-[#6effc0] dark:ring-[#6effc0]/25">Save ~20%</span>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t, i) => {
          const price = annual ? t.priceA : t.priceM;
          const rec = t.recommended;
          return (
            <Reveal key={t.name} delay={i * 70}>
              <div className={"relative flex h-full flex-col rounded-2xl border p-6 transition " +
                (rec ? "border-emerald-500/60 bg-white shadow-2xl shadow-emerald-900/10 dark:border-[#6effc0]/40 dark:bg-[#0e141a]/95 dark:shadow-[#6effc0]/5 lg:-mt-2 lg:mb-2"
                     : "border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0b1014]/95")}>
                {rec && <span className="absolute -top-3 left-6 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white dark:bg-[#6effc0]/95 dark:text-[#003824]">Recommended</span>}
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
                <a href={t.to} className={"mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition " +
                  (rec ? "bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-[#6effc0]/95 dark:text-[#003824] dark:hover:bg-[#47ffb8]"
                       : "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10")}>
                  {t.cta}
                </a>
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

/* ----------------------------- testimonials ----------------------------- */
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
          <h2 className={H3 + " mt-3 text-3xl sm:text-[2.6rem]"}>Teams ship with confidence</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={i} delay={i * 80}>
              <figure className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-[#0e141a]/95">
                <Quote size={26} className="text-emerald-300 dark:text-[#6effc0]/40" />
                <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-200">{c.quote}</blockquote>
                <div className="mt-1 flex gap-0.5 text-amber-400">{[0,1,2,3,4].map((s) => <Star key={s} size={14} />)}</div>
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

/* ----------------------------- security ----------------------------- */
function Security() {
  const items = [
    { Icon: Lock, title: "Encrypted in transit", body: "All API traffic is served over TLS 1.2+. Keys are scoped and revocable." },
    { Icon: ShieldHalf, title: "Minimal data handling", body: "We validate addresses, not inboxes — no message contents are ever read or stored." },
    { Icon: Fingerprint, title: "Access controls", body: "Per-project API keys with usage tracking and instant rotation." },
    { Icon: Server, title: "Resilient infrastructure", body: "Caching and graceful degradation keep validation fast under load." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 dark:border-white/10 dark:bg-[#0b1014]/95 sm:p-10">
        <Reveal className="max-w-2xl">
          <Eyebrow>Security & compliance</Eyebrow>
          <h2 className={H3 + " mt-3 text-2xl sm:text-3xl"}>Built to protect your data and your reputation</h2>
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

/* ----------------------------- final CTA ----------------------------- */
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
              <a href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6effc0] px-6 py-3 text-base font-semibold text-[#003824] transition hover:bg-[#47ffb8]">Start free <ArrowRight size={18} /></a>
              <a href="/api-docs" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10">View API docs</a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ----------------------------- footer ----------------------------- */
const FOOT = {
  Product: [["Validate", "/validate"], ["Bulk upload", "/bulk-upload"], ["Analytics", "/analytics"], ["API keys", "/apikeys"], ["Pricing", "/pricing"], ["Integrations", "/integrations"]],
  Company: [["About", "/about"], ["Contact", "/contact"], ["Changelog", "/changelog"]],
  Resources: [["API docs", "/api-docs"], ["Help center", "/help"], ["Integrations", "/integrations"]],
  Legal: [["Privacy", "/privacy"], ["Terms", "/terms"]],
};
function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50/80 dark:border-white/[0.06] dark:bg-[#070a0d]/95">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 lg:col-span-2">
            <a href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 dark:bg-[#6effc0]/95"><ShieldCheck size={18} strokeWidth={2.4} className="text-white dark:text-[#003824]" /></span>
              <span className="font-['Epilogue'] text-[19px] font-extrabold tracking-tight text-zinc-900 dark:text-white">Scrubi<span className="text-emerald-600 dark:text-[#6effc0]">Mail</span></span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">Emails flowing safely into inboxes. Real-time email validation that protects sender reputation and improves deliverability.</p>
          </div>
          {Object.entries(FOOT).map(([group, links]) => (
            <div key={group}>
              <h4 className="font-['Space_Grotesk'] text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{group}</h4>
              <ul className="mt-4 space-y-2.5">
                {links.map(([l, to]) => (
                  <li key={l}><a href={to} className="text-sm text-zinc-600 transition-colors hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-[#6effc0]">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-zinc-200 pt-6 dark:border-white/[0.06] sm:flex-row sm:items-center">
          <p className="text-[13px] text-zinc-400">© {new Date().getFullYear()} ScrubiMail. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="text-[13px] text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200">Privacy</a>
            <a href="/terms" className="text-[13px] text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200">Terms</a>
            <a href="mailto:hello@scrubimail.com" className="inline-flex items-center gap-1.5 text-[13px] text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"><Mail size={14} /> hello@scrubimail.com</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ----------------------------- root ----------------------------- */
const { TopBar } = window.SM;
function Homepage() {
  return (
    <div className="min-h-screen bg-white font-['Inter'] text-zinc-600 antialiased dark:bg-[#0a0e12]/95 dark:text-zinc-400">
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
        <Testimonials />
        <Security />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
window.Homepage = Homepage;
})();
