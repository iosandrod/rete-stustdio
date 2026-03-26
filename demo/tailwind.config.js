/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../rete-react-plugin/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'node-bg': '#2a2a2a',
        'node-selected': '#3a3a00',
        'socket-bg': '#777',
        'socket-multiple': '#ffff00',
        'context-bg': '#333',
        'context-bg-light': '#444',
        'context-bg-dark': '#222',
        'connection-stroke': 'steelblue',
      },
      width: {
        'node': '200px',
      },
      borderColor: {
        'node-border': '#4e58bf',
        'node-selected-border': '#e3c000',
        'minimap-border': '#b1b7ff',
      },
      fontFamily: {
        'node': ['Arial', 'sans-serif'],
        'node-title': ['sans-serif'],
      },
    },
  },
  plugins: [],
}
