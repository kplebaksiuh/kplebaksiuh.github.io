"""
Skrip untuk membuat akun login semua anggota warga secara otomatis.
Jalankan: python buat_akun_anggota.py

Password default semua anggota: iuranwarga
Email dibentuk dari nama: abas.rosyadi@iuranwarga.com
"""

import re
from supabase import create_client

# ===================================================
# KONFIGURASI - ISI SESUAI PROJECT SUPABASE ANDA
# ===================================================
SUPABASE_URL = "https://GANTI_DENGAN_URL_SUPABASE_ANDA.supabase.co"
SUPABASE_SERVICE_KEY = "GANTI_DENGAN_SERVICE_ROLE_KEY_ANDA"
PASSWORD_DEFAULT = "iuranwarga"
EMAIL_DOMAIN = "iuranwarga.com"
# ===================================================


def nama_ke_email(nama):
    """Konversi nama ke format email: 'Abas Rosyadi' → 'abas.rosyadi@iuranwarga.com'"""
    nama = nama.strip().lower()
    nama = nama.replace("'", "")

    if '/' in nama:
        parts = nama.split('/')
        parts = [''.join(p.split()) for p in parts]
        local = '.'.join(p for p in parts if p)
    else:
        # Ganti spasi dengan titik, hapus karakter khusus
        local = re.sub(r'[^a-z0-9.]', '.', nama)
        local = re.sub(r'\.{2,}', '.', local)

    local = local.strip('.')
    return f"{local}@{EMAIL_DOMAIN}"


sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Ambil semua pengguna dari tabel pengguna
pengguna_list = sb.table("pengguna").select("id, nomor_urut, nama").order("nomor_urut").execute().data

print(f"Membuat akun untuk {len(pengguna_list)} anggota warga...\n")
print(f"{'No':<4} {'Nama':<30} {'Email':<40} Status")
print("-" * 88)

berhasil = 0
gagal = 0

for p in pengguna_list:
    nomor = p["nomor_urut"]
    nama  = p["nama"].strip()
    email = nama_ke_email(nama)

    try:
        sb.auth.admin.create_user({
            "email": email,
            "password": PASSWORD_DEFAULT,
            "email_confirm": True,
            "user_metadata": {
                "nama": nama,
                "role": "anggota",
                "pengguna_id": p["id"],
            }
        })
        print(f"{nomor:<4} {nama:<30} {email:<40} ✓")
        berhasil += 1
    except Exception as e:
        print(f"{nomor:<4} {nama:<30} {email:<40} ✗ {e}")
        gagal += 1

print("-" * 88)
print(f"\nSelesai! Berhasil: {berhasil}, Gagal: {gagal}")
print(f"\nPassword default semua anggota: {PASSWORD_DEFAULT}")
print(f"Email domain: @{EMAIL_DOMAIN}")
