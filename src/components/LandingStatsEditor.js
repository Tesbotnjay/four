'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input } from '@/components/ui'
import { Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

export default function LandingStatsEditor() {
  const [stats, setStats] = useState({ edisi: '', liputan: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').in('key', ['edisi_terbit', 'jumlah_liputan'])
      if (data) {
        setStats({
          edisi: data.find(s => s.key === 'edisi_terbit')?.value || '',
          liputan: data.find(s => s.key === 'jumlah_liputan')?.value || ''
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edisi: stats.edisi, liputan: stats.liputan })
      })
      if (!res.ok) throw new Error('Gagal')
      addToast('Berhasil menyimpan data statistik', 'success')
    } catch (e) {
      addToast('Gagal menyimpan', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <Card style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid #eaeaea', paddingBottom: '0.5rem' }}>
        <Settings size={18} /> Update Statistik Halaman Depan
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input 
          label="Jumlah Edisi Terbit" 
          value={stats.edisi} 
          onChange={e => setStats({...stats, edisi: e.target.value})} 
          type="number"
        />
        <Input 
          label="Jumlah Liputan" 
          value={stats.liputan} 
          onChange={e => setStats({...stats, liputan: e.target.value})} 
          type="number"
        />
        <Button variant="primary" onClick={handleSave} loading={saving}>Simpan Statistik</Button>
      </div>
    </Card>
  )
}
