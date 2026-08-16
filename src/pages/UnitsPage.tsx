import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, DoorOpen, Edit, Trash2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, FieldGroup } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import type { Unit } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusTone = { available: 'success', occupied: 'primary', maintenance: 'warning' } as const;

interface DbUnit {
  id: string;
  unit_number: string;
  floor: number;
  size: number;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  deposit: number;
  status: string;
  available_date: string;
  property_id: string;
}

function fromDb(r: DbUnit): Unit {
  return {
    id: r.id,
    unitNumber: r.unit_number,
    floor: Number(r.floor) || 1,
    size: Number(r.size) || 0,
    bedrooms: Number(r.bedrooms) || 0,
    bathrooms: Number(r.bathrooms) || 0,
    rent: Number(r.rent) || 0,
    deposit: Number(r.deposit) || 0,
    status: (r.status || 'available') as Unit['status'],
    availableDate: r.available_date ?? '',
    propertyId: r.property_id,
  };
}

function toDb(u: Unit) {
  return {
    unit_number: u.unitNumber.trim(),
    floor: Math.max(0, Number(u.floor) || 0),
    size: Math.max(0, Number(u.size) || 0),
    bedrooms: Math.max(0, Number(u.bedrooms) || 0),
    bathrooms: Math.max(0, Number(u.bathrooms) || 0),
    rent: Math.max(0, Number(u.rent) || 0),
    deposit: Math.max(0, Number(u.deposit) || 0),
    status: u.status,
    available_date: u.availableDate,
    property_id: u.propertyId,
  };
}

interface PropOpt { id: string; name: string }

