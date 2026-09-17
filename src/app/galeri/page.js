'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Calendar } from 'lucide-react'
import styles from './galeri.module.css'
import { LoadingSpinner } from '@/components/ui'

export default function PublicGaleriPage() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    try {
      const res = await fetch('/api/public/gallery')
      const json = await res.json()
      setPhotos(json.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.backButton}>
            <ChevronLeft size={20} strokeWidth={3} /> KEMBALI
          </Link>
          <h1 className={styles.pageTitle}>GALERI KENANGAN</h1>
        </div>
      </header>

      <main className={styles.main}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <LoadingSpinner />
            <p style={{ marginTop: '1rem', fontWeight: 600 }}>Memuat galeri...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className={styles.emptyState}>
            Belum ada foto kenangan.
          </div>
        ) : (
          <div className={styles.masonry}>
            {photos.map(p => (
              <div key={p.id} className={styles.masonryItem} onClick={() => setSelectedPhoto(p)}>
                <div className={styles.imageWrapper}>
                  <Image src={p.image_url} alt={p.caption || 'Galeri'} width={400} height={300} style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
                {(p.caption || p.date) && (
                  <div className={styles.captionArea}>
                    {p.caption && <p className={styles.caption}>{p.caption}</p>}
                    {p.date && <span className={styles.date}><Calendar size={12} /> {formatDate(p.date)}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {selectedPhoto && (
        <div className={styles.lightbox} onClick={() => setSelectedPhoto(null)}>
          <button className={styles.closeBtn}>&times;</button>
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
            <Image 
              src={selectedPhoto.image_url} 
              alt={selectedPhoto.caption || 'Foto'} 
              width={1200} 
              height={800} 
              style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }} 
            />
            {(selectedPhoto.caption || selectedPhoto.date) && (
              <div className={styles.lightboxCaption}>
                {selectedPhoto.caption && <p>{selectedPhoto.caption}</p>}
                {selectedPhoto.date && <span>{formatDate(selectedPhoto.date)}</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
