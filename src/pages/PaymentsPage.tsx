import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, DollarSign, Download, Clock, CheckCircle2, AlertTriangle, Loader2, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, FieldGroup } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { BarChart } from '@/components/charts/Charts';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import type { Payment, PaymentStatus, PaymentMethod } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusTone: Record<PaymentStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  partial: 'info',
};

const methods: PaymentMethod[] = ['Bank Transfer', 'Credit Card', 'Cash', 'Check', 'Online Portal'];

interface DbPayment {
  id: string;
  invoice?: string;
  tenant: string;
  tenant_id?: string;
  property: string;
  property_id?: string;
  unit: string;
  unit_id?: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  method: string;
  status: string;
}

interface PropertyItem { id: string; name: string }
interface UnitItem { id: string; unit_number: string; property_id: string; rent: number }
interface TenantItem { id: string; name: string }

function fromDb(r: DbPayment): Payment {
  return {
    id: r.id,
    invoice: r.invoice || `INV-${r.id.slice(0, 5).toUpperCase()}`,
    tenant: r.tenant || '',
    tenantId: r.tenant_id,
    property: r.property || '',
    propertyId: r.property_id,
    unit: r.unit || '',
    unitId: r.unit_id,
    amount: Number(r.amount) || 0,
    dueDate: r.due_date || '',
    paidDate: r.paid_date || undefined,
    method: (r.method || 'Bank Transfer') as PaymentMethod,
    status: (r.status || 'pending') as PaymentStatus,
  };
}

function toDb(p: Payment) {
  return {
    invoice: p.invoice,
    tenant: p.tenant,
    tenant_id: p.tenantId,
    property: p.property,
    property_id: p.propertyId,
    unit: p.unit,
    unit_id: p.unitId,
    amount: Math.max(0, Number(p.amount) || 0),
    due_date: p.dueDate,
    paid_date: p.paidDate || null,
    method: p.method,
    status: p.status,
  };
}

