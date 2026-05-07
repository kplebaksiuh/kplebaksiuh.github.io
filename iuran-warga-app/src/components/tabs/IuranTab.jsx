import { useState, useEffect } from 'react'
import { Search, CreditCard, ChevronDown, FileDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { BULAN_IURAN, formatRupiah } from '../../lib/format'
import BayarModal from '../modals/BayarModal'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { logAktivitas } from '../../lib/logger'

function getBulanSudahBerjalan(tahunAktif) {
  if (!tahunAktif) return []
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1

  return BULAN_IURAN.filter(({ bulan }) => {
    const tahunBulan = bulan >= 10 ? tahunAktif.tahun_mulai : tahunAktif.tahun_selesai
    return tahunBulan < currentYear || (tahunBulan === currentYear && bulan <= currentMonth)
  })
}

export default function IuranTab() {
  const [pengguna, setPengguna] = useState([])
  const [tahunList, setTahunList] = useState([])
  const [tahunAktif, setTahunAktif] = useState(null)
  const [pembayaran, setPembayaran] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)

  useEffect(() => {
    async function init() {
      const [{ data: tahun }, { data: users }] = await Promise.all([
        supabase.from('tahun_iuran').select('*').order('tahun_mulai', { ascending: false }),
        supabase.from('pengguna').select('*').eq('is_active', true).order('nomor_urut'),
      ])
      setTahunList(tahun || [])
      setPengguna(users || [])
      if (tahun?.length) setTahunAktif(tahun[0])
    }
    init()
  }, [])

  useEffect(() => {
    if (!tahunAktif) return
    fetchPembayaran()
  }, [tahunAktif])

  async function fetchPembayaran() {
    setLoading(true)
    const { data } = await supabase
      .from('pembayaran')
      .select('pengguna_id, bulan, nominal')
      .eq('tahun_iuran_id', tahunAktif.id)
    setPembayaran(data || [])
    setLoading(false)
  }

  function getPembayaranMap() {
    const map = {}
    pembayaran.forEach(p => {
      if (!map[p.pengguna_id]) map[p.pengguna_id] = {}
      map[p.pengguna_id][p.bulan] = p.nominal
    })
    return map
  }

  const map = getPembayaranMap()
  const bulanBerjalan = getBulanSudahBerjalan(tahunAktif)
  const jumlahBulanBerjalan = bulanBerjalan.length

  const filtered = pengguna.filter(p =>
    p.nama.toLowerCase().includes(search.toLowerCase()) ||
    String(p.nomor_urut).includes(search)
  )

  const totalPerPengguna = (penggunaId) => Object.values(map[penggunaId] || {}).reduce((a, b) => a + b, 0)
  const bulanLunasCount = (penggunaId) => Object.keys(map[penggunaId] || {}).length

  const totalTerkumpul = pembayaran.reduce((a, b) => a + b.nominal, 0)

  const totalBelumLunas = pengguna.filter(p => {
    const lunasSet = new Set(Object.keys(map[p.id] || {}).map(Number))
    return bulanBerjalan.some(({ bulan }) => !lunasSet.has(bulan))
  }).length

  const labelTahun = tahunAktif
    ? `${tahunAktif.tahun_mulai}-${tahunAktif.tahun_selesai}`
    : ''

  const namaBulanTerakhir = bulanBerjalan.length > 0
    ? BULAN_IURAN.find(b => b.bulan === bulanBerjalan[bulanBerjalan.length - 1].bulan)?.nama
    : ''

  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape' })
    const title = `Rekap Iuran Warga - Tahun ${labelTahun}`
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 14, 15)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 22)

    const head = [['No', 'Nama', ...BULAN_IURAN.map(b => b.nama.slice(0, 3)), 'Total', 'Bulan']]
    const body = pengguna.map(p => {
      const bulanData = BULAN_IURAN.map(({ bulan }) => map[p.id]?.[bulan] ? formatRupiah(map[p.id][bulan]) : '-')
      const total = Object.values(map[p.id] || {}).reduce((a, b) => a + b, 0)
      const lunas = Object.keys(map[p.id] || {}).length
      return [p.nomor_urut, p.nama, ...bulanData, formatRupiah(total), `${lunas}/12`]
    })

    autoTable(doc, {
      head,
      body,
      startY: 27,
      styles: { fontSize: 6, cellPadding: 1.5 },
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 28 } },
      alternateRowStyles: { fillColor: [240, 253, 244] },
    })

    doc.save(`rekap-iuran-warga-${labelTahun}.pdf`)
    logAktivitas('Mengekspor PDF rekap iuran warga', `Tahun ${labelTahun}`)
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Terkumpul</p>
          <p className="text-lg font-bold text-green-600">{formatRupiah(totalTerkumpul)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Tahun {labelTahun}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Anggota Aktif</p>
          <p className="text-lg font-bold text-gray-800">{pengguna.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">terdaftar</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 mb-1">Belum Lunas</p>
          <p className="text-lg font-bold text-red-500">{totalBelumLunas}</p>
          <p className="text-xs text-gray-400 mt-0.5">s.d. {namaBulanTerakhir} ({jumlahBulanBerjalan} bln berjalan)</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-800">Rekap Iuran</h2>
          <div className="relative">
            <select
              value={tahunAktif?.id || ''}
              onChange={e => setTahunAktif(tahunList.find(t => t.id === e.target.value))}
              className="appearance-none bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-3 py-1.5 pr-7 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {tahunList.map(t => (
                <option key={t.id} value={t.id}>
                  Tahun {t.tahun_mulai}-{t.tahun_selesai}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama..."
              className="w-full sm:w-56 pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button onClick={exportPDF}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
            <FileDown size={14} /> Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="sticky left-0 bg-gray-50 text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">No</th>
                <th className="sticky left-8 bg-gray-50 text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-32">Nama</th>
                {BULAN_IURAN.map(({ bulan, nama }) => (
                  <th key={bulan} className="px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center whitespace-nowrap">
                    {nama.slice(0, 3)}
                  </th>
                ))}
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right whitespace-nowrap">Total</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={16} className="text-center py-10 text-gray-400">Memuat...</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="sticky left-0 bg-white px-3 py-3 text-gray-400 font-mono text-xs">{p.nomor_urut}</td>
                  <td className="sticky left-8 bg-white px-3 py-3 font-medium text-gray-800 whitespace-nowrap">{p.nama}</td>
                  {BULAN_IURAN.map(({ bulan }) => (
                    <td key={bulan} className="px-1 py-3 text-center whitespace-nowrap">
                      {map[p.id]?.[bulan] != null ? (
                        <span className="text-green-600 font-medium text-xs">{formatRupiah(map[p.id][bulan])}</span>
                      ) : (
                        <span className="text-gray-300 text-xs">–</span>
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-right font-medium text-gray-700 whitespace-nowrap">
                    {formatRupiah(totalPerPengguna(p.id))}
                    <span className="text-xs text-gray-400 ml-1">({bulanLunasCount(p.id)}/12)</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => setModal(p)}
                      className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <CreditCard size={12} />
                      Bayar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && tahunAktif && (
        <BayarModal
          pengguna={modal}
          tahunIuran={tahunAktif}
          onClose={() => setModal(null)}
          onSaved={fetchPembayaran}
        />
      )}
    </div>
  )
}
