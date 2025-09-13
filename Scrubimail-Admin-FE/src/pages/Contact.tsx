import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  MessageSquare,
  Headphones,
  FileText,
  BookOpen,
  Code,
  Zap,
  ArrowRight
} from 'lucide-react';
import TopBar from '../components/TopBar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', company: '', subject: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);
    }, 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help with technical questions and API integration',
      contact: 'support@scrubimail.com',
      response: 'Response within 2 hours'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Speak directly with our technical team',
      contact: '+1 (555) 123-4567',
      response: 'Available 9AM-6PM EST'
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Instant support for urgent issues',
      contact: 'Available on dashboard',
      response: 'Real-time responses'
    }
  ];

  const supportTopics = [
    {
      icon: FileText,
      title: 'API Documentation',
      description: 'Comprehensive guides and examples',
      link: '/api-docs'
    },
    {
      icon: Headphones,
      title: 'Help Center',
      description: 'FAQs and troubleshooting guides',
      link: '/help'
    },
    {
      icon: MessageSquare,
      title: 'Community Forum',
      description: 'Connect with other developers',
      link: '/community'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">      
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-[#F4F5F7] to-white dark:from-gray-900 dark:to-gray-800">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-[#333333] dark:text-white mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-[#333333]/70 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Have questions? We're here to help. Get in touch with our team for support, sales inquiries, or general questions.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Customer Support',
                description: 'Get help with your account, API integration, or technical issues.',
                email: 'support@scrubimail.com',
                icon: '🤝'
              },
              {
                title: 'Sales Inquiries',
                description: 'Learn about our enterprise plans and custom solutions.',
                email: 'sales@scrubimail.com',
                icon: '💼'
              },
              {
                title: 'Partnerships',
                description: 'Interested in partnering with Scrubimail? Let\'s talk.',
                email: 'partnerships@scrubimail.com',
                icon: '🤝'
              }
            ].map((method, index) => (
              <div key={index} className="bg-[#F4F5F7] dark:bg-gray-800 rounded-xl p-8 text-center hover:shadow-lg transition-all duration-200">
                <div className="text-4xl mb-4">{method.icon}</div>
                <h3 className="text-xl font-semibold text-[#333333] dark:text-white mb-3">{method.title}</h3>
                <p className="text-[#333333]/70 dark:text-gray-400 mb-4">{method.description}</p>
                <a
                  href={`mailto:${method.email}`}
                  className="text-[#2ED8A3] hover:text-[#00C48C] transition-colors duration-200"
                >
                  {method.email}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24 bg-[#F4F5F7] dark:bg-gray-800">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
                Send Us a Message
              </h2>
              <p className="text-xl text-[#333333]/70 dark:text-gray-300">
                Fill out the form below and we'll get back to you within 24 hours.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-[#333333] dark:text-white mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-800 text-[#333333] dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-[#333333] dark:text-white mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-800 text-[#333333] dark:text-white"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-[#333333] dark:text-white mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-800 text-[#333333] dark:text-white"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="subject" className="block text-sm font-medium text-[#333333] dark:text-white mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-800 text-[#333333] dark:text-white"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="sales">Sales Question</option>
                  <option value="billing">Billing Question</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-[#333333] dark:text-white mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent bg-white dark:bg-gray-800 text-[#333333] dark:text-white resize-vertical"
                  placeholder="Tell us how we can help you..."
                ></textarea>
              </div>
              
              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] text-white font-semibold rounded-lg hover:from-[#00C48C] hover:to-[#2ED8A3] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
              
              {submitStatus && (
                <div className={`mt-6 p-4 rounded-lg text-center ${
                  submitStatus.success 
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                }`}>
                  {submitStatus.message}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Office Info */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-6">
                Our Office
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="w-6 h-6 text-[#2ED8A3] mr-4 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-1">Address</h3>
                    <p className="text-[#333333]/70 dark:text-gray-400">
                      123 Innovation Drive<br />
                      San Francisco, CA 94105<br />
                      United States
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="w-6 h-6 text-[#2ED8A3] mr-4 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-1">Business Hours</h3>
                    <p className="text-[#333333]/70 dark:text-gray-400">
                      Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                      Saturday: 10:00 AM - 4:00 PM PST<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-6 h-6 text-[#2ED8A3] mr-4 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-1">Phone</h3>
                    <p className="text-[#333333]/70 dark:text-gray-400">
                      +1 (555) 123-4567
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#F4F5F7] dark:bg-gray-800 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-[#333333] dark:text-white mb-6">
                Support Resources
              </h3>
              <div className="space-y-4">
                <Link
                  to="/help"
                  className="flex items-center p-4 bg-white dark:bg-gray-900 rounded-lg hover:shadow-md transition-all duration-200"
                >
                  <BookOpen className="w-5 h-5 text-[#2ED8A3] mr-3" />
                  <div>
                    <h4 className="font-semibold text-[#333333] dark:text-white">Help Center</h4>
                    <p className="text-sm text-[#333333]/70 dark:text-gray-400">Find answers to common questions</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
                <Link
                  to="/api-docs"
                  className="flex items-center p-4 bg-white dark:bg-gray-900 rounded-lg hover:shadow-md transition-all duration-200"
                >
                  <Code className="w-5 h-5 text-[#2ED8A3] mr-3" />
                  <div>
                    <h4 className="font-semibold text-[#333333] dark:text-white">API Documentation</h4>
                    <p className="text-sm text-[#333333]/70 dark:text-gray-400">Complete API reference and guides</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
                <Link
                  to="/integrations"
                  className="flex items-center p-4 bg-white dark:bg-gray-900 rounded-lg hover:shadow-md transition-all duration-200"
                >
                  <Zap className="w-5 h-5 text-[#2ED8A3] mr-3" />
                  <div>
                    <h4 className="font-semibold text-[#333333] dark:text-white">Integration Guides</h4>
                    <p className="text-sm text-[#333333]/70 dark:text-gray-400">Step-by-step integration tutorials</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
};

export default Contact; 