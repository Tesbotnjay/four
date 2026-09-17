'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Send, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import styles from './reports.module.css'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('kegiatan')
  const [activities, setActivities] = useState([])
  const [selectedActivityId, setSelectedActivityId] = useState('')
  const [stats, setStats] = useState(null)
  const [classChartData, setClassChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const { addToast } = useToast()
  const supabase = createClient()

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('activities').select('id, name, status, activity_date').order('created_at', { ascending: false })
      setActivities(data || [])
      if (data?.length > 0 && !selectedActivityId) {
        const aktif = data.find(a => a.status === 'aktif')
        setSelectedActivityId(aktif ? aktif.id : data[0].id)
      }
    } catch (e) {
      addToast('Gagal memuat kegiatan', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceStats = async () => {
    try {
      const { data: attendances } = await supabase
        .from('attendance')
        .select('final_status, member:member_id(kelas)')
        .eq('activity_id', selectedActivityId)

      const classCount = {}
      let h = 0, i = 0, s = 0, a = 0

      attendances?.forEach(att => {
        const fs = att.final_status
        if (fs === 'hadir') h++
        else if (fs === 'izin') i++
        else if (fs === 'sakit') s++
        else if (fs === 'alfa') a++

        const k = att.member?.kelas
        if (k && fs === 'hadir') {
          classCount[k] = (classCount[k] || 0) + 1
        }
      })

      setStats({ hadir: h, izin: i, sakit: s, alfa: a })
      
      const chartData = Object.keys(classCount).map(k => ({ name: k, Hadir: classCount[k] }))
      setClassChartData(chartData)
    } catch (e) {
      addToast('Gagal memuat statistik', 'error')
    }
  }

  useEffect(() => { setTimeout(() => fetchActivities(), 0) }, [])

  useEffect(() => {
    if (selectedActivityId) setTimeout(() => fetchAttendanceStats(), 0)
  }, [selectedActivityId])

  const handleExport = async (format) => {
    if (!selectedActivityId) {
      addToast('Pilih kegiatan terlebih dahulu', 'error')
      return
    }
    setExporting(true)
    try {
      const url = `/api/reports/attendance/${format}?activity_id=${selectedActivityId}`
      const res = await fetch(url)
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Export gagal')
      }
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      const ext = format === 'excel' ? 'xlsx' : 'pdf'
      const activity = activities.find(act => act.id === selectedActivityId)
      a.download = `Rekap_${activity?.name || 'kegiatan'}.${ext}`
      a.click()
      URL.revokeObjectURL(a.href)
      addToast(`Export ${format.toUpperCase()} berhasil!`, 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleTelegram = async () => {
    if (!selectedActivityId) {
      addToast('Pilih kegiatan terlebih dahulu', 'error')
      return
    }
    try {
      const res = await fetch('/api/telegram/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: selectedActivityId })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal kirim')
      addToast('Rekap berhasil dikirim ke Telegram!', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

  if (loading) return <LoadingSpinner fullPage />

  const activityOptions = activities.map(a => ({
    value: a.id,
    label: `${a.name} (${formatDate(a.activity_date)})`
  }))

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}><BarChart3 size={28} strokeWidth={3} /> REKAP & LAPORAN</h1>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tabBtn} ${activeTab === 'kegiatan' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('kegiatan')}>Per Kegiatan</button>
        <button className={`${styles.tabBtn} ${activeTab === 'bulanan' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('bulanan')}>Bulanan</button>
        <button className={`${styles.tabBtn} ${activeTab === 'anggota' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('anggota')}>Per Anggota</button>
      </div>

      <div className={styles.content}>
        {activeTab === 'kegiatan' && (
          <>
            <div className={styles.filtersBar}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <Select label="Pilih Kegiatan" options={activityOptions} value={selectedActivityId} onChange={e => setSelectedActivityId(e.target.value)} />
              </div>
            </div>

            {stats && (
              <div className={styles.statsRow}>
                <div className={styles.statCard}><div className={styles.statValue} style={{color: 'var(--success)'}}>{stats.hadir}</div><div className={styles.statLabel}>Hadir</div></div>
                <div className={styles.statCard}><div className={styles.statValue} style={{color: 'var(--warning)'}}>{stats.izin}</div><div className={styles.statLabel}>Izin</div></div>
                <div className={styles.statCard}><div className={styles.statValue} style={{color: 'var(--accent)'}}>{stats.sakit}</div><div className={styles.statLabel}>Sakit</div></div>
                <div className={styles.statCard}><div className={styles.statValue} style={{color: 'var(--danger)'}}>{stats.alfa}</div><div className={styles.statLabel}>Alfa</div></div>
                <div className={styles.statCard}><div className={styles.statValue}>{stats.persentase}%</div><div className={styles.statLabel}>Kehadiran</div></div>
              </div>
            )}

            <div className={styles.actionsBar}>
              <Button variant="primary" onClick={() => handleExport('excel')} loading={exporting}><Download size={16} /> EXPORT EXCEL</Button>
              <Button variant="outline" onClick={() => handleExport('pdf')} loading={exporting}><FileText size={16} /> EXPORT PDF</Button>
              <Button variant="secondary" onClick={handleTelegram}><Send size={16} /> KIRIM KE TELEGRAM</Button>
            </div>
          </>
        )}

        {activeTab === 'bulanan' && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <BarChart3 size={48} style={{ margin: '0 auto 1rem' }} />
            <p style={{ fontWeight: 700, fontSize: '1.125rem' }}>Rekap Bulanan</p>
            <p>Rekap bulanan akan tersedia setelah ada cukup data kehadiran.</p>
          </div>
        )}

        {activeTab === 'anggota' && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <BarChart3 size={48} style={{ margin: '0 auto 1rem' }} />
            <p style={{ fontWeight: 700, fontSize: '1.125rem' }}>Rekap Per Anggota</p>
            <p>Rekap per anggota akan tersedia setelah ada cukup data kehadiran.</p>
          </div>
        )}
      </div>
    </div>
  )
}