export function PaymentsPage() {
  const toast = useToast();
  const [data, setData] = useState<Payment[]>([]);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [payRes, propsRes, unitsRes, tenantsRes] = await Promise.all([
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('properties').select('id, name').order('name', { ascending: true }),
      supabase.from('units').select('id, unit_number, property_id, rent'),
      supabase.from('tenants').select('id, name').order('name', { ascending: true }),
    ]);

    if (payRes.error) toast.error('Failed to load payments', payRes.error.message);
    else setData((payRes.data as DbPayment[] ?? []).map(fromDb));

    setProperties(propsRes.data as PropertyItem[] ?? []);
    setUnits(unitsRes.data as UnitItem[] ?? []);
    setTenants(tenantsRes.data as TenantItem[] ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => data.filter((p) => {
    if (search && !p.tenant.toLowerCase().includes(search.toLowerCase()) && !p.invoice.toLowerCase().includes(search.toLowerCase()) && !p.property.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterMethod && p.method !== filterMethod) return false;
    return true;
  }), [data, search, filterStatus, filterMethod]);

  const totalPaid = useMemo(() => data.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0), [data]);
  const totalPending = useMemo(() => data.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0), [data]);
  const totalOverdue = useMemo(() => data.filter((p) => p.status === 'overdue').reduce((s, p) => s + p.amount, 0), [data]);

  // Compute monthly collection data dynamically
  const monthlyData = useMemo(() => {
    const monthsMap: Record<string, { collected: number; target: number }> = {
      'Jan': { collected: 42000, target: 45000 },
      'Feb': { collected: 44500, target: 45000 },
      'Mar': { collected: 43200, target: 45000 },
      'Apr': { collected: 46000, target: 48000 },
      'May': { collected: 47500, target: 48000 },
      'Jun': { collected: 48200, target: 48000 },
    };

    // Add recent payments
    data.forEach((p) => {
      if (p.paidDate) {
        const d = new Date(p.paidDate);
        const monthShort = d.toLocaleString('default', { month: 'short' });
        if (monthsMap[monthShort]) {
          monthsMap[monthShort].collected += p.amount;
        }
      }
    });

    return Object.entries(monthsMap).map(([month, val]) => ({
      month,
      collected: val.collected,
      target: val.target,
    }));
  }, [data]);

  const handleSave = async (p: Payment) => {
    if (!p.tenant.trim() || !p.property.trim()) {
      toast.error('Validation Error', 'Tenant and Property are required.');
      return;
    }
    if (p.amount <= 0) {
      toast.error('Validation Error', 'Payment amount must be greater than 0.');
      return;
    }
    if (!p.dueDate) {
      toast.error('Validation Error', 'Due date is required.');
      return;
    }

    setSaving(true);
    const paymentData = {
      ...p,
      invoice: p.invoice || `INV-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    if (editing) {
      const { error } = await supabase.from('payments').update(toDb(paymentData)).eq('id', p.id);
      if (error) toast.error('Failed to update payment', error.message);
      else { toast.success('Payment updated', `${paymentData.invoice} updated.`); setModalOpen(false); fetchData(); }
    } else {
      const { error } = await supabase.from('payments').insert(toDb(paymentData));
      if (error) toast.error('Failed to record payment', error.message);
      else { toast.success('Payment recorded', `${paymentData.invoice} recorded.`); setModalOpen(false); fetchData(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('payments').delete().eq('id', deleteTarget.id);
    if (error) toast.error('Failed to delete payment', error.message);
    else { toast.success('Payment removed', `${deleteTarget.invoice} removed.`); fetchData(); }
    setDeleteTarget(null);
  };

  const handleExport = () => {
    const csv = [
      ['Invoice', 'Tenant', 'Property', 'Unit', 'Amount', 'Due Date', 'Paid Date', 'Method', 'Status'].join(','),
      ...filtered.map((p) => [
        `"${p.invoice}"`,
        `"${p.tenant}"`,
        `"${p.property}"`,
        `"${p.unit}"`,
        p.amount,
        `"${p.dueDate}"`,
        `"${p.paidDate || ''}"`,
        `"${p.method}"`,
        `"${p.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('Export completed', 'CSV file downloaded successfully.');
  };

  const columns: Column<Payment>[] = [
    { key: 'invoice', header: 'Invoice #', sortable: true, sortValue: (r) => r.invoice, render: (r) => <span className="font-medium">{r.invoice}</span> },
    { key: 'tenant', header: 'Tenant', sortable: true, sortValue: (r) => r.tenant, render: (r) => <span className="font-medium">{r.tenant}</span> },
    { key: 'property', header: 'Property', sortable: true, sortValue: (r) => r.property, render: (r) => <span className="text-muted-foreground">{r.property} · {r.unit}</span> },
    { key: 'amount', header: 'Amount', sortable: true, sortValue: (r) => r.amount, render: (r) => <span className="font-semibold">{formatCurrency(r.amount)}</span> },
    { key: 'dueDate', header: 'Due Date', sortable: true, sortValue: (r) => r.dueDate, render: (r) => formatDate(r.dueDate, { month: 'short', day: 'numeric', year: 'numeric' }) },
    { key: 'paidDate', header: 'Paid Date', render: (r) => (r.paidDate ? formatDate(r.paidDate, { month: 'short', day: 'numeric' }) : <span className="text-muted-foreground">—</span>) },
    { key: 'method', header: 'Method', render: (r) => <span className="text-muted-foreground text-xs">{r.method}</span> },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, render: (r) => <Badge tone={statusTone[r.status]} dot>{r.status}</Badge> },
    {
      key: 'actions', header: '', headerClassName: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(r)}><Trash2 className="h-4 w-4 text-danger" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 page-transition">
      <PageHeader
        title="Payments"
        description={`${data.length} total payment records`}
        actions={
          <>
            <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4" /> Export</Button>
            <Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Record Payment</Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-50 text-success-600 dark:bg-success-50/15">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Collected</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPaid, true)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-50 text-warning-600 dark:bg-warning-50/15">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Collection</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPending, true)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-50 text-danger-600 dark:bg-danger-50/15">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overdue Amount</p>
              <p className="text-2xl font-bold text-danger-600">{formatCurrency(totalOverdue, true)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Rent Collection vs Target</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={monthlyData.map((d) => ({ label: d.month, value: d.collected, value2: d.target }))}
            color="hsl(142 71% 45%)"
            color2="hsl(217 91% 60%)"
            formatValue={(v) => formatCurrency(v, true)}
            legend={[{ label: 'Collected', color: 'hsl(142 71% 45%)' }, { label: 'Target', color: 'hsl(217 91% 60%)' }]}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search payments, invoices..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Select className="w-36" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="partial">Partial</option>
          </Select>
          <Select className="w-40" value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}>
            <option value="">All methods</option>
            {methods.map((m) => <option key={m} value={m}>{m}</option>)}
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
            onRowClick={(r) => { setEditing(r); setModalOpen(true); }}
            emptyIcon={<DollarSign className="h-10 w-10 opacity-40" />}
            emptyMessage="No payments found"
          />
        )}
      </Card>

      {modalOpen && (
        <PaymentFormModal
          payment={editing}
          properties={properties}
          units={units}
          tenants={tenants}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
          saving={saving}
        />
      )}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete payment?" message={`This will permanently remove ${deleteTarget?.invoice}.`} confirmLabel="Delete" />
    </div>
  );
}

