import React from 'react';
import TopBar from '../components/TopBar';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import StatsSection from '../components/StatsSection';
import HowItWorksSection from '../components/HowItWorksSection';
import IntegrationSection from '../components/IntegrationSection';
import TestimonialsSection from '../components/TestimonialsSection';
import UseCasesSection from '../components/UseCasesSection';
import PricingSection from '../components/PricingSection';
import CTASection from '../components/CTASection';

const Homepage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <TopBar />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <HowItWorksSection />
      <IntegrationSection />
      <TestimonialsSection />
      <UseCasesSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Homepage; 