'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner, Card, Button, Badge } from '@/components/ui';
import { 
  Users, Check, FileText, Heart, X, UserPlus, Clock, Calendar, 
  Plus, Radio as RadioIcon, ClipboardCheck, ArrowRight, UserCheck
} from 'lucide-react';
import Link from 'next/link';
import LandingStatsEditor from '@/components/LandingStatsEditor';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const { member, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [activeActivity, setActiveActivity] = useState(null);
  const [recentBroadcasts, setRecentBroadcasts] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    if (authLoading || !member) return;
    
    async function loadData() {
      try {
        setLoading(true);
        const role = member?.role || 'anggota';
        const isAdmin = ['super_admin', 'admin', 'sekretaris'].includes(role);

        // Fetch active activity
        const { data: activity } = await supabase
          .from('activities')
          .select('*')
          .eq('status', 'aktif')
          .limit(1)
          .maybeSingle();
        
        setActiveActivity(activity || null);

        // Fetch recent broadcasts
        const { data: broadcasts } = await supabase
          .from('broadcasts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);
        
        setRecentBroadcasts(broadcasts || []);

        if (isAdmin) {
          const { count: totalMembers } = await supabase.from('members').select('*', { count: 'exact', head: true });
          const { count: pendingMembers } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'menunggu_verifikasi');
          
          setStats({
            totalMembers: totalMembers || 0,
            pendingMembers: pendingMembers || 0,
            hadir: 0,
            izin: 0,
            sakit: 0,
            alfa: 0,
            pendaftarBaru: pendingMembers || 0,
            kegiatanAktif: activity ? 1 : 0
          });
        } else {
          const { data: myAttendance } = await supabase
            .from('attendance')
            .select('final_status')
            .eq('member_id', member.id);
            
          let hadir = 0, izin = 0, sakit = 0, alfa = 0;
          if (myAttendance) {
            myAttendance.forEach(a => {
              if (a.final_status === 'hadir') hadir++;
              if (a.final_status === 'izin') izin++;
              if (a.final_status === 'sakit') sakit++;
              if (a.final_status === 'alfa') alfa++;
            });
          }
          const total = hadir + izin + sakit + alfa;
          const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;

          setStats({ hadir, izin, sakit, alfa, persentase });
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [member, authLoading]);

  if (authLoading) return <LoadingSpinner fullPage size="lg" />;
  if (!member) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat profil...</div>;
  if (loading) return <LoadingSpinner fullPage size="lg" />;

  const isAdmin = ['super_admin', 'admin', 'sekretaris', 'pembina'].includes(member?.role);

  return (
    <div className={styles.container}>
      {!isAdmin ? (
        <h2 className={styles.welcomeTitle}>Halo, {member?.full_name} 👋</h2>
      ) : (
        <h2 className={styles.welcomeTitle}>Dashboard Admin</h2>
      )}

      {isAdmin ? (
        <>
          <div className={styles.statsGrid}>
            <Card className="stat-card">
              <div className={styles.statIcon}><Users size={24} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Total Anggota</span>
                <span className="stat-value">{stats?.totalMembers || 0}</span>
              </div>
            </Card>
            <Card className="stat-card">
              <div className={styles.statIcon}><Check size={24} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Hadir Hari Ini</span>
                <span className="stat-value">{stats?.hadir || 0}</span>
              </div>
            </Card>
            <Card className="stat-card">
              <div className={styles.statIcon}><FileText size={24} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Izin Hari Ini</span>
                <span className="stat-value">{stats?.izin || 0}</span>
              </div>
            </Card>
            <Card className="stat-card">
              <div className={styles.statIcon}><Heart size={24} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Sakit Hari Ini</span>
                <span className="stat-value">{stats?.sakit || 0}</span>
              </div>
            </Card>
            <Card className="stat-card">
              <div className={styles.statIcon}><X size={24} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Alfa Hari Ini</span>
                <span className="stat-value">{stats?.alfa || 0}</span>
              </div>
            </Card>
            <Card className="stat-card">
              <div className={styles.statIcon}><UserPlus size={24} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Pendaftar Baru</span>
                <span className="stat-value">{stats?.pendaftarBaru || 0}</span>
              </div>
            </Card>
            <Card className="stat-card">
              <div className={styles.statIcon}><Clock size={24} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Pengajuan Menunggu</span>
                <span className="stat-value">{stats?.pendingMembers || 0}</span>
              </div>
            </Card>
            <Card className="stat-card">
              <div className={styles.statIcon}><Calendar size={24} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Kegiatan Aktif</span>
                <span className="stat-value">{stats?.kegiatanAktif || 0}</span>
              </div>
            </Card>
          </div>

          <div className={styles.actionsGrid}>
            <Link href="/activities">
              <Button className={styles.actionBtn}><Plus size={20} /> Buat Kegiatan</Button>
            </Link>
            <Link href="/broadcasts">
              <Button variant="secondary" className={styles.actionBtn}><RadioIcon size={20} /> Buat Broadcast</Button>
            </Link>
            <Link href="/attendance/verification">
              <Button variant="outline" className={styles.actionBtn}><ClipboardCheck size={20} /> Lihat Verifikasi</Button>
            </Link>
            <Link href="/members/verification">
              <Button variant="outline" className={styles.actionBtn}><UserCheck size={20} /> Verifikasi Anggota</Button>
            </Link>
          </div>
        </>
      ) : (
        <div className={styles.statsGrid}>
          <Card className="stat-card">
            <div className={styles.statIcon}><Check size={24} /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Hadir</span>
              <span className="stat-value">{stats?.hadir || 0}</span>
            </div>
          </Card>
          <Card className="stat-card">
            <div className={styles.statIcon}><FileText size={24} /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Izin</span>
              <span className="stat-value">{stats?.izin || 0}</span>
            </div>
          </Card>
          <Card className="stat-card">
            <div className={styles.statIcon}><Heart size={24} /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Sakit</span>
              <span className="stat-value">{stats?.sakit || 0}</span>
            </div>
          </Card>
          <Card className="stat-card">
            <div className={styles.statIcon}><X size={24} /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Alfa</span>
              <span className="stat-value">{stats?.alfa || 0}</span>
            </div>
          </Card>
          <Card className="stat-card" style={{ gridColumn: 'span 2' }}>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Persentase Kehadiran</span>
              <span className="stat-value">{stats?.persentase || 0}%</span>
            </div>
          </Card>
        </div>
      )}

      <div className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <Card className={styles.activityCard}>
            <h3 className={styles.sectionTitle}>Kegiatan Aktif</h3>
            {activeActivity ? (
              <div className={styles.activityContent}>
                <h4 className={styles.activityName}>{activeActivity.name}</h4>
                <p className={styles.activityDesc}>{activeActivity.description}</p>
                <div className={styles.activityMeta}>
                  <Badge variant="aktif">AKTIF</Badge>
                  <span>Mulai: {new Date(activeActivity.start_time).toLocaleString('id-ID')}</span>
                </div>
                {!isAdmin && (
                  <div style={{ marginTop: '1rem' }}>
                    <Link href="/activities">
                      <Button variant="primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                        Buka Halaman Kegiatan untuk Merespons <ArrowRight size={16} />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Calendar size={48} className={styles.emptyIcon} />
                <p>Tidak ada kegiatan aktif saat ini.</p>
              </div>
            )}
          </Card>
        </div>
        
        <div className={styles.sideColumn}>
          <Card className={styles.broadcastCard}>
            <div className={styles.broadcastHeader}>
              <h3 className={styles.sectionTitle}>Pengumuman Terbaru</h3>
              <Link href="/broadcasts" className={styles.viewAll}>
                Semua <ArrowRight size={16} />
              </Link>
            </div>
            <div className={styles.broadcastList}>
              {recentBroadcasts.length > 0 ? (
                recentBroadcasts.map(b => (
                  <div key={b.id} className={styles.broadcastItem}>
                    <h4>{b.title}</h4>
                    <p>{b.message}</p>
                    <span className={styles.time}>{new Date(b.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                ))
              ) : (
                <p className={styles.emptyText}>Tidak ada pengumuman.</p>
              )}
            </div>
          </Card>
          
          {['super_admin', 'admin', 'pembina'].includes(member?.role) && (
            <LandingStatsEditor />
          )}
        </div>
      </div>
    </div>
  );
}
