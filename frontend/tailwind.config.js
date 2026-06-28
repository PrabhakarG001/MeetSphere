/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a', // slate-900
        surface: '#1e293b', // slate-800
        primary: '#6366f1', // indigo-500
        primaryHover: '#4f46e5', // indigo-600
        text: '#f8fafc', // slate-50
        textSecondary: '#94a3b8', // slate-400
        danger: '#ef4444', // red-500
        dangerHover: '#dc2828', // red-600
        border: '#334155', // slate-700
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
