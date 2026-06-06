import React from 'react';
import {
  Mail,
  Upload,
  Loader2,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { VAL_CARD, VAL_CHROME, VAL_CHROME_TITLE, VAL_INSET } from './validationTheme';

interface ValidationFormProps {
  validationMode: 'single' | 'bulk';
  email: string;
  setEmail: (email: string) => void;
  bulkFile: File | null;
  setBulkFile: (file: File | null) => void;
  includeDetails: boolean;
  setIncludeDetails: (include: boolean) => void;
  loading: boolean;
  handleSingleValidate: (e: React.FormEvent) => void;
  handleBulkUpload: (e: React.FormEvent) => void;
  bulkTaskIds: string[];
  bulkStatus: any[];
  checkBulkStatus: () => void;
}

const ValidationForm: React.FC<ValidationFormProps> = ({
  validationMode,
  email,
  setEmail,
  bulkFile,
  setBulkFile,
  includeDetails,
  setIncludeDetails,
  loading,
  handleSingleValidate,
  handleBulkUpload,
  bulkTaskIds,
  bulkStatus,
  checkBulkStatus
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-[#6effc0]" />;
      case 'failed':
        return <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-[#ff4c4c]" />;
      case 'pending':
        return <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-[#f59e0b]" />;
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-gray-400 dark:text-[#bacbbf]/50" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-600 dark:text-[#6effc0]';
      case 'failed':
        return 'text-red-600 dark:text-[#ff4c4c]';
      case 'pending':
        return 'text-amber-600 dark:text-[#f59e0b]';
      default:
        return 'text-gray-400 dark:text-[#bacbbf]/50';
    }
  };

  return (
    <div className={VAL_CARD}>
      {/* Terminal chrome bar */}
      <div className={VAL_CHROME}>
        <span className="w-2 h-2 rounded-full bg-[#ff4c4c]/60" />
        <span className="w-2 h-2 rounded-full bg-[#f59e0b]/60" />
        <span className="w-2 h-2 rounded-full bg-emerald-500/60 dark:bg-[#6effc0]/60" />
        <span className={VAL_CHROME_TITLE}>
          {validationMode === 'single' ? 'single_email_probe.sh' : 'bulk_upload_job.sh'}
        </span>
      </div>

      <div className="p-5">
        {validationMode === 'single' ? (
          <form onSubmit={handleSingleValidate} className="space-y-4">
            <div>
              <label className="block font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[9px] text-gray-500 dark:text-[#bacbbf]/60 mb-1.5">
                Target Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-[#3b4a41]" />
                <input
                  type="email"
                  placeholder="user@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-sm font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-colors dark:bg-[#101418] dark:border-[#3b4a41]/40 dark:text-[#e0e3e8] dark:placeholder-[#3b4a41] dark:focus:border-[#6effc0]/50 dark:focus:ring-[#6effc0]/20"
                  required
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                role="switch"
                aria-checked={includeDetails}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIncludeDetails(!includeDetails);
                  }
                }}
                onClick={() => setIncludeDetails(!includeDetails)}
                className={`w-8 h-4 rounded-sm relative transition-colors cursor-pointer flex-shrink-0 ${
                  includeDetails
                    ? 'bg-emerald-100 border border-emerald-400 dark:bg-[#6effc0]/20 dark:border-[#6effc0]/40'
                    : 'bg-gray-100 border border-gray-300 dark:bg-[#101418] dark:border-[#3b4a41]/40'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 rounded-sm transition-all ${
                    includeDetails
                      ? 'left-4 bg-emerald-600 dark:bg-[#6effc0]'
                      : 'left-0.5 bg-gray-400 dark:bg-[#3b4a41]'
                  }`}
                />
              </div>
              <span className="font-mono text-[10px] text-gray-500 group-hover:text-gray-700 transition-colors uppercase tracking-[0.1em] dark:text-[#bacbbf]/60 dark:group-hover:text-[#bacbbf]">
                Include detailed breakdown
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-mono text-[10px] uppercase tracking-[0.2em] font-bold py-2.5 px-4 rounded-sm hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm dark:bg-[#6effc0] dark:text-[#003824] dark:hover:brightness-105 dark:shadow-[0_0_20px_rgba(110,255,192,0.15)]"
            >
              {loading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Probing…</>
              ) : (
                <><Play className="w-3.5 h-3.5" /> Run Validation</>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBulkUpload} className="space-y-4">
            <div>
              <label className="block font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[9px] text-gray-500 dark:text-[#bacbbf]/60 mb-1.5">
                Upload File (CSV or JSON)
              </label>
              <label
                htmlFor="bulk-file"
                className="flex flex-col items-center justify-center gap-2 border border-dashed border-gray-300 rounded-sm p-6 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all dark:border-[#3b4a41]/50 dark:hover:border-[#6effc0]/40 dark:hover:bg-[#6effc0]/5"
              >
                <Upload className="w-5 h-5 text-gray-400 dark:text-[#3b4a41]" />
                <span className="font-mono text-[10px] text-gray-500 text-center dark:text-[#bacbbf]/50">
                  {bulkFile ? (
                    <span className="text-emerald-700 dark:text-[#6effc0]">{bulkFile.name}</span>
                  ) : (
                    <>
                      Click to upload
                      <br />
                      <span className="text-[9px] text-gray-400 dark:text-[#3b4a41]">CSV or JSON · max 10 MB</span>
                    </>
                  )}
                </span>
                <input
                  id="bulk-file"
                  type="file"
                  accept=".csv,application/json"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                role="switch"
                aria-checked={includeDetails}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIncludeDetails(!includeDetails);
                  }
                }}
                onClick={() => setIncludeDetails(!includeDetails)}
                className={`w-8 h-4 rounded-sm relative transition-colors cursor-pointer flex-shrink-0 ${
                  includeDetails
                    ? 'bg-emerald-100 border border-emerald-400 dark:bg-[#6effc0]/20 dark:border-[#6effc0]/40'
                    : 'bg-gray-100 border border-gray-300 dark:bg-[#101418] dark:border-[#3b4a41]/40'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 rounded-sm transition-all ${
                    includeDetails
                      ? 'left-4 bg-emerald-600 dark:bg-[#6effc0]'
                      : 'left-0.5 bg-gray-400 dark:bg-[#3b4a41]'
                  }`}
                />
              </div>
              <span className="font-mono text-[10px] text-gray-500 group-hover:text-gray-700 transition-colors uppercase tracking-[0.1em] dark:text-[#bacbbf]/60 dark:group-hover:text-[#bacbbf]">
                Include detailed breakdown
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !bulkFile}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-mono text-[10px] uppercase tracking-[0.2em] font-bold py-2.5 px-4 rounded-sm hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm dark:bg-[#6effc0] dark:text-[#003824] dark:hover:brightness-105 dark:shadow-[0_0_20px_rgba(110,255,192,0.15)]"
            >
              {loading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
              ) : (
                <><Upload className="w-3.5 h-3.5" /> Upload & Validate</>
              )}
            </button>
          </form>
        )}

        {/* Bulk job status */}
        {bulkTaskIds.length > 0 && (
          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-[#3b4a41]/30">
            <div className="flex items-center justify-between mb-3">
              <span className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[9px] text-gray-500 dark:text-[#bacbbf]/60">
                Bulk Jobs
              </span>
              <button
                type="button"
                onClick={checkBulkStatus}
                className="flex items-center gap-1 font-mono text-[9px] text-emerald-700 hover:text-emerald-800 transition-colors uppercase tracking-[0.1em] dark:text-[#6effc0] dark:hover:brightness-110"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
            <div className="space-y-2">
              {bulkStatus.map((status) => (
                <div
                  key={String(status.job_id ?? status.task_id ?? status.id)}
                  className={`flex items-center justify-between p-2.5 rounded-sm ${VAL_INSET}`}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.status)}
                    <span className="font-mono text-[10px] text-gray-900 dark:text-[#e0e3e8]">
                      Job {status.job_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[9px] uppercase tracking-[0.1em] ${statusColor(status.status)}`}>
                      {status.status}
                    </span>
                    <span className="font-mono text-[9px] text-gray-400 dark:text-[#3b4a41]">
                      {status.progress || 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationForm;
