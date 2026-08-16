import { Building2, UserPlus, FileText, CreditCard, Wrench, User } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useRouter } from '@/lib/router';

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
}

const actions = [
  { label: 'New Property', icon: Building2, path: '/properties', color: 'text-primary-600 bg-primary-50 dark:bg-primary-50/15' },
  { label: 'New Tenant', icon: UserPlus, path: '/tenants', color: 'text-success-600 bg-success-50 dark:bg-success-50/15' },
  { label: 'New Lease', icon: FileText, path: '/leases', color: 'text-info-600 bg-info-50 dark:bg-info-50/15' },
  { label: 'Record Payment', icon: CreditCard, path: '/payments', color: 'text-warning-600 bg-warning-50 dark:bg-warning-50/15' },
  { label: 'Maintenance Ticket', icon: Wrench, path: '/maintenance', color: 'text-danger-600 bg-danger-50 dark:bg-danger-50/15' },
  { label: 'New Staff Member', icon: User, path: '/staff', color: 'text-primary-600 bg-primary-50 dark:bg-primary-50/15' },
];

export function QuickAddModal({ open, onClose }: QuickAddModalProps) {
  const { navigate } = useRouter();
  return (
    <Modal open={open} onClose={onClose} title="Quick Add" description="Create a new record" size="lg">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              onClick={() => { navigate(a.path); onClose(); }}
              className="group flex flex-col items-center gap-3 rounded-xl border border-border p-5 text-center hover:border-primary/40 hover:bg-secondary/50 transition-all"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${a.color} group-hover:scale-110 transition-transform`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">{a.label}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
