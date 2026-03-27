export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fake-red': '#ef4444',
        'real-green': '#22c55e',
        'bg-dark': '#0f172a',
        'card-dark': '#1e293b'
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
        'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
