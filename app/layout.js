import { IBM_Plex_Mono, Bebas_Neue } from 'next/font/google'
import './globals.css'

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-mono',
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
})

export const metadata = {
  title: 'Neptune — Global Intelligence Engine',
  description: 'AI-powered ontology and decision intelligence platform',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${ibmPlexMono.variable} ${bebasNeue.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
