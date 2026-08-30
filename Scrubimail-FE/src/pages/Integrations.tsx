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
const response = await fetch('https://api.scrubimail.com/scrubimail/api/v1/validate/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    real_time: true
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
    'https://api.scrubimail.com/scrubimail/api/v1/validate/',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={'email': 'user@example.com', 'real_time': True}
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
curl_setopt($ch, CURLOPT_URL, 'https://api.scrubimail.com/scrubimail/api/v1/validate/');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['email' => 'user@example.com', 'real_time' => true]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

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

const response = await axios.post('https://api.scrubimail.com/scrubimail/api/v1/validate/', {
  email: 'user@example.com',
  real_time: true
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

uri = URI('https://api.scrubimail.com/scrubimail/api/v1/validate/')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true

request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_API_KEY'
request['Content-Type'] = 'application/json'
request.body = { email: 'user@example.com', real_time: true }.to_json

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
    data := map[string]interface{}{
        "email": email,
        "real_time": true,
    }
    jsonData, _ := json.Marshal(data)
    
    req, _ := http.NewRequest("POST", "https://api.scrubimail.com/scrubimail/api/v1/validate/", bytes.NewBuffer(jsonData))
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
String json = "{\\"email\\": \\"user@example.com\\", \\"real_time\\": true}";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.scrubimail.com/scrubimail/api/v1/validate/"))
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
var data = new { email = "user@example.com", real_time = true };
var json = JsonConvert.SerializeObject(data);
var content = new StringContent(json, Encoding.UTF8, "application/json");

client.DefaultRequestHeaders.Add("Authorization", "Bearer YOUR_API_KEY");

var response = await client.PostAsync("https://api.scrubimail.com/scrubimail/api/v1/validate/", content);
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
    <div className="min-h-screen">
      <div className="w-full space-y-8">
        {/* Header */}
        <div>
          <p className="font-label uppercase tracking-[0.2em] text-[9px] text-primary mb-1">SDK Reference</p>
          <h1 className="font-headline font-black text-foreground text-3xl tracking-tight mb-2">Integrations</h1>
          <p className="font-label uppercase tracking-[0.1em] text-[10px] text-muted-foreground">Native SDK examples for every major language and platform</p>
        </div>

        {/* Language cards */}
        <div className="space-y-4">
          {languages.map((lang) => (
            <div key={lang.name} className="bg-card border border-border/40 rounded-sm overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted/40 border border-border/40 rounded-sm flex items-center justify-center overflow-hidden">
                    <img src={lang.icon} alt={lang.name} className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                  </div>
                  <div>
                    <p className="font-headline font-bold text-foreground text-sm tracking-tight">{lang.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground/60">{lang.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={lang.docs} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 border border-border/40 text-muted-foreground font-mono uppercase tracking-[0.1em] text-[9px] px-3 py-1.5 rounded-sm hover:border-primary/40 hover:text-primary transition-colors">
                    <ExternalLink className="w-3 h-3" /> Docs
                  </a>
                </div>
              </div>
              {/* Code block */}
              <div className="relative">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/20" style={{ backgroundColor: 'var(--color-zinc-950, #0a0f13)' }}>
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-muted/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-muted/40" />
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground/70 uppercase tracking-[0.2em]">{lang.name.toLowerCase()}.snippet</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(lang.code); setCopiedCode(lang.name); setTimeout(() => setCopiedCode(null), 2000); }}
                    className="flex items-center gap-1 text-muted-foreground/70 hover:text-primary transition-colors font-mono text-[9px] uppercase tracking-[0.1em]"
                  >
                    {copiedCode === lang.name ? <><Check className="w-3 h-3 text-primary" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <pre className="p-4 font-mono text-xs text-primary/80 overflow-x-auto max-h-52 leading-relaxed" style={{ backgroundColor: 'var(--color-zinc-950, #0a0f13)' }}>
                  <code>{lang.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        {!isAuthenticated && (
          <div className="border border-primary/20 rounded-sm p-8 text-center" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(110,255,192,0.04) 0%, transparent 60%)' }}>
            <p className="font-label uppercase tracking-[0.2em] text-[9px] text-primary mb-3">Get Started</p>
            <h2 className="font-headline font-black text-foreground text-2xl tracking-tight mb-3">Ready to integrate?</h2>
            <p className="font-mono text-xs text-muted-foreground/60 mb-6">Create a free account and get your API key to start validating emails in minutes.</p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/register" className="bg-primary text-primary-foreground font-mono uppercase tracking-[0.1em] text-[10px] font-bold px-6 py-3 rounded-sm hover:brightness-105 transition-all">
                Get API Key
              </Link>
              <Link to="/api-docs" className="border border-border/40 text-muted-foreground font-mono uppercase tracking-[0.1em] text-[10px] px-6 py-3 rounded-sm hover:border-primary/40 hover:text-primary transition-all">
                View Docs
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Integrations; 