'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { Card, Button, Input, LoadingSpinner } from '@/components/ui'
import { Image as ImageIcon, Trash2, Camera, Upload, Calendar } from 'lucide-react'
import styles from './gallery.module.css'

export default function AdminGalleryPage() {
  const { member } = useAuth()
  const { addToast } = useToast()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [date, setDate] = useState('')
  const fileInputRef = useRef(null)
  const supabase = createClient()

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

  // Kompresi sama kayak avatar
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new window.Image()
        img.src = event.target.result
        img.onload = () => {
          const canvas = document.createElement('canvas')
          // Max width/height 1200px untuk galeri
          const MAX_SIZE = 1200
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width
              width = MAX_SIZE
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height
              height = MAX_SIZE
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.85)
        }
        img.onerror = (e) => reject(e)
      }
      reader.onerror = (e) => reject(e)
    })
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      addToast('Pilih foto terlebih dahulu', 'error')
      return
    }

    setUploading(true)
    try {
      const compressedBlob = await compressImage(file)
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`
      const filePath = `photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, compressedBlob, { contentType: 'image/webp' })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath)

      const image_url = publicUrlData.publicUrl

      // Save to DB
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url,
          caption,
          date: date || new Date().toISOString().split('T')[0],
          created_by: member.id
        })
      })

      if (!res.ok) throw new Error('Gagal menyimpan ke database')

      addToast('Foto kenangan berhasil diunggah!', 'success')
      setCaption('')
      setDate('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchPhotos()
    } catch (error) {
      console.error(error)
      addToast('Gagal mengunggah foto', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus foto kenangan ini?')) return
    
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      addToast('Foto berhasil dihapus', 'success')
      fetchPhotos()
    } catch (error) {
      addToast(error.message, 'error')
    }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}><ImageIcon size={28} strokeWidth={3} /> KELOLA GALERI KENANGAN</h1>
      
      <Card className={styles.uploadCard}>
        <h2 className={styles.cardTitle}><Upload size={20} /> Tambah Kenangan Baru</h2>
        <div className={styles.uploadForm}>
          <div className="form-group">
            <label className="form-label">Pilih Foto</label>
            <input type="file" ref={fileInputRef} className="input" accept="image/*" />
          </div>
          <Input label="Caption / Cerita" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Tulis cerita kenangan ini..." />
          <Input label="Tanggal (Opsional)" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Button variant="primary" onClick={handleUpload} loading={uploading} style={{ alignSelf: 'flex-start' }}>
            <Camera size={16} /> Unggah Kenangan
          </Button>
        </div>
      </Card>

      <div className={styles.galleryGrid}>
        {loading ? <LoadingSpinner fullPage /> : photos.map(p => (
          <div key={p.id} className={styles.photoCard}>
            <div className={styles.imageWrapper}>
              <Image src={p.image_url} alt={p.caption || 'Foto'} fill style={{ objectFit: 'cover' }} />
            </div>
            <div className={styles.photoInfo}>
              {p.caption && <p className={styles.caption}>{p.caption}</p>}
              {p.date && <span className={styles.date}><Calendar size={12} /> {formatDate(p.date)}</span>}
              <button className={styles.deleteBtn} onClick={() => handleDelete(p.id)}>
                <Trash2 size={16} /> Hapus
              </button>
            </div>
          </div>
        ))}
        {!loading && photos.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '8px', border: '2px dashed #ccc' }}>
            Belum ada foto yang diunggah.
          </div>
        )}
      </div>
    </div>
  )
}
