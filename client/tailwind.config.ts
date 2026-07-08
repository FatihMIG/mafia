import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 8-bit theme built on NES.css's own palette, so our accents match its
        // button/badge colors exactly. `text`/`muted` are for content living
        // inside a light nes-container (dark-on-light); `onDark`/`onDarkMuted`
        // are for text sitting directly on the page background (light-on-dark).
        mafia: {
          bg: "#212529",
          panel: "#f7f7f7",
          panel2: "#e8e8e8",
          accent: "#e76e55",
          accent2: "#f7d51d",
          primary: "#209cee",
          success: "#92cc41",
          text: "#212529",
          muted: "#5c6570",
          onDark: "#f7f7f7",
          onDarkMuted: "#9ca3af",
        },
      },
      fontFamily: {
        display: ["'Press Start 2P'", "system-ui", "sans-serif"],
        pixel: ["'VT323'", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
