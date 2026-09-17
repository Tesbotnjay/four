'use client'

import React, { useState, useEffect } from 'react'
import {
  Button, Card, Badge, Table, LoadingSpinner, EmptyState
} from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { Check, X, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function MemberVerificationPage() {
  const { addToast } = useToast()
  const supabase = createClient()

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchPendingMembers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('status', 'menunggu_verifikasi')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      addToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingMembers()
  }, [])

  const handleVerify = async (id, action) => {
    if (action === 'tolak') {
      const confirm = window.confirm('Apakah Anda yakin ingin menolak dan menghapus pendaftar ini secara permanen?')
      if (!confirm) return
    }

    setActionLoading(true)
    try {
      if (action === 'terima') {
        const res = await fetch(`/api/members/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'aktif' })
        })
        if (!res.ok) throw new Error('Gagal memverifikasi anggota')
        addToast('Anggota berhasil diterima dan diaktifkan!', 'success')
      } else if (action === 'tolak') {
        // We'll assume there is a DELETE endpoint or we just change status to nonaktif
        // Let's use PUT to change status to 'nonaktif' for now to keep it safe
        const res = await fetch(`/api/members/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'nonaktif' })
        })
        if (!res.ok) throw new Error('Gagal menolak anggota')
        addToast('Pendaftaran ditolak.', 'success')
      }
      fetchPendingMembers()
    } catch (error) {
      addToast(error.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const columns = [
    { header: 'No', accessor: (row, idx) => idx + 1 },
    { header: 'Nama', accessor: 'full_name' },
    { header: 'Username', accessor: 'username' },
    { header: 'Divisi', accessor: 'kelas' },
    { header: 'NIS/NISN', accessor: 'nis_nisn' },
    { header: 'Tgl Daftar', accessor: (row) => new Date(row.created_at).toLocaleDateString('id-ID') },
    {
      header: 'Aksi',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="sm" variant="success" onClick={() => handleVerify(row.id, 'terima')} disabled={actionLoading}>
            <Check size={14} style={{ marginRight: '4px' }} /> Terima
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleVerify(row.id, 'tolak')} disabled={actionLoading}>
            <X size={14} style={{ marginRight: '4px' }} /> Tolak
          </Button>
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900 }}>VERIFIKASI ANGGOTA BARU</h1>
        <p style={{ color: 'var(--text-muted)' }}>Setujui atau tolak pendaftar anggota baru.</p>
      </div>

      <Card>
        {members.length === 0 ? (
          <EmptyState 
            icon={<UserCheck size={48} />}
            title="Tidak ada pendaftar baru"
            description="Semua anggota sudah diverifikasi."
          />
        ) : (
          <Table columns={columns} data={members} />
        )}
      </Card>
    </div>
  )
}
