/*
# Add optional GSTIN column to owners table

1. Purpose
   - Adds nullable `gstin` text column to `owners` table to support optional GST identification for business owners.
   - Safe migration: nullable column, does not drop or rename any existing columns or data.
*/

ALTER TABLE owners ADD COLUMN IF NOT EXISTS gstin text;
