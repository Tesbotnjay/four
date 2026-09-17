'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook for subscribing to Supabase realtime changes
 * @param {string} table - Table name to subscribe to
 * @param {object} options - { filter, event, onInsert, onUpdate, onDelete, onChange }
 */
export function useRealtime(table, options = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const { filter, event = '*', onInsert, onUpdate, onDelete, onChange } = options

    const channelName = `realtime-${table}-${filter || 'all'}-${Date.now()}`

    const channelConfig = {
      event,
      schema: 'public',
      table,
    }

    if (filter) {
      channelConfig.filter = filter
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', channelConfig, (payload) => {
        if (onChange) onChange(payload)
        if (payload.eventType === 'INSERT' && onInsert) onInsert(payload.new)
        if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload.new, payload.old)
        if (payload.eventType === 'DELETE' && onDelete) onDelete(payload.old)
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, options.filter])

  return { isConnected }
}

/**
 * Hook for realtime notifications
 * @param {string} userId - Current user's auth ID
 */
export function useRealtimeNotifications(userId) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    if (!userId) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) setNotifications(data)

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    setUnreadCount(count || 0)
  }, [userId])

  useEffect(() => {
    if (!userId) return

    // fetch first load
    setTimeout(() => fetchNotifications(), 0)

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev])
        setUnreadCount((prev) => prev + 1)
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markAsRead = async (notificationIds) => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_ids: notificationIds }),
    })
    setNotifications((prev) =>
      prev.map((n) =>
        notificationIds.includes(n.id) ? { ...n, is_read: true } : n
      )
    )
    setUnreadCount((prev) => Math.max(0, prev - notificationIds.length))
  }

  const markAllAsRead = async () => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return { notifications, unreadCount, isConnected, markAsRead, markAllAsRead, refresh: fetchNotifications }
}
