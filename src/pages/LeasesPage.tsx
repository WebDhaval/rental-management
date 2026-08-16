import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, FileText, Edit, Trash2, Eye, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Textarea, FieldGroup, Label } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import type { Lease, LeaseStatus } from '@/lib/types';
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils';

const statusTone: Record<LeaseStatus, 'success' | 'warning' | 'neutral' | 'danger'> = {
  active: 'success',
  expiring: 'warning',
  terminated: 'danger',
  expired: 'neutral',
};

interface DbLease {
  id: string;
  lease_id?: string;
  property: string;
  property_id?: string;
  unit: string;
  unit_id?: string;
  tenant: string;
  tenant_id?: string;
  start_date: string;
  end_date: string;
  rent: number;
  deposit: number;
  status: string;
  terms?: string;
}

interface PropertyItem { id: string; name: string }
interface UnitItem { id: string; unit_number: string; property_id: string; rent: number; deposit: number }
interface TenantItem { id: string; name: string; email: string }

function fromDb(r: DbLease): Lease {
  return {
    id: r.id,
    leaseId: r.lease_id || `LSE-${r.id.slice(0, 4).toUpperCase()}`,
    property: r.property || '',
    propertyId: r.property_id || '',
    unit: r.unit || '',
    unitId: r.unit_id || '',
    tenant: r.tenant || '',
    tenantId: r.tenant_id || '',
    startDate: r.start_date || '',
    endDate: r.end_date || '',
    rent: Number(r.rent) || 0,
    deposit: Number(r.deposit) || 0,
    status: (r.status || 'active') as LeaseStatus,
    terms: r.terms || '',
  };
}

function toDb(l: Lease) {
  return {
    lease_id: l.leaseId,
    property: l.property,
    property_id: l.propertyId,
    unit: l.unit,
    unit_id: l.unitId,
    tenant: l.tenant,
    tenant_id: l.tenantId,
    start_date: l.startDate,
    end_date: l.endDate,
    rent: Math.max(0, Number(l.rent) || 0),
    deposit: Math.max(0, Number(l.deposit) || 0),
    status: l.status,
    terms: l.terms,
  };
}

