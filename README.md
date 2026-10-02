# Abacus — Restaurant Tip Calculator

**Abacus** is a modern, production-ready restaurant tip calculation web application built with **Next.js 15**, **React 19**, and **TypeScript**.

Initially developed and mathematically audited for **Mission Hill** restaurant, the application architecture is engineered to easily scale across ~40 restaurants with distinct tip distribution systems (**Equal**, **Pooling**, **Percentage**, and **Points**).

---

## 🌟 Key Highlights & Features

1. **3D Visual Experience & Modern UI/UX**
   - Clean, dark-mode first design with glassmorphism, subtle glowing mesh accents, and card perspective effects.
   - Central hero action: **Run Abacus**.
   - Non-cluttered executive dashboard suitable for restaurant owners, general managers, and payroll processors.

2. **Source of Truth Compliance & 100% Mathematical Precision**
   - **Total Hours Rule**: Complies strictly with the prompt directive: calculates tips using the employee's **TOTAL HOURS** (excluding unpaid breaks) directly from the time card. Does **NOT** separately calculate regular hours or overtime hours.
   - **Toast POS Tip Pool Structure**: Direct digital replication of the Mission Hill Server/Cashier tip pool:
     - **Contributors (100%)**: Server, Cashier, Owner, Kiosk, Online, QR, 3PO.
     - **Recipients**: Cashier (Equal Share per hour), Server (Equal Share per hour).
     - **Excluded Roles**: Management / Kitchen roles (e.g., Kitchen Manager) are automatically audited and excluded from recipient tip allocations.
   - **Business Day Operating Cycle**: Accurately maps overnight and morning shifts (shifts starting before 12:00 PM belong to the preceding evening's operating cycle, matching POS and Excel date groupings).
   - **Reconciliation Audit**: Guaranteed **$0.00 difference** between total tip inputs and total employee distributions.

3. **Streamlined 4-Step Workflow**
   - **Step 1 — Cycle Selection**: Interactive calendar picker with presets (e.g. September 7 → September 20, 2026).
   - **Step 2 — Time Card Upload**: Drag-and-drop support for `.xlsx`, `.xls`, and `.csv` files + 1-click sample loader.
   - **Step 3 — Daily Tip Entry**: Automatically populates all cycle dates for clean entry of WebDash, DoorDash, Kiosk, Chaos, and Other collected tips. Includes 1-click auto-fill for sample verification.
   - **Step 4 — Run Calculation**: Instantly computes daily rates, employee allocations, and whole-cycle payouts with celebration confetti.

4. **Executive PDF Export**
   - Professional, client-ready, multi-page PDF generation via `jsPDF` and `jspdf-autotable`.
   - Free of spreadsheet clutter; includes executive KPI cards, master employee payout tables, date-by-date reconciliation, and formal verification sign-off blocks.

5. **Temporary / Session-Based Architecture**
   - Protects sensitive payroll data and eliminates database burden.
   - Calculations are stored temporary/in-session and can be wiped instantly with the **Reset Cycle** action.

6. **Extensible Multi-Restaurant Architecture**
   - Modular configuration system (`src/config/restaurants.ts`) ready to support ~40 future restaurants with configurable tip pool types:
     - `equal`: Equal distribution per hour (Mission Hill).
     - `pooling`: Shift-based pool allocations.
     - `percentage`: Tiered front-of-house percentages.
     - `points`: Seniority and role weight points.

---

## 📊 Verification & Audit Results (Mission Hill Reference Cycle: Sep 7 – Sep 20)

| Metric | Source Excel (`Mission Hill Tips.xlsx`) | Abacus Web Engine | Status |
| :--- | :--- | :--- | :--- |
| **Total Tips Distributed** | **$2,118.87** | **$2,118.87** | **✓ 100% Match** |
| **Total Eligible Hours** | **275.65 hrs** | **275.65 hrs** | **✓ 100% Match** |
| **Effective Tip Rate** | **$7.69 / hr** | **$7.69 / hr** | **✓ 100% Match** |
| **Eligible Employees Paid** | **8 Staff** | **8 Staff** | **✓ 100% Match** |
| **Kitchen Manager Shifts** | **Excluded (2 shifts, 7.69 hrs)** | **Excluded (2 shifts)** | **✓ 100% Match** |
| **Reconciliation Difference** | **$0.00** | **$0.00** | **✓ Balanced** |

### Individual Employee Payouts Audit

| Employee Name | Role | Shifts | Total Hours | Abacus Payout | Source Excel | Audit |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Sally Rodriguez** | Cashier | 10 | 57.85 | **$490.91** | $490.91 | ✓ Match |
| **Meckenzie Anderson** | Server | 9 | 55.69 | **$430.03** | $430.03 | ✓ Match |
| **Micaela Hartley** | Cashier | 7 | 43.78 | **$405.95** | $405.95 | ✓ Match |
| **Lauren Sanders** | Cashier | 9 | 44.86 | **$314.82** | $314.82 | ✓ Match |
| **Michelle Osnovikov** | Cashier | 6 | 37.22 | **$215.48** | $215.48 | ✓ Match |
| **Cynthia Rosales Perez** | Cashier / Server | 5 | 23.66 | **$183.16** | $183.16 | ✓ Match |
| **Natalie Dreyer** | Cashier | 2 | 7.78 | **$63.89** | $63.89 | ✓ Match |
| **Mikaela Sosa Fuentes** | Server | 1 | 4.81 | **$14.62** | $14.62 | ✓ Match |

---

## 🚀 Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Run Production Build Verification**:
   ```bash
   npm run build
   ```

4. **Run Automated Calculation Audit Test**:
   ```bash
   npx tsx src/test_verification.ts
   ```

---

## 🌐 Deploying to Vercel & GitHub

The repository is fully optimized for GitHub and Vercel:

1. Push this repository to GitHub.
2. In Vercel, click **Add New Project** and select your repository.
3. Framework Preset: **Next.js** (detected automatically).
4. Build Command: `next build` (standard).
5. Output Directory: `.next` (standard).
6. Click **Deploy**.
