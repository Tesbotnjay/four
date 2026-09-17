'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { usernameToEmail } from '@/lib/constants';
import styles from './login.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();
  const supabase = createClient();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      addToast('Username dan password harus diisi', 'error');
      return;
    }

    setLoading(true);
    try {
      const email = usernameToEmail(username);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      addToast('Login berhasil!', 'success');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      addToast(error.message || 'Gagal login. Periksa username dan password Anda.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.decorCircle}></div>
      <div className={styles.decorSquare}></div>
      
      <div className={styles.loginCard}>
        <div className={styles.logoSection} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Image src="/logo.png" alt="Logo" width={80} height={80} style={{ objectFit: 'contain', marginBottom: '0.5rem' }} />
          <h1 className={styles.logoText}>JURNFOURTEEN</h1>
          <div className={styles.subtitle}>MEMBER LOGIN</div>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <Input
            id="username"
            label="Username"
            placeholder="Masukkan username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <div className={styles.submitBtn}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
            >
              MASUK
            </Button>
          </div>
        </form>

        <div className={styles.footer}>
          Belum punya akun? <Link href="/register">Daftar</Link>
        </div>
      </div>
    </div>
  );
}
