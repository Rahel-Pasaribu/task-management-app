/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAF7F0",
        ink: {
          DEFAULT: "#1B2432",
          50: "#F3F4F6",
          100: "#E4E7EB",
          300: "#9AA5B4",
          500: "#4B5768",
          700: "#2A3444",
          900: "#1B2432",
        },
        amber: {
          50: "#FDF6E3",
          200: "#F3DFA0",
          400: "#E8B94A",
          500: "#D9A32B",
          600: "#B9821B",
        },
        teal: {
          50: "#E8F5F2",
          200: "#A8D8CC",
          500: "#2A9D8F",
          600: "#217F74",
        },
        clay: {
          50: "#FBEBE6",
          200: "#F0BEAE",
          500: "#E0674A",
          600: "#C24F35",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(27,36,50,0.06), 0 4px 12px rgba(27,36,50,0.06)",
        cardHover: "0 2px 4px rgba(27,36,50,0.08), 0 10px 24px rgba(27,36,50,0.10)",
        panel: "0 20px 60px rgba(27,36,50,0.18)",
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(27,36,50,0.06) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
