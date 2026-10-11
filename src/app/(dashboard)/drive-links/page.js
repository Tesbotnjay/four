'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { LoadingSpinner, Card, Button, Badge, Input, Modal } from '@/components/ui';
import { Plus, ExternalLink, Trash2 } from 'lucide-react';
import styles from './drive-links.module.css';

const DIVISI_OPTIONS = ['Dokumentasi', 'Media', 'Berita', 'Korespondensi', 'Umum'];

export default function DriveLinksPage() {
  const { member, loading: authLoading } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    drive_url: '',
    divisi_owner: '',
    description: '',
  });

  useEffect(() => {
    if (authLoading || !member) return;
    loadDriveLinks();
  }, [member, authLoading]);

  async function loadDriveLinks() {
    try {
      setLoading(true);
      const res = await fetch('/api/drive-links?limit=100');
      const result = await res.json();
      setLinks(result.data || []);
    } catch (error) {
      console.error('Error loading drive links:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formData.title || !formData.drive_url || !formData.divisi_owner) {
      alert('Mohon isi semua field yang diperlukan');
      return;
    }

    if (!formData.drive_url.includes('drive.google.com')) {
      alert('URL harus berupa link Google Drive');
      return;
    }

    try {
      const res = await fetch('/api/drive-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          created_by: member.id,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({ title: '', drive_url: '', divisi_owner: '', description: '' });
        loadDriveLinks();
      } else {
        const error = await res.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      alert('Error membuat link: ' + error.message);
    }
  }

  if (authLoading) return <LoadingSpinner fullPage size="lg" />;
  if (!member) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data...</div>;

  const isKoor = member?.is_koor;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Link Google Drive Divisi</h2>
        {isKoor && (
          <Button onClick={() => setShowModal(true)} style={{ gap: '0.5rem' }}>
            <Plus size={20} /> Tambah Link Drive
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : links.length === 0 ? (
        <Card style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Tidak ada link Drive</p>
        </Card>
      ) : (
        <div className={styles.gridContainer}>
          {links.map(link => (
            <Card key={link.id} className={styles.linkCard}>
              <div className={styles.linkHeader}>
                <h3>{link.title}</h3>
                <Badge variant="info">{link.divisi_owner}</Badge>
              </div>
              {link.description && <p className={styles.description}>{link.description}</p>}
              <div className={styles.linkFooter}>
                <a
                  href={link.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkButton}
                >
                  <ExternalLink size={18} /> Buka Drive
                </a>
                <span className={styles.creator}>Oleh: {link.created_by?.full_name}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Tambah Link Google Drive" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Nama/Judul Link"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Foto Kegiatan Olahraga"
            />
            <Input
              label="Link Google Drive *"
              value={formData.drive_url}
              onChange={(e) => setFormData({ ...formData, drive_url: e.target.value })}
              placeholder="https://drive.google.com/..."
            />
            <select
              value={formData.divisi_owner}
              onChange={(e) => setFormData({ ...formData, divisi_owner: e.target.value })}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">Pilih Divisi Pemilik</option>
              {DIVISI_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <div>
              <label>Deskripsi (opsional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Jelaskan isi folder/file"
                rows={3}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button onClick={handleCreate} variant="primary">Tambah</Button>
              <Button onClick={() => setShowModal(false)} variant="secondary">Batal</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
