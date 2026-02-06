/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        exact: {
          blue: '#0066CC',
          dark: '#004080',
          light: '#E6F0FF',
        },
        // Improved contrast for secondary text (was gray-500: #6b7280, now darker)
        'gray-secondary': '#4b5563', // gray-600 equivalent
      },
    },
  },
  plugins: [
    // Custom plugin for improved focus states
    function({ addBase }) {
      addBase({
        // Improved focus-visible styles for better keyboard navigation
        '*:focus-visible': {
          outline: '2px solid #0066CC',
          outlineOffset: '2px',
        },
        // Remove default focus outline (replaced by focus-visible)
        '*:focus': {
          outline: 'none',
        },
        // Skip link for accessibility
        '.skip-link': {
          position: 'absolute',
          top: '-40px',
          left: '0',
          background: '#0066CC',
          color: 'white',
          padding: '8px',
          zIndex: '100',
        },
        '.skip-link:focus': {
          top: '0',
        },
      });
    },
  ],
};
