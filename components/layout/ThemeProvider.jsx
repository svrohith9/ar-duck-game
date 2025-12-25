'use client';

import { useEffect } from 'react';

export default function ThemeProvider({ children }) {
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const theme = stored || 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  return children;
}
