import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function GET(request) {
  try {
    const supabase = await createServiceClient()

    // Ambil semua anggota aktif
    const { data: members } = await supabase
      .from('members')
      .select('id, full_name, kelas, nis_nisn, jabatan')
      .eq('status', 'aktif')
      .order('full_name', { ascending: true })

    if (!members) {
      return NextResponse.json({ error: 'Data anggota tidak ditemukan' }, { status: 404 })
    }

    // Ambil seluruh data absensi
    const { data: attendances } = await supabase
      .from('attendance')
      .select('member_id, final_status')

    // Hitung rekap per anggota
    const memberStats = {}
    members.forEach(m => {
      memberStats[m.id] = { hadir: 0, izin: 0, sakit: 0, alfa: 0, total_kegiatan: 0 }
    })

    if (attendances) {
      attendances.forEach(att => {
        if (memberStats[att.member_id] && ['hadir', 'izin', 'sakit', 'alfa'].includes(att.final_status)) {
          memberStats[att.member_id][att.final_status]++
          memberStats[att.member_id].total_kegiatan++
        }
      })
    }

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Rekap Global')

    // Header
    sheet.mergeCells('A1:I1')
    sheet.getCell('A1').value = 'JURNFOURTEEN'
    sheet.getCell('A1').font = { bold: true, size: 16 }
    sheet.getCell('A1').alignment = { horizontal: 'center' }

    sheet.mergeCells('A2:I2')
    sheet.getCell('A2').value = 'REKAPITULASI KEHADIRAN KESELURUHAN (GLOBAL)'
    sheet.getCell('A2').font = { bold: true, size: 12 }
    sheet.getCell('A2').alignment = { horizontal: 'center' }

    sheet.mergeCells('A3:I3')
    sheet.getCell('A3').value = `Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')}`
    sheet.getCell('A3').alignment = { horizontal: 'center' }

    // Table Headers
    const headers = ['No', 'Nama Lengkap', 'Kelas', 'Jabatan', 'Total Kegiatan', 'Hadir', 'Izin', 'Sakit', 'Alfa']
    sheet.addRow([]) // empty row
    const headerRow = sheet.addRow(headers)
    
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEAEAEA' }
      }
      cell.font = { bold: true }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
      cell.alignment = { horizontal: 'center' }
    })

    // Data Rows
    members.forEach((m, idx) => {
      const s = memberStats[m.id]
      const row = sheet.addRow([
        idx + 1,
        m.full_name,
        m.kelas || '-',
        m.jabatan || '-',
        s.total_kegiatan,
        s.hadir,
        s.izin,
        s.sakit,
        s.alfa
      ])

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
        if (cell.col !== 2 && cell.col !== 4) {
          cell.alignment = { horizontal: 'center' }
        }
      })
    })

    // Adjust column widths
    sheet.columns = [
      { width: 5 },   // No
      { width: 35 },  // Nama
      { width: 15 },  // Kelas
      { width: 20 },  // Jabatan
      { width: 15 },  // Total
      { width: 10 },  // Hadir
      { width: 10 },  // Izin
      { width: 10 },  // Sakit
      { width: 10 },  // Alfa
    ]

    const buffer = await workbook.xlsx.writeBuffer()
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Rekap_Global_Kehadiran.xlsx"'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
