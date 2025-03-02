/*
  # Add missing columns to animals table

  1. Changes
    - Add `source` column for tracking animal origin (birth/purchase)
    - Add `weight` column for animal weight
    - Add `purchase_date` column for purchased animals
    - Add `purchase_price` column for purchased animals
    - Add `mother_tag` column for birth records
    - Add `father_tag` column for birth records
    - Add `health_status` column for health tracking
    - Add `vaccination_status` column for vaccination tracking

  2. Notes
    - Non-destructive migration
    - Maintains existing data
    - Adds necessary constraints
*/

DO $$ 
BEGIN
  -- Add source column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'source'
  ) THEN
    ALTER TABLE animals ADD COLUMN source text NOT NULL DEFAULT 'birth';
    ALTER TABLE animals ADD CONSTRAINT valid_source CHECK (source IN ('birth', 'purchase'));
  END IF;

  -- Add weight column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'weight'
  ) THEN
    ALTER TABLE animals ADD COLUMN weight decimal(10,2);
  END IF;

  -- Add purchase_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'purchase_date'
  ) THEN
    ALTER TABLE animals ADD COLUMN purchase_date date;
  END IF;

  -- Add purchase_price column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'purchase_price'
  ) THEN
    ALTER TABLE animals ADD COLUMN purchase_price decimal(10,2);
  END IF;

  -- Add mother_tag column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'mother_tag'
  ) THEN
    ALTER TABLE animals ADD COLUMN mother_tag text;
  END IF;

  -- Add father_tag column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'father_tag'
  ) THEN
    ALTER TABLE animals ADD COLUMN father_tag text;
  END IF;

  -- Add health_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'health_status'
  ) THEN
    ALTER TABLE animals ADD COLUMN health_status text NOT NULL DEFAULT 'healthy';
    ALTER TABLE animals ADD CONSTRAINT valid_health_status CHECK (health_status IN ('healthy', 'sick', 'treatment'));
  END IF;

  -- Add vaccination_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'vaccination_status'
  ) THEN
    ALTER TABLE animals ADD COLUMN vaccination_status boolean NOT NULL DEFAULT false;
  END IF;
END $$;