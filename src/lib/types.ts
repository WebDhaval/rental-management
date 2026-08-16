export type ID = string;

export type PropertyStatus = 'available' | 'occupied' | 'maintenance' | 'vacant';
export type PropertyType = 'Apartment' | 'House' | 'Villa' | 'Condo' | 'Townhouse' | 'Studio' | 'Commercial';

export interface Unit {
  id: ID;
  unitNumber: string;
  floor: number;
  size: number; // sqft
  bedrooms: number;
  bathrooms: number;
  rent: number;
  deposit: number;
  status: 'available' | 'occupied' | 'maintenance';
  availableDate: string;
  propertyId: ID;
}

export interface Property {
  id: ID;
  name: string;
  type: PropertyType;
  address: string;
  city: string;
  ownerId?: ID;
  owner: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  status: PropertyStatus;
  occupancy: number; // percentage
  image: string;
  gallery: string[];
  manager?: string;
  amenities: string[];
  rules: string[];
  description: string;
  unitsCount: number;
  archived?: boolean;
}

export interface Tenant {
  id: ID;
  name: string;
  email: string;
  phone: string;
  emergencyContact: string;
  address: string;
  nationalId: string;
  occupation: string;
  company: string;
  notes: string;
  photo: string;
  registeredAt: string;
  status: 'active' | 'inactive';
}

export interface Owner {
  id: ID;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  taxNumber: string;
  bankDetails: string;
  propertiesOwned: number;
}

export type LeaseStatus = 'active' | 'expiring' | 'expired' | 'terminated' | 'pending';

export interface Lease {
  id: ID;
  number: string;
  tenantId?: ID;
  propertyId?: ID;
  unitId?: ID;
  tenant: string;
  property: string;
  unit: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  dueDate: number; // day of month
  status: LeaseStatus;
}

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial';
export type PaymentMethod = 'Bank Transfer' | 'Credit Card' | 'Cash' | 'Check' | 'PayPal';

export interface Payment {
  id: ID;
  invoice: string;
  tenantId?: ID;
  propertyId?: ID;
  unitId?: ID;
  tenant: string;
  property: string;
  unit: string;
  dueDate: string;
  paidDate: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
}

export type MaintenanceStatus = 'open' | 'in_progress' | 'waiting_parts' | 'completed' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface MaintenanceTicket {
  id: ID;
  ticketId: string;
  propertyId?: ID;
  unitId?: ID;
  tenantId?: ID;
  assignedStaffId?: ID;
  property: string;
  unit: string;
  tenant: string;
  category: string;
  priority: Priority;
  assignedStaff: string;
  status: MaintenanceStatus;
  createdAt: string;
  title: string;
  description: string;
}

export type StaffRole = 'Super Admin' | 'Property Manager' | 'Accountant' | 'Maintenance Staff' | 'Receptionist';

export interface Staff {
  id: ID;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: 'active' | 'inactive';
  avatar: string;
  joinedAt: string;
}

export interface DocItem {
  id: ID;
  name: string;
  type: 'Lease Agreement' | 'Property Document' | 'Tenant Document' | 'Owner Document' | 'Insurance' | 'Photo';
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  propertyId?: ID;
  tenantId?: ID;
  ownerId?: ID;
}

export interface CalendarEvent {
  id: ID;
  title: string;
  date: string;
  type: 'lease_expiry' | 'payment_due' | 'inspection' | 'maintenance' | 'move_in' | 'move_out';
  property: string;
}

export interface AppNotification {
  id: ID;
  title: string;
  message: string;
  type: 'rent_due' | 'overdue_rent' | 'lease_expiring' | 'maintenance_assigned' | 'maintenance_completed' | 'new_tenant' | 'vacant_property';
  read: boolean;
  createdAt: string;
}

export interface Activity {
  id: ID;
  actor: string;
  action: string;
  target: string;
  time: string;
  type: 'create' | 'update' | 'delete' | 'payment' | 'lease' | 'maintenance';
}
