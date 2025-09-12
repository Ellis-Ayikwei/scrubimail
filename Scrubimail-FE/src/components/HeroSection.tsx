import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, Mail, CheckCircle, Search, Zap, Shield } from 'lucide-react';

const HeroSection: React.FC = () => {
  const [demoEmail, setDemoEmail] = useState('');
  const [demoResult, setDemoResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleDemoValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoEmail.trim()) return;

    setIsValidating(true);
    
    // Simulate API call with realistic delay
    setTimeout(() => {
      const mockResult = {
        email: demoEmail,
        is_valid: demoEmail.includes('@') && demoEmail.includes('.'),
        score: Math.floor(Math.random() * 30) + 70,
        verdict: demoEmail.includes('@') && demoEmail.includes('.') ? 'Valid' : 'Invalid',
        breakdown: {
          syntax: { valid: demoEmail.includes('@') },
          dns: { valid: true, score: 95 },
          smtp: { valid: true, catch_all: false },
          reputation: { reputation_score: 85 }
        },
        validation_time: Math.random() * 0.5 + 0.2
      };
      setDemoResult(mockResult);
      setIsValidating(false);
    }, 1200);
  };

  return (
    <section className="relative overflow-hidden bg-white dark:bg-gray-900 min-h-screen flex items-center">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(46,216,163,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(46,216,163,0.1),transparent_50%)]"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal text-gray-900 dark:text-white mb-8 leading-tight">
            Validate emails with
            <span className="block text-[#2ED8A3] font-medium">professional precision</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-12 font-light leading-relaxed">
            Enterprise-grade email validation API trusted by developers worldwide. 
            Clean your lists, improve deliverability, and protect your sender reputation.
          </p>

          {/* Interactive Demo */}
          <div className="max-w-2xl mx-auto mb-16">
            <form onSubmit={handleDemoValidation} className="relative">
              <div className="relative flex items-center bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-2 hover:shadow-xl transition-shadow duration-300">
                <Mail className="w-6 h-6 text-gray-400 ml-4" />
                <input
                  type="email"
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  placeholder="Enter an email to validate instantly..."
                  className="flex-1 px-4 py-4 text-lg bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500"
                />
                <button
                  type="submit"
                  disabled={isValidating || !demoEmail.trim()}
                  className="bg-[#2ED8A3] hover:bg-[#00C48C] text-white px-8 py-4 rounded-full font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isValidating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Validating...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Validate
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Demo Result */}
            {demoResult && (
              <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-left">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {demoResult.is_valid ? (
                      <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-red-500 mr-3 flex items-center justify-center">
                        <span className="text-white text-sm">✕</span>
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{demoResult.email}</div>
                      <div className={`text-sm ${demoResult.is_valid ? 'text-green-600' : 'text-red-600'}`}>
                        {demoResult.verdict} • Score: {demoResult.score}/100
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {demoResult.validation_time.toFixed(2)}s
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className={`font-medium ${demoResult.breakdown.syntax.valid ? 'text-green-600' : 'text-red-600'}`}>
                      {demoResult.breakdown.syntax.valid ? '✓' : '✗'}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Syntax</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-medium ${demoResult.breakdown.dns.valid ? 'text-green-600' : 'text-red-600'}`}>
                      {demoResult.breakdown.dns.valid ? '✓' : '✗'}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">DNS</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-medium ${demoResult.breakdown.smtp.valid ? 'text-green-600' : 'text-red-600'}`}>
                      {demoResult.breakdown.smtp.valid ? '✓' : '✗'}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">SMTP</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-blue-600">{demoResult.breakdown.reputation.reputation_score}</div>
                    <div className="text-gray-600 dark:text-gray-400">Reputation</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 bg-[#2ED8A3] text-white font-medium rounded-full hover:bg-[#00C48C] transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Get started for free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/api-docs"
              className="inline-flex items-center px-8 py-4 text-gray-700 dark:text-gray-300 font-medium rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <Code className="w-5 h-5 mr-2" />
              View documentation
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Trusted by 10,000+ developers worldwide
            </p>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4">
              <div className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
                <Zap className="w-4 h-4 mr-2 text-[#2ED8A3]" />
                Real-time validation
              </div>
              <div className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
                <Shield className="w-4 h-4 mr-2 text-[#2ED8A3]" />
                99.9% accuracy
              </div>
              <div className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
                <Code className="w-4 h-4 mr-2 text-[#2ED8A3]" />
                RESTful API
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-light text-gray-900 dark:text-white mb-2">50M+</div>
            <div className="text-gray-600 dark:text-gray-400">Emails validated monthly</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-light text-gray-900 dark:text-white mb-2">&lt;300ms</div>
            <div className="text-gray-600 dark:text-gray-400">Average response time</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-light text-gray-900 dark:text-white mb-2">99.9%</div>
            <div className="text-gray-600 dark:text-gray-400">Uptime SLA</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 