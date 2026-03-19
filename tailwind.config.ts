import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   '#1c1917',
          secondary: '#292524',
          tertiary:  '#44403c',
        },
        text: {
          primary:   '#fafaf9',
          secondary: '#d6d3d1',
          muted:     '#78716c',
        },
        accent: {
          DEFAULT: '#f59e0b',
          subtle:  '#451a03',
        },
      },
      fontFamily: {
        sans:    ['var(--font-dm-sans)'],
        serif:   ['var(--font-lora)'],
        display: ['var(--font-bricolage)'],
        mono:    ['var(--font-jetbrains)'],
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        shimmer:      'shimmer 1.5s infinite linear',
        slideInRight: 'slideInRight 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        fadeIn:       'fadeIn 0.2s ease-in-out',
      },
    },
  },
  plugins: [],
};

export default config;
