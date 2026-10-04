# The Abacus — Restaurant Tip Calculation System

**The Abacus** is an enterprise-grade restaurant tip pooling and calculation platform engineered for modern hospitality operations. The application automates shift ingestion, multi-channel tip aggregation (In-Store, Web/Dashboard, DoorDash, and Kiosks), rule-based role contributions, and daily tip pool distributions across **Equal**, **Percentage**, and **Points** methodologies.

---

## 1. Core Principle: Penny-Perfect Balance ($\sum \text{Payouts} \equiv \text{Total Tips}$)

A fundamental guarantee of The Abacus is **zero variance**:

$$\sum_{\text{all staff}} \text{Total Employee Payout} \equiv \text{Total Tips Collected for the Cycle}$$

Regardless of the distribution model, shift lengths, or role weights, the calculation engine applies **universal cent-reconciliation** on every business day. Total tips collected across all channels strictly equal total tips paid out, ensuring $0.00 payroll discrepancy.

---

## 2. Tip Pooling Guide & Distribution Methods

The Abacus computes tip distributions on a **daily business date basis**, allocating each day's collected tip pool among the eligible employees who worked shifts on that specific day.

### Method 1: Equal Tip Pooling (Hours-Weighted)

#### How It Works
All eligible recipients share in the daily pool in direct proportion to the hours they worked on that day.

#### Mathematical Formulas
1. **Daily Total Pool**:
   $$\text{Day Pool} = \text{External Tips (Online + DoorDash + Kiosk + Other)} + \sum \text{Shift Contributions}$$
2. **Total Recipient Hours**:
   $$\text{Total Hours}_d = \sum_{s \in \text{Day Recipient Shifts}} \text{Hours}_s$$
3. **Hourly Tip Rate**:
   $$\text{Hourly Rate}_d = \frac{\text{Day Pool}}{\text{Total Hours}_d}$$
4. **Employee Shift Payout**:
   $$\text{Employee Share} = \text{Shift Hours} \times \text{Hourly Rate}_d$$

#### Example Walkthrough
- **Daily Tips Collected**: $500.00
- **Staff Working**:
  - Server A: 6.00 hrs
  - Server B: 4.00 hrs
  - Bartender: 5.00 hrs
  - Cook A: 5.00 hrs
  - Total Hours = 20.00 hrs
- **Hourly Tip Rate**: $\$500.00 \div 20.00 = \$25.00/\text{hr}$
- **Daily Payouts**:
  - Server A: $6.00 \times \$25.00 = \$150.00$
  - Server B: $4.00 \times \$25.00 = \$100.00$
  - Bartender: $5.00 \times \$25.00 = \$125.00$
  - Cook A: $5.00 \times \$25.00 = \$125.00$
  - **Total Distributed**: $\$500.00$ ($0.00 variance)

---

### Method 2: Percentage Tip Pooling (Role Buckets + Intra-Role Hours)

#### How It Works
The daily tip pool is divided into percentage-based buckets assigned to specific roles (e.g., Servers = 50%, Bartenders = 20%, Kitchen = 30%). Within each role bucket, tips are distributed among the employees working that role based on their hours.

#### Mathematical Formulas
1. **Role Bucket**:
   $$\text{Role Pool}_R = \text{Day Pool} \times \text{Role Allocation } \%_R$$
2. **Active Role Normalization**:
   If a configured role is absent on a particular day (e.g. no Bartender scheduled on Tuesday), the engine dynamically renormalizes percentages among the active working roles so that 100% of the daily pool is distributed.
