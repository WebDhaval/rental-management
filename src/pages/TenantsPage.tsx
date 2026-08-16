import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Users, FileText, CreditCard, Wrench, Phone, Mail, MapPin, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Input, Select, Textarea, FieldGroup, Label } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import type { Tenant } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface DbTenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  emergency_contact: string;
  address: string;
  national_id: string;
  occupation: string;
  company: string;
  notes: string;
  photo: string;
  registered_at: string;
  status: string;
}

function fromDb(r: DbTenant): Tenant {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone || '',
    emergencyContact: r.emergency_contact || '',
    address: r.address || '',
    nationalId: r.national_id || '',
    occupation: r.occupation || '',
    company: r.company || '',
    notes: r.notes || '',
    photo: r.photo || '',
    registeredAt: r.registered_at || new Date().toISOString().slice(0, 10),
    status: (r.status || 'active') as Tenant['status'],
  };
}

function toDb(t: Tenant) {
  return {
    name: t.name.trim(),
    email: t.email.trim(),
    phone: t.phone.trim(),
    emergency_contact: t.emergencyContact.trim(),
    address: t.address.trim(),
    national_id: t.nationalId.trim(),
    occupation: t.occupation.trim(),
    company: t.company.trim(),
    notes: t.notes.trim(),
    photo: t.photo || '',
    registered_at: t.registeredAt,
    status: t.status,
  };
}

export function TenantsPage() {
  const toast = useToast();
  const [data, setData] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [viewing, setViewing] = useState<Tenant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load tenants', error.message);
    } else {
      setData((rows as DbTenant[] ?? []).map(fromDb));
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => data.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  }), [data, search, filterStatus]);

  const handleSave = async (t: Tenant) => {
    if (!t.name.trim()) {
      toast.error('Validation Error', 'Tenant name is required.');
      return;
    }
    if (!t.email.trim() || !t.email.includes('@')) {
      toast.error('Validation Error', 'A valid email is required.');
      return;
    }

    setSaving(true);
    const payload = toDb({ ...t, registeredAt: t.registeredAt || new Date().toISOString().slice(0, 10) });
    if (editing) {
      const { error } = await supabase.from('tenants').update(payload).eq('id', t.id);
      if (error) {
        toast.error('Failed to update tenant', error.message);
      } else {
        toast.success('Tenant updated', `${t.name} has been updated.`);
        setModalOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('tenants').insert(payload);
      if (error) {
        toast.error('Failed to add tenant', error.message);
      } else {
        toast.success('Tenant registered', `${t.name} has been registered.`);
        setModalOpen(false);
        fetchData();
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    // Safety check: check if tenant has active leases or tickets
    const [leasesRes, ticketsRes] = await Promise.all([
      supabase.from('leases').select('id').or(`tenant_id.eq.${deleteTarget.id},tenant.eq.${deleteTarget.name}`),
      supabase.from('maintenance_tickets').select('id').or(`tenant_id.eq.${deleteTarget.id},tenant.eq.${deleteTarget.name}`),
    ]);

    const leaseCount = leasesRes.data?.length || 0;
    const ticketCount = ticketsRes.data?.length || 0;

    if (leaseCount > 0) {
      toast.error(
        'Cannot delete tenant',
        `Tenant ${deleteTarget.name} has ${leaseCount} associated lease agreement(s). Please terminate or remove the lease first.`
      );
      setDeleteTarget(null);
      return;
    }

    if (ticketCount > 0) {
      toast.error(
        'Cannot delete tenant',
        `Tenant ${deleteTarget.name} has ${ticketCount} associated maintenance ticket(s). Please resolve or reassign the ticket first.`
      );
      setDeleteTarget(null);
      return;
    }

    const { error } = await supabase.from('tenants').delete().eq('id', deleteTarget.id);
    if (error) {
      toast.error('Failed to delete tenant', error.message);
    } else {
      toast.success('Tenant removed', `${deleteTarget.name} has been removed.`);
      fetchData();
    }
    setDeleteTarget(null);
  };

  const columns: Column<Tenant>[] = [
    {
      key: 'name', header: 'Tenant', sortable: true, sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} size="md" />
          <div className="min-w-0">
            <p className="font-medium truncate">{r.name}</p>
            <p className="text-xs text-muted-foreground truncate">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (r) => <span className="text-muted-foreground">{r.phone || '—'}</span> },
    { key: 'occupation', header: 'Occupation', sortable: true, sortValue: (r) => r.occupation, render: (r) => <span className="text-muted-foreground">{r.occupation || '—'}</span> },
    { key: 'company', header: 'Company', render: (r) => <span className="text-muted-foreground">{r.company || '—'}</span> },
    { key: 'registeredAt', header: 'Joined', sortable: true, sortValue: (r) => r.registeredAt, render: (r) => formatDate(r.registeredAt, { month: 'short', day: 'numeric', year: 'numeric' }) },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, render: (r) => <Badge tone={r.status === 'active' ? 'success' : 'neutral'} dot>{r.status}</Badge> },
    {
      key: 'actions', header: '', headerClassName: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => setViewing(r)}><Eye className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(r)}><Trash2 className="h-4 w-4 text-danger" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 page-transition">
      <PageHeader
        title="Tenants"
        description={`${data.length} tenants in the system`}
        actions={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Tenant</Button>}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search tenants..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select className="w-36" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(r) => r.id}
            onRowClick={(r) => setViewing(r)}
            emptyIcon={<Users className="h-10 w-10 opacity-40" />}
            emptyMessage="No tenants found"
          />
        )}
      </Card>
      {modalOpen && <TenantFormModal tenant={editing} onSave={handleSave} onClose={() => setModalOpen(false)} saving={saving} />}
      {viewing && <TenantViewModal tenant={viewing} onClose={() => setViewing(null)} onEdit={() => { setEditing(viewing); setViewing(null); setModalOpen(true); }} />}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete tenant?" message={`This will permanently remove ${deleteTarget?.name}.`} confirmLabel="Delete" />
    </div>
  );
}

