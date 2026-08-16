import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, MoreVertical, Edit, Copy, Trash2, Archive, Eye,
  Building2, Bed, Bath, MapPin, User, X, Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Label, Textarea, FieldGroup } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import type { Property, PropertyStatus, PropertyType, Owner } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';

const statusTone: Record<PropertyStatus, 'success' | 'primary' | 'warning' | 'danger'> = {
  available: 'success',
  occupied: 'primary',
  maintenance: 'warning',
  vacant: 'danger',
};

const propertyTypes: PropertyType[] = ['Apartment', 'House', 'Villa', 'Condo', 'Townhouse', 'Studio', 'Commercial'];
const cities = [
  'Bengaluru, KA', 'Mumbai, MH', 'Delhi NCR', 'Hyderabad, TS', 'Pune, MH', 'Chennai, TN', 'Kolkata, WB', 'Ahmedabad, GJ',
  'Los Angeles, CA', 'Austin, TX', 'Miami, FL', 'New York, NY', 'Portland, OR', 'Seattle, WA', 'San Francisco, CA', 'Chicago, IL',
];

interface DbProperty {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  owner_id?: string;
  owner?: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  status: string;
  occupancy: number;
  image: string;
  gallery: string[];
  manager: string;
  amenities: string[];
  rules: string[];
  description: string;
  units_count: number;
  archived: boolean;
}

interface DbOwner {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  tax_number: string;
  bank_details: string;
  properties_owned: number;
}

function fromDb(r: DbProperty, ownerMap: Record<string, Owner>): Property {
  const resolvedOwner = (r.owner_id && ownerMap[r.owner_id]?.name) || r.owner || '';
  return {
    id: r.id,
    name: r.name,
    type: r.type as PropertyType,
    address: r.address,
    city: r.city,
    ownerId: r.owner_id,
    owner: resolvedOwner,
    rent: Number(r.rent) || 0,
    bedrooms: Number(r.bedrooms) || 0,
    bathrooms: Number(r.bathrooms) || 0,
    status: (r.status || 'available') as PropertyStatus,
    occupancy: Number(r.occupancy) || 0,
    image: r.image || '',
    gallery: r.gallery ?? [],
    manager: r.manager ?? '',
    amenities: r.amenities ?? [],
    rules: r.rules ?? [],
    description: r.description ?? '',
    unitsCount: Number(r.units_count) || 1,
    archived: Boolean(r.archived),
  };
}

function toDb(p: Property): Omit<DbProperty, 'id' | 'created_at'> {
  return {
    name: p.name.trim(),
    type: p.type,
    address: p.address.trim(),
    city: p.city,
    owner_id: p.ownerId || '',
    owner: p.owner.trim(),
    rent: Math.max(0, Number(p.rent) || 0),
    bedrooms: Math.max(0, Number(p.bedrooms) || 0),
    bathrooms: Math.max(0, Number(p.bathrooms) || 0),
    status: p.status,
    occupancy: Math.min(100, Math.max(0, Number(p.occupancy) || 0)),
    image: p.image || '',
    gallery: p.gallery || [],
    manager: p.manager ?? '',
    amenities: p.amenities || [],
    rules: p.rules || [],
    description: p.description || '',
    units_count: Math.max(1, Number(p.unitsCount) || 1),
    archived: p.archived ?? false,
  };
}

