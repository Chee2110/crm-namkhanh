/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        namkhanh: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0284C7', // Xanh Ocean Breeze chủ đạo (Tươi mát & Thanh khiết)
          600: '#0369A1',
          700: '#075985',
          800: '#0C4A6E',
          900: '#082F49',
        },
        brand: {
          red: '#EA332A',    // Cánh hoa đỉnh (Đỏ)
          blue: '#0284C7',   // Cánh hoa phải (Xanh dương Ocean chủ đạo)
          green: '#10B981',  // Cánh hoa đáy (Xanh lá ngọc)
          yellow: '#F59E0B', // Cánh hoa trái (Vàng nắng dịu)
        }
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      boxShadow: {
        'card': '0 10px 30px -5px rgba(15, 23, 42, 0.03), 0 4px 12px -2px rgba(15, 23, 42, 0.02)',
        'card-hover': '0 16px 36px -4px rgba(2, 132, 199, 0.07), 0 6px 16px -2px rgba(15, 23, 42, 0.03)',
        'soft': '0 2px 15px -3px rgba(15, 23, 42, 0.05), 0 10px 20px -2px rgba(15, 23, 42, 0.02)',
        'pill': '0 2px 8px 0 rgba(15, 23, 42, 0.04)',
        'glow': '0 4px 16px 0 rgba(2, 132, 199, 0.26)',
      },
      fontSize: {
        xs: ['0.825rem', { lineHeight: '1.1rem' }],       /* 12px -> 13.2px */
        sm: ['0.9625rem', { lineHeight: '1.375rem' }],    /* 14px -> 15.4px */
        base: ['1.1rem', { lineHeight: '1.65rem' }],      /* 16px -> 17.6px */
        lg: ['1.2375rem', { lineHeight: '1.925rem' }],    /* 18px -> 19.8px */
        xl: ['1.375rem', { lineHeight: '1.925rem' }],     /* 20px -> 22px */
        '2xl': ['1.65rem', { lineHeight: '2.2rem' }],     /* 24px -> 26.4px */
        '3xl': ['2.0625rem', { lineHeight: '2.475rem' }], /* 30px -> 33px */
        '4xl': ['2.475rem', { lineHeight: '2.75rem' }],   /* 36px -> 39.6px */
        '5xl': ['3.3rem', { lineHeight: '1' }],           /* 48px -> 52.8px */
        '6xl': ['4.125rem', { lineHeight: '1' }],         /* 60px -> 66px */
        '7xl': ['4.95rem', { lineHeight: '1' }],          /* 72px -> 79.2px */
        '8xl': ['6.6rem', { lineHeight: '1' }],           /* 96px -> 105.6px */
        '9xl': ['8.8rem', { lineHeight: '1' }],           /* 128px -> 140.8px */
      }
    },
  },
  plugins: [],
}
