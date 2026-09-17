'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Newspaper, Users, Camera, Mic, Radio, Calendar, MapPin, ChevronRight, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import styles from './page.module.css'

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [broadcasts, setBroadcasts] = useState([])
  const [currentBc, setCurrentBc] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [stats, setStats] = useState({ edisi: '45', liputan: '320' })

  const fetchPublicBroadcasts = async () => {
    try {
      const res = await fetch('/api/public/broadcasts')
      const json = await res.json()
      setBroadcasts(json.data || [])
    } catch (e) {}
  }

  const fetchStats = async () => {
    try {
      const supabase = createClient()
      const { count } = await supabase.from('members').select('*', { count: 'exact', head: true })
        .eq('status', 'aktif')
        .neq('role', 'super_admin')
      setActiveCount(count || 0)
      
      const { data } = await supabase.from('settings').select('*').in('key', ['edisi_terbit', 'jumlah_liputan'])
      if (data) {
        const edisi = data.find(s => s.key === 'edisi_terbit')?.value || '45'
        const liputan = data.find(s => s.key === 'jumlah_liputan')?.value || '320'
        setStats({ edisi, liputan })
      }
    } catch (e) {}
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data?.session))
    fetchPublicBroadcasts()
    fetchStats()
  }, [])

  // Auto-rotate broadcasts
  useEffect(() => {
    if (broadcasts.length <= 1) return
    const timer = setInterval(() => {
      setCurrentBc(prev => (prev + 1) % broadcasts.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [broadcasts.length])

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  return (
    <main className={styles.main}>
      {/* BROADCAST TICKER */}
      {broadcasts.length > 0 && (
        <div className={styles.broadcastTicker}>
          <div className={styles.tickerIcon}><Radio size={18} /> INFO</div>
          <div className={styles.tickerContent}>
            <div className={styles.tickerSlide} key={currentBc}>
              <strong>{broadcasts[currentBc]?.title}</strong>
              {broadcasts[currentBc]?.broadcast_date && (
                <span className={styles.tickerDate}> — {formatDate(broadcasts[currentBc]?.broadcast_date)}</span>
              )}
            </div>
          </div>
          {broadcasts.length > 1 && (
            <div className={styles.tickerDots}>
              {broadcasts.map((_, i) => (
                <button key={i} className={`${styles.tickerDot} ${i === currentBc ? styles.tickerDotActive : ''}`} onClick={() => setCurrentBc(i)} />
              ))}
            </div>
          )}
        </div>
      )}

      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <Image src="/logo.png" alt="Jurnal Fourteen Logo" width={50} height={50} style={{ objectFit: 'contain' }} />
          <span style={{ marginLeft: '10px' }}>JURNFOURTEEN</span>
        </div>
        <div className={styles.navLinks}>
          <a href="#tentang" className={styles.navLink}>Tentang</a>
          <a href="#broadcast" className={styles.navLink}>Info</a>
          <Link href="/galeri" className={styles.navLink}>Galeri</Link>
          {isLoggedIn ? (
            <Link href="/dashboard"><Button variant="primary" size="sm">DASHBOARD</Button></Link>
          ) : (
            <Link href="/login"><Button variant="primary" size="sm">LOGIN</Button></Link>
          )}
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.decorCircle} style={{ width: '150px', height: '150px', top: '10%', left: '5%' }}></div>
        <div className={styles.decorCircle} style={{ width: '80px', height: '80px', bottom: '15%', right: '10%', backgroundColor: 'var(--secondary)' }}></div>
        <div className={styles.decorSquare}></div>
        <div className={styles.heroContent}>
          <div>
            <h1 className={styles.heroTitle}>JURNFOURTEEN</h1>
            <h2 className={styles.heroSubtitle}>JURNALISTIK SEKOLAH</h2>
          </div>
          <div className={styles.heroTagline}>Jurnalistik sekolah dalam satu sistem.</div>
          <div className={styles.heroCta}>
            {isLoggedIn ? (
              <Link href="/dashboard"><Button variant="secondary" size="lg" className="text-xl font-bold px-8">BUKA DASHBOARD</Button></Link>
            ) : (
              <>
                <Link href="/login"><Button variant="secondary" size="lg" className="text-xl font-bold px-8">LOGIN ANGGOTA</Button></Link>
                <Link href="/register"><Button variant="primary" size="lg" className="text-xl font-bold px-8" style={{ backgroundColor: 'white', color: 'black' }}>DAFTAR BARU</Button></Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* BROADCAST SECTION */}
      {broadcasts.length > 0 && (
        <section id="broadcast" className={styles.broadcastSection}>
          <h2 className={styles.sectionTitle}><Radio size={32} /> INFORMASI & KEGIATAN</h2>
          <div className={styles.broadcastGrid}>
            {broadcasts.map((bc, i) => (
              <div key={bc.id} className={styles.broadcastCard} style={{ animationDelay: `${i * 0.15}s` }}>
                <div className={styles.broadcastPriority}>
                  {bc.priority === 'urgent' ? '🔴 URGENT' : bc.priority === 'penting' ? '🟡 PENTING' : '🔵 INFO'}
                </div>
                <h3 className={styles.broadcastTitle}>{bc.title}</h3>
                <p className={styles.broadcastContent}>{bc.content}</p>
                <div className={styles.broadcastMeta}>
                  {bc.broadcast_date && <span><Calendar size={14} /> {formatDate(bc.broadcast_date)}</span>}
                  {bc.location && <span><MapPin size={14} /> {bc.location}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="tentang" className={styles.section} style={{ paddingBottom: 0 }}>
        <h2 className={styles.sectionTitle}>TENTANG JURNFOURTEEN</h2>
        <div className={styles.aboutContent}>
          <p>JurnFourteen adalah ekstrakurikuler jurnalistik yang berfokus pada pengembangan bakat siswa dalam bidang jurnalistik, fotografi, videografi, dan public speaking.</p>
          <div style={{ marginTop: '2rem' }}>
            <a href="#" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
                <ExternalLink size={18} style={{ marginRight: '8px' }} /> KUNJUNGI LINKTREE KAMI
              </Button>
            </a>
          </div>
        </div>

        <div className={styles.marqueeContainer}>
          <div className={styles.marqueeTrack}>
            {[
              'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&q=80',
              'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&q=80',
              'https://images.unsplash.com/photo-1511649475669-e288648b2339?w=500&q=80',
              'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=80',
              'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&q=80',
              'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&q=80',
              'https://images.unsplash.com/photo-1511649475669-e288648b2339?w=500&q=80',
              'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=80'
            ].map((img, i) => (
              <div key={i} className={styles.marqueeImageWrapper}>
                <img src={img} alt={`Gallery ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="stats" className={`${styles.section} ${styles.statsSection}`}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <Link href="/anggota" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
              <Users size={48} strokeWidth={3} />
              <div className={styles.statValue}>{activeCount}</div>
              <div className={styles.statLabel}>Anggota Aktif</div>
            </Link>
          </div>
          <div className={styles.statCard}>
            <Link href="#" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
              <Newspaper size={48} strokeWidth={3} />
              <div className={styles.statValue}>{stats.edisi}</div>
              <div className={styles.statLabel}>Edisi Terbit</div>
            </Link>
          </div>
          <div className={styles.statCard}>
            <Link href="#" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
              <Camera size={48} strokeWidth={3} />
              <div className={styles.statValue}>{stats.liputan}</div>
              <div className={styles.statLabel}>Liputan</div>
            </Link>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.ctaSection}`}>
        <h2 className={styles.ctaTitle}>Bergabung dengan JurnFourteen</h2>
        <Link href="/register"><Button variant="secondary" size="lg" style={{ fontSize: '1.5rem', padding: '1rem 2rem' }}>DAFTAR SEKARANG</Button></Link>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerLogo}>JURNFOURTEEN</div>
        <p style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Jurnalistik sekolah dalam satu sistem.</p>
        <p>&copy; {new Date().getFullYear()} JurnFourteen. All rights reserved.</p>
      </footer>
    </main>
  )
}
