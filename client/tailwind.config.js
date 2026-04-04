/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        primary: 'var(--color-primary)',
        primaryHover: 'var(--color-primaryHover)',
        textMain: 'var(--color-textMain)',
        textMuted: 'var(--color-textMuted)'
      }
    },
  },
  plugins: [],
}
