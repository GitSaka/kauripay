import type { Metadata, Viewport } from "next";
import "./globals.css";

// 🛡️ Configuration stricte des métadonnées de l'application pour le mode PWA
export const metadata: Metadata = {
  title: "Kauripay - Escrow Sécurisé Bénin",
  description: "Sécurisez vos achats et ventes sur Facebook et WhatsApp via Mobile Money.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kauripay",
  },
};

// 📱 Blocage du zoom automatique sur mobile lors du clic sur les champs de saisie (inputs)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <meta name="theme-color" content="#0A2E1A" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased font-sans min-h-full flex flex-col">
        {/* Le conteneur global qui force l'affichage au format téléphone sur les grands écrans */}
        <div className="w-full max-w-md mx-auto bg-white min-h-screen flex flex-col shadow-sm">
          {children}
        </div>
      </body>
    </html>
  );
}