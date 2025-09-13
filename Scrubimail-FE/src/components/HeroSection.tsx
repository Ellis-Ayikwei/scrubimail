import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, Mail, CheckCircle, Search, Zap, Shield, Star, TrendingUp, Globe, Users, Clock, BarChart3, XCircle, AlertTriangle, Eye, Layers, Database, Activity } from 'lucide-react';

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
    <section className="relative min-h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* GitHub-inspired background with subtle tech patterns */}
      <div className="absolute inset-0">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(30,58,138,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(30,58,138,0.03)_1px,transparent_1px)] bg-[size:64px_64px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]"></div>
        
        {/* Floating email icons and elements */}
        <div className="absolute top-20 left-[8%] opacity-60 animate-float-slow">
          <div className="w-12 h-12 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-lg flex items-center justify-center shadow-lg">
            <Mail className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="absolute top-32 right-[12%] opacity-40 animate-float-medium">
          <div className="w-10 h-10 bg-gradient-to-br from-[#1E3A8A] to-[#1E40AF] rounded-lg flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
        </div>
        
        <div className="absolute top-48 left-[15%] opacity-50 animate-float-fast">
          <div className="w-8 h-8 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        </div>
        
        <div className="absolute bottom-40 right-[20%] opacity-60 animate-float-slow">
          <div className="w-14 h-14 bg-gradient-to-br from-[#1E3A8A] to-[#1E40AF] rounded-xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
        </div>
        
        <div className="absolute bottom-60 left-[25%] opacity-45 animate-float-medium">
          <div className="w-6 h-6 bg-gradient-to-br from-[#EF4444] to-[#DC2626] rounded-lg flex items-center justify-center shadow-lg">
            <XCircle className="w-3 h-3 text-white" />
          </div>
        </div>
        
        {/* Data flow lines */}
        <div className="absolute top-1/4 left-1/4 w-32 h-px bg-gradient-to-r from-[#10B981]/20 to-transparent animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-px bg-gradient-to-l from-[#1E3A8A]/20 to-transparent animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-28 h-px bg-gradient-to-r from-[#10B981]/20 to-transparent animate-pulse delay-2000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
        
        {/* GitHub-inspired two-column layout */}
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
          
          {/* Left Column - Content */}
          <div className="space-y-8">
            
            {/* Trust badge */}
            <div className="inline-flex items-center px-3 py-1 bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/20 rounded-full border border-[#1E3A8A]/10 dark:border-[#1E3A8A]/30">
              <div className="flex items-center mr-2">
                <Star className="w-3 h-3 text-[#10B981] fill-current" />
                <Star className="w-3 h-3 text-[#10B981] fill-current" />
                <Star className="w-3 h-3 text-[#10B981] fill-current" />
                <Star className="w-3 h-3 text-[#10B981] fill-current" />
                <Star className="w-3 h-3 text-[#10B981] fill-current" />
              </div>
              <span className="text-xs font-medium text-[#1E3A8A] dark:text-[#60A5FA]">
                Trusted by 10K+ developers
              </span>
            </div>

            {/* Main headline */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-gray-900 dark:text-white leading-tight mb-6">
                Emails flowing safely
                <br />
                into <span className="text-[#10B981] relative">
                  inboxes
                  <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-[#10B981] to-[#059669] rounded-full"></div>
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">
                Validate email addresses with professional precision. Our advanced API ensures your messages reach real inboxes, protecting your sender reputation and boosting deliverability.
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#10B981] text-white font-medium rounded-lg hover:bg-[#059669] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Start validating for free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                to="/api-docs"
                className="inline-flex items-center justify-center px-6 py-3 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <Code className="w-4 h-4 mr-2" />
                View documentation
              </Link>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-6 pt-6">
              {stats.slice(0, 3).map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Dashboard Mockup */}
          <div className="relative">
            
            {/* Main dashboard container */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              
              {/* Dashboard header */}
              <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#10B981] rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Email Validation Dashboard</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Real-time validation results</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Live</span>
                  </div>
                </div>
              </div>

              {/* Email validation demo form */}
              <div className="p-6 space-y-4">
                <form onSubmit={handleDemoValidation} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={demoEmail}
                      onChange={(e) => setDemoEmail(e.target.value)}
                      placeholder="john.doe@company.com"
                      className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#10B981] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isValidating || !demoEmail.trim()}
                    className="w-full flex items-center justify-center space-x-2 bg-[#10B981] text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isValidating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Validating...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Validate Email</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Sample validation results */}
                <div className="space-y-3">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recent Validations</div>
                  
                  {/* Valid email example */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-[#10B981] rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">sarah.wilson@gmail.com</div>
                        <div className="text-xs text-[#10B981]">Valid • 98% confidence</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">0.2s</div>
                  </div>
                  
                  {/* Invalid email example */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-[#EF4444] rounded-full flex items-center justify-center">
                        <XCircle className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">invalid@fake-domain.xyz</div>
                        <div className="text-xs text-[#EF4444]">Invalid • DNS not found</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">0.1s</div>
                  </div>
                  
                  {/* Risky email example */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">temp@10minutemail.com</div>
                        <div className="text-xs text-yellow-600 dark:text-yellow-400">Risky • Disposable email</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">0.3s</div>
                  </div>
                </div>
              </div>

              {/* Dashboard stats footer */}
              <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-[#10B981]">1,247</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Today</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">98.5%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Accuracy</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#1E3A8A]">0.2s</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Avg Time</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating analytics chart */}
            <div className="absolute -top-8 -right-8 w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 animate-float-slow">
              <div className="w-full h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-1 h-6 bg-[#10B981] rounded-full"></div>
                  <div className="w-1 h-4 bg-[#1E3A8A] rounded-full"></div>
                  <div className="w-1 h-8 bg-[#10B981] rounded-full"></div>
                  <div className="w-1 h-3 bg-[#EF4444] rounded-full"></div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">Analytics</div>
              </div>
            </div>

            {/* Floating security badge */}
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center animate-float-medium">
              <Shield className="w-6 h-6 text-[#1E3A8A]" />
            </div>
          </div>
        </div>

        {/* Social proof section */}
        <div className="text-center mt-20 pt-16 border-t border-gray-200 dark:border-gray-700">
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
    </section>
  );
};

export default HeroSection; 