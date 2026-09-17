import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function GET(request) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('activity_id')

    if (!activityId) {
      return NextResponse.json({ error: 'activity_id wajib diisi' }, { status: 400 })
    }

    // Get activity
    const { data: activity } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .single()

    if (!activity) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 })
    }

    // Get attendance with member data
    const { data: attendances } = await supabase
      .from('attendance')
      .select('*, member:member_id(full_name, nis_nisn, kelas), verifier:verified_by(full_name)')
      .eq('activity_id', activityId)
      .order('member(full_name)', { ascending: true })

    // Get all active members for counting
    const { count: totalMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aktif')

    const stats = { hadir: 0, izin: 0, sakit: 0, alfa: 0 }
    attendances?.forEach((a) => {
      if (['hadir', 'izin', 'sakit', 'alfa'].includes(a.final_status)) {
        stats[a.final_status]++
      }
    })

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Rekap Kehadiran')

    // Header
    sheet.mergeCells('A1:I1')
    sheet.getCell('A1').value = 'JURNFOURTEEN'
    sheet.getCell('A1').font = { bold: true, size: 16 }
    sheet.getCell('A1').alignment = { horizontal: 'center' }

    sheet.mergeCells('A2:I2')
    sheet.getCell('A2').value = 'EKSTRAKURIKULER JURNALISTIK'
    sheet.getCell('A2').font = { bold: true, size: 12 }
    sheet.getCell('A2').alignment = { horizontal: 'center' }

    sheet.mergeCells('A3:I3')
    sheet.getCell('A3').value = ''

    sheet.mergeCells('A4:I4')
    sheet.getCell('A4').value = 'REKAP KEHADIRAN KEGIATAN'
    sheet.getCell('A4').font = { bold: true, size: 14 }
    sheet.getCell('A4').alignment = { horizontal: 'center' }

    // Activity info
    sheet.getCell('A6').value = 'Kegiatan:'
    sheet.getCell('A6').font = { bold: true }
    sheet.getCell('B6').value = activity.name

    sheet.getCell('A7').value = 'Tanggal:'
    sheet.getCell('A7').font = { bold: true }
    sheet.getCell('B7').value = new Date(activity.activity_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

    sheet.getCell('A8').value = 'Waktu:'
    sheet.getCell('A8').font = { bold: true }
    sheet.getCell('B8').value = `${activity.start_time} WITA`

    sheet.getCell('A9').value = 'Tempat:'
    sheet.getCell('A9').font = { bold: true }
    sheet.getCell('B9').value = activity.location || '-'

    // Table header row
    const headerRow = sheet.getRow(11)
    const headers = ['No', 'Nama', 'NIS/NISN', 'Kelas', 'Status', 'Waktu Konfirmasi', 'Waktu Verifikasi', 'Verifikator', 'Catatan']
    headers.forEach((h, i) => {
      headerRow.getCell(i + 1).value = h
      headerRow.getCell(i + 1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      headerRow.getCell(i + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B365D' } }
      headerRow.getCell(i + 1).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
      headerRow.getCell(i + 1).alignment = { horizontal: 'center', vertical: 'middle' }
    })

    // Data rows
    attendances?.forEach((a, idx) => {
      const row = sheet.getRow(12 + idx)
      row.getCell(1).value = idx + 1
      row.getCell(2).value = a.member?.full_name || '-'
      row.getCell(3).value = a.member?.nis_nisn || '-'
      row.getCell(4).value = a.member?.kelas || '-'
      row.getCell(5).value = (a.final_status || 'pending').toUpperCase()
      row.getCell(6).value = a.submitted_at ? new Date(a.submitted_at).toLocaleString('id-ID', { timeZone: 'Asia/Makassar' }) : '-'
      row.getCell(7).value = a.verified_at ? new Date(a.verified_at).toLocaleString('id-ID', { timeZone: 'Asia/Makassar' }) : '-'
      row.getCell(8).value = a.verifier?.full_name || '-'
      row.getCell(9).value = a.note || ''

      for (let i = 1; i <= 9; i++) {
        row.getCell(i).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
      }
    })

    // Summary
    const summaryRow = 12 + (attendances?.length || 0) + 2
    sheet.getCell(`A${summaryRow}`).value = 'Total Anggota:'
    sheet.getCell(`A${summaryRow}`).font = { bold: true }
    sheet.getCell(`B${summaryRow}`).value = totalMembers || 0

    sheet.getCell(`A${summaryRow + 1}`).value = 'Hadir:'
    sheet.getCell(`A${summaryRow + 1}`).font = { bold: true }
    sheet.getCell(`B${summaryRow + 1}`).value = stats.hadir

    sheet.getCell(`A${summaryRow + 2}`).value = 'Izin:'
    sheet.getCell(`A${summaryRow + 2}`).font = { bold: true }
    sheet.getCell(`B${summaryRow + 2}`).value = stats.izin

    sheet.getCell(`A${summaryRow + 3}`).value = 'Sakit:'
    sheet.getCell(`A${summaryRow + 3}`).font = { bold: true }
    sheet.getCell(`B${summaryRow + 3}`).value = stats.sakit

    sheet.getCell(`A${summaryRow + 4}`).value = 'Alfa:'
    sheet.getCell(`A${summaryRow + 4}`).font = { bold: true }
    sheet.getCell(`B${summaryRow + 4}`).value = stats.alfa

    const persentase = totalMembers > 0 ? Math.round((stats.hadir / totalMembers) * 100) : 0
    sheet.getCell(`A${summaryRow + 5}`).value = 'Persentase Kehadiran:'
    sheet.getCell(`A${summaryRow + 5}`).font = { bold: true }
    sheet.getCell(`B${summaryRow + 5}`).value = `${persentase}%`

    // Column widths
    sheet.columns = [
      { width: 5 }, { width: 25 }, { width: 15 }, { width: 10 },
      { width: 12 }, { width: 22 }, { width: 22 }, { width: 20 }, { width: 25 },
    ]

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `JurnFourteen_Rekap_${activity.name.replace(/\s+/g, '_')}_${activity.activity_date}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
