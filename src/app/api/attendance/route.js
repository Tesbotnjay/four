import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('activity_id')

    if (!activityId) {
      return NextResponse.json({ error: 'activity_id required' }, { status: 400 })
    }

    // Get all active members
    const { data: allMembers } = await supabase
      .from('members')
      .select('id, full_name, kelas, username, role')
      .eq('status', 'aktif')
      .order('full_name')

    // Get attendance records for this activity
    const { data: attendances } = await supabase
      .from('attendance')
      .select('*, member:member_id(id, full_name, kelas, username)')
      .eq('activity_id', activityId)
      .order('submitted_at', { ascending: true })

    // Build a map of who submitted
    const attendanceMap = {}
    attendances?.forEach(a => {
      attendanceMap[a.member_id] = a
    })

    // Build combined data: members who responded + members who haven't
    const combined = []

    // First: members who have responded
    attendances?.forEach(a => {
      combined.push({
        id: a.id,
        member_id: a.member_id,
        members: a.member || { full_name: 'Unknown', kelas: '-' },
        type: a.response, // original response (hadir/izin/sakit)
        status: a.final_status === 'pending' ? 'menunggu' : a.final_status,
        verification_notes: a.note,
        submitted_at: a.submitted_at,
        created_at: a.submitted_at || a.created_at,
      })
    })

    // Then: members who haven't responded
    allMembers?.forEach(m => {
      if (!attendanceMap[m.id] && m.role === 'anggota') {
        combined.push({
          id: null,
          member_id: m.id,
          members: { full_name: m.full_name, kelas: m.kelas },
          type: null,
          status: 'belum',
          created_at: null,
        })
      }
    })

    // Stats
    const totalAnggota = allMembers?.filter(m => m.role === 'anggota').length || 0
    const stats = {
      total: totalAnggota,
      sudah: attendances?.length || 0,
      belum: totalAnggota - (attendances?.length || 0),
      menunggu: 0, hadir: 0, izin: 0, sakit: 0, alfa: 0, ditolak: 0,
    }

    attendances?.forEach(a => {
      const fs = a.final_status
      if (fs === 'pending') stats.menunggu++
      else if (fs === 'hadir') stats.hadir++
      else if (fs === 'izin') stats.izin++
      else if (fs === 'sakit') stats.sakit++
      else if (fs === 'alfa') stats.alfa++
      else if (fs === 'ditolak' || fs === 'rejected') stats.ditolak++
    })

    return NextResponse.json({ data: combined, stats })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
