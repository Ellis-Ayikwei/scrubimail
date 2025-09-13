import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, Mail, CheckCircle, Search, Zap, Shield, Star, TrendingUp, Globe, Users, Clock } from 'lucide-react';

const HeroSection: React.FC = () => {
  const [demoEmail, setDemoEmail] = useState('');
  const [demoResult, setDemoResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [currentStat, setCurrentStat] = useState(0);
  const [typedText, setTypedText] = useState('');

  const stats = [
    { number: '50M+', label: 'emails validated monthly' },
    { number: '<300ms', label: 'average response time' },
    { number: '99.9%', label: 'uptime guarantee' },
    { number: '10K+', label: 'developers trust us' }
  ];

  const typewriterTexts = [
    'professional precision',
    'lightning speed',
    'enterprise reliability',
    'developer confidence'
  ];

  // Typewriter effect
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const text = typewriterTexts[currentStat % typewriterTexts.length];
    
    if (typedText.length < text.length) {
      timeout = setTimeout(() => {
        setTypedText(text.slice(0, typedText.length + 1));
      }, 100);
    } else {
      timeout = setTimeout(() => {
        setTypedText('');
        setCurrentStat(prev => prev + 1);
      }, 2000);
    }

    return () => clearTimeout(timeout);
  }, [typedText, currentStat]);

  const handleDemoValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoEmail.trim()) return;

    setIsValidating(true);
    
    // Simulate realistic API call
    setTimeout(() => {
      const isValid = demoEmail.includes('@') && demoEmail.includes('.') && demoEmail.split('@')[1].includes('.');
      const mockResult = {
        email: demoEmail,
        is_valid: isValid,
        score: isValid ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 40) + 10,
        verdict: isValid ? 'Deliverable' : 'Undeliverable',
        breakdown: {
          syntax: { valid: demoEmail.includes('@'), score: demoEmail.includes('@') ? 100 : 0 },
          dns: { valid: isValid, score: isValid ? 95 : 0 },
          smtp: { valid: isValid, catch_all: false, score: isValid ? 90 : 0 },
          reputation: { reputation_score: isValid ? 85 : 30 },
          role_based: { is_role_based: ['admin', 'support', 'info', 'contact'].some(role => demoEmail.toLowerCase().includes(role)) }
        },
        validation_time: Math.random() * 0.3 + 0.15,
        suggestions: !isValid && demoEmail.includes('@') ? [`Did you mean ${demoEmail.replace(/\.(co|cm|om)$/, '.com')}?`] : []
      };
      setDemoResult(mockResult);
      setIsValidating(false);
    }, 800 + Math.random() * 400);
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-900/50 dark:to-gray-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Floating particles */}
        <div className="absolute top-20 left-[10%] w-2 h-2 bg-[#2ED8A3]/30 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-[15%] w-1 h-1 bg-blue-400/40 rounded-full animate-ping"></div>
        <div className="absolute top-60 left-[20%] w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-pulse"></div>
        <div className="absolute bottom-40 right-[25%] w-2 h-2 bg-[#2ED8A3]/20 rounded-full animate-bounce"></div>
        <div className="absolute bottom-60 left-[30%] w-1 h-1 bg-blue-300/40 rounded-full animate-ping"></div>
        
        {/* Gradient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-[#2ED8A3]/5 to-blue-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-l from-purple-500/5 to-[#2ED8A3]/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        {/* Trust indicators at top */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="flex items-center mr-3">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rated 5.0 by 10,000+ developers
            </span>
          </div>
        </div>

        <div className="text-center max-w-5xl mx-auto mb-16">
          {/* Dynamic headline with typewriter */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 dark:text-white mb-8 leading-tight tracking-tight">
            Validate emails with
            <br />
            <span className="text-[#2ED8A3] font-medium relative">
              {typedText}
              <span className="animate-pulse">|</span>
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-16 font-light leading-relaxed max-w-4xl mx-auto">
            The most advanced email validation API trusted by industry leaders. 
            <br className="hidden sm:block" />
            Improve deliverability, reduce bounces, and protect your sender reputation with real-time validation.
          </p>

          {/* Enhanced Interactive Demo */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Try it now</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Enter any email address to see instant validation results</p>
              </div>
              
              <form onSubmit={handleDemoValidation} className="relative mb-6">
                <div className="relative flex items-center bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-700 p-3 hover:border-[#2ED8A3]/30 transition-all duration-300 focus-within:border-[#2ED8A3]/50 focus-within:shadow-xl">
                  <Mail className="w-6 h-6 text-gray-400 ml-3" />
                  <input
                    type="email"
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    placeholder="john.doe@company.com"
                    className="flex-1 px-4 py-4 text-lg bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={isValidating || !demoEmail.trim()}
                    className="bg-gradient-to-r from-[#2ED8A3] to-[#00C48C] hover:from-[#00C48C] hover:to-[#2ED8A3] text-white px-8 py-4 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {isValidating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Validating...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Validate Email
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Enhanced Demo Result */}
              {demoResult && (
                <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-inner">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                        demoResult.is_valid 
                          ? 'bg-green-100 dark:bg-green-900/20' 
                          : 'bg-red-100 dark:bg-red-900/20'
                      }`}>
                        {demoResult.is_valid ? (
                          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">✕</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white text-lg">{demoResult.email}</div>
                        <div className={`text-sm font-medium ${
                          demoResult.is_valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {demoResult.verdict} • Confidence: {demoResult.score}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{demoResult.score}%</div>
                      <div className="text-sm text-gray-500">{demoResult.validation_time.toFixed(3)}s</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    {[
                      { label: 'Syntax', value: demoResult.breakdown.syntax.valid, score: demoResult.breakdown.syntax.score },
                      { label: 'DNS', value: demoResult.breakdown.dns.valid, score: demoResult.breakdown.dns.score },
                      { label: 'SMTP', value: demoResult.breakdown.smtp.valid, score: demoResult.breakdown.smtp.score },
                      { label: 'Reputation', value: demoResult.breakdown.reputation.reputation_score > 50, score: demoResult.breakdown.reputation.reputation_score },
                      { label: 'Role-based', value: !demoResult.breakdown.role_based.is_role_based, score: demoResult.breakdown.role_based.is_role_based ? 0 : 100 }
                    ].map((check, index) => (
                      <div key={index} className="text-center p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className={`text-2xl font-bold mb-1 ${check.value ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {check.value ? '✓' : '✗'}
                        </div>
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{check.label}</div>
                        <div className="text-xs text-gray-500">{check.score}%</div>
                      </div>
                    ))}
                  </div>

                  {demoResult.suggestions.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Suggestions:</div>
                      {demoResult.suggestions.map((suggestion: string, index: number) => (
                        <div key={index} className="text-sm text-blue-700 dark:text-blue-300">{suggestion}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced CTA Section */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <Link
              to="/register"
              className="group inline-flex items-center px-10 py-5 bg-gradient-to-r from-[#2ED8A3] to-[#00C48C] text-white font-semibold rounded-2xl hover:from-[#00C48C] hover:to-[#2ED8A3] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Start validating for free
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/api-docs"
              className="inline-flex items-center px-10 py-5 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-300"
            >
              <Code className="w-5 h-5 mr-3" />
              Explore API docs
            </Link>
          </div>

          {/* Social proof logos */}
          <div className="mb-20">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium">
              Trusted by leading companies worldwide
            </p>
            <div className="flex items-center justify-center space-x-12 opacity-60 dark:opacity-40">
              {/* Mock company logos */}
              <div className="w-24 h-8 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-md"></div>
              <div className="w-20 h-8 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-md"></div>
              <div className="w-28 h-8 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-md"></div>
              <div className="w-22 h-8 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-md"></div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-lg">
                <div className="text-3xl lg:text-4xl font-light text-gray-900 dark:text-white mb-3 group-hover:text-[#2ED8A3] transition-colors">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature highlights */}
        <div className="flex flex-wrap justify-center gap-4 mt-16">
          {[
            { icon: Zap, text: 'Lightning fast' },
            { icon: Shield, text: '99.9% accurate' },
            { icon: Globe, text: 'Global coverage' },
            { icon: Code, text: 'Developer friendly' },
            { icon: Users, text: '24/7 support' },
            { icon: TrendingUp, text: 'Real-time analytics' }
          ].map((feature, index) => (
            <div key={index} className="inline-flex items-center px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full text-sm text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300">
              <feature.icon className="w-4 h-4 mr-2 text-[#2ED8A3]" />
              {feature.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 