/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'google-dark': '#131314',
        'google-surface': '#1e1f20',
        'google-surface-hover': '#2d2e2f',
        'google-primary': '#a8c7fa',
        'google-primary-hover': '#8ab4f8',
        'google-blue': '#1a73e8',
        'google-text': '#e3e3e3',
        'google-text-secondary': '#c4c7c5',
        'google-border': '#444746',
      },
      fontFamily: {
        'sans': ['Roboto', 'Google Sans', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
  darkMode: 'media'
}