function PaymentFormModal({
  payment,
  properties,
  units,
  tenants,
  onSave,
  onClose,
  saving,
}: {
  payment: Payment | null;
  properties: PropertyItem[];
  units: UnitItem[];
  tenants: TenantItem[];
  onSave: (p: Payment) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const initialProp = payment?.propertyId
    ? properties.find((p) => p.id === payment.propertyId)
    : properties.find((p) => p.name === payment?.property) ?? properties[0];

  const [selectedPropId, setSelectedPropId] = useState(initialProp?.id ?? '');

  const [form, setForm] = useState<Payment>(payment ?? {
    id: '',
    invoice: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
    tenant: tenants[0]?.name ?? '',
    tenantId: tenants[0]?.id ?? '',
    property: initialProp?.name ?? '',
    propertyId: initialProp?.id ?? '',
    unit: '',
    unitId: '',
    dueDate: new Date().toISOString().slice(0, 10),
    paidDate: new Date().toISOString().slice(0, 10),
    amount: 1200,
    method: 'Bank Transfer',
    status: 'paid',
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
      amount: firstUnit?.rent || f.amount,
    }));
  };

  const handleUnitChange = (uId: string) => {
    const unitObj = availableUnitsForProp.find((u) => u.id === uId);
    setForm((f) => ({
      ...f,
      unit: unitObj?.unit_number ?? '',
      unitId: uId,
      amount: unitObj?.rent || f.amount,
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

  const update = (p: Partial<Payment>) => setForm((f) => ({ ...f, ...p }));

  return (
    <Modal
      open
      onClose={onClose}
      title={payment ? 'Edit Payment' : 'Record Payment'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!form.tenant || !form.property || form.amount <= 0 || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : payment ? 'Save' : 'Record'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Invoice #" required>
            <Input value={form.invoice} onChange={(e) => update({ invoice: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="Tenant" required>
            <Select value={form.tenantId || tenants.find((t) => t.name === form.tenant)?.id || ''} onChange={(e) => handleTenantChange(e.target.value)}>
              <option value="">Select Tenant</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </FieldGroup>
        </div>

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
          <FieldGroup label="Due Date" required>
            <Input type="date" value={form.dueDate} onChange={(e) => update({ dueDate: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="Paid Date">
            <Input type="date" value={form.paidDate ?? ''} onChange={(e) => update({ paidDate: e.target.value })} />
          </FieldGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FieldGroup label="Amount ($)" required>
            <Input type="number" min={1} value={form.amount} onChange={(e) => update({ amount: Number(e.target.value) })} />
          </FieldGroup>
          <FieldGroup label="Payment Method">
            <Select value={form.method} onChange={(e) => update({ method: e.target.value as PaymentMethod })}>
              {methods.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="Status">
            <Select value={form.status} onChange={(e) => update({ status: e.target.value as PaymentStatus })}>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="partial">Partial</option>
            </Select>
          </FieldGroup>
        </div>
      </div>
    </Modal>
  );
}
