import { useState } from 'react'
import { Users, LogOut, KeyRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_LABEL, ROLE_COLOR } from '../lib/format'
import GantiPasswordModal from './modals/GantiPasswordModal'

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const [showGantiPassword, setShowGantiPassword] = useState(false)

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={22} className="text-green-600" />
            <span className="font-bold text-gray-800 text-base">Iuran Warga</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLOR[profile?.role] || 'bg-gray-100 text-gray-600'}`}>
              {ROLE_LABEL[profile?.role] || '-'}
            </span>
            <span className="text-sm text-gray-600 hidden sm:block">{profile?.nama}</span>
            <button
              onClick={() => setShowGantiPassword(true)}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Ganti Password"
            >
              <KeyRound size={16} />
            </button>
            <button
              onClick={signOut}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Keluar"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {showGantiPassword && (
        <GantiPasswordModal onClose={() => setShowGantiPassword(false)} />
      )}
    </>
  )
}