3. **Intra-Role Employee Share**:
   $$\text{Employee Share} = \text{Role Pool}_R \times \left( \frac{\text{Shift Hours in Role } R}{\text{Total Hours Worked in Role } R \text{ on Day } d} \right)$$
   *(If an employee is the sole worker in that role on that day, they receive 100% of that role's bucket).*

#### Example Walkthrough
- **Daily Tips Collected**: $1,000.00
- **Role Allocations**: Servers (60%), Bartender (20%), Kitchen (20%)
  - Server Bucket = $600.00
  - Bartender Bucket = $200.00
  - Kitchen Bucket = $200.00
- **Staff Working**:
  - Server A (6 hrs) & Server B (4 hrs) $\rightarrow$ Total Server Hours = 10 hrs. Server A gets $6/10 \times \$600 = \$360.00$, Server B gets $4/10 \times \$600 = \$240.00$.
  - Bartender (Single worker, 7 hrs) $\rightarrow$ Gets 100% of Bartender bucket = $\$200.00$.
  - Cook A (5 hrs) & Cook B (5 hrs) $\rightarrow$ Each gets $5/10 \times \$200 = \$100.00$.
  - **Total Distributed**: $\$360 + \$240 + \$200 + \$100 + \$100 = \$1,000.00$ ($0.00 variance).

---

### Method 3: Points Tip Pooling (Weighted Point-Hours)

#### How It Works
Each role is assigned a point weight reflecting skill, responsibility, or customer engagement (e.g., Server = 10 pts, Bartender = 8 pts, Cook = 5 pts). Shift hours are multiplied by role points to produce **Weighted Point-Hours**.

#### Mathematical Formulas
1. **Shift Point-Hours**:
   $$\text{Point-Hours}_s = \text{Shift Hours}_s \times \text{Role Points}$$
2. **Total Daily Point-Hours**:
   $$\text{Total Point-Hours}_d = \sum_{s} \text{Point-Hours}_s$$
3. **Value per Point-Hour**:
   $$\text{Point Rate}_d = \frac{\text{Day Pool}}{\text{Total Point-Hours}_d}$$
4. **Employee Shift Payout**:
   $$\text{Employee Share} = \text{Shift Hours}_s \times \text{Role Points} \times \text{Point Rate}_d$$

---

## 3. Shift Ingestion & Timecard Rules

- **Strict Total Hours Usage**: The system strictly ingests each employee's **`Total Hours (excluding unpaid breaks)`** as recorded in the time card report. Overtime hours are **not** added separately, preventing duplicate counting.
- **Operating Day & Graveyard Shift Cutoff**: Shifts starting during overnight hours belong to the intended operating business day based on configurable cutoff thresholds.
- **Excluded Roles & Managers**: Non-tipped supervisory roles (e.g. Kitchen Manager, General Manager) can be designated as excluded from pool receipt while remaining auditable in shift logs. Shifts worked by the same employee under eligible service roles (e.g. Cashier) are accurately credited.

---

## 4. Multi-Channel Tip Ingestion

The Abacus ingests and tracks tip revenues across all hospitality channels:
- **Online / WebDash Tips**: Web orders, mobile orders, and online ordering platforms.
- **DoorDash Tips**: Third-party delivery platforms.
- **Kiosk Tips**: Self-order kiosks and countertop terminals.
- **Other Tips / Gratuities**: Direct event gratuities, catering service fees, or manual adjustments.
- **Direct Shift Tips**: Employee collected tips with configurable tip-out or sales-based contribution percentages.

---

## 5. User Interface & Workflow

1. **Setup Page**:
   - Configure restaurant name, effective cycle date range, and distribution method.
   - Set up role contribution rules (% of Tips or % of Sales).
   - Configure recipient rules (% allocations or point weights).
   - Inspect and adjust the **External Daily Tip Pool Entries** table with explicit channels (Online, DoorDash, Kiosk, Other).
2. **Time Cards Page**:
   - Real-time shift ledger with search, role filters, and manual shift editor.
   - Built-in timezone converter supporting 7 North American zones.
3. **Calculation Dashboard**:
   - Executive KPIs: Total Pool Distributed, Recipient Hours, Average Rate per Hour, and Total Overall Payout.
   - **Whole-Cycle Summary Table**: Total hours, net sales, kept tips, pool shares, total payouts, and effective $/hr rates.
   - **Date-by-Date Breakdown Tabs**: Daily audit breakdown showing staff working, recipient hours, hourly rates, and distributed pools.
   - **Employee Audit Modal**: Shift-by-shift ledger with daily breakdown.
4. **Client-Ready PDF Export**:
   - Formal restaurant letterhead and date range.
   - Clean payroll-ready cycle summary table.
   - Date-by-date daily ledger table.
   - Verified certification caption: *"These tips are calculated using the Tip Calculator."*
   - Page-break protection ensuring rows never split across pages.

---

## 6. Codebase Structure

```
src/
├── app/
│   ├── globals.css              # Design tokens, modern glassmorphism, responsive table styles
│   ├── layout.tsx               # Root document layout and metadata
│   └── page.tsx                 # Main application state orchestrator and file ingestion
├── components/
│   ├── CalculationDashboard.tsx # Executive KPIs, cycle summary table, date-by-date breakdown
│   ├── EmployeeDetailModal.tsx  # Shift-by-shift employee audit modal
│   ├── LandingHero.tsx          # Application entry view with quick action controls
│   ├── SetupPage.tsx            # Tip pool configuration, recipient rules, daily adjustments
│   ├── Sidebar.tsx              # Collapsible navigation sidebar
│   └── TimeCardsPage.tsx        # Shift ledger, timezone converter, shift editor
├── lib/
│   ├── calculator.ts            # Daily tip pooling engine with universal cent-reconciliation
│   ├── missionHillData.ts       # Reference shift and tip datasets
│   ├── parser.ts                # Robust spreadsheet and CSV timecard/tip parser
│   ├── pdfGenerator.ts          # Client-ready PDF generator with page-break protection
│   └── pdfLogo.ts               # Embedded platform branding
└── types/
    └── tips.ts                  # TypeScript data interfaces
```

---

## 7. Verification & Benchmarks

The system is validated against real-world restaurant tip sheets and reference benchmarks:
- **Mission Hill Benchmark (September 7–20, 2026)**:
  - Total Pool Collected: **$2,118.87**
  - Total Recipient Hours: **275.65 hrs**
  - Payroll Payouts ($0.00 Variance):
    - Cynthia Rosales Perez: $183.16 (23.66 hrs)
    - Lauren Sanders: $314.82 (44.86 hrs)
    - Meckenzie Anderson: $430.03 (55.69 hrs)
    - Micaela Hartley: $405.95 (43.78 hrs)
    - Michelle Osnovikov: $215.48 (37.22 hrs)
    - Mikaela Sosa Fuentes: $14.62 (4.81 hrs)
    - Natalie Dreyer: $63.89 (7.78 hrs — Cashier shifts; Kitchen Manager excluded)
    - Sally Rodriguez: $490.91 (57.85 hrs)

---

## 8. License

Private and proprietary. All rights reserved.
