import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Code, 
  Copy, 
  Check, 
  ExternalLink,
  ArrowRight,
  Terminal,
  Zap,
  BookOpen,
  FileCode,
  Database,
  Globe,
  Server,
  Cpu,
  Layers,
  Box,
  Gem
} from 'lucide-react';
import TopBar from '../components/TopBar';
import Footer from '../components/Footer';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';

const Integrations: React.FC = () => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const isAuthenticated = useIsAuthenticated();
  const languages = [
    {
      name: 'JavaScript',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
      color: 'bg-yellow-500',
      description: 'Perfect for web applications and Node.js projects',
      code: `// Using fetch API
const response = await fetch('https://api.scrubimail.com/v1/validate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com'
  })
});

const result = await response.json();
console.log(result);`,
      docs: 'https://docs.scrubimail.com/javascript'
    },
    {
      name: 'Python',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
      color: 'bg-blue-500',
      description: 'Ideal for data processing and automation scripts',
      code: `import requests

response = requests.post(
    'https://api.scrubimail.com/v1/validate',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={'email': 'user@example.com'}
)

result = response.json()
print(result)`,
      docs: 'https://docs.scrubimail.com/python'
    },
    {
      name: 'PHP',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
      color: 'bg-purple-500',
      description: 'Great for web applications and WordPress plugins',
      code: `$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.scrubimail.com/v1/validate');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['email' => 'user@example.com']));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);`,
      docs: 'https://docs.scrubimail.com/php'
    },
    {
      name: 'Node.js',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
      color: 'bg-green-500',
      description: 'Perfect for server-side applications and APIs',
      code: `const axios = require('axios');

const response = await axios.post('https://api.scrubimail.com/v1/validate', {
  email: 'user@example.com'
}, {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

console.log(response.data);`,
      docs: 'https://docs.scrubimail.com/nodejs'
    },
    {
      name: 'Ruby',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg',
      color: 'bg-red-500',
      description: 'Excellent for Rails applications and scripting',
      code: `require 'net/http'
require 'json'

uri = URI('https://api.scrubimail.com/v1/validate')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true

request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_API_KEY'
request['Content-Type'] = 'application/json'
request.body = { email: 'user@example.com' }.to_json

response = http.request(request)
result = JSON.parse(response.body)`,
      docs: 'https://docs.scrubimail.com/ruby'
    },
    {
      name: 'Go',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
      color: 'bg-blue-600',
      description: 'High-performance applications and microservices',
      code: `package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

type EmailRequest struct {
    Email string \`json:"email"\`
}

func validateEmail(email string) {
    data := EmailRequest{Email: email}
    jsonData, _ := json.Marshal(data)
    
    req, _ := http.NewRequest("POST", "https://api.scrubimail.com/v1/validate", bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
}`,
      docs: 'https://docs.scrubimail.com/go'
    },
    {
      name: 'Java',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
      color: 'bg-orange-500',
      description: 'Enterprise applications and Android development',
      code: `import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

HttpClient client = HttpClient.newHttpClient();
String json = "{\\"email\\": \\"user@example.com\\"}";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.scrubimail.com/v1/validate"))
    .header("Authorization", "Bearer YOUR_API_KEY")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(json))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
      docs: 'https://docs.scrubimail.com/java'
    },
    {
      name: 'C#',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
      color: 'bg-purple-600',
      description: 'Perfect for .NET applications and Unity games',
      code: `using System.Net.Http;
using System.Text;
using Newtonsoft.Json;

var client = new HttpClient();
var data = new { email = "user@example.com" };
var json = JsonConvert.SerializeObject(data);
var content = new StringContent(json, Encoding.UTF8, "application/json");

client.DefaultRequestHeaders.Add("Authorization", "Bearer YOUR_API_KEY");

var response = await client.PostAsync("https://api.scrubimail.com/v1/validate", content);
var result = await response.Content.ReadAsStringAsync();`,
      docs: 'https://docs.scrubimail.com/csharp'
    }
  ];

  const copyToClipboard = async (code: string, language: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(language);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-[#F4F5F7] to-white dark:from-gray-900 dark:to-gray-800">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-[#333333] dark:text-white mb-6">
              Easy Integration
            </h1>
            <p className="text-xl text-[#333333]/70 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Integrate with your favorite programming languages and frameworks in minutes. 
              Our RESTful API works seamlessly with any technology stack.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/api-docs"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] text-white font-semibold rounded-lg hover:from-[#00C48C] hover:to-[#2ED8A3] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                View Full Documentation
              </Link>
              {!isAuthenticated && <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 border-2 border-[#004E8A] text-[#004E8A] dark:text-[#2ED8A3] font-semibold rounded-lg hover:bg-[#004E8A] hover:text-white dark:hover:bg-[#2ED8A3] transition-all duration-200"
              >
                Get API Key
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>}
            </div>
          </div>
        </div>
      </section>

      {/* Language Grid */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
              Supported Languages & Frameworks
            </h2>
            <p className="text-xl text-[#333333]/70 dark:text-gray-300 max-w-2xl mx-auto">
              Choose your preferred language and get started in minutes with our comprehensive code examples.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {languages.map((language, index) => (
              <div key={index} className="bg-[#F4F5F7] dark:bg-gray-800 rounded-xl p-8 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center mr-4">
                    <img src={language.icon} alt={language.name} className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#333333] dark:text-white">{language.name}</h3>
                    <p className="text-[#333333]/70 dark:text-gray-400">{language.description}</p>
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-4 mb-6 relative">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-400 text-sm font-mono">{language.name}</span>
                    <button
                      onClick={() => copyToClipboard(language.code, language.name)}
                      className="flex items-center text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {copiedCode === language.name ? (
                        <Check className="w-4 h-4 mr-1" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      {copiedCode === language.name ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-sm text-green-400 overflow-x-auto">
                    <code>{language.code}</code>
                  </pre>
                </div>
                
                <div className="flex items-center justify-between">
                  <a
                    href={language.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-[#2ED8A3] hover:text-[#00C48C] transition-colors duration-200"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Documentation
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-4 py-2 bg-[#2ED8A3] text-white rounded-lg hover:bg-[#00C48C] transition-colors duration-200"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="py-24 bg-[#F4F5F7] dark:bg-gray-800">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#333333] dark:text-white mb-4">
              Get Started in 3 Steps
            </h2>
            <p className="text-xl text-[#333333]/70 dark:text-gray-300 max-w-2xl mx-auto">
              From signup to your first API call in under 5 minutes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-[#333333] dark:text-white mb-2">
                Sign Up & Get API Key
              </h3>
              <p className="text-[#333333]/70 dark:text-gray-400">
                Create your account and receive your unique API key instantly
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-[#333333] dark:text-white mb-2">
                Choose Your Language
              </h3>
              <p className="text-[#333333]/70 dark:text-gray-400">
                Pick from 8+ programming languages with ready-to-use code examples
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-[#333333] dark:text-white mb-2">
                Start Validating
              </h3>
              <p className="text-[#333333]/70 dark:text-gray-400">
                Make your first API call and get instant email validation results
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A]">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Integrate?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who trust Scrubimail for their email validation needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/onboarding"
              className="inline-flex items-center px-8 py-4 bg-white text-[#004E8A] font-semibold rounded-3xl hover:bg-gray-100 transition-all duration-200 shadow-lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Free Trial
            </Link>
            <Link
              to="/api-docs"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-3xl hover:bg-white hover:text-[#004E8A] transition-all duration-200"
            >
              <Terminal className="w-5 h-5 mr-2" />
              View API Docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Integrations; 