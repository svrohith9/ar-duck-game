import './globals.css';

export const metadata = {
  title: 'StrideLab | Live Motion Tracker',
  description: 'Sports-tech live pose and face tracking optimized for macOS.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
