export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#F8FAFC', // Base body background (Light app bg)
          900: '#FFFFFF', // Card background (Pure white)
          800: '#F1F5F9', // Inputs, hover states, subtle backgrounds
          700: '#E2E8F0', // Card borders and dividers 
          600: '#CBD5E1', // Inactive elements
          500: '#64748B', // Muted text / icons
          400: '#475569', // Secondary text
          300: '#334155', // Main body text 
          200: '#1E293B', // Bold text, subheadings
          100: '#0F172A', // Primary headers, deep dark
          50: '#020617', // Pitch black
        },
        white: '#0F172A', // Remap utility white text to dark slate for light mode adaptation
        indigo: {
          // SaaS Blue matching the Figma design
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        purple: {
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
        },
        green: {
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
        },
        orange: {
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'saas': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'saas-md': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
