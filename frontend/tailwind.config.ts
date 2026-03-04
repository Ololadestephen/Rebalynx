import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#07111D",
        panel: "#0E1D2D",
        accent: "#22D3EE",
        success: "#10B981",
        danger: "#EF4444"
      }
    }
  },
  plugins: []
};

export default config;
