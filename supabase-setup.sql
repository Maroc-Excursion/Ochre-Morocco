-- ============================================================
-- OCHRE MOROCCO — Supabase Setup SQL (v2)
-- الصق هذا كاملاً في Supabase SQL Editor وانقر RUN
-- ============================================================

-- ── 1. جدول مديري الموقع ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- ── 2. إعدادات الموقع ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key        text PRIMARY KEY,
  value      text,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO site_settings (key, value) VALUES
  ('currency',             'EUR'),
  ('whatsapp',             '212694170004'),
  ('cancellation_policy',  'Cancellation accepted up to 48h before the excursion.'),
  ('booking_methods',      'whatsapp,cash,card'),
  ('card_enabled',         'false'),
  ('owner_email',          'ochremorocco@gmail.com'),
  ('phone',                '+212 694 170 004'),
  ('social_facebook',      'https://www.facebook.com/OchreMorocco'),
  ('social_instagram',     'https://www.instagram.com/ochre.morocco'),
  ('social_tiktok',        'https://www.tiktok.com/@ochremorocco'),
  ('social_youtube',       'https://www.youtube.com/@OchreMorocco')
ON CONFLICT (key) DO NOTHING;

-- ── 3. جدول الرحلات ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS excursions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  slug        text UNIQUE,
  description text,
  price       numeric(10,2),
  duration    text,
  category    text CHECK (category IN ('excursion','circuit','transfert')),
  image_url   text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ── 4. جدول الحجوزات (مُحسَّن) ───────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  excursion_id      uuid REFERENCES excursions(id) ON DELETE SET NULL,
  service_name      text,
  client_name       text NOT NULL,
  client_email      text,
  client_phone      text,
  booking_date      date,
  people_count      int DEFAULT 1,
  amount            numeric(10,2),
  currency          text DEFAULT 'EUR',
  payment_method    text CHECK (payment_method IN ('whatsapp','cash','card')) DEFAULT 'whatsapp',
  payment_status    text CHECK (payment_status IN ('pending','paid','partial','refunded')) DEFAULT 'pending',
  payment_reference text,
  status            text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  notes             text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- إضافة الأعمدة الجديدة إذا كان الجدول موجوداً مسبقاً
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_name      text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS amount            numeric(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency          text DEFAULT 'EUR';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method    text DEFAULT 'whatsapp';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status    text DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reference text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at        timestamptz DEFAULT now();

-- ── 5. جدول معاملات الدفع ────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid REFERENCES bookings(id) ON DELETE CASCADE,
  amount      numeric(10,2) NOT NULL,
  currency    text DEFAULT 'EUR',
  method      text,
  reference   text,
  notes       text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now()
);

-- ── 6. تفعيل RLS ────────────────────────────────────────────
ALTER TABLE admin_users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE excursions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- ── 7. دالة is_admin() ───────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid());
$$;

-- ── 8. سياسات جدول excursions ────────────────────────────────
DROP POLICY IF EXISTS "public_read_active_excursions" ON excursions;
DROP POLICY IF EXISTS "auth_read_all_excursions"      ON excursions;
DROP POLICY IF EXISTS "auth_insert_excursions"        ON excursions;
DROP POLICY IF EXISTS "auth_update_excursions"        ON excursions;
DROP POLICY IF EXISTS "auth_delete_excursions"        ON excursions;

-- الجميع يقرأ الرحلات النشطة
CREATE POLICY "public_read_active_excursions"
  ON excursions FOR SELECT TO public USING (is_active = true);

-- المدير يقرأ كل الرحلات (نشطة وغير نشطة)
CREATE POLICY "admin_read_all_excursions"
  ON excursions FOR SELECT TO authenticated USING (is_admin());

-- المدير فقط يضيف / يعدّل / يحذف
CREATE POLICY "admin_insert_excursions"
  ON excursions FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_excursions"
  ON excursions FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "admin_delete_excursions"
  ON excursions FOR DELETE TO authenticated USING (is_admin());

-- ── 9. سياسات جدول bookings ──────────────────────────────────
DROP POLICY IF EXISTS "public_insert_bookings" ON bookings;
DROP POLICY IF EXISTS "auth_read_bookings"     ON bookings;
DROP POLICY IF EXISTS "auth_update_bookings"   ON bookings;
DROP POLICY IF EXISTS "auth_delete_bookings"   ON bookings;

