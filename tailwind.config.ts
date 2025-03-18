import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        apple: {
          blue: "#007AFF",
          indigo: "#5E5CE6",
          purple: "#BF5AF2",
          pink: "#FF2D55",
          red: "#FF3B30",
          orange: "#FF9500",
          yellow: "#FFCC00",
          green: "#34C759",
          teal: "#5AC8FA",
          gray: "#8E8E93",
        },
        neon: {
          purple: "#8B5CF6",
          pink: "#D946EF",
          blue: "#0EA5E9",
          green: "#10B981",
          red: "#EF4444",
          orange: "#F97316",
          yellow: "#FACC15",
        },
        purple: {
          light: "#E5DEFF",
          soft: "#D6BCFA",
          DEFAULT: "#9b87f5",
          medium: "#7E69AB",
          dark: "#5D4A8A",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "scale-out": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.95)", opacity: "0" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(10px)", opacity: "0" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(139, 92, 246, 0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(139, 92, 246, 0.8)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "scale-out": "scale-out 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        glow: "glow 2s ease-in-out infinite",
      },
      boxShadow: {
        "apple-sm": "0 2px 6px rgba(0,0,0,0.05)",
        "apple-md": "0 4px 12px rgba(0,0,0,0.08)",
        "apple-lg": "0 8px 24px rgba(0,0,0,0.12)",
        "apple-xl": "0 12px 48px rgba(0,0,0,0.15)",
        "apple-inset": "inset 0 1px 2px rgba(0,0,0,0.06)",
        "neon-sm": "0 0 5px rgba(139, 92, 246, 0.5)",
        "neon-md": "0 0 15px rgba(139, 92, 246, 0.7)",
        "neon-lg": "0 0 25px rgba(139, 92, 246, 0.9)",
        "gray-lg": "0 0 25px rgba(229 231 235, 0.9)",
      },
      backdropBlur: {
        apple: "20px",
      },
      backgroundImage: {
        "gradient-purple":
          "linear-gradient(135deg, rgb(255, 255, 255) 0%, rgb(229, 222, 255) 100%)",
        "gradient-purple-dark":
          "linear-gradient(135deg, rgb(25, 23, 36) 0%, rgb(65, 48, 97) 100%)",
        "gradient-sidebar":
          "linear-gradient(180deg, rgb(var(--gradient-start)) 0%, rgb(var(--gradient-mid)) 100%)",
        "gradient-header":
          "linear-gradient(90deg, rgb(var(--gradient-start)) 0%, rgb(var(--gradient-mid)) 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
