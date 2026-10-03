# The Abacus - Restaurant Tip Calculation System

The Abacus is a restaurant-based tip calculation system designed for US dining and hospitality operations. The application automates shift aggregation, rule-based tip contributions, multi-method pool distribution, and payroll reporting.

The system supports diverse restaurant tip pool structures, including uniform hourly pooling, weighted role points, and role percentage splits, with support for direct tip retention, sales-based contributions, and multi-channel order sources (Self-Order Kiosks, Online Orders, Table QR, and Third-Party Delivery).

---

## System Architecture and Core Calculation Logic

### 1. Shift Ingestion and Operating Day Rules
* **Decisive Hours Metric**: Shift calculations strictly utilize each employee's total worked hours (excluding unpaid breaks) as recorded in the time card report. Regular hours and overtime hours are not split for tip distribution purposes.
* **Business Day Cutoff Hour**: Restaurant operating cycles frequently span past midnight. Shifts starting before the business day cutoff hour (default: 12:00 PM noon) are mapped to the operating date of the previous calendar day.
* **Role Eligibility**: Each shift is classified as an eligible recipient or an excluded role based on restaurant policy. Non-tipped roles (e.g., Kitchen Manager, General Manager) are excluded from pool receipt while remaining auditable in shift logs.

### 2. Contribution Configuration
The system supports two contribution mechanisms:
* **Percentage of Tips**: Contributing employees contribute a defined percentage of their collected tips into the daily pool and retain the balance (`Kept Tips = Collected Tips - Contribution`).
* **Percentage of Sales**: Contributing employees contribute a defined percentage of net sales into the daily pool, deducted from collected tips.
* **Automated Order Channels**:
  * Self-Order Kiosks: Configurable percentage contribution.
  * Online / Web Orders: Configurable percentage contribution.
  * Table QR Orders: Configurable percentage contribution.
  * Third-Party Delivery (3PO): Configurable percentage contribution.
  * Custom Channels: User-defined contribution sources with custom naming and contribution percentages.

### 3. Distribution Methods
The daily pool (sum of all shift contributions and external channels for that operating date) is allocated across eligible recipients working on that date using one of three distribution methods:

* **Equally**:
  * Total Recipient Hours = Sum of hours worked by all eligible recipient roles on the operating date.
  * Hourly Rate = Daily Pool / Total Recipient Hours.
  * Employee Pool Share = Shift Hours * Hourly Rate.

* **Percentage**:
  * Each recipient role is assigned a percentage of the total pool.
  * Role Bucket = Daily Pool * Role Allocation Percentage.
  * Role Hourly Rate = Role Bucket / Total Hours worked by employees in that role on that date.
  * Employee Pool Share = Shift Hours in Role * Role Hourly Rate.

* **Points**:
  * Each recipient role is assigned a point multiplier per hour (e.g., Server = 2 points, Bartender = 1 point).
  * Shift Point-Hours = Shift Hours * Role Points.
  * Total Point-Hours = Sum of Shift Point-Hours across all eligible recipients on that date.
  * Rate per Point-Hour = Daily Pool / Total Point-Hours.
  * Employee Pool Share = Shift Hours * Role Points * Rate per Point-Hour.

### 4. Payout Structure
For each employee across the calculation cycle:
* `Total Kept Tips = Sum of retained shift tips across the period`
* `Total Pool Received = Sum of daily pool allocations across the period`
* `Total Payout = Total Kept Tips + Total Pool Received`
* `Effective Hourly Rate = Total Payout / Total Hours`

---

## Application Structure and Pages

### 1. Navigation and Interface
* **Collapsible Sidebar**: Unified navigation granting instant access to the Setup Page, Time Cards Ledger, Calculation Dashboard, and sample demonstration loaders.
* **Interactive Hero View**: Visual overview with direct calculation trigger and clean operational navigation.

