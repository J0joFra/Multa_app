/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0d1117',
        panel: '#161b22',
        line: '#262d36',
        ok: '#2ea043',
        warn: '#d29922',
        bad: '#e5484d',
      },
    },
  },
  plugins: [],
};
