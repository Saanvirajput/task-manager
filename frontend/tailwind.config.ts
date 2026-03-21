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
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#f5f7ff",
          100: "#ebf0fe",
          500: "#7b68ee", // ClickUp purple
          600: "#6a5acd",
        },
        neutral: {
          50: "#fbfbfa", // Notion white
          100: "#f1f1ef",
          200: "#e3e2e0",
          800: "#37352f", // Notion text
        }
      },
      borderRadius: {
        'xl': '12px',
      }
    },
  },
  plugins: [],
};
export default config;
