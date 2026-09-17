'use client'

import React, { useState, useEffect } from 'react'
import {
  Button, Card, Badge, Input, Modal,
  Table, Select, LoadingSpinner, EmptyState, ConfirmDialog
} from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import {
  Users, Plus, Search, Edit, Key, UserX, UserCheck, Eye, ChevronLeft, ChevronRight
} from 'lucide-react'
import {
  KELAS_OPTIONS, JABATAN_OPTIONS, ROLE_LABELS, ROLES, JABATAN_ROLE_MAP
} from '@/lib/constants'
import styles from './members.module.css'

// Constants
const STATUS_OPTIONS = [
  { label: 'Semua', value: '' },
  { label: 'Aktif', value: 'aktif' },
  { label: 'Nonaktif', value: 'nonaktif' },
  { label: 'Menunggu', value: 'menunggu' }
]

const ROLE_OPTIONS = [
  { label: 'Semua', value: '' },
  ...Object.entries(ROLE_LABELS).map(([value, label]) => ({ label, value }))
]

export default function MembersPage() {
  const { addToast } = useToast()

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [kelasFilter, setKelasFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const [selectedMember, setSelectedMember] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Form States
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    nis_nisn: '',
    kelas: '',
    phone: '',
    jabatan: '',
    role: ''
  })
  const [resetPassword, setResetPassword] = useState('')

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams({
        page,
        limit: 10,
        ...(search && { search }),
        ...(kelasFilter && { kelas: kelasFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(roleFilter && { role: roleFilter })
      })

      const res = await fetch(`/api/members?${query}`)
      if (!res.ok) throw new Error('Gagal mengambil data anggota')

      const result = await res.json()
      setMembers(result.data || [])
      setTotalPages(result.pagination?.totalPages || 1)
    } catch (error) {
      addToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, kelasFilter, statusFilter, roleFilter])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const updates = { [name]: value }
    
    if (name === 'jabatan' && JABATAN_ROLE_MAP[value]) {
      updates.role = JABATAN_ROLE_MAP[value]
    }
    
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Gagal menambah anggota')
      }
      addToast('Anggota berhasil ditambahkan', 'success')
      setIsAddModalOpen(false)
      fetchMembers()
    } catch (error) {
      addToast(error.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const res = await fetch(`/api/members/${selectedMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Gagal mengubah anggota')
      }
      addToast('Anggota berhasil diubah', 'success')
      setIsEditModalOpen(false)
      fetchMembers()
    } catch (error) {
      addToast(error.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const res = await fetch(`/api/members/${selectedMember.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: resetPassword })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Gagal mereset password')
      }
      addToast('Password berhasil direset', 'success')
      setIsResetModalOpen(false)
    } catch (error) {
      addToast(error.message, 'error')
    } finally {
      setActionLoading(false)
      setResetPassword('')
    }
  }

  const handleToggleStatus = async () => {
    setActionLoading(true)
    try {
      const newStatus = selectedMember.status === 'aktif' ? 'nonaktif' : 'aktif'
      const res = await fetch(`/api/members/${selectedMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error(`Gagal ${newStatus === 'aktif' ? 'mengaktifkan' : 'menonaktifkan'} anggota`)
      
      addToast(`Anggota berhasil di${newStatus === 'aktif' ? 'aktifkan' : 'nonaktifkan'}`, 'success')
      fetchMembers()
    } catch (error) {
      addToast(error.message, 'error')
    } finally {
      setActionLoading(false)
      setIsConfirmOpen(false)
    }
  }

  const openEditModal = (member) => {
    setSelectedMember(member)
    setFormData({
      full_name: member.full_name || '',
      username: member.username || '',
      nis_nisn: member.nis_nisn || '',
      kelas: member.kelas || '',
      phone: member.phone || '',
      jabatan: member.jabatan || '',
      role: member.role || ''
    })
    setIsEditModalOpen(true)
  }

  const columns = [
    { header: 'No', accessor: (row, idx) => (page - 1) * 10 + idx + 1 },
    { 
      header: 'Foto', 
      accessor: (row) => (
        <img 
          src={row.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(row.full_name || row.username)} 
          alt={row.full_name} 
          className={styles.memberAvatar} 
        />
      )
    },
    { header: 'Nama', accessor: 'full_name' },
    { header: 'NIS/NISN', accessor: 'nis_nisn' },
    { header: 'Kelas', accessor: 'kelas' },
    { header: 'Username', accessor: 'username' },
    { header: 'Jabatan', accessor: 'jabatan' },
    { header: 'Role', accessor: (row) => ROLE_LABELS[row.role] || row.role },
    { 
      header: 'Status', 
      accessor: (row) => (
        <Badge variant={row.status}>{row.status}</Badge>
      )
    },
    {
      header: 'Aksi',
      accessor: (row) => (
        <div className={styles.actionBtns}>
          <Button variant="outline" size="sm" onClick={() => openEditModal(row)} aria-label="Edit">
            <Edit size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            setSelectedMember(row)
            setIsResetModalOpen(true)
          }} aria-label="Reset Password">
            <Key size={16} />
          </Button>
          {row.status === 'aktif' ? (
            <Button variant="danger" size="sm" onClick={() => {
              setSelectedMember(row)
              setIsConfirmOpen(true)
            }} aria-label="Nonaktifkan">
              <UserX size={16} />
            </Button>
          ) : (
            <Button variant="success" size="sm" onClick={() => {
              setSelectedMember(row)
              setIsConfirmOpen(true)
            }} aria-label="Aktifkan">
              <UserCheck size={16} />
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="main-wrapper">
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>DATA ANGGOTA</h1>
        <Button 
          variant="primary" 
          onClick={() => {
            setFormData({ full_name: '', username: '', password: '', nis_nisn: '', kelas: '', phone: '', jabatan: '', role: '' })
            setIsAddModalOpen(true)
          }}
        >
          <Plus size={18} style={{ marginRight: '8px' }} />
          TAMBAH ANGGOTA
        </Button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchInput}>
          <Input 
            placeholder="Cari nama, username, NIS..." 
            value={search} 
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }} 
          />
        </div>
        <div className={styles.filterSelect}>
          <Select 
            options={[{label: 'Semua Kelas', value: ''}, ...KELAS_OPTIONS]} 
            value={kelasFilter} 
            onChange={(e) => {
              setKelasFilter(e.target.value)
              setPage(1)
            }} 
          />
        </div>
        <div className={styles.filterSelect}>
          <Select 
            options={STATUS_OPTIONS} 
            value={statusFilter} 
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }} 
          />
        </div>
        <div className={styles.filterSelect}>
          <Select 
            options={ROLE_OPTIONS} 
            value={roleFilter} 
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }} 
          />
        </div>
      </div>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <LoadingSpinner size="lg" />
          </div>
        ) : members.length === 0 ? (
          <EmptyState 
            icon={<Users size={48} />}
            title="Tidak ada anggota"
            description="Data anggota tidak ditemukan dengan filter yang dipilih."
          />
        ) : (
          <>
            <Table columns={columns} data={members} />
            
            <div className={styles.pagination}>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page <= 1} 
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={16} />
              </Button>
              <span>Halaman {page} dari {totalPages || 1}</span>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= totalPages} 
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="TAMBAH ANGGOTA">
        <form onSubmit={handleAddSubmit} id="add-form">
          <Input label="Nama Lengkap" name="full_name" value={formData.full_name} onChange={handleInputChange} required />
          <Input label="Username" name="username" value={formData.username} onChange={handleInputChange} required />
          <Input label="Password" name="password" type="password" value={formData.password} onChange={handleInputChange} required />
          <Input label="NIS/NISN" name="nis_nisn" value={formData.nis_nisn} onChange={handleInputChange} />
          
          <Select label="Kelas" name="kelas" options={[{label: 'Pilih Kelas', value: ''}, ...KELAS_OPTIONS]} value={formData.kelas} onChange={handleInputChange} required />
          <Input label="No. HP" name="phone" value={formData.phone} onChange={handleInputChange} />
          
          <Select label="Jabatan" name="jabatan" options={[{label: 'Pilih Jabatan', value: ''}, ...JABATAN_OPTIONS]} value={formData.jabatan} onChange={handleInputChange} required />
          <Select label="Role" name="role" options={[{label: 'Pilih Role', value: ''}, ...ROLE_OPTIONS.filter(r => r.value)]} value={formData.role} onChange={handleInputChange} required />
        </form>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Batal</Button>
          <Button variant="primary" type="submit" form="add-form" loading={actionLoading}>Simpan</Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="EDIT ANGGOTA">
        <form onSubmit={handleEditSubmit} id="edit-form">
          <Input label="Nama Lengkap" name="full_name" value={formData.full_name} onChange={handleInputChange} required />
          <Input label="Username" name="username" value={formData.username} onChange={handleInputChange} required />
          <Input label="NIS/NISN" name="nis_nisn" value={formData.nis_nisn} onChange={handleInputChange} />
          
          <Select label="Kelas" name="kelas" options={[{label: 'Pilih Kelas', value: ''}, ...KELAS_OPTIONS]} value={formData.kelas} onChange={handleInputChange} required />
          <Input label="No. HP" name="phone" value={formData.phone} onChange={handleInputChange} />
          
          <Select label="Jabatan" name="jabatan" options={[{label: 'Pilih Jabatan', value: ''}, ...JABATAN_OPTIONS]} value={formData.jabatan} onChange={handleInputChange} required />
          <Select label="Role" name="role" options={[{label: 'Pilih Role', value: ''}, ...ROLE_OPTIONS.filter(r => r.value)]} value={formData.role} onChange={handleInputChange} required />
        </form>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
          <Button variant="primary" type="submit" form="edit-form" loading={actionLoading}>Simpan</Button>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="RESET PASSWORD">
        <form onSubmit={handleResetPasswordSubmit} id="reset-form">
          <Input 
            label={`Password Baru untuk ${selectedMember?.full_name}`} 
            name="new_password" 
            type="password" 
            value={resetPassword} 
            onChange={(e) => setResetPassword(e.target.value)} 
            required 
          />
        </form>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={() => setIsResetModalOpen(false)}>Batal</Button>
          <Button variant="primary" type="submit" form="reset-form" loading={actionLoading}>Reset</Button>
        </div>
      </Modal>

      {/* Confirm Deactivate/Activate */}
      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleToggleStatus}
        title="Konfirmasi Perubahan Status"
        message={`Apakah Anda yakin ingin men${selectedMember?.status === 'aktif' ? 'nonaktifkan' : 'aktifkan'} anggota ${selectedMember?.full_name}?`}
        confirmText="Ya, Lanjutkan"
        variant={selectedMember?.status === 'aktif' ? 'danger' : 'success'}
      />
    </div>
  )
}
