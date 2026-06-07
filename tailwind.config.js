/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1", // Indigo 500
        secondary: "#4f46e5", // Indigo 600
        accent: "#f43f5e", // Rose 500
        background: "#f8fafc", // Slate 50
        surface: "#ffffff",
        chatMe: "#6366f1",
        chatOther: "#f1f5f9",
        border: "#e2e8f0" // Slate 200
      }
    },
  },
  plugins: [],
}
