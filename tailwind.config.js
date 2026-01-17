export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F7F3F0',
          100: '#EFE7E0',
          200: '#DFC0A4',
          300: '#D0A97E',
          400: '#BC9166',
          500: '#AE7F53',
          600: '#8B6642',
          700: '#694D31',
          800: '#463421',
          900: '#231A10',
        }
      },
      animation: {
        'slideInLeft': 'slideInLeft 0.3s ease-out forwards',
        'fadeIn': 'fadeIn 0.2s ease-out forwards',
        'scaleIn': 'scaleIn 0.2s ease-out forwards',
        'shimmer': 'shimmer 2s infinite linear',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
        'gradient-sidebar': 'linear-gradient(180deg, #AE7F53, #BC9166)',
        'gradient-chat': 'linear-gradient(135deg, #DFC0A4, #D0A97E)',
      }
    }
  },
  plugins: [],
}