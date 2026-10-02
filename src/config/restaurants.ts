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
      { id: 'webDashTips', label: 'WebDash Tips', placeholder: '0.00', description: 'Tips from POS Web Dashboard' },
      { id: 'doorDashTips', label: 'DoorDash Tips', placeholder: '0.00', description: 'Third-party delivery tips' },
      { id: 'kioskTips', label: 'Kiosk Tips', placeholder: '0.00', description: 'Self-order kiosk tips' },
      { id: 'otherTips', label: 'Other Tips', placeholder: '0.00', description: 'Cash / other manual tips' },
    ],
  },
];

export const DEFAULT_RESTAURANT = RESTAURANTS_DATABASE[0];