export function UnitsPage() {
  const toast = useToast();
  const [data, setData] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<PropOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProp, setFilterProp] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: units, error: uErr }, { data: props, error: pErr }] = await Promise.all([
      supabase.from('units').select('*').order('created_at', { ascending: false }),
      supabase.from('properties').select('id, name').order('name', { ascending: true }),
    ]);
    if (uErr) toast.error('Failed to load units', uErr.message);
    if (pErr) toast.error('Failed to load properties', pErr.message);
    setData((units as DbUnit[] ?? []).map(fromDb));
    setProperties(props as PropOpt[] ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const propMap = useMemo(() => {
    const map = new Map<string, string>();
    properties.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [properties]);

  const propName = (id: string) => propMap.get(id) || '—';

  const filtered = useMemo(() => data.filter((u) => {
    if (search && !u.unitNumber.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterProp && u.propertyId !== filterProp) return false;
    if (filterStatus && u.status !== filterStatus) return false;
    return true;
  }), [data, search, filterProp, filterStatus]);

  const handleSave = async (u: Unit) => {
    if (!u.unitNumber.trim()) {
      toast.error('Validation Error', 'Unit number is required.');
      return;
    }
    const cleanPropId = u.propertyId?.trim();
    if (!cleanPropId || !properties.some((p) => p.id === cleanPropId)) {
      toast.error('Validation Error', 'Please select a valid property for this unit.');
      return;
    }

    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('units').update(toDb(u)).eq('id', u.id);
      if (error) toast.error('Failed to update', error.message);
      else { toast.success('Unit updated', `Unit ${u.unitNumber} updated.`); setModalOpen(false); fetchData(); }
    } else {
      const { error } = await supabase.from('units').insert(toDb(u));
      if (error) toast.error('Failed to add', error.message);
      else { toast.success('Unit added', `Unit ${u.unitNumber} created.`); setModalOpen(false); fetchData(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    // Safety check: check if unit is linked in active leases or maintenance tickets
    const [leasesRes, ticketsRes] = await Promise.all([
      supabase.from('leases').select('id').eq('unit_id', deleteTarget.id),
      supabase.from('maintenance_tickets').select('id').eq('unit_id', deleteTarget.id),
    ]);

    const leaseCount = leasesRes.data?.length || 0;
    const ticketCount = ticketsRes.data?.length || 0;

    if (leaseCount > 0) {
      toast.error(
        'Cannot delete unit',
        `Unit ${deleteTarget.unitNumber} is linked to ${leaseCount} lease(s). Please terminate or reassign the lease first.`
      );
      setDeleteTarget(null);
      return;
    }

    if (ticketCount > 0) {
      toast.error(
        'Cannot delete unit',
        `Unit ${deleteTarget.unitNumber} is linked to ${ticketCount} maintenance ticket(s). Please resolve or reassign the ticket first.`
      );
      setDeleteTarget(null);
      return;
    }

    const { error } = await supabase.from('units').delete().eq('id', deleteTarget.id);
    if (error) toast.error('Failed to delete', error.message);
    else { toast.success('Unit deleted', `Unit ${deleteTarget.unitNumber} removed.`); fetchData(); }
    setDeleteTarget(null);
  };

  const columns: Column<Unit>[] = [
    { key: 'unitNumber', header: 'Unit #', sortable: true, sortValue: (r) => r.unitNumber, render: (r) => <span className="font-medium">{r.unitNumber}</span> },
    { key: 'property', header: 'Property', sortable: true, sortValue: (r) => propName(r.propertyId), render: (r) => <span className="text-muted-foreground">{propName(r.propertyId)}</span> },
    { key: 'floor', header: 'Floor', sortable: true, sortValue: (r) => r.floor },
    { key: 'size', header: 'Size', sortable: true, sortValue: (r) => r.size, render: (r) => `${r.size} sqft` },
    { key: 'bedrooms', header: 'Beds', sortable: true, sortValue: (r) => r.bedrooms },
    { key: 'bathrooms', header: 'Baths', sortable: true, sortValue: (r) => r.bathrooms },
    { key: 'rent', header: 'Rent', sortable: true, sortValue: (r) => r.rent, render: (r) => <span className="font-semibold">{formatCurrency(r.rent)}</span> },
    { key: 'deposit', header: 'Deposit', sortable: true, sortValue: (r) => r.deposit, render: (r) => formatCurrency(r.deposit) },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, render: (r) => <Badge tone={statusTone[r.status]} dot>{r.status}</Badge> },
    { key: 'availableDate', header: 'Available', sortable: true, sortValue: (r) => r.availableDate, render: (r) => formatDate(r.availableDate, { month: 'short', day: 'numeric' }) },
    { key: 'actions', header: '', headerClassName: 'text-right', render: (r) => (
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(r)}><Trash2 className="h-4 w-4 text-danger" /></Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6 page-transition">
      <PageHeader
        title="Units"
        description={`${data.length} units across ${properties.length} properties`}
        actions={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Unit</Button>}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search units..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Select className="w-48" value={filterProp} onChange={(e) => setFilterProp(e.target.value)}>
            <option value="">All properties</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select className="w-36" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </Select>
        </div>
      </div>
      <Card>
        {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
          <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} onRowClick={(r) => { setEditing(r); setModalOpen(true); }} emptyIcon={<DoorOpen className="h-10 w-10 opacity-40" />} emptyMessage="No units found" />
        )}
      </Card>
      {modalOpen && <UnitFormModal unit={editing} properties={properties} onSave={handleSave} onClose={() => setModalOpen(false)} saving={saving} />}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete unit?" message={`This will permanently delete unit ${deleteTarget?.unitNumber}.`} confirmLabel="Delete" />
    </div>
  );
}

function UnitFormModal({ unit, properties, onSave, onClose, saving }: { unit: Unit | null; properties: PropOpt[]; onSave: (u: Unit) => void; onClose: () => void; saving: boolean }) {
  const [form, setForm] = useState<Unit>(() => {
    if (unit) {
      return {
        ...unit,
        propertyId: unit.propertyId || properties[0]?.id || '',
      };
    }
    return {
      id: '',
      unitNumber: '',
      floor: 1,
      size: 500,
      bedrooms: 1,
      bathrooms: 1,
      rent: 1000,
      deposit: 1000,
      status: 'available',
      availableDate: new Date().toISOString().slice(0, 10),
      propertyId: properties.length === 1 ? properties[0].id : (properties[0]?.id ?? ''),
    };
  });

  const update = (p: Partial<Unit>) => setForm((f) => ({ ...f, ...p }));
  const isValid = Boolean(form.unitNumber.trim() && form.propertyId && properties.some((p) => p.id === form.propertyId));

  return (
    <Modal
      open
      onClose={onClose}
      title={unit ? 'Edit Unit' : 'Add Unit'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!isValid || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : unit ? 'Save Changes' : 'Add Unit'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <FieldGroup label="Unit Number" required>
            <Input value={form.unitNumber} onChange={(e) => update({ unitNumber: e.target.value })} placeholder="e.g. 101" />
          </FieldGroup>
          <FieldGroup label="Property" required hint={properties.length === 0 ? 'No properties found in database' : undefined}>
            <Select value={form.propertyId} onChange={(e) => update({ propertyId: e.target.value })}>
              <option value="">Select Property</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="Floor">
            <Input type="number" min={0} value={form.floor} onChange={(e) => update({ floor: Number(e.target.value) })} />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FieldGroup label="Size (sqft)">
            <Input type="number" min={0} value={form.size} onChange={(e) => update({ size: Number(e.target.value) })} />
          </FieldGroup>
          <FieldGroup label="Bedrooms">
            <Input type="number" min={0} value={form.bedrooms} onChange={(e) => update({ bedrooms: Number(e.target.value) })} />
          </FieldGroup>
          <FieldGroup label="Bathrooms">
            <Input type="number" min={0} value={form.bathrooms} onChange={(e) => update({ bathrooms: Number(e.target.value) })} />
          </FieldGroup>
          <FieldGroup label="Status">
            <Select value={form.status} onChange={(e) => update({ status: e.target.value as Unit['status'] })}>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </Select>
          </FieldGroup>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FieldGroup label="Rent ($)">
            <Input type="number" min={0} value={form.rent} onChange={(e) => update({ rent: Number(e.target.value) })} />
          </FieldGroup>
          <FieldGroup label="Deposit ($)">
            <Input type="number" min={0} value={form.deposit} onChange={(e) => update({ deposit: Number(e.target.value) })} />
          </FieldGroup>
          <FieldGroup label="Available Date">
            <Input type="date" value={form.availableDate} onChange={(e) => update({ availableDate: e.target.value })} />
          </FieldGroup>
        </div>
      </div>
    </Modal>
  );
}
