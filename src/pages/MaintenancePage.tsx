import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, Wrench, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Textarea, FieldGroup, Label } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { DonutChart } from '@/components/charts/Charts';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import type { MaintenanceTicket, MaintenanceStatus, Priority } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const statusTone: Record<MaintenanceStatus, 'info' | 'warning' | 'neutral' | 'success' | 'danger'> = {
  open: 'info',
  in_progress: 'warning',
  waiting_parts: 'neutral',
  completed: 'success',
  cancelled: 'danger',
};

const priorityTone: Record<Priority, 'neutral' | 'info' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

const categories = ['Plumbing', 'Electrical', 'HVAC', 'Appliance', 'General', 'Structural', 'Pest Control'];

interface DbTicket {
  id: string;
  ticket_id?: string;
  title: string;
  description: string;
  property: string;
  property_id?: string;
  unit: string;
  unit_id?: string;
  tenant: string;
  tenant_id?: string;
  category: string;
  priority: string;
  status: string;
  assigned_staff?: string;
  created_at?: string;
  resolved_at?: string;
}

interface PropertyItem { id: string; name: string }
interface UnitItem { id: string; unit_number: string; property_id: string }
interface TenantItem { id: string; name: string }
interface StaffItem { id: string; name: string; role: string }

function fromDb(r: DbTicket): MaintenanceTicket {
  return {
    id: r.id,
    ticketId: r.ticket_id || `TCK-${r.id.slice(0, 4).toUpperCase()}`,
    title: r.title,
    description: r.description || '',
    property: r.property,
    propertyId: r.property_id,
    unit: r.unit,
    unitId: r.unit_id,
    tenant: r.tenant,
    tenantId: r.tenant_id,
    category: r.category,
    priority: (r.priority || 'medium') as Priority,
    status: (r.status || 'open') as MaintenanceStatus,
    assignedStaff: r.assigned_staff || 'Unassigned',
    createdAt: r.created_at || new Date().toISOString().slice(0, 10),
    resolvedAt: r.resolved_at || undefined,
  };
}

function toDb(t: MaintenanceTicket) {
  return {
    ticket_id: t.ticketId,
    title: t.title.trim(),
    description: t.description.trim(),
    property: t.property,
    property_id: t.propertyId,
    unit: t.unit,
    unit_id: t.unitId,
    tenant: t.tenant,
    tenant_id: t.tenantId,
    category: t.category,
    priority: t.priority,
    status: t.status,
    assigned_staff: t.assignedStaff,
    created_at: t.createdAt,
    resolved_at: t.resolvedAt || null,
  };
}

