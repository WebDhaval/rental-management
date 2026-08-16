import type {
  Property, Unit, Tenant, Owner, Lease, Payment, MaintenanceTicket,
  Staff, DocItem, CalendarEvent, AppNotification, Activity,
} from './types';

const img = {
  p1: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
  p2: 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=800',
  p3: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
  p4: 'https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg?auto=compress&cs=tinysrgb&w=800',
  p5: 'https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg?auto=compress&cs=tinysrgb&w=800',
  p6: 'https://images.pexels.com/photos/2462015/pexels-photo-2462015.jpeg?auto=compress&cs=tinysrgb&w=800',
  p7: 'https://images.pexels.com/photos/210258/pexels-photo-210258.jpeg?auto=compress&cs=tinysrgb&w=800',
  p8: 'https://images.pexels.com/photos/210117/pexels-photo-210117.jpeg?auto=compress&cs=tinysrgb&w=800',
};

export const properties: Property[] = [
  {
    id: 'p1', name: 'Sunset Gardens', type: 'Apartment', address: '123 Sunset Blvd', city: 'Los Angeles, CA',
    ownerId: 'o1', owner: 'Robert Chen', rent: 2400, bedrooms: 2, bathrooms: 2, status: 'occupied', occupancy: 92,
    image: img.p1, gallery: [img.p1, img.p3, img.p5], manager: 'Sarah Mitchell',
    amenities: ['Pool', 'Gym', 'Parking', 'Laundry', 'AC'], rules: ['No smoking', 'No pets', 'Quiet hours 10pm-6am'],
    description: 'Modern apartment complex in the heart of Sunset Boulevard with premium amenities.',
    unitsCount: 24, archived: false,
  },
  {
    id: 'p2', name: 'Maple Heights', type: 'House', address: '456 Maple Street', city: 'Austin, TX',
    ownerId: 'o2', owner: 'Emily Rodriguez', rent: 3200, bedrooms: 3, bathrooms: 2, status: 'available', occupancy: 0,
    image: img.p2, gallery: [img.p2, img.p4], manager: 'James Park',
    amenities: ['Garage', 'Backyard', 'Fireplace', 'AC'], rules: ['No smoking', 'Pets allowed'],
    description: 'Spacious family home with large backyard in a quiet neighborhood.',
    unitsCount: 1, archived: false,
  },
  {
    id: 'p3', name: 'Oakwood Villa', type: 'Villa', address: '789 Oakwood Drive', city: 'Miami, FL',
    ownerId: 'o3', owner: 'Michael Thompson', rent: 5500, bedrooms: 4, bathrooms: 3, status: 'occupied', occupancy: 100,
    image: img.p3, gallery: [img.p3, img.p6, img.p7], manager: 'Sarah Mitchell',
    amenities: ['Pool', 'Spa', 'Garden', 'Garage', 'Security'], rules: ['No parties', 'No smoking'],
    description: 'Luxury villa with private pool and Mediterranean architecture.',
    unitsCount: 1, archived: false,
  },
  {
    id: 'p4', name: 'Downtown Lofts', type: 'Condo', address: '321 Main Avenue', city: 'New York, NY',
    ownerId: 'o1', owner: 'Robert Chen', rent: 3800, bedrooms: 1, bathrooms: 1, status: 'occupied', occupancy: 85,
    image: img.p4, gallery: [img.p4, img.p8], manager: 'James Park',
    amenities: ['Gym', 'Concierge', 'Parking', 'AC', 'Roof Terrace'], rules: ['No smoking', 'No pets'],
    description: 'Contemporary loft-style condos in downtown with city skyline views.',
    unitsCount: 18, archived: false,
  },
  {
    id: 'p5', name: 'Riverside Townhomes', type: 'Townhouse', address: '654 River Road', city: 'Portland, OR',
    ownerId: 'o2', owner: 'Emily Rodriguez', rent: 2900, bedrooms: 3, bathrooms: 2, status: 'maintenance', occupancy: 50,
    image: img.p5, gallery: [img.p5, img.p2], manager: 'Lisa Anderson',
    amenities: ['Garage', 'Backyard', 'Parking'], rules: ['No smoking', 'Pets allowed'],
    description: 'Charming townhomes along the river with scenic views.',
    unitsCount: 8, archived: false,
  },
  {
    id: 'p6', name: 'Pinecrest Studios', type: 'Studio', address: '987 Pine Lane', city: 'Seattle, WA',
    ownerId: 'o3', owner: 'Michael Thompson', rent: 1500, bedrooms: 0, bathrooms: 1, status: 'available', occupancy: 0,
    image: img.p6, gallery: [img.p6, img.p1], manager: 'Lisa Anderson',
    amenities: ['Gym', 'Laundry', 'AC'], rules: ['No smoking', 'Quiet hours'],
    description: 'Compact studios perfect for young professionals near downtown.',
    unitsCount: 32, archived: false,
  },
  {
    id: 'p7', name: 'Harbor View Towers', type: 'Apartment', address: '147 Harbor Way', city: 'San Francisco, CA',
    ownerId: 'o1', owner: 'Robert Chen', rent: 4200, bedrooms: 2, bathrooms: 2, status: 'occupied', occupancy: 96,
    image: img.p7, gallery: [img.p7, img.p4, img.p8], manager: 'Sarah Mitchell',
    amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Bay View'], rules: ['No smoking', 'No pets'],
    description: 'High-rise apartments with stunning bay views and premium amenities.',
    unitsCount: 40, archived: false,
  },
  {
    id: 'p8', name: 'Cedar Court', type: 'Commercial', address: '258 Cedar Avenue', city: 'Chicago, IL',
    ownerId: 'o2', owner: 'Emily Rodriguez', rent: 6800, bedrooms: 0, bathrooms: 2, status: 'vacant', occupancy: 0,
    image: img.p8, gallery: [img.p8], manager: 'James Park',
    amenities: ['Parking', 'Security', 'AC'], rules: ['No residential use'],
    description: 'Commercial retail space on a busy avenue with high foot traffic.',
    unitsCount: 6, archived: false,
  },
];

