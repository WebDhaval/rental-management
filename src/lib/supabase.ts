import { createClient } from '@supabase/supabase-js';
import {
  properties as initialProperties,
  units as initialUnits,
  tenants as initialTenants,
  owners as initialOwners,
  leases as initialLeases,
  payments as initialPayments,
  maintenanceTickets as initialMaintenanceTickets,
  staff as initialStaff,
  documents as initialDocuments,
  notifications as initialNotifications,
  activities as initialActivities,
  calendarEvents as initialCalendarEvents,
} from './mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.trim().length > 0 &&
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.trim().length > 0 &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('http');

type DbRecord = Record<string, unknown>;

// Helper to seed initial table records from mockData into db formats
function getInitialTableData(table: string): DbRecord[] {
  const now = new Date().toISOString();
  if (table === 'properties') {
    return initialProperties.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      address: p.address,
      city: p.city,
      owner_id: p.ownerId || (p.owner === 'Robert Chen' ? 'o1' : p.owner === 'Emily Rodriguez' ? 'o2' : 'o3'),
      owner: p.owner,
      rent: p.rent,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      status: p.status,
      occupancy: p.occupancy,
      image: p.image,
      gallery: p.gallery,
      manager: p.manager || '',
      amenities: p.amenities,
      rules: p.rules,
      description: p.description,
      units_count: p.unitsCount,
      archived: p.archived ?? false,
      created_at: now,
    }));
  }
  if (table === 'units') {
    return initialUnits.map((u) => ({
      id: u.id,
      unit_number: u.unitNumber,
      floor: u.floor,
      size: u.size,
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms,
      rent: u.rent,
      deposit: u.deposit,
      status: u.status,
      available_date: u.availableDate,
      property_id: u.propertyId,
      created_at: now,
    }));
  }
  if (table === 'tenants') {
    return initialTenants.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      emergency_contact: t.emergencyContact,
      address: t.address,
      national_id: t.nationalId,
      occupation: t.occupation,
      company: t.company,
      notes: t.notes,
      photo: t.photo,
      registered_at: t.registeredAt,
      status: t.status,
      created_at: now,
    }));
  }
  if (table === 'owners') {
    return initialOwners.map((o) => ({
      id: o.id,
      name: o.name,
      company: o.company,
      email: o.email,
      phone: o.phone,
      address: o.address,
      tax_number: o.taxNumber,
      gstin: o.gstin || null,
      bank_details: o.bankDetails,
      properties_owned: o.propertiesOwned,
      created_at: now,
    }));
  }
  if (table === 'leases') {
    return initialLeases.map((l) => ({
      id: l.id,
      number: l.number,
      tenant_id: l.tenantId || '',
      property_id: l.propertyId || '',
      unit_id: l.unitId || '',
      tenant: l.tenant,
      property: l.property,
      unit: l.unit,
      start_date: l.startDate,
      end_date: l.endDate,
      monthly_rent: l.monthlyRent,
      security_deposit: l.securityDeposit,
      due_date: l.dueDate,
      status: l.status,
      created_at: now,
    }));
  }
  if (table === 'payments') {
    return initialPayments.map((p) => ({
      id: p.id,
      invoice: p.invoice,
      tenant_id: p.tenantId || '',
      property_id: p.propertyId || '',
      unit_id: p.unitId || '',
      tenant: p.tenant,
      property: p.property,
      unit: p.unit,
      due_date: p.dueDate,
      paid_date: p.paidDate,
      amount: p.amount,
      method: p.method,
      status: p.status,
      created_at: now,
    }));
  }
  if (table === 'maintenance_tickets') {
    return initialMaintenanceTickets.map((m) => ({
      id: m.id,
      ticket_id: m.ticketId,
      property_id: m.propertyId || '',
      unit_id: m.unitId || '',
      tenant_id: m.tenantId || '',
      assigned_staff_id: m.assignedStaffId || '',
      property: m.property,
      unit: m.unit,
      tenant: m.tenant,
      category: m.category,
      priority: m.priority,
      assigned_staff: m.assignedStaff,
      status: m.status,
      title: m.title,
      description: m.description,
      created_at: m.createdAt,
    }));
  }
  if (table === 'staff') {
    return initialStaff.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      role: s.role,
      status: s.status,
      avatar: s.avatar,
      joined_at: s.joinedAt,
      created_at: now,
    }));
  }
  if (table === 'documents') {
    return initialDocuments.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      size: d.size,
      uploaded_at: d.uploadedAt,
      uploaded_by: d.uploadedBy,
      property_id: d.propertyId || '',
      tenant_id: d.tenantId || '',
      owner_id: d.ownerId || '',
      created_at: now,
    }));
  }
  if (table === 'notifications') {
    return initialNotifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      created_at: n.createdAt,
    }));
  }
  if (table === 'activities') {
    return initialActivities.map((a) => ({
      id: a.id,
      actor: a.actor,
      action: a.action,
      target: a.target,
      time: a.time,
      type: a.type,
      created_at: a.time || now,
    }));
  }
  if (table === 'calendar_events') {
    return initialCalendarEvents.map((c) => ({
      id: c.id,
      title: c.title,
      date: c.date,
      type: c.type,
      property: c.property,
      created_at: now,
    }));
  }
  return [];
}

