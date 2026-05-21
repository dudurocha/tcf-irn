import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Reading-app palette — warm, calm, paper-like
        bg: "#faf8f3",
        surface: {
          DEFAULT: "#ffffff",
          2: "#f3f1ea",
          3: "#ebe8dd",
        },
        border: {
          DEFAULT: "#e0ddd0",
          strong: "#c4c0ad",
        },
        ink: {
          DEFAULT: "#1c1c19",
          muted: "#6e6c63",
          faint: "#9a988c",
        },
        accent: {
          DEFAULT: "#1e5fa8",
          light: "#e4eef9",
          strong: "#134378",
        },
        success: {
          DEFAULT: "#2d7a5f",
          bg: "#dff0e8",
        },
        danger: {
          DEFAULT: "#b94a3a",
          bg: "#f9e4df",
        },
        warn: {
          DEFAULT: "#b87914",
          bg: "#f9edd4",
        },
        gold: {
          DEFAULT: "#b8954a",
          bg: "#f5ecd6",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: [
          "Iowan Old Style",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "Times",
          "serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        lg: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
