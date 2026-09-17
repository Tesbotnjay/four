'use client'

import { useState, useEffect } from 'react'
import { Card, LoadingSpinner, Badge, Button } from '@/components/ui'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRealtimeNotifications } from '@/hooks/useRealtime'
import { ConnectionIndicator } from '@/components/ui'
import { Bell, Check, CheckCheck, Clock } from 'lucide-react'
import styles from './notifications.module.css'

export default function NotificationsPage() {
  const { user } = useAuth()
  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead } = useRealtimeNotifications(user?.id)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (notifications !== undefined) setTimeout(() => setLoading(false), 0)
  }, [notifications])

  const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleString('id-ID', { timeZone: 'Asia/Makassar', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'broadcast': return '📢'
      case 'attendance': return '📋'
      case 'verification': return '✓'
      case 'leave': return '📝'
      case 'announcement': return '📣'
      default: return '🔔'
    }
  }

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className={styles.notifPage}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>
          <Bell size={28} strokeWidth={3} />
          NOTIFIKASI
          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>{unreadCount}</span>
          )}
        </h1>
        <div className={styles.headerActions}>
          <ConnectionIndicator isConnected={isConnected} />
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck size={16} />
              Tandai Semua Dibaca
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className={styles.emptyCard}>
          <div className={styles.emptyContent}>
            <Bell size={48} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
            <p>Belum ada notifikasi</p>
          </div>
        </Card>
      ) : (
        <div className={styles.notifList}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`${styles.notifItem} ${!notif.is_read ? styles.unread : ''}`}
              onClick={() => {
                if (!notif.is_read) markAsRead([notif.id])
              }}
            >
              <div className={styles.notifIcon}>
                {getTypeIcon(notif.type)}
              </div>
              <div className={styles.notifContent}>
                <div className={styles.notifTitle}>{notif.title}</div>
                <div className={styles.notifMessage}>{notif.message}</div>
                <div className={styles.notifTime}>
                  <Clock size={12} />
                  {formatTime(notif.created_at)}
                </div>
              </div>
              {!notif.is_read && (
                <div className={styles.unreadDot} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
