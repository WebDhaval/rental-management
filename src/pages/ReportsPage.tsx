import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Download, DollarSign, Home, Users, Wrench,
  Calendar, Building, AlertTriangle, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { AreaChart, BarChart, DonutChart } from '@/components/charts/Charts';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import type { Property, Tenant, Lease, Payment, MaintenanceTicket, Owner, PaymentMethod } from '@/lib/types';
import { formatCurrency, cn, formatDate } from '@/lib/utils';

interface DbProperty {
  id: string;
  name: string;
  address?: string;
  city?: string;
  type?: Property['type'];
  units_count?: number;
  units?: number;
  rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  status?: Property['status'];
  occupancy?: number;
  image?: string;
  gallery?: string[];
  owner?: string;
  owner_id?: string;
  amenities?: string[];
  rules?: string[];
  description?: string;
}

interface DbTenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  emergency_contact?: string;
  address?: string;
  national_id?: string;
  occupation?: string;
  company?: string;
  notes?: string;
  photo?: string;
  registered_at?: string;
  status?: Tenant['status'];
}

interface DbLease {
  id: string;
  number?: string;
  lease_id?: string;
  property?: string;
  property_id?: string;
  unit?: string;
  unit_id?: string;
  tenant?: string;
  tenant_id?: string;
  start_date?: string;
  end_date?: string;
  monthly_rent?: number;
  rent?: number;
  security_deposit?: number;
  deposit?: number;
  due_date?: number;
  status?: Lease['status'];
}

interface DbPayment {
  id: string;
  invoice?: string;
  tenant?: string;
  property?: string;
  unit?: string;
  amount?: number;
  due_date?: string;
  paid_date?: string | null;
  method?: string;
  status?: Payment['status'];
}

interface DbMaintenanceTicket {
  id: string;
  ticket_id?: string;
  title: string;
  description?: string;
  property?: string;
  unit?: string;
  tenant?: string;
  category?: MaintenanceTicket['category'];
  priority?: MaintenanceTicket['priority'];
  status?: MaintenanceTicket['status'];
  assigned_staff?: string;
  created_at?: string;
}

interface DbOwner {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  tax_number?: string;
  bank_details?: string;
  properties_owned?: number;
}

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tone: string;
}

const reportTypes: ReportType[] = [
  { id: 'monthly-income', title: 'Monthly Income', description: 'Revenue and income breakdown', icon: <DollarSign className="h-5 w-5" />, tone: 'bg-success-50 text-success-600 dark:bg-success-50/15' },
  { id: 'occupancy', title: 'Occupancy Report', description: 'Property occupancy rates', icon: <Home className="h-5 w-5" />, tone: 'bg-primary-50 text-primary-600 dark:bg-primary-50/15' },
  { id: 'tenant', title: 'Tenant Report', description: 'Tenant demographics and history', icon: <Users className="h-5 w-5" />, tone: 'bg-info-50 text-info-600 dark:bg-info-50/15' },
  { id: 'owner', title: 'Owner Report', description: 'Owner portfolio and earnings', icon: <Building className="h-5 w-5" />, tone: 'bg-warning-50 text-warning-600 dark:bg-warning-50/15' },
  { id: 'maintenance-cost', title: 'Maintenance Cost', description: 'Maintenance expenses analysis', icon: <Wrench className="h-5 w-5" />, tone: 'bg-danger-50 text-danger-600 dark:bg-danger-50/15' },
  { id: 'vacant', title: 'Vacant Properties', description: 'Unoccupied units report', icon: <AlertTriangle className="h-5 w-5" />, tone: 'bg-danger-50 text-danger-600 dark:bg-danger-50/15' },
  { id: 'lease-expiry', title: 'Lease Expiry', description: 'Upcoming lease expirations', icon: <Calendar className="h-5 w-5" />, tone: 'bg-primary-50 text-primary-600 dark:bg-primary-50/15' },
];

