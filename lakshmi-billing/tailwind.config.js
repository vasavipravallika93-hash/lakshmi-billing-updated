/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eafcf1",
          100: "#cdf7dd",
          200: "#9deec0",
          300: "#5edc9a",
          400: "#28c278",
          500: "#0fa860",
          600: "#08874d",
          700: "#0a6b40",
          800: "#0d5535",
          900: "#0c462d",
        },
        ink: "#0f1a14",
      },
      fontFamily: {
        display: ["Poppins", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 10px -2px rgba(15,26,20,0.08), 0 1px 2px rgba(15,26,20,0.06)",
        pop: "0 12px 30px -8px rgba(15,168,96,0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