export function PropertiesPage() {
  const toast = useToast();
  const [data, setData] = useState<Property[]>([]);
  const [dbOwners, setDbOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ city: '', type: '', status: '', bedrooms: '', bathrooms: '', priceMin: '', priceMax: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Property[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [viewing, setViewing] = useState<Property | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);

    // Fetch owners and properties in parallel from Supabase
    const [ownersRes, propertiesRes] = await Promise.all([
      supabase.from('owners').select('*').order('name', { ascending: true }),
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
    ]);

    const loadedOwners: Owner[] = (ownersRes.data as DbOwner[] ?? []).map((o) => ({
      id: o.id,
      name: o.name,
      company: o.company,
      email: o.email,
      phone: o.phone,
      address: o.address,
      taxNumber: o.tax_number,
      bankDetails: o.bank_details,
      propertiesOwned: o.properties_owned,
    }));
    setDbOwners(loadedOwners);

    const ownerMap: Record<string, Owner> = {};
    loadedOwners.forEach((o) => { ownerMap[o.id] = o; });

    if (propertiesRes.error) {
      toast.error('Failed to load properties', propertiesRes.error.message);
    } else {
      setData((propertiesRes.data as DbProperty[] ?? []).map((r) => fromDb(r, ownerMap)));
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const filtered = useMemo(() => {
    return data.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.address.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.city && p.city !== filters.city) return false;
      if (filters.type && p.type !== filters.type) return false;
      if (filters.status && p.status !== filters.status) return false;
      if (filters.bedrooms && p.bedrooms !== Number(filters.bedrooms)) return false;
      if (filters.bathrooms && p.bathrooms !== Number(filters.bathrooms)) return false;
      if (filters.priceMin && p.rent < Number(filters.priceMin)) return false;
      if (filters.priceMax && p.rent > Number(filters.priceMax)) return false;
      return true;
    });
  }, [data, search, filters]);

  const activeFilters = Object.values(filters).filter(Boolean).length;

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p: Property) => { setEditing(p); setModalOpen(true); };

  const handleSave = async (p: Property) => {
    if (!p.name.trim()) {
      toast.error('Validation Error', 'Property name is required.');
      return;
    }
    if (!p.address.trim()) {
      toast.error('Validation Error', 'Address is required.');
      return;
    }
    if (!p.ownerId && !p.owner) {
      toast.error('Validation Error', 'Please select a property owner.');
      return;
    }

    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('properties').update(toDb(p)).eq('id', p.id);
      if (error) {
        toast.error('Failed to update property', error.message);
      } else {
        toast.success('Property updated', `${p.name} has been updated successfully.`);
        setModalOpen(false);
        fetchProperties();
      }
    } else {
      const { error } = await supabase.from('properties').insert(toDb(p));
      if (error) {
        toast.error('Failed to add property', error.message);
      } else {
        toast.success('Property added', `${p.name} has been added successfully.`);
        setModalOpen(false);
        fetchProperties();
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    // Safety check: check if any units or leases exist for this property
    const [unitsCheck, leasesCheck] = await Promise.all([
      supabase.from('units').select('id').eq('property_id', deleteTarget.id),
      supabase.from('leases').select('id').eq('property_id', deleteTarget.id),
    ]);

    const unitCount = unitsCheck.data?.length || 0;
    const leaseCount = leasesCheck.data?.length || 0;

    if (unitCount > 0) {
      toast.error(
        'Cannot delete property',
        `This property has ${unitCount} unit(s) linked to it. Please remove or reassign the units first.`
      );
      setDeleteTarget(null);
      return;
    }

    if (leaseCount > 0) {
      toast.error(
        'Cannot delete property',
        `This property has ${leaseCount} lease(s) linked to it. Please remove or terminate the leases first.`
      );
      setDeleteTarget(null);
      return;
    }

    const { error } = await supabase.from('properties').delete().eq('id', deleteTarget.id);
    if (error) {
      toast.error('Failed to delete property', error.message);
    } else {
      toast.success('Property deleted', `${deleteTarget.name} has been removed.`);
      fetchProperties();
    }
    setDeleteTarget(null);
  };

  const handleDuplicate = async (p: Property) => {
    const copy: Property = { ...p, name: `${p.name} (Copy)` };
    const { error } = await supabase.from('properties').insert(toDb(copy));
    if (error) {
      toast.error('Failed to duplicate property', error.message);
    } else {
      toast.success('Property duplicated', `${copy.name} has been created.`);
      fetchProperties();
    }
  };

  const handleArchive = async (p: Property) => {
    const { error } = await supabase.from('properties').update({ archived: !p.archived }).eq('id', p.id);
    if (error) {
      toast.error('Failed to update property', error.message);
    } else {
      toast.success(p.archived ? 'Property restored' : 'Property archived', `${p.name} has been ${p.archived ? 'restored' : 'archived'}.`);
      fetchProperties();
    }
  };

  const handleBulkDelete = async () => {
    const ids = selected.map((s) => s.id);
    const [unitsCheck, leasesCheck] = await Promise.all([
      supabase.from('units').select('id, property_id').in('property_id', ids),
      supabase.from('leases').select('id, property_id').in('property_id', ids),
    ]);
    const unitCount = unitsCheck.data?.length || 0;
    const leaseCount = leasesCheck.data?.length || 0;
    if (unitCount > 0) {
      toast.error(
        'Cannot delete properties',
        `Selected properties have ${unitCount} unit(s) linked to them. Please remove or reassign the units first.`
      );
      return;
    }
    if (leaseCount > 0) {
      toast.error(
        'Cannot delete properties',
        `Selected properties have ${leaseCount} lease(s) linked to them. Please remove or terminate the leases first.`
      );
      return;
    }

    const { error } = await supabase.from('properties').delete().in('id', ids);
    if (error) {
      toast.error('Failed to delete properties', error.message);
    } else {
      toast.success('Properties deleted', `${selected.length} properties removed.`);
      setSelected([]);
      fetchProperties();
    }
  };

  const columns: Column<Property>[] = [
    {
      key: 'image', header: 'Property', sortable: true, sortValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-3">
          {r.image ? (
            <img src={r.image} alt={r.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary shrink-0">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{r.name}</p>
            <p className="text-xs text-muted-foreground truncate">{r.address}</p>
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', sortable: true, sortValue: (r) => r.type, render: (r) => <span className="text-muted-foreground">{r.type}</span> },
    { key: 'city', header: 'City', sortable: true, sortValue: (r) => r.city, render: (r) => <span className="text-muted-foreground">{r.city}</span> },
    { key: 'owner', header: 'Owner', sortable: true, sortValue: (r) => r.owner, render: (r) => <span className="text-muted-foreground">{r.owner || '—'}</span> },
    { key: 'rent', header: 'Rent', sortable: true, sortValue: (r) => r.rent, render: (r) => <span className="font-medium text-foreground">{formatCurrency(r.rent)}/mo</span> },
    {
      key: 'specs', header: 'Beds / Baths',
      render: (r) => (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{r.bedrooms}</span>
          <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{r.bathrooms}</span>
        </div>
      ),
    },
    { key: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, render: (r) => <Badge tone={statusTone[r.status]}>{r.status}</Badge> },
    {
      key: 'occupancy', header: 'Occupancy', sortable: true, sortValue: (r) => r.occupancy,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${r.occupancy}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{r.occupancy}%</span>
        </div>
      ),
    },
    {
      key: 'actions', header: '', headerClassName: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <RowActions
            onView={() => setViewing(r)}
            onEdit={() => openEdit(r)}
            onDuplicate={() => handleDuplicate(r)}
            onArchive={() => handleArchive(r)}
            onDelete={() => setDeleteTarget(r)}
            archived={r.archived}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 page-transition">
      <PageHeader
        title="Properties"
        description={`Manage ${data.length} rental properties`}
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Property
          </Button>
        }
      />

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search properties by name, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant={showFilters ? 'primary' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilters > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-primary text-xs font-bold">
              {activeFilters}
            </span>
          )}
        </Button>
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <Card className="p-4 border-dashed animate-in">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Select value={filters.city} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}>
              <option value="">All Cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
              <option value="">All Types</option>
              {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
              <option value="vacant">Vacant</option>
            </Select>
            <Select value={filters.bedrooms} onChange={(e) => setFilters((f) => ({ ...f, bedrooms: e.target.value }))}>
              <option value="">Any Bedrooms</option>
              <option value="0">Studio (0)</option>
              <option value="1">1 Bed</option>
              <option value="2">2 Beds</option>
              <option value="3">3 Beds</option>
              <option value="4">4+ Beds</option>
            </Select>
            <Input
              type="number"
              placeholder="Min Price"
              value={filters.priceMin}
              onChange={(e) => setFilters((f) => ({ ...f, priceMin: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="Max Price"
              value={filters.priceMax}
              onChange={(e) => setFilters((f) => ({ ...f, priceMax: e.target.value }))}
            />
          </div>
          {activeFilters > 0 && (
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setFilters({ city: '', type: '', status: '', bedrooms: '', bathrooms: '', priceMin: '', priceMax: '' })}>
                Reset Filters
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-primary-50 dark:bg-primary-50/15 p-3 px-4 text-sm">
          <span>{selected.length} properties selected</span>
          <Button variant="danger" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4" /> Delete Selected
          </Button>
        </div>
      )}

      {/* Properties Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            selectable
            onSelectionChange={setSelected}
            rowKey={(r) => r.id}
            onRowClick={(r) => setViewing(r)}
            emptyIcon={<Building2 className="h-10 w-10 opacity-40" />}
            emptyMessage="No properties match your search"
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <PropertyFormModal
          property={editing}
          owners={dbOwners}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
          saving={saving}
        />
      )}

      {/* View Modal */}
      {viewing && (
        <PropertyViewModal
          property={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
            setModalOpen(true);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete property?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

function RowActions({
  onView, onEdit, onDuplicate, onArchive, onDelete, archived,
}: {
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  archived?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
        <MoreVertical className="h-4 w-4" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-popover py-1 shadow-elevated animate-in">
            <MenuItem icon={<Eye className="h-4 w-4" />} label="View Details" onClick={() => { onView(); setOpen(false); }} />
            <MenuItem icon={<Edit className="h-4 w-4" />} label="Edit" onClick={() => { onEdit(); setOpen(false); }} />
            <MenuItem icon={<Copy className="h-4 w-4" />} label="Duplicate" onClick={() => { onDuplicate(); setOpen(false); }} />
            <MenuItem icon={<Archive className="h-4 w-4" />} label={archived ? 'Restore' : 'Archive'} onClick={() => { onArchive(); setOpen(false); }} />
            <div className="border-t border-border" />
            <MenuItem icon={<Trash2 className="h-4 w-4" />} label="Delete" danger onClick={() => { onDelete(); setOpen(false); }} />
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={cn('flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-secondary transition-colors', danger ? 'text-danger' : 'text-foreground')}>
      {icon} {label}
    </button>
  );
}

function PropertyFormModal({
  property,
  owners,
  onSave,
  onClose,
  saving,
}: {
  property: Property | null;
  owners: Owner[];
  onSave: (p: Property) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const initialOwnerId = property?.ownerId || (owners.find((o) => o.name === property?.owner)?.id ?? owners[0]?.id ?? '');
  const initialOwnerName = property?.owner || owners.find((o) => o.id === initialOwnerId)?.name || '';

  const [form, setForm] = useState<Property>(property ?? {
    id: '',
    name: '',
    type: 'Apartment',
    address: '',
    city: cities[0],
    ownerId: initialOwnerId,
    owner: initialOwnerName,
    rent: 2000,
    bedrooms: 1,
    bathrooms: 1,
    status: 'available',
    occupancy: 0,
    image: '',
    gallery: [],
    manager: '',
    amenities: [],
    rules: [],
    description: '',
    unitsCount: 1,
    archived: false,
  });

  const [amenityInput, setAmenityInput] = useState('');
  const [ruleInput, setRuleInput] = useState('');

  const update = (patch: Partial<Property>) => setForm((f) => ({ ...f, ...patch }));

  const handleOwnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const found = owners.find((o) => o.id === selectedId);
    update({
      ownerId: selectedId,
      owner: found ? found.name : '',
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={property ? 'Edit Property' : 'Add Property'}
      description="Fill in the property details below. Property owner is synchronized with database."
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!form.name.trim() || !form.address.trim() || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : property ? 'Save Changes' : 'Add Property'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Property Name" required>
            <Input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Sunset Gardens" />
          </FieldGroup>
          <FieldGroup label="Property Type">
            <Select value={form.type} onChange={(e) => update({ type: e.target.value as PropertyType })}>
              {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FieldGroup>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Address" required>
            <Input value={form.address} onChange={(e) => update({ address: e.target.value })} placeholder="Street address, Locality, PIN Code" />
          </FieldGroup>
          <FieldGroup label="City">
            <Select value={form.city} onChange={(e) => update({ city: e.target.value })}>
              <option value="">Select city</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </FieldGroup>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FieldGroup label="Rent (₹/mo)">
            <Input type="number" min={0} value={form.rent} onChange={(e) => update({ rent: Number(e.target.value) })} />
          </FieldGroup>
          <FieldGroup label="Bedrooms">
            <Input type="number" min={0} value={form.bedrooms} onChange={(e) => update({ bedrooms: Number(e.target.value) })} />
          </FieldGroup>
          <FieldGroup label="Bathrooms">
            <Input type="number" min={0} value={form.bathrooms} onChange={(e) => update({ bathrooms: Number(e.target.value) })} />
          </FieldGroup>
          <FieldGroup label="Total Units">
            <Input type="number" min={1} value={form.unitsCount} onChange={(e) => update({ unitsCount: Number(e.target.value) })} />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Owner" required hint={owners.length === 0 ? 'No owners registered in database' : 'Loaded dynamically from Owners table'}>
            <Select value={form.ownerId || ''} onChange={handleOwnerChange}>
              <option value="">Select an owner</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} {o.company ? `(${o.company})` : ''}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Manager">
            <Input value={form.manager || ''} onChange={(e) => update({ manager: e.target.value })} placeholder="Assign manager" />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Status">
            <Select value={form.status} onChange={(e) => update({ status: e.target.value as PropertyStatus })}>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
              <option value="vacant">Vacant</option>
            </Select>
          </FieldGroup>
          <FieldGroup label="Occupancy (%)">
            <Input type="number" min={0} max={100} value={form.occupancy} onChange={(e) => update({ occupancy: Number(e.target.value) })} />
          </FieldGroup>
        </div>
        <FieldGroup label="Image URL" hint="Paste a link to a property photo">
          <Input
            value={form.image}
            onChange={(e) => update({
              image: e.target.value,
              gallery: e.target.value ? [e.target.value, ...form.gallery.filter((g) => g !== e.target.value)] : form.gallery,
            })}
            placeholder="https://..."
          />
        </FieldGroup>
        <FieldGroup label="Description">
          <Textarea value={form.description} onChange={(e) => update({ description: e.target.value })} placeholder="Property description..." />
        </FieldGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup label="Amenities" hint="Press Enter to add">
            <div className="flex gap-2">
              <Input
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && amenityInput.trim()) {
                    e.preventDefault();
                    update({ amenities: [...form.amenities, amenityInput.trim()] });
                    setAmenityInput('');
                  }
                }}
                placeholder="e.g. Pool, Gym"
              />
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  if (amenityInput.trim()) {
                    update({ amenities: [...form.amenities, amenityInput.trim()] });
                    setAmenityInput('');
                  }
                }}
              >
                Add
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.amenities.map((a, i) => (
                <Badge key={i} tone="primary">
                  {a}
                  <button type="button" onClick={() => update({ amenities: form.amenities.filter((_, idx) => idx !== i) })} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </FieldGroup>
          <FieldGroup label="Rules" hint="Press Enter to add">
            <div className="flex gap-2">
              <Input
                value={ruleInput}
                onChange={(e) => setRuleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && ruleInput.trim()) {
                    e.preventDefault();
                    update({ rules: [...form.rules, ruleInput.trim()] });
                    setRuleInput('');
                  }
                }}
                placeholder="e.g. No smoking"
              />
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  if (ruleInput.trim()) {
                    update({ rules: [...form.rules, ruleInput.trim()] });
                    setRuleInput('');
                  }
                }}
              >
                Add
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.rules.map((r, i) => (
                <Badge key={i} tone="neutral">
                  {r}
                  <button type="button" onClick={() => update({ rules: form.rules.filter((_, idx) => idx !== i) })} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </FieldGroup>
        </div>
      </div>
    </Modal>
  );
}

function PropertyViewModal({ property, onClose, onEdit }: { property: Property; onClose: () => void; onEdit: () => void }) {
  return (
    <Modal open onClose={onClose} size="xl" title={property.name} description={property.address}>
      <div className="space-y-5">
        {property.gallery.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {property.gallery.map((g, i) => (
              <img key={i} src={g} alt={`${property.name} ${i + 1}`} className="h-32 w-full rounded-lg object-cover" />
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoBox icon={<Building2 className="h-4 w-4" />} label="Type" value={property.type} />
          <InfoBox icon={<MapPin className="h-4 w-4" />} label="City" value={property.city} />
          <InfoBox icon={<User className="h-4 w-4" />} label="Owner" value={property.owner || '—'} />
          <InfoBox icon={<Bed className="h-4 w-4" />} label="Units" value={String(property.unitsCount)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoBox label="Rent" value={formatCurrency(property.rent)} />
          <InfoBox label="Bedrooms" value={String(property.bedrooms)} />
          <InfoBox label="Bathrooms" value={String(property.bathrooms)} />
          <InfoBox label="Occupancy" value={`${property.occupancy}%`} />
        </div>
        <div>
          <Label>Description</Label>
          <p className="text-sm text-muted-foreground">{property.description || 'No description provided.'}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-1.5">
              {property.amenities.length > 0 ? property.amenities.map((a, i) => <Badge key={i} tone="primary">{a}</Badge>) : <span className="text-sm text-muted-foreground">None</span>}
            </div>
          </div>
          <div>
            <Label>Rules</Label>
            <div className="flex flex-wrap gap-1.5">
              {property.rules.length > 0 ? property.rules.map((r, i) => <Badge key={i} tone="neutral">{r}</Badge>) : <span className="text-sm text-muted-foreground">None</span>}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onEdit}><Edit className="h-4 w-4" /> Edit Property</Button>
        </div>
      </div>
    </Modal>
  );
}

function InfoBox({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon && icon}{label}</div>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
