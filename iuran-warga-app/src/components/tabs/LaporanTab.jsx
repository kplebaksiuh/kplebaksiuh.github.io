import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatRupiah } from '../../lib/format'

export default function LaporanTab() {
  const [tahunList, setTahunList] = useState([])
  const [iuranPerTahun, setIuranPerTahun] = useState({})
  const [totalPemasukan, setTotalPemasukan] = useState(0)
  const [totalPengeluaran, setTotalPengeluaran] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [{ data: tahun }, { data: pemasukan }, { data: pengeluaran }] = await Promise.all([
        supabase.from('tahun_iuran').select('*').order('tahun_mulai'),
        supabase.from('pemasukan').select('nominal'),
        supabase.from('pengeluaran').select('nominal'),
      ])

      setTahunList(tahun || [])
      setTotalPemasukan((pemasukan || []).reduce((a, b) => a + b.nominal, 0))
      setTotalPengeluaran((pengeluaran || []).reduce((a, b) => a + b.nominal, 0))

      const map = {}
      if (tahun?.length) {
        const results = await Promise.all(
          tahun.map(t =>
            supabase.from('pembayaran').select('nominal').eq('tahun_iuran_id', t.id)
              .then(({ data }) => ({ id: t.id, total: (data || []).reduce((a, b) => a + b.nominal, 0) }))
          )
        )
        results.forEach(r => { map[r.id] = r.total })
      }
      setIuranPerTahun(map)
      setLoading(false)
    }
    fetchData()
  }, [])

  const totalSemuaIuran = Object.values(iuranPerTahun).reduce((a, b) => a + b, 0)
  const totalPemasukan_all = totalSemuaIuran + totalPemasukan
  const saldo = totalPemasukan_all - totalPengeluaran

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-800 mb-5">Laporan Keuangan</h2>

      {loading ? (
        <p className="text-center text-gray-400 py-12">Memuat data...</p>
      ) : (
        <>
          <div className={`rounded-2xl p-6 mb-5 text-center shadow-sm border ${saldo >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-sm text-gray-500 mb-1">Saldo Kas</p>
            <p className={`text-2xl sm:text-4xl font-bold tracking-tight break-all ${saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatRupiah(saldo)}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Total Iuran + Pemasukan Lain − Pengeluaran
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
            <div className="bg-green-50 rounded-xl border border-green-100 p-3 text-center">
              <p className="text-[11px] text-green-600 mb-1">Total Iuran</p>
              <p className="text-sm font-bold text-green-700 leading-tight">{formatRupiah(totalSemuaIuran)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-3 text-center">
              <p className="text-[11px] text-blue-500 mb-1">Pemasukan Lain</p>
              <p className="text-sm font-bold text-blue-700 leading-tight">{formatRupiah(totalPemasukan)}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3 text-center">
              <p className="text-[11px] text-emerald-600 mb-1">Total Pemasukan</p>
              <p className="text-sm font-bold text-emerald-700 leading-tight">{formatRupiah(totalPemasukan_all)}</p>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-100 p-3 text-center">
              <p className="text-[11px] text-red-500 mb-1">Pengeluaran</p>
              <p className="text-sm font-bold text-red-600 leading-tight">{formatRupiah(totalPengeluaran)}</p>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rekapitulasi</p>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {tahunList.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600">Iuran Tahun {t.tahun_mulai}–{t.tahun_selesai}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-800">{formatRupiah(iuranPerTahun[t.id] || 0)}</td>
                  </tr>
                ))}
                <tr className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-600">Pemasukan Lain</td>
                  <td className="px-5 py-3 text-right font-medium text-gray-800">{formatRupiah(totalPemasukan)}</td>
                </tr>
                <tr className="hover:bg-gray-50 border-t border-gray-200">
                  <td className="px-5 py-3 text-gray-600">Total Pemasukan</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-800">{formatRupiah(totalPemasukan_all)}</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-600">Pengeluaran</td>
                  <td className="px-5 py-3 text-right font-medium text-red-600">−{formatRupiah(totalPengeluaran)}</td>
                </tr>
                <tr className="bg-gray-50 border-t-2 border-gray-300">
                  <td className="px-5 py-3 font-bold text-gray-800">Saldo Kas</td>
                  <td className={`px-5 py-3 text-right font-bold text-base ${saldo >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {formatRupiah(saldo)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
