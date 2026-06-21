import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "WhatsApp CRM | Convert Chats Into Revenue",
  description: "A sales and support workspace that turns WhatsApp conversations into organized pipeline, ownership, follow-ups, and repeatable revenue.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-zinc-950 text-zinc-100">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
