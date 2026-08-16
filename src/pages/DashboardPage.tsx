import { useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  Building2, Home, DoorOpen, Users, FileText, AlertTriangle, DollarSign,
  Clock, Wrench, TrendingUp, TrendingDown, ArrowRight, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { AreaChart, BarChart, DonutChart } from '@/components/charts/Charts';
import { PageHeader } from '@/components/shared/PageHeader';
import { supabase } from '@/lib/supabase';
import type { Property, Tenant, Lease, Payment, MaintenanceTicket, Activity } from '@/lib/types';
import { formatCurrency, formatDate, timeAgo, daysUntil, cn } from '@/lib/utils';
import { useRouter } from '@/lib/router';

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: { value: string; up: boolean };
  tone: string;
  spark?: number[];
}

interface DbProperty {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  type?: Property['type'];
  units?: number;
  rent?: number;
  status?: Property['status'];
  owner?: string;
  owner_id?: string;
  year_built?: number;
  amenities?: string[];
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
  lease_id?: string;
  property?: string;
  property_id?: string;
  unit?: string;
  unit_id?: string;
  tenant?: string;
  tenant_id?: string;
  start_date?: string;
  end_date?: string;
  rent?: number;
  deposit?: number;
  status?: Lease['status'];
}

interface DbPayment {
  id: string;
  invoice?: string;
  tenant?: string;
  tenant_id?: string;
  property?: string;
  property_id?: string;
  unit?: string;
  amount?: number;
  due_date?: string;
  paid_date?: string;
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

interface DbActivity {
  id: string;
  action?: Activity['action'];
  title?: string;
  description?: string;
  user?: string;
  created_at?: string;
}

function StatCard({ label, value, icon, trend, tone }: StatCardProps) {
  return (
    <Card className="group hover:shadow-elevated transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', tone)}>
            {icon}
          </div>
          {trend && (
            <div className={cn('flex items-center gap-1 text-xs font-medium', trend.up ? 'text-success-600' : 'text-danger-600')}>
              {trend.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {trend.value}
            </div>
          )}
        </div>
        <p className="mt-4 text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

const activityIcons: Record<string, ReactNode> = {
  create: <span className="text-success-600"><FileText className="h-4 w-4" /></span>,
  update: <span className="text-info-600"><FileText className="h-4 w-4" /></span>,
  delete: <span className="text-danger-600"><FileText className="h-4 w-4" /></span>,
  payment: <span className="text-success-600"><DollarSign className="h-4 w-4" /></span>,
  lease: <span className="text-primary-600"><FileText className="h-4 w-4" /></span>,
  maintenance: <span className="text-warning-600"><Wrench className="h-4 w-4" /></span>,
};

export function DashboardPage() {
  const { navigate } = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [propsRes, tenantsRes, leasesRes, payRes, maintRes, actRes] = await Promise.all([
      supabase.from('properties').select('*'),
      supabase.from('tenants').select('*'),
      supabase.from('leases').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('maintenance_tickets').select('*'),
      supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(6),
    ]);

    setProperties(
      ((propsRes.data as DbProperty[]) ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        address: r.address || '',
        city: r.city || '',
        state: r.state || '',
        zipCode: r.zip_code || '',
        type: r.type || 'Residential',
        units: Number(r.units) || 1,
        rent: Number(r.rent) || 0,
        status: r.status || 'available',
        owner: r.owner || '',
        ownerId: r.owner_id,
        yearBuilt: Number(r.year_built) || 2020,
        amenities: r.amenities || [],
      }))
    );

    setTenants(
      ((tenantsRes.data as DbTenant[]) ?? []).map((r) => ({
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
      }))
    );

    setLeases(
      ((leasesRes.data as DbLease[]) ?? []).map((r) => ({
        id: r.id,
        leaseId: r.lease_id || `LSE-${r.id.slice(0, 4)}`,
        property: r.property || '',
        propertyId: r.property_id,
        unit: r.unit || '',
        unitId: r.unit_id,
        tenant: r.tenant || '',
        tenantId: r.tenant_id,
        startDate: r.start_date || '',
        endDate: r.end_date || '',
        rent: Number(r.rent) || 0,
        deposit: Number(r.deposit) || 0,
        status: r.status || 'active',
      }))
    );

    setPayments(
      ((payRes.data as DbPayment[]) ?? []).map((r) => ({
        id: r.id,
        invoice: r.invoice || `INV-${r.id.slice(0, 5)}`,
        tenant: r.tenant || '',
        tenantId: r.tenant_id,
        property: r.property || '',
        propertyId: r.property_id,
        unit: r.unit || '',
        amount: Number(r.amount) || 0,
        dueDate: r.due_date || '',
        paidDate: r.paid_date || undefined,
        method: r.method || 'Bank Transfer',
        status: r.status || 'pending',
      }))
    );

    setMaintenanceTickets(
      ((maintRes.data as DbMaintenanceTicket[]) ?? []).map((r) => ({
        id: r.id,
        ticketId: r.ticket_id || `TCK-${r.id.slice(0, 4)}`,
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
      }))
    );

    setActivities(
      ((actRes.data as DbActivity[]) ?? []).map((r) => ({
        id: r.id,
        action: r.action || 'update',
        title: r.title || '',
        description: r.description || '',
        user: r.user || 'Admin',
        createdAt: r.created_at || new Date().toISOString(),
      }))
    );

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const availableProps = properties.filter((p) => p.status === 'available').length;
  const occupiedProps = properties.filter((p) => p.status === 'occupied').length;
  const activeLeases = leases.filter((l) => l.status === 'active').length;
  const expiringLeases = leases.filter((l) => l.status === 'expiring').length;
  const monthlyIncome = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pendingPayments = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const overduePayments = payments.filter((p) => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
  const openMaintenance = maintenanceTickets.filter((m) => m.status === 'open' || m.status === 'in_progress').length;
  const vacantUnits = properties.filter((p) => p.status === 'vacant').length;

  const expiringSoon = leases.filter((l) => l.status === 'expiring').sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  const recentPayments = [...payments].sort((a, b) => new Date(b.paidDate ?? b.dueDate).getTime() - new Date(a.paidDate ?? a.dueDate).getTime()).slice(0, 5);
  const recentTenants = [...tenants].sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()).slice(0, 4);

  const occupancyRate = properties.length > 0 ? Math.round((occupiedProps / properties.length) * 100) : 0;

  const occupancyChartData = [
    { label: 'Occupied', value: occupiedProps || 1, color: 'hsl(142 71% 45%)' },
    { label: 'Available', value: availableProps || 1, color: 'hsl(217 91% 60%)' },
    { label: 'Vacant', value: vacantUnits || 1, color: 'hsl(0 84% 60%)' },
  ];

  const maintenanceChartData = [
    { label: 'Open', value: maintenanceTickets.filter((t) => t.status === 'open').length || 1, color: 'hsl(217 91% 60%)' },
    { label: 'In Progress', value: maintenanceTickets.filter((t) => t.status === 'in_progress').length || 1, color: 'hsl(38 92% 50%)' },
    { label: 'Completed', value: maintenanceTickets.filter((t) => t.status === 'completed').length || 1, color: 'hsl(142 71% 45%)' },
  ];

  const monthlyRevenueData = [
    { month: 'Jan', revenue: 48000, expenses: 14200 },
    { month: 'Feb', revenue: 52000, expenses: 15100 },
    { month: 'Mar', revenue: 49500, expenses: 13800 },
    { month: 'Apr', revenue: 56000, expenses: 16400 },
    { month: 'May', revenue: 58500, expenses: 15900 },
    { month: 'Jun', revenue: 62000 + monthlyIncome, expenses: 17200 },
  ];

  const stats: StatCardProps[] = [
    { label: 'Total Properties', value: String(properties.length), icon: <Building2 className="h-5 w-5 text-primary-600" />, tone: 'bg-primary-50 dark:bg-primary-50/15', trend: { value: '+12%', up: true } },
    { label: 'Available Properties', value: String(availableProps), icon: <Home className="h-5 w-5 text-success-600" />, tone: 'bg-success-50 dark:bg-success-50/15' },
    { label: 'Occupied Properties', value: String(occupiedProps), icon: <DoorOpen className="h-5 w-5 text-info-600" />, tone: 'bg-info-50 dark:bg-info-50/15', trend: { value: '+8%', up: true } },
    { label: 'Total Tenants', value: String(tenants.length), icon: <Users className="h-5 w-5 text-primary-600" />, tone: 'bg-primary-50 dark:bg-primary-50/15', trend: { value: '+15%', up: true } },
    { label: 'Active Leases', value: String(activeLeases), icon: <FileText className="h-5 w-5 text-success-600" />, tone: 'bg-success-50 dark:bg-success-50/15' },
    { label: 'Expiring Leases', value: String(expiringLeases), icon: <AlertTriangle className="h-5 w-5 text-warning-600" />, tone: 'bg-warning-50 dark:bg-warning-50/15' },
    { label: 'Monthly Income', value: formatCurrency(monthlyIncome, true), icon: <DollarSign className="h-5 w-5 text-success-600" />, tone: 'bg-success-50 dark:bg-success-50/15', trend: { value: '+5.2%', up: true } },
    { label: 'Pending Payments', value: formatCurrency(pendingPayments, true), icon: <Clock className="h-5 w-5 text-warning-600" />, tone: 'bg-warning-50 dark:bg-warning-50/15' },
    { label: 'Overdue Payments', value: formatCurrency(overduePayments, true), icon: <AlertTriangle className="h-5 w-5 text-danger-600" />, tone: 'bg-danger-50 dark:bg-danger-50/15', trend: { value: '-3%', up: false } },
    { label: 'Maintenance Requests', value: String(openMaintenance), icon: <Wrench className="h-5 w-5 text-warning-600" />, tone: 'bg-warning-50 dark:bg-warning-50/15' },
    { label: 'Vacant Units', value: String(vacantUnits), icon: <DoorOpen className="h-5 w-5 text-danger-600" />, tone: 'bg-danger-50 dark:bg-danger-50/15' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-transition">
      <PageHeader title="Dashboard" description="Overview of your rental management operations" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Monthly Revenue</CardTitle>
              <Badge tone="success" dot>+5.2% vs last month</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={monthlyRevenueData.map((d) => ({ label: d.month, value: d.revenue, value2: d.expenses }))}
              color="hsl(217 91% 60%)"
              color2="hsl(0 84% 60%)"
              formatValue={(v) => formatCurrency(v, true)}
              legend={[{ label: 'Revenue', color: 'hsl(217 91% 60%)' }, { label: 'Expenses', color: 'hsl(0 84% 60%)' }]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={occupancyChartData}
              centerValue={`${occupancyRate}%`}
              centerLabel="Occupied"
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Lease Expiration Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={[
                { label: 'Jul', value: 2 },
                { label: 'Aug', value: expiringLeases || 3 },
                { label: 'Sep', value: 4 },
                { label: 'Oct', value: 1 },
                { label: 'Nov', value: 2 },
                { label: 'Dec', value: 3 },
              ]}
              color="hsl(38 92% 50%)"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={maintenanceChartData}
              centerValue={String(maintenanceTickets.length)}
              centerLabel="Tickets"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Rent Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={[
                { label: 'Jan', value: 42000, value2: 45000 },
                { label: 'Feb', value: 44500, value2: 45000 },
                { label: 'Mar', value: 43200, value2: 45000 },
                { label: 'Apr', value: 46000, value2: 48000 },
                { label: 'May', value: 47500, value2: 48000 },
                { label: 'Jun', value: 48200 + monthlyIncome, value2: 48000 },
              ]}
              color="hsl(142 71% 45%)"
              color2="hsl(217 91% 60%)"
              formatValue={(v) => formatCurrency(v, true)}
              legend={[{ label: 'Collected', color: 'hsl(142 71% 45%)' }, { label: 'Target', color: 'hsl(217 91% 60%)' }]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Expiring leases */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Expiring Leases</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/leases')}>
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {expiringSoon.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No leases expiring soon</p>
            ) : (
              expiringSoon.slice(0, 4).map((l) => {
                const days = daysUntil(l.endDate);
                return (
                  <div key={l.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{l.tenant}</p>
                      <p className="text-xs text-muted-foreground">{l.property} · Unit {l.unit}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge tone={days <= 30 ? 'danger' : 'warning'} dot>
                        {days}d left
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(l.endDate, { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Payments</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/payments')}>
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.tenant}</p>
                  <p className="text-xs text-muted-foreground">{p.property} · {p.method}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-success-600">{formatCurrency(p.amount)}</p>
                  <Badge tone={p.status === 'paid' ? 'success' : p.status === 'pending' ? 'warning' : 'danger'} dot>
                    {p.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent tenants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>New Tenants</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/tenants')}>
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTenants.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Avatar name={t.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge tone={t.status === 'active' ? 'success' : 'neutral'} dot>{t.status}</Badge>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(t.registeredAt, { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary shrink-0">
                  {activityIcons[a.action] ?? <FileText className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
                <div className="text-right shrink-0 text-xs text-muted-foreground">
                  <p>{timeAgo(a.createdAt)}</p>
                  <p className="text-[10px]">by {a.user}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
