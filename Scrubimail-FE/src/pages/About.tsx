import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, 
  Globe, 
  Users, 
  Clock, 
  Check, 
  Star,
  ArrowRight
} from 'lucide-react';
import TopBar from '../components/TopBar';
import Footer from '../components/Footer';

const About: React.FC = () => {
  const values = [
    {
      icon: Target,
      title: 'Accuracy First',
      description: 'We prioritize precision and reliability in every validation check.'
    },
    {
      icon: Shield,
      title: 'Security & Privacy',
      description: 'Your data is protected with enterprise-grade security measures.'
    },
    {
      icon: TrendingUp,
      title: 'Continuous Innovation',
      description: 'We constantly improve our algorithms and add new features.'
    },
    {
      icon: Users,
      title: 'Developer Focused',
      description: 'Built by developers, for developers with the best DX in mind.'
    }
  ];

  const milestones = [
    {
      year: '2024',
      title: '10M+ Emails Validated',
      description: 'Reached a major milestone in email validation volume'
    },
    {
      year: '2023',
      title: 'Enterprise Launch',
      description: 'Launched enterprise features and custom integrations'
    },
    {
      year: '2022',
      title: 'API Platform Launch',
      description: 'Released our first public API with 8 language SDKs'
    },
    {
      year: '2021',
      title: 'Company Founded',
      description: 'Scrubimail was founded with a mission to clean email data'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <TopBar />
      
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-[#F4F5F7] to-white dark:from-gray-900 dark:to-gray-800">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-[#333333] dark:text-white mb-6">
              About Scrubimail
            </h1>
            <p className="text-xl text-[#333333]/70 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              We're revolutionizing email validation with cutting-edge technology and a commitment to accuracy, speed, and reliability.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-[#333333]/70 dark:text-gray-300 mb-6">
                To provide the most accurate, fastest, and most reliable email validation service that helps businesses maintain clean email lists and improve their communication effectiveness.
              </p>
              <p className="text-lg text-[#333333]/70 dark:text-gray-300">
                We believe that every email matters, and our advanced validation technology ensures that your messages reach real, active recipients who want to hear from you.
              </p>
            </div>
            <div className="bg-[#F4F5F7] dark:bg-gray-800 rounded-xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                    99.9%
                  </div>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">Accuracy Rate</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                    &lt;100ms
                  </div>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">Response Time</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                    24/7
                  </div>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">Uptime</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                    10K+
                  </div>
                  <p className="text-sm text-[#333333]/70 dark:text-gray-400">Customers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-[#F4F5F7] dark:bg-gray-800">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
              Our Values
            </h2>
            <p className="text-xl text-[#333333]/70 dark:text-gray-300 max-w-2xl mx-auto">
              The principles that guide everything we do at Scrubimail.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Accuracy',
                description: 'We prioritize precision in every validation, ensuring you get reliable results you can trust.',
                icon: '🎯'
              },
              {
                title: 'Speed',
                description: 'Fast response times mean your applications stay responsive and your users stay happy.',
                icon: '⚡'
              },
              {
                title: 'Reliability',
                description: 'Our infrastructure is built for 99.9% uptime, so your business never stops.',
                icon: '🛡️'
              },
              {
                title: 'Innovation',
                description: 'We continuously improve our technology to stay ahead of email validation challenges.',
                icon: '🚀'
              },
              {
                title: 'Security',
                description: 'Your data is protected with enterprise-grade security and privacy measures.',
                icon: '🔒'
              },
              {
                title: 'Support',
                description: 'Our team is here to help you succeed with exceptional customer support.',
                icon: '🤝'
              }
            ].map((value, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center hover:shadow-lg transition-all duration-200">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-[#333333] dark:text-white mb-3">{value.title}</h3>
                <p className="text-[#333333]/70 dark:text-gray-400">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
              Our Journey
            </h2>
            <p className="text-xl text-[#333333]/70 dark:text-gray-300 max-w-2xl mx-auto">
              Key milestones in our mission to revolutionize email validation.
            </p>
          </div>
          
          <div className="space-y-12">
            {[
              {
                year: '2023',
                title: 'Company Founded',
                description: 'Scrubimail was established with a vision to solve email validation challenges.'
              },
              {
                year: '2024',
                title: 'API Launch',
                description: 'Released our RESTful API with support for 8+ programming languages.'
              },
              {
                year: '2024',
                title: '10,000+ Customers',
                description: 'Reached a major milestone serving thousands of businesses worldwide.'
              },
              {
                year: '2025',
                title: 'Advanced Features',
                description: 'Introduced real-time validation, bulk processing, and advanced analytics.'
              }
            ].map((milestone, index) => (
              <div key={index} className="flex items-center">
                <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {milestone.year}
                </div>
                <div className="ml-8">
                  <h3 className="text-2xl font-bold text-[#333333] dark:text-white mb-2">{milestone.title}</h3>
                  <p className="text-lg text-[#333333]/70 dark:text-gray-400">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-[#F4F5F7] dark:bg-gray-800">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-[#333333]/70 dark:text-gray-300 max-w-2xl mx-auto">
              The passionate individuals behind Scrubimail's success.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                role: 'CEO & Founder',
                bio: 'Former senior engineer at Google with 10+ years in email infrastructure.',
                avatar: '👩‍💼'
              },
              {
                name: 'Michael Chen',
                role: 'CTO',
                bio: 'Expert in distributed systems and API architecture with a focus on scalability.',
                avatar: '👨‍💻'
              },
              {
                name: 'Emily Rodriguez',
                role: 'Head of Product',
                bio: 'Product leader with experience building developer tools and SaaS platforms.',
                avatar: '👩‍🎨'
              },
              {
                name: 'David Kim',
                role: 'Lead Engineer',
                bio: 'Full-stack developer specializing in high-performance validation systems.',
                avatar: '👨‍🔧'
              },
              {
                name: 'Lisa Thompson',
                role: 'Head of Customer Success',
                bio: 'Dedicated to ensuring every customer gets the most value from our platform.',
                avatar: '👩‍💬'
              },
              {
                name: 'Alex Morgan',
                role: 'Security Engineer',
                bio: 'Cybersecurity expert ensuring our platform meets the highest security standards.',
                avatar: '👨‍🔒'
              }
            ].map((member, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center hover:shadow-lg transition-all duration-200">
                <div className="text-6xl mb-4">{member.avatar}</div>
                <h3 className="text-xl font-semibold text-[#333333] dark:text-white mb-2">{member.name}</h3>
                <p className="text-[#2ED8A3] font-medium mb-3">{member.role}</p>
                <p className="text-[#333333]/70 dark:text-gray-400">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A]">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Join Our Mission
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Ready to experience the most accurate email validation service? Get started today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 bg-white text-[#004E8A] font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-lg"
            >
              Start Free Trial
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-[#004E8A] transition-all duration-200"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About; 