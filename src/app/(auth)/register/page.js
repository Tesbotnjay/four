'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { KELAS_OPTIONS } from '@/lib/constants';
import styles from './register.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    namaLengkap: '',
    nis: '',
    kelas: '',
    noHp: '',
    username: '',
    password: '',
    konfirmasiPassword: '',
    alasan: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.namaLengkap) newErrors.namaLengkap = 'Nama lengkap wajib diisi';
    if (!formData.nis) newErrors.nis = 'NIS/NISN wajib diisi';
    if (!formData.kelas) newErrors.kelas = 'Divisi wajib dipilih';
    if (!formData.noHp) newErrors.noHp = 'Nomor HP wajib diisi';
    
    if (!formData.username) {
      newErrors.username = 'Username wajib diisi';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username hanya boleh berisi huruf, angka, dan underscore';
    }

    if (!formData.password) {
      newErrors.password = 'Password wajib diisi';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    if (formData.password !== formData.konfirmasiPassword) {
      newErrors.konfirmasiPassword = 'Password tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Mohon periksa kembali form Anda', 'error');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        full_name: formData.namaLengkap,
        username: formData.username,
        password: formData.password,
        nis_nisn: formData.nis,
        kelas: formData.kelas,
        phone: formData.noHp,
        join_reason: formData.alasan || '',
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Gagal mendaftar');
      }

      addToast('Pendaftaran berhasil! Menunggu verifikasi dari pengurus.', 'success');
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registerPage}>
      <div className={styles.decorTriangle}></div>
      <div className={styles.decorStar}></div>
      
      <div className={styles.registerCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>DAFTAR ANGGOTA JURNFOURTEEN</h1>
          <div className={styles.subtitle}>BERGABUNG BERSAMA KAMI</div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            <Input
              id="namaLengkap"
              name="namaLengkap"
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap"
              value={formData.namaLengkap}
              onChange={handleChange}
              error={errors.namaLengkap}
              required
            />
            
            <Input
              id="nis"
              name="nis"
              label="NIS / NISN"
              placeholder="Masukkan NIS/NISN"
              value={formData.nis}
              onChange={handleChange}
              error={errors.nis}
              required
            />
          </div>

          <div className={styles.grid}>
            <Select
              id="kelas"
              name="kelas"
              label="Divisi"
              options={KELAS_OPTIONS.map(opt => ({ label: opt, value: opt }))}
              value={formData.kelas}
              onChange={handleChange}
              error={errors.kelas}
            />

            <Input
              id="noHp"
              name="noHp"
              label="Nomor HP"
              placeholder="08xxxxxxxxxx"
              value={formData.noHp}
              onChange={handleChange}
              error={errors.noHp}
              required
            />
          </div>

          <Input
            id="username"
            name="username"
            label="Username"
            placeholder="Pilih username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            required
          />

          <div className={styles.grid}>
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="Minimal 6 karakter"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />

            <Input
              id="konfirmasiPassword"
              name="konfirmasiPassword"
              type="password"
              label="Konfirmasi Password"
              placeholder="Ulangi password"
              value={formData.konfirmasiPassword}
              onChange={handleChange}
              error={errors.konfirmasiPassword}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="alasan" className="form-label" style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', color: '#000' }}>Alasan Ingin Bergabung</label>
            <textarea
              id="alasan"
              name="alasan"
              className="textarea"
              style={{ 
                width: '100%', 
                minHeight: '120px', 
                padding: '0.75rem', 
                border: '3px solid #000', 
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '1rem',
                backgroundColor: 'white',
                boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.1)'
              }}
              placeholder="Ceritakan mengapa Anda ingin bergabung dengan JurnFourteen..."
              value={formData.alasan}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="foto" className={styles.fileInputLabel}>
              Foto Profil (Opsional)
            </label>
            <input
              id="foto"
              name="foto"
              type="file"
              accept="image/*"
              className={styles.fileInput}
            />
          </div>

          <div className={styles.submitBtn}>
            <Button
              type="submit"
              variant="success"
              size="lg"
              className="w-full"
              loading={loading}
              style={{ padding: '1rem' }}
            >
              DAFTAR SEKARANG
            </Button>
          </div>
        </form>

        <div className={styles.footer}>
          Sudah punya akun? <Link href="/login">Login di sini</Link>
        </div>
      </div>
    </div>
  );
}