// In-Memory / LocalStorage Mock Client for seamless offline and demo experience
class LocalStorageDatabase {
  private getStorageKey(table: string) {
    return `estatehub_db_${table}`;
  }

  getTable(table: string): DbRecord[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey(table));
      if (raw) {
        return JSON.parse(raw) as DbRecord[];
      }
    } catch {
      // ignore JSON parse error
    }
    const initial = getInitialTableData(table);
    this.setTable(table, initial);
    return initial;
  }

  setTable(table: string, data: DbRecord[]) {
    try {
      localStorage.setItem(this.getStorageKey(table), JSON.stringify(data));
    } catch {
      // storage full or disabled
    }
  }
}

const localDb = new LocalStorageDatabase();

interface QueryFilter {
  column: string;
  op: 'eq' | 'neq' | 'in';
  value: unknown;
}

class MockQueryBuilder {
  private tableName: string;
  private filters: QueryFilter[] = [];
  private orderColumn: string | null = null;
  private orderAscending = true;
  private limitCount: number | null = null;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: unknown = null;

  constructor(table: string) {
    this.tableName = table;
  }

  select(_columns?: string) {
    void _columns;
    this.action = 'select';
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderColumn = column;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ column, op: 'neq', value });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ column, op: 'in', value: values });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  insert(values: DbRecord | DbRecord[]) {
    this.action = 'insert';
    this.payload = values;
    return this;
  }

  update(values: DbRecord) {
    this.action = 'update';
    this.payload = values;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  async single() {
    const result = await this.execute();
    return {
      data: Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : null,
      error: result.error,
    };
  }

  async maybeSingle() {
    const result = await this.execute();
    return {
      data: Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : null,
      error: result.error,
    };
  }

  then<TResult1 = { data: unknown; error: { message: string } | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<{ data: unknown; error: { message: string } | null }> {
    const items = localDb.getTable(this.tableName);

    if (this.action === 'select') {
      let filtered = [...items];
      for (const filter of this.filters) {
        if (filter.op === 'eq') {
          filtered = filtered.filter((item) => String(item[filter.column]) === String(filter.value));
        } else if (filter.op === 'neq') {
          filtered = filtered.filter((item) => String(item[filter.column]) !== String(filter.value));
        } else if (filter.op === 'in' && Array.isArray(filter.value)) {
          const valSet = new Set(filter.value.map(String));
          filtered = filtered.filter((item) => valSet.has(String(item[filter.column])));
        }
      }
      if (this.orderColumn) {
        const col = this.orderColumn;
        const asc = this.orderAscending;
        filtered.sort((a, b) => {
          const valA = a[col];
          const valB = b[col];
          if (typeof valA === 'number' && typeof valB === 'number') {
            return asc ? valA - valB : valB - valA;
          }
          const strA = String(valA ?? '');
          const strB = String(valB ?? '');
          if (strA < strB) return asc ? -1 : 1;
          if (strA > strB) return asc ? 1 : -1;
          return 0;
        });
      }
      if (this.limitCount !== null) {
        filtered = filtered.slice(0, this.limitCount);
      }
      return { data: filtered, error: null };
    }

    if (this.action === 'insert') {
      const records = Array.isArray(this.payload) ? (this.payload as DbRecord[]) : [this.payload as DbRecord];
      const newItems = records.map((r, i) => ({
        id: (r.id as string) || `${this.tableName[0]}_${Date.now()}_${i}`,
        created_at: (r.created_at as string) || new Date().toISOString(),
        ...r,
      }));
      const updated = [...newItems, ...items];
      localDb.setTable(this.tableName, updated);
      return { data: Array.isArray(this.payload) ? newItems : newItems[0], error: null };
    }

    if (this.action === 'update') {
      const updateData = this.payload as DbRecord;
      const updated = items.map((item) => {
        const matches = this.filters.every((f) => {
          if (f.op === 'eq') return String(item[f.column]) === String(f.value);
          if (f.op === 'neq') return String(item[f.column]) !== String(f.value);
          return true;
        });
        if (matches) {
          return { ...item, ...updateData };
        }
        return item;
      });
      localDb.setTable(this.tableName, updated);
      return { data: updateData, error: null };
    }

    if (this.action === 'delete') {
      const remaining = items.filter((item) => {
        return !this.filters.every((f) => {
          if (f.op === 'eq') return String(item[f.column]) === String(f.value);
          if (f.op === 'neq') return String(item[f.column]) !== String(f.value);
          return true;
        });
      });
      localDb.setTable(this.tableName, remaining);
      return { data: null, error: null };
    }

    return { data: null, error: null };
  }
}

// Mock Auth
const AUTH_USER_KEY = 'estatehub_auth_user';

interface MockAuthUser {
  id: string;
  email: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  aud: string;
  created_at: string;
}

function getStoredMockUser(): MockAuthUser {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (raw) return JSON.parse(raw) as MockAuthUser;
  } catch {
    // ignore
  }
  const defaultUser: MockAuthUser = {
    id: 'usr_demo_admin',
    email: 'admin@estatehub.com',
    app_metadata: {},
    user_metadata: { name: 'Demo Administrator' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(defaultUser));
  } catch {
    // ignore
  }
  return defaultUser;
}

