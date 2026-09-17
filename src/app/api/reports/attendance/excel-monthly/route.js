import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function GET(request) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    const month = searchParams.get('month') || (new Date().getMonth() + 1).toString()

    // Get all activities in this month/year
    const startDate = `${year}-${month.padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0] // Last day of month

    const { data: activities } = await supabase
      .from('activities')
      .select('id, name, activity_date')
      .gte('activity_date', startDate)
      .lte('activity_date', endDate)
      .order('activity_date', { ascending: true })

    if (!activities || activities.length === 0) {
      return NextResponse.json({ error: 'Tidak ada kegiatan di bulan tersebut' }, { status: 404 })
    }

    // Get all active members
    const { data: members } = await supabase
      .from('members')
      .select('id, full_name, kelas')
      .eq('status', 'aktif')
      .order('full_name', { ascending: true })

    // Get attendance for these activities
    const activityIds = activities.map(a => a.id)
    const { data: attendances } = await supabase
      .from('attendance')
      .select('member_id, activity_id, final_status')
      .in('activity_id', activityIds)

    // Build map for easy lookup
    // attMap[member_id][activity_id] = final_status
    const attMap = {}
    members.forEach(m => {
      attMap[m.id] = { hadir: 0, izin: 0, sakit: 0, alfa: 0 }
    })

    if (attendances) {
      attendances.forEach(att => {
        if (attMap[att.member_id]) {
          attMap[att.member_id][att.activity_id] = att.final_status
          if (['hadir', 'izin', 'sakit', 'alfa'].includes(att.final_status)) {
            attMap[att.member_id][att.final_status]++
          }
        }
      })
    }

    const workbook = new ExcelJS.Workbook()
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    const monthName = monthNames[parseInt(month) - 1]
    const sheet = workbook.addWorksheet(`Rekap ${monthName}`)

    // Header
    const lastColIndex = 4 + activities.length + 3 // No, Nama, Kelas, (Activities), H, I, S, A
    sheet.mergeCells(1, 1, 1, lastColIndex)
    sheet.getCell('A1').value = 'JURNFOURTEEN - EKSTRAKURIKULER JURNALISTIK'
    sheet.getCell('A1').font = { bold: true, size: 14 }
    sheet.getCell('A1').alignment = { horizontal: 'center' }

    sheet.mergeCells(2, 1, 2, lastColIndex)
    sheet.getCell('A2').value = `REKAPITULASI KEHADIRAN BULAN ${monthName.toUpperCase()} ${year}`
    sheet.getCell('A2').font = { bold: true, size: 12 }
    sheet.getCell('A2').alignment = { horizontal: 'center' }

    // Table Headers
    const headers = ['No', 'Nama Lengkap', 'Kelas']
    activities.forEach(act => {
      const dateStr = new Date(act.activity_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      headers.push(dateStr)
    })
    headers.push('Hadir', 'Izin', 'Sakit', 'Alfa')

    sheet.addRow([]) // empty row
    const headerRow = sheet.addRow(headers)
    
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } }
      cell.font = { bold: true }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      cell.alignment = { horizontal: 'center' }
    })

    // Status map to display strings
    const statusLabel = { hadir: 'H', izin: 'I', sakit: 'S', alfa: 'A' }

    // Data Rows
    members.forEach((m, idx) => {
      const s = attMap[m.id]
      const rowData = [idx + 1, m.full_name, m.kelas || '-']
      
      activities.forEach(act => {
        const fs = s[act.id]
        rowData.push(fs ? statusLabel[fs] : '-')
      })

      rowData.push(s.hadir, s.izin, s.sakit, s.alfa)
      
      const row = sheet.addRow(rowData)

      row.eachCell((cell, colNumber) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        if (colNumber !== 2) {
          cell.alignment = { horizontal: 'center' }
        }
      })
    })

    // Adjust column widths
    const cols = [
      { width: 5 },   // No
      { width: 30 },  // Nama
      { width: 15 },  // Kelas
    ]
    activities.forEach(() => cols.push({ width: 10 }))
    cols.push({ width: 8 }, { width: 8 }, { width: 8 }, { width: 8 })
    sheet.columns = cols

    const buffer = await workbook.xlsx.writeBuffer()
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Rekap_Bulanan_${monthName}_${year}.xlsx"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
