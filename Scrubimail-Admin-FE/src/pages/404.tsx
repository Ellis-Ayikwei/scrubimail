import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, Mail } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4">
      <div className="max-w-lg mx-auto text-center">
        
        {/* 404 Animation */}
        <div className="relative mb-8">
          <div className="text-9xl font-bold text-[#21262d] select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-[#10B981]/10 rounded-full flex items-center justify-center animate-pulse">
              <Mail className="w-12 h-12 text-[#10B981]" />
            </div>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Page Not Found
        </h1>
        <p className="text-lg text-[#7d8590] mb-8">
          Sorry, we couldn't find the page you're looking for. 
          The page might have been moved, deleted, or doesn't exist.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-[#10B981] text-white font-medium rounded-3xl hover:bg-[#059669] transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-6 py-3 text-white border border-[#30363d] rounded-3xl hover:bg-[#21262d] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Search Suggestion */}
        <div className="mt-12 p-6 bg-[#161b22] rounded-3xl border border-[#30363d]">
          <h3 className="text-lg font-medium text-white mb-3">Looking for something specific?</h3>
          <div className="flex space-x-4">
            <Link
              to="/validate"
              className="flex-1 p-3 bg-[#21262d] rounded-3xl text-center text-[#7d8590] hover:text-white hover:bg-[#30363d] transition-colors"
            >
              Email Validation
            </Link>
            <Link
              to="/api-docs"
              className="flex-1 p-3 bg-[#21262d] rounded-3xl text-center text-[#7d8590] hover:text-white hover:bg-[#30363d] transition-colors"
            >
              API Docs
            </Link>
            <Link
              to="/help"
              className="flex-1 p-3 bg-[#21262d] rounded-3xl text-center text-[#7d8590] hover:text-white hover:bg-[#30363d] transition-colors"
            >
              Help Center
            </Link>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-sm text-[#7d8590]">
          Still need help?{' '}
          <Link to="/contact" className="text-[#10B981] hover:underline">
            Contact our support team
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;