export const units: Unit[] = [
  { id: 'u1', unitNumber: '101', floor: 1, size: 750, bedrooms: 1, bathrooms: 1, rent: 1800, deposit: 1800, status: 'occupied', availableDate: '2025-01-15', propertyId: 'p1' },
  { id: 'u2', unitNumber: '102', floor: 1, size: 820, bedrooms: 2, bathrooms: 1, rent: 2200, deposit: 2200, status: 'available', availableDate: '2026-09-01', propertyId: 'p1' },
  { id: 'u3', unitNumber: '201', floor: 2, size: 900, bedrooms: 2, bathrooms: 2, rent: 2400, deposit: 2400, status: 'occupied', availableDate: '2024-11-01', propertyId: 'p1' },
  { id: 'u4', unitNumber: '202', floor: 2, size: 900, bedrooms: 2, bathrooms: 2, rent: 2400, deposit: 2400, status: 'maintenance', availableDate: '2026-10-01', propertyId: 'p1' },
  { id: 'u5', unitNumber: 'A-1', floor: 1, size: 1200, bedrooms: 1, bathrooms: 1, rent: 3800, deposit: 3800, status: 'occupied', availableDate: '2025-03-01', propertyId: 'p4' },
  { id: 'u6', unitNumber: 'A-2', floor: 2, size: 1150, bedrooms: 1, bathrooms: 1, rent: 3600, deposit: 3600, status: 'available', availableDate: '2026-09-15', propertyId: 'p4' },
  { id: 'u7', unitNumber: 'S-01', floor: 1, size: 450, bedrooms: 0, bathrooms: 1, rent: 1500, deposit: 1500, status: 'available', availableDate: '2026-08-15', propertyId: 'p6' },
  { id: 'u8', unitNumber: 'S-02', floor: 1, size: 450, bedrooms: 0, bathrooms: 1, rent: 1500, deposit: 1500, status: 'occupied', availableDate: '2025-06-01', propertyId: 'p6' },
  { id: 'u9', unitNumber: 'PH-1', floor: 30, size: 1400, bedrooms: 2, bathrooms: 2, rent: 4200, deposit: 4200, status: 'occupied', availableDate: '2024-08-01', propertyId: 'p7' },
  { id: 'u10', unitNumber: 'PH-2', floor: 30, size: 1400, bedrooms: 2, bathrooms: 2, rent: 4200, deposit: 4200, status: 'available', availableDate: '2026-10-01', propertyId: 'p7' },
];

