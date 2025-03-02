/*
  # Fix animals table schema

  1. Changes
    - Consolidate all animal table changes into a single migration
    - Ensure all required columns are present with correct constraints
    - Set appropriate default values
    - Add proper indexes and RLS policies

  2. Table Structure
    - Primary columns:
      - id (uuid, primary key)
      - tag_number (text, unique per user)
      - name (text, nullable)
      - birth_date (date)
      - gender (text)
      - breed (text)
      - status (text)
      - notes (text, nullable)
      - created_at (timestamptz)
      - user_id (uuid)
    - Additional columns:
      - color (text)
      - source (text)
      - weight (decimal)
      - purchase_date (date, nullable)
      - purchase_price (decimal, nullable)
      - mother_tag (text, nullable)
      - father_tag (text, nullable)
      - health_status (text)
      - vaccination_status (boolean)

  3. Security
    - Enable RLS
    - Add policies for CRUD operations
*/

DO $$ 
BEGIN
  -- Drop existing table if it exists
  DROP TABLE IF EXISTS animals CASCADE;

  -- Create new table with all required columns
  CREATE TABLE animals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_number text NOT NULL,
    name text,
    birth_date date NOT NULL,
    gender text NOT NULL,
    breed text NOT NULL,
    color text NOT NULL DEFAULT 'other',
    source text NOT NULL DEFAULT 'birth',
    weight decimal(10,2),
    purchase_date date,
    purchase_price decimal(10,2),
    mother_tag text,
    father_tag text,
    health_status text NOT NULL DEFAULT 'healthy',
    vaccination_status boolean NOT NULL DEFAULT false,
    status text NOT NULL DEFAULT 'active',
    notes text,
    created_at timestamptz DEFAULT now(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_gender CHECK (gender IN ('male', 'female')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'sold', 'deceased')),
    CONSTRAINT valid_color CHECK (color IN ('Siyah-Beyaz', 'Kahverengi', 'Siyah', 'Beyaz', 'Kızıl', 'Alaca', 'Sarı', 'other')),
    CONSTRAINT valid_source CHECK (source IN ('birth', 'purchase')),
    CONSTRAINT valid_health_status CHECK (health_status IN ('healthy', 'sick', 'treatment'))
  );

  -- Create unique index for tag number per user
  CREATE UNIQUE INDEX animals_tag_number_user_id_idx ON animals (tag_number, user_id);

  -- Enable RLS
  ALTER TABLE animals ENABLE ROW LEVEL SECURITY;

  -- Create RLS policies
  CREATE POLICY "Users can view their own animals"
    ON animals FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own animals"
    ON animals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own animals"
    ON animals FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own animals"
    ON animals FOR DELETE
    USING (auth.uid() = user_id);
END $$;