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
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <>
      {validationMode === 'single' ? (
        /* Single Email Validation */
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-[#333333] dark:text-white mb-4 flex items-center">
            <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#2ED8A3]" />
            Single Email Validation
          </h2>
          
          <form onSubmit={handleSingleValidate} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#333333]/50" />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter email address to validate"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white text-sm sm:text-base"
                  required
                />
              </div>
            </div>
            
            {/* Details Checkbox */}
            <div className="flex items-center space-x-3">
              <input
                id="includeDetails"
                type="checkbox"
                checked={includeDetails}
                onChange={(e) => setIncludeDetails(e.target.checked)}
                className="w-4 h-4 text-[#2ED8A3] bg-gray-100 border-gray-300 rounded focus:ring-[#2ED8A3] focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="includeDetails" className="text-sm font-medium text-[#333333] dark:text-gray-300 flex items-center">
                <span className="w-4 h-4 mr-2 text-[#2ED8A3]">👁️</span>
                Include detailed breakdown
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center space-x-2 bg-[#2ED8A3] text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold hover:bg-[#00C48C] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Validate Email</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Bulk Email Validation */
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-[#333333] dark:text-white mb-4 flex items-center">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#2ED8A3]" />
            Bulk Email Validation
          </h2>
          
          <form onSubmit={handleBulkUpload} className="space-y-4">
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                Upload File
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 sm:p-6 text-center hover:border-[#2ED8A3] transition-colors">
                <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-[#333333]/50 mx-auto mb-2" />
                <input
                  id="file"
                  type="file"
                  accept=".csv,application/json"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="file" className="cursor-pointer">
                  <p className="text-xs sm:text-sm text-[#333333] dark:text-gray-400 mb-2">
                    {bulkFile ? bulkFile.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-[#333333]/50 dark:text-gray-500">
                    CSV or JSON files up to 10MB
                  </p>
                </label>
              </div>
            </div>
            
            {/* Details Checkbox */}
            <div className="flex items-center space-x-3">
              <input
                id="includeDetailsBulk"
                type="checkbox"
                checked={includeDetails}
                onChange={(e) => setIncludeDetails(e.target.checked)}
                className="w-4 h-4 text-[#2ED8A3] bg-gray-100 border-gray-300 rounded focus:ring-[#2ED8A3] focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="includeDetailsBulk" className="text-sm font-medium text-[#333333] dark:text-gray-300 flex items-center">
                <span className="w-4 h-4 mr-2 text-[#2ED8A3]">👁️</span>
                Include detailed breakdown
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading || !bulkFile}
              className="w-full flex items-center justify-center space-x-2 bg-[#2ED8A3] text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold hover:bg-[#00C48C] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Upload & Validate</span>
                </>
              )}
            </button>
          </form>

          {/* Bulk Status */}
          {bulkTaskIds.length > 0 && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-[#333333] dark:text-white text-sm sm:text-base">Bulk Jobs</h3>
                <button
                  onClick={checkBulkStatus}
                  className="flex items-center space-x-1 text-[#2ED8A3] hover:text-[#00C48C] transition-colors text-xs sm:text-sm"
                >
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Refresh</span>
                </button>
              </div>
              <div className="space-y-2">
                {bulkStatus.map((status, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(status.status)}
                      <span className="text-xs sm:text-sm text-[#333333] dark:text-white">
                        Job {status.job_id}
                      </span>
                    </div>
                    <span className="text-xs text-[#333333]/50 dark:text-gray-400">
                      {status.progress || 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ValidationForm;
