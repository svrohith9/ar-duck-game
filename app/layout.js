import { Noto_Sans, Spline_Sans } from 'next/font/google';
import ThemeProvider from '../components/layout/ThemeProvider';
import './globals.css';

const splineSans = Spline_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-spline',
  display: 'swap',
});

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto',
  display: 'swap',
});

export const metadata = {
  title: 'Escape Ducks',
  description: 'Escape Ducks: real-time camera dodge game with pose tracking.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${splineSans.variable} ${notoSans.variable} font-display`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
