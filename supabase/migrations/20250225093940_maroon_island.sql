/*
  # Veritabanı Şeması Temizleme ve Yeniden Yapılandırma

  1. Yeni Tablolar ve Sütunlar
    - `animals` tablosu güncellendi:
      - Yeni sütunlar eklendi: color, source, weight, purchase_date, purchase_price, mother_tag, father_tag, health_status, vaccination_status
      - Tüm sütunlar için uygun veri tipleri ve kısıtlamalar tanımlandı
      - Benzersiz indeks eklendi: tag_number ve user_id için

  2. Güvenlik
    - RLS politikaları güncellendi
    - Tüm CRUD işlemleri için kullanıcı bazlı erişim kontrolleri eklendi

  3. Değişiklikler
    - Tüm sütunlar için uygun varsayılan değerler tanımlandı
    - Veri bütünlüğü için CHECK kısıtlamaları eklendi
*/

-- Mevcut tabloyu düşür ve yeniden oluştur
DROP TABLE IF EXISTS animals CASCADE;

-- Hayvanlar tablosunu oluştur
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
    -- Satın alma tarihi ve fiyatı için kısıtlama
    CONSTRAINT valid_purchase_info CHECK (
        (source = 'purchase' AND purchase_date IS NOT NULL AND purchase_price IS NOT NULL) OR
        (source = 'birth' AND (purchase_date IS NULL AND purchase_price IS NULL))
    ),
    -- Küpe numarası formatı için kısıtlama
    CONSTRAINT valid_tag_number CHECK (tag_number ~ '^TR\d{10}$'),
    -- Ebeveyn küpe numaraları için format kontrolü
    CONSTRAINT valid_parent_tags CHECK (
        (mother_tag IS NULL OR mother_tag ~ '^TR\d{10}$') AND
        (father_tag IS NULL OR father_tag ~ '^TR\d{10}$')
    )
);

-- Benzersiz indeks oluştur
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