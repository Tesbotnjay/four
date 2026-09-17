// Constants for the JurnFourteen system

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PEMBINA: 'pembina',
  SEKRETARIS: 'sekretaris',
  ANGGOTA: 'anggota',
}

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.PEMBINA]: 'Pembina',
  [ROLES.SEKRETARIS]: 'Sekretaris',
  [ROLES.ANGGOTA]: 'Anggota',
}

export const JABATAN_OPTIONS = [
  'Pembina',
  'Ketua Umum',
  'Wakil Ketua',
  'Sekretaris',
  'Bendahara',
  'Koordinator Liputan',
  'Koordinator Desain/Multimedia',
  'Anggota',
]

// Default role mapping based on jabatan
export const JABATAN_ROLE_MAP = {
  'Pembina': ROLES.PEMBINA,
  'Ketua Umum': ROLES.ADMIN,
  'Wakil Ketua': ROLES.ADMIN,
  'Sekretaris': ROLES.SEKRETARIS,
  'Bendahara': ROLES.ANGGOTA,
  'Koordinator Liputan': ROLES.ANGGOTA,
  'Koordinator Desain/Multimedia': ROLES.ANGGOTA,
  'Anggota': ROLES.ANGGOTA,
}

export const MEMBER_STATUS = {
  AKTIF: 'aktif',
  NONAKTIF: 'nonaktif',
  MENUNGGU: 'menunggu_verifikasi',
}

export const MEMBER_STATUS_LABELS = {
  [MEMBER_STATUS.AKTIF]: 'Aktif',
  [MEMBER_STATUS.NONAKTIF]: 'Nonaktif',
  [MEMBER_STATUS.MENUNGGU]: 'Menunggu Verifikasi',
}

export const ATTENDANCE_RESPONSE = {
  HADIR: 'hadir',
  IZIN: 'izin',
  SAKIT: 'sakit',
}

export const ATTENDANCE_STATUS = {
  PENDING: 'pending',
  HADIR: 'hadir',
  IZIN: 'izin',
  SAKIT: 'sakit',
  ALFA: 'alfa',
  REJECTED: 'rejected',
}

export const ATTENDANCE_STATUS_LABELS = {
  [ATTENDANCE_STATUS.PENDING]: 'Menunggu Verifikasi',
  [ATTENDANCE_STATUS.HADIR]: 'Hadir',
  [ATTENDANCE_STATUS.IZIN]: 'Izin',
  [ATTENDANCE_STATUS.SAKIT]: 'Sakit',
  [ATTENDANCE_STATUS.ALFA]: 'Alfa',
  [ATTENDANCE_STATUS.REJECTED]: 'Ditolak',
}

export const LEAVE_TYPE = {
  IZIN: 'izin',
  SAKIT: 'sakit',
}

export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

export const LEAVE_STATUS_LABELS = {
  [LEAVE_STATUS.PENDING]: 'Menunggu Verifikasi',
  [LEAVE_STATUS.APPROVED]: 'Disetujui',
  [LEAVE_STATUS.REJECTED]: 'Ditolak',
}

export const ACTIVITY_STATUS = {
  UPCOMING: 'akan_datang',
  ACTIVE: 'aktif',
  COMPLETED: 'selesai',
  CANCELLED: 'dibatalkan',
}

export const ACTIVITY_STATUS_LABELS = {
  [ACTIVITY_STATUS.UPCOMING]: 'Akan Datang',
  [ACTIVITY_STATUS.ACTIVE]: 'Aktif',
  [ACTIVITY_STATUS.COMPLETED]: 'Selesai',
  [ACTIVITY_STATUS.CANCELLED]: 'Dibatalkan',
}

export const BROADCAST_VISIBILITY = {
  INTERNAL: 'internal',
  PUBLIC: 'publik',
}

export const BROADCAST_PRIORITY = {
  NORMAL: 'normal',
  PENTING: 'penting',
  URGENT: 'urgent',
}

export const BROADCAST_TARGET = {
  ALL: 'semua',
  CLASS: 'kelas',
  PENGURUS: 'pengurus',
  SPECIFIC: 'tertentu',
}

export const KELAS_OPTIONS = [
  '10-1', '10-2', '10-3', '10-4', '10-5',
  '11-1', '11-2', '11-3', '11-4', '11-5',
  '12-1', '12-2', '12-3', '12-4', '12-5',
]

// Email domain used for username-based auth
export const AUTH_EMAIL_DOMAIN = 'jurnfourteen.app'

// Helper to convert username to email for Supabase Auth
export function usernameToEmail(username) {
  return `${username.toLowerCase().trim()}@${AUTH_EMAIL_DOMAIN}`
}

// Helper to extract username from email
export function emailToUsername(email) {
  if (!email) return ''
  return email.split('@')[0]
}

// Timezone
export const TIMEZONE = 'Asia/Makassar'
export const TIMEZONE_LABEL = 'WITA'

// File upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
export const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

// Role permission checks
export function canManageMembers(role) {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role)
}

export function canVerifyAttendance(role) {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SEKRETARIS].includes(role)
}

export function canCreateBroadcast(role) {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role)
}

export function canCreateActivity(role) {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SEKRETARIS].includes(role)
}

export function canExportData(role) {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PEMBINA, ROLES.SEKRETARIS].includes(role)
}

export function canViewAllMembers(role) {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PEMBINA, ROLES.SEKRETARIS].includes(role)
}

export function canAccessSettings(role) {
  return [ROLES.SUPER_ADMIN].includes(role)
}

export function canViewLogs(role) {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PEMBINA].includes(role)
}
