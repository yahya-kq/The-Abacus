import { DailyTipInput } from '../types/tips';

export const MISSION_HILL_SAMPLE_CSV = `Name,Role,Pay rate,Date,Time in,Time out,Regular Hours,Overtime,Double Overtime,Weekly Overtime,Paid Breaks hours,UnPaid Breaks hours,Total Hours (excluding unpaid breaks),Net Sale,Tips,Gratuity
Sally Rodriguez,Cashier,19,07-Sep,10:00 PM,5:00 AM,6.48,0,0,,0,0.52,6.48,343.1,39.95,0
,Cashier,19,10-Sep,11:00 PM,5:00 AM,6,0,0,,0,0,6,324.13,31.01,0
,Cashier,19,11-Sep,11:00 PM,5:00 AM,6,0,0,,0,0,6,444.18,47.33,0
,Cashier,19,12-Sep,10:00 PM,4:00 AM,4.86,0,0,,0,1.14,4.86,274.9,36.68,0
,Cashier,19,13-Sep,10:00 PM,4:00 AM,5.46,0,0,,0,0.54,5.46,167.25,23.55,0
,Cashier,19,14-Sep,11:00 PM,5:01 AM,6.02,0,0,,0.02,0,6.02,399.73,33.62,0
,Cashier,19,15-Sep,10:56 PM,5:01 AM,6.09,0,0,,0.5,0,6.09,189.61,26.82,0
,Cashier,19,17-Sep,11:00 PM,5:00 AM,6,0,0,,0.11,0,6,302.58,32.58,0
,Cashier,19,19-Sep,10:00 PM,4:00 AM,5.45,0,0,,0.55,0,5.45,253.25,37.08,0
,Cashier,19,20-Sep,10:00 PM,4:00 AM,5.49,0,0,,0,0.51,5.49,269.95,29.63,0
Total,,,,,,57.85,0,0,0,0.63,3.26,57.85,2968.68,338.25,0
,,,,,,,,,,,,,,
Cynthia Rosales Perez,Cashier,19,08-Sep,7:26 AM,11:30 AM,4.08,0,0,,0,0,4.08,104.25,16.78,0
,Server,19,10-Sep,6:33 AM,11:28 AM,4.91,0,0,,0,0,4.91,103,13.26,0
,Cashier,19,14-Sep,6:32 AM,11:33 AM,5.02,0,0,,0,0,5.02,312.2,31.54,0
,Cashier,19,18-Sep,6:31 AM,11:32 AM,5.01,0,0,,0,0,5.01,111.5,15.06,0
,Cashier,19,21-Sep,6:32 AM,11:11 AM,4.64,0,0,,0,0,4.64,246.25,34.51,0
Total,,,,,,23.66,0,0,0,0,0,23.66,877.2,111.15,0
,,,,,,,,,,,,,,
Meckenzie Anderson,Server,17,08-Sep,11:00 PM,4:55 AM,5.93,0,0,,0,0,5.93,283.5,31.31,0
,Server,17,09-Sep,10:56 PM,4:58 AM,6.03,0,0,,0,0,6.03,444.85,43.25,0
,Server,17,11-Sep,4:30 AM,11:35 AM,6.59,0,0,,0,0.5,6.59,449.25,53.89,0
,Server,17,12-Sep,5:27 AM,11:21 AM,5.9,0,0,,0,0,5.9,412,59.66,0
,Server,17,13-Sep,5:24 AM,11:19 AM,5.44,0,0,,0.15,0.49,5.44,1293,195.3,0
,Server,17,16-Sep,11:00 PM,5:00 AM,6,0,0,,0,0,6,28.55,1.4,0
,Server,17,18-Sep,10:56 PM,4:57 AM,6.01,0,0,,0,0,6.01,571.95,65.77,0
,Server,17,20-Sep,5:28 AM,11:18 AM,5.85,0,0,,0,0,5.85,376.5,44.08,0
,Server,17,21-Sep,2:00 AM,11:11 AM,7.94,0,0,,0.26,1.25,7.94,947,103.45,0
Total,,,,,,55.69,0,0,0,0.41,2.24,55.69,4806.6,598.11,0
,,,,,,,,,,,,,,
Mikaela Sosa Fuentes,Server,17,09-Sep,6:28 AM,11:17 AM,4.81,0,0,,0,0,4.81,32.75,4.64,0
Total,,,,,,4.81,0,0,0,0,0,4.81,32.75,4.64,0
,,,,,,,,,,,,,,
Natalie Dreyer,Cashier,17,17-Sep,2:10 AM,5:02 AM,2.87,0,0,,0,0,2.87,182.75,17.92,0
,Kitchen Manager,23,17-Sep,10:05 PM,3:00 AM,4.93,0,0,,0,0,4.93,0,0,0
,Kitchen Manager,23,18-Sep,10:14 PM,3:00 AM,4.76,0,0,,0,0,4.76,0,0,0
,Cashier,17,20-Sep,1:35 AM,6:30 AM,4.91,0,0,,0,0,4.91,440.13,61.51,0
Total,,,,,,17.47,0,0,0,0,0,17.47,622.88,79.43,0
,,,,,,,,,,,,,,
Micaela Hartley,Cashier,18,08-Sep,1:31 AM,6:30 AM,4.98,0,0,,0,0,4.98,733.15,68.97,0
,Cashier,18,12-Sep,4:31 AM,11:21 AM,6.3,0,0,,0,0.53,6.3,455.7,59.97,0
,Cashier,18,13-Sep,4:06 AM,11:19 AM,6.59,0,0,,0,0.62,6.59,321.25,17.2,0
,Cashier,18,14-Sep,4:02 AM,11:33 AM,6.96,0,0,,0.2,0.55,6.96,866.9,116.36,0
,Cashier,18,15-Sep,5:00 AM,11:31 AM,6.51,0,0,,0.18,0,6.51,215.75,22.33,0
,Cashier,18,16-Sep,4:59 AM,11:26 AM,5.92,0,0,,0,0.53,5.92,222.75,24.23,0
,Cashier,18,19-Sep,4:28 AM,11:35 AM,6.52,0,0,,0,0.59,6.52,94.5,11.93,0
Total,,,,,,43.78,0,0,0,0.38,2.82,43.78,2910,320.99,0
,,,,,,,,,,,,,,
Lauren Sanders,Cashier,17,09-Sep,1:00 AM,5:00 AM,4,0,0,,0,0,4,25,2.52,0
,Cashier,17,10-Sep,6:26 AM,11:27 AM,5.03,0,0,,0.18,0,5.03,0,0,0
,Cashier,17,11-Sep,6:30 AM,11:35 AM,5.08,0,0,,0,0,5.08,112,12.87,0
,Cashier,17,13-Sep,1:27 AM,6:30 AM,5.06,0,0,,0.23,0,5.06,438.5,54.37,0
,Cashier,17,14-Sep,1:30 AM,6:33 AM,5.04,0,0,,0.3,0,5.04,593.1,84.27,0
,Cashier,17,15-Sep,6:30 AM,11:34 AM,5.06,0,0,,0.18,0,5.06,277.75,31.58,0
,Cashier,17,16-Sep,6:31 AM,11:26 AM,4.92,0,0,,0.28,0,4.92,319.75,49.64,0
,Cashier,17,17-Sep,6:30 AM,11:35 AM,5.1,0,0,,0,0,5.1,237.08,25.13,0
,Cashier,17,19-Sep,5:31 AM,11:36 AM,5.57,0,0,,0,0.52,5.57,737,81.2,0
Total,,,,,,44.86,0,0,0,0.99,0.52,44.86,2740.18,341.58,0
,,,,,,,,,,,,,,
Michelle Osnovikov,Server,17,08-Sep,4:32 AM,11:31 AM,5.89,0,0,,0,1.09,5.89,173.5,12.28,0
,Server,17,10-Sep,4:31 AM,11:27 AM,5.94,0,0,,0,1,5.94,374.5,41.97,0
,Server,17,12-Sep,10:57 PM,5:01 AM,6.07,0,0,,0,0,6.07,358.95,43.25,0
,Server,17,14-Sep,10:57 PM,5:02 AM,6.08,0,0,,0,0,6.08,348.65,16.42,0
,Server,17,15-Sep,11:00 PM,5:00 AM,6,0,0,,0,0,6,279.7,28.87,0
,Server,17,17-Sep,4:31 AM,11:35 AM,7.24,0,0,,0.18,0,7.24,204.65,11.54,0
Total,,,,,,37.22,0,0,0,0.18,2.09,37.22,1739.95,154.33,0
,,,,,,,,,,,,,,`;

