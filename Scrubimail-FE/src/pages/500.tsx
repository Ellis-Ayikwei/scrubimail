import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Home, AlertTriangle, Mail } from 'lucide-react';

const ServerError: React.FC = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4">
      <div className="max-w-lg mx-auto text-center">
        
        {/* Error Animation */}
        <div className="relative mb-8">
          <div className="text-9xl font-bold text-[#21262d] select-none">500</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Server Error
        </h1>
        <p className="text-lg text-[#7d8590] mb-8">
          Oops! Something went wrong on our end. Our team has been notified and 
          is working to fix this issue. Please try again in a few minutes.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-6 py-3 bg-[#10B981] text-white font-medium rounded-3xl hover:bg-[#059669] transition-colors"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </button>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 text-white border border-[#30363d] rounded-3xl hover:bg-[#21262d] transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Link>
        </div>

        {/* Status Information */}
        <div className="mt-12 p-6 bg-[#161b22] rounded-3xl border border-[#30363d]">
          <h3 className="text-lg font-medium text-white mb-3">What happened?</h3>
          <div className="text-left space-y-2 text-sm text-[#7d8590]">
            <p>• Our servers are experiencing temporary difficulties</p>
            <p>• Your data is safe and secure</p>
            <p>• We're working to resolve this quickly</p>
            <p>• No action is required on your part</p>
          </div>
        </div>

        {/* Service Status */}
        <div className="mt-8 p-4 bg-[#21262d] rounded-3xl border border-[#30363d]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#7d8590]">Service Status:</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-yellow-500">Investigating</span>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-sm text-[#7d8590]">
          Need immediate assistance?{' '}
          <Link to="/contact" className="text-[#10B981] hover:underline">
            Contact our support team
          </Link>
          {' '}or check our{' '}
          <a href="#" className="text-[#10B981] hover:underline">
            status page
          </a>
        </div>
      </div>
    </div>
  );
};

export default ServerError;