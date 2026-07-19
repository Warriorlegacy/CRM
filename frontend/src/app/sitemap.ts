import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://whatsapp-crm-frontend-three.vercel.app';

  const routes = [
    '',
    '/guide',
    '/login',
    '/register',
    '/privacy',
    '/terms',
    '/dashboard',
    '/inbox',
    '/pipeline',
    '/contacts',
    '/automation',
    '/chatbot',
    '/setup',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/guide' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/guide' ? 0.9 : 0.7,
  }));
}
