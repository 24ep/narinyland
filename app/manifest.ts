import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // Fetch default config
  let config;
  try {
     config = await prisma.appConfig.findUnique({ where: { id: 'default' } });
  } catch (e) {
     console.error("Manifest DB Error", e);
  }

  const name = (config as any)?.pwaName || 'Narinyland';
  const shortName = (config as any)?.pwaShortName || 'Narinyland';
  const description = (config as any)?.pwaDescription || 'Our Love Story';
  const themeColor = (config as any)?.pwaThemeColor || '#ec4899';
  const bgColor = (config as any)?.pwaBackgroundColor || '#ffffff';
  
  const icons: any[] = [
    {
      src: '/favicon.ico',
      sizes: 'any',
      type: 'image/x-icon',
    }
  ];

  if ((config as any)?.pwaIconUrl) {
    icons.push({
        src: (config as any).pwaIconUrl,
        sizes: '192x192',
        type: 'image/png',
    });
    icons.push({
        src: (config as any).pwaIconUrl,
        sizes: '512x512',
        type: 'image/png',
    });
  } else {
     // Fallback if no icon set
     icons.push({
        src: 'https://cdn-icons-png.flaticon.com/512/3209/3209995.png', // Default heart icon
        sizes: '512x512',
        type: 'image/png',
     });
  }

  return {
    name,
    short_name: shortName,
    description,
    start_url: '/',
    display: 'standalone',
    background_color: bgColor,
    theme_color: themeColor,
    icons,
    orientation: 'portrait'
  }
}
