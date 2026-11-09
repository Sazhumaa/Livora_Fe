/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'void-black': '#0B090B',
        'dark-plum': '#20151D',
        'deep-magenta': '#70264F',
        'electric-magenta': '#D14D91',
        'soft-white': '#F8F0F5',
        'muted-gray': '#A58D9C',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Anton', 'Impact', 'sans-serif'],
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'magenta-glow': '0 0 25px rgba(209, 77, 145, 0.45)',
        'magenta-glow-lg': '0 0 50px rgba(209, 77, 145, 0.35)',
        'stage-card': '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
      },
      transitionTimingFunction: {
        cinematic: 'cubic-bezier(0.86, 0, 0.07, 1)',
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
      },
    },
  },
  plugins: [],
};
