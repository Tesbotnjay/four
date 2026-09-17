import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export async function GET(request) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('activity_id')

    if (!activityId) {
      return NextResponse.json({ error: 'activity_id wajib diisi' }, { status: 400 })
    }

    const { data: activity } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .single()

    if (!activity) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 })
    }

    const { data: attendances } = await supabase
      .from('attendance')
      .select('*, member:member_id(full_name, nis_nisn, kelas)')
      .eq('activity_id', activityId)
      .order('member(full_name)', { ascending: true })

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

    const persentase = totalMembers > 0 ? Math.round((stats.hadir / totalMembers) * 100) : 0
    const dateFormatted = new Date(activity.activity_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

    const doc = new jsPDF()

    // Header
    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.text('JURNFOURTEEN', 105, 20, { align: 'center' })

    doc.setFontSize(11)
    doc.text('EKSTRAKURIKULER JURNALISTIK', 105, 28, { align: 'center' })

    doc.setFontSize(14)
    doc.text('REKAP KEHADIRAN KEGIATAN', 105, 40, { align: 'center' })

    // Line
    doc.setLineWidth(0.5)
    doc.line(20, 44, 190, 44)

    // Activity info
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('Nama Kegiatan:', 20, 54)
    doc.setFont(undefined, 'normal')
    doc.text(activity.name, 60, 54)

    doc.setFont(undefined, 'bold')
    doc.text('Tanggal:', 20, 60)
    doc.setFont(undefined, 'normal')
    doc.text(dateFormatted, 60, 60)

    doc.setFont(undefined, 'bold')
    doc.text('Waktu:', 20, 66)
    doc.setFont(undefined, 'normal')
    doc.text(`${activity.start_time} WITA`, 60, 66)

    doc.setFont(undefined, 'bold')
    doc.text('Tempat:', 20, 72)
    doc.setFont(undefined, 'normal')
    doc.text(activity.location || '-', 60, 72)

    // Table
    const tableData = (attendances || []).map((a, idx) => [
      idx + 1,
      a.member?.full_name || '-',
      a.member?.kelas || '-',
      (a.final_status || 'pending').toUpperCase(),
      a.note || '',
    ])

    doc.autoTable({
      startY: 80,
      head: [['No', 'Nama', 'Kelas', 'Status', 'Keterangan']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [27, 54, 93],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 50 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 25 },
        4: { cellWidth: 55 },
      },
    })

    // Summary
    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')

    doc.text(`Total Anggota: ${totalMembers || 0}`, 20, finalY)
    doc.text(`Hadir: ${stats.hadir}`, 20, finalY + 6)
    doc.text(`Izin: ${stats.izin}`, 70, finalY + 6)
    doc.text(`Sakit: ${stats.sakit}`, 110, finalY + 6)
    doc.text(`Alfa: ${stats.alfa}`, 150, finalY + 6)
    doc.text(`Persentase Kehadiran: ${persentase}%`, 20, finalY + 14)

    // Signature area
    const sigY = finalY + 30
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text('Mengetahui,', 105, sigY, { align: 'center' })

    doc.text('Ketua JurnFourteen', 55, sigY + 8, { align: 'center' })
    doc.text('Sekretaris JurnFourteen', 155, sigY + 8, { align: 'center' })

    doc.text('(________________)', 55, sigY + 30, { align: 'center' })
    doc.text('(________________)', 155, sigY + 30, { align: 'center' })

    const pdfBuffer = doc.output('arraybuffer')
    const filename = `JurnFourteen_Rekap_${activity.name.replace(/\s+/g, '_')}_${activity.activity_date}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