type AuthCallback = (event: string, session: unknown) => void;
const authListeners: Set<AuthCallback> = new Set();

const mockAuth = {
  async getSession() {
    const user = getStoredMockUser();
    return {
      data: {
        session: {
          access_token: 'mock-jwt-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user,
        },
      },
      error: null,
    };
  },
  async getUser() {
    return { data: { user: getStoredMockUser() }, error: null };
  },
  onAuthStateChange(callback: AuthCallback) {
    authListeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            authListeners.delete(callback);
          },
        },
      },
    };
  },
  async signInWithPassword({ email }: { email: string; password?: string }) {
    const user: MockAuthUser = {
      id: `usr_${Date.now()}`,
      email,
      app_metadata: {},
      user_metadata: { name: email.split('@')[0] || 'User' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
    const session = {
      access_token: 'mock-jwt-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user,
    };
    authListeners.forEach((cb) => cb('SIGNED_IN', session));
    return { data: { user, session }, error: null };
  },
  async signUp({ email }: { email: string; password?: string }) {
    return this.signInWithPassword({ email });
  },
  async signOut() {
    try {
      localStorage.removeItem(AUTH_USER_KEY);
    } catch {
      // ignore
    }
    authListeners.forEach((cb) => cb('SIGNED_OUT', null));
    return { error: null };
  },
};

// Create or Mock Supabase Client
function createSupabaseInstance() {
  if (isSupabaseConfigured) {
    try {
      return createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storage: window.localStorage,
        },
      });
    } catch (e) {
      console.warn('[AI Studio] Supabase client init failed, using mock client fallback:', e);
    }
  }

  return {
    auth: mockAuth,
    from: (table: string) => new MockQueryBuilder(table),
    storage: {
      from: () => ({
        upload: async (uploadPath: string) => ({ data: { path: uploadPath }, error: null }),
        getPublicUrl: (publicPath: string) => ({ data: { publicUrl: publicPath } }),
      }),
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any = createSupabaseInstance();
