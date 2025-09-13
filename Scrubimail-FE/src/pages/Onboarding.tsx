import React, { useState } from 'react';
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Mail, 
  Key, 
  Upload, 
  BarChart3,
  Zap,
  Play
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = [
    {
      id: 0,
      title: 'Welcome to ScrubiMail',
      description: 'Let\'s get you set up with the most accurate email validation service',
      icon: Mail,
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-12 h-12 text-[#10B981]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#333333] dark:text-white mb-4">
              Welcome to ScrubiMail! 👋
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              We'll help you get started with email validation in just a few simple steps. 
              This should take less than 5 minutes.
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-3xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">What you'll learn:</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 text-left max-w-xs mx-auto">
              <li>• How to validate your first email</li>
              <li>• Setting up API access</li>
              <li>• Bulk validation features</li>
              <li>• Monitoring your usage</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 1,
      title: 'Validate Your First Email',
      description: 'Try our real-time email validation',
      icon: Zap,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-[#10B981]" />
            </div>
            <h2 className="text-2xl font-bold text-[#333333] dark:text-white mb-2">
              Let's Validate an Email
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Enter any email address to see our validation in action
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
            <form className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="example@company.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-3xl focus:ring-2 focus:ring-[#10B981] focus:border-transparent bg-white dark:bg-gray-700 text-[#333333] dark:text-white placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 bg-[#10B981] text-white py-3 px-4 rounded-3xl font-medium hover:bg-[#059669] transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Validate Email</span>
              </button>
            </form>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-3xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800 dark:text-green-200">example@company.com</div>
                <div className="text-sm text-green-600 dark:text-green-400">Valid • 98% confidence • 0.2s</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: 'Get Your API Key',
      description: 'Set up API access for integration',
      icon: Key,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-[#10B981]" />
            </div>
            <h2 className="text-2xl font-bold text-[#333333] dark:text-white mb-2">
              Your API Key
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Use this key to integrate email validation into your applications
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value="sk_live_1234567890abcdef..."
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-3xl text-sm font-mono"
                  />
                  <button className="px-4 py-2 bg-[#10B981] text-white rounded-3xl text-sm hover:bg-[#059669] transition-colors">
                    Copy
                  </button>
                </div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-3xl p-4 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Keep your API key secure!</strong> Don't share it in public repositories or client-side code.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-[#333333] dark:text-white mb-2">Quick Start Example:</h3>
            <pre className="text-xs bg-black text-green-400 p-3 rounded-3xl overflow-x-auto">
{`curl -X POST https://api.scrubimail.com/validate \\
  -H "Authorization: Bearer sk_live_1234..." \\
  -H "Content-Type: application/json" \\
  -d '{"email": "test@example.com"}'`}
            </pre>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'Bulk Validation',
      description: 'Learn how to validate multiple emails',
      icon: Upload,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-[#10B981]" />
            </div>
            <h2 className="text-2xl font-bold text-[#333333] dark:text-white mb-2">
              Bulk Validation
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Process thousands of emails at once with our bulk upload feature
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-[#333333] dark:text-white mb-3">Upload Methods</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  <span>CSV file upload</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  <span>JSON file upload</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  <span>API batch processing</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-[#333333] dark:text-white mb-3">Features</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  <span>Progress tracking</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  <span>Result export</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  <span>Queue management</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-3xl p-4 border border-blue-200 dark:border-blue-800 text-center">
            <p className="text-blue-800 dark:text-blue-200">
              Ready to try bulk validation? 
              <Link to="/bulk-upload" className="font-medium hover:underline ml-1">
                Upload your first file →
              </Link>
            </p>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: 'Monitor Your Usage',
      description: 'Track performance and analytics',
      icon: BarChart3,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-[#10B981]" />
            </div>
            <h2 className="text-2xl font-bold text-[#333333] dark:text-white mb-2">
              Analytics Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor your validation performance and usage patterns
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Validated Today', value: '1,247', color: 'text-[#10B981]' },
              { label: 'Accuracy Rate', value: '98.5%', color: 'text-blue-600' },
              { label: 'Avg Response', value: '0.2s', color: 'text-purple-600' },
              { label: 'API Calls', value: '15.2K', color: 'text-orange-600' }
            ].map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-3xl p-4 border border-gray-200 dark:border-gray-700 text-center">
                <div className={`text-xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-[#333333] dark:text-white mb-4">What you can track:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  <span>Validation success rates</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  <span>Response time metrics</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  <span>Usage by domain</span>
                </li>
              </ul>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  <span>API quota monitoring</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  <span>Historical trends</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  <span>Custom reports</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = () => {
    setCompletedSteps(prev => [...prev, currentStep]);
    // Redirect to dashboard
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-[#333333] dark:text-white">Getting Started</h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  completedSteps.includes(index)
                    ? 'bg-[#10B981] text-white'
                    : index === currentStep
                    ? 'bg-[#10B981] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  {completedSteps.includes(index) ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    completedSteps.includes(index) ? 'bg-[#10B981]' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 mb-8">
          {steps[currentStep].content}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-6 py-3 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={completeOnboarding}
              className="flex items-center space-x-2 px-6 py-3 bg-[#10B981] text-white rounded-3xl hover:bg-[#059669] transition-colors"
            >
              <span>Complete Setup</span>
              <CheckCircle className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="flex items-center space-x-2 px-6 py-3 bg-[#10B981] text-white rounded-3xl hover:bg-[#059669] transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <Link
            to="/dashboard"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#10B981] transition-colors"
          >
            Skip tutorial and go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;