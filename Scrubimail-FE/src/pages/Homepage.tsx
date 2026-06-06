import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Terminal,
  Globe,
  Code,
  Shield,
  Activity,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  FileText,
  Lock,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import TopBar from '../components/TopBar';

const LABEL = 'font-["Space_Grotesk",sans-serif] uppercase tracking-[0.3em] text-[9px]';

/** Glass panel — light frosted / dark terminal glass */
const glassPanel =
  'rounded-sm overflow-hidden backdrop-blur-xl border shadow-sm dark:shadow-none ' +
  'bg-white/80 border-gray-200/90 dark:bg-[rgba(255,255,255,0.02)] dark:border-[rgba(255,255,255,0.07)]';

const SurgicalLine = () => (
  <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/35 to-transparent dark:via-[rgba(0,229,160,0.25)]" />
);

const Homepage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="app-bg app-text min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div
        className="fixed inset-0 pointer-events-none dark:hidden"
        style={{
          background: 'radial-gradient(circle at 50% -10%, rgba(16,185,129,0.12) 0%, transparent 60%)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none hidden dark:block"
        style={{
          background: 'radial-gradient(circle at 50% -10%, rgba(0,229,160,0.10) 0%, transparent 60%)',
        }}
      />

      <TopBar />

      <main className="relative pt-16">
        {/* HERO */}
        <section className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-20 pb-32 grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-10 pt-8">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-1.5 border border-emerald-300/50 dark:border-[#6effc0]/20 bg-emerald-50/80 dark:bg-[rgba(110,255,192,0.05)] rounded-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#6effc0] animate-pulse" />
                <span className={`${LABEL} text-emerald-700 dark:text-[#6effc0]`}>System: Optimal</span>
              </div>
              <span className="font-mono text-[8px] text-gray-400 dark:text-white/30 uppercase tracking-[0.2em]">
                Build_hash: 8f2a9e1
              </span>
            </div>

            <h1
              className="font-['Epilogue',sans-serif] font-black text-gray-900 dark:text-white"
              style={{ fontSize: 'clamp(3.5rem, 8vw, 7rem)', letterSpacing: '-0.04em', lineHeight: 0.92 }}
            >
              High-Fidelity
              <br />
              <span
                className="text-emerald-600 dark:text-[#6effc0]"
                style={{ textShadow: '0 0 30px rgba(16,185,129,0.25)' }}
              >
                Validation.
              </span>
            </h1>

            <p className="text-gray-600 dark:text-[#94a3b8] text-lg max-w-xl leading-relaxed font-light">
              The definitive email scrubbing engine for critical infrastructure. Zero-latency verification
              clusters for high-throughput engineering teams.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/register"
                className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white dark:bg-[#6effc0] dark:text-[#003824] font-mono text-[10px] uppercase tracking-[0.3em] font-bold hover:brightness-105 transition-all rounded-sm shadow-lg dark:shadow-[0_10px_30px_rgba(110,255,192,0.15)]"
              >
                <Zap className="w-3.5 h-3.5" />
                Deploy_Cluster
              </Link>
              <Link
                to="/api-docs"
                className="flex items-center gap-2 px-8 py-4 border border-gray-300 dark:border-white/10 font-mono text-[10px] uppercase tracking-[0.3em] hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-gray-800 dark:text-[#e0e3e8] rounded-sm"
              >
                <Code className="w-3.5 h-3.5" />
                View_Specification
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 pt-8">
            <div className={`relative shadow-xl dark:shadow-2xl ${glassPanel}`}>
              <div className="absolute -top-3 -right-3 z-20 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-sm bg-white/95 dark:bg-[rgba(8,12,16,0.9)] backdrop-blur-xl">
                <span className="font-mono text-[9px] text-emerald-600 dark:text-[#6effc0] flex items-center gap-2">
                  <span className="w-1 h-1 bg-emerald-500 dark:bg-[#6effc0] rounded-full" />
                  LATENCY: 0.04ms
                </span>
              </div>

              <div className="px-5 py-3 border-b border-gray-200 dark:border-white/5 flex items-center justify-between bg-gray-50/80 dark:bg-[rgba(255,255,255,0.02)]">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400/70 dark:bg-white/20" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400/70 dark:bg-white/20" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 dark:bg-white/20" />
                </div>
                <span className="font-mono text-[8px] text-gray-400 dark:text-white/30 uppercase tracking-[0.4em]">
                  Core_Validation_Probe
                </span>
              </div>

              <div className="p-8 font-mono text-sm leading-relaxed min-h-[340px] bg-slate-900 dark:bg-black/40 space-y-5">
                <div className="flex gap-4">
                  <span className="text-white/25 select-none">L01</span>
                  <span className="text-[#6effc0]/80 dark:text-[#6effc0]/70">$ scrubi probe test@infra.net</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-white/25 select-none">L02</span>
                  <div className="text-gray-200 space-y-1">
                    <div className="text-white/50">{'{'}</div>
                    <div className="pl-5">
                      <span className="text-[#6effc0]">"status"</span>:{' '}
                      <span className="text-white font-bold">"VERIFIED"</span>,
                    </div>
                    <div className="pl-5">
                      <span className="text-[#6effc0]">"precision"</span>: <span className="text-white">0.999992</span>,
                    </div>
                    <div className="pl-5">
                      <span className="text-[#6effc0]">"provider"</span>: <span className="text-white">"AWS_SES_NODE"</span>,
                    </div>
                    <div className="pl-5">
                      <span className="text-[#6effc0]">"mx_active"</span>: <span className="text-white">true</span>,
                    </div>
                    <div className="pl-5">
                      <span className="text-[#6effc0]">"scrub_id"</span>:{' '}
                      <span className="text-white/60">"x82_921_aa"</span>
                    </div>
                    <div className="text-white/50">{'}'}</div>
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t border-white/10">
                  <span className="text-white/25 select-none">L09</span>
                  <span className="text-white/40 italic">// Awaiting next packet...</span>
                </div>
              </div>

              <div className="absolute bottom-3 right-4 font-mono text-[7px] text-white/15 uppercase tracking-widest">
                SECURE_TUNNEL: 128.0.0.1
              </div>
            </div>
          </div>
        </section>

        <SurgicalLine />
        <section className="bg-gray-100/90 dark:bg-black/15 border-y border-gray-200 dark:border-transparent">
          <div className="max-w-[1400px] mx-auto grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-200 dark:divide-white/5 border-x border-gray-200 dark:border-white/5">
            {[
              { value: '12.8M', label: 'Packet_Operations/hr' },
              { value: '99.998%', label: 'Accuracy_Coefficient' },
              { value: '< 12ms', label: 'Edge_Response_TTFB' },
              { value: 'Global', label: 'Node_Distribution', pulse: true },
            ].map(({ value, label, pulse }) => (
              <div key={label} className="py-14 px-8 lg:px-10">
                <div className="flex items-center gap-2.5 mb-1.5">
                  {pulse && <span className="w-2 h-2 bg-emerald-500 dark:bg-[#6effc0] animate-pulse" />}
                  <span
                    className="font-mono text-3xl font-bold text-gray-900 dark:text-white tracking-tighter"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {value}
                  </span>
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-gray-500 dark:text-white/30">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>
        <SurgicalLine />

        {/* SURGICAL INFRASTRUCTURE */}
        <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-28">
          <div className="mb-20 flex justify-between items-end">
            <div className="space-y-3">
              <div className={`${LABEL} text-emerald-700 dark:text-[#6effc0]`}>Technical_Capabilities</div>
              <h2
                className="font-['Epilogue',sans-serif] font-black text-gray-900 dark:text-white"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', lineHeight: 0.95 }}
              >
                Surgical Infrastructure.
              </h2>
            </div>
            <div className="hidden md:block font-mono text-[9px] text-gray-400 dark:text-white/25 uppercase tracking-[0.4em] text-right">
              MODULE: ALPHA_V4
              <br />
              REVISION: 2025.01
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:h-[520px]">
            <div className={`md:col-span-7 md:row-span-2 p-10 relative overflow-hidden flex flex-col justify-between group ${glassPanel}`}>
              <div>
                <div className="w-11 h-11 mb-8 flex items-center justify-center border border-emerald-300 dark:border-[#6effc0]/25 text-emerald-600 dark:text-[#6effc0]">
                  <Terminal className="w-5 h-5" />
                </div>
                <h3 className="font-mono text-base uppercase tracking-widest text-gray-900 dark:text-white mb-4">
                  Autonomous_Scrubbing_Protocol
                </h3>
                <p className="text-gray-600 dark:text-white/45 text-sm leading-relaxed max-w-md">
                  Layer-7 inspection using proprietary SMTP-Handshake patterns to identify honeypots,
                  spamtrap infrastructure, and ephemeral MX clusters without ever leaving a footprint.
                </p>
              </div>
              <div className="pt-8 border-t border-gray-200 dark:border-white/5 flex items-center justify-between">
                <div className="flex gap-3">
                  <div className="h-10 w-28 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 flex items-center justify-center font-mono text-[8px] text-gray-500 dark:text-white/35">
                    GRAPH_DATA_FLOW
                  </div>
                  <div className="h-10 w-28 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 flex items-center justify-center font-mono text-[8px] text-gray-500 dark:text-white/35">
                    PACKET_METRICS
                  </div>
                </div>
                <span className="font-mono text-[10px] text-emerald-600 dark:text-[#6effc0]">v4.1 ACTIVE</span>
              </div>
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none dark:hidden"
                style={{
                  background: 'linear-gradient(45deg, transparent, rgba(16,185,129,0.06), transparent)',
                }}
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none hidden dark:block"
                style={{
                  background: 'linear-gradient(45deg, transparent, rgba(110,255,192,0.05), transparent)',
                }}
              />
            </div>

            <div className={`md:col-span-5 p-8 relative group ${glassPanel}`}>
              <div className="flex justify-between items-start mb-6">
                <Globe className="w-6 h-6 text-emerald-600 dark:text-[#6effc0]" />
                <span className="font-mono text-[8px] text-gray-400 dark:text-white/25 uppercase tracking-[0.3em]">
                  Module_02
                </span>
              </div>
              <h3 className="font-mono text-sm uppercase tracking-widest text-gray-900 dark:text-white mb-3">
                Anycast_Edge_Network
              </h3>
              <p className="text-gray-600 dark:text-white/45 text-xs leading-relaxed">
                Requests are routed to the nearest secure cluster. Currently spanning 24 global regions
                for sub-15ms validation cycles.
              </p>
            </div>

            <div className={`md:col-span-5 p-8 relative group ${glassPanel}`}>
              <div className="flex justify-between items-start mb-6">
                <Code className="w-6 h-6 text-emerald-600 dark:text-[#6effc0]" />
                <span className="font-mono text-[8px] text-gray-400 dark:text-white/25 uppercase tracking-[0.3em]">
                  Module_03
                </span>
              </div>
              <h3 className="font-mono text-sm uppercase tracking-widest text-gray-900 dark:text-white mb-3">
                Meta_Extraction_v2
              </h3>
              <p className="text-gray-600 dark:text-white/45 text-xs leading-relaxed">
                Deep SMTP telemetry including role detection, provider categorization, and risk scoring
                in a single JSON packet.
              </p>
            </div>
          </div>
        </section>

        {/* SCAN PROCESS */}
        <section className="bg-gray-100/80 dark:bg-[rgba(24,28,32,0.7)] border-y border-gray-200 dark:border-transparent">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24">
            <div className="mb-14">
              <div className={`${LABEL} text-gray-600 dark:text-[#bacbbf] mb-3`}>Core Mechanism</div>
              <h2
                className="font-['Epilogue',sans-serif] font-black text-gray-900 dark:text-white"
                style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em' }}
              >
                The Surgical Scan Process
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                {
                  n: '01',
                  label: 'INGEST',
                  icon: ArrowRight,
                  desc: 'Multi-source entry via API, SMTP proxy, or high-volume batch upload.',
                  meta: 'LATENCY: 12MS',
                  highlight: false,
                },
                {
                  n: '02',
                  label: 'AI ANALYSIS',
                  icon: Activity,
                  desc: 'Neural network pattern matching for syntax and reputation entropy.',
                  meta: 'CONFIDENCE: 99.8%',
                  highlight: true,
                },
                {
                  n: '03',
                  label: 'SMTP CHECK',
                  icon: Shield,
                  desc: 'Real-time handshake with destination servers without sending mail.',
                  meta: 'TIMEOUT: 1.2S',
                  highlight: false,
                },
                {
                  n: '04',
                  label: 'FINAL SCORE',
                  icon: CheckCircle,
                  desc: 'Aggregation of 40+ signals into a binary valid/invalid payload.',
                  meta: 'OUTPUT: JSON/CSV',
                  highlight: false,
                },
              ].map(({ n, label, icon: Icon, desc, meta, highlight }) => (
                <div
                  key={n}
                  className={`p-7 flex flex-col gap-5 rounded-sm border ${
                    highlight
                      ? 'bg-white border-emerald-300 shadow-md shadow-emerald-500/10 dark:bg-[rgba(38,42,47,1)] dark:border-[rgba(110,255,192,0.25)] dark:shadow-[0_0_20px_rgba(110,255,192,0.07)]'
                      : 'bg-white/80 border-gray-200 dark:bg-[rgba(16,20,24,0.8)] dark:border-[rgba(59,74,65,0.2)]'
                  }`}
                >
                  <span
                    className="font-mono text-sm font-bold text-emerald-600 dark:text-[#6effc0]"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {n}
                  </span>
                  <div
                    className={`flex items-center gap-2 ${
                      highlight ? 'text-emerald-700 dark:text-[#6effc0]' : 'text-gray-900 dark:text-[#e0e3e8]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-['Epilogue',sans-serif] font-bold text-sm tracking-tight">{label}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-[#bacbbf]/70 leading-relaxed flex-1">{desc}</p>
                  <div className="pt-3 border-t border-gray-200 dark:border-[#3b4a41]/20 font-mono text-[10px] text-gray-500 dark:text-[#3b4a41]">
                    {meta.split(': ').map((part, i) =>
                      i === 0 ? (
                        <span key={i}>{part}: </span>
                      ) : (
                        <span key={i} className="text-gray-800 dark:text-[#e0e3e8]">
                          {part}
                        </span>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRECISION LIFECYCLE */}
        <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-32">
          <div className="p-12 lg:p-20 relative overflow-hidden rounded-sm border border-gray-200 dark:border-[rgba(255,255,255,0.06)] bg-gray-50/50 dark:bg-black/30">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-12">
                <h2
                  className="font-['Epilogue',sans-serif] font-bold text-gray-900 dark:text-white"
                  style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', letterSpacing: '-0.04em', lineHeight: 0.95 }}
                >
                  Precision Lifecycle.
                </h2>

                <div className="space-y-10">
                  {[
                    {
                      code: '0100',
                      title: 'Syntax_Parse_Sanitization',
                      desc: 'Strict RFC compliance filtering with enhanced sanitization algorithms for edge-case injections.',
                    },
                    {
                      code: '0101',
                      title: 'DNS_MX_Verification',
                      desc: 'Parallelized DNS lookups across redundant recursive resolvers for maximum reliability.',
                    },
                    {
                      code: '0110',
                      title: 'Surgical_SMTP_Check',
                      desc: 'Ephemeral socket connection with proprietary handshake signaling to verify mailbox existence.',
                    },
                  ].map(({ code, title, desc }) => (
                    <div key={code} className="group">
                      <div className="flex items-center gap-6 mb-3">
                        <span className="font-mono text-[10px] text-emerald-600/50 group-hover:text-emerald-600 dark:text-[#6effc0]/35 dark:group-hover:text-[#6effc0] transition-colors">
                          {code}
                        </span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                      </div>
                      <div className="pl-10">
                        <h4 className="font-mono text-xs uppercase tracking-widest text-gray-900 dark:text-white mb-2">
                          {title}
                        </h4>
                        <p className="text-gray-600 dark:text-white/35 text-sm font-light max-w-sm leading-relaxed">
                          {desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden lg:flex relative h-[420px] items-end p-6 rounded-sm border border-gray-200 dark:border-[rgba(255,255,255,0.08)] bg-slate-100 dark:bg-black/40">
                <div
                  className="absolute left-0 w-full"
                  style={{
                    height: 2,
                    background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
                    boxShadow: '0 0 15px rgba(16,185,129,0.6)',
                    animation: 'scanDown 4s linear infinite',
                    top: 0,
                  }}
                />
                <style>{`
                  @keyframes scanDown {
                    0% { top: 0%; opacity: 0; }
                    5% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                  }
                `}</style>

                <div className="w-full grid grid-cols-3 gap-3">
                  {['NODE_TX_01', 'NODE_TX_02', 'NODE_TX_03', 'NODE_TX_04', 'NODE_TX_05', 'NODE_TX_06'].map(
                    (node) => (
                      <div
                        key={node}
                        className="border border-gray-200 dark:border-white/8 p-3 font-mono text-[8px] text-gray-500 dark:text-white/30 uppercase tracking-wide flex items-center justify-between bg-emerald-50/30 dark:bg-[rgba(110,255,192,0.02)]"
                      >
                        <span>{node}</span>
                        <span className="w-1 h-1 rounded-full bg-emerald-500 dark:bg-[#6effc0] animate-pulse" />
                      </div>
                    )
                  )}
                </div>

                <div className="absolute top-4 left-4 space-y-1 font-mono text-[8px] text-gray-400 dark:text-white/20 uppercase tracking-[0.2em]">
                  <p>HARDWARE_ID: SCRB_NODE_TX_09</p>
                  <p>TEMP_CORE: 32.4°C</p>
                  <p>STATUS: OPTIMIZED</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CAPACITY MATRIX */}
        <section className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-32">
          <div className="text-center mb-20 space-y-6">
            <h2
              className="font-['Epilogue',sans-serif] font-black text-gray-900 dark:text-white"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', letterSpacing: '-0.04em', lineHeight: 0.95 }}
            >
              Capacity Matrix.
            </h2>

            <div className="inline-flex border border-gray-200 dark:border-white/8 bg-gray-100 dark:bg-white/[0.02] rounded-sm p-0.5">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-3 font-mono text-[9px] uppercase tracking-widest transition-all rounded-sm ${
                  billingCycle === 'monthly'
                    ? 'bg-white shadow-sm border border-gray-200 text-gray-900 dark:bg-white/10 dark:border-white/15 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-white/35 dark:hover:text-white'
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-8 py-3 font-mono text-[9px] uppercase tracking-widest transition-all rounded-sm ${
                  billingCycle === 'annual'
                    ? 'bg-white shadow-sm border border-gray-200 text-gray-900 dark:bg-white/10 dark:border-white/15 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-white/35 dark:hover:text-white'
                }`}
              >
                Annual_Enterprise
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
            <div className={`p-10 flex flex-col ${glassPanel}`}>
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-gray-500 dark:text-white/25 mb-6">
                Node_Dev
              </div>
              <div className="font-['Epilogue',sans-serif] text-5xl font-bold mb-12 text-gray-900 dark:text-white">
                $0
              </div>
              <div className="space-y-4 mb-16 flex-grow font-mono text-[10px] text-gray-500 dark:text-white/35">
                {['1,000_PROBES/MO', 'PUBLIC_RESOURCES', 'BASIC_SPEC'].map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <span className="w-1 h-1 bg-gray-400 dark:bg-white/20" />
                    {f}
                  </div>
                ))}
              </div>
              <Link
                to="/register"
                className="w-full py-4 border border-gray-300 dark:border-white/10 font-mono text-[9px] uppercase tracking-[0.4em] hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-center text-gray-800 dark:text-[#e0e3e8] rounded-sm"
              >
                Provision
              </Link>
            </div>

            <div
              className="p-10 flex flex-col relative rounded-sm border-2 border-emerald-400/50 dark:border-[rgba(110,255,192,0.3)] bg-emerald-50/30 dark:bg-[rgba(255,255,255,0.03)] backdrop-blur-xl shadow-lg shadow-emerald-500/10 dark:shadow-[0_30px_80px_rgba(110,255,192,0.07)]"
            >
              <div className="absolute top-0 right-0 p-3 font-mono text-[8px] text-emerald-700 dark:text-[#6effc0] uppercase tracking-[0.2em] font-bold">
                Recommended
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-700 dark:text-[#6effc0] mb-6">
                Node_Production
              </div>
              <div className="font-['Epilogue',sans-serif] text-5xl font-bold mb-12 text-gray-900 dark:text-white">
                {billingCycle === 'annual' ? '$39' : '$49'}
              </div>
              <div className="space-y-4 mb-16 flex-grow font-mono text-[10px] text-gray-700 dark:text-white/75">
                {['50,000_PROBES/MO', '99.9%_NODE_SLO', 'ANYCAST_ROUTING', 'PRIORITY_IO'].map((f) => (
                  <div key={f} className="flex items-center gap-3 text-emerald-700 dark:text-[#6effc0]">
                    <span className="w-1 h-1 bg-emerald-500 dark:bg-[#6effc0]" />
                    {f}
                  </div>
                ))}
              </div>
              <Link
                to="/register"
                className="w-full py-4 bg-emerald-600 text-white dark:bg-[#6effc0] font-mono text-[9px] uppercase tracking-[0.4em] font-bold dark:text-[#003824] hover:brightness-105 transition-all text-center rounded-sm"
              >
                Select_Node
              </Link>
            </div>

            <div className={`p-10 flex flex-col ${glassPanel}`}>
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-gray-500 dark:text-white/25 mb-6">
                Node_Enterprise
              </div>
              <div className="font-['Epilogue',sans-serif] text-5xl font-bold mb-12 text-gray-900 dark:text-white">
                {billingCycle === 'annual' ? '$159' : '$199'}
              </div>
              <div className="space-y-4 mb-16 flex-grow font-mono text-[10px] text-gray-500 dark:text-white/35">
                {['500,000_PROBES/MO', 'ADVANCED_ANALYTICS', 'DEDICATED_VPN'].map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <span className="w-1 h-1 bg-gray-400 dark:bg-white/20" />
                    {f}
                  </div>
                ))}
              </div>
              <Link
                to="/register"
                className="w-full py-4 border border-gray-300 dark:border-white/10 font-mono text-[9px] uppercase tracking-[0.4em] hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-center text-gray-800 dark:text-[#e0e3e8] rounded-sm"
              >
                Provision
              </Link>
            </div>

            <div className={`p-10 flex flex-col ${glassPanel}`}>
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-gray-500 dark:text-white/25 mb-6">
                Node_Custom
              </div>
              <div className="font-['Epilogue',sans-serif] text-5xl font-bold mb-12 text-gray-900 dark:text-white">
                QUOTE
              </div>
              <div className="space-y-4 mb-16 flex-grow font-mono text-[10px] text-gray-500 dark:text-white/35">
                {['UNLIMITED_IO', 'ON_PREM_BINARIES', '100%_SLO_GUARANTEE'].map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <span className="w-1 h-1 bg-gray-400 dark:bg-white/20" />
                    {f}
                  </div>
                ))}
              </div>
              <a
                href="mailto:sales@scrubimail.com"
                className="w-full py-4 border border-gray-300 dark:border-white/10 font-mono text-[9px] uppercase tracking-[0.4em] hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-center text-gray-800 dark:text-[#e0e3e8] rounded-sm"
              >
                Talk_To_Ops
              </a>
            </div>
          </div>
        </section>

        <SurgicalLine />
        <section className="py-32 px-6 lg:px-10 text-center relative overflow-hidden [background-image:radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1)_0%,transparent_60%)] dark:[background-image:radial-gradient(circle_at_50%_50%,rgba(110,255,192,0.06)_0%,transparent_60%)]">
          <div className={`${LABEL} text-emerald-700 dark:text-[#6effc0] mb-6`}>Ready to Operate</div>
          <h2
            className="font-['Epilogue',sans-serif] font-black text-gray-900 dark:text-white mx-auto mb-8"
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              letterSpacing: '-0.04em',
              lineHeight: 0.95,
              maxWidth: '800px',
            }}
          >
            Ready to build with precision?
          </h2>
          <p className="text-gray-600 dark:text-[#94a3b8] text-lg max-w-xl mx-auto mb-12 font-light">
            Join thousands of engineering teams using ScrubiMail for mission-critical email validation.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/register"
              className="flex items-center gap-2 px-10 py-5 bg-emerald-600 text-white dark:bg-[#6effc0] dark:text-[#003824] font-mono text-[10px] uppercase tracking-[0.3em] font-bold hover:brightness-105 transition-all rounded-sm shadow-lg dark:shadow-[0_15px_40px_rgba(110,255,192,0.2)]"
            >
              <Zap className="w-3.5 h-3.5" />
              Initialize_Cluster
            </Link>
            <Link
              to="/api-docs"
              className="flex items-center gap-2 px-10 py-5 border border-gray-300 dark:border-white/10 font-mono text-[10px] uppercase tracking-[0.3em] hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-gray-800 dark:text-[#e0e3e8] rounded-sm"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              Read_Specification
            </Link>
          </div>
        </section>
        <SurgicalLine />

        <footer className="bg-gray-100 border-t border-gray-200 dark:bg-[#050608] dark:border-transparent">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
              <div className="sm:col-span-2 lg:col-span-2">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-7 h-7 bg-emerald-500 dark:bg-[#6effc0] flex items-center justify-center flex-shrink-0 rounded-sm">
                    <Zap className="w-4 h-4 text-white dark:text-[#003824]" strokeWidth={2.5} />
                  </div>
                  <span className="font-['Epilogue',sans-serif] font-black tracking-tighter text-emerald-700 dark:text-[#6effc0] text-lg">
                    ScrubiMail
                  </span>
                </div>
                <p className="text-gray-600 dark:text-[#bacbbf]/60 text-sm leading-relaxed max-w-xs mb-6 font-light">
                  High-fidelity email validation infrastructure. Zero compromise on deliverability.
                </p>
                <div className="flex items-center gap-3">
                  {[
                    { icon: Github, href: '#' },
                    { icon: Twitter, href: '#' },
                    { icon: Linkedin, href: '#' },
                  ].map(({ icon: Icon, href }, i) => (
                    <a
                      key={i}
                      href={href}
                      className="w-8 h-8 border border-gray-300 dark:border-[#3b4a41]/40 flex items-center justify-center text-gray-500 hover:text-emerald-600 dark:text-[#bacbbf]/50 dark:hover:text-[#6effc0] dark:hover:border-[#6effc0]/30 transition-colors rounded-sm"
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <p className={`${LABEL} text-gray-500 dark:text-[#3b4a41] mb-4`}>Product</p>
                <ul className="space-y-2.5">
                  {[
                    ['Email Validation', '/validate'],
                    ['Bulk Processing', '/bulk-upload'],
                    ['Analytics', '/analytics'],
                    ['API Keys', '/apikeys'],
                    ['Changelog', '/changelog'],
                  ].map(([label, path]) => (
                    <li key={path}>
                      <Link
                        to={path}
                        className="text-gray-600 hover:text-emerald-600 dark:text-[#bacbbf]/50 dark:hover:text-[#6effc0] transition-colors text-xs font-mono uppercase tracking-[0.08em]"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className={`${LABEL} text-gray-500 dark:text-[#3b4a41] mb-4`}>Company</p>
                <ul className="space-y-2.5">
                  {[
                    ['About', '/about'],
                    ['Pricing', '/pricing'],
                    ['Contact', '/contact'],
                    ['Careers', '#'],
                  ].map(([label, path]) => (
                    <li key={path}>
                      <Link
                        to={path}
                        className="text-gray-600 hover:text-emerald-600 dark:text-[#bacbbf]/50 dark:hover:text-[#6effc0] transition-colors text-xs font-mono uppercase tracking-[0.08em]"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className={`${LABEL} text-gray-500 dark:text-[#3b4a41] mb-4`}>Resources</p>
                <ul className="space-y-2.5">
                  {[
                    ['API Docs', '/api-docs'],
                    ['Help Center', '/help'],
                    ['API Status', '#'],
                    ['Integrations', '/integrations'],
                  ].map(([label, path]) => (
                    <li key={path}>
                      <Link
                        to={path}
                        className="text-gray-600 hover:text-emerald-600 dark:text-[#bacbbf]/50 dark:hover:text-[#6effc0] transition-colors text-xs font-mono uppercase tracking-[0.08em]"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <SurgicalLine />

            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
                <p className="font-mono text-[10px] text-gray-500 dark:text-white/20 uppercase tracking-[0.2em]">
                  &copy; {new Date().getFullYear()} ScrubiMail. All rights reserved.
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#6effc0] animate-pulse" />
                  <span className="font-mono text-[9px] text-gray-500 dark:text-white/25 uppercase tracking-[0.2em]">
                    All systems operational
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-5 font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500 dark:text-white/25">
                <Link
                  to="/privacy"
                  className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-[#6effc0] transition-colors"
                >
                  <Lock className="w-2.5 h-2.5" /> Privacy
                </Link>
                <Link
                  to="/terms"
                  className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-[#6effc0] transition-colors"
                >
                  <FileText className="w-2.5 h-2.5" /> Terms
                </Link>
                <a href="#" className="hover:text-emerald-600 dark:hover:text-[#6effc0] transition-colors">
                  Security
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Homepage;
