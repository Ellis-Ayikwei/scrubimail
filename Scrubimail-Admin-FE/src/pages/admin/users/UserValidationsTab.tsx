import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import axiosInstance from '../../../services/axiosInstance';
import { UCARD, ULABEL, UHEADER, UBORDER_B, UBORDER_T, UPANEL, UDIVIDE, UROW_HOVER, USKELETON, UICON_BTN, UMINT } from './userTheme';

interface Validation {
  id: string;
  email: string;
  status: string;
  score?: number;
  created_at: string;
  validation_type?: string;
}

interface Props {
  userId: string;
}

const PAGE_SIZE = 15;

const UserValidationsTab: React.FC<Props> = ({ userId }) => {
  const [validations, setValidations] = useState<Validation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/admin/validations/', {
          params: { user_id: userId, page: p, page_size: PAGE_SIZE },
        });
        const data = res.data;
        if (Array.isArray(data)) {
          setValidations(data);
          setTotal(data.length);
        } else {
          setValidations(data?.results ?? []);
          setTotal(data?.count ?? 0);
        }
      } catch {
        setValidations([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    fetch(page);
  }, [fetch, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const valid = validations.filter((v) => v.status === 'valid' || v.status === 'completed').length;
  const invalid = validations.filter((v) => v.status === 'invalid' || v.status === 'failed').length;
  const pending = validations.filter((v) => v.status === 'pending' || v.status === 'processing').length;

  const scoreColor = (s?: number) =>
    s === undefined
      ? 'text-gray-400 dark:text-[#3b4a41]'
      : s >= 80
        ? UMINT
        : s >= 50
          ? 'text-amber-600 dark:text-[#f59e0b]'
          : 'text-red-600 dark:text-[#ff4c4c]';

  const statusIcon = (status: string) => {
    if (status === 'valid' || status === 'completed') return <CheckCircle className={`w-3 h-3 ${UMINT}`} />;
    if (status === 'invalid' || status === 'failed') return <XCircle className="w-3 h-3 text-red-600 dark:text-[#ff4c4c]" />;
    return <Clock className="w-3 h-3 text-amber-600 dark:text-[#f59e0b]" />;
  };

  const statColors = [
    'text-gray-900 dark:text-[#e0e3e8]',
    UMINT,
    'text-red-600 dark:text-[#ff4c4c]',
    'text-amber-600 dark:text-[#f59e0b]',
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: total },
          { label: 'Valid', value: valid },
          { label: 'Invalid', value: invalid },
          { label: 'Pending', value: pending },
        ].map((s, i) => (
          <div key={s.label} className={`${UCARD} p-4 text-center`}>
            <p className={`font-['JetBrains_Mono',monospace] text-2xl font-bold ${statColors[i]}`}>{s.value}</p>
            <p className={`${ULABEL} mt-1`}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className={`${UCARD} overflow-hidden`}>
        <div className={`flex items-center justify-between px-4 py-3 ${UBORDER_B}`}>
          <p className={UHEADER}>Validation History</p>
          <button type="button" onClick={() => fetch(page)} disabled={loading} className={UICON_BTN}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`h-9 ${USKELETON} rounded animate-pulse`} />
            ))}
          </div>
        ) : validations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-mono text-xs text-gray-500 dark:text-[#3b4a41]">No validations found</p>
          </div>
        ) : (
          <>
            <div className={UDIVIDE}>
              <div className={`grid grid-cols-[1fr_120px_60px_80px_130px] gap-3 px-4 py-2 ${UPANEL}`}>
                {['Email', 'Type', 'Score', 'Status', 'Date'].map((h) => (
                  <span key={h} className={ULABEL}>
                    {h}
                  </span>
                ))}
              </div>
              {validations.map((v) => (
                <div
                  key={v.id}
                  className={`grid grid-cols-[1fr_120px_60px_80px_130px] gap-3 px-4 py-3 ${UROW_HOVER} transition-colors items-center`}
                >
                  <span className="font-mono text-[10px] text-gray-600 dark:text-[#bacbbf] truncate">{v.email}</span>
                  <span className="font-mono text-[9px] text-gray-400 dark:text-[#bacbbf]/50 uppercase tracking-[0.06em]">
                    {v.validation_type ?? 'standard'}
                  </span>
                  <span className={`font-mono text-[11px] font-bold ${scoreColor(v.score)}`}>
                    {v.score !== undefined ? v.score : '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    {statusIcon(v.status)}
                    <span className="font-mono text-[9px] text-gray-600 dark:text-[#bacbbf]/70 capitalize">{v.status}</span>
                  </span>
                  <span className="font-mono text-[9px] text-gray-500 dark:text-[#3b4a41]">
                    {new Date(v.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className={`flex items-center justify-between px-4 py-3 ${UBORDER_T} ${UPANEL}`}>
                <span className="font-mono text-[9px] text-gray-500 dark:text-[#3b4a41]">
                  Page {page} of {totalPages} · {total} total
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 border border-gray-300 dark:border-[#3b4a41]/40 rounded-sm text-gray-400 hover:text-emerald-600 dark:text-[#bacbbf]/40 dark:hover:text-[#6effc0] disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 border border-gray-300 dark:border-[#3b4a41]/40 rounded-sm text-gray-400 hover:text-emerald-600 dark:text-[#bacbbf]/40 dark:hover:text-[#6effc0] disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserValidationsTab;
