export const DEFAULT_RESTAURANT = {
  id: 'mission-hill',
  name: 'Mission Hill',
  systemType: 'equal' as const,
  description: 'Equal tip distribution based on total hours worked.',
  active: true,
  businessDayCutoffHour: 12,
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
    { role: 'Cashier', distribution: 'equal' as const },
    { role: 'Server', distribution: 'equal' as const },
  ],
  manualTipFields: [
    { id: 'webDashTips', label: 'WebDash Tips', placeholder: '0.00', description: 'Tips from Web Dashboard' },
    { id: 'doorDashTips', label: 'DoorDash Tips', placeholder: '0.00', description: 'Third-party delivery tips' },
    { id: 'kioskTips', label: 'Kiosk Tips', placeholder: '0.00', description: 'Self-order kiosk tips' },
    { id: 'otherTips', label: 'Other Tips', placeholder: '0.00', description: 'Cash / other manual tips' },
  ],
};

export const RESTAURANTS_DATABASE = [DEFAULT_RESTAURANT];
