'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { Card, Button, Badge, LoadingSpinner, Modal, Input } from '@/components/ui'
import { Megaphone, Plus, Clock } from 'lucide-react'
import styles from './announcements.module.css'

export default function AnnouncementsPage() {
  const { member } = useAuth()
  const { addToast } = useToast()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal' })
  const [saving, setSaving] = useState(false)

  const isAdmin = ['super_admin', 'admin'].includes(member?.role)

  useEffect(() => { fetchAnnouncements() }, [])

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements')
      const json = await res.json()
      setAnnouncements(json.data || [])
    } catch (err) {
      addToast('Gagal memuat pengumuman', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.title || !form.content) {
      addToast('Judul dan isi wajib diisi', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, created_by: member?.id })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal membuat')
      addToast('Pengumuman berhasil dibuat', 'success')
      setShowCreate(false)
      setForm({ title: '', content: '', priority: 'normal' })
      fetchAnnouncements()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      timeZone: 'Asia/Makassar', day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className={styles.announcePage}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>
          <Megaphone size={28} strokeWidth={3} />
          PENGUMUMAN
        </h1>
        {isAdmin && (
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <Plus size={18} /> BUAT PENGUMUMAN
          </Button>
        )}
      </div>

      {announcements.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Belum ada pengumuman.
          </div>
        </Card>
      ) : (
        <div className={styles.announceList}>
          {announcements.map((a) => (
            <Card key={a.id} className={styles.announceCard}>
              <div className={styles.announceHeader}>
                <h3 className={styles.announceTitle}>{a.title}</h3>
                {a.priority !== 'normal' && (
                  <Badge variant={a.priority === 'urgent' ? 'ditolak' : 'menunggu'}>
                    {a.priority.toUpperCase()}
                  </Badge>
                )}
              </div>
              <div className={styles.announceContent}>{a.content}</div>
              <div className={styles.announceMeta}>
                <span><Clock size={14} /> {formatDate(a.created_at)}</span>
                {a.creator?.full_name && <span>Oleh: {a.creator.full_name}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Buat Pengumuman"
        footer={<><Button variant="outline" onClick={() => setShowCreate(false)}>Batal</Button><Button variant="primary" onClick={handleCreate} loading={saving}>Buat</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Judul" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div className="form-group">
            <label className="form-label">Isi Pengumuman</label>
            <textarea className="textarea" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5} required />
          </div>
          <div className="form-group">
            <label className="form-label">Prioritas</label>
            <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="normal">Normal</option>
              <option value="penting">Penting</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
