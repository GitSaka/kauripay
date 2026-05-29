import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    // 1. Scan complet si tes dossiers sont directement à la racine
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    
    // 2. Scan de sécurité si ton Next.js utilise un sous-dossier src/
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kauri: {
          dark: "#0A2E1A",    // Fond vert forêt profond
          light: "#123D25",   // Teinte haute du dégradé premium
          accent: "#34D399",  // Vert menthe (Succès, validation, actif)
          gray: "#D1D5DB",    // Blanc cassé pour les labels secondaires
          danger: "#EF4444",  // Rouge doux (Litiges et alertes)
        }
      },
    },
  },
  plugins: [],
};

export default config;
