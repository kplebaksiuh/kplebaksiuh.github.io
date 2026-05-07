-- ============================================================
-- SETUP SUPABASE UNTUK APLIKASI IURAN WARGA
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tabel pengguna (anggota warga)
CREATE TABLE IF NOT EXISTS pengguna (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_urut    int  NOT NULL UNIQUE,
  nama          text NOT NULL,
  nominal_iuran int  NOT NULL DEFAULT 5000,
  is_active     bool NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabel tahun iuran (periode Oktober - September)
CREATE TABLE IF NOT EXISTS tahun_iuran (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tahun_mulai  int  NOT NULL,
  tahun_selesai int NOT NULL,
  label        text NOT NULL UNIQUE,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Insert periode tahun iuran yang ada
INSERT INTO tahun_iuran (tahun_mulai, tahun_selesai, label) VALUES
  (2024, 2025, '2024'),
  (2025, 2026, '2025')
ON CONFLICT (label) DO NOTHING;

-- 3. Tabel pembayaran iuran
CREATE TABLE IF NOT EXISTS pembayaran (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pengguna_id    uuid NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  tahun_iuran_id uuid NOT NULL REFERENCES tahun_iuran(id) ON DELETE CASCADE,
  bulan          int  NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  nominal        int  NOT NULL,
  tanggal_bayar  date,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pengguna_id, tahun_iuran_id, bulan)
);

-- 4. Tabel pemasukan tambahan
CREATE TABLE IF NOT EXISTS pemasukan (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal     date NOT NULL,
  keterangan  text NOT NULL,
  nominal     int  NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 5. Tabel pengeluaran
CREATE TABLE IF NOT EXISTS pengeluaran (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal     date NOT NULL,
  keterangan  text NOT NULL,
  nominal     int  NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 6. Tabel profiles (user accounts)
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama        text NOT NULL,
  role        text NOT NULL DEFAULT 'anggota'
                   CHECK (role IN ('ketua_rt','bendahara','penagih','anggota')),
  pengguna_id uuid REFERENCES pengguna(id) ON DELETE SET NULL,
  email       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 7. Tabel log aktivitas
CREATE TABLE IF NOT EXISTS log_aktivitas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  nama_user   text NOT NULL,
  role        text NOT NULL,
  aktivitas   text NOT NULL,
  detail      text,
  ip_address  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGER: auto-create profile saat user baru dibuat
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, role, pengguna_id, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email, 'User Baru'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'anggota'),
    CASE
      WHEN NEW.raw_user_meta_data->>'pengguna_id' IS NOT NULL
       AND NEW.raw_user_meta_data->>'pengguna_id' != 'null'
      THEN (NEW.raw_user_meta_data->>'pengguna_id')::uuid
      ELSE NULL
    END,
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    nama        = EXCLUDED.nama,
    role        = EXCLUDED.role,
    pengguna_id = EXCLUDED.pengguna_id,
    email       = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION: admin reset password (dipanggil dari app)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_reset_password(
  target_user_id uuid,
  new_password   text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = target_user_id;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE pengguna        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tahun_iuran     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pemasukan       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengeluaran     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_aktivitas   ENABLE ROW LEVEL SECURITY;

-- Semua user yang sudah login bisa baca data pengguna, tahun_iuran, pembayaran
CREATE POLICY "authenticated read pengguna"
  ON pengguna FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read tahun_iuran"
  ON tahun_iuran FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read pembayaran"
  ON pembayaran FOR SELECT TO authenticated USING (true);

-- Semua user yang login bisa baca profiles
CREATE POLICY "authenticated read profiles"
  ON profiles FOR SELECT TO authenticated USING (true);

-- Semua user yang login bisa baca pemasukan, pengeluaran
CREATE POLICY "authenticated read pemasukan"
  ON pemasukan FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read pengeluaran"
  ON pengeluaran FOR SELECT TO authenticated USING (true);

-- Semua user yang login bisa write log
CREATE POLICY "authenticated insert log"
  ON log_aktivitas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated read log"
  ON log_aktivitas FOR SELECT TO authenticated USING (true);

-- Write policies untuk pengguna, pembayaran, pemasukan, pengeluaran, profiles
-- (bisa dilakukan oleh semua user yang login — akses UI dibatasi di level role)
CREATE POLICY "authenticated write pengguna"
  ON pengguna FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated write pembayaran"
  ON pembayaran FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated write pemasukan"
  ON pemasukan FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated write pengeluaran"
  ON pengeluaran FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated write profiles"
  ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- SELESAI!
-- Selanjutnya:
-- 1. Isi .env dengan URL dan Anon Key Supabase Anda
-- 2. Jalankan: python migrate.py (untuk import data Excel)
-- 3. Jalankan: python buat_akun_staff.py (untuk buat akun admin)
-- 4. Jalankan: python buat_akun_anggota.py (untuk buat akun anggota)
-- 5. npm run dev (untuk menjalankan aplikasi)
-- ============================================================
