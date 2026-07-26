-- ============================================================
-- OCHRE MOROCCO — Supabase Setup SQL
-- الصق هذا في Supabase SQL Editor وانقر RUN
-- ============================================================

-- 1. جدول الرحلات
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

-- 2. جدول الحجوزات
CREATE TABLE IF NOT EXISTS bookings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  excursion_id  uuid REFERENCES excursions(id) ON DELETE SET NULL,
  client_name   text NOT NULL,
  client_email  text,
  client_phone  text,
  booking_date  date,
  people_count  int DEFAULT 1,
  status        text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  notes         text,
  created_at    timestamptz DEFAULT now()
);

-- 3. تفعيل RLS على الجدولين
ALTER TABLE excursions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings   ENABLE ROW LEVEL SECURITY;

-- ── سياسات جدول excursions ──

-- الجميع يقرأ الرحلات النشطة فقط
CREATE POLICY "public_read_active_excursions"
  ON excursions FOR SELECT
  TO public
  USING (is_active = true);

-- المستخدم المسجل يقرأ كل الرحلات (بما فيها غير النشطة)
CREATE POLICY "auth_read_all_excursions"
  ON excursions FOR SELECT
  TO authenticated
  USING (true);

-- المستخدم المسجل يضيف رحلة
CREATE POLICY "auth_insert_excursions"
  ON excursions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- المستخدم المسجل يعدّل رحلة
CREATE POLICY "auth_update_excursions"
  ON excursions FOR UPDATE
  TO authenticated
  USING (true);

-- المستخدم المسجل يحذف رحلة
CREATE POLICY "auth_delete_excursions"
  ON excursions FOR DELETE
  TO authenticated
  USING (true);

-- ── سياسات جدول bookings ──

-- أي زائر يستطيع إضافة حجز فقط
CREATE POLICY "public_insert_bookings"
  ON bookings FOR INSERT
  TO public
  WITH CHECK (true);

-- المستخدم المسجل يقرأ كل الحجوزات
CREATE POLICY "auth_read_bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (true);

-- المستخدم المسجل يعدّل الحجوزات
CREATE POLICY "auth_update_bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (true);

-- المستخدم المسجل يحذف الحجوزات
CREATE POLICY "auth_delete_bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (true);

-- 4. Bucket للصور (شغّل هذا في Supabase Storage → New bucket)
-- الاسم: excursion-images | Public: مفعّل
-- أو عبر SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('excursion-images', 'excursion-images', true)
ON CONFLICT (id) DO NOTHING;

-- سياسة التخزين: الجميع يقرأ
CREATE POLICY "public_storage_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'excursion-images');

-- المستخدم المسجل يرفع
CREATE POLICY "auth_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'excursion-images');

-- المستخدم المسجل يحذف
CREATE POLICY "auth_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'excursion-images');

-- 5. Trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON excursions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
