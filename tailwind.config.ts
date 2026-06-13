import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0A0A0A",
          white: "#FAFAFA",
          red: "#8B0000",
          gold: "#D4AF37",
          dark: "#1A1A1A",
          gray: "#2A2A2A"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
export default config;
