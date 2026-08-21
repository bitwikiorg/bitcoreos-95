import type { Metadata } from 'next';
import './globals.css';
import 'reactflow/dist/style.css';

export const metadata: Metadata = {
  title: 'BITCOREOS-95',
  description: 'A navigation and access layer for BIThub and BITwiki.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
