import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WikiPull — The Encyclopedia TCG',
  description: 'Collect Wikipedia articles as trading cards. Every article is a card. Rarer pages mean rarer pulls.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
