/*
  # Update animals table schema

  1. Changes
    - Add new columns for animal details
    - Set appropriate constraints and default values
    - Ensure all columns have proper validation

  2. New Columns
    - color (text, NOT NULL)
    - source (text, NOT NULL)
    - weight (decimal)
    - purchase_date (date)
    - purchase_price (decimal)
    - mother_tag (text)
    - father_tag (text)
    - health_status (text, NOT NULL)
    - vaccination_status (boolean, NOT NULL)

  3. Notes
    - Non-destructive migration
    - Maintains existing data
    - Adds proper constraints
*/

DO $$ 
BEGIN
  -- Add color column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'color'
  ) THEN
    ALTER TABLE animals ADD COLUMN color text NOT NULL DEFAULT 'other';
    ALTER TABLE animals ADD CONSTRAINT valid_color CHECK (
      color IN ('Siyah-Beyaz', 'Kahverengi', 'Siyah', 'Beyaz', 'Kızıl', 'Alaca', 'Sarı', 'other')
    );
  END IF;

  -- Add source column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'source'
  ) THEN
    ALTER TABLE animals ADD COLUMN source text NOT NULL DEFAULT 'birth';
    ALTER TABLE animals ADD CONSTRAINT valid_source CHECK (source IN ('birth', 'purchase'));
  END IF;

  -- Add weight column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'weight'
  ) THEN
    ALTER TABLE animals ADD COLUMN weight decimal(10,2);
  END IF;

  -- Add purchase related columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'purchase_date'
  ) THEN
    ALTER TABLE animals ADD COLUMN purchase_date date;
    ALTER TABLE animals ADD COLUMN purchase_price decimal(10,2);
  END IF;

  -- Add parent tag columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'mother_tag'
  ) THEN
    ALTER TABLE animals ADD COLUMN mother_tag text;
    ALTER TABLE animals ADD COLUMN father_tag text;
  END IF;

  -- Add health status columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'health_status'
  ) THEN
    ALTER TABLE animals ADD COLUMN health_status text NOT NULL DEFAULT 'healthy';
    ALTER TABLE animals ADD CONSTRAINT valid_health_status CHECK (health_status IN ('healthy', 'sick', 'treatment'));
  END IF;

  -- Add vaccination status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'vaccination_status'
  ) THEN
    ALTER TABLE animals ADD COLUMN vaccination_status boolean NOT NULL DEFAULT false;
  END IF;
END $$;