export function MaintenancePage() {
  const toast = useToast();
  const [data, setData] = useState<MaintenanceTicket[]>([]);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceTicket | null>(null);
  const [viewing, setViewing] = useState<MaintenanceTicket | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceTicket | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [tckRes, propsRes, unitsRes, tenantsRes, staffRes] = await Promise.all([
      supabase.from('maintenance_tickets').select('*').order('created_at', { ascending: false }),
      supabase.from('properties').select('id, name').order('name', { ascending: true }),
      supabase.from('units').select('id, unit_number, property_id'),
      supabase.from('tenants').select('id, name').order('name', { ascending: true }),
      supabase.from('staff').select('id, name, role').order('name', { ascending: true }),
    ]);

    if (tckRes.error) toast.error('Failed to load tickets', tckRes.error.message);
    else setData((tckRes.data as DbTicket[] ?? []).map(fromDb));

    setProperties(propsRes.data as PropertyItem[] ?? []);
    setUnits(unitsRes.data as UnitItem[] ?? []);
    setTenants(tenantsRes.data as TenantItem[] ?? []);
    setStaffList(staffRes.data as StaffItem[] ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => data.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.ticketId.toLowerCase().includes(search.toLowerCase()) && !t.property.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  }), [data, search, filterStatus, filterPriority]);

  const chartData = useMemo(() => [
    { label: 'Open', value: data.filter((t) => t.status === 'open').length, color: 'hsl(217 91% 60%)' },
    { label: 'In Progress', value: data.filter((t) => t.status === 'in_progress').length, color: 'hsl(38 92% 50%)' },
    { label: 'Waiting Parts', value: data.filter((t) => t.status === 'waiting_parts').length, color: 'hsl(220 9% 46%)' },
    { label: 'Completed', value: data.filter((t) => t.status === 'completed').length, color: 'hsl(142 71% 45%)' },
  ], [data]);

  const handleSave = async (t: MaintenanceTicket) => {
    if (!t.title.trim()) {
      toast.error('Validation Error', 'Ticket title is required.');
      return;
    }
    if (!t.property.trim()) {
      toast.error('Validation Error', 'Property is required.');
      return;
    }

    setSaving(true);
    const ticketData = {
      ...t,
      ticketId: t.ticketId || `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: t.createdAt || new Date().toISOString().slice(0, 10),
      resolvedAt: t.status === 'completed' ? (t.resolvedAt || new Date().toISOString().slice(0, 10)) : undefined,
    };

    if (editing) {
      const { error } = await supabase.from('maintenance_tickets').update(toDb(ticketData)).eq('id', t.id);
      if (error) toast.error('Failed to update ticket', error.message);
      else { toast.success('Ticket updated', `${ticketData.ticketId} updated.`); setModalOpen(false); fetchData(); }
    } else {
      const { error } = await supabase.from('maintenance_tickets').insert(toDb(ticketData));
      if (error) toast.error('Failed to create ticket', error.message);
      else { toast.success('Ticket created', `${ticketData.ticketId} created.`); setModalOpen(false); fetchData(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('maintenance_tickets').delete().eq('id', deleteTarget.id);
    if (error) toast.error('Failed to delete ticket', error.message);
    else { toast.success('Ticket deleted', `${deleteTarget.ticketId} removed.`); fetchData(); }
    setDeleteTarget(null);
  };

  const columns: Column<MaintenanceTicket>[] = [
    { key: 'ticketId', header: 'Ticket ID', sortable: true, sortValue: (r) => r.ticketId, render: (r) => <span className="font-medium">{r.ticketId}</span> },
    { key: 'title', header: 'Title', sortable: true, sortValue: (r) => r.title, render: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'property', header: 'Property', sortable: true, sortValue: (r) => r.property, render: (r) => <span className="text-muted-foreground">{r.property}</span> },
    { key: 'unit', header: 'Unit', render: (r) => r.unit || '—' },
    { key: 'tenant', header: 'Tenant', render: (r) => <span className="text-muted-foreground">{r.tenant || '—'}</span> },
    { key: 'category', header: 'Category', sortable: true, sortValue: (r) => r.category, render: (r) => <Badge tone="neutral">{r.category}</Badge> },
    { key: 'priority', header: 'Priority', sortable: true, sortValue: (r) => r.priority, render: (r) => <Badge tone={priorityTone[r.priority]} dot>{r.priority}</Badge> },
    { key: 'assignedStaff', header: 'Assigned', render: (r) => <span className="text-muted-foreground">{r.assignedStaff}</span> },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, render: (r) => <Badge tone={statusTone[r.status]} dot>{r.status.replace('_', ' ')}</Badge> },
    { key: 'createdAt', header: 'Created', sortable: true, sortValue: (r) => r.createdAt, render: (r) => formatDate(r.createdAt, { month: 'short', day: 'numeric' }) },
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
        title="Maintenance"
        description={`${data.length} maintenance tickets`}
        actions={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> New Ticket</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(['open', 'in_progress', 'waiting_parts', 'completed', 'cancelled'] as MaintenanceStatus[]).map((s) => (
                <div key={s} className="rounded-xl border border-border p-3 text-center">
                  <p className="text-2xl font-bold">{data.filter((t) => t.status === s).length}</p>
                  <p className="text-xs text-muted-foreground capitalize">{s.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Status Breakdown</CardTitle></CardHeader>
          <CardContent><DonutChart data={chartData} centerValue={String(data.length)} centerLabel="Tickets" /></CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Select className="w-36" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_parts">Waiting Parts</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select className="w-36" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>
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
            emptyIcon={<Wrench className="h-10 w-10 opacity-40" />}
            emptyMessage="No tickets found"
          />
        )}
      </Card>

      {modalOpen && (
        <TicketFormModal
          ticket={editing}
          properties={properties}
          units={units}
          tenants={tenants}
          staffList={staffList}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
          saving={saving}
        />
      )}
      {viewing && <TicketViewModal ticket={viewing} onClose={() => setViewing(null)} onEdit={() => { setEditing(viewing); setViewing(null); setModalOpen(true); }} />}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete ticket?" message={`This will permanently remove ${deleteTarget?.ticketId}.`} confirmLabel="Delete" />
    </div>
  );
}

function TicketFormModal({
  ticket,
  properties,
  units,
  tenants,
  staffList,
  onSave,
  onClose,
  saving,
}: {
  ticket: MaintenanceTicket | null;
  properties: PropertyItem[];
  units: UnitItem[];
  tenants: TenantItem[];
  staffList: StaffItem[];
  onSave: (t: MaintenanceTicket) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const initialProp = ticket?.propertyId
    ? properties.find((p) => p.id === ticket.propertyId)
    : properties.find((p) => p.name === ticket?.property) ?? properties[0];

  const [selectedPropId, setSelectedPropId] = useState(initialProp?.id ?? '');

  const [form, setForm] = useState<MaintenanceTicket>(ticket ?? {
    id: '',
    ticketId: '',
    title: '',
    description: '',
    property: initialProp?.name ?? '',
    propertyId: initialProp?.id ?? '',
    unit: '',
    unitId: '',
    tenant: tenants[0]?.name ?? '',
    tenantId: tenants[0]?.id ?? '',
    category: 'Plumbing',
    priority: 'medium',
    status: 'open',
    assignedStaff: staffList[0]?.name ?? 'Unassigned',
    createdAt: new Date().toISOString().slice(0, 10),
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
    }));
  };

  const handleUnitChange = (uId: string) => {
    const unitObj = availableUnitsForProp.find((u) => u.id === uId);
    setForm((f) => ({
      ...f,
      unit: unitObj?.unit_number ?? '',
      unitId: uId,
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

  const update = (p: Partial<MaintenanceTicket>) => setForm((f) => ({ ...f, ...p }));

  return (
    <Modal
      open
      onClose={onClose}
      title={ticket ? 'Edit Ticket' : 'New Maintenance Ticket'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!form.title.trim() || !form.property || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : ticket ? 'Save' : 'Create Ticket'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldGroup label="Title" required>
          <Input value={form.title} onChange={(e) => update({ title: e.target.value })} placeholder="e.g. AC unit making strange noise" />
        </FieldGroup>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Property" required>
            <Select value={selectedPropId} onChange={(e) => handlePropChange(e.target.value)}>
              <option value="">Select Property</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="Unit">
            {availableUnitsForProp.length > 0 ? (
              <Select value={form.unitId || availableUnitsForProp.find((u) => u.unit_number === form.unit)?.id || ''} onChange={(e) => handleUnitChange(e.target.value)}>
                <option value="">Select Unit</option>
                {availableUnitsForProp.map((u) => <option key={u.id} value={u.id}>Unit {u.unit_number}</option>)}
              </Select>
            ) : (
              <Input value={form.unit} onChange={(e) => update({ unit: e.target.value })} placeholder="e.g. 101" />
            )}
          </FieldGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Tenant">
            <Select value={form.tenantId || tenants.find((t) => t.name === form.tenant)?.id || ''} onChange={(e) => handleTenantChange(e.target.value)}>
              <option value="">Select Tenant</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="Assigned Staff">
            <Select value={form.assignedStaff} onChange={(e) => update({ assignedStaff: e.target.value })}>
              <option value="Unassigned">Unassigned</option>
              {staffList.map((s) => <option key={s.id} value={s.name}>{s.name} ({s.role})</option>)}
            </Select>
          </FieldGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FieldGroup label="Category">
            <Select value={form.category} onChange={(e) => update({ category: e.target.value })}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="Priority">
            <Select value={form.priority} onChange={(e) => update({ priority: e.target.value as Priority })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </FieldGroup>
          <FieldGroup label="Status">
            <Select value={form.status} onChange={(e) => update({ status: e.target.value as MaintenanceStatus })}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_parts">Waiting Parts</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </FieldGroup>
        </div>

        <FieldGroup label="Description">
          <Textarea value={form.description} onChange={(e) => update({ description: e.target.value })} placeholder="Detailed problem description..." />
        </FieldGroup>
      </div>
    </Modal>
  );
}

function TicketViewModal({ ticket, onClose, onEdit }: { ticket: MaintenanceTicket; onClose: () => void; onEdit: () => void }) {
  return (
    <Modal open onClose={onClose} size="lg" title={ticket.ticketId} description={ticket.title}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge tone={priorityTone[ticket.priority]} dot>{ticket.priority} priority</Badge>
          <Badge tone={statusTone[ticket.status]} dot>{ticket.status.replace('_', ' ')}</Badge>
          <Badge tone="neutral">{ticket.category}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Property & Unit</p><p className="font-medium mt-1">{ticket.property} · Unit {ticket.unit || 'N/A'}</p></div>
          <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Tenant</p><p className="font-medium mt-1">{ticket.tenant || 'None'}</p></div>
          <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Assigned Staff</p><p className="font-medium mt-1">{ticket.assignedStaff || 'Unassigned'}</p></div>
          <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Created Date</p><p className="font-medium mt-1">{formatDate(ticket.createdAt)}</p></div>
        </div>
        <div><Label>Description</Label><p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{ticket.description || 'No description provided.'}</p></div>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onEdit}><Edit className="h-4 w-4" /> Edit Ticket</Button>
        </div>
      </div>
    </Modal>
  );
}
