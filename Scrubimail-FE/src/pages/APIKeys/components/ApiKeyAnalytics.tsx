import React from 'react';
import { BarChart3 } from 'lucide-react';

export const ApiKeyAnalytics: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Usage Analytics
      </h3>
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Analytics dashboard coming soon
        </p>
      </div>
    </div>
  );
};
