/*
  # Süt Çiftliği Yönetim Sistemi - Temel Şema

  1. Yeni Tablolar
    - `animals` (Hayvanlar)
      - `id` (uuid): Benzersiz kimlik
      - `tag_number` (text): Küpe numarası
      - `name` (text): İsim
      - `birth_date` (date): Doğum tarihi
      - `gender` (text): Cinsiyet
      - `breed` (text): Irk
      - `status` (text): Durum (Aktif, Satıldı, Öldü)
      - `notes` (text): Notlar
      - `created_at` (timestamptz): Kayıt tarihi
      - `user_id` (uuid): Kullanıcı referansı

    - `milk_productions` (Süt Üretimi)
      - `id` (uuid): Benzersiz kimlik
      - `animal_id` (uuid): Hayvan referansı
      - `date` (date): Sağım tarihi
      - `amount` (decimal): Süt miktarı (litre)
      - `quality_score` (int): Kalite puanı
      - `notes` (text): Notlar
      - `created_at` (timestamptz): Kayıt tarihi
      - `user_id` (uuid): Kullanıcı referansı

    - `health_records` (Sağlık Kayıtları)
      - `id` (uuid): Benzersiz kimlik
      - `animal_id` (uuid): Hayvan referansı
      - `date` (date): Muayene/tedavi tarihi
      - `type` (text): Kayıt tipi (Muayene, Aşı, Tedavi)
      - `description` (text): Açıklama
      - `treatment` (text): Uygulanan tedavi
      - `cost` (decimal): Maliyet
      - `next_check_date` (date): Sonraki kontrol tarihi
      - `created_at` (timestamptz): Kayıt tarihi
      - `user_id` (uuid): Kullanıcı referansı

    - `expenses` (Giderler)
      - `id` (uuid): Benzersiz kimlik
      - `date` (date): Tarih
      - `category` (text): Kategori (Yem, İlaç, Ekipman, Diğer)
      - `description` (text): Açıklama
      - `amount` (decimal): Tutar
      - `created_at` (timestamptz): Kayıt tarihi
      - `user_id` (uuid): Kullanıcı referansı

  2. Güvenlik
    - Tüm tablolar için RLS politikaları oluşturuldu
    - Kullanıcılar sadece kendi verilerini görebilir ve düzenleyebilir
*/

-- Animals tablosu
CREATE TABLE animals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_number text NOT NULL,
    name text,
    birth_date date NOT NULL,
    gender text NOT NULL,
    breed text NOT NULL,
    status text NOT NULL DEFAULT 'active',
    notes text,
    created_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    CONSTRAINT valid_gender CHECK (gender IN ('male', 'female')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'sold', 'deceased'))
);

CREATE UNIQUE INDEX animals_tag_number_user_id_idx ON animals (tag_number, user_id);

-- Milk Productions tablosu
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

CREATE INDEX milk_productions_animal_id_idx ON milk_productions (animal_id);
CREATE INDEX milk_productions_date_idx ON milk_productions (date);

-- Health Records tablosu
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

CREATE INDEX health_records_animal_id_idx ON health_records (animal_id);
CREATE INDEX health_records_date_idx ON health_records (date);

-- Expenses tablosu
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

CREATE INDEX expenses_date_idx ON expenses (date);
CREATE INDEX expenses_category_idx ON expenses (category);

-- RLS Politikaları
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Animals için politikalar
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

-- Milk Productions için politikalar
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

-- Health Records için politikalar
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

-- Expenses için politikalar
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