import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import {
  Mail,
  FileText, 
  DollarSign, 
  Users, 
  MessageSquare, 
  HelpCircle, 
  Activity,
  Shield,
  Lock,
  ExternalLink,
  CheckCircle,
  Code,
  BookOpen,
  Phone,
  MapPin,
  Clock,
  Github,
  Twitter,
  Linkedin,
  BarChart3,
  Upload,
  Key,
  Zap
} from 'lucide-react';

const Footer: React.FC = () => {
  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  return (
    <footer className="bg-[#0d1117] border-t border-[#30363d] text-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-12">
          
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center mb-4 sm:mb-6">
              <Logo to="/" tone="white" className="h-10 sm:h-12 w-auto" />
            </div>
            <p className="text-[#7d8590] text-base sm:text-lg mb-4 sm:mb-6 max-w-md">
              Emails flowing safely into inboxes. The most accurate email validation API trusted by developers worldwide.
            </p>
            
            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[#10B981]" />
                <span className="text-xs sm:text-sm text-[#7d8590]">99.9% Accuracy</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-[#10B981]" />
                <span className="text-xs sm:text-sm text-[#7d8590]">&lt;300ms Response</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-[#10B981]" />
                <span className="text-xs sm:text-sm text-[#7d8590]">Enterprise Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-[#10B981]" />
                <span className="text-xs sm:text-sm text-[#7d8590]">10K+ Developers</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-[#21262d] rounded-2xl sm:rounded-3xl flex items-center justify-center hover:bg-[#30363d] transition-colors">
                <Github className="w-4 h-4 sm:w-5 sm:h-5 text-[#7d8590] hover:text-white" />
              </a>
              <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-[#21262d] rounded-2xl sm:rounded-3xl flex items-center justify-center hover:bg-[#30363d] transition-colors">
                <Twitter className="w-4 h-4 sm:w-5 sm:h-5 text-[#7d8590] hover:text-white" />
              </a>
              <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-[#21262d] rounded-2xl sm:rounded-3xl flex items-center justify-center hover:bg-[#30363d] transition-colors">
                <Linkedin className="w-4 h-4 sm:w-5 sm:h-5 text-[#7d8590] hover:text-white" />
              </a>
            </div>
          </div>
          
          {/* Product Column */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 sm:mb-4">Product</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link to="/validate" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm flex items-center space-x-2">
                  <Mail className="w-3 h-3" />
                  <span>Email Validation</span>
                </Link>
              </li>
              <li>
                <Link to="/bulk-upload" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm flex items-center space-x-2">
                  <Upload className="w-3 h-3" />
                  <span>Bulk Processing</span>
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm flex items-center space-x-2">
                  <BarChart3 className="w-3 h-3" />
                  <span>Analytics</span>
                </Link>
              </li>
              <li>
                <Link to="/apikeys" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm flex items-center space-x-2">
                  <Key className="w-3 h-3" />
                  <span>API Keys</span>
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm">
                  Features
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company Column */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 sm:mb-4">Company</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link to="/about" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <a href="#" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm flex items-center space-x-1">
                  <span>Careers</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
          
          {/* Resources Column */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 sm:mb-4">Resources</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link to="/api-docs" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm flex items-center space-x-2">
                  <Code className="w-3 h-3" />
                  <span>API Docs</span>
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm flex items-center space-x-2">
                  <HelpCircle className="w-3 h-3" />
                  <span>Help Center</span>
                </Link>
              </li>
              <li>
                <Link to="/integrations" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm">
                  Integrations
                </Link>
              </li>
              <li>
                <a href="#" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm flex items-center space-x-1">
                  <Activity className="w-3 h-3" />
                  <span>API Status</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm">
                  Changelog
                </a>
              </li>
            </ul>
          </div>
          
          {/* Support Column */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 sm:mb-4">Support</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link to="/contact" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm flex items-center space-x-2">
                  <MessageSquare className="w-3 h-3" />
                  <span>Contact Support</span>
                </Link>
              </li>
              <li>
                <a href="mailto:support@scrubimail.com" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm">
                  support@scrubimail.com
                </a>
              </li>
              <li>
                <Link to="/register" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm">
                  Getting Started
                </Link>
              </li>
              <li>
                <a href="#" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm">
                  Community
                </a>
              </li>
              <li>
                <a href="#" className="text-[#7d8590] hover:text-white transition-colors text-xs sm:text-sm">
                  System Status
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Newsletter Signup */}
        <div className="bg-[#161b22] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12 border border-[#30363d]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-center">
            <div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">Stay Updated</h3>
              <p className="text-[#7d8590] text-sm sm:text-base">Get the latest updates on new features, API improvements, and email validation best practices.</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-[#0d1117] border border-[#30363d] rounded-2xl sm:rounded-3xl text-white placeholder-[#7d8590] focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] transition-colors text-sm sm:text-base"
              />
              <button className="px-4 sm:px-6 py-2 sm:py-3 bg-[#10B981] text-white rounded-2xl sm:rounded-3xl hover:bg-[#059669] transition-colors font-medium text-sm sm:text-base whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-[#30363d] pt-6 sm:pt-8 flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6">
            <p className="text-[#7d8590] text-xs sm:text-sm text-center sm:text-left">&copy; {getCurrentYear()} ScrubiMail. All rights reserved.</p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm text-[#7d8590]">All systems operational</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm">
            <Link to="/privacy" className="text-[#7d8590] hover:text-white transition-colors flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>Privacy</span>
            </Link>
            <Link to="/terms" className="text-[#7d8590] hover:text-white transition-colors flex items-center space-x-1">
              <FileText className="w-3 h-3" />
              <span>Terms</span>
            </Link>
            <a href="#" className="text-[#7d8590] hover:text-white transition-colors">
              Security
            </a>
            <a href="#" className="text-[#7d8590] hover:text-white transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 