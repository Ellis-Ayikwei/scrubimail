import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code } from 'lucide-react';

const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#F4F5F7] to-white dark:from-gray-900 dark:to-gray-800">
      {/* Low-poly background effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#2ED8A3]/20 to-[#004E8A]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-[#00C48C]/20 to-[#2ED8A3]/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#004E8A]/10 to-[#2ED8A3]/10 rounded-full blur-3xl"></div>
        
        {/* Low-poly shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-[#2ED8A3]/30 to-transparent transform rotate-45 blur-sm"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-bl from-[#004E8A]/30 to-transparent transform -rotate-12 blur-sm"></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-tr from-[#00C48C]/30 to-transparent transform rotate-30 blur-sm"></div>
        <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-gradient-to-tl from-[#2ED8A3]/30 to-transparent transform -rotate-45 blur-sm"></div>
        
        {/* Additional geometric shapes */}
        <div className="absolute top-1/3 left-1/3 w-16 h-16 bg-gradient-to-r from-[#004E8A]/20 to-[#2ED8A3]/20 transform rotate-12 blur-sm"></div>
        <div className="absolute top-2/3 right-1/4 w-12 h-12 bg-gradient-to-l from-[#00C48C]/20 to-[#2ED8A3]/20 transform -rotate-30 blur-sm"></div>
        <div className="absolute bottom-1/3 left-1/2 w-18 h-18 bg-gradient-to-b from-[#004E8A]/20 to-[#00C48C]/20 transform rotate-60 blur-sm"></div>
      </div>

      <div className="relative mx-auto px-4  sm:px-6 lg:pl-8 lg:pr-0 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-left">
            <h1 className="text-5xl md:text-6xl font-bold text-[#333333] dark:text-white mb-6">
              The Most Advanced
              <span className="bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] bg-clip-text text-transparent"> Email Validation</span>
              <br />
              Platform
            </h1>
            <p className="text-xl text-[#333333]/70 dark:text-gray-300 mb-8">
              Validate emails in real-time with 99.9% accuracy. Detect disposable emails, 
              catch-all domains, and spam traps with our enterprise-grade validation API.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] text-white font-semibold rounded-lg hover:from-[#00C48C] hover:to-[#2ED8A3] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/api-docs"
                className="inline-flex items-center px-8 py-4 border-2 border-[#004E8A] text-[#004E8A] dark:text-[#2ED8A3] font-semibold rounded-lg hover:bg-[#004E8A] hover:text-white dark:hover:bg-[#2ED8A3] transition-all duration-200"
              >
                <Code className="w-5 h-5 mr-2" />
                View API Docs
              </Link>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#333333] dark:text-white mb-1">10M+</div>
                <div className="text-sm text-[#333333]/70 dark:text-gray-400">Emails Validated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#333333] dark:text-white mb-1">99.9%</div>
                <div className="text-sm text-[#333333]/70 dark:text-gray-400">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#333333] dark:text-white mb-1">500ms</div>
                <div className="text-sm text-[#333333]/70 dark:text-gray-400">Response Time</div>
              </div>
            </div>
          </div>

          {/* Right Content - Computer Screen with API Logs */}
          <div className="relative">
            <div className="relative mx-auto max-w-2xl transform translate-x-8">
              {/* Computer Monitor Frame */}
              <div className="relative bg-gray-800 rounded-lg p-4 shadow-2xl transform rotate-3 translate-x-8 translate-y-4 -mr-8">
                {/* Screen */}
                <div className="bg-black rounded-lg p-2">
                  <div className="bg-gray-900 rounded-lg p-6 h-96 overflow-hidden">
                    {/* Terminal Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="text-gray-400 text-sm font-mono">Terminal</div>
                    </div>
                    
                    {/* API Logs Content */}
                    <div className="font-mono text-sm text-green-400 space-y-2">
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">$</span>
                        <span>curl -X POST https://api.scrubimail.com/v1/validate</span>
                      </div>
                      <div className="text-gray-300 ml-4">
                        -H "Authorization: Bearer YOUR_API_KEY"
                      </div>
                      <div className="text-gray-300 ml-4">
                        -H "Content-Type: application/json"
                      </div>
                      <div className="text-gray-300 ml-4">
                        -d &apos;&#123;&quot;email&quot;: &quot;user@example.com&quot;&#125;&apos;
                      </div>
                      <div className="mt-4"></div>
                      <div className="text-blue-400">&#123;</div>
                      <div className="text-gray-300 ml-4">"email": "user@example.com",</div>
                      <div className="text-gray-300 ml-4">"valid": true,</div>
                      <div className="text-gray-300 ml-4">"score": 0.95,</div>
                      <div className="text-gray-300 ml-4">"disposable": false,</div>
                      <div className="text-gray-300 ml-4">"catch_all": false,</div>
                      <div className="text-gray-300 ml-4">"role": false,</div>
                      <div className="text-gray-300 ml-4">"domain": "example.com",</div>
                      <div className="text-gray-300 ml-4">"mx_record": true,</div>
                      <div className="text-gray-300 ml-4">"smtp_check": true,</div>
                      <div className="text-blue-400">&#125;</div>
                      <div className="mt-4"></div>
                      <div className="text-green-400">✓ Validation completed in 245ms</div>
                      <div className="text-green-400">✓ Credits remaining: 9,847</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-[#00C48C] rounded-full opacity-30 animate-bounce"></div>
              <div className="absolute top-1/2 -right-8 w-12 h-12 bg-[#2ED8A3] rounded-full opacity-25 animate-ping"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 