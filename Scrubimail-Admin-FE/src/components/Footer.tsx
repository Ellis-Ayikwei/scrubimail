import React from 'react';
import { Link } from 'react-router-dom';
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
    <footer className="bg-[#0d1117] border-t border-[#30363d] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-[#10B981] rounded-3xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">ScrubiMail</span>
            </div>
            <p className="text-[#7d8590] text-lg mb-6 max-w-md">
              Emails flowing safely into inboxes. The most accurate email validation API trusted by developers worldwide.
            </p>
            
            {/* Trust Indicators */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-[#10B981]" />
                <span className="text-sm text-[#7d8590]">99.9% Accuracy</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-[#10B981]" />
                <span className="text-sm text-[#7d8590]">&lt;300ms Response</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-[#10B981]" />
                <span className="text-sm text-[#7d8590]">Enterprise Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#10B981]" />
                <span className="text-sm text-[#7d8590]">10K+ Developers</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <a href="#" className="w-10 h-10 bg-[#21262d] rounded-3xl flex items-center justify-center hover:bg-[#30363d] transition-colors">
                <Github className="w-5 h-5 text-[#7d8590] hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-[#21262d] rounded-3xl flex items-center justify-center hover:bg-[#30363d] transition-colors">
                <Twitter className="w-5 h-5 text-[#7d8590] hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-[#21262d] rounded-3xl flex items-center justify-center hover:bg-[#30363d] transition-colors">
                <Linkedin className="w-5 h-5 text-[#7d8590] hover:text-white" />
              </a>
            </div>
          </div>
          
          {/* Product Column */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/validate" className="text-[#7d8590] hover:text-white transition-colors text-sm flex items-center space-x-2">
                  <Mail className="w-3 h-3" />
                  <span>Email Validation</span>
                </Link>
              </li>
              <li>
                <Link to="/bulk-upload" className="text-[#7d8590] hover:text-white transition-colors text-sm flex items-center space-x-2">
                  <Upload className="w-3 h-3" />
                  <span>Bulk Processing</span>
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="text-[#7d8590] hover:text-white transition-colors text-sm flex items-center space-x-2">
                  <BarChart3 className="w-3 h-3" />
                  <span>Analytics</span>
                </Link>
              </li>
              <li>
                <Link to="/apikeys" className="text-[#7d8590] hover:text-white transition-colors text-sm flex items-center space-x-2">
                  <Key className="w-3 h-3" />
                  <span>API Keys</span>
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-[#7d8590] hover:text-white transition-colors text-sm">
                  Features
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company Column */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-[#7d8590] hover:text-white transition-colors text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-[#7d8590] hover:text-white transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#7d8590] hover:text-white transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-[#7d8590] hover:text-white transition-colors text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <a href="#" className="text-[#7d8590] hover:text-white transition-colors text-sm flex items-center space-x-1">
                  <span>Careers</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
          
          {/* Resources Column */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/api-docs" className="text-[#7d8590] hover:text-white transition-colors text-sm flex items-center space-x-2">
                  <Code className="w-3 h-3" />
                  <span>API Docs</span>
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-[#7d8590] hover:text-white transition-colors text-sm flex items-center space-x-2">
                  <HelpCircle className="w-3 h-3" />
                  <span>Help Center</span>
                </Link>
              </li>
              <li>
                <Link to="/integrations" className="text-[#7d8590] hover:text-white transition-colors text-sm">
                  Integrations
                </Link>
              </li>
              <li>
                <a href="#" className="text-[#7d8590] hover:text-white transition-colors text-sm flex items-center space-x-1">
                  <Activity className="w-3 h-3" />
                  <span>API Status</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-[#7d8590] hover:text-white transition-colors text-sm">
                  Changelog
                </a>
              </li>
            </ul>
          </div>
          
          {/* Support Column */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/contact" className="text-[#7d8590] hover:text-white transition-colors text-sm flex items-center space-x-2">
                  <MessageSquare className="w-3 h-3" />
                  <span>Contact Support</span>
                </Link>
              </li>
              <li>
                <a href="mailto:support@scrubimail.com" className="text-[#7d8590] hover:text-white transition-colors text-sm">
                  support@scrubimail.com
                </a>
              </li>
              <li>
                <Link to="/register" className="text-[#7d8590] hover:text-white transition-colors text-sm">
                  Getting Started
                </Link>
              </li>
              <li>
                <a href="#" className="text-[#7d8590] hover:text-white transition-colors text-sm">
                  Community
                </a>
              </li>
              <li>
                <a href="#" className="text-[#7d8590] hover:text-white transition-colors text-sm">
                  System Status
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Newsletter Signup */}
        <div className="bg-[#161b22] rounded-3xl p-8 mb-12 border border-[#30363d]">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Stay Updated</h3>
              <p className="text-[#7d8590]">Get the latest updates on new features, API improvements, and email validation best practices.</p>
            </div>
            <div className="flex space-x-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-3xl text-white placeholder-[#7d8590] focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] transition-colors"
              />
              <button className="px-6 py-3 bg-[#10B981] text-white rounded-3xl hover:bg-[#059669] transition-colors font-medium">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-[#30363d] pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-6 mb-4 md:mb-0">
            <p className="text-[#7d8590]">&copy; {getCurrentYear()} ScrubiMail. All rights reserved.</p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
              <span className="text-sm text-[#7d8590]">All systems operational</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
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