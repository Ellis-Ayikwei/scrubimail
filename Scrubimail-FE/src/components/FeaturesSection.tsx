import React from 'react';
import { Check, Zap, Shield, Users } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Check,
      title: 'RFC 5322 Compliant',
      description: 'Advanced email validation following international standards'
    },
    {
      icon: Zap,
      title: 'High Performance',
      description: '99.9% uptime with sub-second response times'
    },
    {
      icon: Shield,
      title: 'Fraud Detection',
      description: 'Identify disposable emails and spam traps'
    },
    {
      icon: Users,
      title: 'API First',
      description: 'RESTful API with comprehensive documentation'
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
            Why Choose Scrubimail?
          </h2>
          <p className="text-xl text-[#333333]/70 dark:text-gray-300 max-w-2xl mx-auto">
            Built for developers, trusted by enterprises. Our validation engine goes beyond 
            basic checks to ensure your email lists are clean and deliverable.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="bg-[#F4F5F7] dark:bg-gray-800 rounded-xl p-8 hover:shadow-lg transition-all duration-200 group">
                <div className="w-12 h-12 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-200">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-[#333333] dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#333333]/70 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 