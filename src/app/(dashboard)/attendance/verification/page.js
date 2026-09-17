'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Button, Card, Badge, Input, Modal,
  Table, Select, LoadingSpinner, EmptyState, ConnectionIndicator
} from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { ClipboardCheck, CheckCircle, Check, X } from 'lucide-react'
import { KELAS_OPTIONS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import styles from './verification.module.css'

const STATUS_TABS = [
  { id: 'semua', label: 'Semua' },
  { id: 'menunggu', label: 'Menunggu' },
  { id: 'hadir', label: 'Hadir' },
  { id: 'izin', label: 'Izin' },
  { id: 'sakit', label: 'Sakit' },
  { id: 'belum', label: 'Belum Mengisi' },
  { id: 'ditolak', label: 'Ditolak' },
]

export default function VerificationPage() {
  const { addToast } = useToast()
  const supabase = createClient()

  const [activities, setActivities] = useState([])
  const [selectedActivity, setSelectedActivity] = useState('')
  const [activityDetail, setActivityDetail] = useState(null)

  const [attendanceData, setAttendanceData] = useState([])
  const [stats, setStats] = useState({ total: 0, hadir: 0, izin: 0, sakit: 0, alfa: 0, menunggu: 0, belum: 0, sudah: 0 })

  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const [activeTab, setActiveTab] = useState('semua')
  const [kelasFilter, setKelasFilter] = useState('')
  const [search, setSearch] = useState('')

  const [selectedIds, setSelectedIds] = useState([])
  const [isTolakModalOpen, setIsTolakModalOpen] = useState(false)
  const [tolakReason, setTolakReason] = useState('')
  const [selectedRecordId, setSelectedRecordId] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch('/api/activities')
        if (res.ok) {
          const result = await res.json()
          const acts = result.data || []
          setActivities(acts)
          // Select first aktif, or first activity
          const aktif = acts.find(a => a.status === 'aktif')
          if (aktif) setSelectedActivity(aktif.id)
          else if (acts.length > 0) setSelectedActivity(acts[0].id)
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  }, [])

  // Fetch attendance
  const fetchAttendanceData = useCallback(async () => {
    if (!selectedActivity) return
    setDataLoading(true)
    try {
      const res = await fetch(`/api/attendance?activity_id=${selectedActivity}`)
      if (!res.ok) throw new Error('Gagal memuat data')
      const result = await res.json()
      setAttendanceData(result.data || [])
      setStats(result.stats || stats)

      // Activity detail
      const actRes = await fetch(`/api/activities/${selectedActivity}`)
      if (actRes.ok) {
        const actResult = await actRes.json()
        setActivityDetail(actResult.data)
      }
    } catch (error) {
      addToast(error.message, 'error')
    } finally {
      setDataLoading(false)
    }
  }, [selectedActivity])

  useEffect(() => { fetchAttendanceData() }, [fetchAttendanceData])

  // Realtime subscription
  useEffect(() => {
    if (!selectedActivity) return
    const channel = supabase
      .channel(`verification-channel`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'attendance'
      }, () => { 
        fetchAttendanceData() 
      })
      .subscribe((status) => { setIsConnected(status === 'SUBSCRIBED') })
    
    return () => { supabase.removeChannel(channel) }
  }, [selectedActivity, fetchAttendanceData])

  // Verify single
  const handleVerify = async (id, status, notes = '') => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/attendance/${id}/verify`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, verification_notes: notes })
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Gagal') }
      addToast(`Verifikasi: ${status}`, 'success')
      if (status === 'ditolak') { setIsTolakModalOpen(false); setTolakReason('') }
      fetchAttendanceData()
    } catch (error) { addToast(error.message, 'error') }
    finally { setActionLoading(false) }
  }

  // Bulk verify
  const handleBulkVerify = async (ids, status) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/attendance/bulk-verify', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status })
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Gagal') }
      addToast(`${ids.length} data diverifikasi`, 'success')
      setSelectedIds([])
      fetchAttendanceData()
    } catch (error) { addToast(error.message, 'error') }
    finally { setActionLoading(false) }
  }

  const handleSelectAll = (e, data) => {
    if (e.target.checked) setSelectedIds(data.filter(d => d.id && d.status === 'menunggu').map(d => d.id))
    else setSelectedIds([])
  }

  // Filter
  const filteredData = attendanceData.filter(item => {
    if (activeTab !== 'semua' && item.status !== activeTab) return false
    if (kelasFilter && item.members?.kelas !== kelasFilter) return false
    if (search && !item.members?.full_name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  const columns = [
    {
      label: <input type="checkbox" onChange={(e) => handleSelectAll(e, filteredData)}
        checked={selectedIds.length > 0 && selectedIds.length === filteredData.filter(d => d.id && d.status === 'menunggu').length}
        disabled={filteredData.filter(d => d.id && d.status === 'menunggu').length === 0} />,
      render: (row) => row.id && row.status === 'menunggu' ? (
        <input type="checkbox" checked={selectedIds.includes(row.id)}
          onChange={(e) => { if (e.target.checked) setSelectedIds(p => [...p, row.id]); else setSelectedIds(p => p.filter(x => x !== row.id)) }} />
      ) : null
    },
    { label: 'Nama', render: (row) => <strong>{row.members?.full_name || '-'}</strong> },
    { label: 'Kelas', render: (row) => row.members?.kelas || '-' },
    {
      label: 'Respon',
      render: (row) => {
        if (row.status === 'belum') return <Badge variant="menunggu">BELUM</Badge>
        const typeLabels = { hadir: 'HADIR', izin: 'IZIN', sakit: 'SAKIT' }
        const typeVariants = { hadir: 'hadir', izin: 'menunggu', sakit: 'ditolak' }
        return <Badge variant={typeVariants[row.type] || 'menunggu'}>{typeLabels[row.type] || row.type?.toUpperCase()}</Badge>
      }
    },
    {
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'hadir' ? 'hadir' : row.status === 'menunggu' ? 'menunggu' : row.status === 'belum' ? 'default' : 'ditolak'}>
          {row.status.toUpperCase()}
        </Badge>
      )
    },
    { label: 'Tgl Submit', render: (row) => formatDate(row.created_at) },
    {
      label: 'Aksi',
      render: (row) => {
        if (!row.id || row.status !== 'menunggu') return '-'
        return (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button size="sm" variant="success" onClick={() => handleVerify(row.id, 'diterima')} disabled={actionLoading}>
              <Check size={14} /> Terima
            </Button>
            <Button size="sm" variant="danger" onClick={() => { setSelectedRecordId(row.id); setIsTolakModalOpen(true) }} disabled={actionLoading}>
              <X size={14} /> Tolak
            </Button>
          </div>
        )
      }
    }
  ]

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><LoadingSpinner size="lg" /></div>

  const activityOptions = activities.map(a => ({ label: `${a.name} (${formatDate(a.activity_date)}) [${a.status}]`, value: a.id }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900 }}>VERIFIKASI KEHADIRAN</h1>
        <ConnectionIndicator isConnected={isConnected} />
      </div>

      <Card style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <Select label="Pilih Kegiatan" options={activityOptions} value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} />
        </div>
        {activityDetail && (
          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', border: '2px solid #000', borderRadius: '8px', marginBottom: '1rem' }}>
            <strong>{activityDetail.name}</strong>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {formatDate(activityDetail.activity_date)} | {activityDetail.start_time} - {activityDetail.end_time || 'Selesai'} | {activityDetail.location}
            </div>
          </div>
        )}

        {dataLoading && !attendanceData.length ? <LoadingSpinner /> : (
          <div className={styles.statsGrid}>
            <Card className={styles.statItem}><div className={styles.statValue}>{stats.total}</div><div className={styles.statLabel}>Total</div></Card>
            <Card className={styles.statItem}><div className={styles.statValue}>{stats.sudah}</div><div className={styles.statLabel}>Sudah Isi</div></Card>
            <Card className={styles.statItem}><div className={styles.statValue} style={{ color: 'var(--warning)' }}>{stats.menunggu}</div><div className={styles.statLabel}>Menunggu</div></Card>
            <Card className={styles.statItem}><div className={styles.statValue} style={{ color: 'green' }}>{stats.hadir}</div><div className={styles.statLabel}>Hadir</div></Card>
            <Card className={styles.statItem}><div className={styles.statValue} style={{ color: '#F59E0B' }}>{stats.izin}</div><div className={styles.statLabel}>Izin</div></Card>
            <Card className={styles.statItem}><div className={styles.statValue} style={{ color: '#F59E0B' }}>{stats.sakit}</div><div className={styles.statLabel}>Sakit</div></Card>
            <Card className={styles.statItem}><div className={styles.statValue}>{stats.belum}</div><div className={styles.statLabel}>Belum</div></Card>
          </div>
        )}
      </Card>

      <div className={styles.filterBar}>
        <div className={styles.filterTabs}>
          {STATUS_TABS.map(tab => (
            <button key={tab.id} className={activeTab === tab.id ? styles.active : ''} onClick={() => setActiveTab(tab.id)}>
              {tab.label}{tab.id === 'menunggu' && stats.menunggu > 0 ? ` (${stats.menunggu})` : ''}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Select options={[{label: 'Semua Kelas', value: ''}, ...KELAS_OPTIONS]} value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)} />
          <Input placeholder="Cari nama..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card>
        {dataLoading && !attendanceData.length ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}><LoadingSpinner size="lg" /></div>
        ) : filteredData.length === 0 ? (
          <EmptyState icon={<ClipboardCheck size={48} />} title="Tidak ada data" description="Tidak ada data kehadiran yang sesuai filter." />
        ) : (
          <Table columns={columns} data={filteredData} />
        )}
      </Card>

      {selectedIds.length > 0 && (
        <div className={styles.bulkBar}>
          <div><strong>{selectedIds.length}</strong> data dipilih</div>
          <Button variant="primary" onClick={() => handleBulkVerify(selectedIds, 'diterima')} loading={actionLoading}>
            <CheckCircle size={18} /> TERIMA YANG DIPILIH
          </Button>
        </div>
      )}

      <Modal isOpen={isTolakModalOpen} onClose={() => setIsTolakModalOpen(false)} title="TOLAK KEHADIRAN">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Alasan Penolakan (Opsional)" value={tolakReason} onChange={(e) => setTolakReason(e.target.value)} placeholder="Masukkan alasan..." />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="outline" onClick={() => setIsTolakModalOpen(false)}>Batal</Button>
            <Button variant="danger" onClick={() => handleVerify(selectedRecordId, 'ditolak', tolakReason)} loading={actionLoading}>Tolak</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
