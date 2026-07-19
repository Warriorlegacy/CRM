import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

export const metadata: Metadata = {
  metadataBase: new URL('https://whatsapp-crm-frontend-three.vercel.app'),
  title: {
    default: 'WhatsApp CRM & Automation | Multi-Agent Inbox & AI Sales Pipeline',
    template: '%s | WhatsApp CRM',
  },
  description: 'A sales and support workspace that turns WhatsApp & Instagram conversations into organized pipeline, team ownership, AI follow-ups, and repeatable revenue.',
  keywords: [
    'WhatsApp CRM',
    'WhatsApp Business Automation',
    'Instagram Inbox CRM',
    'WhatsApp AI Auto Responder',
    'Multi Agent WhatsApp Inbox',
    'WhatsApp Lead Management',
    'WhatsApp Sales Pipeline',
  ],
  authors: [{ name: 'WhatsApp CRM Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://whatsapp-crm-frontend-three.vercel.app',
    siteName: 'WhatsApp CRM',
    title: 'WhatsApp CRM & Automation | Multi-Agent Inbox & AI Sales Pipeline',
    description: 'Turn WhatsApp conversations into organized revenue, auto-replies, and multi-agent ownership.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhatsApp CRM & Automation',
    description: 'Turn WhatsApp conversations into organized revenue, auto-replies, and multi-agent ownership.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'WhatsApp CRM',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://whatsapp-crm-frontend-three.vercel.app',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Multi-agent WhatsApp & Instagram sales CRM with AI auto-responders, lead scoring, and automated pipelines.',
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-zinc-950 text-zinc-100">
        <NotificationProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