export function LeasesPage() {
  const toast = useToast();
  const [data, setData] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lease | null>(null);
  const [viewing, setViewing] = useState<Lease | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lease | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [leasesRes, propsRes, unitsRes, tenantsRes] = await Promise.all([
      supabase.from('leases').select('*').order('created_at', { ascending: false }),
      supabase.from('properties').select('id, name').order('name', { ascending: true }),
      supabase.from('units').select('id, unit_number, property_id, rent, deposit'),
      supabase.from('tenants').select('id, name, email').order('name', { ascending: true }),
    ]);

    if (leasesRes.error) toast.error('Failed to load leases', leasesRes.error.message);
    else setData((leasesRes.data as DbLease[] ?? []).map(fromDb));

    setProperties(propsRes.data as PropertyItem[] ?? []);
    setUnits(unitsRes.data as UnitItem[] ?? []);
    setTenants(tenantsRes.data as TenantItem[] ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => data.filter((l) => {
    if (search && !l.tenant.toLowerCase().includes(search.toLowerCase()) && !l.property.toLowerCase().includes(search.toLowerCase()) && !l.leaseId.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && l.status !== filterStatus) return false;
    return true;
  }), [data, search, filterStatus]);

  const handleSave = async (l: Lease) => {
    if (!l.property.trim() || !l.unit.trim()) {
      toast.error('Validation Error', 'Property and Unit are required.');
      return;
    }
    if (!l.tenant.trim()) {
      toast.error('Validation Error', 'Tenant is required.');
      return;
    }
    if (!l.startDate || !l.endDate) {
      toast.error('Validation Error', 'Start and End dates are required.');
      return;
    }
    if (new Date(l.endDate) <= new Date(l.startDate)) {
      toast.error('Validation Error', 'End date must be after Start date.');
      return;
    }

    setSaving(true);
    const leaseData = {
      ...l,
      leaseId: l.leaseId || `LSE-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    if (editing) {
      const { error } = await supabase.from('leases').update(toDb(leaseData)).eq('id', l.id);
      if (error) toast.error('Failed to update lease', error.message);
      else { toast.success('Lease updated', `${leaseData.leaseId} updated.`); setModalOpen(false); fetchData(); }
    } else {
      const { error } = await supabase.from('leases').insert(toDb(leaseData));
      if (error) toast.error('Failed to create lease', error.message);
      else { toast.success('Lease created', `${leaseData.leaseId} created.`); setModalOpen(false); fetchData(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    // Safety check: check if payments are linked to this lease or tenant
    const { data: linkedPayments } = await supabase
      .from('payments')
      .select('id')
      .or(`lease_id.eq.${deleteTarget.id},tenant.eq.${deleteTarget.tenant}`);

    if (linkedPayments && linkedPayments.length > 0) {
      toast.error(
        'Cannot delete lease',
        `This lease has ${linkedPayments.length} associated payment records. Please archive or remove associated payments first.`
      );
      setDeleteTarget(null);
      return;
    }

    const { error } = await supabase.from('leases').delete().eq('id', deleteTarget.id);
    if (error) toast.error('Failed to delete lease', error.message);
    else { toast.success('Lease deleted', `${deleteTarget.leaseId} removed.`); fetchData(); }
    setDeleteTarget(null);
  };

  const expiringCount = data.filter((l) => l.status === 'expiring').length;

  const columns: Column<Lease>[] = [
    { key: 'leaseId', header: 'Lease ID', sortable: true, sortValue: (r) => r.leaseId, render: (r) => <span className="font-medium">{r.leaseId}</span> },
    {
      key: 'property', header: 'Property & Unit', sortable: true, sortValue: (r) => `${r.property} ${r.unit}`,
      render: (r) => (
        <div>
          <p className="font-medium">{r.property}</p>
          <p className="text-xs text-muted-foreground">Unit {r.unit}</p>
        </div>
      ),
    },
    { key: 'tenant', header: 'Tenant', sortable: true, sortValue: (r) => r.tenant, render: (r) => <span className="font-medium">{r.tenant}</span> },
    {
      key: 'dates', header: 'Period', sortable: true, sortValue: (r) => r.startDate,
      render: (r) => (
        <div className="text-xs">
          <p>{formatDate(r.startDate, { month: 'short', day: 'numeric', year: 'numeric' })} –</p>
          <p className="text-muted-foreground">{formatDate(r.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
      ),
    },
    { key: 'rent', header: 'Rent', sortable: true, sortValue: (r) => r.rent, render: (r) => <span className="font-semibold">{formatCurrency(r.rent)}/mo</span> },
    { key: 'deposit', header: 'Deposit', sortable: true, sortValue: (r) => r.deposit, render: (r) => formatCurrency(r.deposit) },
    {
      key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status,
      render: (r) => {
        const days = daysUntil(r.endDate);
        return (
          <div className="space-y-0.5">
            <Badge tone={statusTone[r.status]} dot>{r.status}</Badge>
            {r.status === 'expiring' && <p className="text-[10px] text-warning-600 font-medium">{days}d remaining</p>}
          </div>
        );
      },
    },
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
        title="Leases"
        description={`${data.length} total leases (${data.filter((l) => l.status === 'active').length} active)`}
        actions={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> New Lease</Button>}
      />

      {expiringCount > 0 && (
        <Card className="border-warning-200 bg-warning-50/50 dark:bg-warning-50/10 dark:border-warning-500/20">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-warning-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-warning-900 dark:text-warning-200">
                {expiringCount} lease{expiringCount > 1 ? 's are' : ' is'} expiring within 60 days
              </p>
              <p className="text-xs text-warning-700 dark:text-warning-300">Review and send renewal notices to tenants.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setFilterStatus('expiring')}>View Expiring</Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search leases..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select className="w-36" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring</option>
          <option value="expired">Expired</option>
          <option value="terminated">Terminated</option>
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
            emptyIcon={<FileText className="h-10 w-10 opacity-40" />}
            emptyMessage="No leases found"
          />
        )}
      </Card>

      {modalOpen && (
        <LeaseFormModal
          lease={editing}
          properties={properties}
          units={units}
          tenants={tenants}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
          saving={saving}
        />
      )}
      {viewing && <LeaseViewModal lease={viewing} onClose={() => setViewing(null)} onEdit={() => { setEditing(viewing); setViewing(null); setModalOpen(true); }} />}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete lease?" message={`This will permanently remove ${deleteTarget?.leaseId}.`} confirmLabel="Delete" />
    </div>
  );
}

function LeaseFormModal({
  lease,
  properties,
  units,
  tenants,
  onSave,
  onClose,
  saving,
}: {
  lease: Lease | null;
  properties: PropertyItem[];
  units: UnitItem[];
  tenants: TenantItem[];
  onSave: (l: Lease) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const initialProp = lease?.propertyId
    ? properties.find((p) => p.id === lease.propertyId)
    : properties.find((p) => p.name === lease?.property) ?? properties[0];

  const [selectedPropId, setSelectedPropId] = useState(initialProp?.id ?? '');

  const [form, setForm] = useState<Lease>(lease ?? {
    id: '',
    leaseId: '',
    property: initialProp?.name ?? '',
    propertyId: initialProp?.id ?? '',
    unit: '',
    unitId: '',
    tenant: tenants[0]?.name ?? '',
    tenantId: tenants[0]?.id ?? '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    rent: 1200,
    deposit: 1200,
    status: 'active',
    terms: 'Standard 12-month residential lease agreement. No smoking. Pets subject to owner approval.',
  });

  const availableUnitsForProp = useMemo(() => {
    if (!selectedPropId) return [];
    return units.filter((u) => u.property_id === selectedPropId);
  }, [units, selectedPropId]);

  const handlePropChange = (pId: string) => {
    setSelectedPropId(pId);
    const prop = properties.find((p) => p.id === pId);
    const propUnits = units.filter((u) => u.property_id === pId);
    const firstUnit = propUnits[0];

    setForm((f) => ({
      ...f,
      property: prop?.name ?? '',
      propertyId: pId,
      unit: firstUnit?.unit_number ?? '',
      unitId: firstUnit?.id ?? '',
      rent: firstUnit?.rent || f.rent,
      deposit: firstUnit?.deposit || f.deposit,
    }));
  };

  const handleUnitChange = (uId: string) => {
    const unitObj = availableUnitsForProp.find((u) => u.id === uId);
    setForm((f) => ({
      ...f,
      unit: unitObj?.unit_number ?? '',
      unitId: uId,
      rent: unitObj?.rent || f.rent,
      deposit: unitObj?.deposit || f.deposit,
    }));
  };

  const handleTenantChange = (tId: string) => {
    const tObj = tenants.find((t) => t.id === tId);
    setForm((f) => ({
      ...f,
      tenant: tObj?.name ?? '',
      tenantId: tId,
    }));
  };

  const update = (p: Partial<Lease>) => setForm((f) => ({ ...f, ...p }));

  return (
    <Modal
      open
      onClose={onClose}
      title={lease ? 'Edit Lease' : 'Create Lease'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!form.property || !form.unit || !form.tenant || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : lease ? 'Save' : 'Create Lease'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Property" required>
            <Select value={selectedPropId} onChange={(e) => handlePropChange(e.target.value)}>
              <option value="">Select Property</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="Unit" required>
            {availableUnitsForProp.length > 0 ? (
              <Select value={form.unitId || availableUnitsForProp.find((u) => u.unit_number === form.unit)?.id || ''} onChange={(e) => handleUnitChange(e.target.value)}>
                <option value="">Select Unit</option>
                {availableUnitsForProp.map((u) => <option key={u.id} value={u.id}>Unit {u.unit_number}</option>)}
              </Select>
            ) : (
              <Input
                value={form.unit}
                onChange={(e) => update({ unit: e.target.value })}
                placeholder="e.g. 101"
              />
            )}
          </FieldGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Tenant" required>
            <Select value={form.tenantId || tenants.find((t) => t.name === form.tenant)?.id || ''} onChange={(e) => handleTenantChange(e.target.value)}>
              <option value="">Select Tenant</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="Status">
            <Select value={form.status} onChange={(e) => update({ status: e.target.value as LeaseStatus })}>
              <option value="active">Active</option>
              <option value="expiring">Expiring</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
            </Select>
          </FieldGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Start Date" required>
            <Input type="date" value={form.startDate} onChange={(e) => update({ startDate: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="End Date" required>
            <Input type="date" value={form.endDate} onChange={(e) => update({ endDate: e.target.value })} />
          </FieldGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Monthly Rent ($)" required>
            <Input type="number" min={0} value={form.rent} onChange={(e) => update({ rent: Number(e.target.value) })} />
          </FieldGroup>
          <FieldGroup label="Security Deposit ($)">
            <Input type="number" min={0} value={form.deposit} onChange={(e) => update({ deposit: Number(e.target.value) })} />
          </FieldGroup>
        </div>

        <FieldGroup label="Terms & Conditions">
          <Textarea value={form.terms} onChange={(e) => update({ terms: e.target.value })} placeholder="Key lease terms and conditions..." />
        </FieldGroup>
      </div>
    </Modal>
  );
}

function LeaseViewModal({ lease, onClose, onEdit }: { lease: Lease; onClose: () => void; onEdit: () => void }) {
  return (
    <Modal open onClose={onClose} size="lg" title={`Lease ${lease.leaseId}`} description={`${lease.property} — Unit ${lease.unit}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold">{lease.tenant}</p>
            <p className="text-sm text-muted-foreground">{lease.property} · Unit {lease.unit}</p>
          </div>
          <Badge tone={statusTone[lease.status]} dot className="text-sm px-3 py-1">{lease.status}</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Monthly Rent</p><p className="text-lg font-bold mt-1">{formatCurrency(lease.rent)}</p></div>
          <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Deposit</p><p className="text-lg font-bold mt-1">{formatCurrency(lease.deposit)}</p></div>
          <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Start Date</p><p className="text-sm font-semibold mt-1">{formatDate(lease.startDate)}</p></div>
          <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">End Date</p><p className="text-sm font-semibold mt-1">{formatDate(lease.endDate)}</p></div>
        </div>
        {lease.terms && (
          <div>
            <Label>Terms & Conditions</Label>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{lease.terms}</p>
          </div>
        )}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onEdit}><Edit className="h-4 w-4" /> Edit Lease</Button>
        </div>
      </div>
    </Modal>
  );
}