export const tenants: Tenant[] = [
  { id: 't1', name: 'Jennifer Walsh', email: 'jennifer.walsh@email.com', phone: '(555) 123-4567', emergencyContact: 'Mark Walsh (555) 987-6543', address: '123 Sunset Blvd, Apt 201, Los Angeles, CA', nationalId: 'XXX-XX-1234', occupation: 'Software Engineer', company: 'Tech Corp', notes: 'Excellent tenant, always pays on time.', photo: '', registeredAt: '2024-11-01', status: 'active' },
  { id: 't2', name: 'David Kim', email: 'david.kim@email.com', phone: '(555) 234-5678', emergencyContact: 'Susan Kim (555) 876-5432', address: '321 Main Avenue, Apt A-1, New York, NY', nationalId: 'XXX-XX-2345', occupation: 'Designer', company: 'Creative Studio', notes: 'Prefers email communication.', photo: '', registeredAt: '2025-03-01', status: 'active' },
  { id: 't3', name: 'Maria Garcia', email: 'maria.garcia@email.com', phone: '(555) 345-6789', emergencyContact: 'Carlos Garcia (555) 765-4321', address: '789 Oakwood Drive, Miami, FL', nationalId: 'XXX-XX-3456', occupation: 'Doctor', company: 'City Hospital', notes: 'Renewing lease next month.', photo: '', registeredAt: '2024-08-01', status: 'active' },
  { id: 't4', name: 'James Wilson', email: 'james.wilson@email.com', phone: '(555) 456-7890', emergencyContact: 'Linda Wilson (555) 654-3210', address: '147 Harbor Way, PH-1, San Francisco, CA', nationalId: 'XXX-XX-4567', occupation: 'Product Manager', company: 'Innovate Inc', notes: 'Has a service animal.', photo: '', registeredAt: '2024-08-01', status: 'active' },
  { id: 't5', name: 'Patricia Brown', email: 'patricia.brown@email.com', phone: '(555) 567-8901', emergencyContact: 'Robert Brown (555) 543-2109', address: '987 Pine Lane, Studio S-02, Seattle, WA', nationalId: 'XXX-XX-5678', occupation: 'Teacher', company: 'Lincoln High School', notes: 'Lease ending soon.', photo: '', registeredAt: '2025-06-01', status: 'active' },
  { id: 't6', name: 'Thomas Lee', email: 'thomas.lee@email.com', phone: '(555) 678-9012', emergencyContact: 'Nancy Lee (555) 432-1098', address: '123 Sunset Blvd, Apt 101, Los Angeles, CA', nationalId: 'XXX-XX-6789', occupation: 'Accountant', company: 'Finance Group', notes: '', photo: '', registeredAt: '2025-01-15', status: 'active' },
  { id: 't7', name: 'Linda Martinez', email: 'linda.martinez@email.com', phone: '(555) 789-0123', emergencyContact: 'Jose Martinez (555) 321-0987', address: '321 Main Avenue, Apt A-2, New York, NY', nationalId: 'XXX-XX-7890', occupation: 'Marketing Manager', company: 'Brand Co', notes: 'New tenant, moved in recently.', photo: '', registeredAt: '2026-07-15', status: 'active' },
  { id: 't8', name: 'Christopher Taylor', email: 'chris.taylor@email.com', phone: '(555) 890-1234', emergencyContact: 'Amy Taylor (555) 210-9876', address: '147 Harbor Way, PH-2, San Francisco, CA', nationalId: 'XXX-XX-8901', occupation: 'Lawyer', company: 'Taylor & Associates', notes: '', photo: '', registeredAt: '2026-07-01', status: 'active' },
];

