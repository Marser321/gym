import type { Metadata } from "next";
import { Outfit } from "next/font/google"; // Fuente moderna y geométrica
import "./globals.css";
import { cn } from "@/lib/utils";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TAO GYM | Punta del Este",
  description: "Centro de entrenamiento premium en Punta del Este. Pilates, Crossfit y Musculación.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark h-full"> {/* Forzamos dark mode y español */}
      <body
        className={cn(
          outfit.variable,
          "min-h-screen bg-background font-sans antialiased selection:bg-neon-cyan/30 selection:text-neon-cyan"
        )}
      >
        <main className="relative flex min-h-screen flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
