import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { NotFoundPage } from '@/components/error-pages'
import { AppShell } from '@/components/app-shell'
import { StoreProvider } from '@/lib/store'
import { MusicProvider } from '@/components/music-player'

import '../styles.css'

const siteName = "Primpaii's Way"
const siteDescription =
  'A soft little space to manage orders, renewals, warranties, and profit.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: siteName,
      },
      {
        name: 'description',
        content: siteDescription,
      },
      {
        property: 'og:title',
        content: siteName,
      },
      {
        property: 'og:description',
        content: siteDescription,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Quicksand:wght@400;500;600;700&family=Poppins:wght@400;500;600&family=DM+Sans:wght@400;500;700&family=Lora:ital,wght@0,400;0,600;1,400;1,600&family=Dancing+Script:wght@600;700&family=Cormorant+Garamond:ital,wght@0,600;1,600&family=Playfair+Display:ital,wght@0,600;1,600&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        <TooltipProvider>
          <StoreProvider>
            <MusicProvider>
              <AppShell>{children}</AppShell>
            </MusicProvider>
          </StoreProvider>
        </TooltipProvider>
        <Toaster />
        <Scripts />
      </body>
    </html>
  )
}
