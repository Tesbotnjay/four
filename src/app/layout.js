import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({ 
  subsets: ['latin'], 
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
  preload: false,
});

export const metadata = {
  title: 'JurnFourteen - Admin',
  description: 'Sistem Administrasi Ekstrakurikuler Jurnalistik',
  keywords: ['jurnalistik', 'sekolah', 'absensi', 'administrasi'],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1B365D',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
