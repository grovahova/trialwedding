import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        emerald: {
          50: "#eefaf4",
          100: "#d5f2e3",
          200: "#ace5c9",
          300: "#79d2ab",
          400: "#48b78c",
          500: "#279c72",
          600: "#187d5c",
          700: "#15644c",
          800: "#144f3f",
          900: "#0f3a2f",
          950: "#08221c",
        },
        gold: {
          50: "#fbf7ec",
          100: "#f5ebc9",
          200: "#ecd694",
          300: "#e2bd5e",
          400: "#dba93a",
          500: "#c8912a",
          600: "#ac7420",
          700: "#8a591e",
          800: "#71481f",
          900: "#5f3c1e",
          950: "#361f0f",
        },
        ivory: "#fbf9f3",
        charcoal: "#1c1c1e",
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 6px)",
      },
      boxShadow: {
        soft: "0 2px 20px -4px rgba(20, 79, 63, 0.08)",
        "soft-lg": "0 12px 40px -8px rgba(20, 79, 63, 0.16)",
        gold: "0 0 0 1px rgba(219, 169, 58, 0.35)",
      },
      backgroundImage: {
        "mehendi-gradient": "linear-gradient(135deg, #3d6b4a 0%, #163d24 100%)",
        "haldi-gradient": "linear-gradient(135deg, #f4b73f 0%, #d6841b 100%)",
        "nikah-gradient": "linear-gradient(135deg, #15644c 0%, #dba93a 100%)",
        "reception-gradient": "linear-gradient(135deg, #e2c99a 0%, #a9895a 100%)",
        "emerald-gold": "linear-gradient(135deg, #187d5c 0%, #dba93a 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