export const owners: Owner[] = [
  { id: 'o1', name: 'Robert Chen', company: 'Chen Properties LLC', email: 'robert@chenproperties.com', phone: '(555) 111-1111', address: '100 Owner Lane, LA, CA', taxNumber: 'TAX-001-223', bankDetails: 'Bank of America ****1234', propertiesOwned: 3 },
  { id: 'o2', name: 'Emily Rodriguez', company: 'Rodriguez Holdings', email: 'emily@rodriguezholdings.com', phone: '(555) 222-2222', address: '200 Owner Ave, Austin, TX', taxNumber: 'TAX-002-445', bankDetails: 'Chase ****5678', propertiesOwned: 3 },
  { id: 'o3', name: 'Michael Thompson', company: 'Thompson Estates', email: 'michael@thompsonestates.com', phone: '(555) 333-3333', address: '300 Owner Blvd, Miami, FL', taxNumber: 'TAX-003-667', bankDetails: 'Wells Fargo ****9012', propertiesOwned: 2 },
];

export const leases: Lease[] = [
  { id: 'l1', number: 'LSE-2024-001', tenantId: 't1', propertyId: 'p1', unitId: 'u3', tenant: 'Jennifer Walsh', property: 'Sunset Gardens', unit: '201', startDate: '2024-11-01', endDate: '2026-10-31', monthlyRent: 2400, securityDeposit: 2400, dueDate: 1, status: 'expiring' },
  { id: 'l2', number: 'LSE-2024-002', tenantId: 't2', propertyId: 'p4', unitId: 'u5', tenant: 'David Kim', property: 'Downtown Lofts', unit: 'A-1', startDate: '2025-03-01', endDate: '2027-02-28', monthlyRent: 3800, securityDeposit: 3800, dueDate: 1, status: 'active' },
  { id: 'l3', number: 'LSE-2024-003', tenantId: 't3', propertyId: 'p3', tenant: 'Maria Garcia', property: 'Oakwood Villa', unit: 'Villa', startDate: '2024-08-01', endDate: '2026-07-31', monthlyRent: 5500, securityDeposit: 5500, dueDate: 5, status: 'expiring' },
  { id: 'l4', number: 'LSE-2024-004', tenantId: 't4', propertyId: 'p7', unitId: 'u9', tenant: 'James Wilson', property: 'Harbor View Towers', unit: 'PH-1', startDate: '2024-08-01', endDate: '2027-07-31', monthlyRent: 4200, securityDeposit: 4200, dueDate: 1, status: 'active' },
  { id: 'l5', number: 'LSE-2024-005', tenantId: 't5', propertyId: 'p6', unitId: 'u8', tenant: 'Patricia Brown', property: 'Pinecrest Studios', unit: 'S-02', startDate: '2025-06-01', endDate: '2026-05-31', monthlyRent: 1500, securityDeposit: 1500, dueDate: 3, status: 'expired' },
  { id: 'l6', number: 'LSE-2024-006', tenantId: 't6', propertyId: 'p1', unitId: 'u1', tenant: 'Thomas Lee', property: 'Sunset Gardens', unit: '101', startDate: '2025-01-15', endDate: '2027-01-14', monthlyRent: 1800, securityDeposit: 1800, dueDate: 15, status: 'active' },
  { id: 'l7', number: 'LSE-2024-007', tenantId: 't7', propertyId: 'p4', unitId: 'u6', tenant: 'Linda Martinez', property: 'Downtown Lofts', unit: 'A-2', startDate: '2026-07-15', endDate: '2028-07-14', monthlyRent: 3600, securityDeposit: 3600, dueDate: 1, status: 'active' },
  { id: 'l8', number: 'LSE-2024-008', tenantId: 't8', propertyId: 'p7', unitId: 'u10', tenant: 'Christopher Taylor', property: 'Harbor View Towers', unit: 'PH-2', startDate: '2026-07-01', endDate: '2028-06-30', monthlyRent: 4200, securityDeposit: 4200, dueDate: 1, status: 'active' },
];

