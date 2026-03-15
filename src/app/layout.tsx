import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recall It",
  description: "Document-based knowledge diagnosis for learners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
