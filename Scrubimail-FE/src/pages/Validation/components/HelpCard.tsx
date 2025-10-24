import React from 'react';
import { Zap, FileText, Download } from 'lucide-react';

const HelpCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-[#333333] dark:text-white mb-4 flex items-center">
        <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#2ED8A3]" />
        Need Help?
      </h3>
      <p className="text-xs sm:text-sm text-[#333333]/70 dark:text-gray-400 mb-4">
        Learn more about our validation process and how to interpret results.
      </p>
      <div className="space-y-2">
        <button className="w-full flex items-center justify-between p-2 sm:p-3 bg-[#F4F5F7] dark:bg-gray-700 rounded hover:bg-[#2ED8A3]/10 transition-colors">
          <span className="text-xs sm:text-sm text-[#333333] dark:text-white">View API Documentation</span>
          <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-[#2ED8A3]" />
        </button>
        <button className="w-full flex items-center justify-between p-2 sm:p-3 bg-[#F4F5F7] dark:bg-gray-700 rounded hover:bg-[#2ED8A3]/10 transition-colors">
          <span className="text-xs sm:text-sm text-[#333333] dark:text-white">Download Sample Files</span>
          <Download className="w-3 h-3 sm:w-4 sm:h-4 text-[#2ED8A3]" />
        </button>
      </div>
    </div>
  );
};

export default HelpCard;
