/** @type {import('tailwindcss').Config} */
export default {
  // ⚠️ IMPORTANTE: Scope para evitar conflictos con WordPress
  important: '#gua-widget-container',
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        primary: {
          100: "#F9FAFA",
          200: "#DFE4EA",
          300: "#DDDDDD",
          400: "#9DABAF",
          500: "#9CA3AF",
          600: "#242424",
          700: "#111928",
          900: "#000000",
        },
        accent: {
          100: "#FDF9E6",
          300: "#EAC607",
        },
        error: "#F23030",
        success: "#22AD5C",
        hover: "#033B4A",
        disabled: "#EFEFEF",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
