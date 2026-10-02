import { RestaurantConfig } from '../types/tips';

export const RESTAURANTS_DATABASE: RestaurantConfig[] = [
  {
    id: 'mission-hill',
    name: 'Mission Hill',
    systemType: 'equal',
    description: 'Equal tip distribution based on total hours worked across Cashier and Server staff.',
    active: true,
    businessDayCutoffHour: 12, // Shifts starting before 12:00 PM belong to previous evening's business day
    contributors: [
      { role: 'Server', percentage: 100 },
      { role: 'Cashier', percentage: 100 },
      { role: 'Owner', percentage: 100, isManualSource: true },
      { role: 'Kiosk', percentage: 100, isManualSource: true },
      { role: 'Online', percentage: 100, isManualSource: true },
      { role: 'QR', percentage: 100, isManualSource: true },
      { role: '3PO', percentage: 100, isManualSource: true },
    ],
    recipients: [
      { role: 'Cashier', distribution: 'equal' },
      { role: 'Server', distribution: 'equal' },
    ],
    manualTipFields: [
      { id: 'webDashTips', label: 'WebDash / Dashboard Tips', placeholder: '0.00', description: 'Tips from POS Web Dashboard' },
      { id: 'doorDashTips', label: 'DoorDash Tips', placeholder: '0.00', description: 'Third-party delivery delivery tips' },
      { id: 'kioskTips', label: 'Kiosk Tips', placeholder: '0.00', description: 'Self-order kiosk tip totals' },
      { id: 'chaosTips', label: 'Chaos Tips', placeholder: '0.00', description: 'Special shift or manual pool tips' },
      { id: 'otherTips', label: 'Other Tips', placeholder: '0.00', description: 'Cash / other manual tip collections' },
    ],
  },
  // Future restaurants architecture placeholders
  {
    id: 'beacon-hill',
    name: 'Beacon Hill (Coming Soon)',
    systemType: 'pooling',
    description: 'Shift-based tip pooling system.',
    active: false,
    businessDayCutoffHour: 12,
    contributors: [
      { role: 'Server', percentage: 100 },
      { role: 'Bartender', percentage: 100 },
    ],
    recipients: [
      { role: 'Server', distribution: 'pooling' },
      { role: 'Bartender', distribution: 'pooling' },
      { role: 'Busser', distribution: 'pooling' },
    ],
    manualTipFields: [
      { id: 'webDashTips', label: 'Dashboard Tips', placeholder: '0.00' },
      { id: 'barTips', label: 'Bar Register Tips', placeholder: '0.00' },
    ],
  },
  {
    id: 'back-bay',
    name: 'Back Bay Grill (Coming Soon)',
    systemType: 'percentage',
    description: 'Tiered percentage tip sharing based on front-of-house roles.',
    active: false,
    businessDayCutoffHour: 12,
    contributors: [
      { role: 'Server', percentage: 100 },
    ],
    recipients: [
      { role: 'Server', distribution: 'percentage', weight: 70 },
      { role: 'Food Runner', distribution: 'percentage', weight: 20 },
      { role: 'Host', distribution: 'percentage', weight: 10 },
    ],
    manualTipFields: [
      { id: 'webDashTips', label: 'Dashboard Tips', placeholder: '0.00' },
    ],
  },
  {
    id: 'cambridge-tavern',
    name: 'Cambridge Tavern (Coming Soon)',
    systemType: 'points',
    description: 'Point-weighted tip system rewarding role experience and seniority.',
    active: false,
    businessDayCutoffHour: 12,
    contributors: [
      { role: 'Lead Server', percentage: 100 },
      { role: 'Server', percentage: 100 },
      { role: 'Bartender', percentage: 100 },
    ],
    recipients: [
      { role: 'Lead Server', distribution: 'points', weight: 1.5 },
      { role: 'Server', distribution: 'points', weight: 1.0 },
      { role: 'Bartender', distribution: 'points', weight: 1.2 },
      { role: 'Support', distribution: 'points', weight: 0.5 },
    ],
    manualTipFields: [
      { id: 'webDashTips', label: 'Dashboard Tips', placeholder: '0.00' },
    ],
  },
];

export const DEFAULT_RESTAURANT = RESTAURANTS_DATABASE[0];
