# RIGLOCK — Industrial Rescue Dispatch & B2B Equipment Marketplace

RIGLOCK is an emergency-grade industrial hardware dispatch, equipment rental, and B2B procurement web application engineered for field engineers, infrastructure contractors, and heavy-rigging fleet operators. Built on a high-contrast **Industrial Rescue** design language (`0px` sharp corners, mechanical hard shadows, Signal Orange & Safety Lime telemetry accents, and tabular monospace financials formatted exclusively in Indian Rupees `Rs.`), RIGLOCK enforces strict role-locked workflows between **Buyers** and **Sellers & Renters**.

---

## Table of Contents

1. [Core Architecture & Capabilities](#1-core-architecture--capabilities)
2. [Role-Locked Authentication & Registration](#2-role-locked-authentication--registration)
3. [Global TopBar Search](#3-global-topbar-search)
4. [Buyer Workspace Workflows](#4-buyer-workspace-workflows)
5. [Seller & Renter Workspace Workflows](#5-seller--renter-workspace-workflows)
6. [Active Dispatch, SVG Field Map & Telemetry](#6-active-dispatch-svg-field-map--telemetry)
7. [Design System & Currency Formatting](#7-design-system--currency-formatting)
8. [Project Structure](#8-project-structure)
9. [Tech Stack & Dependencies](#9-tech-stack--dependencies)
10. [Local Development & Scripts](#10-local-development--scripts)
11. [Demo Accounts & Sample Data](#11-demo-accounts--sample-data)
12. [Client-Side Persistence (`localStorage`)](#12-client-side-persistence-localstorage)

---

## 1. Core Architecture & Capabilities

RIGLOCK separates procurement and supply operations into two strictly isolated portals:

- **Buyer Portal**: Accesses the real-time **Triage Board**, **Buyer Desk** (12-SKU catalog, requisition cart, multi-address checkout console, current orders, past orders, GST tax invoices), **Active Dispatch** live tracker, and **My Ledger** rental/mission history.
- **Seller & Renter Portal**: Accesses the **Seller & Renter Hub** (private inventory pricing & staging toggles, incoming buyer PO fulfillment, active fleet rentals, settled past sales with 5% platform fee calculation, cancellation ledger, D3 **Performance Metrics**, and new hardware listing form), **Dispatch Queue**, and **My Depot Nodes**.

Cross-account isolation is enforced at the state layer (`src/App.tsx`):
- Buyers only see their own orders (`order.buyerId === currentUser.id`) and rental missions (`mission.buyerId === currentUser.id`).
- Sellers only see their own inventory (`item.sellerId === currentUser.id`), incoming PO line items belonging to them, fleet rental dispatches (`mission.equipment.sellerId === currentUser.id`), and assigned depot nodes (`node.sellerId === currentUser.id`).

---

## 2. Role-Locked Authentication & Registration

RIGLOCK includes three dedicated authentication views before entering the application:

1. **Account Registration (`src/components/RegisterScreen.tsx`)**
   - Users must first register by choosing an account role (`buyer` or `seller`).
   - Captures Full Name, Company / Organization Name, Work Email (duplicate email checks enforced across all accounts), Contact Phone, GSTIN, Site or Depot Address, Depot Region (for Sellers), and Password + Confirmation.
   - Upon registration, newly registered Sellers automatically receive a starter live `DepotNode` in their fleet.
   - Redirects directly to the matching role login screen (`buyer-login` or `seller-login`).

2. **Buyer Portal Login (`src/components/BuyerLoginScreen.tsx`)**
   - Signal Orange (`PORTAL 01 // BUYER ACCESS`) procurement login screen.
   - Rejects seller credentials with an explicit cross-portal denial notice.

3. **Seller & Renter Partner Login (`src/components/SellerLoginScreen.tsx`)**
   - Distinct Safety Lime halftone (`PORTAL 02 // SELLER & RENTER PARTNER TERMINAL`) vendor login screen.
   - Rejects buyer credentials with an explicit cross-portal denial notice.

---

## 3. Global TopBar Search

The sticky header (`src/components/TopBar.tsx`) provides a role-aware global search bar (inline on desktop/tablet and full-width mobile strip below `< md`) with `/` and `Ctrl+K` / `Cmd+K` keyboard shortcuts and `Escape` dismissal:

- **For Buyers**:
  - Searches the equipment catalog in real time by **SKU** (e.g., `RIG-PWR-20X`), **Category** (`POWER`, `DEWATERING`, `HYDRAULIC`, `LIGHTING`, `CUTTING`, `AIR`), **Node Callsign** (e.g., `VAN-UNIT 04 // DOCKLANDS`, `DEPOT ALPHA`), unit name, or supplier.
  - Displays a quick-jump dropdown of matching units with SKU, category badge, node location, and `Rs.` Buy/Rent pricing.
  - Clicking a match or footer action (`FILTER IN BUYER DESK` / `FILTER IN TRIAGE BOARD`) navigates directly to the target screen and keeps search state synchronized across `TopBar`, `BuyerScreen`, and `TriageBoardScreen`.

- **For Sellers & Renters**:
  - Searches across the seller's own **Inventory** (SKU, name, category, node callsign, staging status) and **Orders / Rental Missions** (PO number, mission code, buyer company, delivery address, status, ordered SKU).
  - Groups matches into **Your Inventory** and **Your Orders & Rentals** in the quick-jump dropdown.
  - Clicking an inventory unit opens the `INVENTORY` tab filtered to that SKU; clicking an order or mission automatically routes to the right Seller tab (`ORDERS`, `PAST SALES`, or `CANCELLATIONS`) filtered to that PO or mission code.

---

## 4. Buyer Workspace Workflows

### A. Triage Board (`src/components/TriageBoardScreen.tsx`)
- Toggle between **EMERGENCY: NOW** (hourly ER dispatch pricing + rapid drop fee) and **PROJECT: RENTAL** (daily/weekly rental pricing).
- Filter by geodesic search radius (`5 MI`, `15 MI`, `30 MI`), `IN-VEHICLE ONLY` rapid units, hardware category, node filter, or global search query.
- Launch the **Dispatch Staging Drawer** (`src/components/DispatchStagingDrawer.tsx`) to enter drop-zone coordinates/address, site contact, rental duration, and optional Tier-0 Priority Override before triggering a live dispatch.

### B. Buyer Desk (`src/components/BuyerScreen.tsx`) & Checkout Console (`src/components/CheckoutDrawer.tsx`)
- **Products Catalog (12 SKUs across 6 categories)**:
  - Filter by category with live SKU counts, staging availability (`IN VEHICLE` vs `DEPOT READY`), and sort by nearest node, buy price (low-to-high / high-to-low), or highest stock.
  - Inspect full 6-row technical specification matrices and QA load-bank checklists via the **SPECS** modal.
  - Add units to the sticky **Buy Requisition Cart** or launch **RENT** staging directly.
- **Multi-Step Checkout & Site Address Book (`CheckoutDrawer.tsx`)**:
  - Per-buyer saved site address & contact book persisted in `localStorage` (`riglock_addresses_<buyerId>`), seeded from the user's registration profile.
  - Add new delivery addresses inline with **Site Label**, **Recipient Name**, validated **Contact Phone** (10+ digits), **Street / Gate Address**, **City & State**, **PIN / Postal Code**, and optional **Unloading / Gate Notes**.
  - Switch between or delete saved addresses (always retaining at least one).
  - Select logistics tier (`FREIGHT`, `ER_DROP`, or `PICKUP`), settlement method (`ESCROW_INR`, `NET_30_PO`, or `ON_SITE_COD`), and add PO reference/dispatch notes.
  - Review itemized subtotal, 18% GST, logistics fee, and grand total in `Rs.` before issuing the Purchase Order (`PO-2026-XXX`), which immediately decrements catalog stock.
- **Current Orders, Cancellations & GST Invoices**:
  - View in-flight POs (`PENDING_APPROVAL`, `APPROVED_FOR_RELEASE`, `IN_TRANSIT`) with receiver contact details and active rental dispatches.
  - Cancel unshipped POs with a selected reason (automatically restores catalog stock and moves the record to **Past Orders**).
  - Inspect itemized **RIGLOCK GST Tax Invoices** and reorder past items in one click (`BUY AGAIN`).

### C. My Ledger (`src/components/MissionLogScreen.tsx`)
- Complete mission history of past and active equipment dispatches with 1-click re-dispatch and quick jump to the live Active Dispatch console.

---

## 5. Seller & Renter Workspace Workflows

### A. Seller & Renter Hub (`src/components/SellerRenterScreen.tsx`)
- **Inventory Tab**: Toggle unit staging (`IN VEHICLE` vs `DEPOT READY`), inline-edit sale price, daily rental rate, ER hourly rate, and stock quantity, or remove units.
- **Orders Tab**: Review active incoming buyer POs (scoped strictly to the seller's line items, showing buyer company, shipping destination, receiver contact name & phone, and payment terms). Advance order stages (`APPROVE & RELEASE` → `DISPATCH FREIGHT` → `MARK DELIVERED`), cancel orders with stock restoration, and monitor active fleet rentals.
- **Past Sales Tab**: Displays settled hardware POs with gross sale, 5% platform fee deduction, and net payout alongside completed rental mission payouts.
- **Cancellations Tab**: Tracks buyer- and seller-initiated PO cancellations and aborted rental missions with reasons and voided values.
- **List Hardware Tab**: Publish new industrial equipment units directly to a seller-owned depot or van node.
- **Synced Filter Bar**: Filters inventory, active orders, past sales, and cancellations in real time alongside the TopBar global search.

### B. Performance Metrics (`src/components/PerformanceMetrics.tsx`)
Powered by **D3 (`d3`)**:
- **Time-Range Toggle**: `6M` (6-month rolling view) vs `Q4` view.
- **Stacked Monthly Revenue Chart**: Hardware Sales vs Rental & ER revenue in `Rs.` with interactive hover crosshair & tooltip.
- **Fulfillment Rate Sparkline & KPI Cards**: Tracks order fulfillment % alongside live seller activity.
- **Equipment Utilization Donut & Fleet Allocation**: Visualizes active vs standby fleet utilization across categories with safe empty-state rendering.

### C. My Depot Nodes (`src/components/DepotNodesScreen.tsx`)
- Inspect seller-owned rapid-response vans and 24/7 staging depots, live SLA readiness, coordinates, lead technician, and jump straight to node-filtered inventory.

---

## 6. Active Dispatch, SVG Field Map & Telemetry

`src/components/ActiveDispatchScreen.tsx` brings together:
- **45-Minute Launch Dial (`src/components/LaunchDial.tsx`)**: Live 1-second countdown clock (accelerates when Tier-0 Priority Override is engaged) with SVG radial arc progress.
- **4-Stage Dispatch Stepper**: Advance missions through `VERIFIED` → `LOADED` → `EN_ROUTE` → `ARRIVED` → `COMPLETED` (or `ABORTED`), complete with handoff verification PIN plate.
- **Real-Time SVG Field Map (`src/components/FieldMap.tsx`)**: Static tactical coordinate grid plotting node origin, `siteCoordinates`, and the vector route path to `dropZoneAddress`.
- **Site Telemetry Log**: Append live timestamped site instructions directly into the mission log.

---

## 7. Design System & Currency Formatting

- **Color Palette**:
  - Canvas Charcoal: `#131410`
  - Slate Plate / Elevated: `#1A1A1A` / `#242424`
  - Track Hairline: `#2A2A2A`
  - Signal Orange: `#FF5A1F`
  - Safety Lime: `#C6FF3D`
  - Alert Red: `#FF2E2E`
  - Off-White Ink: `#F4F1EA`
- **Geometry & Motion**: Strictly sharp `0px` border radius, `2px` solid structural borders, `4px 4px 0px #000000` hard-edge shadows, mechanical press offsets, and chamfered corner tags.
- **Typography**: `Bebas Neue` (display headers), `Chivo` (body copy), and `JetBrains Mono` with `tabular-nums` (telemetry, SKUs, and pricing).
- **Currency**: All monetary amounts are formatted in Indian Rupees (`Rs.`) via `formatRs()` in `src/utils/currency.ts` using `en-IN` digit grouping (`Rs. 3,85,000`).

---

## 8. Project Structure

```text
.
├── .env.example                       # Environment variable template (GEMINI_API_KEY, APP_URL)
├── index.html                         # HTML entry & metadata
├── metadata.json                      # Application title & capability metadata
├── package.json                       # Dependencies & Vite/TypeScript scripts
├── tsconfig.json                      # TypeScript compiler configuration
├── vite.config.ts                     # Vite configuration + src/assets copy plugin
└── src/
    ├── App.tsx                        # Root state, auth isolation, localStorage sync & routing
    ├── index.css                      # Tailwind CSS v4 import & Industrial Rescue design tokens
    ├── main.tsx                       # React 19 mount entry
    ├── assets/images/                 # 12 high-res 4:3 equipment studio photos
    ├── data/catalog.ts                # Seeded accounts, 12 hardware SKUs, depot nodes, orders & missions
    ├── types/rescue.ts                # Shared TypeScript interfaces and role/tab union types
    ├── utils/currency.ts              # Indian Rupee (Rs.) tabular formatter
    └── components/
        ├── ActiveDispatchScreen.tsx   # Live dispatch console, stage stepper & telemetry log
        ├── BuyerLoginScreen.tsx       # Role-locked Buyer login portal
        ├── BuyerScreen.tsx            # Buyer Desk (Products, Specs modal, Cart, Current/Past Orders, GST Invoice)
        ├── CheckoutDrawer.tsx         # Slide-over checkout with saved address/contact book & PO review
        ├── DepotNodesScreen.tsx       # Regional staging vans & 24/7 depot node grid
        ├── DispatchStagingDrawer.tsx  # Rental / ER dispatch configuration drawer
        ├── FieldMap.tsx               # Tactical SVG grid & route path visualizer
        ├── LaunchDial.tsx             # 45-minute live SVG countdown dial
        ├── MissionLogScreen.tsx       # Historical dispatch mission ledger
        ├── PerformanceMetrics.tsx     # D3 monthly revenue, fulfillment & fleet utilization charts
        ├── RegisterScreen.tsx         # Role-selecting account registration flow
        ├── SellerLoginScreen.tsx      # Role-locked Seller & Renter login portal
        ├── SellerRenterScreen.tsx     # Seller inventory, incoming POs, past sales, cancellations & listing form
        ├── TopBar.tsx                 # Sticky header with role nav, global search & quick-jump dropdown
        ├── TriageBoardScreen.tsx      # Emergency/Rental hardware triage grid & radius filter
        └── TrustStack.tsx             # Deposit bond, rating, ping & distance micro-component
```

---

## 9. Tech Stack & Dependencies

- **UI & State**: React 19 (`react`, `react-dom`) + TypeScript (`^7.0.2`)
- **Build Tool**: Vite 8 (`vite`, `@vitejs/plugin-react`)
- **Styling**: Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`)
- **Data Visualization**: D3 (`d3`, `@types/d3`)
- **Icons & Motion**: `lucide-react`, `motion`
- **Additional Workspace Packages**: `express`, `dotenv`, `tsx`, `@google/genai`

---

## 10. Local Development & Scripts

### Prerequisites
- Node.js 20+ and npm (or Bun)

### Setup & Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Optional: Copy `.env.example` to `.env` if configuring environment variables for deployment:
   ```bash
   cp .env.example .env
   ```
3. Start the Vite development server on port `3000`:
   ```bash
   npm run dev
   ```
4. Type-check and build for production:
   ```bash
   npm run lint
   npm run build
   ```

### Available `package.json` Scripts
| Script | Command | Purpose |
| :--- | :--- | :--- |
| `dev` | `vite --port=3000 --host=0.0.0.0` | Runs the SPA dev server on port 3000 |
| `lint` | `tsc --noEmit` | Runs strict TypeScript static checks |
| `build` | `vite build` | Bundles production assets into `dist/` and copies `src/assets` |
| `preview` | `vite preview` | Previews the built `dist/` bundle locally |
| `clean` | `rm -rf dist server.js` | Removes build artifacts |

---

## 11. Demo Accounts & Sample Data

To test role isolation, multi-vendor order splitting, and buyer/seller workflows immediately without registering from scratch, use the seeded accounts defined in `src/data/catalog.ts`:

| Role | Company | Email | Password | Portal |
| :--- | :--- | :--- | :--- | :--- |
| **Buyer** | Meridian Infrastructure Ltd | `procurement@meridianinfra.in` | `Meridian@2026` | **Buyer Login** |
| **Buyer** | Apex Civil Corp | `orders@apexcivil.in` | `Apex@2026` | **Buyer Login** |
| **Seller & Renter** | Kowalski Heavy Rigging | `dispatch@kowalskirigging.in` | `Kowalski@2026` | **Seller Login** |

### Catalog Highlights (12 Seeded SKUs across 6 Categories)
- **POWER**: `RIG-PWR-20X` (PowerMaster 20kW Diesel Generator), `RIG-PWR-10B` (Volt-Force 10kWh Hybrid Battery Inverter)
- **DEWATERING**: `RIG-WTR-350` (IronFlow 4" Trash Dewatering Pump), `RIG-WTR-600` (Submerge-X 6" Slurry Submersible Pump)
- **HYDRAULIC**: `RIG-HYD-300` (DynaBreak DB300 Hydraulic Pack), `RIG-HYD-520` (Titan-Jaw Hydraulic Rebar & Rescue Cutter)
- **LIGHTING**: `RIG-LGT-R100` (T-Light Pro Mast & Lithium Bank), `RIG-LGT-60B` (Halo-Beam 60,000lm Glare-Free Site Tower)
- **CUTTING**: `RIG-CUT-400` (Pro-Weld 400A Plasma / Arc Cutter), `RIG-CUT-350` (CoreBore 350mm Concrete Diamond Drill Rig)
- **AIR**: `RIG-AIR-2K` (CleanVault 2000 CFM Negative Air Scrubber), `RIG-AIR-185` (Titan 185 CFM Rotary Screw Air Compressor)

---

## 12. Client-Side Persistence (`localStorage`)

All user accounts, sessions, catalog modifications, orders, missions, nodes, and per-buyer saved site addresses persist locally in the browser:

- `riglock_accounts_v1` — Registered buyer and seller accounts
- `riglock_session_v1` — Active authenticated user session
- `riglock_catalog_v1` — Equipment catalog (automatically merges newly added default SKUs by ID)
- `riglock_orders_v1` — Purchase orders, statuses, settlement terms, and cancellation logs
- `riglock_missions_v1` — Active, completed, and aborted rental/ER dispatch missions
- `riglock_nodes_v1` — Regional staging vans and depot nodes
- `riglock_addresses_<buyerId>` — Per-buyer saved delivery site addresses and receiver phone numbers

To reset all persisted data back to the initial seeded state, clear site `localStorage` in your browser DevTools and reload.
