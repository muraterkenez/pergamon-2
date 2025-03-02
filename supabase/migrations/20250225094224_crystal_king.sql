/*
  # Çiftlik Yönetim Sistemi Veritabanı Şeması

  1. Yeni Tablolar
    - `animals` (Hayvanlar)
      - Temel bilgiler: id, küpe no, isim, doğum tarihi, cinsiyet, ırk
      - Fiziksel özellikler: renk, ağırlık
      - Kaynak bilgileri: kaynak türü, satın alma tarihi/fiyatı, ebeveyn bilgileri
      - Sağlık bilgileri: sağlık durumu, aşı durumu
      - Durum ve notlar: aktif/satıldı/vefat, notlar
    - `milk_productions` (Süt Üretimi)
      - Üretim kayıtları: tarih, miktar, kalite puanı
    - `health_records` (Sağlık Kayıtları)
      - Muayene, aşılama ve tedavi kayıtları
    - `expenses` (Harcamalar)
      - Yem, ilaç, ekipman ve diğer harcamalar

  2. Güvenlik
    - Tüm tablolarda RLS aktif
    - Her tablo için CRUD politikaları
    - Kullanıcı bazlı veri izolasyonu

  3. Kısıtlamalar ve Validasyonlar
    - Küpe numarası formatı kontrolü (TR + 10 rakam)
    - Geçerli durum ve kategori kontrolleri
    - Tarih ve miktar validasyonları
*/

-- Mevcut tabloları temizle
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS health_records CASCADE;
DROP TABLE IF EXISTS milk_productions CASCADE;
DROP TABLE IF EXISTS animals CASCADE;

-- Hayvanlar tablosu
CREATE TABLE animals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_number text NOT NULL,
    name text,
    birth_date date NOT NULL,
    gender text NOT NULL,
    breed text NOT NULL,
    color text NOT NULL DEFAULT 'other',
    source text NOT NULL DEFAULT 'birth',
    weight decimal(10,2),
    purchase_date date,
    purchase_price decimal(10,2),
    mother_tag text,
    father_tag text,
    health_status text NOT NULL DEFAULT 'healthy',
    vaccination_status boolean NOT NULL DEFAULT false,
    status text NOT NULL DEFAULT 'active',
    notes text,
    created_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    
    -- Kısıtlamalar
    CONSTRAINT valid_gender CHECK (gender IN ('male', 'female')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'sold', 'deceased')),
    CONSTRAINT valid_color CHECK (color IN ('Siyah-Beyaz', 'Kahverengi', 'Siyah', 'Beyaz', 'Kızıl', 'Alaca', 'Sarı', 'other')),
    CONSTRAINT valid_source CHECK (source IN ('birth', 'purchase')),
    CONSTRAINT valid_health_status CHECK (health_status IN ('healthy', 'sick', 'treatment')),
    CONSTRAINT valid_purchase_info CHECK (
        (source = 'purchase' AND purchase_date IS NOT NULL AND purchase_price IS NOT NULL) OR
        (source = 'birth' AND (purchase_date IS NULL AND purchase_price IS NULL))
    ),
    CONSTRAINT valid_tag_number CHECK (tag_number ~ '^TR\d{10}$'),
    CONSTRAINT valid_parent_tags CHECK (
        (mother_tag IS NULL OR mother_tag ~ '^TR\d{10}$') AND
        (father_tag IS NULL OR father_tag ~ '^TR\d{10}$')
    )
);

-- Süt üretimi tablosu
CREATE TABLE milk_productions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    date date NOT NULL,
    amount decimal(10,2) NOT NULL CHECK (amount > 0),
    quality_score int CHECK (quality_score BETWEEN 1 AND 10),
    notes text,
    created_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id)
);

-- Sağlık kayıtları tablosu
CREATE TABLE health_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    date date NOT NULL,
    type text NOT NULL,
    description text NOT NULL,
    treatment text,
    cost decimal(10,2) CHECK (cost >= 0),
    next_check_date date,
    created_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    CONSTRAINT valid_type CHECK (type IN ('examination', 'vaccination', 'treatment'))
);

-- Harcamalar tablosu
CREATE TABLE expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    amount decimal(10,2) NOT NULL CHECK (amount > 0),
    created_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    CONSTRAINT valid_category CHECK (category IN ('feed', 'medicine', 'equipment', 'other'))
);

-- İndeksler
CREATE UNIQUE INDEX animals_tag_number_user_id_idx ON animals (tag_number, user_id);
CREATE INDEX milk_productions_animal_id_idx ON milk_productions (animal_id);
CREATE INDEX milk_productions_date_idx ON milk_productions (date);
CREATE INDEX health_records_animal_id_idx ON health_records (animal_id);
CREATE INDEX health_records_date_idx ON health_records (date);
CREATE INDEX expenses_date_idx ON expenses (date);
CREATE INDEX expenses_category_idx ON expenses (category);

-- RLS Etkinleştirme
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları: Hayvanlar
CREATE POLICY "Users can view their own animals"
    ON animals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own animals"
    ON animals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own animals"
    ON animals FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own animals"
    ON animals FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Politikaları: Süt Üretimi
CREATE POLICY "Users can view their own milk productions"
    ON milk_productions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milk productions"
    ON milk_productions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milk productions"
    ON milk_productions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own milk productions"
    ON milk_productions FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Politikaları: Sağlık Kayıtları
CREATE POLICY "Users can view their own health records"
    ON health_records FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health records"
    ON health_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health records"
    ON health_records FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health records"
    ON health_records FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Politikaları: Harcamalar
CREATE POLICY "Users can view their own expenses"
    ON expenses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
    ON expenses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
    ON expenses FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
    ON expenses FOR DELETE
    USING (auth.uid() = user_id);