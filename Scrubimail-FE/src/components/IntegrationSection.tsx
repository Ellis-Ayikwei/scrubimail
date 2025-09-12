import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const IntegrationSection: React.FC = () => {
  return (
    <section className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
            Easy Integration
          </h2>
          <p className="text-xl text-[#333333]/70 dark:text-gray-300 max-w-2xl mx-auto">
            Integrate with your favorite programming languages and frameworks in minutes.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
            { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
            { name: 'PHP', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg' },
            { name: 'Node.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
            { name: 'Ruby', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg' },
            { name: 'Go', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg' },
            { name: 'Java', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg' },
            { name: 'C#', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg' }
          ].map((lang, index) => (
            <div key={index} className="bg-[#F4F5F7] dark:bg-gray-800 rounded-lg p-6 text-center hover:shadow-lg transition-all duration-200 group">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                <img src={lang.icon} alt={lang.name} className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white">{lang.name}</h3>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link
            to="/integrations"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] text-white font-semibold rounded-lg hover:from-[#00C48C] hover:to-[#2ED8A3] transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            View All Integrations
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default IntegrationSection; 