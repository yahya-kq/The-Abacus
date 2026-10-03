# Abacus - Restaurant Tip Calculation System

Abacus is a tip calculation and pooling application designed for multi-unit restaurant operations. The application automates shift aggregation, rule-based tip contribution, multi-method pool distribution, and payroll reporting.

The system is configured to support varied restaurant tip pool structures, including uniform hourly pooling, weighted role points, and role percentage splits, with support for direct tip retention, sales-based contributions, and multi-channel order sources (Kiosk, Online, and Third-Party Delivery).

---

## System Architecture and Core Calculation Logic

### 1. Shift Ingestion and Operating Day Rules
* **Decisive Hours Metric**: Shift calculations strictly utilize each employee's total worked hours (excluding unpaid breaks) as recorded in the time card report. Regular hours and overtime hours are not split for tip distribution purposes.
* **Business Day Cutoff Hour**: Restaurant operating cycles frequently span past midnight. Shifts starting before the business day cutoff hour (default: 12:00 PM noon) are mapped to the operating date of the previous calendar day.
* **Role Eligibility**: Each shift is classified as an eligible recipient or an excluded role based on restaurant policy. Non-tipped roles (e.g., Kitchen Manager, Management) are excluded from pool receipt while remaining auditable in shift logs.

### 2. Contribution Configuration
The system supports two contribution mechanisms:
* **Percentage of Tips**: Contributing employees contribute a defined percentage of their collected tips into the daily pool and retain the balance (`Kept Tips = Collected Tips - Contribution`).
* **Percentage of Sales**: Contributing employees contribute a defined percentage of net sales into the daily pool, deducted from collected tips.
* **External Order Channels**:
  * Self-Order Kiosks: Configurable percentage contribution (default 100%).
  * Online / Web Orders: Configurable percentage contribution.
  * Table QR Orders: Configurable percentage contribution.
  * Third-Party Delivery (3PO): Configurable percentage contribution.

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

## Application Structure and Modules

```
src/
├── app/
│   ├── globals.css              # Design tokens, color palette, responsive table utilities
│   ├── layout.tsx               # Root document structure and metadata
│   └── page.tsx                 # Main application controller and state orchestrator
├── components/
│   ├── CalculationDashboard.tsx # Summary KPIs, cycle totals table, daily breakdown tabs
│   ├── EmployeeDetailModal.tsx  # Individual employee shift audit modal
│   ├── LandingHero.tsx          # Application entry view with 3D canvas and action button
│   ├── SetupPage.tsx            # Tip pool configuration, role rules, and file ingestion
│   ├── Sidebar.tsx              # Collapsible navigation sidebar and utility actions
│   └── TimeCardsPage.tsx        # Shift ledger, timezone converter, and shift editor
├── lib/
│   ├── calculator.ts            # Tip pooling and distribution calculation engine
│   ├── missionHillData.ts       # Reference shift and tip datasets for Mission Hill
│   ├── parser.ts                # Time card parser for Excel and CSV formats
│   ├── pdfGenerator.ts          # Client-ready PDF export with company branding
│   ├── pdfLogo.ts               # Embedded base64 company logo
│   └── testSampleData.ts        # Reference shift and tip datasets for multi-channel pooling
└── types/
    └── tips.ts                  # TypeScript interface and type definitions
```

---

## Client PDF Export

The PDF export module generates client-ready distribution summaries formatted for restaurant operators and accountants:
* Embedded Header: Company logo and restaurant details.
* Cycle Summary Table: Employee name, primary role, hours worked, net sales, kept tips, pool share, total payout, and effective hourly rate.
* Daily Ledger Table: Business date, day of week, collected pool, recipient hours, hourly rate, and total distributed.
* Page Break Protection: Automatic row-height calculation prevents split table rows across page boundaries.
* Verification Footer: Standardized audit caption on every page:
  `"These tips are calculated using the Tip Calculator."`
* File Naming Convention: `[Restaurant_Name]_[StartDate]_to_[EndDate].pdf`

---

## Local Development and Installation

### Prerequisites
* Node.js version 18.18 or higher (Node 20+ recommended).
* npm version 9 or higher.

### Installation Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/abacus.git
   cd abacus
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   Access the application at `http://localhost:3000`.

4. Run the production build verification:
   ```bash
   npm run build
   ```

---

## Deployment to Vercel

The application is structured for zero-configuration deployment on Vercel:

1. Push the repository to GitHub.
2. Log in to your Vercel Dashboard and select **Add New Project**.
3. Import the `abacus` repository.
4. Keep standard project settings:
   * **Framework Preset**: Next.js
   * **Root Directory**: `./`
   * **Build Command**: `next build`
   * **Output Directory**: `.next`
   * **Install Command**: `npm install`
5. Click **Deploy**. Vercel will compile the TypeScript codebase, generate optimized server and static assets, and issue a live production URL.

---

## License

Private and proprietary. All rights reserved.
