/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#0f1f17",
          dark: "#0a1510",
          light: "#1a2e22",
          alt: "#16281e",
          border: "#2f5a40",
        },
        accent: {
          gold: "#e8c873",
        },
      },
    },
  },
  plugins: [],
};
