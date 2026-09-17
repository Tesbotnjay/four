'use client'

import React, { useState, useEffect } from 'react'
import {
  Button, Card, Badge, Table, LoadingSpinner, EmptyState, Modal, Input
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

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const handleVerify = async (id, action) => {
    if (action === 'tolak') {
      setSelectedId(id)
      setRejectReason('')
      setIsRejectModalOpen(true)
      return
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
        fetchPendingMembers()
      }
    } catch (error) {
      addToast(error.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      addToast('Alasan penolakan harus diisi', 'error')
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch(`/api/members/${selectedId}?reject=true&reason=${encodeURIComponent(rejectReason)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal menolak anggota')
      addToast('Pendaftaran ditolak dan pendaftar telah dihapus.', 'success')
      setIsRejectModalOpen(false)
      fetchPendingMembers()
    } catch (error) {
      addToast(error.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const columns = [
    { label: 'No', render: (row, idx) => idx + 1 },
    { label: 'Nama', key: 'full_name' },
    { label: 'Username', key: 'username' },
    { label: 'Divisi', key: 'kelas' },
    { label: 'NIS/NISN', key: 'nis_nisn' },
    { label: 'Tgl Daftar', render: (row) => new Date(row.created_at).toLocaleDateString('id-ID') },
    {
      label: 'Aksi',
      render: (row) => (
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

      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Tolak Pendaftar">
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            Masukkan alasan penolakan. Pendaftar ini akan dihapus dari sistem agar dapat mendaftar ulang.
          </p>
          <Input 
            label="Alasan Penolakan" 
            placeholder="Contoh: Data NIS salah, silakan daftar ulang" 
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Button variant="secondary" onClick={() => setIsRejectModalOpen(false)}>Batal</Button>
          <Button variant="danger" onClick={submitReject} loading={actionLoading}>Tolak & Hapus</Button>
        </div>
      </Modal>
    </div>
  )
}
