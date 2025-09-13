import React from 'react';

const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-24 bg-[#F4F5F7] dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-[#333333]/70 dark:text-gray-300 max-w-2xl mx-auto">
            Simple integration, powerful results. Get started in minutes with our straightforward API.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold text-[#333333] dark:text-white mb-2">
              Get Your API Key
            </h3>
            <p className="text-[#333333]/70 dark:text-gray-400">
              Sign up and get your unique API key instantly
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold text-[#333333] dark:text-white mb-2">
              Make API Calls
            </h3>
            <p className="text-[#333333]/70 dark:text-gray-400">
              Send emails to our validation endpoint
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold text-[#333333] dark:text-white mb-2">
              Get Results
            </h3>
            <p className="text-[#333333]/70 dark:text-gray-400">
              Receive detailed validation results instantly
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection; 