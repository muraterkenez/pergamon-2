-- Add pedigree and production-specific fields to animals table
DO $$ 
BEGIN
  -- Add dairy animal specific fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'milk_yield'
  ) THEN
    ALTER TABLE animals ADD COLUMN milk_yield decimal(10,2);
    ALTER TABLE animals ADD COLUMN lactation_period integer;
    ALTER TABLE animals ADD COLUMN milk_fat_percentage decimal(5,2);
    ALTER TABLE animals ADD COLUMN milk_protein_percentage decimal(5,2);
  END IF;

  -- Add meat animal specific fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'animals' AND column_name = 'daily_weight_gain'
  ) THEN
    ALTER TABLE animals ADD COLUMN daily_weight_gain decimal(10,2);
    ALTER TABLE animals ADD COLUMN feed_conversion_ratio decimal(5,2);
    ALTER TABLE animals ADD COLUMN carcass_quality text;
  END IF;

  -- Add pedigree fields
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