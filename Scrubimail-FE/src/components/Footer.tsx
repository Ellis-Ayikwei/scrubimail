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
  Clock
} from 'lucide-react';

const Footer: React.FC = () => {
  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  return (
    <footer className="bg-[#004E8A] text-white py-12">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-[#2ED8A3] to-white rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-[#004E8A]" />
              </div>
              <span className="text-xl font-bold">Scrubimail</span>
            </div>
            <p className="text-white/80 mb-4">
              The most advanced email validation platform for developers and businesses.
            </p>
            <div className="flex items-center space-x-4 text-white/60">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-[#2ED8A3]" />
                <span className="text-sm">99.9% Accuracy</span>
              </div>
              <div className="flex items-center space-x-1">
                <Activity className="w-4 h-4 text-[#2ED8A3]" />
                <span className="text-sm">&lt;100ms</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 flex items-center">
              <Code className="w-4 h-4 mr-2" />
              Product
            </h3>
            <ul className="space-y-2 text-white/80">
              <li>
                <Link to="/validate" className="hover:text-white flex items-center space-x-2 transition-colors">
                  <CheckCircle className="w-3 h-3" />
                  <span>Email Validation</span>
                </Link>
              </li>
              <li>
                <Link to="/apikeys" className="hover:text-white flex items-center space-x-2 transition-colors">
                  <FileText className="w-3 h-3" />
                  <span>API Documentation</span>
                </Link>
              </li>
              <li>
                <Link to="/billing" className="hover:text-white flex items-center space-x-2 transition-colors">
                  <DollarSign className="w-3 h-3" />
                  <span>Pricing</span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Company
            </h3>
            <ul className="space-y-2 text-white/80">
              <li>
                <Link to="/about" className="hover:text-white flex items-center space-x-2 transition-colors">
                  <Users className="w-3 h-3" />
                  <span>About</span>
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white flex items-center space-x-2 transition-colors">
                  <BookOpen className="w-3 h-3" />
                  <span>Blog</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white flex items-center space-x-2 transition-colors">
                  <MessageSquare className="w-3 h-3" />
                  <span>Contact</span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 flex items-center">
              <HelpCircle className="w-4 h-4 mr-2" />
              Support
            </h3>
            <ul className="space-y-2 text-white/80">
              <li>
                <Link to="/help" className="hover:text-white flex items-center space-x-2 transition-colors">
                  <HelpCircle className="w-3 h-3" />
                  <span>Help Center</span>
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white flex items-center space-x-2 transition-colors">
                  <Activity className="w-3 h-3" />
                  <span>API Status</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white flex items-center space-x-2 transition-colors">
                  <MessageSquare className="w-3 h-3" />
                  <span>Contact Support</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-white/60">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <p>&copy; {getCurrentYear()} Scrubimail. All rights reserved.</p>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Enterprise Security</span>
            </div>
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy" className="hover:text-white transition-colors flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>Privacy Policy</span>
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors flex items-center space-x-1">
              <FileText className="w-3 h-3" />
              <span>Terms of Service</span>
            </Link>
            <Link to="/sso" className="hover:text-white transition-colors flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>SSO</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 