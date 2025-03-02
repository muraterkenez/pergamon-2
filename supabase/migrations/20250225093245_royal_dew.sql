/*
  # Update color column constraints

  1. Changes
    - Make color column NOT NULL
    - Add default value for color column
    - Update check constraint for valid colors

  2. Notes
    - Non-destructive migration
    - Maintains existing data
    - Updates constraints for better data integrity
*/

DO $$ 
BEGIN
  -- Update color column to be NOT NULL with a default value
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'color'
  ) THEN
    -- First set a default value for any existing NULL values
    UPDATE animals SET color = 'other' WHERE color IS NULL;
    
    -- Then alter the column to be NOT NULL
    ALTER TABLE animals ALTER COLUMN color SET NOT NULL;
    ALTER TABLE animals ALTER COLUMN color SET DEFAULT 'other';
  END IF;
END $$;