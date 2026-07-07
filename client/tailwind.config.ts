import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Lighter "poker table" mafia theme: felt-green table, leather-brown
        // panels/buttons, gold chip accents — replaces the earlier near-black
        // noir palette while keeping the same semantic token names, so every
        // component that already uses bg-mafia-*/text-mafia-* re-skins for free.
        mafia: {
          bg: "#3f6d54",
          panel: "#6b4226",
          panel2: "#59341c",
          accent: "#a8283f",
          accent2: "#d4af37",
          text: "#f3e9d6",
          muted: "#c9b896",
        },
      },
      fontFamily: {
        display: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
