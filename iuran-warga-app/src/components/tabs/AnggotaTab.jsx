import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, UserCheck, UserX } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatRupiah } from '../../lib/format'
import AnggotaModal from '../modals/AnggotaModal'
import { logAktivitas } from '../../lib/logger'

export default function AnggotaTab() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)

  async function fetchData() {
    setLoading(true)
    const { data: rows } = await supabase
      .from('pengguna')
      .select('*')
      .order('nomor_urut')
    setData(rows || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  async function handleDelete(id, nama) {
    if (!confirm(`Hapus anggota "${nama}"? Data pembayarannya juga akan terhapus.`)) return
    await supabase.from('pengguna').delete().eq('id', id)
    logAktivitas('Menghapus anggota warga', nama)
    fetchData()
  }

  const filtered = data.filter(d =>
    d.nama.toLowerCase().includes(search.toLowerCase()) ||
    String(d.nomor_urut).includes(search)
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-semibold text-gray-800">
          Daftar Anggota Warga
          <span className="ml-2 text-sm font-normal text-gray-400">({data.length} anggota)</span>
        </h2>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama / nomor..."
              className="w-full sm:w-56 pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={15} />
            Tambah
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">No</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Iuran/Bulan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Tidak ada data</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 font-mono">{p.nomor_urut}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.nama}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${p.nominal_iuran > 5000 ? 'text-amber-600' : 'text-gray-700'}`}>
                      {formatRupiah(p.nominal_iuran)}
                    </span>
                    {p.nominal_iuran > 5000 && (
                      <span className="ml-1 text-xs text-amber-500">(khusus)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        <UserCheck size={11} /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        <UserX size={11} /> Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModal(p)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.nama)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <AnggotaModal
          anggota={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  )
}
