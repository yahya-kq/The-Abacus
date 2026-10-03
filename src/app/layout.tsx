import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Abacus — The Restaurant Tip Calculator',
  description: 'Precision restaurant tip pooling and calculation engine. Configurable role weights, multi-channel tip pooling, and transparent reporting.',
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
