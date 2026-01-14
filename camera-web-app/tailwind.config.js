/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'gtaa-blue': '#003366',
        'gtaa-light-blue': '#0066cc',
        'gtaa-gray': '#f5f5f5'
      }
    },
  },
  plugins: [],
}