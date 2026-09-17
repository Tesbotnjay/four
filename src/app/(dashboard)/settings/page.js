'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { Card, Button, Input, Badge, LoadingSpinner } from '@/components/ui'
import { Settings as SettingsIcon, Save, Send, Bell, Image, Globe } from 'lucide-react'
import styles from './settings.module.css'

export default function SettingsPage() {
  const { member } = useAuth()
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('telegram')
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const json = await res.json()
        setSettings(json.data || {})
      }
    } catch (error) {
      console.error('Gagal memuat pengaturan:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async (updates) => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Gagal menyimpan')
      addToast('Pengaturan berhasil disimpan', 'success')
      fetchSettings()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTestTelegram = async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_token: settings.telegram_bot_token,
          chat_id: settings.telegram_group_chat_id,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      addToast('Test berhasil! Pesan terkirim ke Telegram.', 'success')
    } catch (err) {
      addToast(`Test gagal: ${err.message}`, 'error')
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <LoadingSpinner fullPage />

  const tabs = [
    { id: 'telegram', label: 'Telegram', icon: Send },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'branding', label: 'Branding', icon: Image },
    { id: 'general', label: 'Umum', icon: Globe },
  ]

  return (
    <div className={styles.settingsPage}>
      <h1 className={styles.pageTitle}>
        <SettingsIcon size={28} strokeWidth={3} />
        PENGATURAN
      </h1>

      <div className={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} strokeWidth={2.5} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'telegram' && (
        <Card className={styles.settingsCard}>
          <h2>Pengaturan Telegram</h2>
          <p style={{ color: 'var(--text-muted)' }}>Konfigurasi Telegram Bot untuk notifikasi otomatis.</p>

          <div className="form-group">
            <Input
              label="Telegram Bot Token"
              type="password"
              value={settings.telegram_bot_token || ''}
              onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
              placeholder="123456:ABC-DEF1234..."
            />
          </div>

          <div className="form-group">
            <Input
              label="Group Chat ID"
              value={settings.telegram_group_chat_id || ''}
              onChange={(e) => setSettings({ ...settings, telegram_group_chat_id: e.target.value })}
              placeholder="-100123456789"
            />
          </div>

          <div className="form-group">
            <Input
              label="Secretary Chat ID (Opsional)"
              value={settings.telegram_secretary_chat_id || ''}
              onChange={(e) => setSettings({ ...settings, telegram_secretary_chat_id: e.target.value })}
              placeholder="-100123456789"
            />
          </div>

          <div className={styles.btnGroup}>
            <Button
              variant="secondary"
              onClick={handleTestTelegram}
              loading={testing}
              disabled={!settings.telegram_bot_token || !settings.telegram_group_chat_id}
            >
              <Send size={16} />
              TEST TELEGRAM
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSave({
                telegram_bot_token: settings.telegram_bot_token,
                telegram_group_chat_id: settings.telegram_group_chat_id,
                telegram_secretary_chat_id: settings.telegram_secretary_chat_id,
              })}
              loading={saving}
            >
              <Save size={16} />
              SIMPAN
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card className={styles.settingsCard}>
          <h2>Preferensi Notifikasi</h2>
          <p style={{ color: 'var(--text-muted)' }}>Aktifkan/nonaktifkan jenis notifikasi Telegram.</p>

          {[
            { key: 'notify_new_member', label: 'Pendaftaran anggota baru' },
            { key: 'notify_attendance', label: 'Konfirmasi hadir' },
            { key: 'notify_leave', label: 'Pengajuan izin' },
            { key: 'notify_sick', label: 'Pengajuan sakit' },
            { key: 'notify_verification', label: 'Hasil verifikasi' },
            { key: 'notify_broadcast', label: 'Broadcast' },
            { key: 'notify_recap', label: 'Rekap kegiatan' },
          ].map((item) => (
            <label key={item.key} className={styles.toggleRow}>
              <input
                type="checkbox"
                checked={settings[item.key] !== 'false'}
                onChange={(e) => {
                  const updated = { ...settings, [item.key]: e.target.checked ? 'true' : 'false' }
                  setSettings(updated)
                }}
                className={styles.checkbox}
              />
              <span>{item.label}</span>
            </label>
          ))}

          <Button
            variant="primary"
            onClick={() => handleSave(
              Object.fromEntries(
                ['notify_new_member', 'notify_attendance', 'notify_leave', 'notify_sick', 'notify_verification', 'notify_broadcast', 'notify_recap']
                  .map((k) => [k, settings[k] || 'true'])
              )
            )}
            loading={saving}
            style={{ marginTop: '1rem' }}
          >
            <Save size={16} />
            SIMPAN PREFERENSI
          </Button>
        </Card>
      )}

      {activeTab === 'branding' && (
        <Card className={styles.settingsCard}>
          <h2>Branding</h2>
          <p style={{ color: 'var(--text-muted)' }}>Pengaturan identitas JurnFourteen.</p>

          <div className="form-group">
            <Input
              label="Nama Organisasi"
              value={settings.org_name || ''}
              onChange={(e) => setSettings({ ...settings, org_name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <Input
              label="Nama Lengkap"
              value={settings.org_full_name || ''}
              onChange={(e) => setSettings({ ...settings, org_full_name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <Input
              label="Tagline"
              value={settings.tagline || ''}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
            />
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1rem' }}>
            Upload logo tersedia melalui Supabase Storage. Gunakan URL logo di pengaturan.
          </p>

          <Button
            variant="primary"
            onClick={() => handleSave({
              org_name: settings.org_name,
              org_full_name: settings.org_full_name,
              tagline: settings.tagline,
            })}
            loading={saving}
            style={{ marginTop: '1rem' }}
          >
            <Save size={16} />
            SIMPAN BRANDING
          </Button>
        </Card>
      )}

      {activeTab === 'general' && (
        <Card className={styles.settingsCard}>
          <h2>Pengaturan Umum</h2>
          <p style={{ color: 'var(--text-muted)' }}>Pengaturan sistem JurnFourteen.</p>

          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Pengaturan umum lainnya akan ditambahkan sesuai kebutuhan.
          </div>
        </Card>
      )}
    </div>
  )
}
