"""
Skrip untuk membuat akun staff (Ketua RT, Bendahara, Penagih).
Jalankan: python buat_akun_staff.py
"""

from supabase import create_client

# ===================================================
# KONFIGURASI - ISI SESUAI PROJECT SUPABASE ANDA
# ===================================================
SUPABASE_URL = "https://GANTI_DENGAN_URL_SUPABASE_ANDA.supabase.co"
SUPABASE_SERVICE_KEY = "GANTI_DENGAN_SERVICE_ROLE_KEY_ANDA"

# DAFTAR AKUN YANG INGIN DIBUAT — EDIT SESUAI DATA
AKUN_STAFF = [
    {
        "nama": "Nama Ketua RT",
        "email": "ketuart@email.com",
        "password": "password123",
        "role": "ketua_rt",
    },
    {
        "nama": "Nama Bendahara",
        "email": "bendahara@email.com",
        "password": "password123",
        "role": "bendahara",
    },
    {
        "nama": "Nama Penagih",
        "email": "penagih@email.com",
        "password": "password123",
        "role": "penagih",
    },
]
# ===================================================

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("Membuat akun staff...\n")

for akun in AKUN_STAFF:
    try:
        res = sb.auth.admin.create_user({
            "email": akun["email"],
            "password": akun["password"],
            "email_confirm": True,
            "user_metadata": {
                "nama": akun["nama"],
                "role": akun["role"],
            }
        })
        print(f"  ✓ {akun['role']:<12} | {akun['nama']:<25} | {akun['email']}")
    except Exception as e:
        print(f"  ✗ {akun['role']:<12} | {akun['nama']:<25} | GAGAL: {e}")

print("\nSelesai! Coba login dengan email dan password di atas.")
