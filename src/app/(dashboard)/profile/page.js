'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useAuth } from '@/lib/auth/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { Card, Button, Input, Badge, LoadingSpinner } from '@/components/ui'
import { User, Mail, Phone, BookOpen, Shield, Calendar, Save, Camera, Plus, Trash2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import styles from './profile.module.css'

export default function ProfilePage() {
  const { member, user, loading: authLoading } = useAuth()
  const { addToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({})
  
  const fileInputRef = useRef(null)
  const supabase = createClient()

  const startEdit = () => {
    setForm({
      full_name: member?.full_name || '',
      phone: member?.phone || '',
      bio: member?.bio || '',
      display_username: member?.display_username || '',
      links: member?.links || [],
      avatar_url: member?.avatar_url || ''
    })
    setEditing(true)
  }

  // Kompresi gambar pakai Canvas HTML5
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new window.Image()
        img.src = event.target.result
        img.onload = () => {
          const canvas = document.createElement('canvas')
          // Max width/height 800px biar gak burik tapi size kecil
          const MAX_SIZE = 800
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
          
          // Export as webp quality 0.85
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Canvas empty'))
            resolve(blob)
          }, 'image/webp', 0.85)
        }
        img.onerror = (e) => reject(e)
      }
      reader.onerror = (e) => reject(e)
    })
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      addToast('File harus berupa gambar', 'error')
      return
    }

    setUploading(true)
    try {
      const compressedBlob = await compressImage(file)
      const fileExt = 'webp'
      const fileName = `${member.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedBlob, {
          contentType: 'image/webp',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const avatar_url = publicUrlData.publicUrl
      setForm(prev => ({ ...prev, avatar_url }))
      addToast('Foto berhasil diunggah! Jangan lupa klik Simpan.', 'success')
    } catch (error) {
      console.error(error)
      addToast('Gagal mengunggah foto', 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleAddLink = () => {
    if (form.links.length >= 5) {
      addToast('Maksimal 5 link diperbolehkan', 'error')
      return
    }
    setForm(prev => ({ ...prev, links: [...prev.links, { label: '', url: '' }] }))
  }

  const handleUpdateLink = (index, field, value) => {
    const newLinks = [...form.links]
    newLinks[index][field] = value
    setForm(prev => ({ ...prev, links: newLinks }))
  }

  const handleRemoveLink = (index) => {
    const newLinks = [...form.links]
    newLinks.splice(index, 1)
    setForm(prev => ({ ...prev, links: newLinks }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Validasi URL
      const validLinks = form.links.map(l => {
        let url = l.url.trim()
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url
        }
        return { label: l.label.trim() || 'Link', url }
      }).filter(l => l.url)

      const payload = { ...form, links: validLinks }

      const res = await fetch(`/api/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Gagal menyimpan')
      }
      addToast('Profil berhasil diperbarui', 'success')
      setEditing(false)
      window.location.reload()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    const newPass = prompt('Masukkan password baru (minimal 6 karakter):')
    if (!newPass || newPass.length < 6) {
      addToast('Password harus minimal 6 karakter', 'error')
      return
    }
    try {
      const res = await fetch(`/api/members/${member.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPass })
      })
      if (!res.ok) throw new Error('Gagal mengubah password')
      addToast('Password berhasil diubah!', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  if (authLoading) return <LoadingSpinner fullPage />
  if (!member) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat profil...</div>

  const roleLabels = { super_admin: 'Super Admin', admin: 'Admin', sekretaris: 'Sekretaris', pembina: 'Pembina', anggota: 'Anggota' }

  return (
    <div className={styles.profilePage}>
      <h1 className={styles.pageTitle}><User size={28} strokeWidth={3} /> PROFIL SAYA</h1>

      <Card className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            {(editing ? form.avatar_url : member.avatar_url) ? (
              <Image 
                src={editing ? form.avatar_url : member.avatar_url} 
                alt="Avatar" 
                fill 
                style={{ objectFit: 'cover' }} 
              />
            ) : (
              <div className={styles.avatar}>
                {member.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            {editing && (
              <button 
                className={styles.avatarUploadBtn} 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <LoadingSpinner /> : <Camera size={20} />}
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/png, image/jpeg, image/webp" 
              onChange={handleAvatarChange} 
            />
          </div>
          <div className={styles.nameSection}>
            <h2 className={styles.fullName}>{member.full_name}</h2>
            <p className={styles.username}>@{member.display_username || member.username}</p>
            <div className={styles.badges}>
              <Badge variant="aktif">{roleLabels[member.role] || member.role}</Badge>
              <Badge variant={member.status === 'aktif' ? 'hadir' : 'menunggu'}>{member.status?.toUpperCase()}</Badge>
            </div>
          </div>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Shield size={16} /> <span className={styles.infoLabel}>Jabatan:</span>
            <span className={styles.infoValue}>{member.jabatan || '-'}</span>
          </div>
          <div className={styles.infoItem}>
            <BookOpen size={16} /> <span className={styles.infoLabel}>Kelas:</span>
            <span className={styles.infoValue}>{member.kelas || '-'}</span>
          </div>
          <div className={styles.infoItem}>
            <Mail size={16} /> <span className={styles.infoLabel}>NIS/NISN:</span>
            <span className={styles.infoValue}>{member.nis_nisn || '-'}</span>
          </div>
          <div className={styles.infoItem}>
            <Phone size={16} /> <span className={styles.infoLabel}>Telepon:</span>
            <span className={styles.infoValue}>{member.phone || '-'}</span>
          </div>
          <div className={styles.infoItem}>
            <Calendar size={16} /> <span className={styles.infoLabel}>Bergabung:</span>
            <span className={styles.infoValue}>
              {member.joined_at ? new Date(member.joined_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
            </span>
          </div>
        </div>

        {!editing && member.bio && (
          <div className={styles.bioSection}>
            <strong>Bio:</strong>
            <p>{member.bio}</p>
          </div>
        )}

        {!editing && member.links && member.links.length > 0 && (
          <div className={styles.bioSection}>
            <strong>Tautan Profil:</strong>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {member.links.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noreferrer" className={styles.linkBadge}>
                  <ExternalLink size={14} /> {link.label || 'Link'}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {!editing ? (
            <>
              <Button variant="primary" onClick={startEdit}>Edit Profil</Button>
              <Button variant="outline" onClick={handleChangePassword}>Ubah Password</Button>
            </>
          ) : (
            <div className={styles.editForm}>
              <Input label="Nama Lengkap" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
              <Input label="Username Pajangan (Opsional)" value={form.display_username} onChange={e => setForm({...form, display_username: e.target.value})} placeholder="Username tanpa spasi (misal: budi_keren)" />
              <Input label="No. Telepon (Opsional)" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Contoh: 08123456789" />
              <div className="form-group">
                <label className="form-label">Bio (Opsional)</label>
                <textarea className="textarea" value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3} placeholder="Ceritakan tentang dirimu..." />
              </div>
              
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  Tautan Profil (Max 5)
                  {form.links.length < 5 && (
                    <button type="button" onClick={handleAddLink} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Plus size={16} /> Tambah Link
                    </button>
                  )}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {form.links.map((link, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input className="input" style={{ flex: 1 }} placeholder="Nama (Misal: Instagram)" value={link.label} onChange={e => handleUpdateLink(i, 'label', e.target.value)} />
                      <input className="input" style={{ flex: 2 }} placeholder="URL (Misal: https://instagram.com/...)" value={link.url} onChange={e => handleUpdateLink(i, 'url', e.target.value)} />
                      <button type="button" onClick={() => handleRemoveLink(i)} style={{ background: '#f8d7da', color: '#721c24', border: '2px solid #f5c6cb', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {form.links.length === 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Belum ada tautan ditambahkan.</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <Button variant="primary" onClick={handleSave} loading={saving}><Save size={16} /> Simpan Profil</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Batal</Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
