import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Upload, Search, Image as ImageIcon, Download, Trash2,
  FolderOpen, FileCheck, Shield, Users, Building, Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import type { DocItem } from '@/lib/types';
import { formatDate, cn } from '@/lib/utils';

const typeIcons: Record<DocItem['type'], React.ReactNode> = {
  'Lease Agreement': <FileCheck className="h-5 w-5" />,
  'Property Document': <Building className="h-5 w-5" />,
  'Tenant Document': <Users className="h-5 w-5" />,
  'Owner Document': <Users className="h-5 w-5" />,
  'Insurance': <Shield className="h-5 w-5" />,
  'Photo': <ImageIcon className="h-5 w-5" />,
};

const typeTone: Record<DocItem['type'], 'primary' | 'success' | 'info' | 'warning' | 'neutral' | 'danger'> = {
  'Lease Agreement': 'primary',
  'Property Document': 'info',
  'Tenant Document': 'success',
  'Owner Document': 'warning',
  'Insurance': 'danger',
  'Photo': 'neutral',
};

const typeBg: Record<DocItem['type'], string> = {
  'Lease Agreement': 'bg-primary-50 text-primary-600 dark:bg-primary-50/15',
  'Property Document': 'bg-info-50 text-info-600 dark:bg-info-50/15',
  'Tenant Document': 'bg-success-50 text-success-600 dark:bg-success-50/15',
  'Owner Document': 'bg-warning-50 text-warning-600 dark:bg-warning-50/15',
  'Insurance': 'bg-danger-50 text-danger-600 dark:bg-danger-50/15',
  'Photo': 'bg-secondary text-muted-foreground',
};

const docTypes: DocItem['type'][] = ['Lease Agreement', 'Property Document', 'Tenant Document', 'Owner Document', 'Insurance', 'Photo'];

interface DbDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded_at: string;
  uploaded_by: string;
  property?: string;
  property_id?: string;
  url?: string;
}

function fromDb(r: DbDocument): DocItem {
  return {
    id: r.id,
    name: r.name,
    type: (r.type || 'Property Document') as DocItem['type'],
    size: r.size || '100 KB',
    uploadedAt: r.uploaded_at || new Date().toISOString().slice(0, 10),
    uploadedBy: r.uploaded_by || 'Admin',
    property: r.property,
    propertyId: r.property_id,
    url: r.url,
  };
}

function toDb(d: DocItem) {
  return {
    name: d.name,
    type: d.type,
    size: d.size,
    uploaded_at: d.uploadedAt,
    uploaded_by: d.uploadedBy,
    property: d.property || null,
    property_id: d.propertyId || null,
    url: d.url || null,
  };
}

export function DocumentsPage() {
  const toast = useToast();
  const [data, setData] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DocItem | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Failed to load documents', error.message);
    else setData((rows as DbDocument[] ?? []).map(fromDb));
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => data.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && d.type !== filterType) return false;
    return true;
  }), [data, search, filterType]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newDocs: DocItem[] = Array.from(files).map((f) => ({
      id: '',
      name: f.name,
      type: f.type.startsWith('image/') ? 'Photo' : 'Property Document',
      size: `${(f.size / 1024).toFixed(0)} KB`,
      uploadedAt: new Date().toISOString().slice(0, 10),
      uploadedBy: 'Alex Morgan',
    }));

    for (const doc of newDocs) {
      await supabase.from('documents').insert(toDb(doc));
    }

    toast.success('Files uploaded', `${files.length} file(s) uploaded successfully.`);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('documents').delete().eq('id', deleteTarget.id);
    if (error) toast.error('Failed to delete', error.message);
    else { toast.success('Document deleted', `${deleteTarget.name} removed.`); fetchData(); }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 page-transition">
      <PageHeader title="Documents" description="Store and manage all your important documents" />

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
        className={cn(
          'rounded-2xl border-2 border-dashed p-8 text-center transition-all',
          dragOver ? 'border-primary bg-primary-50/30 dark:bg-primary-50/10' : 'border-border hover:border-primary/40',
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-50/15">
            <Upload className="h-7 w-7" />
          </div>
          <div>
            <p className="font-medium">Drag and drop files here</p>
            <p className="text-sm text-muted-foreground">or click to browse — supports PDF, DOCX, images</p>
          </div>
          <label className="cursor-pointer">
            <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
            <Button variant="outline"><Upload className="h-4 w-4" /> Browse Files</Button>
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {docTypes.map((type) => {
          const count = data.filter((d) => d.type === type).length;
          return (
            <Card key={type} className="text-center">
              <CardContent className="p-3">
                <div className={cn('mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-lg', typeBg[type])}>
                  {typeIcons[type]}
                </div>
                <p className="text-lg font-bold">{count}</p>
                <p className="text-[10px] text-muted-foreground truncate">{type}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select className="w-48" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All types</option>
          {docTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </div>

      {/* Documents grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderOpen className="h-10 w-10 opacity-40" />
            <p className="mt-3 text-sm">No documents found</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((d) => (
            <Card key={d.id} className="group hover:shadow-elevated transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', typeBg[d.type])}>
                    {typeIcons[d.type]}
                  </div>
                  <Badge tone={typeTone[d.type]}>{d.type}</Badge>
                </div>
                <p className="font-medium text-sm truncate" title={d.name}>{d.name}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                  <span>{d.size}</span>
                  <span>{formatDate(d.uploadedAt, { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
                  <span className="text-xs text-muted-foreground truncate">{d.property ?? d.uploadedBy}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => toast.success('Download started', `Downloading ${d.name}...`)}><Download className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(d)}><Trash2 className="h-3.5 w-3.5 text-danger" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete document?" message={`This will permanently delete ${deleteTarget?.name}.`} confirmLabel="Delete" />
    </div>
  );
}
