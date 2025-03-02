/*
  # Pedigree System Schema

  1. New Tables
    - `pedigrees` - Stores detailed pedigree information for animals
      - `id` (uuid, primary key)
      - `animal_id` (uuid, references animals)
      - `pedigree_number` (text)
      - `registration_date` (date)
      - `pedigree_class` (text)
      - `genetic_merit_score` (decimal)
      - `breeding_value` (decimal)
      - `genetic_defects` (text array)
      - `genetic_traits` (jsonb)
      - `lineage` (jsonb)
      - `certificates` (text array)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `pedigrees` table
    - Add policies for authenticated users to manage their own pedigree records
*/

-- Create pedigrees table
CREATE TABLE IF NOT EXISTS pedigrees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  pedigree_number text NOT NULL,
  registration_date date NOT NULL,
  pedigree_class text NOT NULL CHECK (pedigree_class IN ('A', 'B', 'C', 'D')),
  genetic_merit_score decimal(4,1) NOT NULL CHECK (genetic_merit_score >= 0 AND genetic_merit_score <= 10),
  breeding_value decimal(10,2),
  genetic_defects text[],
  genetic_traits jsonb,
  lineage jsonb NOT NULL,
  certificates text[],
  notes text,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS pedigrees_animal_id_idx ON pedigrees (animal_id);
CREATE INDEX IF NOT EXISTS pedigrees_pedigree_number_idx ON pedigrees (pedigree_number);
CREATE INDEX IF NOT EXISTS pedigrees_pedigree_class_idx ON pedigrees (pedigree_class);
CREATE UNIQUE INDEX IF NOT EXISTS pedigrees_animal_id_unique_idx ON pedigrees (animal_id);

-- Add pedigree fields to animals table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'pedigree_number'
  ) THEN
    ALTER TABLE animals ADD COLUMN pedigree_number text;
    ALTER TABLE animals ADD COLUMN pedigree_class text;
    ALTER TABLE animals ADD COLUMN genetic_merit text;
    ALTER TABLE animals ADD COLUMN breeding_value decimal(10,2);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE pedigrees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pedigrees
CREATE POLICY "Users can view their own pedigrees"
  ON pedigrees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pedigrees"
  ON pedigrees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pedigrees"
  ON pedigrees FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pedigrees"
  ON pedigrees FOR DELETE
  USING (auth.uid() = user_id);