import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Abacus — Restaurant Tip Calculator | Mission Hill',
  description: 'Production-ready restaurant tip calculation intelligence engine. Equal, pooling, percentage, and points tip distribution.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