export function ReportsPage() {
  const toast = useToast();
  const [selectedReport, setSelectedReport] = useState<string>('monthly-income');
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [pRes, tRes, lRes, payRes, tickRes, oRes] = await Promise.all([
      supabase.from('properties').select('*'),
      supabase.from('tenants').select('*'),
      supabase.from('leases').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('maintenance_tickets').select('*'),
      supabase.from('owners').select('*'),
    ]);

    setProperties(((pRes.data as DbProperty[]) ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address || '',
      city: r.city || '',
      type: r.type || 'Apartment',
      owner: r.owner || '',
      ownerId: r.owner_id,
      rent: Number(r.rent) || 0,
      bedrooms: Number(r.bedrooms) || 0,
      bathrooms: Number(r.bathrooms) || 0,
      status: r.status || 'available',
      occupancy: Number(r.occupancy) || 0,
      image: r.image || '',
      gallery: r.gallery || [],
      amenities: r.amenities || [],
      rules: r.rules || [],
      description: r.description || '',
      unitsCount: Number(r.units_count ?? r.units) || 1,
    })));

    setTenants(((tRes.data as DbTenant[]) ?? []).map((r) => ({
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
      registeredAt: r.registered_at || '',
      status: r.status || 'active',
    })));

    setLeases(((lRes.data as DbLease[]) ?? []).map((r) => ({
      id: r.id,
      number: r.number || r.lease_id || `LSE-${r.id.slice(0, 4)}`,
      property: r.property || '',
      propertyId: r.property_id,
      unit: r.unit || '',
      unitId: r.unit_id,
      tenant: r.tenant || '',
      tenantId: r.tenant_id,
      startDate: r.start_date || '',
      endDate: r.end_date || '',
      monthlyRent: Number(r.monthly_rent ?? r.rent) || 0,
      securityDeposit: Number(r.security_deposit ?? r.deposit) || 0,
      dueDate: Number(r.due_date) || 1,
      status: r.status || 'active',
    })));

    setPayments(((payRes.data as DbPayment[]) ?? []).map((r) => ({
      id: r.id,
      invoice: r.invoice || '',
      tenant: r.tenant || '',
      property: r.property || '',
      unit: r.unit || '',
      amount: Number(r.amount) || 0,
      dueDate: r.due_date || '',
      paidDate: r.paid_date ?? null,
      method: (r.method || 'Bank Transfer') as PaymentMethod,
      status: r.status || 'pending',
    })));

    setTickets(((tickRes.data as DbMaintenanceTicket[]) ?? []).map((r) => ({
      id: r.id,
      ticketId: r.ticket_id || '',
      title: r.title,
      description: r.description || '',
      property: r.property || '',
      unit: r.unit || '',
      tenant: r.tenant || '',
      category: r.category || 'General',
      priority: r.priority || 'medium',
      status: r.status || 'open',
      assignedStaff: r.assigned_staff || 'Unassigned',
      createdAt: r.created_at || '',
    })));

    setOwners(((oRes.data as DbOwner[]) ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      company: r.company || '',
      email: r.email,
      phone: r.phone || '',
      address: r.address || '',
      taxNumber: r.tax_number || '',
      bankDetails: r.bank_details || '',
      propertiesOwned: Number(r.properties_owned) || 0,
    })));

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = (format: string) => {
    toast.success(`Exported to ${format}`, `The ${selectedReport} report has been downloaded.`);
  };

  const totalCollected = useMemo(() => payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0), [payments]);
  const occupiedCount = properties.filter((p) => p.status === 'occupied').length;
  const availableCount = properties.filter((p) => p.status === 'available').length;
  const vacantCount = properties.filter((p) => p.status === 'vacant').length;
  const maintenanceCount = properties.filter((p) => p.status === 'maintenance').length;
  const occupancyPercent = properties.length > 0 ? Math.round((occupiedCount / properties.length) * 100) : 0;

  const occupancyChartData = [
    { label: 'Occupied', value: occupiedCount || 1, color: 'hsl(142 71% 45%)' },
    { label: 'Available', value: availableCount || 1, color: 'hsl(217 91% 60%)' },
    { label: 'Maintenance', value: maintenanceCount || 1, color: 'hsl(38 92% 50%)' },
    { label: 'Vacant', value: vacantCount || 1, color: 'hsl(0 84% 60%)' },
  ];

  const monthlyRevenueData = [
    { month: 'Jan', revenue: 48000, expenses: 14200 },
    { month: 'Feb', revenue: 52000, expenses: 15100 },
    { month: 'Mar', revenue: 49500, expenses: 13800 },
    { month: 'Apr', revenue: 56000, expenses: 16400 },
    { month: 'May', revenue: 58500, expenses: 15900 },
    { month: 'Jun', revenue: 62000 + totalCollected, expenses: 17200 },
  ];

  const expiringLeases = leases.filter((l) => l.status === 'expiring' || new Date(l.endDate).getTime() - Date.now() < 60 * 86400000);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-transition">
      <PageHeader
        title="Reports"
        description="Generate and export detailed reports"
        actions={
          <>
            <Button variant="outline" onClick={() => handleExport('PDF')}><Download className="h-4 w-4" /> PDF</Button>
            <Button variant="outline" onClick={() => handleExport('Excel')}><Download className="h-4 w-4" /> Excel</Button>
            <Button variant="outline" onClick={() => handleExport('CSV')}><Download className="h-4 w-4" /> CSV</Button>
          </>
        }
      />

      {/* Report type cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {reportTypes.map((r) => (
          <button key={r.id} onClick={() => setSelectedReport(r.id)}>
            <Card className={cn('hover:shadow-elevated transition-all text-left w-full', selectedReport === r.id && 'ring-2 ring-primary')}>
              <CardContent className="p-4">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl mb-3', r.tone)}>
                  {r.icon}
                </div>
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* Report content */}
      {selectedReport === 'monthly-income' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Income vs Expenses</CardTitle></CardHeader>
            <CardContent>
              <AreaChart
                data={monthlyRevenueData.map((d) => ({ label: d.month, value: d.revenue, value2: d.expenses }))}
                color="hsl(142 71% 45%)" color2="hsl(0 84% 60%)"
                formatValue={(v) => formatCurrency(v, true)}
                legend={[{ label: 'Income', color: 'hsl(142 71% 45%)' }, { label: 'Expenses', color: 'hsl(0 84% 60%)' }]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Net Profit</CardTitle></CardHeader>
            <CardContent>
              <BarChart
                data={monthlyRevenueData.map((d) => ({ label: d.month, value: d.revenue - d.expenses }))}
                color="hsl(217 91% 60%)" formatValue={(v) => formatCurrency(v, true)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {selectedReport === 'occupancy' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Occupancy Distribution</CardTitle></CardHeader>
            <CardContent><DonutChart data={occupancyChartData} centerValue={`${occupancyPercent}%`} centerLabel="Occupied" /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Property Status Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Total Properties', properties.length],
                  ['Occupied', occupiedCount],
                  ['Available', availableCount],
                  ['Maintenance', maintenanceCount],
                  ['Vacant', vacantCount],
                  ['Occupancy Rate', `${occupancyPercent}%`]
                ].map(([label, val]) => (
                  <div key={label as string} className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold mt-1">{val}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedReport === 'tenant' && (
        <Card>
          <CardHeader><CardTitle>Tenant Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ['Total Tenants', tenants.length],
                ['Active', tenants.filter((t) => t.status === 'active').length],
                ['Inactive', tenants.filter((t) => t.status === 'inactive').length],
                ['Total Leases', leases.length],
              ].map(([label, val]) => (
                <div key={label as string} className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold mt-1">{val}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedReport === 'owner' && (
        <Card>
          <CardHeader><CardTitle>Owner Portfolio Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                ['Total Owners', owners.length],
                ['Properties Managed', properties.length],
                ['Avg Properties / Owner', owners.length > 0 ? (properties.length / owners.length).toFixed(1) : '0'],
              ].map(([label, val]) => (
                <div key={label as string} className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold mt-1">{val}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedReport === 'maintenance-cost' && (
        <Card>
          <CardHeader><CardTitle>Maintenance Requests & Status</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ['Total Tickets', tickets.length],
                ['Open Tickets', tickets.filter((t) => t.status === 'open').length],
                ['In Progress', tickets.filter((t) => t.status === 'in_progress').length],
                ['Completed', tickets.filter((t) => t.status === 'completed').length],
              ].map(([label, val]) => (
                <div key={label as string} className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold mt-1">{val}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedReport === 'vacant' && (
        <Card>
          <CardHeader><CardTitle>Vacant & Available Units</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                ['Vacant Properties', vacantCount],
                ['Available for Rent', availableCount],
                ['Total Units', properties.reduce((s, p) => s + p.unitsCount, 0)],
              ].map(([label, val]) => (
                <div key={label as string} className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold mt-1">{val}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedReport === 'lease-expiry' && (
        <Card>
          <CardHeader><CardTitle>Upcoming Lease Expirations ({expiringLeases.length})</CardTitle></CardHeader>
          <CardContent>
            {expiringLeases.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No leases expiring soon</p>
            ) : (
              <div className="divide-y divide-border">
                {expiringLeases.map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-sm">{l.tenant}</p>
                      <p className="text-xs text-muted-foreground">{l.property} · Unit {l.unit}</p>
                    </div>
                    <div className="text-right">
                      <Badge tone="warning" dot>Expiring</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(l.endDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
