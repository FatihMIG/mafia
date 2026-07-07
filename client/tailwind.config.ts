import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mafia: {
          bg: "#0b0d12",
          panel: "#151822",
          panel2: "#1d2130",
          accent: "#b3243d",
          accent2: "#e6a13d",
          text: "#e7e6e2",
          muted: "#8b8fa3",
        },
      },
      fontFamily: {
        display: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
