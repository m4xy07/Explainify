import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: "#040308",
        foreground: "#f5f5f5",
        muted: "#7a7a86",
        primary: {
          DEFAULT: "#7b5cff",
          foreground: "#050505",
        },
        accent: {
          DEFAULT: "#0a0f1f",
          foreground: "#d9e3ff",
        },
        border: "rgba(255,255,255,0.08)",
        card: "rgba(8,12,24,0.85)",
      },
      borderRadius: {
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "1.75rem",
      },
      boxShadow: {
        glow: "0 0 25px rgba(123,92,255,0.35)",
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 20% 20%, rgba(123,92,255,0.25), transparent 45%), radial-gradient(circle at 80% 0%, rgba(0,161,255,0.35), transparent 55%)",
      },
      keyframes: {
        "pulse-glow": {
          "0%,100%": { opacity: "0.65", transform: "scale(0.98)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        eq: {
          "0%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
          "100%": { transform: "scaleY(0.3)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "slide-up": "slide-up 400ms ease-out both",
        eq: "eq 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
