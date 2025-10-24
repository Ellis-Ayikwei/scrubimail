# Validation Page Module

This directory contains the refactored Validation page with a modular structure for better maintainability and responsiveness.

## Structure

```
Validation/
├── index.tsx                 # Main Validation component
├── components/
│   ├── ValidationForm.tsx    # Form component for single/bulk validation
│   ├── ValidationResults.tsx # Results display component
│   ├── QuickStats.tsx        # Statistics display component
│   ├── HelpCard.tsx          # Help and documentation card
│   └── ApiKeyModal.tsx       # API key selection modal (Headless UI)
└── README.md                 # This file
```

## Components

### ValidationForm
- Handles both single email and bulk validation forms
- Responsive design with mobile-first approach
- Includes file upload for bulk validation
- Shows bulk job status and progress

### ValidationResults
- Displays validation results with detailed breakdown
- Responsive grid layout for result cards
- Expandable detailed view with comprehensive checks
- Shows warnings, suggestions, and raw data

### QuickStats
- Displays validation statistics
- Responsive text sizing and layout

### HelpCard
- Provides help links and documentation
- Responsive button layout

### ApiKeyModal
- Uses Headless UI Dialog for accessibility
- Responsive modal design
- API key selection and management
- Copy functionality with visual feedback

## Responsive Features

- **Mobile-first design**: Optimized for small screens first
- **Breakpoint system**: Uses `sm:`, `md:`, `lg:` for progressive enhancement
- **Flexible layouts**: Grid and flex layouts that adapt to screen size
- **Touch-friendly**: Proper button sizes and spacing for mobile
- **Text scaling**: Responsive typography that works on all devices
- **Modal responsiveness**: Full-screen on mobile, centered on desktop

## Dependencies

- React
- Headless UI (Dialog, Transition)
- Lucide React (Icons)
- Tailwind CSS (Styling)
- Axios (API calls)

## Usage

The main Validation component can be imported and used as a regular React component:

```tsx
import Validation from './pages/Validation';

// Use in your routing
<Route path="/validation" element={<Validation />} />
```

## Key Features

- **Modular Architecture**: Separated concerns into focused components
- **Responsive Design**: Works seamlessly across all device sizes
- **Accessibility**: Uses Headless UI for proper modal behavior
- **Type Safety**: Full TypeScript support with proper interfaces
- **Performance**: Optimized rendering and state management
- **User Experience**: Intuitive interface with clear feedback
