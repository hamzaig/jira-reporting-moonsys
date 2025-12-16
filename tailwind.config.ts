import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        moonsys: {
          aqua: '#AED9E3',
          'aqua-dark': '#7DBCC9',
          lavender: '#BDBBDF',
          'lavender-dark': '#9B98C5',
          peach: '#F2CAA1',
          'peach-dark': '#E5B380',
          yellow: '#F9E389',
          'yellow-dark': '#F5D65F',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
