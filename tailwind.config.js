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
        galaxy: {
          950: '#07080e',
          900: '#0d0f1a',
          850: '#121424',
          800: '#181b30',
          700: '#222644',
          600: '#323861',
          accent: 'var(--theme-accent)',
          'accent-hover': 'var(--theme-accent-hover)',
          secondary: 'var(--theme-secondary)',
          cyan: '#06b6d4',
          'cyan-hover': '#0891b2',
          pink: '#ec4899',
          gold: '#f59e0b',
          emerald: '#10b981',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(255, 255, 255, 0.18)',
        }
      },
      fontFamily: {
        sans: ['"Inter"', '"Space Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', '"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px var(--theme-accent-glow)',
        'glow-md': '0 0 25px var(--theme-accent-glow)',
        'glow-lg': '0 0 40px var(--theme-accent-glow)',
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.45)',
        'glow-gold': '0 0 25px rgba(245, 158, 11, 0.45)',
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.45)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
        'shimmer': 'shimmer 2.5s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}
