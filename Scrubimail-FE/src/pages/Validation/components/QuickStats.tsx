import React from 'react';
import { BarChart3 } from 'lucide-react';

const QuickStats: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-[#333333] dark:text-white mb-4 flex items-center">
        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#2ED8A3]" />
        Quick Stats
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-[#2ED8A3]">1,247</div>
          <div className="text-xs sm:text-sm text-[#333333]/70 dark:text-gray-400">Validations Today</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-[#333333] dark:text-white">98.5%</div>
          <div className="text-xs sm:text-sm text-[#333333]/70 dark:text-gray-400">Success Rate</div>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;
