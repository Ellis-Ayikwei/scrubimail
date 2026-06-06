import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Code, Mail, Shield, BarChart3, CheckCircle, XCircle } from 'lucide-react';

const HeroSection: React.FC = () => {
  const [ctaEmail, setCTAEmail] = useState('');

  return (
    <section className="relative min-h-screen bg-white dark:bg-[#0d1117] overflow-hidden transition-colors duration-300">
      {/* GitHub-style background with dramatic lighting */}
      <div className="absolute inset-0">
        {/* Subtle grid pattern - theme aware */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
        
        {/* Dashboard glow effect - no beam */}
        
        {/* Floating email icons around the edges - theme aware */}
        <div className="absolute top-20 left-[5%] opacity-40 animate-float-slow">
          <div className="w-10 h-10 bg-gradient-to-br from-[#10B981]/20 to-[#059669]/20 rounded-3xl flex items-center justify-center border border-[#10B981]/30 backdrop-blur-sm">
            <Mail className="w-5 h-5 text-[#10B981]" />
          </div>
        </div>
        
        <div className="absolute top-32 right-[8%] opacity-30 animate-float-medium">
          <div className="w-8 h-8 bg-gradient-to-br from-[#1E3A8A]/20 to-[#1E40AF]/20 rounded-3xl flex items-center justify-center border border-[#1E3A8A]/30 backdrop-blur-sm">
            <Shield className="w-4 h-4 text-[#1E3A8A]" />
          </div>
        </div>
        
        <div className="absolute top-48 left-[10%] opacity-35 animate-float-fast">
          <div className="w-6 h-6 bg-gradient-to-br from-[#10B981]/20 to-[#059669]/20 rounded-full flex items-center justify-center border border-[#10B981]/30 backdrop-blur-sm">
            <CheckCircle className="w-3 h-3 text-[#10B981]" />
          </div>
        </div>
        
        <div className="absolute bottom-40 right-[12%] opacity-40 animate-float-slow">
          <div className="w-12 h-12 bg-gradient-to-br from-[#1E3A8A]/20 to-[#1E40AF]/20 rounded-3xl flex items-center justify-center border border-[#1E3A8A]/30 backdrop-blur-sm">
            <BarChart3 className="w-6 h-6 text-[#1E3A8A]" />
          </div>
        </div>
        
        <div className="absolute bottom-60 left-[15%] opacity-35 animate-float-medium">
          <div className="w-5 h-5 bg-gradient-to-br from-[#EF4444]/20 to-[#DC2626]/20 rounded-3xl flex items-center justify-center border border-[#EF4444]/30 backdrop-blur-sm">
            <XCircle className="w-2.5 h-2.5 text-[#EF4444]" />
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-16 sm:pt-20 lg:pt-24 pb-12 sm:pb-16">
        
        {/* GitHub-style centered layout */}
        <div className="text-center space-y-8 sm:space-y-10 lg:space-y-12">

          {/* Main headline - theme aware */}
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-gray-900 dark:text-white leading-tight tracking-tight transition-colors duration-300">
              <span className="block">Emails flowing safely</span>
              <span className="block">into <span className="bg-gradient-to-r from-[#10B981] to-[#059669] bg-clip-text text-transparent">
                inboxes
              </span></span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-[#7d8590] leading-relaxed max-w-2xl sm:max-w-3xl mx-auto px-4 sm:px-0 transition-colors duration-300">
              Validate email addresses with professional precision. Our advanced API ensures your messages reach real inboxes, protecting your sender reputation and boosting deliverability.
            </p>
          </div>

          {/* CTA with email input */}
          <div className="max-w-4xl sm:max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-center">
              {/* Email input container */}
              <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white dark:bg-[#161b22] rounded-2xl sm:rounded-full border-2 border-[#10B981] shadow-2xl transition-colors duration-300 ring-4 ring-[#10B981]/10 w-full lg:flex-1">
                <div className="relative flex-1 min-w-0">
                  <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#10B981] dark:text-[#10B981]" />
                  <input
                    type="email"
                    value={ctaEmail}
                    onChange={(e) => setCTAEmail(e.target.value)}
                    placeholder="Enter your email to get started"
                    className="w-full pl-10 sm:pl-12 lg:pl-14 pr-3 sm:pr-4 py-3 sm:py-2 text-sm sm:text-base lg:text-lg bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#7d8590] font-semibold transition-colors duration-300"
                  />
                </div>
                <Link
                  to={`/register${ctaEmail ? `?email=${encodeURIComponent(ctaEmail)}` : ''}`}
                  className="inline-flex items-center justify-center px-4 sm:px-6 lg:px-10 py-3 sm:py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold rounded-2xl sm:rounded-full hover:from-[#059669] hover:to-[#10B981] transition-all duration-200 shadow-xl hover:shadow-2xl transform text-sm sm:text-base lg:text-lg whitespace-nowrap"
                >
                  <span className="hidden lg:inline">Start validating for free</span>
                  <span className="hidden sm:inline lg:hidden">Get Started</span>
                  <span className="sm:hidden">Start</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ml-1 sm:ml-2 lg:ml-3" />
                </Link>
              </div>
              
              {/* Documentation button */}
              <Link
                to="/api-docs"
                className="hidden lg:inline-flex items-center justify-center px-4 sm:px-6 lg:px-10 py-3 sm:py-4 text-[#10B981] dark:text-[#10B981] font-bold rounded-2xl sm:rounded-full border-2 border-[#10B981] hover:bg-[#10B981]/10 dark:hover:bg-[#10B981]/10 transition-all duration-200 text-sm sm:text-base lg:text-lg shadow-lg lg:flex-shrink-0"
              >
                <Code className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2 lg:mr-3" />
                <span className="hidden lg:inline">View documentation</span>
                <span className="hidden sm:inline lg:hidden">Documentation</span>
                <span className="sm:hidden">Docs</span>
              </Link>
            </div>
          </div>

          {/* Laptop Image - Main Feature */}
          <div className="relative max-w-4xl mx-auto mt-12 sm:mt-16 lg:mt-20 px-4 sm:px-0">
            {/* Glow effects around laptop */}
            <div className="absolute inset-0 bg-[#10B981]/20 rounded-3xl blur-3xl transform scale-110"></div>
            <div className="absolute inset-0 bg-[#10B981]/15 rounded-3xl blur-2xl transform scale-105"></div>
            <div className="absolute inset-0 bg-[#10B981]/10 rounded-3xl blur-xl"></div>
            
            {/* Laptop image container */}
            <div className="relative">
              <img 
                src="/assets/images/hero/Macbook-Air-192.168.100.12.png" 
                alt="Email Validation Dashboard on MacBook Air"
                className="w-full h-auto max-w-4xl mx-auto drop-shadow-2xl"
              />
              
              {/* Floating Nodes Overlay - Inside laptop screen area */}
              <div className="absolute top-[8%] left-[6%] right-[6%] bottom-[25%] pointer-events-none">
                <div className="relative w-full h-full">
                  {/* Floating Nodes */}
                  {[
                    { x: 20, y: 30, size: 16, color: 'rgb(16, 185, 129)' },
                    { x: 60, y: 50, size: 24, color: 'rgb(30, 58, 138)' },
                    { x: 80, y: 70, size: 20, color: 'rgb(16, 185, 129)' },
                    { x: 40, y: 80, size: 16, color: 'rgb(30, 58, 138)' },
                    { x: 70, y: 20, size: 20, color: 'rgb(16, 185, 129)' },
                  ].map((node, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        left: `${node.x}%`,
                        top: `${node.y}%`,
                        width: `${node.size}px`,
                        height: `${node.size}px`,
                        backgroundColor: node.color,
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    />
                  ))}

                  {/* Connection Lines */}
                  <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
                    <motion.line
                      x1="20%"
                      y1="30%"
                      x2="60%"
                      y2="50%"
                      stroke="#10B981"
                      strokeWidth="1"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.5 }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                    />
                    <motion.line
                      x1="60%"
                      y1="50%"
                      x2="80%"
                      y2="70%"
                      stroke="#1E3A8A"
                      strokeWidth="1"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.5 }}
                      transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
                    />
                    <motion.line
                      x1="80%"
                      y1="70%"
                      x2="40%"
                      y2="80%"
                      stroke="#10B981"
                      strokeWidth="1"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.5 }}
                      transition={{ duration: 2, delay: 1, repeat: Infinity, repeatType: "reverse" }}
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Floating elements around laptop - hidden on mobile */}
            <div className="hidden sm:block absolute -top-4 -right-4 sm:-top-6 sm:-right-6 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 animate-float-slow">
              {/* Glow effect for analytics card */}
              <div className="absolute inset-0 bg-[#1E3A8A]/30 rounded-2xl sm:rounded-3xl blur-xl"></div>
              <div className="relative bg-white dark:bg-[#0d1117] rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 dark:border-[#30363d] p-3 sm:p-4 lg:p-6 transition-colors duration-300">
                <div className="w-full h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-1 h-4 sm:h-6 bg-[#10B981] rounded-full"></div>
                    <div className="w-1 h-3 sm:h-4 bg-[#1E3A8A] rounded-full"></div>
                    <div className="w-1 h-5 sm:h-8 bg-[#10B981] rounded-full"></div>
                    <div className="w-1 h-2 sm:h-3 bg-[#EF4444] rounded-full"></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-[#7d8590] text-center transition-colors duration-300">Analytics</div>
                </div>
              </div>
            </div>

            <div className="hidden sm:block absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 animate-float-medium">
              {/* Glow effect for shield */}
              <div className="absolute inset-0 bg-[#1E3A8A]/30 rounded-full blur-xl"></div>
              <div className="relative bg-white dark:bg-[#0d1117] rounded-full shadow-xl border border-gray-200 dark:border-[#30363d] flex items-center justify-center w-full h-full transition-colors duration-300">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-[#1E3A8A]" />
              </div>
            </div>
            
            {/* Additional glow particles - hidden on mobile */}
            <div className="hidden sm:block absolute -top-8 sm:-top-12 left-1/4 w-3 h-3 sm:w-4 sm:h-4 bg-[#10B981]/40 rounded-full blur-md animate-pulse"></div>
            <div className="hidden sm:block absolute -bottom-8 sm:-bottom-12 right-1/4 w-2 h-2 sm:w-3 sm:h-3 bg-[#1E3A8A]/40 rounded-full blur-md animate-pulse delay-1000"></div>
            <div className="hidden sm:block absolute top-1/2 -left-8 sm:-left-12 w-1 h-1 sm:w-2 sm:h-2 bg-[#10B981]/30 rounded-full blur-sm animate-pulse delay-2000"></div>
            <div className="hidden sm:block absolute top-1/3 -right-8 sm:-right-12 w-1 h-1 sm:w-2 sm:h-2 bg-[#1E3A8A]/30 rounded-full blur-sm animate-pulse delay-500"></div>
          </div>

          {/* Stats section removed as requested */}
        </div>

        {/* Social proof section - theme aware */}
        {/* <div className="text-center mt-16 sm:mt-20 lg:mt-24 pt-12 sm:pt-16 border-t border-gray-200 dark:border-[#30363d] transition-colors duration-300">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-[#7d8590] mb-6 sm:mb-8 font-medium transition-colors duration-300">
            Trusted by leading companies worldwide
          </p>
          <div className="flex items-center justify-center space-x-6 sm:space-x-8 lg:space-x-12 opacity-60 overflow-x-auto px-4 sm:px-0">
           
            <div className="w-16 h-6 sm:w-20 sm:h-7 lg:w-24 lg:h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-[#30363d] dark:to-[#21262d] rounded-2xl sm:rounded-3xl transition-colors duration-300 flex-shrink-0"></div>
            <div className="w-14 h-6 sm:w-18 sm:h-7 lg:w-20 lg:h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-[#30363d] dark:to-[#21262d] rounded-2xl sm:rounded-3xl transition-colors duration-300 flex-shrink-0"></div>
            <div className="w-18 h-6 sm:w-22 sm:h-7 lg:w-28 lg:h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-[#30363d] dark:to-[#21262d] rounded-2xl sm:rounded-3xl transition-colors duration-300 flex-shrink-0"></div>
            <div className="w-16 h-6 sm:w-20 sm:h-7 lg:w-22 lg:h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-[#30363d] dark:to-[#21262d] rounded-2xl sm:rounded-3xl transition-colors duration-300 flex-shrink-0"></div>
          </div>
        </div> */}
      </div>
    </section>
  );
};

export default HeroSection; 