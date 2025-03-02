/*
  # Add color column to animals table

  1. Changes
    - Add `color` column to `animals` table
    - Add check constraint for valid colors

  2. Notes
    - Non-destructive migration
    - Maintains existing data
*/

DO $$ 
BEGIN
  -- Add color column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'color'
  ) THEN
    ALTER TABLE animals ADD COLUMN color text;
    
    -- Add check constraint for valid colors
    ALTER TABLE animals ADD CONSTRAINT valid_color CHECK (
      color IN (
        'Siyah-Beyaz',
        'Kahverengi',
        'Siyah',
        'Beyaz',
        'Kızıl',
        'Alaca',
        'Sarı',
        'other'
      )
    );
  END IF;
END $$;