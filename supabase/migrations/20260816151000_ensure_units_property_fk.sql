/*
# Fix #2: Property -> Unit Relationship Enforcement

1. Ensures foreign key reference on `units.property_id` to `properties(id)`
2. Adds index on `units(property_id)` for high performance lookups and filtering
*/

-- 1. Index on units.property_id
CREATE INDEX IF NOT EXISTS idx_units_property_id ON units(property_id);

-- 2. Ensure property_id column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'units' AND column_name = 'property_id'
  ) THEN
    ALTER TABLE units ADD COLUMN property_id uuid REFERENCES properties(id) ON DELETE RESTRICT;
  END IF;
END $$;
