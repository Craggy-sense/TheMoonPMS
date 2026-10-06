import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Moon Apartments | PMS & Channel Sync',
  description: 'Luxury Property Management System for The Moon Apartments. Real-time calendar tape-chart, Airbnb & Booking.com iCal synchronization, turnovers and reservation management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
