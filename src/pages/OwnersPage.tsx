import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Eye, UserCog, Mail, Phone, MapPin, Building, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Input, Textarea, FieldGroup, Label } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import type { Owner } from '@/lib/types';

interface DbOwner {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  tax_number: string;
  gstin?: string | null;
  bank_details: string;
  properties_owned: number;
}

interface DbPropertyMini {
  id: string;
  name: string;
  owner_id?: string;
  owner?: string;
}

function fromDb(r: DbOwner, count: number): Owner {
  return {
    id: r.id,
    name: r.name,
    company: r.company || '',
    email: r.email || '',
    phone: r.phone || '',
    address: r.address || '',
    taxNumber: r.tax_number || '',
    gstin: r.gstin || '',
    bankDetails: r.bank_details || '',
    propertiesOwned: count,
  };
}

function toDb(o: Owner) {
  return {
    name: o.name.trim(),
    company: o.company.trim(),
    email: o.email.trim(),
    phone: o.phone.trim(),
    address: o.address.trim(),
    tax_number: o.taxNumber.trim(),
    gstin: o.gstin && o.gstin.trim() ? o.gstin.trim().toUpperCase() : null,
    bank_details: o.bankDetails.trim(),
    properties_owned: o.propertiesOwned,
  };
}

export function OwnersPage() {
  const toast = useToast();
  const [data, setData] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Owner | null>(null);
  const [viewing, setViewing] = useState<Owner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Owner | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [ownersRes, propsRes] = await Promise.all([
      supabase.from('owners').select('*').order('created_at', { ascending: false }),
      supabase.from('properties').select('id, name, owner_id, owner'),
    ]);

    if (ownersRes.error) {
      toast.error('Failed to load owners', ownersRes.error.message);
    } else {
      const allProps = (propsRes.data as DbPropertyMini[] ?? []);
      const ownersList = (ownersRes.data as DbOwner[] ?? []).map((o) => {
        const matchingProps = allProps.filter((p) => p.owner_id === o.id || p.owner === o.name);
        return fromDb(o, matchingProps.length || o.properties_owned || 0);
      });
      setData(ownersList);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => data.filter((o) => (
    !search ||
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.company.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase())
  )), [data, search]);

  const handleSave = async (o: Owner) => {
    if (!o.name.trim()) {
      toast.error('Validation Error', 'Owner name is required.');
      return;
    }
    if (!o.email.trim() || !o.email.includes('@')) {
      toast.error('Validation Error', 'A valid email is required.');
      return;
    }

    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('owners').update(toDb(o)).eq('id', o.id);
      if (error) {
        toast.error('Failed to update owner', error.message);
      } else {
        toast.success('Owner updated', `${o.name} has been updated.`);
        setModalOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('owners').insert(toDb(o));
      if (error) {
        toast.error('Failed to add owner', error.message);
      } else {
        toast.success('Owner added', `${o.name} has been added.`);
        setModalOpen(false);
        fetchData();
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    // Safety check: check if any properties are registered under this owner
    const { data: linkedProps } = await supabase
      .from('properties')
      .select('id, name')
      .or(`owner_id.eq.${deleteTarget.id},owner.eq.${deleteTarget.name}`);

    if (linkedProps && linkedProps.length > 0) {
      toast.error(
        'Cannot delete owner',
        `${deleteTarget.name} currently owns ${linkedProps.length} propert(ies). Please reassign or delete these properties first.`
      );
      setDeleteTarget(null);
      return;
    }

    const { error } = await supabase.from('owners').delete().eq('id', deleteTarget.id);
    if (error) {
      toast.error('Failed to delete owner', error.message);
    } else {
      toast.success('Owner deleted', `${deleteTarget.name} has been removed.`);
      fetchData();
    }
    setDeleteTarget(null);
  };

  const columns: Column<Owner>[] = [
    {
      key: 'name', header: 'Owner', sortable: true, sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} size="md" />
          <div className="min-w-0">
            <p className="font-medium truncate">{r.name}</p>
            <p className="text-xs text-muted-foreground truncate">{r.company || 'Private Owner'}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (r) => <span className="text-muted-foreground">{r.email}</span> },
    { key: 'phone', header: 'Phone', render: (r) => <span className="text-muted-foreground">{r.phone || '—'}</span> },
    { key: 'taxNumber', header: 'PAN', render: (r) => <span className="text-muted-foreground">{r.taxNumber || '—'}</span> },
    { key: 'propertiesOwned', header: 'Properties', sortable: true, sortValue: (r) => r.propertiesOwned, render: (r) => <Badge tone="primary">{r.propertiesOwned} owned</Badge> },
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
        title="Owners"
        description={`${data.length} property owners`}
        actions={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Owner</Button>}
      />
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search owners..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
            emptyIcon={<UserCog className="h-10 w-10 opacity-40" />}
            emptyMessage="No owners found"
          />
        )}
      </Card>
      {modalOpen && <OwnerFormModal owner={editing} onSave={handleSave} onClose={() => setModalOpen(false)} saving={saving} />}
      {viewing && <OwnerViewModal owner={viewing} onClose={() => setViewing(null)} onEdit={() => { setEditing(viewing); setViewing(null); setModalOpen(true); }} />}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete owner?" message={`This will permanently remove ${deleteTarget?.name}.`} confirmLabel="Delete" />
    </div>
  );
}

