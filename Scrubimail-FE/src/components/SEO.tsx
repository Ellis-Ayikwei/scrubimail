import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  keywords?: string[];
}

const SEO: React.FC<SEOProps> = ({
  title = 'ScrubiMail - Email Validation SaaS',
  description = 'Powerful email validation and verification. Improve deliverability, reduce bounce rates, and keep your lists clean.',
  canonical,
  ogImage = 'https://scrubimail.com/og-image.jpg',
  ogType = 'website',
  noindex = false,
  keywords = [],
}) => {
  useEffect(() => {
    // Set document title
    const fullTitle = title.includes('ScrubiMail') ? title : `${title} | ScrubiMail`;
    document.title = fullTitle;

    // Update or create meta tags
    const updateMeta = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Primary Meta Tags
    updateMeta('title', fullTitle);
    updateMeta('description', description);
    
    const defaultKeywords = [
      'email validation',
      'email verification',
      'email checker',
      'email list cleaning',
      'email deliverability',
      'ScrubiMail',
    ];
    const allKeywords = [...defaultKeywords, ...keywords].join(', ');
    updateMeta('keywords', allKeywords);
    updateMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Canonical URL
    const url = canonical || `https://scrubimail.com${window.location.pathname}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = url;

    // Open Graph / Facebook
    updateMeta('og:type', ogType, true);
    updateMeta('og:url', url, true);
    updateMeta('og:title', fullTitle, true);
    updateMeta('og:description', description, true);
    updateMeta('og:image', ogImage, true);
    updateMeta('og:site_name', 'ScrubiMail', true);

    // Twitter
    updateMeta('twitter:card', 'summary_large_image', true);
    updateMeta('twitter:url', url, true);
    updateMeta('twitter:title', fullTitle, true);
    updateMeta('twitter:description', description, true);
    updateMeta('twitter:image', ogImage, true);

  }, [title, description, canonical, ogImage, ogType, noindex, keywords]);

  return null;
};

export default SEO;
