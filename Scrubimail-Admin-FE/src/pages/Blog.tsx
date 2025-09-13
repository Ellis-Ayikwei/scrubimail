import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowRight,
  Search,
  Tag,
  BookOpen,
  Check
} from 'lucide-react';
import TopBar from '../components/TopBar';
import Footer from '../components/Footer';

const Blog: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  const categories = [
    { id: 'all', name: 'All Posts' },
    { id: 'api', name: 'API Tips' },
    { id: 'email', name: 'Email Validation' },
    { id: 'integration', name: 'Integration Guides' },
    { id: 'industry', name: 'Industry Insights' }
  ];

  const blogPosts = [
    {
      id: 1,
      title: 'The Complete Guide to Email Validation in 2024',
      excerpt: 'Learn the best practices for email validation, including syntax checks, DNS verification, and SMTP testing to ensure your emails reach their destination.',
      author: 'Alex Johnson',
      date: '2024-01-15',
      readTime: '8 min read',
      category: 'email',
      tags: ['email validation', 'best practices', 'deliverability'],
      featured: true
    },
    {
      id: 2,
      title: 'How to Integrate Email Validation in Your Node.js App',
      excerpt: 'Step-by-step guide to implementing email validation in your Node.js application using our REST API with practical code examples.',
      author: 'Sarah Chen',
      date: '2024-01-10',
      readTime: '6 min read',
      category: 'integration',
      tags: ['node.js', 'api', 'integration']
    },
    {
      id: 3,
      title: 'Understanding Email Bounce Rates and How to Reduce Them',
      excerpt: 'Deep dive into email bounce rates, their causes, and proven strategies to minimize them for better email deliverability.',
      author: 'Marcus Rodriguez',
      date: '2024-01-05',
      readTime: '10 min read',
      category: 'industry',
      tags: ['bounce rates', 'deliverability', 'email marketing']
    },
    {
      id: 4,
      title: 'API Rate Limiting: Best Practices for Email Validation',
      excerpt: 'Learn how to implement proper rate limiting when using email validation APIs to avoid hitting limits and ensure smooth operation.',
      author: 'Alex Johnson',
      date: '2023-12-28',
      readTime: '5 min read',
      category: 'api',
      tags: ['rate limiting', 'api', 'performance']
    },
    {
      id: 5,
      title: 'The Impact of Disposable Emails on Your Business',
      excerpt: 'Explore how disposable email addresses can affect your business metrics and learn strategies to identify and handle them effectively.',
      author: 'Sarah Chen',
      date: '2023-12-20',
      readTime: '7 min read',
      category: 'industry',
      tags: ['disposable emails', 'fraud prevention', 'business']
    },
    {
      id: 6,
      title: 'Building a Robust Email Validation System with Python',
      excerpt: 'Comprehensive tutorial on building a reliable email validation system using Python and our API with error handling and caching.',
      author: 'Marcus Rodriguez',
      date: '2023-12-15',
      readTime: '12 min read',
      category: 'integration',
      tags: ['python', 'system design', 'caching']
    }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = blogPosts.find(post => post.featured);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <TopBar />
      
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-[#F4F5F7] to-white dark:from-gray-900 dark:to-gray-800">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-[#333333] dark:text-white mb-6">
              Scrubimail Blog
            </h1>
            <p className="text-xl text-[#333333]/70 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Insights, tutorials, and updates from the world of email validation and deliverability.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search articles..."
                  className="w-full px-6 py-4 pl-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2ED8A3] focus:border-transparent text-[#333333] dark:text-white"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 justify-center">
            {['All', 'Email Validation', 'API Guides', 'Best Practices', 'Case Studies', 'Updates'].map((category) => (
              <button
                key={category}
                className="px-6 py-3 bg-[#F4F5F7] dark:bg-gray-800 text-[#333333] dark:text-white rounded-lg hover:bg-[#2ED8A3] hover:text-white transition-all duration-200"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#F4F5F7] dark:bg-gray-800 rounded-xl p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-block px-3 py-1 bg-[#2ED8A3] text-white text-sm font-medium rounded-full mb-4">
                  Featured
                </span>
                <h2 className="text-3xl font-bold text-[#333333] dark:text-white mb-4">
                  The Complete Guide to Email Validation in 2024
                </h2>
                <p className="text-lg text-[#333333]/70 dark:text-gray-400 mb-6">
                  Learn everything you need to know about email validation, from basic syntax checking to advanced deliverability techniques that will improve your email marketing success.
                </p>
                <div className="flex items-center text-sm text-[#333333]/60 dark:text-gray-500 mb-6">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>January 15, 2024</span>
                  <span className="mx-2">•</span>
                  <Clock className="w-4 h-4 mr-2" />
                  <span>8 min read</span>
                </div>
                <Link
                  to="/blog/complete-guide-email-validation-2024"
                  className="inline-flex items-center px-6 py-3 bg-[#2ED8A3] text-white font-semibold rounded-lg hover:bg-[#00C48C] transition-all duration-200"
                >
                  Read More
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
              <div className="bg-gradient-to-br from-[#2ED8A3] to-[#004E8A] rounded-lg p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">What You'll Learn</h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="w-5 h-5 mr-3" />
                    Email syntax validation techniques
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 mr-3" />
                    Domain and MX record checking
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 mr-3" />
                    Disposable email detection
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 mr-3" />
                    Best practices for implementation
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-16 bg-[#F4F5F7] dark:bg-gray-800">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'How to Implement Email Validation in React',
                excerpt: 'Step-by-step guide to adding email validation to your React applications using our API.',
                category: 'API Guides',
                date: 'January 12, 2024',
                readTime: '5 min read',
                image: '📱'
              },
              {
                title: 'The Impact of Email Validation on Deliverability',
                excerpt: 'Discover how proper email validation can significantly improve your email deliverability rates.',
                category: 'Best Practices',
                date: 'January 10, 2024',
                readTime: '6 min read',
                image: '📈'
              },
              {
                title: 'Case Study: How Company X Improved Conversion by 40%',
                excerpt: 'Real-world example of how implementing email validation led to dramatic improvements in conversion rates.',
                category: 'Case Studies',
                date: 'January 8, 2024',
                readTime: '7 min read',
                image: '🏆'
              },
              {
                title: 'New Features: Bulk Email Validation API',
                excerpt: 'Announcing our new bulk validation endpoint for processing thousands of emails efficiently.',
                category: 'Updates',
                date: 'January 5, 2024',
                readTime: '3 min read',
                image: '🚀'
              },
              {
                title: 'Email Validation vs Email Verification: What\'s the Difference?',
                excerpt: 'Understanding the key differences between validation and verification in email processing.',
                category: 'Email Validation',
                date: 'January 3, 2024',
                readTime: '4 min read',
                image: '🔍'
              },
              {
                title: 'Top 10 Email Validation Mistakes to Avoid',
                excerpt: 'Common pitfalls developers make when implementing email validation and how to avoid them.',
                category: 'Best Practices',
                date: 'December 30, 2023',
                readTime: '6 min read',
                image: '⚠️'
              }
            ].map((post, index) => (
              <article key={index} className="bg-white dark:bg-gray-900 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <div className="text-4xl mb-4">{post.image}</div>
                <span className="inline-block px-3 py-1 bg-[#F4F5F7] dark:bg-gray-800 text-[#2ED8A3] text-sm font-medium rounded-full mb-4">
                  {post.category}
                </span>
                <h3 className="text-xl font-bold text-[#333333] dark:text-white mb-3">
                  {post.title}
                </h3>
                <p className="text-[#333333]/70 dark:text-gray-400 mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center text-sm text-[#333333]/60 dark:text-gray-500 mb-4">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{post.date}</span>
                  <span className="mx-2">•</span>
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{post.readTime}</span>
                </div>
                <Link
                  to={`/blog/${post.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`}
                  className="inline-flex items-center text-[#2ED8A3] hover:text-[#00C48C] transition-colors duration-200"
                >
                  Read More
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A]">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Stay Updated
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Get the latest insights on email validation, API updates, and best practices delivered to your inbox.
          </p>
          <div className="max-w-md mx-auto">
            <div className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-l-lg border-0 focus:ring-2 focus:ring-white text-[#333333]"
              />
              <button className="px-6 py-3 bg-white text-[#004E8A] font-semibold rounded-r-lg hover:bg-gray-100 transition-all duration-200">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog; 