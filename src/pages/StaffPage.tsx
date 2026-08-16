import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Shield, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Input, Select, FieldGroup } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import type { Staff, StaffRole } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const roles: StaffRole[] = ['Super Admin', 'Property Manager', 'Accountant', 'Maintenance Staff', 'Receptionist'];

const roleTone: Record<StaffRole, 'danger' | 'primary' | 'success' | 'warning' | 'neutral'> = {
  'Super Admin': 'danger',
  'Property Manager': 'primary',
  'Accountant': 'success',
  'Maintenance Staff': 'warning',
  'Receptionist': 'neutral',
};

const rolePermissions: Record<StaffRole, string[]> = {
  'Super Admin': ['Full system access', 'Manage all properties', 'Manage staff & roles', 'View all reports', 'Configure settings'],
  'Property Manager': ['Manage assigned properties', 'View tenant info', 'Create leases', 'Assign maintenance', 'View reports'],
  'Accountant': ['View payments', 'Record payments', 'Generate financial reports', 'View owner info'],
  'Maintenance Staff': ['View assigned tickets', 'Update ticket status', 'View property info'],
  'Receptionist': ['View tenant info', 'Register tenants', 'Schedule visits'],
};

interface DbStaff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  joined_at?: string;
  status: string;
}

function fromDb(r: DbStaff): Staff {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone || '',
    role: (r.role || 'Property Manager') as StaffRole,
    avatar: r.avatar,
    joinedAt: r.joined_at || new Date().toISOString().slice(0, 10),
    status: (r.status || 'active') as Staff['status'],
  };
}

function toDb(s: Staff) {
  return {
    name: s.name.trim(),
    email: s.email.trim(),
    phone: s.phone.trim(),
    role: s.role,
    avatar: s.avatar || null,
    joined_at: s.joinedAt,
    status: s.status,
  };
}

export function StaffPage() {
  const toast = useToast();
  const [data, setData] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
  const [viewingRole, setViewingRole] = useState<StaffRole | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from('staff').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Failed to load staff', error.message);
    else setData((rows as DbStaff[] ?? []).map(fromDb));
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => data.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRole && s.role !== filterRole) return false;
    return true;
  }), [data, search, filterRole]);

  const handleSave = async (s: Staff) => {
    if (!s.name.trim()) {
      toast.error('Validation Error', 'Staff name is required.');
      return;
    }
    if (!s.email.trim() || !s.email.includes('@')) {
      toast.error('Validation Error', 'A valid email is required.');
      return;
    }

    setSaving(true);
    const staffData = {
      ...s,
      joinedAt: s.joinedAt || new Date().toISOString().slice(0, 10),
    };

    if (editing) {
      const { error } = await supabase.from('staff').update(toDb(staffData)).eq('id', s.id);
      if (error) toast.error('Failed to update staff', error.message);
      else { toast.success('Staff updated', `${s.name} updated.`); setModalOpen(false); fetchData(); }
    } else {
      const { error } = await supabase.from('staff').insert(toDb(staffData));
      if (error) toast.error('Failed to add staff', error.message);
      else { toast.success('Staff added', `${s.name} added.`); setModalOpen(false); fetchData(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    // Safety check: check if staff is assigned to active maintenance tickets
    const { data: activeTickets } = await supabase
      .from('maintenance_tickets')
      .select('id')
      .eq('assigned_staff', deleteTarget.name)
      .neq('status', 'completed');

    if (activeTickets && activeTickets.length > 0) {
      toast.error(
        'Cannot delete staff member',
        `${deleteTarget.name} has ${activeTickets.length} active maintenance ticket(s) assigned. Please reassign them first.`
      );
      setDeleteTarget(null);
      return;
    }

    const { error } = await supabase.from('staff').delete().eq('id', deleteTarget.id);
    if (error) toast.error('Failed to delete staff', error.message);
    else { toast.success('Staff removed', `${deleteTarget.name} removed.`); fetchData(); }
    setDeleteTarget(null);
  };

  const columns: Column<Staff>[] = [
    {
      key: 'name', header: 'Staff Member', sortable: true, sortValue: (r) => r.name,
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
    {
      key: 'role', header: 'Role', sortable: true, sortValue: (r) => r.role,
      render: (r) => (
        <button onClick={(e) => { e.stopPropagation(); setViewingRole(r.role); }} className="inline-flex">
          <Badge tone={roleTone[r.role]}>{r.role}</Badge>
        </button>
      ),
    },
    { key: 'joinedAt', header: 'Joined', sortable: true, sortValue: (r) => r.joinedAt, render: (r) => formatDate(r.joinedAt, { month: 'short', day: 'numeric', year: 'numeric' }) },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, render: (r) => <Badge tone={r.status === 'active' ? 'success' : 'neutral'} dot>{r.status}</Badge> },
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
        title="Staff Management"
        description={`${data.length} staff members`}
        actions={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Staff</Button>}
      />

      {/* Role cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {roles.map((role) => {
          const count = data.filter((s) => s.role === role).length;
          return (
            <button key={role} onClick={() => setViewingRole(role)} className="text-left">
              <Card className="hover:shadow-elevated transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Badge tone={roleTone[role]}>{count}</Badge>
                  </div>
                  <p className="text-sm font-medium">{role}</p>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select className="w-48" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="">All roles</option>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
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
            onRowClick={(r) => { setEditing(r); setModalOpen(true); }}
            emptyMessage="No staff members found"
          />
        )}
      </Card>

      {modalOpen && <StaffFormModal staff={editing} onSave={handleSave} onClose={() => setModalOpen(false)} saving={saving} />}

      {/* Role permission modal */}
      {viewingRole && (
        <Modal open onClose={() => setViewingRole(null)} title={`${viewingRole} Role`} description="Permissions and access levels">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge tone={roleTone[viewingRole]}>{viewingRole}</Badge>
              <span className="text-sm text-muted-foreground">({data.filter((s) => s.role === viewingRole).length} members assigned)</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Permissions</p>
              <ul className="space-y-2">
                {rolePermissions[viewingRole].map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setViewingRole(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Remove staff member?" message={`This will permanently remove ${deleteTarget?.name}.`} confirmLabel="Remove" />
    </div>
  );
}

function StaffFormModal({ staff, onSave, onClose, saving }: { staff: Staff | null; onSave: (s: Staff) => void; onClose: () => void; saving: boolean }) {
  const [form, setForm] = useState<Staff>(staff ?? {
    id: '',
    name: '',
    email: '',
    phone: '',
    role: 'Property Manager',
    joinedAt: new Date().toISOString().slice(0, 10),
    status: 'active',
  });

  const update = (p: Partial<Staff>) => setForm((f) => ({ ...f, ...p }));

  return (
    <Modal
      open
      onClose={onClose}
      title={staff ? 'Edit Staff' : 'Add Staff Member'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!form.name.trim() || !form.email.trim() || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : staff ? 'Save' : 'Add Staff'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Full Name" required><Input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Full name" /></FieldGroup>
          <FieldGroup label="Email" required><Input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} placeholder="staff@domain.com" /></FieldGroup>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Phone"><Input value={form.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="(555) 000-0000" /></FieldGroup>
          <FieldGroup label="Role">
            <Select value={form.role} onChange={(e) => update({ role: e.target.value as StaffRole })}>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </FieldGroup>
        </div>
        <FieldGroup label="Status">
          <Select value={form.status} onChange={(e) => update({ status: e.target.value as Staff['status'] })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FieldGroup>
      </div>
    </Modal>
  );
}
