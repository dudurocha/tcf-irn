import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TCF IRN · 30 jours",
  description:
    "Préparation au TCF IRN (Test de Connaissance du Français pour l'Intégration, la Résidence et la Nationalité) — niveau B2, 30 jours.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <div className="mx-auto max-w-3xl px-4 py-5 pb-12">{children}</div>
      </body>
    </html>
  );
}
