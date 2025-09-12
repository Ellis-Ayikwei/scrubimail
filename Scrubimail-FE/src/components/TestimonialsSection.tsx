import React from 'react';
import { Star } from 'lucide-react';

const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Lead Developer',
      company: 'TechCorp',
      content: 'Scrubimail has reduced our email bounce rate by 95%. The API is incredibly fast and reliable.',
      rating: 5
    },
    {
      name: 'Marcus Rodriguez',
      role: 'CTO',
      company: 'StartupXYZ',
      content: 'The best email validation service we\'ve used. Easy integration and excellent documentation.',
      rating: 5
    },
    {
      name: 'Emily Watson',
      role: 'Product Manager',
      company: 'DataFlow Inc',
      content: 'Outstanding accuracy and speed. Our marketing campaigns are now much more effective.',
      rating: 5
    }
  ];

  return (
    <section className="py-24 bg-[#F4F5F7] dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
            Trusted by Developers Worldwide
          </h2>
          <p className="text-xl text-[#333333]/70 dark:text-gray-300 max-w-2xl mx-auto">
            See what our customers say about Scrubimail's email validation service.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-[#333333] dark:text-gray-300 mb-6 italic">
                "{testimonial.content}"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-[#333333] dark:text-white">{testimonial.name}</div>
                  <div className="text-sm text-[#333333]/70 dark:text-gray-400">{testimonial.role} at {testimonial.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection; 