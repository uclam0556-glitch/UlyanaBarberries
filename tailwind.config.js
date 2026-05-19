/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#B5334F',
          light: '#F9E8ED',
          dark: '#8A1F38',
        },
        accent: {
          DEFAULT: '#7B4D2E',
          light: '#A06840',
        },
        gold: {
          DEFAULT: '#C9A96E',
          light: '#E8D4A8',
          dark: '#A07840',
        },
        cream: {
          DEFAULT: '#FDF8F4',
          dark: '#F5EDE4',
        },
        choco: {
          DEFAULT: '#1A0A0F',
          soft: '#2D1420',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'h1-desktop': ['56px', { lineHeight: '1.1', fontWeight: '700' }],
        'h1-mobile': ['32px', { lineHeight: '1.15', fontWeight: '700' }],
        'h2-desktop': ['40px', { lineHeight: '1.2', fontWeight: '600' }],
        'h2-mobile': ['26px', { lineHeight: '1.25', fontWeight: '600' }],
        'h3-desktop': ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3-mobile': ['20px', { lineHeight: '1.35', fontWeight: '600' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-overlay': 'linear-gradient(to top, rgba(26,10,15,0.85) 0%, rgba(26,10,15,0.3) 50%, transparent 100%)',
      },
      boxShadow: {
        'card': '0 4px 24px -4px rgba(26,10,15,0.12)',
        'card-hover': '0 12px 40px -4px rgba(26,10,15,0.22)',
        'product': '0 2px 16px rgba(181,51,79,0.12)',
        'gold': '0 4px 24px rgba(201,169,110,0.25)',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      animation: {
        'shimmer': 'shimmer 1.8s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
    },
  },
  plugins: [],
}
