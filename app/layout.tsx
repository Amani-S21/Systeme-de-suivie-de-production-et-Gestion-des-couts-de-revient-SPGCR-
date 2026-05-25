import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SPGCR — Gestion de Production Vin Ushindi",
  description: "Système Intégré Spécialisé développé en partenariat avec l'ULPGL Goma et la Maison Aux Sources de Dieu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900 flex flex-col antialiased font-sans">
        {/* En-tête de navigation global et sticky */}
        <Header />

        {/* Contenu principal de l'application */}
        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>

        {/* Pied de page institutionnel */}
        <Footer />
      </body>
    </html>
  );
}