export const payments: Payment[] = [
  { id: 'pay1', invoice: 'INV-2026-001', tenantId: 't1', propertyId: 'p1', unitId: 'u3', tenant: 'Jennifer Walsh', property: 'Sunset Gardens', unit: '201', dueDate: '2026-08-01', paidDate: '2026-08-01', amount: 2400, method: 'Bank Transfer', status: 'paid' },
  { id: 'pay2', invoice: 'INV-2026-002', tenantId: 't2', propertyId: 'p4', unitId: 'u5', tenant: 'David Kim', property: 'Downtown Lofts', unit: 'A-1', dueDate: '2026-08-01', paidDate: '2026-08-02', amount: 3800, method: 'Credit Card', status: 'paid' },
  { id: 'pay3', invoice: 'INV-2026-003', tenantId: 't3', propertyId: 'p3', tenant: 'Maria Garcia', property: 'Oakwood Villa', unit: 'Villa', dueDate: '2026-08-05', paidDate: null, amount: 5500, method: 'Bank Transfer', status: 'pending' },
  { id: 'pay4', invoice: 'INV-2026-004', tenantId: 't4', propertyId: 'p7', unitId: 'u9', tenant: 'James Wilson', property: 'Harbor View Towers', unit: 'PH-1', dueDate: '2026-08-01', paidDate: '2026-08-01', amount: 4200, method: 'Bank Transfer', status: 'paid' },
  { id: 'pay5', invoice: 'INV-2026-005', tenantId: 't5', propertyId: 'p6', unitId: 'u8', tenant: 'Patricia Brown', property: 'Pinecrest Studios', unit: 'S-02', dueDate: '2026-07-03', paidDate: null, amount: 1500, method: 'Cash', status: 'overdue' },
  { id: 'pay6', invoice: 'INV-2026-006', tenantId: 't6', propertyId: 'p1', unitId: 'u1', tenant: 'Thomas Lee', property: 'Sunset Gardens', unit: '101', dueDate: '2026-08-15', paidDate: '2026-08-10', amount: 1800, method: 'PayPal', status: 'paid' },
  { id: 'pay7', invoice: 'INV-2026-007', tenantId: 't7', propertyId: 'p4', unitId: 'u6', tenant: 'Linda Martinez', property: 'Downtown Lofts', unit: 'A-2', dueDate: '2026-08-01', paidDate: '2026-08-03', amount: 1800, method: 'Credit Card', status: 'partial' },
  { id: 'pay8', invoice: 'INV-2026-008', tenantId: 't8', propertyId: 'p7', unitId: 'u10', tenant: 'Christopher Taylor', property: 'Harbor View Towers', unit: 'PH-2', dueDate: '2026-08-01', paidDate: '2026-08-01', amount: 4200, method: 'Bank Transfer', status: 'paid' },
  { id: 'pay9', invoice: 'INV-2026-009', tenantId: 't1', propertyId: 'p1', unitId: 'u3', tenant: 'Jennifer Walsh', property: 'Sunset Gardens', unit: '201', dueDate: '2026-07-01', paidDate: '2026-07-01', amount: 2400, method: 'Bank Transfer', status: 'paid' },
  { id: 'pay10', invoice: 'INV-2026-010', tenantId: 't2', propertyId: 'p4', unitId: 'u5', tenant: 'David Kim', property: 'Downtown Lofts', unit: 'A-1', dueDate: '2026-07-01', paidDate: '2026-07-02', amount: 3800, method: 'Credit Card', status: 'paid' },
  { id: 'pay11', invoice: 'INV-2026-011', tenantId: 't3', propertyId: 'p3', tenant: 'Maria Garcia', property: 'Oakwood Villa', unit: 'Villa', dueDate: '2026-07-05', paidDate: '2026-07-05', amount: 5500, method: 'Bank Transfer', status: 'paid' },
  { id: 'pay12', invoice: 'INV-2026-012', tenantId: 't4', propertyId: 'p7', unitId: 'u9', tenant: 'James Wilson', property: 'Harbor View Towers', unit: 'PH-1', dueDate: '2026-07-01', paidDate: null, amount: 4200, method: 'Check', status: 'overdue' },
];

