/*
  # Add is_insemination column to animals table

  1. New Columns
    - `is_insemination` (boolean) - Indicates if the animal was born through artificial insemination
  
  2. Changes
    - Adds a new column to track artificial insemination status
    - Sets default value to false
*/

-- Add is_insemination column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'is_insemination'
  ) THEN
    ALTER TABLE animals ADD COLUMN is_insemination boolean DEFAULT false;
  END IF;
END $$;