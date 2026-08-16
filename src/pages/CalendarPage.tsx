import { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Wrench, LogIn, LogOut, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import type { CalendarEvent } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

const eventTypeConfig: Record<CalendarEvent['type'], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  lease_expiry: { label: 'Lease Expiry', color: 'text-danger-600', bg: 'bg-danger-500', icon: <CalendarIcon className="h-4 w-4" /> },
  payment_due: { label: 'Payment Due', color: 'text-warning-600', bg: 'bg-warning-500', icon: <Clock className="h-4 w-4" /> },
  inspection: { label: 'Inspection', color: 'text-info-600', bg: 'bg-info-500', icon: <Search className="h-4 w-4" /> },
  maintenance: { label: 'Maintenance', color: 'text-primary-600', bg: 'bg-primary-500', icon: <Wrench className="h-4 w-4" /> },
  move_in: { label: 'Move-in', color: 'text-success-600', bg: 'bg-success-500', icon: <LogIn className="h-4 w-4" /> },
  move_out: { label: 'Move-out', color: 'text-neutral-600', bg: 'bg-muted-foreground', icon: <LogOut className="h-4 w-4" /> },
};

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface DbEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  property: string;
}

function fromDb(r: DbEvent): CalendarEvent {
  return {
    id: r.id,
    title: r.title,
    date: r.date,
    type: (r.type || 'inspection') as CalendarEvent['type'],
    property: r.property || '',
  };
}

export function CalendarPage() {
  const toast = useToast();
  const [data, setData] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // August 2026
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from('calendar_events').select('*');
    if (error) toast.error('Failed to load events', error.message);
    else setData((rows as DbEvent[] ?? []).map(fromDb));
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    data.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [data]);

  const dateStr = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] ?? [] : [];
  const upcomingEvents = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 6);

  return (
    <div className="space-y-6 page-transition">
      <PageHeader title="Calendar" description="Track leases, payments, inspections, and more" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{months[month]} {year}</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(2026, 7, 1))}>Today</Button>
                <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekdays.map((d) => (
                    <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const ds = dateStr(day);
                    const events = eventsByDate[ds] ?? [];
                    const isSelected = selectedDate === ds;
                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(isSelected ? null : ds)}
                        className={cn(
                          'aspect-square rounded-lg border p-1.5 text-left transition-all hover:shadow-soft',
                          isSelected ? 'border-primary bg-primary-50/50 dark:bg-primary-50/10' : 'border-border',
                          isToday && 'ring-2 ring-primary ring-offset-1 ring-offset-card',
                        )}
                      >
                        <span className={cn('text-xs font-medium', isToday && 'text-primary-600')}>{day}</span>
                        {events.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {events.slice(0, 2).map((e) => (
                              <div key={e.id} className={cn('h-1.5 rounded-full', eventTypeConfig[e.type]?.bg ?? 'bg-primary-500')} />
                            ))}
                            {events.length > 2 && <p className="text-[9px] text-muted-foreground">+{events.length - 2} more</p>}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Selected date events */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedDate ? formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Upcoming Events'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(selectedDate ? selectedEvents : upcomingEvents).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No events scheduled</p>
              ) : (
                (selectedDate ? selectedEvents : upcomingEvents).map((e) => {
                  const cfg = eventTypeConfig[e.type] ?? eventTypeConfig.inspection;
                  return (
                    <div key={e.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', cfg.color, 'bg-secondary')}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{e.property}</p>
                        <Badge tone="neutral" className="mt-1">{cfg.label}</Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Event type legend */}
          <Card>
            <CardHeader><CardTitle>Event Types</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(eventTypeConfig).map(([type, cfg]) => (
                <div key={type} className="flex items-center gap-2.5 text-sm">
                  <div className={cn('h-2.5 w-2.5 rounded-full', cfg.bg)} />
                  <span className="text-muted-foreground">{cfg.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
