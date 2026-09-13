/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        namkhanh: {
          50: '#FFEBEE',
          100: '#FFCDD2',
          500: '#E53935',
          600: '#D32F2F',
          700: '#C62828',
        }
      }
    },
  },
  plugins: [],
}
