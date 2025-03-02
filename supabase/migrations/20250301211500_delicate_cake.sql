/*
  # Fix parent tags validation and add missing columns

  1. Changes
    - Remove the strict parent tag validation constraint
    - Add a more flexible constraint for parent tags
    - Ensure all pedigree fields are properly added
*/

-- Drop the problematic constraint
ALTER TABLE IF EXISTS animals DROP CONSTRAINT IF EXISTS valid_parent_tags;

-- Add a more flexible constraint for parent tags
ALTER TABLE animals ADD CONSTRAINT valid_parent_tags_flexible 
  CHECK (
    (mother_tag IS NULL OR mother_tag ~ '^[Tt][Rr][-]?\d{10,12}$' OR mother_tag = 'other' OR mother_tag = '') AND
    (father_tag IS NULL OR father_tag ~ '^[Tt][Rr][-]?\d{10,12}$' OR father_tag = 'other' OR father_tag = '')
  );

-- Ensure all pedigree fields are properly added
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
  END IF;

  -- Süt verimi potansiyeli (L)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'milk_yield_potential'
  ) THEN
    ALTER TABLE animals ADD COLUMN milk_yield_potential decimal(10,2);
  END IF;

  -- Süt yağ oranı (%)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'fat_percentage'
  ) THEN
    ALTER TABLE animals ADD COLUMN fat_percentage decimal(5,2);
  END IF;

  -- Süt protein oranı (%)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'protein_percentage'
  ) THEN
    ALTER TABLE animals ADD COLUMN protein_percentage decimal(5,2);
  END IF;

  -- Vücut kondisyon skoru (1-5 arası)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'body_condition_score'
  ) THEN
    ALTER TABLE animals ADD COLUMN body_condition_score decimal(3,1);
  END IF;
END $$;

-- Kısıtlamaları yeniden ekle
ALTER TABLE animals ADD CONSTRAINT valid_genetic_merit 
  CHECK (genetic_merit IS NULL OR (genetic_merit >= 0 AND genetic_merit <= 100));

ALTER TABLE animals ADD CONSTRAINT valid_milk_yield_potential 
  CHECK (milk_yield_potential IS NULL OR milk_yield_potential >= 0);

ALTER TABLE animals ADD CONSTRAINT valid_fat_percentage 
  CHECK (fat_percentage IS NULL OR (fat_percentage >= 0 AND fat_percentage <= 10));

ALTER TABLE animals ADD CONSTRAINT valid_protein_percentage 
  CHECK (protein_percentage IS NULL OR (protein_percentage >= 0 AND protein_percentage <= 10));

ALTER TABLE animals ADD CONSTRAINT valid_body_condition_score 
  CHECK (body_condition_score IS NULL OR (body_condition_score >= 1 AND body_condition_score <= 5));