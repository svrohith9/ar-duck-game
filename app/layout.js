import './globals.css';

export const metadata = {
  title: 'AR Duck Game',
  description: 'AR Duck Game: real-time camera dodge game with pose tracking.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
