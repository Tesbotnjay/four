'use client'

import { useState, useEffect } from 'react'
import { Card, LoadingSpinner, Button } from '@/components/ui'
import { ScrollText, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import styles from './logs.module.css'

export default function LogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [page, search])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 30 })
      if (search) params.append('action', search)

      const res = await fetch(`/api/logs?${params}`)
      const json = await res.json()
      setLogs(json.data || [])
      setTotalPages(json.pagination?.totalPages || 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleString('id-ID', {
      timeZone: 'Asia/Makassar',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={styles.logsPage}>
      <h1 className={styles.pageTitle}>
        <ScrollText size={28} strokeWidth={3} />
        ACTIVITY LOG
      </h1>

      <div className={styles.searchBar}>
        <Search size={18} />
        <input
          type="text"
          placeholder="Cari aktivitas..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className={styles.searchInput}
        />
      </div>

      {loading ? (
        <LoadingSpinner fullPage />
      ) : logs.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Belum ada aktivitas yang tercatat.
          </div>
        </Card>
      ) : (
        <>
          <div className={styles.logList}>
            {logs.map((log) => (
              <div key={log.id} className={styles.logItem}>
                <div className={styles.logTime}>{formatTime(log.created_at)}</div>
                <div className={styles.logBody}>
                  <div className={styles.logAction}>
                    <span className={styles.logUser}>{log.member_name || 'System'}</span>
                    {' — '}
                    <span className={styles.logActionText}>{log.action}</span>
                  </div>
                  {log.details && (
                    <div className={styles.logDetails}>{log.details}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.pagination}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft size={16} />
              Sebelumnya
            </Button>
            <span className={styles.pageInfo}>
              Halaman {page} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Selanjutnya
              <ChevronRight size={16} />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