### 2. Tip Pool Setup Page
* **General Configuration**: Specification of pool name, restaurant name, effective date range, and operating time periods (all-day vs. specific operating windows).
* **Contributor Settings**: Flexible selection between Percentage of Tips and Percentage of Sales, freeform role entry with datalist suggestions, contribution percentage inputs, and channel toggles.
* **Custom Contribution Sources**: Capability to define arbitrary contribution sources with dedicated percentage splits.
* **Distribution Model Selection**: Interactive configuration between Equal, Percentage, and Points distribution modes with dynamic model descriptions.
* **Recipient Rules**: Role-based recipient allocation supporting custom role titles, percentage targets, and point weights.
* **Daily Ingestion & Adjustment**: Interactive ledger table for inspecting and manually adjusting daily collections across order channels before finalizing distributions.

### 3. Time Cards Page
* **Shift Ledger**: Comprehensive record of employee shifts including employee names, roles, pay rates, time-in, time-out, and total hours worked.
* **Timezone Converter**: Operational support for seven standard North American timezones:
  * Eastern Time (ET)
  * Central Time (CT)
  * Mountain Time (MT)
  * Pacific Time (PT)
  * Alaska Time (AKT)
  * Hawaii Time (HT)
  * Atlantic Time (AT)
* **Search and Filtering**: Instant search by employee name and real-time filtering by role.
* **Manual Shift Entry**: Modal interface for adding custom or corrected shifts directly to the ledger.

### 4. Calculation Dashboard
* **Executive Metrics**: Summary cards displaying Total Pool Distributed, Recipient Hours, Average Rate per Hour, and Total Overall Payout.
* **Cycle Distribution Table**: Employee-level distribution summary detailing total hours, net sales, kept tips, pool shares, total payouts, and effective hourly rates.
* **Daily Breakdown Audit**: Date-by-date reconciliation tabs displaying collected pools, active recipient hours, hourly pool rates, and distribution totals for each operating date.
* **Employee Audit Modal**: Individual employee drill-down displaying shift-by-shift records, daily hours, kept tip amounts, and daily allocated pool shares.
* **Client PDF Export**: Direct generation of client-ready PDF distribution reports.

### 5. Client PDF Reporting
* **Executive Letterhead**: Standardized header incorporating restaurant details, date range, and calculation method.
* **Cycle Summary Table**: Structured employee breakdown formatted for payroll processing.
* **Daily Ledger Table**: Comprehensive audit trail of daily pool balances, recipient hours, and distributed amounts.
* **Page-Break Protection**: Automated row-height calculation ensuring table rows never split across page boundaries.
* **Audit Footprint**: Formal certification notice on every page:
  `"These tips are calculated using the Tip Calculator."`
* **File Naming Convention**: `[Restaurant_Name]_[StartDate]_to_[EndDate].pdf`

---

## Codebase Modules

```
src/
├── app/
│   ├── globals.css              # Design tokens, color palette, responsive table utilities
│   ├── layout.tsx               # Root document structure and metadata
│   └── page.tsx                 # Main application controller and state orchestrator
├── components/
│   ├── CalculationDashboard.tsx # Summary metrics, cycle totals table, daily breakdown tabs
│   ├── EmployeeDetailModal.tsx  # Individual employee shift audit modal
│   ├── LandingHero.tsx          # Application entry view with action controls
│   ├── SetupPage.tsx            # Tip pool configuration, role rules, and daily adjustments
│   ├── Sidebar.tsx              # Collapsible navigation sidebar and utility actions
│   └── TimeCardsPage.tsx        # Shift ledger, timezone converter, and shift editor
├── lib/
│   ├── calculator.ts            # Tip pooling and distribution calculation engine
│   ├── missionHillData.ts       # Reference shift and tip datasets for testing
│   ├── parser.ts                # Time card parser for spreadsheet and CSV formats
│   ├── pdfGenerator.ts          # Client-ready PDF export with formatted tables
│   ├── pdfLogo.ts               # Embedded base64 platform emblem
│   └── testSampleData.ts        # Reference shift and tip datasets for multi-channel pooling
└── types/
    └── tips.ts                  # TypeScript interface and type definitions
```

---

## License

Private and proprietary. All rights reserved.