export const maintenanceTickets: MaintenanceTicket[] = [
  { id: 'm1', ticketId: 'MNT-001', propertyId: 'p1', unitId: 'u3', tenantId: 't1', assignedStaffId: 's5', property: 'Sunset Gardens', unit: '201', tenant: 'Jennifer Walsh', category: 'Plumbing', priority: 'high', assignedStaff: 'Mike Johnson', status: 'in_progress', createdAt: '2026-07-28', title: 'Leaking kitchen faucet', description: 'Kitchen faucet is leaking continuously, causing water damage to cabinet below.' },
  { id: 'm2', ticketId: 'MNT-002', propertyId: 'p4', unitId: 'u5', tenantId: 't2', assignedStaffId: 's7', property: 'Downtown Lofts', unit: 'A-1', tenant: 'David Kim', category: 'Electrical', priority: 'medium', assignedStaff: 'Sarah Connor', status: 'open', createdAt: '2026-07-30', title: 'Light fixture not working', description: 'Bedroom light fixture stopped working, possible wiring issue.' },
  { id: 'm3', ticketId: 'MNT-003', propertyId: 'p3', tenantId: 't3', assignedStaffId: 's5', property: 'Oakwood Villa', unit: 'Villa', tenant: 'Maria Garcia', category: 'HVAC', priority: 'urgent', assignedStaff: 'Mike Johnson', status: 'waiting_parts', createdAt: '2026-07-25', title: 'AC not cooling', description: 'Air conditioning unit is running but not producing cold air. Summer heat makes this urgent.' },
  { id: 'm4', ticketId: 'MNT-004', propertyId: 'p7', unitId: 'u9', tenantId: 't4', assignedStaffId: 's6', property: 'Harbor View Towers', unit: 'PH-1', tenant: 'James Wilson', category: 'Appliance', priority: 'low', assignedStaff: 'Tom Brady', status: 'completed', createdAt: '2026-07-20', title: 'Dishwasher making noise', description: 'Dishwasher making unusual noises during wash cycle.' },
  { id: 'm5', ticketId: 'MNT-005', propertyId: 'p6', unitId: 'u8', tenantId: 't5', assignedStaffId: 's6', property: 'Pinecrest Studios', unit: 'S-02', tenant: 'Patricia Brown', category: 'General', priority: 'medium', assignedStaff: 'Tom Brady', status: 'open', createdAt: '2026-08-01', title: 'Window screen damaged', description: 'Window screen has a tear, needs replacement.' },
  { id: 'm6', ticketId: 'MNT-006', propertyId: 'p5', assignedStaffId: 's5', property: 'Riverside Townhomes', unit: 'TH-3', tenant: '—', category: 'Plumbing', priority: 'high', assignedStaff: 'Mike Johnson', status: 'in_progress', createdAt: '2026-07-29', title: 'Water heater issue', description: 'No hot water in the unit, water heater may need replacement.' },
  { id: 'm7', ticketId: 'MNT-007', propertyId: 'p1', unitId: 'u2', assignedStaffId: 's6', property: 'Sunset Gardens', unit: '102', tenant: '—', category: 'General', priority: 'low', assignedStaff: 'Tom Brady', status: 'cancelled', createdAt: '2026-07-15', title: 'Paint touch-up', description: 'Common area needs paint touch-up.' },
];

export const staff: Staff[] = [
  { id: 's1', name: 'Alex Morgan', email: 'alex.morgan@estatehub.com', phone: '(555) 001-0001', role: 'Super Admin', status: 'active', avatar: '', joinedAt: '2023-01-15' },
  { id: 's2', name: 'Sarah Mitchell', email: 'sarah.mitchell@estatehub.com', phone: '(555) 001-0002', role: 'Property Manager', status: 'active', avatar: '', joinedAt: '2023-03-20' },
  { id: 's3', name: 'James Park', email: 'james.park@estatehub.com', phone: '(555) 001-0003', role: 'Property Manager', status: 'active', avatar: '', joinedAt: '2023-06-10' },
  { id: 's4', name: 'Lisa Anderson', email: 'lisa.anderson@estatehub.com', phone: '(555) 001-0004', role: 'Accountant', status: 'active', avatar: '', joinedAt: '2023-09-05' },
  { id: 's5', name: 'Mike Johnson', email: 'mike.johnson@estatehub.com', phone: '(555) 001-0005', role: 'Maintenance Staff', status: 'active', avatar: '', joinedAt: '2024-02-01' },
  { id: 's6', name: 'Tom Brady', email: 'tom.brady@estatehub.com', phone: '(555) 001-0006', role: 'Maintenance Staff', status: 'active', avatar: '', joinedAt: '2024-04-15' },
  { id: 's7', name: 'Sarah Connor', email: 'sarah.connor@estatehub.com', phone: '(555) 001-0007', role: 'Maintenance Staff', status: 'inactive', avatar: '', joinedAt: '2024-05-20' },
  { id: 's8', name: 'Nina Patel', email: 'nina.patel@estatehub.com', phone: '(555) 001-0008', role: 'Receptionist', status: 'active', avatar: '', joinedAt: '2024-08-01' },
];

