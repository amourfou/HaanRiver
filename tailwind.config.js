/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'virus-green': '#00ff88',
        'virus-red': '#ff0044',
        'virus-blue': '#0088ff',
        'han-river': '#4a90e2',
        'space-dark': '#0a0a0a',
      },
      animation: {
        'fall': 'fall 3s linear infinite',
        'pulse-virus': 'pulse-virus 2s ease-in-out infinite',
      },
      keyframes: {
        fall: {
          '0%': { transform: 'translateY(-100px)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'pulse-virus': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
