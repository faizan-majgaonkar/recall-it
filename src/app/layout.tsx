import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { getAuthenticatedUser } from "@/server/modules/auth/auth.service";

export const metadata: Metadata = {
  title: "Recall It",
  description: "Document-based knowledge diagnosis for learners.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthenticatedUser();

  return (
    <html lang="en">
      <body>
        <Navbar user={user} />
        {children}
      </body>
    </html>
  );
}
