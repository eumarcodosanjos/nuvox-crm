import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/** Identidade visual "Ascensão" — Nuvox CRM */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // Nada de cantos arredondados: qualquer classe rounded-* vira 0.
    borderRadius: {
      none: "0",
      sm: "0",
      DEFAULT: "0",
      md: "0",
      lg: "0",
      xl: "0",
      "2xl": "0",
      "3xl": "0",
      full: "0",
    },
    extend: {
      colors: {
        podio: "#0A0A0A",
        superficie: "#141414",
        borda: "#262626",
        tatame: "#F2F2F0",
        apoio: "#B5B5B0",
        limao: "#D4FF3D",
        roxo: "#534AB7",
        alerta: "#FF6B4A",
        // Degraus neutros do funil (Novo, Contato)
        degrau: { 1: "#333333", 2: "#555555" },

        // Tokens do shadcn/ui, mapeados para a marca
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
      },
      fontFamily: {
        display: ['"Archivo"', "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      letterSpacing: { rotulo: "0.1em" },
    },
  },
  plugins: [animate],
} satisfies Config;