function OwnerFormModal({ owner, onSave, onClose, saving }: { owner: Owner | null; onSave: (o: Owner) => void; onClose: () => void; saving: boolean }) {
  const [form, setForm] = useState<Owner>(
    owner ?? {
      id: '',
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      taxNumber: '',
      gstin: '',
      bankDetails: '',
      propertiesOwned: 0,
    }
  );
  const update = (p: Partial<Owner>) => setForm((f) => ({ ...f, ...p }));
  return (
    <Modal
      open
      onClose={onClose}
      title={owner ? 'Edit Owner' : 'Add Owner'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!form.name.trim() || !form.email.trim() || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : owner ? 'Save' : 'Add Owner'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Full Name" required><Input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Robert Chen" /></FieldGroup>
          <FieldGroup label="Company"><Input value={form.company} onChange={(e) => update({ company: e.target.value })} placeholder="e.g. Skyline Holdings LLC" /></FieldGroup>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Email" required><Input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} placeholder="owner@domain.com" /></FieldGroup>
          <FieldGroup label="Phone"><Input value={form.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="+91 98765 43210" /></FieldGroup>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Address"><Input value={form.address} onChange={(e) => update({ address: e.target.value })} placeholder="Street address, City, PIN Code" /></FieldGroup>
          <FieldGroup label="PAN"><Input value={form.taxNumber} onChange={(e) => update({ taxNumber: e.target.value.toUpperCase() })} placeholder="e.g. ABCDE1234F" /></FieldGroup>
        </div>
        <FieldGroup label="GSTIN (Optional for businesses)">
          <Input value={form.gstin || ''} onChange={(e) => update({ gstin: e.target.value.toUpperCase() })} placeholder="e.g. 29ABCDE1234F1Z5" />
        </FieldGroup>
        <FieldGroup label="Bank Details"><Textarea value={form.bankDetails} onChange={(e) => update({ bankDetails: e.target.value })} placeholder="Bank Name, Account Holder Name, Account Number, IFSC Code (e.g. SBIN0001234)..." /></FieldGroup>
      </div>
    </Modal>
  );
}

function OwnerViewModal({ owner, onClose, onEdit }: { owner: Owner; onClose: () => void; onEdit: () => void }) {
  const [properties, setProperties] = useState<{ id: string; name: string; city: string; rent: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('properties')
      .select('id, name, city, rent')
      .or(`owner_id.eq.${owner.id},owner.eq.${owner.name}`)
      .then(({ data }: { data: { id: string; name: string; city: string; rent: number }[] | null }) => {
        setProperties(data ?? []);
        setLoading(false);
      });
  }, [owner.id, owner.name]);

  return (
    <Modal open onClose={onClose} size="xl" title="Owner Profile" description={owner.name}>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar name={owner.name} size="lg" />
          <div>
            <h3 className="text-lg font-semibold">{owner.name}</h3>
            <p className="text-sm text-muted-foreground">{owner.company || 'Individual Owner'}</p>
            <Badge tone="primary" className="mt-1">{properties.length} Properties Owned</Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {owner.email}</div>
          <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {owner.phone || '—'}</div>
          <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /> {owner.address || '—'}</div>
          <div className="flex items-center gap-2 text-sm"><Building className="h-4 w-4 text-muted-foreground" /> PAN: {owner.taxNumber || '—'}</div>
          {owner.gstin && (
            <div className="flex items-center gap-2 text-sm col-span-full"><Building className="h-4 w-4 text-muted-foreground" /> GSTIN: {owner.gstin}</div>
          )}
        </div>
        {owner.bankDetails && (
          <div>
            <Label>Bank Details</Label>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{owner.bankDetails}</p>
          </div>
        )}
        <div>
          <Label>Owned Properties</Label>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading properties...</p>
          ) : properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">No properties currently registered under this owner.</p>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border mt-2">
              {properties.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground">{p.city}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onEdit}><Edit className="h-4 w-4" /> Edit Owner</Button>
        </div>
      </div>
    </Modal>
  );
}
