/*
# Create properties table

1. Purpose
   - Stores all rental properties managed by EstateHub.
   - Each row is one property (apartment complex, house, villa, etc.) with its
     details: name, type, address, rent, bedrooms, bathrooms, status, occupancy,
     images, amenities, rules, description, and metadata.

2. New Tables
   - `properties`
     - `id`            uuid, primary key (default gen_random_uuid)
     - `name`          text, not null — display name of the property
     - `type`           text, not null — one of: Apartment, House, Villa, Condo, Townhouse, Studio, Commercial
     - `address`        text, not null — street address
     - `city`           text, not null — city + state
     - `owner`          text, not null — owner name
     - `rent`           integer, not null, default 0 — monthly rent in dollars
     - `bedrooms`       integer, not null, default 0
     - `bathrooms`      integer, not null, default 0
     - `status`         text, not null, default 'available' — available | occupied | maintenance | vacant
     - `occupancy`       integer, not null, default 0 — percentage 0–100
     - `image`           text, default '' — main image URL
     - `gallery`         text[], default '{}' — array of image URLs
     - `manager`         text, default '' — assigned manager name
     - `amenities`       text[], default '{}' — list of amenity names
     - `rules`          text[], default '{}' — list of rule strings
     - `description`    text, default '' — free-form description
     - `units_count`    integer, not null, default 1
     - `archived`       boolean, not null, default false
     - `created_at`     timestamptz, default now()

3. Security
   - Enable RLS on `properties`.
   - The app has a sign-in screen (Supabase email/password auth), so policies
     are scoped to `authenticated` users only.
   - Any authenticated staff member can read, insert, update, and delete
     properties (shared operational data across the admin team).

4. Indexes
   - `idx_properties_status` on `status` for filter queries.
   - `idx_properties_city` on `city` for filter queries.
*/

CREATE TABLE IF NOT EXISTS properties (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  type        text NOT NULL DEFAULT 'Apartment',
  address     text NOT NULL,
  city        text NOT NULL,
  owner       text NOT NULL,
  rent        integer NOT NULL DEFAULT 0,
  bedrooms    integer NOT NULL DEFAULT 0,
  bathrooms   integer NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'available',
  occupancy   integer NOT NULL DEFAULT 0,
  image       text DEFAULT '',
  gallery     text[] DEFAULT '{}',
  manager     text DEFAULT '',
  amenities   text[] DEFAULT '{}',
  rules       text[] DEFAULT '{}',
  description text DEFAULT '',
  units_count integer NOT NULL DEFAULT 1,
  archived    boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Any authenticated staff member can read all properties
DROP POLICY IF EXISTS "authenticated_select_properties" ON properties;
CREATE POLICY "authenticated_select_properties"
  ON properties FOR SELECT
  TO authenticated USING (true);

-- Any authenticated staff member can insert properties
DROP POLICY IF EXISTS "authenticated_insert_properties" ON properties;
CREATE POLICY "authenticated_insert_properties"
  ON properties FOR INSERT
  TO authenticated WITH CHECK (true);

-- Any authenticated staff member can update properties
DROP POLICY IF EXISTS "authenticated_update_properties" ON properties;
CREATE POLICY "authenticated_update_properties"
  ON properties FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Any authenticated staff member can delete properties
DROP POLICY IF EXISTS "authenticated_delete_properties" ON properties;
CREATE POLICY "authenticated_delete_properties"
  ON properties FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
