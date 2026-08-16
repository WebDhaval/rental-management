/*
# Create all remaining tables for EstateHub

1. Purpose
   - Creates tables for units, tenants, owners, leases, payments, maintenance_tickets,
     staff, and documents — all the modules that currently only use in-memory state.

2. New Tables
   - `units` — individual rental units within properties
   - `tenants` — tenant profiles
   - `owners` — property owners
   - `leases` — lease agreements
   - `payments` — rent payment records
   - `maintenance_tickets` — maintenance request tickets
   - `staff` — staff members with roles
   - `documents` — uploaded documents

3. Security
   - RLS enabled on every table.
   - All policies scoped to `authenticated` (the app has a login screen).
   - Any authenticated staff member can read, insert, update, and delete rows
     (shared operational data across the admin team).

4. Indexes
   - Added on commonly filtered columns (status, property_id, tenant, etc.)
*/

-- ============ UNITS ============
CREATE TABLE IF NOT EXISTS units (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number   text NOT NULL,
  floor         integer NOT NULL DEFAULT 1,
  size          integer NOT NULL DEFAULT 0,
  bedrooms      integer NOT NULL DEFAULT 0,
  bathrooms     integer NOT NULL DEFAULT 0,
  rent          integer NOT NULL DEFAULT 0,
  deposit       integer NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'available',
  available_date date,
  property_id   uuid REFERENCES properties(id) ON DELETE CASCADE,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_units" ON units;
CREATE POLICY "auth_select_units" ON units FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_units" ON units;
CREATE POLICY "auth_insert_units" ON units FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_units" ON units;
CREATE POLICY "auth_update_units" ON units FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_units" ON units;
CREATE POLICY "auth_delete_units" ON units FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_units_property ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);