function TenantFormModal({ tenant, onSave, onClose, saving }: { tenant: Tenant | null; onSave: (t: Tenant) => void; onClose: () => void; saving: boolean }) {
  const [form, setForm] = useState<Tenant>(tenant ?? {
    id: '',
    name: '',
    email: '',
    phone: '',
    emergencyContact: '',
    address: '',
    nationalId: '',
    occupation: '',
    company: '',
    notes: '',
    photo: '',
    registeredAt: new Date().toISOString().slice(0, 10),
    status: 'active',
  });

  const update = (p: Partial<Tenant>) => setForm((f) => ({ ...f, ...p }));

  return (
    <Modal
      open
      onClose={onClose}
      title={tenant ? 'Edit Tenant' : 'Add Tenant'}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!form.name.trim() || !form.email.trim() || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tenant ? 'Save' : 'Add Tenant'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Full Name" required><Input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="John Doe" /></FieldGroup>
          <FieldGroup label="Email" required><Input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} placeholder="john@email.com" /></FieldGroup>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Phone"><Input value={form.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="(555) 123-4567" /></FieldGroup>
          <FieldGroup label="Emergency Contact"><Input value={form.emergencyContact} onChange={(e) => update({ emergencyContact: e.target.value })} placeholder="Name (phone)" /></FieldGroup>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Address"><Input value={form.address} onChange={(e) => update({ address: e.target.value })} placeholder="Current address" /></FieldGroup>
          <FieldGroup label="National ID"><Input value={form.nationalId} onChange={(e) => update({ nationalId: e.target.value })} placeholder="XXX-XX-XXXX" /></FieldGroup>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Occupation"><Input value={form.occupation} onChange={(e) => update({ occupation: e.target.value })} placeholder="Software Engineer" /></FieldGroup>
          <FieldGroup label="Company"><Input value={form.company} onChange={(e) => update({ company: e.target.value })} placeholder="Company name" /></FieldGroup>
        </div>
        <FieldGroup label="Status">
          <Select value={form.status} onChange={(e) => update({ status: e.target.value as Tenant['status'] })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FieldGroup>
        <FieldGroup label="Notes"><Textarea value={form.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="Additional notes..." /></FieldGroup>
      </div>
    </Modal>
  );
}

function TenantViewModal({ tenant, onClose, onEdit }: { tenant: Tenant; onClose: () => void; onEdit: () => void }) {
  const [counts, setCounts] = useState({ leases: 0, payments: 0, maintenance: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('leases').select('id').or(`tenant_id.eq.${tenant.id},tenant.eq.${tenant.name}`),
      supabase.from('payments').select('id').or(`tenant_id.eq.${tenant.id},tenant.eq.${tenant.name}`),
      supabase.from('maintenance_tickets').select('id').or(`tenant_id.eq.${tenant.id},tenant.eq.${tenant.name}`),
    ]).then(([leasesRes, paymentsRes, maintenanceRes]) => {
      setCounts({
        leases: leasesRes.data?.length || 0,
        payments: paymentsRes.data?.length || 0,
        maintenance: maintenanceRes.data?.length || 0,
      });
    });
  }, [tenant.id, tenant.name]);

  return (
    <Modal open onClose={onClose} size="xl" title="Tenant Profile" description={tenant.name}>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar name={tenant.name} size="lg" />
          <div>
            <h3 className="text-lg font-semibold">{tenant.name}</h3>
            <p className="text-sm text-muted-foreground">{tenant.occupation ? `${tenant.occupation} ${tenant.company ? `at ${tenant.company}` : ''}` : 'Tenant'}</p>
            <Badge tone={tenant.status === 'active' ? 'success' : 'neutral'} dot className="mt-1">{tenant.status}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {tenant.email}</div>
          <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {tenant.phone || '—'}</div>
          <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /> {tenant.address || '—'}</div>
          <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-muted-foreground" /> Emergency: {tenant.emergencyContact || '—'}</div>
        </div>
        {tenant.notes && <div><Label>Notes</Label><p className="text-sm text-muted-foreground">{tenant.notes}</p></div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><FileText className="h-4 w-4" /> Leases</div><p className="text-2xl font-bold">{counts.leases}</p></div>
          <div className="rounded-xl border border-border p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><CreditCard className="h-4 w-4" /> Payments</div><p className="text-2xl font-bold">{counts.payments}</p></div>
          <div className="rounded-xl border border-border p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><Wrench className="h-4 w-4" /> Maintenance</div><p className="text-2xl font-bold">{counts.maintenance}</p></div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-4"><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={onEdit}><Edit className="h-4 w-4" /> Edit</Button></div>
      </div>
    </Modal>
  );
}
