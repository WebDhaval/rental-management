import { useState } from 'react';
import {
  Building, DollarSign, Percent, CreditCard, Mail, MessageSquare,
  Bell, Save, Upload,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea, FieldGroup } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'general', label: 'General', icon: Building },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'payment', label: 'Payment Methods', icon: CreditCard },
  { id: 'email', label: 'Email Templates', icon: Mail },
  { id: 'sms', label: 'SMS Templates', icon: MessageSquare },
  { id: 'notifications', label: 'Notifications', icon: Bell },
] as const;

export function SettingsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('general');

  const handleSave = () => {
    toast.success('Settings saved', 'Your changes have been saved successfully.');
  };

  return (
    <div className="space-y-6 page-transition">
      <PageHeader title="Settings" description="Manage your application preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Tabs sidebar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-2">
            <div className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                      activeTab === t.id ? 'bg-primary-50 text-primary-700 dark:bg-primary-50/15 dark:text-primary-300' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tab content */}
        <div className="lg:col-span-3">
          {activeTab === 'general' && (
            <Card>
              <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-primary-foreground">
                    <Building className="h-8 w-8" />
                  </div>
                  <div>
                    <Button variant="outline" size="sm"><Upload className="h-4 w-4" /> Upload Logo</Button>
                    <p className="mt-1 text-xs text-muted-foreground">PNG or JPG, max 2MB</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldGroup label="Company Name"><Input defaultValue="EstateHub Property Management" /></FieldGroup>
                  <FieldGroup label="Contact Email"><Input type="email" defaultValue="contact@estatehub.com" /></FieldGroup>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldGroup label="Phone"><Input defaultValue="(555) 100-2000" /></FieldGroup>
                  <FieldGroup label="Website"><Input defaultValue="https://estatehub.com" /></FieldGroup>
                </div>
                <FieldGroup label="Address"><Textarea defaultValue="100 Business Center Drive, Suite 200, Los Angeles, CA 90001" /></FieldGroup>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FieldGroup label="Currency">
                    <Select defaultValue="USD">
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                    </Select>
                  </FieldGroup>
                  <FieldGroup label="Timezone">
                    <Select defaultValue="PST">
                      <option value="PST">PST (UTC-8)</option>
                      <option value="EST">EST (UTC-5)</option>
                      <option value="CST">CST (UTC-6)</option>
                      <option value="UTC">UTC</option>
                    </Select>
                  </FieldGroup>
                  <FieldGroup label="Date Format">
                    <Select defaultValue="MM/DD/YYYY">
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </Select>
                  </FieldGroup>
                </div>
                <div className="flex justify-end"><Button onClick={handleSave}><Save className="h-4 w-4" /> Save Changes</Button></div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'finance' && (
            <Card>
              <CardHeader><CardTitle>Financial Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldGroup label="Tax Rate (%)" hint="Applied to rent amounts">
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="number" className="pl-10" defaultValue="8.5" />
                    </div>
                  </FieldGroup>
                  <FieldGroup label="Late Fee ($)" hint="Charged after due date">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="number" className="pl-10" defaultValue="50" />
                    </div>
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldGroup label="Grace Period (days)"><Input type="number" defaultValue="5" /></FieldGroup>
                  <FieldGroup label="Security Deposit Cap (months)"><Input type="number" defaultValue="2" /></FieldGroup>
                </div>
                <div className="flex justify-end"><Button onClick={handleSave}><Save className="h-4 w-4" /> Save Changes</Button></div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'payment' && (
            <Card>
              <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {['Bank Transfer', 'Credit Card', 'Cash', 'Check', 'PayPal'].map((m) => (
                  <div key={m} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">{m}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={m !== 'Check'} className="sr-only peer" />
                      <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                ))}
                <div className="flex justify-end pt-2"><Button onClick={handleSave}><Save className="h-4 w-4" /> Save Changes</Button></div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'email' && (
            <Card>
              <CardHeader><CardTitle>Email Templates</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {['Rent Due Reminder', 'Lease Expiry Notice', 'Welcome Email', 'Payment Confirmation', 'Maintenance Update'].map((t) => (
                  <div key={t} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{t}</span>
                      <Badge tone="primary">Active</Badge>
                    </div>
                    <Input className="mb-2" defaultValue={`Subject: ${t}`} />
                    <Textarea defaultValue={`Dear {tenant_name},\n\nThis is a notification regarding ${t.toLowerCase()}.\n\nBest regards,\nEstateHub Team`} />
                  </div>
                ))}
                <div className="flex justify-end"><Button onClick={handleSave}><Save className="h-4 w-4" /> Save Templates</Button></div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'sms' && (
            <Card>
              <CardHeader><CardTitle>SMS Templates</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {['Rent Due SMS', 'Payment Confirmation SMS', 'Maintenance Update SMS'].map((t) => (
                  <div key={t} className="rounded-lg border border-border p-4">
                    <span className="text-sm font-medium block mb-2">{t}</span>
                    <Input defaultValue={`Hi {tenant_name}, your rent is due on {due_date}. Amount: {amount}. - EstateHub`} />
                  </div>
                ))}
                <div className="flex justify-end"><Button onClick={handleSave}><Save className="h-4 w-4" /> Save Templates</Button></div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader><CardTitle>Notification Settings</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['Rent Due Reminders', 'Notify tenants before rent is due'],
                  ['Overdue Rent Alerts', 'Alert staff when rent is overdue'],
                  ['Lease Expiry Warnings', 'Notify 60 days before lease expires'],
                  ['Maintenance Updates', 'Notify tenants on maintenance status changes'],
                  ['New Tenant Welcome', 'Send welcome email to new tenants'],
                  ['Vacant Property Alerts', 'Alert when a property becomes vacant'],
                ].map(([label, desc]) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                ))}
                <div className="flex justify-end pt-2"><Button onClick={handleSave}><Save className="h-4 w-4" /> Save Settings</Button></div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
