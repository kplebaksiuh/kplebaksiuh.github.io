import { useState, useEffect } from 'react'
import { Users, LogOut, CheckCircle2, XCircle, ChevronDown, Download, KeyRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { formatRupiah, BULAN_IURAN, ROLE_LABEL, ROLE_COLOR } from '../lib/format'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import GantiPasswordModal from '../components/modals/GantiPasswordModal'
import { logAktivitas } from '../lib/logger'

export default function AnggotaPage() {
  const { profile, signOut } = useAuth()
  const [tahunList, setTahunList] = useState([])
  const [tahunAktif, setTahunAktif] = useState(null)
  const [pembayaran, setPembayaran] = useState([])
  const [loading, setLoading] = useState(true)
  const [showGantiPassword, setShowGantiPassword] = useState(false)

  useEffect(() => {
    supabase.from('tahun_iuran').select('*').order('tahun_mulai', { ascending: false })
      .then(({ data }) => {
        setTahunList(data || [])
        if (data?.length) setTahunAktif(data[0])
      })
  }, [])

  useEffect(() => {
    if (!tahunAktif || !profile?.pengguna_id) { setLoading(false); return }
    setLoading(true)
    supabase.from('pembayaran')
      .select('bulan, nominal, tanggal_bayar')
      .eq('pengguna_id', profile.pengguna_id)
      .eq('tahun_iuran_id', tahunAktif.id)
      .then(({ data }) => {
        setPembayaran(data || [])
        setLoading(false)
      })
  }, [tahunAktif, profile?.pengguna_id])

  const mapBulan = {}
  pembayaran.forEach(p => { mapBulan[p.bulan] = p })

  const totalBayar = pembayaran.reduce((a, b) => a + b.nominal, 0)
  const lunasCount = pembayaran.length
  const belumCount = 12 - lunasCount
  const nama = profile?.pengguna?.nama || profile?.nama || ''

  function downloadKartu() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })
    const W = doc.internal.pageSize.getWidth()

    doc.setFillColor(22, 163, 74)
    doc.roundedRect(0, 0, W, 38, 0, 0, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('KARTU IURAN WARGA', W / 2, 12, { align: 'center' })

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Periode: Oktober ${tahunAktif.tahun_mulai} – September ${tahunAktif.tahun_selesai}`, W / 2, 19, { align: 'center' })

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(nama, W / 2, 30, { align: 'center' })

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, W / 2, 36, { align: 'center' })

    const rows = BULAN_IURAN.map(({ bulan, nama: namaBulan }) => {
      const bayar = mapBulan[bulan]
      return [
        namaBulan,
        bayar ? 'LUNAS' : 'Belum bayar',
        bayar ? formatRupiah(bayar.nominal) : '-',
        bayar?.tanggal_bayar
          ? new Date(bayar.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
          : '',
      ]
    })

    autoTable(doc, {
      head: [['Bulan', 'Status', 'Nominal', 'Tgl Bayar']],
      body: rows,
      startY: 42,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 28, halign: 'center' },
        2: { cellWidth: 32, halign: 'right' },
        3: { cellWidth: 30, halign: 'center' },
      },
      didParseCell(data) {
        if (data.column.index === 1 && data.section === 'body') {
          if (data.cell.raw === 'LUNAS') {
            data.cell.styles.textColor = [22, 163, 74]
            data.cell.styles.fontStyle = 'bold'
          } else {
            data.cell.styles.textColor = [156, 163, 175]
          }
        }
      },
      alternateRowStyles: { fillColor: [240, 253, 244] },
    })

    const finalY = doc.lastAutoTable.finalY + 5
    doc.setFillColor(240, 253, 244)
    doc.roundedRect(10, finalY, W - 20, 22, 2, 2, 'F')
    doc.setDrawColor(22, 163, 74)
    doc.setLineWidth(0.3)
    doc.roundedRect(10, finalY, W - 20, 22, 2, 2, 'S')

    doc.setTextColor(55, 65, 81)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Bulan Lunas', 16, finalY + 7)
    doc.text('Belum Bayar', 16, finalY + 14)
    doc.text('Total Dibayar', 16, finalY + 20)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(22, 163, 74)
    doc.text(`${lunasCount} bulan`, W - 16, finalY + 7, { align: 'right' })
    doc.setTextColor(239, 68, 68)
    doc.text(`${belumCount} bulan`, W - 16, finalY + 14, { align: 'right' })
    doc.setTextColor(22, 163, 74)
    doc.setFontSize(9)
    doc.text(formatRupiah(totalBayar), W - 16, finalY + 20, { align: 'right' })

    doc.save(`kartu-iuran-${nama.toLowerCase().replace(/\s+/g, '-')}-${tahunAktif.tahun_mulai}.pdf`)
    logAktivitas('Mengunduh kartu iuran warga', `Tahun ${tahunAktif.tahun_mulai}–${tahunAktif.tahun_selesai}`)
  }

  if (!profile?.pengguna_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-green-600" />
              <span className="font-bold text-gray-800">Iuran Warga</span>
            </div>
            <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600">
              <LogOut size={15} /> Keluar
            </button>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <XCircle size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Akun Anda belum dihubungkan ke data anggota warga.</p>
            <p className="text-sm text-gray-400 mt-1">Hubungi admin untuk menghubungkan akun.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-green-600" />
            <span className="font-bold text-gray-800">Iuran Warga</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLOR[profile?.role]}`}>
              {ROLE_LABEL[profile?.role]}
            </span>
            <button onClick={() => setShowGantiPassword(true)}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Ganti Password">
              <KeyRound size={16} />
            </button>
            <button onClick={signOut} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-3 py-4 space-y-3">
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-4 text-white shadow-md">
          <p className="text-green-200 text-xs">Halo,</p>
          <h1 className="text-xl font-bold mt-0.5 leading-tight">{nama}</h1>

          <div className="flex items-center gap-2 mt-3">
            <div className="relative flex-1 min-w-0">
              <select
                value={tahunAktif?.id || ''}
                onChange={e => setTahunAktif(tahunList.find(t => t.id === e.target.value))}
                className="w-full appearance-none bg-white/20 border border-white/30 text-white text-sm font-medium px-3 py-2 pr-7 rounded-xl focus:outline-none truncate"
              >
                {tahunList.map(t => (
                  <option key={t.id} value={t.id} className="text-gray-800 bg-white">
                    {t.tahun_mulai} – {t.tahun_selesai}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" />
            </div>
            <button
              onClick={downloadKartu}
              className="flex items-center gap-1.5 bg-white text-green-600 hover:bg-green-50 text-sm font-semibold px-3 py-2 rounded-xl transition-colors whitespace-nowrap shadow-sm"
            >
              <Download size={14} />
              Kartu
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm text-center col-span-1">
            <p className="text-base font-bold text-green-600 leading-tight">{formatRupiah(totalBayar)}</p>
            <p className="text-xs text-gray-400 mt-1">Total Dibayar</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-500">{lunasCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">Lunas</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-red-500">{belumCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">Belum</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Status Pembayaran</p>
            <p className="text-xs text-gray-400">
              Okt {tahunAktif?.tahun_mulai} – Sep {tahunAktif?.tahun_selesai}
            </p>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Memuat data...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {BULAN_IURAN.map(({ bulan, nama: namaBulan }) => {
                const bayar = mapBulan[bulan]
                return (
                  <div
                    key={bulan}
                    className={`flex items-center justify-between px-4 py-3.5 ${bayar ? 'bg-green-50/40' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {bayar
                        ? <CheckCircle2 size={20} className="text-green-500 flex-none" />
                        : <XCircle size={20} className="text-gray-200 flex-none" />
                      }
                      <span className={`text-sm font-medium ${bayar ? 'text-gray-800' : 'text-gray-400'}`}>
                        {namaBulan}
                      </span>
                    </div>
                    <div className="text-right">
                      {bayar ? (
                        <>
                          <p className="text-sm font-semibold text-green-600">{formatRupiah(bayar.nominal)}</p>
                          {bayar.tanggal_bayar && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(bayar.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Belum bayar</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-300 pb-2">Iuran Warga &copy; {new Date().getFullYear()}</p>
      </main>

      {showGantiPassword && (
        <GantiPasswordModal onClose={() => setShowGantiPassword(false)} />
      )}
    </div>
  )
}
