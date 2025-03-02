/*
  # Fix parent tags constraint for Tohumlama option

  1. Changes
    - Modifies the valid_parent_tags_flexible constraint to allow 'Tohumlama' as a valid value for father_tag
    - This enables artificial insemination to be properly recorded in the system
*/

-- Drop the existing constraint
ALTER TABLE IF EXISTS animals DROP CONSTRAINT IF EXISTS valid_parent_tags_flexible;

-- Add a more flexible constraint for parent tags that allows 'Tohumlama'
ALTER TABLE animals ADD CONSTRAINT valid_parent_tags_flexible 
  CHECK (
    (mother_tag IS NULL OR mother_tag ~ '^[Tt][Rr][-]?\d{10,12}$' OR mother_tag = 'other' OR mother_tag = '') AND
    (father_tag IS NULL OR father_tag ~ '^[Tt][Rr][-]?\d{10,12}$' OR father_tag = 'other' OR father_tag = '' OR father_tag = 'Tohumlama')
  );