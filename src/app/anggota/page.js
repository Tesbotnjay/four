'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button, Modal } from '@/components/ui'
import { ChevronLeft, ExternalLink, Phone } from 'lucide-react'
import styles from './anggota.module.css'

export default function AnggotaPage() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [])

  const [stats, setStats] = useState({})

  const fetchMembers = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('members')
        .select('id, full_name, username, display_username, kelas, avatar_url, jabatan, bio, links, phone, show_public')
        .eq('status', 'aktif')
        .neq('role', 'super_admin')
        .order('full_name', { ascending: true })
      setMembers(data || [])
      
      const statsRes = await fetch('/api/public/members-stats')
      if (statsRes.ok) {
        const statsJson = await statsRes.json()
        setStats(statsJson.data || {})
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openProfile = (m) => {
    setSelectedMember(m)
    setModalOpen(true)
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.backButton}>
            <ChevronLeft size={20} strokeWidth={3} /> KEMBALI
          </Link>
          <h1 className={styles.pageTitle}>ANGGOTA KAMI</h1>
        </div>
      </header>

      <main className={styles.main}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className={styles.spinner}></div>
            <p>Memuat daftar anggota...</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {members.map(m => (
              <div key={m.id} className={styles.card} onClick={() => openProfile(m)}>
                <div className={styles.avatarWrapper}>
                  {m.avatar_url ? (
                    <Image src={m.avatar_url} alt={m.full_name} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {m.full_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.name}>{m.full_name}</h3>
                  <p className={styles.kelas}>{m.kelas || '-'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Profil Anggota" maxWidth="500px">
        {selectedMember && (
          <div className={styles.profileDetail}>
            <div className={styles.detailAvatarWrapper}>
              {selectedMember.avatar_url ? (
                <Image src={selectedMember.avatar_url} alt={selectedMember.full_name} fill style={{ objectFit: 'cover' }} />
              ) : (
                <div className={styles.detailAvatarPlaceholder}>
                  {selectedMember.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h2 className={styles.detailName}>{selectedMember.full_name}</h2>
            {(selectedMember.display_username || selectedMember.username) && (
              <p style={{ margin: '-0.25rem 0 1rem 0', color: 'var(--text-muted)', fontWeight: 600 }}>
                @{selectedMember.display_username || selectedMember.username}
              </p>
            )}
            <div className={styles.detailBadges}>
              <span className={styles.badgeJabatan}>{selectedMember.jabatan || 'Anggota'}</span>
              <span className={styles.badgeKelas}>{selectedMember.kelas || '-'}</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.5rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#166534' }}>{stats[selectedMember.id]?.hadir || 0}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d' }}>HADIR</div>
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.5rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#92400e' }}>{stats[selectedMember.id]?.izin || 0}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>IZIN</div>
              </div>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.5rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1e40af' }}>{stats[selectedMember.id]?.sakit || 0}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8' }}>SAKIT</div>
              </div>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.5rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#991b1b' }}>{stats[selectedMember.id]?.alfa || 0}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c' }}>ALFA</div>
              </div>
            </div>

            {selectedMember.bio && (
              <div className={styles.detailBio}>
                <strong>Bio:</strong>
                <p>{selectedMember.bio}</p>
              </div>
            )}

            <div className={styles.linksContainer}>
              {selectedMember.phone && selectedMember.show_public !== false && (
                <a href={`https://wa.me/${selectedMember.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className={`${styles.linkBtn} ${styles.linkWhatsapp}`}>
                  <Phone size={16} /> Hubungi WhatsApp
                </a>
              )}
              {selectedMember.links && Array.isArray(selectedMember.links) && selectedMember.links.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noreferrer" className={styles.linkBtn}>
                  <ExternalLink size={16} /> {link.label || link.url}
                </a>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
