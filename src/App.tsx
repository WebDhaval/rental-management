import { useState } from 'react';
import { ThemeProvider } from '@/lib/theme';
import { RouterProvider, useRouter } from '@/lib/router';
import { ToastProvider } from '@/lib/toast';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { QuickAddModal } from '@/components/shared/QuickAddModal';
import { LoginPage } from '@/pages/LoginPage';
import { cn } from '@/lib/utils';

import { DashboardPage } from '@/pages/DashboardPage';
import { PropertiesPage } from '@/pages/PropertiesPage';
import { UnitsPage } from '@/pages/UnitsPage';
import { TenantsPage } from '@/pages/TenantsPage';
import { OwnersPage } from '@/pages/OwnersPage';
import { LeasesPage } from '@/pages/LeasesPage';
import { PaymentsPage } from '@/pages/PaymentsPage';
import { MaintenancePage } from '@/pages/MaintenancePage';
import { StaffPage } from '@/pages/StaffPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { SettingsPage } from '@/pages/SettingsPage';

function AppContent() {
  const { path } = useRouter();
  const { session, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (path) {
      case '/': return <DashboardPage />;
      case '/properties': return <PropertiesPage />;
      case '/units': return <UnitsPage />;
      case '/tenants': return <TenantsPage />;
      case '/owners': return <OwnersPage />;
      case '/leases': return <LeasesPage />;
      case '/payments': return <PaymentsPage />;
      case '/maintenance': return <MaintenancePage />;
      case '/staff': return <StaffPage />;
      case '/documents': return <DocumentsPage />;
      case '/calendar': return <CalendarPage />;
      case '/reports': return <ReportsPage />;
      case '/notifications': return <NotificationsPage />;
      case '/settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className={cn('flex flex-col min-h-screen transition-all duration-300', collapsed ? 'lg:pl-[72px]' : 'lg:pl-64')}>
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          onQuickAction={() => setQuickAddOpen(true)}
        />
        <main className="flex-1 p-4 lg:p-6">
          {renderPage()}
        </main>
      </div>
      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
