'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { LoadingSpinner, Card, Button, Badge, Input, Modal } from '@/components/ui';
import { Plus, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import styles from './assignments.module.css';

const DIVISI_OPTIONS = ['Dokumentasi', 'Media', 'Berita', 'Korespondensi', 'Umum'];

export default function AssignmentsPage() {
  const { member, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    divisi: '',
    assigned_to: '',
    due_date: '',
    drive_url: '',
  });
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (authLoading || !member) return;
    loadAssignments();
    loadMembers();
  }, [member, authLoading]);

  async function loadAssignments() {
    try {
      setLoading(true);
      const filter = member?.is_koor ? `?divisi=${member.divisi}` : `?member_id=${member.id}`;
      const res = await fetch(`/api/assignments${filter}`);
      const result = await res.json();
      setAssignments(result.data || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers() {
    try {
      if (!member?.is_koor) return;
      const res = await fetch(`/api/members?divisi=${member.divisi}&limit=100`);
      const result = await res.json();
      setMembers(result.data || []);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  }

  async function handleCreate() {
    if (!formData.title || !formData.description || !formData.divisi || !formData.assigned_to) {
      alert('Mohon isi semua field yang diperlukan');
      return;
    }

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          assigned_by: member.id,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({ title: '', description: '', divisi: member.divisi || '', assigned_to: '', due_date: '', drive_url: '' });
        loadAssignments();
      } else {
        const error = await res.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      alert('Error membuat penugasan: ' + error.message);
    }
  }

  async function handleDelete(taskId) {
    if (!confirm('Yakin ingin menghapus penugasan ini?')) return;
    try {
      const res = await fetch(`/api/assignments?id=${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        loadAssignments();
      } else {
        const error = await res.json();
        alert('Gagal menghapus penugasan: ' + error.error);
      }
    } catch (error) {
      alert('Error menghapus penugasan: ' + error.message);
    }
  }

  if (authLoading) return <LoadingSpinner fullPage size="lg" />;
  if (!member) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data...</div>;

  const isKoor = member?.is_koor;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Penugasan Divisi</h2>
        {isKoor && (
          <Button onClick={() => {
            setFormData({ title: '', description: '', divisi: member.divisi || '', assigned_to: '', due_date: '', drive_url: '' });
            setShowModal(true);
          }} style={{ gap: '0.5rem' }}>
            <Plus size={20} /> Buat Penugasan
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : assignments.length === 0 ? (
        <Card style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Tidak ada penugasan</p>
        </Card>
      ) : (
        <div className={styles.listContainer}>
          {assignments.map(task => (
            <Card key={task.id} className={styles.taskCard}>
              <div className={styles.taskHeader}>
                <h3>{task.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Badge variant={task.status === 'completed' ? 'success' : 'warning'}>
                    {task.status === 'completed' ? 'Selesai' : 'Menunggu'}
                  </Badge>
                  {(isKoor || member?.role === 'admin' || member?.role === 'super_admin') && (
                    <button
                      onClick={() => handleDelete(task.id)}
                      title="Hapus Penugasan"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--accent, #FF6B6B)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <p className={styles.description}>{task.description}</p>
              <div className={styles.taskMeta}>
                <span>Divisi: {task.divisi}</span>
                <span>Untuk: {task.assigned_to?.full_name}</span>
                {task.due_date && <span>Deadline: {new Date(task.due_date).toLocaleDateString('id-ID')}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <Modal isOpen={true} title="Buat Penugasan" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Judul Penugasan"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Edit Foto Kegiatan"
            />
            <div>
              <label>Deskripsi Instruksi *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Jelaskan apa yang perlu dilakukan"
                rows={4}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <Input
              label="Divisi"
              value={formData.divisi}
              readOnly
            />
            <select
              aria-label="Pilih Anggota Divisi"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">Pilih Anggota {formData.divisi}</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
            <Input
              label="Deadline (opsional)"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
            <Input
              label="Link Google Drive (opsional)"
              type="url"
              value={formData.drive_url}
              onChange={(e) => setFormData({ ...formData, drive_url: e.target.value })}
              placeholder="https://drive.google.com/..."
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button onClick={handleCreate} variant="primary">Buat</Button>
              <Button onClick={() => setShowModal(false)} variant="secondary">Batal</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
