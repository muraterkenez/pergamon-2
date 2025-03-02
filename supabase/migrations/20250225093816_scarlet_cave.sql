/*
  # Hayvanlar tablosu düzeltmesi

  1. Değişiklikler
    - Mevcut hayvanlar tablosunu düzelt
    - Tüm gerekli sütunları ekle
    - Uygun kısıtlamaları ve varsayılan değerleri ayarla
    - RLS politikalarını düzenle

  2. Tablo Yapısı
    - Ana sütunlar:
      - id (uuid, birincil anahtar)
      - tag_number (metin, kullanıcı başına benzersiz)
      - name (metin, boş olabilir)
      - birth_date (tarih)
      - gender (metin)
      - breed (metin)
      - status (metin)
      - notes (metin, boş olabilir)
      - created_at (timestamptz)
      - user_id (uuid)
    - Ek sütunlar:
      - color (metin)
      - source (metin)
      - weight (ondalık)
      - purchase_date (tarih, boş olabilir)
      - purchase_price (ondalık, boş olabilir)
      - mother_tag (metin, boş olabilir)
      - father_tag (metin, boş olabilir)
      - health_status (metin)
      - vaccination_status (boolean)

  3. Güvenlik
    - RLS aktif
    - CRUD işlemleri için politikalar
*/

DO $$ 
BEGIN
  -- Mevcut tabloyu düşür
  DROP TABLE IF EXISTS animals CASCADE;

  -- Yeni tabloyu tüm gerekli sütunlarla oluştur
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
    CONSTRAINT valid_health_status CHECK (health_status IN ('healthy', 'sick', 'treatment'))
  );

  -- Küpe numarası için kullanıcı başına benzersiz indeks
  CREATE UNIQUE INDEX animals_tag_number_user_id_idx ON animals (tag_number, user_id);

  -- RLS'yi etkinleştir
  ALTER TABLE animals ENABLE ROW LEVEL SECURITY;

  -- RLS politikalarını oluştur
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
END $$;