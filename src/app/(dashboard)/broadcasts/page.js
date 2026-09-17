'use client'

import { useState, useEffect } from 'react'
import { Radio, Send, Clock, MapPin, Users, Calendar, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/lib/auth/AuthContext'
import styles from './broadcasts.module.css'

export default function BroadcastsPage() {
  const { member } = useAuth()
  const [broadcasts, setBroadcasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('semua')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    title: '', content: '', broadcast_date: '', broadcast_time: '',
    location: '', visibility: 'internal', target_type: 'semua',
    priority: 'normal', requires_confirmation: false, send_telegram: false
  })

  useEffect(() => { fetchBroadcasts() }, [])

  const fetchBroadcasts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/broadcasts')
      const json = await res.json()
      setBroadcasts(json.data || [])
    } catch (err) {
      addToast('Gagal memuat broadcast', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.content) {
      addToast('Judul dan isi wajib diisi', 'error')
      return
    }
    setSaving(true)
    try {
      const body = {
        title: formData.title,
        content: formData.content,
        broadcast_date: formData.broadcast_date || null,
        broadcast_time: formData.broadcast_time || null,
        location: formData.location || null,
        visibility: formData.visibility,
        target_type: formData.target_type,
        priority: formData.priority,
        requires_confirmation: formData.requires_confirmation,
        send_telegram: formData.send_telegram,
        created_by: member?.id,
      }

      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal mengirim')

      addToast('Broadcast berhasil dikirim!', 'success')
      setIsModalOpen(false)
      setFormData({ title: '', content: '', broadcast_date: '', broadcast_time: '', location: '', visibility: 'internal', target_type: 'semua', priority: 'normal', requires_confirmation: false, send_telegram: false })
      fetchBroadcasts()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus broadcast ini?')) return
    try {
      const res = await fetch(`/api/broadcasts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus broadcast')
      addToast('Broadcast berhasil dihapus', 'success')
      fetchBroadcasts()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const filteredBroadcasts = filter === 'semua' ? broadcasts : broadcasts.filter(b => b.visibility === filter)
  const filters = [
    { key: 'semua', label: 'Semua' },
    { key: 'internal', label: 'Internal' },
    { key: 'publik', label: 'Publik' },
  ]

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}><Radio size={28} strokeWidth={3} /> BROADCAST</h1>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> BUAT BROADCAST
        </Button>
      </div>

      <div className={styles.filters}>
        {filters.map(f => (
          <button key={f.key} className={`${styles.filterBtn} ${filter === f.key ? styles.filterBtnActive : ''}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {filteredBroadcasts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Belum ada broadcast.
        </div>
      ) : (
        <div className={styles.list}>
          {filteredBroadcasts.map(bc => (
            <div key={bc.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.broadcastTitle}>{bc.title}</h3>
                  <div className={styles.badges}>
                    <Badge variant={bc.visibility === 'publik' ? 'aktif' : 'menunggu'}>{bc.visibility?.toUpperCase()}</Badge>
                    {bc.priority !== 'normal' && <Badge variant="ditolak">{bc.priority?.toUpperCase()}</Badge>}
                  </div>
                </div>
                {['super_admin', 'admin', 'sekretaris', 'pembina'].includes(member?.role) && (
                  <button 
                    onClick={() => handleDelete(bc.id)}
                    style={{ background: '#fee2e2', color: '#dc2626', border: '2px solid #fca5a5', borderRadius: '6px', padding: '0.4rem', cursor: 'pointer' }}
                    title="Hapus Broadcast"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <div className={styles.content}>{bc.content}</div>
              <div className={styles.meta}>
                {bc.broadcast_date && <div className={styles.metaItem}><Calendar size={14} /> {formatDate(bc.broadcast_date)}</div>}
                {bc.broadcast_time && <div className={styles.metaItem}><Clock size={14} /> {bc.broadcast_time} WITA</div>}
                {bc.location && <div className={styles.metaItem}><MapPin size={14} /> {bc.location}</div>}
                <div className={styles.metaItem}><Users size={14} /> Target: {bc.target_type || 'semua'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="BUAT BROADCAST">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Judul" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
          <div className="form-group">
            <label className="form-label">Isi Broadcast</label>
            <textarea className="textarea" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required rows={4} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Tanggal" type="date" value={formData.broadcast_date} onChange={e => setFormData({...formData, broadcast_date: e.target.value})} />
            <Input label="Jam" type="time" value={formData.broadcast_time} onChange={e => setFormData({...formData, broadcast_time: e.target.value})} />
          </div>
          <Input label="Lokasi (Opsional)" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <Select label="Visibilitas" options={[{value: 'internal', label: 'Internal'}, {value: 'publik', label: 'Publik'}]} value={formData.visibility} onChange={e => setFormData({...formData, visibility: e.target.value})} />
            <Select label="Target" options={[{value: 'semua', label: 'Semua'}, {value: 'pengurus', label: 'Pengurus'}]} value={formData.target_type} onChange={e => setFormData({...formData, target_type: e.target.value})} />
            <Select label="Prioritas" options={[{value: 'normal', label: 'Normal'}, {value: 'penting', label: 'Penting'}, {value: 'urgent', label: 'Urgent'}]} value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: '2px solid #000', borderRadius: '6px' }}>
            <input type="checkbox" id="req_conf" checked={formData.requires_confirmation} onChange={e => setFormData({...formData, requires_confirmation: e.target.checked})} style={{width: 20, height: 20}} />
            <label htmlFor="req_conf" style={{ fontWeight: 700 }}>Wajib Konfirmasi Kehadiran</label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" loading={saving}><Send size={16} /> Kirim</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
