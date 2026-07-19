import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://whatsapp-crm-frontend-three.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/guide', '/login', '/register', '/privacy', '/terms'],
      disallow: ['/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
