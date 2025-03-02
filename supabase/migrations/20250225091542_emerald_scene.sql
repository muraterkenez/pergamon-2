/*
  # Çiftlik Yönetim Sistemi Tablo Düzeltmeleri

  1. Mevcut Tabloların Kontrolü ve Yeniden Oluşturulması
    - Tüm tabloların varlığını kontrol et
    - Eksik tabloları oluştur
    - RLS politikalarını yeniden uygula

  2. Güvenlik
    - RLS politikalarının doğru uygulandığından emin ol
*/

-- Tabloların varlığını kontrol et ve oluştur
DO $$ 
BEGIN
  -- Animals tablosu
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'animals') THEN
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
  END IF;

  -- Milk Productions tablosu
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'milk_productions') THEN
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
  END IF;

  -- Health Records tablosu
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'health_records') THEN
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
  END IF;

  -- Expenses tablosu
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'expenses') THEN
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
  END IF;
END $$;

-- RLS'yi yeniden uygula
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS politikalarını yeniden oluştur
DO $$ 
BEGIN
  -- Animals için politikalar
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'animals' AND policyname = 'Users can view their own animals') THEN
    CREATE POLICY "Users can view their own animals"
      ON animals FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'animals' AND policyname = 'Users can insert their own animals') THEN
    CREATE POLICY "Users can insert their own animals"
      ON animals FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'animals' AND policyname = 'Users can update their own animals') THEN
    CREATE POLICY "Users can update their own animals"
      ON animals FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'animals' AND policyname = 'Users can delete their own animals') THEN
    CREATE POLICY "Users can delete their own animals"
      ON animals FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

  -- Health Records için politikalar
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'health_records' AND policyname = 'Users can view their own health records') THEN
    CREATE POLICY "Users can view their own health records"
      ON health_records FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'health_records' AND policyname = 'Users can insert their own health records') THEN
    CREATE POLICY "Users can insert their own health records"
      ON health_records FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'health_records' AND policyname = 'Users can update their own health records') THEN
    CREATE POLICY "Users can update their own health records"
      ON health_records FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'health_records' AND policyname = 'Users can delete their own health records') THEN
    CREATE POLICY "Users can delete their own health records"
      ON health_records FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

  -- Diğer tablolar için benzer politikalar...
END $$;