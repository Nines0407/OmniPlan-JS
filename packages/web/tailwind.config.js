/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          blue: '#00d4ff',
        },
        neon: {
          green: '#39ff14',
        },
        danger: {
          red: '#ff4444',
        },
        surface: {
          DEFAULT: '#121212',
          card: '#1e1e1e',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
