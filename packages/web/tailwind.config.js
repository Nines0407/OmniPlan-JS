/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          blue: '#00d4ff',
          'blue-glow': 'rgba(0, 212, 255, 0.15)',
        },
        neon: {
          green: '#39ff14',
        },
        danger: {
          red: '#ff4444',
        },
        amber: {
          DEFAULT: '#f59e0b',
        },
        surface: {
          DEFAULT: '#121212',
          card: 'rgba(30, 30, 30, 0.55)',
          elevated: 'rgba(40, 40, 40, 0.70)',
          divider: 'rgba(255, 255, 255, 0.06)',
        },
        text: {
          primary: 'rgba(255, 255, 255, 0.90)',
          secondary: 'rgba(255, 255, 255, 0.55)',
          muted: 'rgba(255, 255, 255, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backdropBlur: {
        glass: '12px',
      },
      animation: {
        'pulse-connect': 'pulseConnect 2s ease-in-out infinite',
        shake: 'shake 0.4s ease-in-out',
        'glow-border': 'glowBorder 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
      },
      keyframes: {
        pulseConnect: {
          '0%, 100%': {
            boxShadow: '0 0 4px rgba(0, 212, 255, 0.4)',
          },
          '50%': {
            boxShadow:
              '0 0 12px rgba(0, 212, 255, 0.8), 0 0 24px rgba(0, 212, 255, 0.3)',
          },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        glowBorder: {
          '0%': {
            borderColor: '#00d4ff',
            boxShadow: '0 0 8px rgba(0, 212, 255, 0.3)',
          },
          '100%': { borderColor: 'transparent', boxShadow: 'none' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'glow-blue': '0 0 8px rgba(0, 212, 255, 0.2)',
        'glow-green': '0 0 8px rgba(57, 255, 20, 0.2)',
        'glow-red': '0 0 8px rgba(255, 68, 68, 0.2)',
      },
    },
  },
  plugins: [],
};
