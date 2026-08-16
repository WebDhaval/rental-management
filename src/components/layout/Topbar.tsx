import { useState, useRef, useEffect, type ReactNode, useCallback } from 'react';
import {
  Search, Bell, Sun, Moon, Menu, Plus, ChevronDown, Settings, LogOut, User,
  Command, Check,
} from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import { useTheme } from '@/lib/theme';
import { useRouter } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import { navItems } from '@/lib/nav';
import { Avatar } from '@/components/ui/Avatar';
import { supabase } from '@/lib/supabase';
import type { AppNotification } from '@/lib/types';

interface TopbarProps {
  onMenuClick: () => void;
  onQuickAction: () => void;
}

const notifIcons: Record<string, ReactNode> = {
  rent_due: <span className="text-warning-600"><Bell className="h-4 w-4" /></span>,
  overdue_rent: <span className="text-danger-600"><Bell className="h-4 w-4" /></span>,
  lease_expiring: <span className="text-info-600"><Bell className="h-4 w-4" /></span>,
  maintenance_assigned: <span className="text-primary-600"><Bell className="h-4 w-4" /></span>,
  maintenance_completed: <span className="text-success-600"><Check className="h-4 w-4" /></span>,
  new_tenant: <span className="text-success-600"><User className="h-4 w-4" /></span>,
  vacant_property: <span className="text-danger-600"><Bell className="h-4 w-4" /></span>,
};

interface DbNotification {
  id: string;
  type?: string;
  title: string;
  message: string;
  created_at?: string;
  read?: boolean;
  link?: string;
}

export function Topbar({ onMenuClick, onQuickAction }: TopbarProps) {
  const { theme, toggle } = useTheme();
  const { navigate } = useRouter();
  const { user, signOut } = useAuth();
  const displayName = user?.email?.split('@')[0]?.replace(/[._]/g, ' ') ?? 'User';
  const displayEmail = user?.email ?? '';
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = useCallback(async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(10);
    if (data) {
      setNotifications(
        (data as DbNotification[]).map((r) => ({
          id: r.id,
          type: (r.type as AppNotification['type']) || 'rent_due',
          title: r.title,
          message: r.message,
          createdAt: r.created_at || new Date().toISOString(),
          read: !!r.read,
          link: r.link,
        }))
      );
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchResults = searchQuery
    ? navItems.filter((n) => n.label.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/80 backdrop-blur-xl px-4 lg:px-6">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search properties, tenants, leases..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            className="h-10 w-full rounded-lg border border-input bg-secondary/50 pl-10 pr-16 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-12 rounded-xl border border-border bg-card shadow-elevated animate-scale-in overflow-hidden">
            {searchResults.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.path}
                  onClick={() => { navigate(r.path); setSearchOpen(false); setSearchQuery(''); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{r.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{r.group}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        {/* Quick action */}
        <button
          onClick={onQuickAction}
          className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-soft hover:bg-primary-700 transition-colors active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Quick Add</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title="Toggle theme"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); fetchNotifs(); }}
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-danger-foreground">
                {unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-elevated animate-scale-in overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="font-semibold">Notifications</span>
                <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                  {unread} unread
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">No notifications</p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { navigate('/notifications'); setNotifOpen(false); }}
                      className={cn(
                        'flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left hover:bg-secondary/50 transition-colors',
                        !n.read && 'bg-primary-50/30 dark:bg-primary-50/5',
                      )}
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        {notifIcons[n.type] ?? notifIcons.rent_due}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={() => { navigate('/notifications'); setNotifOpen(false); }}
                className="w-full border-t border-border px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-secondary transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-secondary transition-colors"
          >
            <Avatar name={displayName} size="sm" />
            <div className="hidden md:flex flex-col items-start leading-none">
              <span className="text-sm font-medium capitalize">{displayName}</span>
              <span className="text-[10px] text-muted-foreground">{displayEmail}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-12 w-56 rounded-xl border border-border bg-card shadow-elevated animate-scale-in overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold capitalize">{displayName}</p>
                <p className="text-xs text-muted-foreground">{displayEmail}</p>
              </div>
              <div className="p-1.5">
                <button onClick={() => { navigate('/settings'); setProfileOpen(false); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-secondary transition-colors">
                  <Settings className="h-4 w-4 text-muted-foreground" /> Settings
                </button>
                <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-secondary transition-colors">
                  <User className="h-4 w-4 text-muted-foreground" /> My Profile
                </button>
                <button onClick={() => signOut()} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-50 dark:hover:bg-danger-50/10 transition-colors">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
