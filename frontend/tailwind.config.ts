import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Notion exact palette
        notion: {
          bg: "#FFFFFF",
          surface: "#F7F6F3",
          hover: "#EBEBEA",
          border: "#E8E8E8",
          text: "#050505",
          secondary: "#6B6B6B",
          tertiary: "#AEACAA",
        },
        brand: {
          DEFAULT: "#006ADC",
          hover: "#0057B3",
          light: "#E8F0FD",
          50: "#EBF5FF",
          100: "#D1E8FF",
          500: "#006ADC",
          600: "#0057B3",
        },
        // Keep neutral shades compatible
        neutral: {
          50:  "#fbfbfa",
          100: "#F7F6F3",
          200: "#E8E8E8",
          300: "#D3D3D0",
          400: "#AEACAA",
          500: "#6B6B6B",
          600: "#4A4A4A",
          700: "#2D2D2D",
          800: "#050505",
        },
      },
      borderRadius: {
        'sm':  '4px',
        DEFAULT: '6px',
        'md':  '6px',
        'lg':  '8px',
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'notion-sm': '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'notion':    '0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
        'notion-lg': '0 4px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        'notion-xl': '0 8px 40px rgba(0,0,0,0.16)',
      },
      fontSize: {
        'notion-xs':   ['11px', '16px'],
        'notion-sm':   ['12px', '18px'],
        'notion-base': ['14px', '20px'],
        'notion-md':   ['16px', '24px'],
        'notion-lg':   ['20px', '28px'],
        'notion-xl':   ['28px', '36px'],
        'notion-2xl':  ['40px', '48px'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease',
        'slide-down': 'slideDown 0.2s ease',
        'spin-slow': 'spin 1.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