export const documents: DocItem[] = [
  { id: 'd1', name: 'Lease_Agreement_Walsh.pdf', type: 'Lease Agreement', size: '245 KB', uploadedAt: '2024-11-01', uploadedBy: 'Sarah Mitchell' },
  { id: 'd2', name: 'Property_Inspection_Sunset.pdf', type: 'Property Document', size: '1.2 MB', uploadedAt: '2026-07-15', uploadedBy: 'James Park' },
  { id: 'd3', name: 'Tenant_ID_Garcia.pdf', type: 'Tenant Document', size: '512 KB', uploadedAt: '2024-08-01', uploadedBy: 'Sarah Mitchell' },
  { id: 'd4', name: 'Owner_Tax_Chen.pdf', type: 'Owner Document', size: '890 KB', uploadedAt: '2026-01-20', uploadedBy: 'Lisa Anderson' },
  { id: 'd5', name: 'Insurance_HarborView.pdf', type: 'Insurance', size: '1.5 MB', uploadedAt: '2026-06-01', uploadedBy: 'Alex Morgan' },
  { id: 'd6', name: 'Property_Photos_Oakwood.zip', type: 'Photo', size: '12.4 MB', uploadedAt: '2026-05-10', uploadedBy: 'Sarah Mitchell' },
  { id: 'd7', name: 'Lease_Agreement_Kim.pdf', type: 'Lease Agreement', size: '230 KB', uploadedAt: '2025-03-01', uploadedBy: 'James Park' },
  { id: 'd8', name: 'Insurance_MapleHeights.pdf', type: 'Insurance', size: '1.1 MB', uploadedAt: '2026-03-15', uploadedBy: 'Alex Morgan' },
];

export const calendarEvents: CalendarEvent[] = [
  { id: 'c1', title: 'Lease Expiry — Jennifer Walsh', date: '2026-10-31', type: 'lease_expiry', property: 'Sunset Gardens' },
  { id: 'c2', title: 'Rent Due — Maria Garcia', date: '2026-08-05', type: 'payment_due', property: 'Oakwood Villa' },
  { id: 'c3', title: 'Property Inspection — Sunset Gardens', date: '2026-08-10', type: 'inspection', property: 'Sunset Gardens' },
  { id: 'c4', title: 'Maintenance — AC Repair', date: '2026-08-03', type: 'maintenance', property: 'Oakwood Villa' },
  { id: 'c5', title: 'Move-in — Linda Martinez', date: '2026-08-15', type: 'move_in', property: 'Downtown Lofts' },
  { id: 'c6', title: 'Move-out — Patricia Brown', date: '2026-08-20', type: 'move_out', property: 'Pinecrest Studios' },
  { id: 'c7', title: 'Lease Expiry — Maria Garcia', date: '2026-07-31', type: 'lease_expiry', property: 'Oakwood Villa' },
  { id: 'c8', title: 'Rent Due — James Wilson', date: '2026-09-01', type: 'payment_due', property: 'Harbor View Towers' },
  { id: 'c9', title: 'Property Inspection — Harbor View', date: '2026-09-05', type: 'inspection', property: 'Harbor View Towers' },
];

export const notifications: AppNotification[] = [
  { id: 'n1', title: 'Rent Due', message: 'Maria Garcia\'s rent of $5,500 is due in 3 days.', type: 'rent_due', read: false, createdAt: '2026-08-02T08:00:00' },
  { id: 'n2', title: 'Overdue Rent', message: 'Patricia Brown\'s rent is 30 days overdue.', type: 'overdue_rent', read: false, createdAt: '2026-08-02T07:30:00' },
  { id: 'n3', title: 'Lease Expiring', message: 'Jennifer Walsh\'s lease expires in 90 days.', type: 'lease_expiring', read: false, createdAt: '2026-08-01T16:00:00' },
  { id: 'n4', title: 'Maintenance Assigned', message: 'AC repair ticket assigned to Mike Johnson.', type: 'maintenance_assigned', read: false, createdAt: '2026-07-30T10:00:00' },
  { id: 'n5', title: 'Maintenance Completed', message: 'Dishwasher repair for PH-1 completed.', type: 'maintenance_completed', read: true, createdAt: '2026-07-20T14:00:00' },
  { id: 'n6', title: 'New Tenant', message: 'Christopher Taylor registered and moved into Harbor View PH-2.', type: 'new_tenant', read: true, createdAt: '2026-07-01T09:00:00' },
  { id: 'n7', title: 'Vacant Property', message: 'Cedar Court has been vacant for 45 days.', type: 'vacant_property', read: true, createdAt: '2026-06-15T11:00:00' },
];