-- ============ TENANTS ============
CREATE TABLE IF NOT EXISTS tenants (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  email            text NOT NULL DEFAULT '',
  phone            text NOT NULL DEFAULT '',
  emergency_contact text DEFAULT '',
  address          text DEFAULT '',
  national_id      text DEFAULT '',
  occupation       text DEFAULT '',
  company          text DEFAULT '',
  notes            text DEFAULT '',
  photo            text DEFAULT '',
  registered_at    date NOT NULL DEFAULT CURRENT_DATE,
  status           text NOT NULL DEFAULT 'active',
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_tenants" ON tenants;
CREATE POLICY "auth_select_tenants" ON tenants FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_tenants" ON tenants;
CREATE POLICY "auth_insert_tenants" ON tenants FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_tenants" ON tenants;
CREATE POLICY "auth_update_tenants" ON tenants FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_tenants" ON tenants;
CREATE POLICY "auth_delete_tenants" ON tenants FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- ============ OWNERS ============
CREATE TABLE IF NOT EXISTS owners (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  company          text DEFAULT '',
  email            text NOT NULL DEFAULT '',
  phone            text DEFAULT '',
  address          text DEFAULT '',
  tax_number       text DEFAULT '',
  bank_details     text DEFAULT '',
  properties_owned integer NOT NULL DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_owners" ON owners;
CREATE POLICY "auth_select_owners" ON owners FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_owners" ON owners;
CREATE POLICY "auth_insert_owners" ON owners FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_owners" ON owners;
CREATE POLICY "auth_update_owners" ON owners FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_owners" ON owners;
CREATE POLICY "auth_delete_owners" ON owners FOR DELETE TO authenticated USING (true);

-- ============ LEASES ============
CREATE TABLE IF NOT EXISTS leases (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number           text NOT NULL,
  tenant           text NOT NULL DEFAULT '',
  property         text NOT NULL DEFAULT '',
  unit             text NOT NULL DEFAULT '',
  start_date       date NOT NULL,
  end_date         date NOT NULL,
  monthly_rent     integer NOT NULL DEFAULT 0,
  security_deposit integer NOT NULL DEFAULT 0,
  due_date         integer NOT NULL DEFAULT 1,
  status           text NOT NULL DEFAULT 'active',
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_leases" ON leases;
CREATE POLICY "auth_select_leases" ON leases FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_leases" ON leases;
CREATE POLICY "auth_insert_leases" ON leases FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_leases" ON leases;
CREATE POLICY "auth_update_leases" ON leases FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_leases" ON leases;
CREATE POLICY "auth_delete_leases" ON leases FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_leases_status ON leases(status);

-- ============ PAYMENTS ============
CREATE TABLE IF NOT EXISTS payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice     text NOT NULL,
  tenant      text NOT NULL DEFAULT '',
  property    text NOT NULL DEFAULT '',
  unit        text NOT NULL DEFAULT '',
  due_date    date NOT NULL,
  paid_date   date,
  amount      integer NOT NULL DEFAULT 0,
  method      text NOT NULL DEFAULT 'Bank Transfer',
  status      text NOT NULL DEFAULT 'pending',
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_payments" ON payments;
CREATE POLICY "auth_select_payments" ON payments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_payments" ON payments;
CREATE POLICY "auth_insert_payments" ON payments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_payments" ON payments;
CREATE POLICY "auth_update_payments" ON payments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_payments" ON payments;
CREATE POLICY "auth_delete_payments" ON payments FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============ MAINTENANCE_TICKETS ============
CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       text NOT NULL,
  property        text NOT NULL DEFAULT '',
  unit            text NOT NULL DEFAULT '',
  tenant          text NOT NULL DEFAULT '',
  category        text NOT NULL DEFAULT 'General',
  priority        text NOT NULL DEFAULT 'medium',
  assigned_staff  text NOT NULL DEFAULT '',
  status          text NOT NULL DEFAULT 'open',
  created_at      date NOT NULL DEFAULT CURRENT_DATE,
  title           text NOT NULL DEFAULT '',
  description     text DEFAULT '',
  inserted_at    timestamptz DEFAULT now()
);
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_maintenance" ON maintenance_tickets;
CREATE POLICY "auth_select_maintenance" ON maintenance_tickets FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_maintenance" ON maintenance_tickets;
CREATE POLICY "auth_insert_maintenance" ON maintenance_tickets FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_maintenance" ON maintenance_tickets;
CREATE POLICY "auth_update_maintenance" ON maintenance_tickets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_maintenance" ON maintenance_tickets;
CREATE POLICY "auth_delete_maintenance" ON maintenance_tickets FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_maint_status ON maintenance_tickets(status);
CREATE INDEX IF NOT EXISTS idx_maint_priority ON maintenance_tickets(priority);

-- ============ STAFF ============
CREATE TABLE IF NOT EXISTS staff (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL DEFAULT '',
  phone       text DEFAULT '',
  role        text NOT NULL DEFAULT 'Property Manager',
  status      text NOT NULL DEFAULT 'active',
  avatar      text DEFAULT '',
  joined_at   date NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_staff" ON staff;
CREATE POLICY "auth_select_staff" ON staff FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_staff" ON staff;
CREATE POLICY "auth_insert_staff" ON staff FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_staff" ON staff;
CREATE POLICY "auth_update_staff" ON staff FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_staff" ON staff;
CREATE POLICY "auth_delete_staff" ON staff FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);

-- ============ DOCUMENTS ============
CREATE TABLE IF NOT EXISTS documents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  type         text NOT NULL DEFAULT 'Property Document',
  size         text NOT NULL DEFAULT '0 KB',
  uploaded_at  date NOT NULL DEFAULT CURRENT_DATE,
  uploaded_by  text NOT NULL DEFAULT '',
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_documents" ON documents;
CREATE POLICY "auth_select_documents" ON documents FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_documents" ON documents;
CREATE POLICY "auth_insert_documents" ON documents FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_documents" ON documents;
CREATE POLICY "auth_update_documents" ON documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_documents" ON documents;
CREATE POLICY "auth_delete_documents" ON documents FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_docs_type ON documents(type);
