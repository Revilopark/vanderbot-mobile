import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vanderbot 2.0",
  description: "AI-native practicum OS for learning-by-building",
  manifest: "/vanderbot-mobile/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0e1a",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ backgroundColor: '#0a0e1a' }}>
      <body style={{ backgroundColor: '#0a0e1a', color: '#f1f5f9', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
