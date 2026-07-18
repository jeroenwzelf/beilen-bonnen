import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Beilen Bonnen',
    short_name: 'Beilen Bonnen',
    description: 'Deel boodschappen, verdeel kosten eerlijk. Voor de groepsvakantie.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    icons: [
      {
        src: '/beilen-bonnen-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}