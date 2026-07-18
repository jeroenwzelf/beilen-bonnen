import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Space_Mono } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Beilen Bonnen',
  description: 'Deel boodschappen, verdeel kosten eerlijk. Voor de groepsvakantie.',
  generator: 'v0.app',
  icons: {
    apple: '/beilen-bonnen-512.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl" className="bg-background">
      <body className={`${spaceGrotesk.variable} ${spaceMono.variable} font-sans antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
