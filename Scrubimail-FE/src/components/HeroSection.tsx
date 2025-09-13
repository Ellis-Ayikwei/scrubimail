import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, Mail, CheckCircle, Search, Zap, Shield, Star, TrendingUp, Globe, Users, Clock, BarChart3, XCircle, AlertTriangle, Eye, Layers, Database, Activity } from 'lucide-react';

const HeroSection: React.FC = () => {
  const [demoEmail, setDemoEmail] = useState('');
  const [demoResult, setDemoResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [currentStat, setCurrentStat] = useState(0);
  const [typedText, setTypedText] = useState('');

  // Removed stats as requested

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
    <section className="relative min-h-screen bg-[#0d1117] overflow-hidden">
      {/* GitHub-style background with dramatic lighting */}
      <div className="absolute inset-0">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
        
        {/* Focused light beam around dashboard area */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 w-full max-w-5xl h-[600px]">
          <div className="absolute inset-0 bg-gradient-radial from-white/8 via-white/4 to-transparent blur-3xl"></div>
          <div className="absolute inset-4 bg-gradient-radial from-white/12 via-white/6 to-transparent blur-2xl"></div>
          <div className="absolute inset-8 bg-gradient-radial from-white/16 via-white/8 to-transparent blur-xl"></div>
        </div>
        
        {/* Floating email icons around the edges */}
        <div className="absolute top-20 left-[5%] opacity-40 animate-float-slow">
          <div className="w-10 h-10 bg-gradient-to-br from-[#10B981]/20 to-[#059669]/20 rounded-3xl flex items-center justify-center border border-[#10B981]/30">
            <Mail className="w-5 h-5 text-[#10B981]" />
          </div>
        </div>
        
        <div className="absolute top-32 right-[8%] opacity-30 animate-float-medium">
          <div className="w-8 h-8 bg-gradient-to-br from-[#1E3A8A]/20 to-[#1E40AF]/20 rounded-3xl flex items-center justify-center border border-[#1E3A8A]/30">
            <Shield className="w-4 h-4 text-[#1E3A8A]" />
          </div>
        </div>
        
        <div className="absolute top-48 left-[10%] opacity-35 animate-float-fast">
          <div className="w-6 h-6 bg-gradient-to-br from-[#10B981]/20 to-[#059669]/20 rounded-full flex items-center justify-center border border-[#10B981]/30">
            <CheckCircle className="w-3 h-3 text-[#10B981]" />
          </div>
        </div>
        
        <div className="absolute bottom-40 right-[12%] opacity-40 animate-float-slow">
          <div className="w-12 h-12 bg-gradient-to-br from-[#1E3A8A]/20 to-[#1E40AF]/20 rounded-3xl flex items-center justify-center border border-[#1E3A8A]/30">
            <BarChart3 className="w-6 h-6 text-[#1E3A8A]" />
          </div>
        </div>
        
        <div className="absolute bottom-60 left-[15%] opacity-35 animate-float-medium">
          <div className="w-5 h-5 bg-gradient-to-br from-[#EF4444]/20 to-[#DC2626]/20 rounded-3xl flex items-center justify-center border border-[#EF4444]/30">
            <XCircle className="w-2.5 h-2.5 text-[#EF4444]" />
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        
        {/* GitHub-style centered layout */}
        <div className="text-center space-y-12">
          
          {/* Trust badge */}
          <div className="inline-flex items-center px-4 py-2 bg-[#21262d] rounded-full border border-[#30363d]">
            <div className="flex items-center mr-3">
              <Star className="w-3 h-3 text-[#10B981] fill-current" />
              <Star className="w-3 h-3 text-[#10B981] fill-current" />
              <Star className="w-3 h-3 text-[#10B981] fill-current" />
              <Star className="w-3 h-3 text-[#10B981] fill-current" />
              <Star className="w-3 h-3 text-[#10B981] fill-current" />
            </div>
            <span className="text-sm font-medium text-[#f0f6fc]">
              Trusted by 10K+ developers
            </span>
          </div>

          {/* Main headline - GitHub style */}
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-white leading-tight tracking-tight">
              Emails flowing safely
              <br />
              into <span className="bg-gradient-to-r from-[#10B981] to-[#059669] bg-clip-text text-transparent">
                inboxes
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-[#7d8590] leading-relaxed max-w-3xl mx-auto">
              Validate email addresses with professional precision. Our advanced API ensures your messages reach real inboxes, protecting your sender reputation and boosting deliverability.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#10B981] text-white font-semibold rounded-3xl hover:bg-[#059669] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start validating for free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              to="/api-docs"
              className="inline-flex items-center justify-center px-8 py-4 text-white font-semibold rounded-3xl border border-[#30363d] hover:bg-[#21262d] transition-all duration-200"
            >
              <Code className="w-4 h-4 mr-2" />
              View documentation
            </Link>
          </div>

          {/* Centered Dashboard Mockup - Main Feature */}
          <div className="relative max-w-4xl mx-auto mt-20">
            
            {/* Main dashboard container with glow effect */}
            <div className="relative bg-[#0d1117] rounded-3xl shadow-2xl border border-[#30363d] overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#10B981]/5 via-transparent to-transparent pointer-events-none"></div>
              
              {/* Dashboard header */}
              <div className="bg-[#161b22] px-8 py-6 border-b border-[#30363d]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-[#10B981] rounded-3xl flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Email Validation Dashboard</h3>
                      <p className="text-sm text-[#7d8590]">Real-time validation results</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
                    <span className="text-sm text-[#7d8590]">Live</span>
                  </div>
                </div>
              </div>

              {/* Email validation demo form */}
              <div className="p-8 space-y-6">
                <form onSubmit={handleDemoValidation} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#7d8590]" />
                    <input
                      type="email"
                      value={demoEmail}
                      onChange={(e) => setDemoEmail(e.target.value)}
                      placeholder="john.doe@company.com"
                      className="w-full pl-12 pr-4 py-4 text-lg bg-[#0d1117] border border-[#30363d] rounded-3xl focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-white placeholder-[#7d8590] transition-all duration-200"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isValidating || !demoEmail.trim()}
                    className="w-full flex items-center justify-center space-x-2 bg-[#10B981] text-white py-4 px-6 rounded-3xl text-lg font-medium hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                  >
                    {isValidating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Validating...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        <span>Validate Email</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Sample validation results */}
                <div className="space-y-4">
                  <div className="text-sm font-medium text-[#7d8590] uppercase tracking-wider">Recent Validations</div>
                  
                  {/* Valid email example */}
                  <div className="flex items-center justify-between p-4 bg-[#161b22] rounded-3xl border border-[#30363d]">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-[#10B981] rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-base font-medium text-white">sarah.wilson@gmail.com</div>
                        <div className="text-sm text-[#10B981]">Valid • 98% confidence</div>
                      </div>
                    </div>
                    <div className="text-sm text-[#7d8590]">0.2s</div>
                  </div>
                  
                  {/* Invalid email example */}
                  <div className="flex items-center justify-between p-4 bg-[#161b22] rounded-3xl border border-[#30363d]">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-[#EF4444] rounded-full flex items-center justify-center">
                        <XCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-base font-medium text-white">invalid@fake-domain.xyz</div>
                        <div className="text-sm text-[#EF4444]">Invalid • DNS not found</div>
                      </div>
                    </div>
                    <div className="text-sm text-[#7d8590]">0.1s</div>
                  </div>
                  
                  {/* Risky email example */}
                  <div className="flex items-center justify-between p-4 bg-[#161b22] rounded-3xl border border-[#30363d]">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-base font-medium text-white">temp@10minutemail.com</div>
                        <div className="text-sm text-yellow-400">Risky • Disposable email</div>
                      </div>
                    </div>
                    <div className="text-sm text-[#7d8590]">0.3s</div>
                  </div>
                </div>
              </div>

              {/* Dashboard stats footer */}
              <div className="bg-[#161b22] px-8 py-6 border-t border-[#30363d]">
                <div className="grid grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="text-2xl font-bold text-[#10B981]">1,247</div>
                    <div className="text-sm text-[#7d8590]">Validated Today</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">98.5%</div>
                    <div className="text-sm text-[#7d8590]">Accuracy Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#1E3A8A]">0.2s</div>
                    <div className="text-sm text-[#7d8590]">Average Time</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements around dashboard */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#0d1117] rounded-3xl shadow-xl border border-[#30363d] p-6 animate-float-slow">
              <div className="w-full h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-1 h-6 bg-[#10B981] rounded-full"></div>
                  <div className="w-1 h-4 bg-[#1E3A8A] rounded-full"></div>
                  <div className="w-1 h-8 bg-[#10B981] rounded-full"></div>
                  <div className="w-1 h-3 bg-[#EF4444] rounded-full"></div>
                </div>
                <div className="text-xs text-[#7d8590] text-center">Analytics</div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-[#0d1117] rounded-full shadow-xl border border-[#30363d] flex items-center justify-center animate-float-medium">
              <Shield className="w-8 h-8 text-[#1E3A8A]" />
            </div>
          </div>

          {/* Stats section removed as requested */}
        </div>

        {/* Social proof section */}
        <div className="text-center mt-24 pt-16 border-t border-[#30363d]">
          <p className="text-sm text-[#7d8590] mb-8 font-medium">
            Trusted by leading companies worldwide
          </p>
          <div className="flex items-center justify-center space-x-12 opacity-60">
            {/* Mock company logos */}
            <div className="w-24 h-8 bg-gradient-to-r from-[#30363d] to-[#21262d] rounded-3xl"></div>
            <div className="w-20 h-8 bg-gradient-to-r from-[#30363d] to-[#21262d] rounded-3xl"></div>
            <div className="w-28 h-8 bg-gradient-to-r from-[#30363d] to-[#21262d] rounded-3xl"></div>
            <div className="w-22 h-8 bg-gradient-to-r from-[#30363d] to-[#21262d] rounded-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 