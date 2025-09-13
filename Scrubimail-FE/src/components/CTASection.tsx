import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code } from 'lucide-react';

const CTASection: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          Ready to Clean Your Email Lists?
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Join thousands of developers and businesses who trust Scrubimail for their email validation needs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/onboarding"
            className="inline-flex items-center px-8 py-4 bg-white text-[#004E8A] font-semibold rounded-3xl hover:bg-gray-100 transition-all duration-200 shadow-lg"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <Link
            to="/api-docs"
            className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-3xl hover:bg-white hover:text-[#004E8A] transition-all duration-200"
          >
            <Code className="w-5 h-5 mr-2" />
            View API Docs
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection; 