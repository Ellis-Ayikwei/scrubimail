import React from 'react';
import { FileText, Download, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VAL_CARD, VAL_CHROME, VAL_CHROME_TITLE, VAL_INSET } from './validationTheme';

const HelpCard: React.FC = () => {
  return (
    <div className={VAL_CARD}>
      <div className={VAL_CHROME}>
        <span className="w-2 h-2 rounded-full bg-[#ff4c4c]/60" />
        <span className="w-2 h-2 rounded-full bg-[#f59e0b]/60" />
        <span className="w-2 h-2 rounded-full bg-emerald-500/60 dark:bg-[#6effc0]/60" />
        <span className={VAL_CHROME_TITLE}>resources.sh</span>
      </div>

      <div className="p-5 space-y-3">
        <div>
          <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.2em] text-[9px] text-emerald-600 dark:text-[#6effc0] mb-1">
            Resources
          </p>
          <p className="font-mono text-[10px] text-gray-500 leading-relaxed dark:text-[#bacbbf]/50">
            Learn how to interpret validation results and integrate with the API.
          </p>
        </div>

        <div className="space-y-2">
          <Link
            to="/api-docs"
            className={`flex items-center justify-between p-3 rounded-sm hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group dark:hover:border-[#6effc0]/30 dark:hover:bg-[#6effc0]/5 ${VAL_INSET}`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 transition-colors dark:text-[#3b4a41] dark:group-hover:text-[#6effc0]" />
              <span className="font-mono text-[10px] text-gray-600 group-hover:text-gray-900 transition-colors dark:text-[#bacbbf]/70 dark:group-hover:text-[#e0e3e8]">
                API Documentation
              </span>
            </div>
            <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-emerald-600 transition-colors dark:text-[#3b4a41] dark:group-hover:text-[#6effc0]" />
          </Link>

          <a
            href="/sample_emails.csv"
            download
            className={`flex items-center justify-between p-3 rounded-sm hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group dark:hover:border-[#6effc0]/30 dark:hover:bg-[#6effc0]/5 ${VAL_INSET}`}
          >
            <div className="flex items-center gap-2">
              <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 transition-colors dark:text-[#3b4a41] dark:group-hover:text-[#6effc0]" />
              <span className="font-mono text-[10px] text-gray-600 group-hover:text-gray-900 transition-colors dark:text-[#bacbbf]/70 dark:group-hover:text-[#e0e3e8]">
                Download Sample File
              </span>
            </div>
            <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-emerald-600 transition-colors dark:text-[#3b4a41] dark:group-hover:text-[#6effc0]" />
          </a>
        </div>

        {/* Score legend */}
        <div className="border-t border-gray-200 pt-3 dark:border-[#3b4a41]/30">
          <p className="font-['Space_Grotesk',sans-serif] uppercase tracking-[0.15em] text-[9px] text-gray-400 dark:text-[#bacbbf]/40 mb-2">
            Score Guide
          </p>
          <div className="space-y-1">
            {[
              {
                range: '80 – 100',
                label: 'Valid',
                color: 'text-emerald-600 dark:text-[#6effc0]',
                dot: 'bg-emerald-500 dark:bg-[#6effc0]',
              },
              {
                range: '50 – 79',
                label: 'Risky',
                color: 'text-amber-600 dark:text-[#f59e0b]',
                dot: 'bg-amber-500 dark:bg-[#f59e0b]',
              },
              {
                range: '0 – 49',
                label: 'Invalid',
                color: 'text-red-600 dark:text-[#ff4c4c]',
                dot: 'bg-red-500 dark:bg-[#ff4c4c]',
              },
            ].map((item) => (
              <div key={item.range} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                  <span className={`font-mono text-[9px] ${item.color}`}>{item.label}</span>
                </div>
                <span className="font-mono text-[9px] text-gray-400 dark:text-[#3b4a41]">{item.range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCard;
