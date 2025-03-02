/*
  # Pedigree bilgileri için yeni alanlar ekleme

  1. Değişiklikler
    - `animals` tablosuna pedigree bilgileri için yeni alanlar ekleme
      - `pedigree_registered` (boolean): Pedigree kaydı var mı?
      - `pedigree_number` (text): Pedigree sertifika numarası
      - `genetic_merit` (integer): Genetik değer (0-100 arası)
      - `milk_yield_potential` (decimal): Süt verimi potansiyeli (L)
      - `fat_percentage` (decimal): Süt yağ oranı (%)
      - `protein_percentage` (decimal): Süt protein oranı (%)
      - `body_condition_score` (decimal): Vücut kondisyon skoru (1-5 arası)
*/

DO $$ 
BEGIN
  -- Pedigree kaydı var mı?
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'pedigree_registered'
  ) THEN
    ALTER TABLE animals ADD COLUMN pedigree_registered boolean DEFAULT false;
  END IF;

  -- Pedigree sertifika numarası
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'pedigree_number'
  ) THEN
    ALTER TABLE animals ADD COLUMN pedigree_number text;
  END IF;

  -- Genetik değer (0-100 arası)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'genetic_merit'
  ) THEN
    ALTER TABLE animals ADD COLUMN genetic_merit integer;
    ALTER TABLE animals ADD CONSTRAINT valid_genetic_merit CHECK (genetic_merit IS NULL OR (genetic_merit >= 0 AND genetic_merit <= 100));
  END IF;

  -- Süt verimi potansiyeli (L)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'milk_yield_potential'
  ) THEN
    ALTER TABLE animals ADD COLUMN milk_yield_potential decimal(10,2);
    ALTER TABLE animals ADD CONSTRAINT valid_milk_yield_potential CHECK (milk_yield_potential IS NULL OR milk_yield_potential >= 0);
  END IF;

  -- Süt yağ oranı (%)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'fat_percentage'
  ) THEN
    ALTER TABLE animals ADD COLUMN fat_percentage decimal(5,2);
    ALTER TABLE animals ADD CONSTRAINT valid_fat_percentage CHECK (fat_percentage IS NULL OR (fat_percentage >= 0 AND fat_percentage <= 10));
  END IF;

  -- Süt protein oranı (%)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'protein_percentage'
  ) THEN
    ALTER TABLE animals ADD COLUMN protein_percentage decimal(5,2);
    ALTER TABLE animals ADD CONSTRAINT valid_protein_percentage CHECK (protein_percentage IS NULL OR (protein_percentage >= 0 AND protein_percentage <= 10));
  END IF;

  -- Vücut kondisyon skoru (1-5 arası)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'body_condition_score'
  ) THEN
    ALTER TABLE animals ADD COLUMN body_condition_score decimal(3,1);
    ALTER TABLE animals ADD CONSTRAINT valid_body_condition_score CHECK (body_condition_score IS NULL OR (body_condition_score >= 1 AND body_condition_score <= 5));
  END IF;
END $$;