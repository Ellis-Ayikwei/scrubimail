import React from 'react';
import { MessageSquare, Users, BarChart3, Award, Globe, Shield } from 'lucide-react';

const UseCasesSection: React.FC = () => {
  const useCases = [
    {
      title: 'Marketing Campaigns',
      description: 'Clean your email lists before sending campaigns to improve deliverability and engagement rates.',
      icon: MessageSquare,
      color: 'from-blue-500 to-purple-600'
    },
    {
      title: 'User Registration',
      description: 'Validate emails during signup to prevent fake accounts and improve user quality.',
      icon: Users,
      color: 'from-green-500 to-blue-600'
    },
    {
      title: 'Data Cleaning',
      description: 'Bulk validate existing email databases to remove invalid and disposable addresses.',
      icon: BarChart3,
      color: 'from-orange-500 to-red-600'
    },
    {
      title: 'Lead Generation',
      description: 'Ensure your lead capture forms only collect valid, deliverable email addresses.',
      icon: Award,
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'E-commerce',
      description: 'Validate customer emails to improve order confirmations and customer communication.',
      icon: Globe,
      color: 'from-indigo-500 to-purple-600'
    },
    {
      title: 'CRM Integration',
      description: 'Keep your CRM data clean with real-time email validation on contact creation.',
      icon: Shield,
      color: 'from-teal-500 to-green-600'
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
            Perfect for Every Use Case
          </h2>
          <p className="text-xl text-[#333333]/70 dark:text-gray-300 max-w-2xl mx-auto">
            Whether you're building a startup or running an enterprise, Scrubimail scales with your needs.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => {
            const IconComponent = useCase.icon;
            return (
              <div key={index} className="bg-[#F4F5F7] dark:bg-gray-800 rounded-xl p-8 hover:shadow-lg transition-all duration-200 group">
                <div className={`w-12 h-12 bg-gradient-to-r ${useCase.color} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-[#333333] dark:text-white mb-2">
                  {useCase.title}
                </h3>
                <p className="text-[#333333]/70 dark:text-gray-400">
                  {useCase.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection; 