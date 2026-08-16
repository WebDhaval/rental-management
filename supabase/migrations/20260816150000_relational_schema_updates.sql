/*
# Relational Schema Updates & Foreign Keys for EstateHub

1. Purpose
   - Adds relational UUID foreign keys across modules:
     - `properties.owner_id` -> `owners(id)`
     - `leases.tenant_id`, `leases.property_id`, `leases.unit_id`
     - `payments.tenant_id`, `payments.property_id`, `payments.unit_id`
     - `maintenance_tickets.property_id`, `maintenance_tickets.unit_id`, `maintenance_tickets.tenant_id`, `maintenance_tickets.assigned_staff_id`
     - `documents.property_id`, `documents.tenant_id`, `documents.owner_id`
   - Adds tables for `notifications` and `activities`
   - Safe migration script to link existing data by matching names to IDs without data loss.

2. Security & RLS
   - Maintains authenticated policies on all tables.
*/

-- 1. PROPERTIES -> OWNER_ID
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES owners(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);

-- Safe migration: link properties to owners by name or email
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'owners') THEN
    UPDATE properties p
    SET owner_id = o.id
    FROM owners o
    WHERE p.owner_id IS NULL AND (p.owner = o.name OR p.owner = o.email);
  END IF;
END $$;

-- 2. LEASES -> RELATIONAL FOREIGN KEYS
ALTER TABLE leases ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE RESTRICT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id) ON DELETE RESTRICT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES units(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_leases_tenant_id ON leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_property_id ON leases(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_unit_id ON leases(unit_id);

-- Safe migration for leases
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    UPDATE leases l SET tenant_id = t.id FROM tenants t WHERE l.tenant_id IS NULL AND l.tenant = t.name;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties') THEN
    UPDATE leases l SET property_id = p.id FROM properties p WHERE l.property_id IS NULL AND l.property = p.name;
  END IF;
END $$;

-- 3. PAYMENTS -> RELATIONAL FOREIGN KEYS
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE RESTRICT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id) ON DELETE RESTRICT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES units(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_property_id ON payments(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_unit_id ON payments(unit_id);

-- 4. MAINTENANCE_TICKETS -> RELATIONAL FOREIGN KEYS
ALTER TABLE maintenance_tickets ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id) ON DELETE RESTRICT;
ALTER TABLE maintenance_tickets ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES units(id) ON DELETE RESTRICT;
ALTER TABLE maintenance_tickets ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE RESTRICT;
ALTER TABLE maintenance_tickets ADD COLUMN IF NOT EXISTS assigned_staff_id uuid REFERENCES staff(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_prop_id ON maintenance_tickets(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_unit_id ON maintenance_tickets(unit_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant_id ON maintenance_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_staff_id ON maintenance_tickets(assigned_staff_id);

-- 5. DOCUMENTS -> RELATIONAL FOREIGN KEYS
ALTER TABLE documents ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id) ON DELETE SET NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES owners(id) ON DELETE SET NULL;

-- 6. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  message    text NOT NULL,
  type       text NOT NULL DEFAULT 'rent_due',
  read       boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_notifications" ON notifications;
CREATE POLICY "auth_select_notifications" ON notifications FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_notifications" ON notifications;
CREATE POLICY "auth_insert_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_notifications" ON notifications;
CREATE POLICY "auth_update_notifications" ON notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_notifications" ON notifications;
CREATE POLICY "auth_delete_notifications" ON notifications FOR DELETE TO authenticated USING (true);

-- 7. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS activities (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor      text NOT NULL DEFAULT 'System',
  action     text NOT NULL DEFAULT '',
  target     text NOT NULL DEFAULT '',
  time       timestamptz DEFAULT now(),
  type       text NOT NULL DEFAULT 'update',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_activities" ON activities;
CREATE POLICY "auth_select_activities" ON activities FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_activities" ON activities;
CREATE POLICY "auth_insert_activities" ON activities FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_activities" ON activities;
CREATE POLICY "auth_update_activities" ON activities FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_activities" ON activities;
CREATE POLICY "auth_delete_activities" ON activities FOR DELETE TO authenticated USING (true);
