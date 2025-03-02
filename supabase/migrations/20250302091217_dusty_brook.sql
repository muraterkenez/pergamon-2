/*
  # Süt İşleme Şeması

  1. Yeni Tablolar
    - `milk_processing_batches`
      - Süt işleme partilerini takip etmek için
      - Her parti için toplam giriş miktarı, işlem tipi ve sonuçları
    
    - `milk_processing_inputs`
      - Her partide kullanılan ham sütleri takip etmek için
      - milk_productions tablosuyla ilişkili

  2. Değişiklikler
    - `milk_productions` tablosuna yeni alanlar ekleme
      - `processing_status`: İşlenme durumu
      - `processing_batch_id`: İşlendiği parti ID'si

  3. Güvenlik
    - RLS politikaları ekleme
    - Kullanıcı bazlı erişim kontrolü
*/

-- Süt işleme partileri tablosu
CREATE TABLE IF NOT EXISTS milk_processing_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  process_type text NOT NULL CHECK (process_type IN ('cream_separation', 'direct_cheese')),
  input_amount decimal(10,2) NOT NULL CHECK (input_amount > 0),
  cream_amount decimal(10,2),
  skimmed_milk_amount decimal(10,2),
  cheese_amount decimal(10,2),
  quality_score int CHECK (quality_score BETWEEN 1 AND 10),
  notes text,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

-- Süt işleme girdileri tablosu
CREATE TABLE IF NOT EXISTS milk_processing_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES milk_processing_batches(id) ON DELETE CASCADE,
  milk_production_id uuid NOT NULL REFERENCES milk_productions(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  UNIQUE(batch_id, milk_production_id)
);

-- milk_productions tablosuna yeni alanlar ekle
ALTER TABLE milk_productions ADD COLUMN IF NOT EXISTS processing_status text 
  DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'processed'));
ALTER TABLE milk_productions ADD COLUMN IF NOT EXISTS processing_batch_id uuid 
  REFERENCES milk_processing_batches(id);

-- İndeksler
CREATE INDEX IF NOT EXISTS milk_processing_batches_date_idx ON milk_processing_batches (date);
CREATE INDEX IF NOT EXISTS milk_processing_batches_type_idx ON milk_processing_batches (process_type);
CREATE INDEX IF NOT EXISTS milk_processing_inputs_batch_idx ON milk_processing_inputs (batch_id);
CREATE INDEX IF NOT EXISTS milk_processing_inputs_production_idx ON milk_processing_inputs (milk_production_id);

-- RLS Etkinleştirme
ALTER TABLE milk_processing_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_processing_inputs ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları: Süt İşleme Partileri
CREATE POLICY "Users can view their own processing batches"
  ON milk_processing_batches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own processing batches"
  ON milk_processing_batches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processing batches"
  ON milk_processing_batches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own processing batches"
  ON milk_processing_batches FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Politikaları: Süt İşleme Girdileri
CREATE POLICY "Users can view their own processing inputs"
  ON milk_processing_inputs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own processing inputs"
  ON milk_processing_inputs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processing inputs"
  ON milk_processing_inputs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own processing inputs"
  ON milk_processing_inputs FOR DELETE
  USING (auth.uid() = user_id);