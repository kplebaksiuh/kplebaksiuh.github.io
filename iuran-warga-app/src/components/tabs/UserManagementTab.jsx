import { useState, useEffect } from 'react'
import { Pencil, Trash2, Info, KeyRound, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { ROLE_LABEL, ROLE_COLOR } from '../../lib/format'
import { logAktivitas } from '../../lib/logger'
import { useAuth } from '../../contexts/AuthContext'
import UserModal from '../modals/UserModal'
import GantiPasswordModal from '../modals/GantiPasswordModal'

export default function UserManagementTab() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [pengguna, setPengguna] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [resetModal, setResetModal] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  async function fetchData() {
    setLoading(true)
    const [{ data: profiles }, { data: pg }] = await Promise.all([
      supabase.from('profiles').select('*, pengguna:pengguna_id(nama)').order('created_at'),
      supabase.from('pengguna').select('id, nomor_urut, nama').order('nomor_urut'),
    ])
    setUsers(profiles || [])
    setPengguna(pg || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  async function handleDelete(userId, nama) {
    if (userId === currentUser.id) return alert('Tidak bisa hapus akun sendiri.')
    if (!confirm(`Hapus user "${nama}"?`)) return
    const target = users.find(u => u.id === userId)
    await supabase.from('profiles').delete().eq('id', userId)
    logAktivitas('Menghapus akun user', `${nama} (role: ${ROLE_LABEL[target?.role]})`)
    fetchData()
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (
      u.nama?.toLowerCase().includes(q) ||
      ROLE_LABEL[u.role]?.toLowerCase().includes(q) ||
      u.pengguna?.nama?.toLowerCase().includes(q)
    )
  })

  const showAll = perPage === 'all'
  const itemsPerPage = showAll ? filtered.length || 1 : perPage
  const totalPages = showAll ? 1 : Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const safePage = Math.min(page, totalPages)
  const startIdx = showAll ? 0 : (safePage - 1) * itemsPerPage
  const paginated = filtered.slice(startIdx, startIdx + itemsPerPage)

  function handleSearch(val) { setSearch(val); setPage(1) }
  function handlePerPage(val) { setPerPage(val === 'all' ? 'all' : Number(val)); setPage(1) }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Kelola User</h2>
          <p className="text-xs text-gray-500 mt-0.5">{users.length} user terdaftar</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex gap-3">
        <Info size={16} className="text-amber-500 flex-none mt-0.5" />
        <div className="text-xs text-amber-800 space-y-1">
          <p className="font-semibold">Cara menambah user baru:</p>
          <p>Jalankan script Python yang sudah tersedia di folder project:</p>
          <ul className="list-disc ml-4 space-y-0.5">
            <li><code className="bg-amber-100 px-1 rounded">buat_akun_staff.py</code> — untuk Ketua RT, Bendahara, Penagih</li>
            <li><code className="bg-amber-100 px-1 rounded">buat_akun_anggota.py</code> — untuk semua anggota sekaligus</li>
          </ul>
          <p className="mt-1">
            Setelah akun dibuat via script, gunakan tombol <strong>Edit (✎)</strong> di bawah untuk mengubah role atau menghubungkan ke data anggota warga.
          </p>
        </div>
      </div>

      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Cari nama, role, atau anggota warga..."
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Anggota Warga</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">Memuat...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">
                  {search ? 'Tidak ada hasil pencarian' : 'Belum ada user. Jalankan script Python untuk membuat akun.'}
                </td></tr>
              ) : paginated.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50 ${u.id === currentUser?.id ? 'bg-green-50/50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {u.nama}
                    {u.id === currentUser?.id && (
                      <span className="ml-2 text-xs text-green-500">(Anda)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLOR[u.role]}`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {u.pengguna?.nama || <span className="text-gray-300">–</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setModal(u)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit role / hubungkan anggota">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setResetModal(u)}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Reset password">
                        <KeyRound size={14} />
                      </button>
                      <button onClick={() => handleDelete(u.id, u.nama)}
                        disabled={u.id === currentUser?.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Hapus user">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && users.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Tampilkan:</span>
              <select
                value={perPage}
                onChange={e => handlePerPage(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-400 bg-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value="all">Semua</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">
                {showAll
                  ? `Semua ${filtered.length} user`
                  : `${filtered.length === 0 ? 0 : startIdx + 1}–${Math.min(startIdx + itemsPerPage, filtered.length)} dari ${filtered.length}`}
              </p>
              {!showAll && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => p - 1)} disabled={safePage === 1}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={15} />
                  </button>
                  <span className="text-xs text-gray-600 font-medium px-1">{safePage} / {totalPages}</span>
                  <button onClick={() => setPage(p => p + 1)} disabled={safePage === totalPages}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {modal && (
        <UserModal
          user={modal}
          pengguna={pengguna}
          onClose={() => setModal(null)}
          onSaved={fetchData}
        />
      )}

      {resetModal && (
        <GantiPasswordModal
          targetUser={resetModal}
          onClose={() => setResetModal(null)}
        />
      )}
    </div>
  )
}
