'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, AuthProvider } from '@/lib/auth/AuthContext';
import { LoadingSpinner } from '@/components/ui';
import { useRealtimeNotifications } from '@/hooks/useRealtime';
import styles from './layout.module.css';
import { 
  LayoutDashboard, Users, Calendar, Radio, ClipboardCheck, 
  FileText, Megaphone, Bell, ScrollText, Settings, LogOut, Menu, X,
  User, ChevronDown, Home, Image as ImageIcon, UserCheck
} from 'lucide-react';

const MENU_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'pembina', 'sekretaris', 'anggota'] },
  { path: '/members', label: 'Data Anggota', icon: Users, roles: ['super_admin', 'admin', 'pembina', 'sekretaris'] },
  { path: '/activities', label: 'Kegiatan', icon: Calendar, roles: ['super_admin', 'admin', 'sekretaris', 'anggota'] },
  { path: '/broadcasts', label: 'Broadcast', icon: Radio, roles: ['super_admin', 'admin', 'sekretaris', 'anggota'] },
  { path: '/gallery', label: 'Galeri', icon: ImageIcon, roles: ['super_admin', 'admin', 'pembina', 'sekretaris', 'anggota'] },
  { path: '/attendance/verification', label: 'Verifikasi Absen', icon: ClipboardCheck, roles: ['super_admin', 'admin', 'sekretaris'] },
  { path: '/members/verification', label: 'Verifikasi Anggota', icon: UserCheck, roles: ['super_admin'] },
  { path: '/reports', label: 'Rekap', icon: FileText, roles: ['super_admin', 'admin', 'pembina', 'sekretaris'] },
  { path: '/announcements', label: 'Pengumuman', icon: Megaphone, roles: ['super_admin', 'admin', 'pembina', 'sekretaris', 'anggota'] },
  { path: '/notifications', label: 'Notifikasi', icon: Bell, roles: ['super_admin', 'admin', 'pembina', 'sekretaris', 'anggota'] },
  { path: '/logs', label: 'Activity Log', icon: ScrollText, roles: ['super_admin', 'admin', 'pembina'] },
  { path: '/settings', label: 'Pengaturan', icon: Settings, roles: ['super_admin'] },
];

function Sidebar({ isOpen, onClose, role }) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const filteredMenu = MENU_ITEMS.filter(item => item.roles.includes(role));

  return (
    <>
      <div className={`${styles.sidebarMobile} ${isOpen ? styles.open : ''}`} onClick={onClose} />
      <aside className={`sidebar ${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.sidebarLogo}>
          <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Image src="/logo.png" alt="Logo" width={40} height={40} style={{ objectFit: 'contain' }} />
            <span>JURNFOURTEEN</span>
          </Link>
        </div>
        <nav className={styles.navList}>
          {filteredMenu.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
            return (
              <Link href={item.path} key={item.path} onClick={onClose} className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
                <Icon size={20} strokeWidth={2.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className={styles.logoutWrapper}>
          <div style={{ padding: '0 0.5rem', marginBottom: '0.5rem' }}>
            <Link href="/" onClick={onClose} style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
              background: '#e0f2fe', color: '#0369a1', borderRadius: '8px', 
              fontWeight: 700, textDecoration: 'none', border: '2px solid #0284c7',
              boxShadow: '2px 2px 0 #0284c7', transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '3px 3px 0 #0284c7' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0 #0284c7' }}
            >
              <Home size={20} strokeWidth={2.5} />
              <span>Halaman Utama</span>
            </Link>
          </div>
          <Link href="/profile" onClick={onClose} className={styles.navItem}>
            <User size={20} strokeWidth={2.5} />
            <span>Profil Saya</span>
          </Link>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={20} strokeWidth={2.5} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({ toggleSidebar, userProfile }) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const currentMenu = MENU_ITEMS.find(m => pathname.startsWith(m.path)) || 
    (pathname === '/profile' ? { label: 'Profil Saya' } : { label: 'JurnFourteen' });

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className={`topbar ${styles.topbar}`}>
      <div className={styles.topbarLeft}>
        <button className={styles.hamburger} onClick={toggleSidebar}>
          <Menu size={24} strokeWidth={2.5} />
        </button>
        <button 
          onClick={() => window.history.back()} 
          className={styles.backButton}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', 
            background: 'var(--surface)', border: '2px solid #000', borderRadius: '6px', 
            fontWeight: 'bold', cursor: 'pointer', marginRight: '1rem',
            boxShadow: '2px 2px 0 #000', transition: 'all 0.15s', fontSize: '0.85rem'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '3px 3px 0 #000' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0 #000' }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(1px, 1px)'; e.currentTarget.style.boxShadow = '1px 1px 0 #000' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '3px 3px 0 #000' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Kembali
        </button>
        <h1 className={styles.pageTitle}>{currentMenu.label}</h1>
      </div>
      <div className={styles.topbarRight}>
        <Link href="/notifications" className={styles.notificationWrapper}>
          <Bell size={22} strokeWidth={2.5} />
        </Link>
        <div className={styles.userDropdown} ref={dropdownRef}>
          <button className={styles.userSection} onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className={styles.avatarPlaceholder}>
              {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className={styles.userName}>{userProfile?.full_name || 'User'}</span>
            <ChevronDown size={16} />
          </button>
          {dropdownOpen && (
            <div className={styles.dropdown}>
              <Link href="/profile" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                <User size={16} /> Profil Saya
              </Link>
              <Link href="/settings" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                <Settings size={16} /> Pengaturan
              </Link>
              <button className={styles.dropdownItem} onClick={async () => { await signOut() }} style={{ color: 'var(--danger)' }}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function DashboardLayoutContent({ children }) {
  const { user, member, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <LoadingSpinner fullPage size="lg" />;
  }

  const role = member?.role || 'anggota';

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} role={role} />
      <div className="main-wrapper">
        <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} userProfile={member} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthProvider>
  );
}
