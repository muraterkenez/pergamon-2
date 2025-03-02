-- Drop any existing parent tag constraints
ALTER TABLE IF EXISTS animals DROP CONSTRAINT IF EXISTS valid_parent_tags;
ALTER TABLE IF EXISTS animals DROP CONSTRAINT IF EXISTS valid_parent_tags_flexible;

-- Add a more flexible constraint for parent tags that allows 'Tohumlama'
ALTER TABLE animals ADD CONSTRAINT valid_parent_tags_flexible 
  CHECK (
    (mother_tag IS NULL OR mother_tag ~ '^[Tt][Rr][-]?\d{10,12}$' OR mother_tag = 'other' OR mother_tag = '' OR mother_tag = 'Tohumlama') AND
    (father_tag IS NULL OR father_tag ~ '^[Tt][Rr][-]?\d{10,12}$' OR father_tag = 'other' OR father_tag = '' OR father_tag = 'Tohumlama')
  );