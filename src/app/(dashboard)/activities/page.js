'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Clock, Plus, Edit, Trash2, Play, CheckCircle, Hand, FileWarning, Thermometer, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/lib/auth/AuthContext'
import styles from './activities.module.css'

export default function ActivitiesPage() {
  const { member } = useAuth()
  const [activities, setActivities] = useState([])
  const [myAttendance, setMyAttendance] = useState({}) // { activityId: { response, final_status } }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('semua')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [actionType, setActionType] = useState('')
  const [respondingId, setRespondingId] = useState(null)
  const { addToast } = useToast()

  const isAdmin = ['super_admin', 'admin', 'sekretaris'].includes(member?.role)

  const [formData, setFormData] = useState({
    name: '', description: '', activity_date: '', start_time: '', end_time: '',
    location: '', requires_attendance: true
  })

  useEffect(() => { fetchActivities() }, [])

  // Fetch attendance status for anggota
  useEffect(() => {
    if (!isAdmin && member?.id && activities.length > 0) {
      fetchMyAttendance()
    }
  }, [activities, member?.id, isAdmin])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/activities')
      const json = await res.json()
      setActivities(json.data || [])
    } catch (err) {
      addToast('Gagal memuat kegiatan', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchMyAttendance = async () => {
    // For each activity, check if member already responded
    const map = {}
    for (const act of activities) {
      try {
        const res = await fetch(`/api/attendance?activity_id=${act.id}`)
        if (!res.ok) continue
        const json = await res.json()
        const mine = json.data?.find(d => d.member_id === member.id && d.id)
        if (mine) {
          map[act.id] = { response: mine.type, status: mine.status, note: mine.verification_notes }
        }
      } catch (e) {}
    }
    setMyAttendance(map)
  }

  const handleOpenModal = (activity = null) => {
    if (activity) {
      setSelectedActivity(activity)
      setFormData({
        name: activity.name || '', description: activity.description || '',
        activity_date: activity.activity_date || '', start_time: activity.start_time || '',
        end_time: activity.end_time || '', location: activity.location || '',
        requires_attendance: activity.requires_attendance ?? true
      })
    } else {
      setSelectedActivity(null)
      setFormData({ name: '', description: '', activity_date: '', start_time: '', end_time: '', location: '', requires_attendance: true })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.activity_date) { addToast('Nama dan tanggal wajib diisi', 'error'); return }
    setSaving(true)
    try {
      const url = selectedActivity ? `/api/activities/${selectedActivity.id}` : '/api/activities'
      const method = selectedActivity ? 'PUT' : 'POST'
      const body = { ...formData }
      if (!selectedActivity) body.created_by = member?.id
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan')
      addToast(selectedActivity ? 'Kegiatan diperbarui' : 'Kegiatan dibuat', 'success')
      setIsModalOpen(false)
      fetchActivities()
    } catch (err) { addToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const handleStatusChange = (activity, newStatus) => {
    setSelectedActivity(activity); setActionType(newStatus); setIsConfirmOpen(true)
  }

  const confirmStatusChange = async () => {
    try {
      const res = await fetch(`/api/activities/${selectedActivity.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: actionType })
      })
      if (!res.ok) throw new Error('Gagal mengubah status')
      addToast(`Status diubah ke ${actionType}`, 'success')
      fetchActivities()
    } catch (err) { addToast(err.message, 'error') }
    setIsConfirmOpen(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus kegiatan ini?')) return
    try {
      const res = await fetch(`/api/activities/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      addToast('Kegiatan dihapus', 'success')
      fetchActivities()
    } catch (err) { addToast(err.message, 'error') }
  }

  const [respondModal, setRespondModal] = useState({ open: false, activityId: null, type: '' })
  const [respondReason, setRespondReason] = useState('')

  const handleRespondClick = (activityId, type) => {
    if (!member?.id) { addToast('Data member belum dimuat. Refresh halaman.', 'error'); return }
    setRespondModal({ open: true, activityId, type })
  }

  const submitResponse = async () => {
    const { activityId, type } = respondModal
    if ((type === 'izin' || type === 'sakit') && !respondReason.trim()) {
      addToast('Alasan wajib diisi!', 'error')
      return
    }

    setRespondingId(activityId)
    setRespondModal({ open: false, activityId: null, type: '' })
    try {
      const res = await fetch('/api/attendance/respond', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: activityId, member_id: member.id, response: type })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal merespons')
      
      if ((type === 'izin' || type === 'sakit') && respondReason) {
        await fetch('/api/leave', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: member.id, activity_id: activityId, type, reason: respondReason })
        }).catch(() => {})
      }
      
      addToast(`Berhasil! Status: ${type.toUpperCase()}`, 'success')
      setMyAttendance(prev => ({ ...prev, [activityId]: { response: type, status: 'menunggu' } }))
      setRespondReason('')
    } catch (err) { addToast(err.message, 'error') }
    finally { setRespondingId(null) }
  }

  const filteredActivities = filter === 'semua' ? activities : activities.filter(a => a.status === filter)
  const filters = [
    { key: 'semua', label: 'Semua' }, { key: 'aktif', label: 'Aktif' },
    { key: 'akan_datang', label: 'Akan Datang' }, { key: 'selesai', label: 'Selesai' },
  ]
  const getStatusBadge = (status) => {
    const map = { akan_datang: 'menunggu', aktif: 'aktif', selesai: 'hadir', dibatalkan: 'ditolak' }
    const labels = { akan_datang: 'AKAN DATANG', aktif: 'AKTIF', selesai: 'SELESAI', dibatalkan: 'DIBATALKAN' }
    return <Badge variant={map[status] || 'menunggu'}>{labels[status] || status}</Badge>
  }
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}><Calendar size={28} strokeWidth={3} /> KEGIATAN</h1>
        {isAdmin && <Button variant="primary" onClick={() => handleOpenModal()}><Plus size={18} /> BUAT KEGIATAN</Button>}
      </div>
      <div className={styles.filters}>
        {filters.map(f => (
          <button key={f.key} className={`${styles.filterBtn} ${filter === f.key ? styles.filterBtnActive : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {filteredActivities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tidak ada kegiatan.</div>
      ) : (
        <div className={styles.grid}>
          {filteredActivities.map(activity => {
            const myAtt = myAttendance[activity.id]
            return (
              <div key={activity.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.activityName}>{activity.name}</h3>
                  {getStatusBadge(activity.status)}
                </div>
                {activity.description && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>{activity.description}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', margin: '0.75rem 0' }}>
                  <div className={styles.infoRow}><Calendar size={15} /> {formatDate(activity.activity_date)}</div>
                  <div className={styles.infoRow}><Clock size={15} /> {activity.start_time || '-'} {activity.end_time ? `- ${activity.end_time}` : ''} WITA</div>
                  <div className={styles.infoRow}><MapPin size={15} /> {activity.location || '-'}</div>
                </div>

                {/* ADMIN ACTIONS */}
                {isAdmin && (
                  <div className={styles.actions}>
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(activity)}><Edit size={14} /> Edit</Button>
                    {activity.status === 'akan_datang' && <Button variant="primary" size="sm" onClick={() => handleStatusChange(activity, 'aktif')}><Play size={14} /> Aktifkan</Button>}
                    {activity.status === 'aktif' && <Button variant="secondary" size="sm" onClick={() => handleStatusChange(activity, 'selesai')}><CheckCircle size={14} /> Selesaikan</Button>}
                    <Button variant="danger" size="sm" onClick={() => handleDelete(activity.id)}><Trash2 size={14} /></Button>
                  </div>
                )}

                {/* ANGGOTA: Already responded */}
                {!isAdmin && myAtt && (
                  <div className={styles.respondSection} style={{ 
                    background: myAtt.status === 'menunggu' ? '#fff3cd' : (myAtt.status === 'ditolak' || myAtt.status === 'rejected') ? '#f8d7da' : '#e8f5e9', 
                    borderColor: myAtt.status === 'menunggu' ? '#ffeeba' : (myAtt.status === 'ditolak' || myAtt.status === 'rejected') ? '#f5c6cb' : 'green' 
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.875rem', color: myAtt.status === 'menunggu' ? '#856404' : (myAtt.status === 'ditolak' || myAtt.status === 'rejected') ? '#721c24' : 'green', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Check size={16} /> Respons Kamu: <Badge variant={myAtt.response === 'hadir' ? 'hadir' : 'menunggu'}>{myAtt.response?.toUpperCase()}</Badge>
                      </p>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#333' }}>
                        Status Persetujuan: {' '}
                        <span style={{ color: myAtt.status === 'menunggu' ? '#d39e00' : (myAtt.status === 'ditolak' || myAtt.status === 'rejected') ? 'red' : 'green' }}>
                          {myAtt.status === 'menunggu' ? '⏳ Menunggu Konfirmasi Admin' : (myAtt.status === 'ditolak' || myAtt.status === 'rejected') ? '❌ Ditolak' : '✅ Disetujui'}
                        </span>
                      </p>
                      {(myAtt.status === 'ditolak' || myAtt.status === 'rejected') && myAtt.note && (
                        <p style={{ fontSize: '0.8rem', color: '#721c24', marginTop: '0.25rem', padding: '0.5rem', background: '#f5c6cb', borderRadius: '4px' }}>
                          <strong>Alasan Penolakan:</strong> {myAtt.note}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ANGGOTA: Need to respond */}
                {!isAdmin && !myAtt && activity.status === 'aktif' && activity.requires_attendance && (
                  <div className={styles.respondSection}>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Respons Kehadiran:</p>
                    <div className={styles.respondButtons}>
                      <button className={styles.respondBtn} style={{ background: '#1B365D', color: '#fff' }} disabled={!!respondingId} onClick={() => handleRespondClick(activity.id, 'hadir')}>
                        <Hand size={14} /> HADIR
                      </button>
                      <button className={styles.respondBtn} style={{ background: '#F59E0B', color: '#fff' }} disabled={!!respondingId} onClick={() => handleRespondClick(activity.id, 'izin')}>
                        <FileWarning size={14} /> IZIN
                      </button>
                      <button className={styles.respondBtn} style={{ background: '#EF4444', color: '#fff' }} disabled={!!respondingId} onClick={() => handleRespondClick(activity.id, 'sakit')}>
                        <Thermometer size={14} /> SAKIT
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {isAdmin && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedActivity ? 'EDIT KEGIATAN' : 'BUAT KEGIATAN BARU'}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Nama Kegiatan" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <div className="form-group"><label className="form-label">Deskripsi</label><textarea className="textarea" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input label="Tanggal" type="date" value={formData.activity_date} onChange={e => setFormData({...formData, activity_date: e.target.value})} required />
              <Input label="Lokasi" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              <Input label="Waktu Mulai" type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
              <Input label="Waktu Selesai" type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: '2px solid #000', borderRadius: '6px' }}>
              <input type="checkbox" id="req_att" checked={formData.requires_attendance} onChange={e => setFormData({...formData, requires_attendance: e.target.checked})} style={{ width: 20, height: 20 }} />
              <label htmlFor="req_att" style={{ fontWeight: 700 }}>Wajib Presensi</label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="submit" variant="primary" loading={saving}>{selectedActivity ? 'Simpan' : 'Buat'}</Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmStatusChange}
        title="Ubah Status" message={`Ubah status menjadi "${actionType}"?`} confirmText="Ya, Ubah" variant="primary" />

      {/* MODAL RESPON KEHADIRAN (ANGGOTA) */}
      <Modal isOpen={respondModal.open} onClose={() => { setRespondModal({ open: false, activityId: null, type: '' }); setRespondReason('') }} title={respondModal.type === 'hadir' ? 'KONFIRMASI HADIR' : respondModal.type === 'izin' ? 'FORM IZIN' : 'FORM SAKIT'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {respondModal.type === 'hadir' ? (
            <p>Apakah kamu yakin ingin mengkonfirmasi kehadiran (HADIR) untuk kegiatan ini?</p>
          ) : (
            <div className="form-group">
              <label className="form-label">Alasan {respondModal.type === 'izin' ? 'Izin' : 'Sakit'} (Wajib)</label>
              <textarea className="textarea" value={respondReason} onChange={e => setRespondReason(e.target.value)} rows={3} placeholder={respondModal.type === 'izin' ? 'Jelaskan alasan izinmu...' : 'Jelaskan keluhan sakitmu...'} required />
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="outline" onClick={() => { setRespondModal({ open: false, activityId: null, type: '' }); setRespondReason('') }}>Batal</Button>
            <Button variant="primary" onClick={submitResponse} loading={!!respondingId}>Kirim</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
