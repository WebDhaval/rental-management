import {
  LayoutDashboard, Building2, DoorOpen, Users, UserCog, FileText,
  Calendar, BarChart3, Bell, Settings, Wrench, CreditCard, FolderOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  group: string;
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, group: 'Overview' },
  { label: 'Properties', path: '/properties', icon: Building2, group: 'Management' },
  { label: 'Units', path: '/units', icon: DoorOpen, group: 'Management' },
  { label: 'Tenants', path: '/tenants', icon: Users, group: 'Management' },
  { label: 'Owners', path: '/owners', icon: UserCog, group: 'Management' },
  { label: 'Leases', path: '/leases', icon: FileText, group: 'Management' },
  { label: 'Payments', path: '/payments', icon: CreditCard, group: 'Financial' },
  { label: 'Maintenance', path: '/maintenance', icon: Wrench, group: 'Operations' },
  { label: 'Staff', path: '/staff', icon: Users, group: 'Operations' },
  { label: 'Documents', path: '/documents', icon: FolderOpen, group: 'Operations' },
  { label: 'Calendar', path: '/calendar', icon: Calendar, group: 'Operations' },
  { label: 'Reports', path: '/reports', icon: BarChart3, group: 'Insights' },
  { label: 'Notifications', path: '/notifications', icon: Bell, badge: '4', group: 'Insights' },
  { label: 'Settings', path: '/settings', icon: Settings, group: 'Insights' },
];