-- أي زائر يستطيع إضافة حجز
CREATE POLICY "public_insert_bookings"
  ON bookings FOR INSERT TO public WITH CHECK (true);

-- المدير يقرأ / يعدّل / يحذف جميع الحجوزات
CREATE POLICY "admin_read_bookings"
  ON bookings FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "admin_update_bookings"
  ON bookings FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "admin_delete_bookings"
  ON bookings FOR DELETE TO authenticated USING (is_admin());

-- ── 10. سياسات payment_transactions ──────────────────────────
DROP POLICY IF EXISTS "admin_all_transactions" ON payment_transactions;
CREATE POLICY "admin_all_transactions"
  ON payment_transactions FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ── 11. سياسات site_settings ─────────────────────────────────
DROP POLICY IF EXISTS "public_read_settings" ON site_settings;
DROP POLICY IF EXISTS "admin_write_settings" ON site_settings;
CREATE POLICY "public_read_settings"
  ON site_settings FOR SELECT TO public USING (true);
CREATE POLICY "admin_write_settings"
  ON site_settings FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ── 12. سياسات admin_users ────────────────────────────────────
DROP POLICY IF EXISTS "admin_read_self" ON admin_users;
DROP POLICY IF EXISTS "admin_manage"    ON admin_users;
CREATE POLICY "admin_read_self"
  ON admin_users FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_manage"
  ON admin_users FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ── 13. RPC: create_booking ───────────────────────────────────
CREATE OR REPLACE FUNCTION create_booking(
  p_service_name   text,
  p_client_name    text,
  p_client_email   text DEFAULT NULL,
  p_client_phone   text DEFAULT NULL,
  p_booking_date   date DEFAULT NULL,
  p_people_count   int  DEFAULT 1,
  p_amount         numeric DEFAULT 0,
  p_currency       text DEFAULT 'EUR',
  p_payment_method text DEFAULT 'whatsapp',
  p_notes          text DEFAULT NULL,
  p_excursion_id   uuid DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO bookings (
    excursion_id, service_name, client_name, client_email, client_phone,
    booking_date, people_count, amount, currency, payment_method, notes
  ) VALUES (
    p_excursion_id, p_service_name, p_client_name, p_client_email, p_client_phone,
    p_booking_date, p_people_count, p_amount, p_currency, p_payment_method, p_notes
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ── 14. RPC: update_booking_payment ───────────────────────────
CREATE OR REPLACE FUNCTION update_booking_payment(
  p_booking_id        uuid,
  p_payment_status    text,
  p_payment_reference text DEFAULT NULL,
  p_notes             text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE bookings SET
    payment_status    = p_payment_status,
    payment_reference = COALESCE(p_payment_reference, payment_reference),
    updated_at        = now()
  WHERE id = p_booking_id;
  INSERT INTO payment_transactions
    (booking_id, amount, currency, method, reference, notes, recorded_by)
  SELECT p_booking_id, amount, currency, payment_method,
         p_payment_reference, p_notes, auth.uid()
  FROM bookings WHERE id = p_booking_id;
END;
$$;

-- ── 15. Trigger: updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at          ON excursions;
DROP TRIGGER IF EXISTS set_updated_at_bookings ON bookings;
DROP TRIGGER IF EXISTS set_updated_at_settings ON site_settings;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON excursions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_bookings
  BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_settings
  BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 16. Storage bucket للصور ──────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('excursion-images', 'excursion-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_storage_read"  ON storage.objects;
DROP POLICY IF EXISTS "auth_storage_insert"  ON storage.objects;
DROP POLICY IF EXISTS "admin_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "auth_storage_delete"  ON storage.objects;
DROP POLICY IF EXISTS "admin_storage_delete" ON storage.objects;

CREATE POLICY "public_storage_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'excursion-images');
CREATE POLICY "admin_storage_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'excursion-images' AND is_admin());
CREATE POLICY "admin_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'excursion-images' AND is_admin());

-- ══════════════════════════════════════════════════════════════
-- بعد تشغيل هذا SQL، أضف نفسك كمدير:
--
--   1. اذهب إلى Authentication → Users في Supabase
--   2. انسخ معرف المستخدم (user_id)
--   3. نفّذ: INSERT INTO admin_users (user_id) VALUES ('<your-user-id>');
--
-- لن يتمكن أي مستخدم آخر من إدارة الرحلات أو قراءة الحجوزات.
-- ══════════════════════════════════════════════════════════════