export const MISSION_HILL_SAMPLE_TIPS: Record<string, DailyTipInput> = {
  '2026-09-07': {
    date: '2026-09-07',
    displayDate: 'Sep 07, 2026',
    dayOfWeek: 'Monday',
    webDashTips: 172.38,
    doorDashTips: 0,
    kioskTips: 0,
    otherTips: 0,
    totalTips: 172.38,
  },
  '2026-09-08': {
    date: '2026-09-08',
    displayDate: 'Sep 08, 2026',
    dayOfWeek: 'Tuesday',
    webDashTips: 64.53,
    doorDashTips: 0,
    kioskTips: 0,
    otherTips: 0,
    totalTips: 64.53,
  },
  '2026-09-09': {
    date: '2026-09-09',
    displayDate: 'Sep 09, 2026',
    dayOfWeek: 'Wednesday',
    webDashTips: 104.72,
    doorDashTips: 0,
    kioskTips: 0,
    otherTips: 0,
    totalTips: 104.72,
  },
  '2026-09-10': {
    date: '2026-09-10',
    displayDate: 'Sep 10, 2026',
    dayOfWeek: 'Thursday',
    webDashTips: 98.67,
    doorDashTips: 0,
    kioskTips: 0,
    otherTips: 0,
    totalTips: 98.67,
  },
  '2026-09-11': {
    date: '2026-09-11',
    displayDate: 'Sep 11, 2026',
    dayOfWeek: 'Friday',
    webDashTips: 173.17,
    doorDashTips: 0,
    kioskTips: 6.21,
    otherTips: 0,
    totalTips: 179.38,
  },
  '2026-09-12': {
    date: '2026-09-12',
    displayDate: 'Sep 12, 2026',
    dayOfWeek: 'Saturday',
    webDashTips: 311.3,
    doorDashTips: 0,
    kioskTips: 5.68,
    otherTips: 0,
    totalTips: 316.98,
  },
  '2026-09-13': {
    date: '2026-09-13',
    displayDate: 'Sep 13, 2026',
    dayOfWeek: 'Sunday',
    webDashTips: 258.47,
    doorDashTips: 0,
    kioskTips: 2.75,
    otherTips: 0,
    totalTips: 261.22,
  },
  '2026-09-14': {
    date: '2026-09-14',
    displayDate: 'Sep 14, 2026',
    dayOfWeek: 'Monday',
    webDashTips: 90.33,
    doorDashTips: 0,
    kioskTips: 2.8,
    otherTips: 0,
    totalTips: 93.13,
  },
  '2026-09-15': {
    date: '2026-09-15',
    displayDate: 'Sep 15, 2026',
    dayOfWeek: 'Tuesday',
    webDashTips: 100.69,
    doorDashTips: 0,
    kioskTips: 0,
    otherTips: 0,
    totalTips: 100.69,
  },
  '2026-09-16': {
    date: '2026-09-16',
    displayDate: 'Sep 16, 2026',
    dayOfWeek: 'Wednesday',
    webDashTips: 52.9,
    doorDashTips: 0,
    kioskTips: 0,
    otherTips: 0,
    totalTips: 52.9,
  },
  '2026-09-17': {
    date: '2026-09-17',
    displayDate: 'Sep 17, 2026',
    dayOfWeek: 'Thursday',
    webDashTips: 87.17,
    doorDashTips: 0,
    kioskTips: 0,
    otherTips: 0,
    totalTips: 87.17,
  },
  '2026-09-18': {
    date: '2026-09-18',
    displayDate: 'Sep 18, 2026',
    dayOfWeek: 'Friday',
    webDashTips: 160.07,
    doorDashTips: 0,
    kioskTips: 1.17,
    otherTips: 0,
    totalTips: 161.24,
  },
  '2026-09-19': {
    date: '2026-09-19',
    displayDate: 'Sep 19, 2026',
    dayOfWeek: 'Saturday',
    webDashTips: 246.83,
    doorDashTips: 0,
    kioskTips: 11.44,
    otherTips: 0,
    totalTips: 258.27,
  },
  '2026-09-20': {
    date: '2026-09-20',
    displayDate: 'Sep 20, 2026',
    dayOfWeek: 'Sunday',
    webDashTips: 167.59,
    doorDashTips: 0,
    kioskTips: 0,
    otherTips: 0,
    totalTips: 167.59,
  },
};
