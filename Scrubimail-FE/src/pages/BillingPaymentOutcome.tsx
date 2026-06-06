import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Ban, ArrowRight, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import billingService, { PaymentVerificationResult } from '../services/billingService';

const ALLOWED = new Set(['success', 'failed', 'cancelled']);

const CARD =
  'bg-white/95 dark:bg-[#1c2024] border border-gray-200 dark:border-[#3b4a41]/40 rounded-sm shadow-sm dark:shadow-none max-w-lg w-full p-8';

type VerifyState =
  | { phase: 'idle' }
  | { phase: 'pending' }
  | { phase: 'ok'; result: PaymentVerificationResult }
  | { phase: 'err'; message?: string }
  | { phase: 'skipped' };

export default function BillingPaymentOutcome() {
  const { outcome } = useParams<{ outcome: string }>();
  const [searchParams] = useSearchParams();

  const reference = searchParams.get('reference') ?? undefined;
  const trxref = searchParams.get('trxref') ?? undefined;
  const primaryRef = reference ?? trxref;
  const reason =
    searchParams.get('message') ??
    searchParams.get('reason') ??
    searchParams.get('error') ??
    undefined;

  const validOutcome = !!(outcome && ALLOWED.has(outcome));

  const [verify, setVerify] = useState<VerifyState>(() => {
    if (!validOutcome || !outcome) return { phase: 'idle' };
    if (outcome !== 'success') return { phase: 'idle' };
    if (!primaryRef) return { phase: 'skipped' };
    return { phase: 'pending' };
  });

  useEffect(() => {
    if (!validOutcome || outcome !== 'success' || !primaryRef) return;
    if (verify.phase !== 'pending') return;
    let cancelled = false;
    billingService.verifyPayment(primaryRef).then((res) => {
      if (cancelled) return;
      setVerify(res.ok ? { phase: 'ok', result: res } : { phase: 'err', message: res.message });
    });
    return () => {
      cancelled = true;
    };
  }, [validOutcome, outcome, primaryRef, verify.phase]);

  if (!validOutcome) {
    return <Navigate to="/billing" replace />;
  }

  const config = {
    success: {
      icon: CheckCircle,
      iconWrap: 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-[#6effc0]/10 dark:border-[#6effc0]/25 dark:text-[#6effc0]',
      title: 'Payment successful',
      body:
        'Your payment was received. If you upgraded a plan or bought credits, your account may take a few moments to update after Paystack confirms the transaction.',
    },
    failed: {
      icon: XCircle,
      iconWrap: 'bg-red-50 border-red-200 text-red-600 dark:bg-[#ff4c4c]/10 dark:border-[#ff4c4c]/30 dark:text-[#ff4c4c]',
      title: 'Payment unsuccessful',
      body:
        reason ??
        'We could not complete this payment. You have not been charged. Try again or use a different payment method.',
    },
    cancelled: {
      icon: Ban,
      iconWrap: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-[#f59e0b]/10 dark:border-[#f59e0b]/25 dark:text-[#f59e0b]',
      title: 'Checkout cancelled',
      body: 'You left the payment page before completing checkout. No charge was made.',
    },
  }[outcome];

  const Icon = config.icon;

  let successTitle = config.title;
  if (verify.phase === 'ok') successTitle = 'Payment verified';
  else if (verify.phase === 'err') successTitle = 'Could not verify payment';
  else if (verify.phase === 'pending') successTitle = 'Confirming payment…';

  let successBody = config.body;
  if (verify.phase === 'ok') {
    successBody = verify.result.message ?? 'Your payment was confirmed with Paystack.';
  } else if (verify.phase === 'err') {
    successBody = `${verify.message ?? 'Verification failed.'} If you completed checkout, check Billing in a moment or contact support with your reference below.`;
  } else if (verify.phase === 'pending') {
    successBody =
      'Talking to Paystack to confirm this transaction. This usually takes a few seconds.';
  }

  const successIconWrap =
    verify.phase === 'err'
      ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-[#f59e0b]/10 dark:border-[#f59e0b]/25 dark:text-[#f59e0b]'
      : verify.phase === 'pending'
        ? 'bg-gray-100 border-gray-200 text-gray-600 dark:bg-[#101418] dark:border-[#3b4a41]/40 dark:text-[#bacbbf]'
        : config.iconWrap;

  const SuccessGlyph =
    verify.phase === 'pending' ? Loader2 : verify.phase === 'err' ? AlertCircle : Icon;

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-6 px-4 py-10 min-h-[min(85dvh,calc(100vh-6rem))] sm:min-h-[calc(100vh-8rem)]"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="w-full text-center">
        <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.2em] text-[9px] text-emerald-600 dark:text-[#6effc0] mb-0.5">
          Billing
        </p>
        <h1 className="font-['Epilogue',sans-serif] font-black text-gray-900 dark:text-[#e0e3e8] text-2xl tracking-tight">
          Payment
        </h1>
      </div>

      <div className={`${CARD} shrink-0`}>
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-14 h-14 rounded-full border flex items-center justify-center mb-4 ${outcome === 'success' ? successIconWrap : config.iconWrap}`}
          >
            <SuccessGlyph
              className={`w-7 h-7 ${verify.phase === 'pending' ? 'animate-spin' : ''}`}
              strokeWidth={1.75}
            />
          </div>
          <h2 className="font-['Epilogue',sans-serif] font-bold text-lg text-gray-900 dark:text-[#e0e3e8] mb-2">
            {outcome === 'success' ? successTitle : config.title}
          </h2>
          <p className="font-mono text-xs text-gray-600 dark:text-[#bacbbf]/80 leading-relaxed mb-2">
            {outcome === 'success' ? successBody : config.body}
          </p>
          {outcome === 'success' && verify.phase === 'ok' && verify.result.payment_type ? (
            <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.08em] text-[9px] text-gray-500 dark:text-[#3b4a41] mb-4">
              Type: {verify.result.payment_type.replaceAll('_', ' ')}
              {verify.result.paystack_status ? ` · Paystack: ${verify.result.paystack_status}` : ''}
            </p>
          ) : null}

          {outcome === 'success' && primaryRef && (
            <div className="w-full bg-gray-50 dark:bg-[#101418] border border-gray-200 dark:border-[#3b4a41]/40 rounded-sm px-3 py-2 mb-6 text-left">
              <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.1em] text-[9px] text-gray-500 dark:text-[#3b4a41] mb-1">
                Reference
              </p>
              <p className="font-mono text-[11px] text-gray-800 dark:text-[#e0e3e8] break-all">{primaryRef}</p>
              {trxref && reference && trxref !== reference && (
                <p className="font-mono text-[10px] text-gray-500 dark:text-[#3b4a41] mt-1 break-all">
                  trxref: {trxref}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:justify-center">
            <Link
              to="/billing"
              className="inline-flex items-center justify-center gap-1.5 bg-emerald-500 text-white font-mono text-[10px] uppercase tracking-[0.12em] font-bold px-4 py-2.5 rounded-sm hover:bg-emerald-600 transition-colors dark:bg-[#6effc0] dark:text-[#003824] dark:hover:brightness-105"
            >
              <CreditCard className="w-3.5 h-3.5" /> Billing
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 font-mono text-[10px] uppercase tracking-[0.12em] px-4 py-2.5 rounded-sm hover:border-emerald-400 hover:text-emerald-700 transition-colors dark:border-[#3b4a41]/40 dark:text-[#bacbbf] dark:hover:border-[#6effc0]/40 dark:hover:text-[#6effc0]"
            >
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
