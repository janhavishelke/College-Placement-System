/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        edu: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          sidebar: '#FFFFFF',
          primary: '#2563EB',      // Professional Royal Blue
          'primary-dark': '#1D4ED8',
          'primary-light': '#3B82F6',
          'primary-subtle': '#EFF6FF',
          navy: '#0F172A',
          charcoal: '#334155',
          muted: '#64748B',
          'muted-light': '#94A3B8',
          border: '#E2E8F0',
          'border-light': '#F1F5F9',
          accent: '#0284C7',
          success: '#10B981',
          'success-subtle': '#ECFDF5',
          warning: '#F59E0B',
          'warning-subtle': '#FFFBEB',
          danger: '#EF4444',
          'danger-subtle': '#FEF2F2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'edu-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'edu-card': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'edu-dropdown': '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
      }
    },
  },
  plugins: [],
}
