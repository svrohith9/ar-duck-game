/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f9e406',
        'primary-hover': '#dcd005',
        'background-light': '#f8f8f5',
        'background-dark': '#23210f',
        'surface-dark': '#2e2b14',
        'overlay-dark': 'rgba(35, 33, 15, 0.85)',
      },
      fontFamily: {
        display: ['var(--font-spline)', 'var(--font-noto)', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
