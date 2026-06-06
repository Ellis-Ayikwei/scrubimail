import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Github, 
  Gitlab, 
  Chrome, 
  Shield, 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Smartphone,
  Mail,
  User,
  Fingerprint,
  Zap
} from 'lucide-react';

const SSO: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [securityLevel, setSecurityLevel] = useState('standard');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const providers = [
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      description: 'Sign in with your GitHub account',
      color: 'bg-gray-900 hover:bg-gray-800',
      textColor: 'text-white',
      features: ['OAuth 2.0', 'Team Management', 'Repository Access']
    },
    {
      id: 'gitlab',
      name: 'GitLab',
      icon: Gitlab,
      description: 'Sign in with your GitLab account',
      color: 'bg-orange-600 hover:bg-orange-700',
      textColor: 'text-white',
      features: ['OAuth 2.0', 'CI/CD Integration', 'Group Access']
    },
    {
      id: 'google',
      name: 'Google',
      icon: Chrome,
      description: 'Sign in with your Google account',
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white',
      features: ['OAuth 2.0', 'Workspace Integration', 'Calendar Sync']
    },
    {
      id: 'custom',
      name: 'Custom SSO',
      icon: Shield,
      description: 'Configure your own SSO provider',
      color: 'bg-purple-600 hover:bg-purple-700',
      textColor: 'text-white',
      features: ['SAML 2.0', 'OpenID Connect', 'Custom Claims']
    }
  ];

  const securityLevels = [
    {
      id: 'standard',
      name: 'Standard',
      description: 'Basic security with email verification',
      features: ['Email verification', 'Password requirements', 'Session management'],
      icon: Shield
    },
    {
      id: 'enhanced',
      name: 'Enhanced',
      description: 'Advanced security with 2FA and device management',
      features: ['Two-factor authentication', 'Device fingerprinting', 'IP whitelisting'],
      icon: Lock
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Maximum security with advanced threat protection',
      features: ['Hardware security keys', 'Advanced threat detection', 'Audit logging'],
      icon: Fingerprint
    }
  ];

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    setIsLoading(true);
    // TODO: Implement SSO provider selection
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleApiKeyGenerate = () => {
    // TODO: Implement API key generation
    const generatedKey = 'sm_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    setApiKey(generatedKey);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
          </div>
          <h1 className="mt-6 text-4xl font-bold text-[#333333] dark:text-white">
            Secure Sign-On
          </h1>
          <p className="mt-2 text-lg text-[#333333]/70 dark:text-gray-400 max-w-2xl mx-auto">
            Developer-focused authentication with enterprise-grade security and SSO integration
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* SSO Providers */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-semibold text-[#333333] dark:text-white mb-6 flex items-center">
                <Shield className="w-6 h-6 mr-2 text-[#2ED8A3]" />
                SSO Providers
              </h2>
              
              <div className="space-y-4">
                {providers.map((provider) => {
                  const IconComponent = provider.icon;
                  return (
                    <button
                      key={provider.id}
                      onClick={() => handleProviderSelect(provider.id)}
                      disabled={isLoading}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedProvider === provider.id
                          ? 'border-[#2ED8A3] bg-[#2ED8A3]/5'
                          : 'border-gray-200 dark:border-gray-600 hover:border-[#2ED8A3]/50'
                      } ${provider.color} ${provider.textColor} disabled:opacity-50`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <IconComponent className="w-6 h-6" />
                          <div className="text-left">
                            <div className="font-semibold">{provider.name}</div>
                            <div className="text-sm opacity-90">{provider.description}</div>
                          </div>
                        </div>
                        {isLoading && selectedProvider === provider.id && (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        )}
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-1">
                        {provider.features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-white/20 rounded text-xs font-medium"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Security Configuration */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-semibold text-[#333333] dark:text-white mb-6 flex items-center">
                <Lock className="w-6 h-6 mr-2 text-[#2ED8A3]" />
                Security Configuration
              </h2>
              
              <div className="space-y-6">
                {/* Security Level */}
                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-3">
                    Security Level
                  </label>
                  <div className="space-y-3">
                    {securityLevels.map((level) => {
                      const IconComponent = level.icon;
                      return (
                        <label
                          key={level.id}
                          className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            securityLevel === level.id
                              ? 'border-[#2ED8A3] bg-[#2ED8A3]/5'
                              : 'border-gray-200 dark:border-gray-600 hover:border-[#2ED8A3]/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="securityLevel"
                            value={level.id}
                            checked={securityLevel === level.id}
                            onChange={(e) => setSecurityLevel(e.target.value)}
                            className="mt-1 h-4 w-4 text-[#2ED8A3] focus:ring-[#2ED8A3] border-gray-300"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center">
                              <IconComponent className="w-5 h-5 text-[#2ED8A3] mr-2" />
                              <span className="font-medium text-[#333333] dark:text-white">
                                {level.name}
                              </span>
                            </div>
                            <p className="text-sm text-[#333333]/70 dark:text-gray-400 mt-1">
                              {level.description}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {level.features.map((feature, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-[#2ED8A3]/10 text-[#2ED8A3] rounded text-xs font-medium"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between p-4 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-[#2ED8A3]" />
                    <div>
                      <div className="font-medium text-[#333333] dark:text-white">
                        Two-Factor Authentication
                      </div>
                      <div className="text-sm text-[#333333]/70 dark:text-gray-400">
                        Add an extra layer of security
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2ED8A3]/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#2ED8A3]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* API Key Management */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-semibold text-[#333333] dark:text-white mb-6 flex items-center">
                <Key className="w-6 h-6 mr-2 text-[#2ED8A3]" />
                API Key Management
              </h2>
              
              <div className="space-y-6">
                {/* Generate API Key */}
                <div>
                  <label className="block text-sm font-medium text-[#333333] dark:text-gray-300 mb-2">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Generate an API key for programmatic access"
                      className="w-full pl-4 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-[#333333]/50 dark:placeholder-gray-400 transition-colors duration-200"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-[#333333]/50 hover:text-[#333333]"
                      >
                        {showApiKey ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleApiKeyGenerate}
                        className="px-3 py-1 bg-[#2ED8A3] text-white text-sm font-medium rounded hover:bg-[#00C48C] transition-colors"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-[#333333]/50 dark:text-gray-400">
                    Use this key for API authentication. Keep it secure and never share it publicly.
                  </p>
                </div>

                {/* Security Features */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#333333] dark:text-white flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-[#2ED8A3]" />
                    Security Features
                  </h3>
                  
                  <div className="grid gap-3">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-[#333333] dark:text-white">Rate limiting enabled</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-[#333333] dark:text-white">IP whitelisting available</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-[#333333] dark:text-white">Audit logging enabled</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-[#333333] dark:text-white">Webhook notifications for security events</span>
                    </div>
                  </div>
                </div>

                {/* Integration Examples */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#333333] dark:text-white">
                    Quick Integration
                  </h3>
                  
                  <div className="bg-[#F4F5F7] dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#333333] dark:text-white">cURL Example</span>
                      <button className="text-[#2ED8A3] hover:text-[#00C48C] text-sm">
                        Copy
                      </button>
                    </div>
                    <pre className="text-xs text-[#333333] dark:text-white overflow-x-auto">
{`curl -X POST "https://api.scrubimail.com/validate" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "test@example.com"}'`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentation Links */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-semibold text-[#333333] dark:text-white mb-6">
                Developer Resources
              </h2>
              
              <div className="space-y-4">
                <Link
                  to="/api-docs"
                  className="flex items-center justify-between p-4 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg hover:bg-[#2ED8A3]/10 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Key className="w-5 h-5 text-[#2ED8A3]" />
                    <span className="font-medium text-[#333333] dark:text-white">API Documentation</span>
                  </div>
                  <span className="text-[#2ED8A3]">→</span>
                </Link>
                
                <Link
                  to="/privacy"
                  className="flex items-center justify-between p-4 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg hover:bg-[#2ED8A3]/10 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-[#2ED8A3]" />
                    <span className="font-medium text-[#333333] dark:text-white">Privacy Policy</span>
                  </div>
                  <span className="text-[#2ED8A3]">→</span>
                </Link>
                
                <Link
                  to="/terms"
                  className="flex items-center justify-between p-4 bg-[#F4F5F7] dark:bg-gray-700 rounded-lg hover:bg-[#2ED8A3]/10 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Lock className="w-5 h-5 text-[#2ED8A3]" />
                    <span className="font-medium text-[#333333] dark:text-white">Terms of Service</span>
                  </div>
                  <span className="text-[#2ED8A3]">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-center space-x-4">
          <Link
            to="/login"
            className="px-6 py-3 border border-[#2ED8A3] text-[#2ED8A3] font-semibold rounded-lg hover:bg-[#2ED8A3] hover:text-white transition-colors"
          >
            Back to Sign In
          </Link>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-6 py-3 bg-[#2ED8A3] text-white font-semibold rounded-lg hover:bg-[#00C48C] transition-colors"
          >
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SSO; 