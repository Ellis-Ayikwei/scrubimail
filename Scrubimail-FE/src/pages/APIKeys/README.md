# API Keys Module

This directory contains the refactored API Keys page, organized into a modular structure for better maintainability and reusability.

## Directory Structure

```
APIKeys/
├── index.tsx                 # Main API Keys page component
├── components/              # Reusable UI components
│   ├── ApiKeyList.tsx       # List view of API keys
│   ├── ApiKeyAnalytics.tsx  # Analytics dashboard
│   ├── CreateApiKeyModal.tsx # Create new API key modal
│   └── EditApiKeyModal.tsx  # Edit existing API key modal
├── hooks/                   # Custom React hooks
│   └── useApiKeys.ts        # API keys state management hook
├── types.ts                 # TypeScript type definitions
└── README.md               # This file
```

## Components

### Main Components
- **index.tsx**: Main page component that orchestrates all other components
- **ApiKeyList**: Displays the list of API keys with filtering and search
- **ApiKeyAnalytics**: Analytics dashboard (placeholder for future implementation)
- **CreateApiKeyModal**: Modal for creating new API keys with advanced options
- **EditApiKeyModal**: Modal for editing existing API keys

### Hooks
- **useApiKeys**: Custom hook that manages API keys state, loading, and CRUD operations

### Types
- **ApiKeyWithUsage**: Extended API key interface with usage data
- **UsageStats**: Statistics interface for dashboard metrics
- **CreateApiKeyData**: Interface for API key creation form data

## Benefits of This Structure

1. **Separation of Concerns**: Each component has a single responsibility
2. **Reusability**: Components can be easily reused in other parts of the application
3. **Maintainability**: Easier to locate and modify specific functionality
4. **Testing**: Individual components can be tested in isolation
5. **Scalability**: Easy to add new features without affecting existing code

## Usage

The main component (`index.tsx`) handles the overall page layout and state management, while delegating specific functionality to specialized components and hooks.
