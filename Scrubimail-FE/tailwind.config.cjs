/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        container: {
            center: true,
        },
        extend: {
            colors: {
                // Core brand colors with standard Tailwind scale
                primary: {
                    50: '#f0fdfa', // Lightest tint
                    100: '#ccfbf1', // Very light
                    200: '#99f6e4', // Light
                    300: '#5eead4', // Medium light
                    400: '#2dd4bf', // Medium
                    500: '#2ED8A3', // DEFAULT - Teal
                    600: '#14b8a6', // Darker
                    700: '#0d9488', // Dark
                    800: '#0f766e', // Very dark
                    900: '#134e4a', // Darkest
                    DEFAULT: '#2ED8A3',
                    light: '#ccfbf1',
                    'dark-light': 'rgba(46, 216, 163, 0.15)',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    50: '#fff5f2', // Lightest tint
                    100: '#ffeae0', // Very light
                    200: '#ffd5c7', // Light
                    300: '#ffb59e', // Medium light
                    400: '#ff8d67', // Medium
                    500: '#FF6B35', // DEFAULT - Coral-orange
                    600: '#e5522a', // Darker
                    700: '#cc3e1f', // Dark
                    800: '#b32b14', // Very dark
                    900: '#99180a', // Darkest
                    DEFAULT: '#FF6B35',
                    light: '#ffeae0',
                    'dark-light': 'rgba(255, 107, 53, 0.15)',
                    foreground: 'hsl(var(--secondary-foreground))',
                },

                // Semantic colors with full scales
                success: {
                    50: '#f3f2fc',
                    100: '#e8eaf6',
                    200: '#d1d4ed',
                    300: '#a3a9d9',
                    400: '#7575c0',
                    500: '#2E2787', // Using primary for trust
                    600: '#252060',
                    700: '#1c1849',
                    800: '#131132',
                    900: '#0a091b',
                    DEFAULT: '#2E2787',
                    light: '#e8eaf6',
                    'dark-light': 'rgba(46, 39, 135, 0.15)',
                },
                danger: {
                    50: '#fef2f2',
                    100: '#fee2e2',
                    200: '#fecaca',
                    300: '#fca5a5',
                    400: '#f87171',
                    500: '#D32F2F', // Error red
                    600: '#b91c1c',
                    700: '#991b1b',
                    800: '#7f1d1d',
                    900: '#651616',
                    DEFAULT: '#D32F2F',
                    light: '#fee2e2',
                    'dark-light': 'rgba(211, 47, 47, 0.15)',
                },
                warning: {
                    50: '#fff5f2',
                    100: '#fff0e6',
                    200: '#ffd5c7',
                    300: '#ffb59e',
                    400: '#ff8d67',
                    500: '#FF6B35', // Secondary = alerts
                    600: '#e5522a',
                    700: '#cc3e1f',
                    800: '#b32b14',
                    900: '#99180a',
                    DEFAULT: '#FF6B35',
                    light: '#fff0e6',
                    'dark-light': 'rgba(255, 107, 53, 0.15)',
                },
                info: {
                    50: '#e3f2fd',
                    100: '#bbdefb',
                    200: '#90caf9',
                    300: '#64b5f6',
                    400: '#42a5f5',
                    500: '#2196F3', // Blue for info
                    600: '#1e88e5',
                    700: '#1976d2',
                    800: '#1565c0',
                    900: '#0d47a1',
                    DEFAULT: '#2196F3',
                    light: '#e3f2fd',
                    'dark-light': 'rgba(33, 150, 243, 0.15)',
                },

                // Neutrals (from design system)
                dark: {
                    50: '#f9f9f9',
                    100: '#f4f4f4',
                    200: '#e9e9e9',
                    300: '#d1d1d1',
                    400: '#a3a3a3',
                    500: '#6D6D6D', // Secondary text
                    600: '#525252',
                    700: '#404040',
                    800: '#2D2D2D', // Body text
                    900: '#171717',
                    DEFAULT: '#2D2D2D',
                    light: '#6D6D6D',
                    'dark-light': 'rgba(45, 45, 45, 0.15)',
                },
                black: {
                    50: '#f7f8fa',
                    100: '#e8eaf6',
                    200: '#d1d4ed',
                    300: '#a3a9d9',
                    400: '#7575c0',
                    500: '#2D2D2D', // Dark gray
                    600: '#252060',
                    700: '#1c1849',
                    800: '#131132',
                    900: '#0e1726', // Deep dark
                    DEFAULT: '#0e1726',
                    light: '#2D2D2D',
                    'dark-light': 'rgba(14, 23, 38, 0.15)',
                },
                // Terminal design system tokens
                surface: {
                    DEFAULT: '#101418',
                    dim: '#101418',
                    bright: '#353a3e',
                    container: {
                        DEFAULT: '#1c2024',
                        low: '#181c20',
                        high: '#262a2f',
                        highest: '#31353a',
                        lowest: '#0a0f13',
                    },
                },
                neon: {
                    DEFAULT: '#6effc0',
                    dim: '#00e29e',
                    bright: '#47ffb8',
                    container: '#00e5a0',
                },
                'outline-variant': '#3b4a41',
                'on-surface': '#e0e3e8',
                'on-surface-variant': '#bacbbf',
                white: {
                    50: '#ffffff',
                    100: '#fefefe',
                    200: '#fdfdfd',
                    300: '#fcfcfc',
                    400: '#fafafa',
                    500: '#f8f8f8',
                    600: '#F4F4F4', // Backgrounds
                    700: '#e5e5e5',
                    800: '#6D6D6D', // Borders
                    900: '#525252',
                    DEFAULT: '#FFFFFF',
                    light: '#F4F4F4',
                    dark: '#6D6D6D',
                },

                // shadcn semantic tokens (additive; map to CSS vars in styles/shadcn.css).
                // Only NEW names here — existing primary/secondary/etc. are untouched.
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
                popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
                muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
                accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
                destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
            },
            fontFamily: {
                sans: ['Charlie', 'sans-serif'],
                Charlie: ['Charlie', 'sans-serif'],
                headline: ['Epilogue', 'sans-serif'],
                label: ['Space Grotesk', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            spacing: {
                4.5: '18px',
            },
            boxShadow: {
                '3xl': '0 2px 2px rgba(46, 39, 135, 0.05), 1px 6px 7px rgba(46, 39, 135, 0.1)', // Indigo-tinted
                urgent: '0 4px 14px -2px rgba(255, 107, 53, 0.25)', // Orange shadow
            },
            typography: ({ theme }) => ({
                DEFAULT: {
                    css: {
                        '--tw-prose-invert-headings': theme('colors.white'),
                        '--tw-prose-invert-links': theme('colors.secondary.DEFAULT'),
                        h1: { fontSize: '40px', color: theme('colors.primary.DEFAULT') },
                        h2: { fontSize: '32px', color: theme('colors.primary.DEFAULT') },
                        h3: { fontSize: '28px', color: theme('colors.primary.DEFAULT') },
                        a: {
                            color: theme('colors.secondary.DEFAULT'),
                            '&:hover': { color: theme('colors.secondary.DEFAULT') },
                        },
                    },
                },
            }),
            keyframes: {
                'float-slow': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'float-medium': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                'float-fast': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-6px)' },
                },
            },
            animation: {
                'float-slow': 'float-slow 6s ease-in-out infinite',
                'float-medium': 'float-medium 4s ease-in-out infinite',
                'float-fast': 'float-fast 3s ease-in-out infinite',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            },
        },
    },
    variants: {
        opacity: ({ after }) => after(['disabled']),
    },
    plugins: [
        require('@tailwindcss/forms')({
            strategy: 'class',
        }),
        require('@tailwindcss/typography'),
        require('tailwindcss-animate'),
    ],
};
