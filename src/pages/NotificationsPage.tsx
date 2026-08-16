import { useState, useEffect, useCallback } from 'react';
import {
  Bell, Check, CheckCheck, DollarSign, AlertTriangle, FileText, Wrench, User, Home, Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import type { AppNotification } from '@/lib/types';
import { timeAgo, cn } from '@/lib/utils';

const config: Record<AppNotification['type'], { icon: React.ReactNode; tone: string }> = {
  rent_due: { icon: <DollarSign className="h-5 w-5" />, tone: 'bg-warning-50 text-warning-600 dark:bg-warning-50/15' },
  overdue_rent: { icon: <AlertTriangle className="h-5 w-5" />, tone: 'bg-danger-50 text-danger-600 dark:bg-danger-50/15' },
  lease_expiring: { icon: <FileText className="h-5 w-5" />, tone: 'bg-info-50 text-info-600 dark:bg-info-50/15' },
  maintenance_assigned: { icon: <Wrench className="h-5 w-5" />, tone: 'bg-primary-50 text-primary-600 dark:bg-primary-50/15' },
  maintenance_completed: { icon: <Check className="h-5 w-5" />, tone: 'bg-success-50 text-success-600 dark:bg-success-50/15' },
  new_tenant: { icon: <User className="h-5 w-5" />, tone: 'bg-success-50 text-success-600 dark:bg-success-50/15' },
  vacant_property: { icon: <Home className="h-5 w-5" />, tone: 'bg-danger-50 text-danger-600 dark:bg-danger-50/15' },
};

const filters = ['all', 'unread', 'rent', 'lease', 'maintenance'] as const;

interface DbNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  link?: string;
}

function fromDb(r: DbNotification): AppNotification {
  return {
    id: r.id,
    type: (r.type || 'rent_due') as AppNotification['type'],
    title: r.title,
    message: r.message,
    createdAt: r.created_at || new Date().toISOString(),
    read: !!r.read,
    link: r.link,
  };
}

export function NotificationsPage() {
  const toast = useToast();
  const [data, setData] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof filters)[number]>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Failed to load notifications', error.message);
    else setData((rows as DbNotification[] ?? []).map(fromDb));
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'rent') return n.type === 'rent_due' || n.type === 'overdue_rent';
    if (filter === 'lease') return n.type === 'lease_expiring';
    if (filter === 'maintenance') return n.type === 'maintenance_assigned' || n.type === 'maintenance_completed';
    return true;
  });

  const unreadCount = data.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    setData((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    setData((p) => p.map((n) => ({ ...n, read: true })));
    for (const item of data.filter((n) => !n.read)) {
      await supabase.from('notifications').update({ read: true }).eq('id', item.id);
    }
    toast.success('All marked as read', 'All notifications have been marked as read.');
  };

  return (
    <div className="space-y-6 page-transition">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread notifications`}
        actions={<Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}><CheckCheck className="h-4 w-4" /> Mark all read</Button>}
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}>
            <Badge tone={filter === f ? 'primary' : 'neutral'} className="capitalize cursor-pointer">
              {f}
              {f === 'unread' && unreadCount > 0 && <span className="ml-1.5 font-bold">{unreadCount}</span>}
            </Badge>
          </button>
        ))}
      </div>

      {/* Notifications */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="h-10 w-10 opacity-40" />
              <p className="mt-3 text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((n) => {
                const cfg = config[n.type] ?? config.rent_due;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-start gap-4 p-4 transition-colors hover:bg-secondary/50',
                      !n.read && 'bg-primary-50/20 dark:bg-primary-50/5',
                    )}
                  >
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', cfg.tone)}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{n.title}</p>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)} className="shrink-0">
                        <Check className="h-4 w-4" /> Mark read
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
