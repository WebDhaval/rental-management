import { type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  icon?: ReactNode;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', icon,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center gap-4 text-center pt-2">
        <div className={`flex h-14 w-14 items-center justify-center rounded-full ${variant === 'danger' ? 'bg-danger-50 text-danger-600 dark:bg-danger-50/15 dark:text-danger-500' : 'bg-primary-50 text-primary-600 dark:bg-primary-50/15 dark:text-primary-400'}`}>
          {icon ?? <AlertTriangle className="h-7 w-7" />}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex w-full gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} className="flex-1" onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
