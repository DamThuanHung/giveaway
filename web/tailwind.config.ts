import type { Config } from "tailwindcss";

// Design System v2 — "Vietnamese Warm Minimal"
// Emerald palette mở rộng + cream warm + ink scale + token nhất quán cho radius/shadow/motion.

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#10B981",
          50:  "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
          dark: "#059669",
          light: "#D1FAE5",
        },
        cream: {
          DEFAULT: "#FFFBF5",
          50:  "#FFFEFB",
          100: "#FFFBF5",
          200: "#FDF6E9",
          300: "#F9EFDC",
        },
        // Ink scale — text + border + surface
        ink: {
          DEFAULT: "#1A1A2E",
          900: "#0F0F1B",
          800: "#1A1A2E",
          700: "#2D2D44",
          600: "#52526B",
          500: "#7A7A92",
          400: "#A8A8BD",
          300: "#CFCFDD",
          200: "#E5E5EE",
          100: "#F4F4F8",
          50:  "#FAFAFC",
        },
        navy: "#1A1A2E",
        gold: "#F4D36A",
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "xs":   ["0.75rem",  { lineHeight: "1rem" }],
        "sm":   ["0.875rem", { lineHeight: "1.25rem" }],
        "base": ["1rem",     { lineHeight: "1.5rem" }],
        "lg":   ["1.125rem", { lineHeight: "1.75rem" }],
        "xl":   ["1.25rem",  { lineHeight: "1.75rem" }],
        "2xl":  ["1.5rem",   { lineHeight: "2rem" }],
        "3xl":  ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl":  ["2.25rem",  { lineHeight: "2.5rem" }],
        "5xl":  ["3rem",     { lineHeight: "1.1" }],
        "6xl":  ["3.75rem",  { lineHeight: "1.05" }],
      },
      borderRadius: {
        none: "0",
        sm: "6px",
        DEFAULT: "10px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "28px",
        "3xl": "36px",
        full: "9999px",
      },
      boxShadow: {
        // Tint shadow với primary mờ thay đen tinh — cảm giác ấm hơn
        "soft":     "0 1px 2px rgba(16, 185, 129, 0.04), 0 1px 3px rgba(15, 15, 27, 0.05)",
        "card":     "0 4px 14px rgba(16, 185, 129, 0.07), 0 2px 4px rgba(15, 15, 27, 0.04)",
        "elevated": "0 12px 32px rgba(16, 185, 129, 0.10), 0 4px 12px rgba(15, 15, 27, 0.06)",
        "float":    "0 24px 48px rgba(16, 185, 129, 0.14), 0 8px 16px rgba(15, 15, 27, 0.08)",
      },
      transitionTimingFunction: {
        warm: "cubic-bezier(0.4, 0, 0.2, 1)",
        bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      transitionDuration: {
        "150": "150ms",
        "250": "250ms",
        "400": "400ms",
        "600": "600ms",
      },
      backgroundImage: {
        "gradient-warm": "linear-gradient(135deg, #ECFDF5 0%, #FFFBF5 100%)",
        "gradient-hero": "linear-gradient(160deg, #ECFDF5 0%, #FFFBF5 55%, #FDF6E9 100%)",
        "gradient-cta":  "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "fade-in":       "fade-in 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-right":"slide-in-right 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-up":   "slide-in-up 400ms cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
