import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#051c2c",
        ocean: "#0a4d68",
        teal: "#0b8a9a",
        foam: "#e6f3f6",
        mist: "#b8dce4",
        coral: "#ff6b4a",
        sun: "#f4c95f",
        ink: "#04202c",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(11, 138, 154, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(11, 138, 154, 0)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        rise: "rise 0.5s ease-out both",
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
        ticker: "ticker 28s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
