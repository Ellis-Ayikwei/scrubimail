import React from 'react';

const StatsSection: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="text-white">
            <div className="text-3xl md:text-4xl font-bold mb-2">10M+</div>
            <div className="text-white/80">Emails Validated</div>
          </div>
          <div className="text-white">
            <div className="text-3xl md:text-4xl font-bold mb-2">99.9%</div>
            <div className="text-white/80">Accuracy Rate</div>
          </div>
          <div className="text-white">
            <div className="text-3xl md:text-4xl font-bold mb-2">500ms</div>
            <div className="text-white/80">Avg Response</div>
          </div>
          <div className="text-white">
            <div className="text-3xl md:text-4xl font-bold mb-2">24/7</div>
            <div className="text-white/80">Uptime</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection; 