/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1a1a18",
          800: "#22221f",
          700: "#2e2e2a",
          600: "#3a3a35",
          500: "#5a5a52",
          400: "#a0a09a",
        },
        cream: {
          DEFAULT: "#f0ece4",
          200: "#e6e1d6",
        },
        amber: {
          accent: "#c9a84c",
          soft: "#d4b896",
          deep: "#a8862f",
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.06)",
        cardHover: "0 4px 20px rgba(0,0,0,0.08)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(24px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.55s ease-out both",
      },
    },
  },
  plugins: [],
}