export const activities: Activity[] = [
  { id: 'a1', actor: 'Sarah Mitchell', action: 'created a new lease for', target: 'Linda Martinez', time: '2026-08-02T09:30:00', type: 'lease' },
  { id: 'a2', actor: 'James Park', action: 'marked payment received from', target: 'David Kim', time: '2026-08-02T08:15:00', type: 'payment' },
  { id: 'a3', actor: 'Mike Johnson', action: 'updated maintenance ticket', target: 'MNT-003', time: '2026-08-01T17:00:00', type: 'maintenance' },
  { id: 'a4', actor: 'Lisa Anderson', action: 'added a new property', target: 'Cedar Court', time: '2026-07-28T14:00:00', type: 'create' },
  { id: 'a5', actor: 'Alex Morgan', action: 'updated staff permissions for', target: 'Tom Brady', time: '2026-07-27T11:00:00', type: 'update' },
  { id: 'a6', actor: 'Sarah Mitchell', action: 'registered new tenant', target: 'Christopher Taylor', time: '2026-07-01T09:00:00', type: 'create' },
  { id: 'a7', actor: 'James Park', action: 'uploaded inspection report for', target: 'Sunset Gardens', time: '2026-07-15T13:00:00', type: 'update' },
];

// Chart data
export const monthlyRevenue = [
  { month: 'Jan', revenue: 18500, expenses: 8200 },
  { month: 'Feb', revenue: 19200, expenses: 8500 },
  { month: 'Mar', revenue: 21000, expenses: 7800 },
  { month: 'Apr', revenue: 20500, expenses: 9100 },
  { month: 'May', revenue: 22800, expenses: 8400 },
  { month: 'Jun', revenue: 23500, expenses: 8900 },
  { month: 'Jul', revenue: 24800, expenses: 9200 },
  { month: 'Aug', revenue: 25200, expenses: 8800 },
];

export const monthlyCollection = [
  { month: 'Jan', collected: 18200, outstanding: 300 },
  { month: 'Feb', collected: 19000, outstanding: 200 },
  { month: 'Mar', collected: 20800, outstanding: 200 },
  { month: 'Apr', collected: 20300, outstanding: 200 },
  { month: 'May', collected: 22600, outstanding: 200 },
  { month: 'Jun', collected: 23300, outstanding: 200 },
  { month: 'Jul', collected: 24500, outstanding: 300 },
  { month: 'Aug', collected: 21000, outstanding: 4200 },
];

export const occupancyData = [
  { label: 'Occupied', value: 68, color: 'hsl(217 91% 60%)' },
  { label: 'Available', value: 18, color: 'hsl(142 71% 45%)' },
  { label: 'Maintenance', value: 8, color: 'hsl(38 92% 50%)' },
  { label: 'Vacant', value: 6, color: 'hsl(0 84% 60%)' },
];

export const maintenanceStatusData = [
  { label: 'Open', value: 2, color: 'hsl(217 91% 60%)' },
  { label: 'In Progress', value: 2, color: 'hsl(38 92% 50%)' },
  { label: 'Waiting Parts', value: 1, color: 'hsl(280 65% 60%)' },
  { label: 'Completed', value: 1, color: 'hsl(142 71% 45%)' },
  { label: 'Cancelled', value: 1, color: 'hsl(215 16% 47%)' },
];

export const leaseTimeline = [
  { month: 'Aug', expiring: 1 },
  { month: 'Sep', expiring: 0 },
  { month: 'Oct', expiring: 1 },
  { month: 'Nov', expiring: 0 },
  { month: 'Dec', expiring: 0 },
  { month: 'Jan', expiring: 1 },
  { month: 'Feb', expiring: 1 },
];
