import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './tailwind.css';



const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hackathon AI Judge',
  description: 'AI-powered hackathon project evaluation and scoring system',
  keywords: 'hackathon, AI, judging, evaluation, scoring, projects',
  authors: [{ name: 'Hackathon Judge AI' }],
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232563eb'><path d='M3 3v18h18v-2H5V3H3zm4 12h2v2H7v-2zm0-4h2v2H7v-2zm0-4h2v2H7V7zm4 8h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2V7zm4 8h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2V7z'/></svg>" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}