# RIGLOCK — Industrial Rescue Dispatch & B2B Equipment Marketplace

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node.js-20%2B-brightgreen.svg)](https://nodejs.org/)
[![React 19](https://img.shields.io/badge/React-19--blue.svg)](https://reactjs.org/)
[![Vite 8](https://img.shields.io/badge/Vite-8-64D1FF.svg)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC.svg)](https://tailwindcss.com/)

## 📦 Overview

**RIGLOCK** is an emergency-grade industrial hardware dispatch, equipment rental, and B2B procurement web application engineered for field engineers, infrastructure contractors, and heavy-rigging fleet operators.

Built on a high-contrast **Industrial Rescue** design language (`0px` sharp corners, mechanical hard shadows, Signal Orange & Safety Lime telemetry accents, and tabular monospace financials formatted exclusively in Indian Rupees `Rs.`), RIGLOCK enforces strict role-locked workflows between **Buyers** and **Sellers & Renters**.

---

## ✨ Features

### Core Architecture & Capabilities

- **Role-Locked Portals**: Strictly isolated Buyer and Seller/Renter workflows
- **Real-time Triage Board**: Emergency and rental dispatch filtering
- **Equipment Catalog**: 12 seeded SKUs across 6 categories (POWER, DEWATERING, HYDRAULIC, LIGHTING, CUTTING, AIR)
- **B2B Procurement**: Multi-step checkout with GST invoices, multi-address book, logistics tier selection
- **Seller Hub**: Inventory management, order fulfillment, past sales, cancellation ledger, hardware listing
- **Performance Metrics**: D3-powered revenue charts, fulfillment KPIs, fleet utilization donuts

### Role-Locked Authentication & Registration

- **Three dedicated auth views**: Registration, Buyer Login, Seller & Renter Login
- **Cross-portal credential rejection**: Explicit denial notices for role mismatches
- **Role selection at registration**: Choose `buyer` or `seller` account type
- **Automatic depot node creation**: New Sellers receive a starter live DepotNode

### Global TopBar Search

- **Buyers**: Search catalog by SKU, category, node callsign, unit name, or supplier
- **Sellers & Renters**: Search own inventory and orders/rentals with grouped dropdowns
- **Keyboard shortcuts**: `/`, `Ctrl+K`/`Cmd+K`, `Escape` dismissal

### Active Dispatch, SVG Field Map & Telemetry

- **45-minute Launch Dial**: Live 1-second countdown with SVG radial arc progress
- **4-Stage Dispatch Stepper**: VERIFIED → LOADED → EN_ROUTE → ARRIVED → COMPLETED/ABORTED
- **Real-time SVG Field Map**: Static tactical coordinate grid with route path visualization
- **Site Telemetry Log**: Append live timestamped site instructions

### Design System & Currency Formatting

- **Color Palette**: Canvas Charcoal `#131410`, Signal Orange `#FF5A1F`, Safety Lime `#C6FF3D`, Alert Red `#FF2E2E`
- **Geometry**: Strictly sharp `0px` border radius, `2px` solid structural borders, `4px 4px 0px #000000` hard-edge shadows
- **Typography**: `Bebas Neue` (display), `Chivo` (body), `JetBrains Mono` (telemetry, SKUs, pricing) with `tabular-nums`
- **Currency**: All amounts formatted in Indian Rupees (`Rs.`) via `formatRs()` using `en-IN` digit grouping (`Rs. 3,85,000`)

### Demo Accounts

| Role | Company | Email | Password | Portal |
|------|---------|-------|----------|--------|
| **Buyer** | Meridian Infrastructure Ltd | `procurement@meridianinfra.in` | `Meridian@2026` | Buyer Login |
| **Buyer** | Apex Civil Corp | `orders@apexcivil.in` | `Apex@2026` | Buyer Login |
| **Seller & Renter** | Kowalski Heavy Rigging | `dispatch@kowalskirigging.in` | `Kowalski@2026` | Seller Login |

---

## 🚀 Local Development

### Prerequisites

- **Node.js 20+** and npm (or Bun)
- **Free account** on [Render.com](https://render.com) (optional, for hosting)

### Setup & Run

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Start the Development Server (Vite + Express Backend)

```bash
# Start the React frontend (Vite) on port 3000
npm run dev

# Start the SQLite + Express backend on port 4000 (new terminal)
npm run server
```

The site will be available at `http://localhost:3000` (frontend) and API at `http://localhost:4000` (backend).

#### 3. Alternative: Single-Command Start

Both servers can be started concurrently:

```bash
npm run dev  # Vite on 3000
# In another terminal:
npm run server  # Express on 4000
```

---

## 🗄️ Free Database & Backend Hosting

### Architecture

This project uses a **file-based SQLite database** (`riglock.db`) with **Node.js + Express** backend — completely free with zero ongoing costs.

### Why This Stack?

| Component | Technology | Cost |
|-----------|------------|------|
| **Database** | SQLite (file-based) | Free, one-time |
| **Backend** | Node.js + Express | Free |
| **Hosting** | Render.com Free Tier | Free (750 hrs/month) |
| **Frontend** | Vite + React | Free (local or any static host) |

### Render.com Free Hosting (Step-by-Step)

1. **Create account**: Go to [render.com](https://render.com) and sign up
2. **New Web Service**: Click "New +" → "Web Service"
3. **Connect Repository**: 
   - Choose "Manual Deploy" or connect your GitHub repo
   - If manual: upload files or use the Render CLI
4. **Settings**:
   - **Build Command**: `npm run build`
   - **Start Command**: `node server.cjs`
   - **Environment Variables** (optional): `PORT=4000`
5. **Free Tier Benefits**:
   - 750 hours/month (≈ 31 full days of continuous operation)
   - Instance sleeps after inactivity, wakes on first request
   - **SQLite data persists** on disk even when sleeping
   - **No charges** unless exceeding 750 hours/month
   - Custom domain free (optional)

### Local Development with SQLite

The `server.cjs` file auto-creates `riglock.db` on first run with all required tables:

- `accounts` — User authentication and profiles
- `equipment` — Product catalog with all equipment fields
- `depot_nodes` — Fleet staging vans and depot nodes
- `orders` — Buyer purchase orders
- `order_items` — Order line items
- `missions` — Dispatch and rental missions

Run:
```bash
node server.cjs
```

Database: `riglock.db` created in project root

---

## 📁 Project Structure

```
E:\Projects\RIGLOCK\
├── server.cjs          # SQLite + Express backend (NEW - free fullstack)
├── riglock.db          # Auto-created SQLite database
├── package.json        # Dependencies & scripts
├── vite.config.ts      # Vite configuration
├── index.html          # HTML entry & metadata
├── metadata.json       # Application title & capability metadata
├── tsconfig.json       # TypeScript compiler configuration
├── vite.config.ts      # Vite configuration + src/assets copy plugin
├── .env.example        # Environment variable template
├── src/
│   ├── App.tsx         # Root state, auth isolation, localStorage sync & routing
│   ├── index.css       # Tailwind CSS v4 import & design tokens
│   ├── main.tsx        # React 19 mount entry
│   ├── supabaseClient.ts  # Supabase client (optional backup)
│   ├── types/rescue.ts # Shared TypeScript interfaces
│   ├── utils/currency.ts  # Indian Rupee (Rs.) formatter
│   ├── data/catalog.ts # Seeded accounts & 12 hardware SKUs
│   └── components/
│       ├── ActiveDispatchScreen.tsx   # Live dispatch console
│       ├── BuyerLoginScreen.tsx       # Buyer login portal
│       ├── BuyerScreen.tsx            # Buyer Desk (Products, Cart, Orders, GST)
│       ├── CheckoutDrawer.tsx         # Slide-over checkout with addresses
│       ├── DepotNodesScreen.tsx       # Regional staging vans & depot nodes
│       ├── DispatchStagingDrawer.tsx # Rental/ER dispatch configuration
│       ├── FieldMap.tsx               # Tactical SVG grid & route path
│       ├── LaunchDial.tsx             # 45-minute SVG countdown dial
│       ├── MissionLogScreen.tsx       # Historical dispatch mission ledger
│       ├── PerformanceMetrics.tsx     # D3 monthly revenue & fleet utilization
│       ├── RegisterScreen.tsx         # Role-selecting registration flow
│       ├── SellerLoginScreen.tsx      # Seller & Renter login portal
│       ├── SellerRenterScreen.tsx     # **Seller inventory + NEW product image upload**
│       ├── TopBar.tsx                 # Sticky header with global search
│       ├── TriageBoardScreen.tsx      # Emergency/Rental triage grid
│       └── TrustStack.tsx             # Deposit bond, rating, ping & distance
├── supabase/           # Supabase SQL migrations (optional backup)
│   ├── 2026_11_18_create_accounts_table.up.sql
│   ├── 2026_11_18_create_equipment_table.up.sql
│   ├── 2026_11_18_create_depot_nodes_table.up.sql
│   ├── 2026_11_18_create_orders_table.up.sql
│   ├── 2026_11_18_create_order_items_table.up.sql
│   └── 2026_11_18_create_missions_table.up.sql
├── src/assets/images/  # 12 high-res equipment studio photos
└── README.md           # This file
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **UI & State** | React 19 (`react`, `react-dom`) + TypeScript (`^7.0.2`) |
| **Build Tool** | Vite 8 (`vite`, `@vitejs/plugin-react`) |
| **Styling** | Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`) |
| **Data Visualization** | D3 (`d3`, `@types/d3`) |
| **Icons & Motion** | `lucide-react`, `motion` |
| **Backend** | Node.js + Express, SQLite (`sqlite3`) |
| **Optional BaaS** | Supabase (open-source Firebase alternative) |

### Package Dependencies

Key packages (see `package.json` for full list):

- `express` — Node.js web framework
- `sqlite3` — SQLite database driver for Node.js
- `@tailwindcss/vite` — Tailwind CSS v4 Vite plugin
- `@vitejs/plugin-react` — React Fast Refresh for Vite
- `lucide-react` — Icon library
- `motion` — Animation library
- `d3` — Data visualization
- `@types/react`, `@types/node`, `typescript` — TypeScript support

---

## 📦 Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite --port=3000 --host=0.0.0.0` | Runs the SPA dev server on port 3000 |
| `server` | `node server.cjs` | Starts the SQLite + Express backend on port 4000 |
| `build` | `vite build` | Bundles production assets into `dist/` |
| `preview` | `vite preview` | Previews the built `dist/` bundle locally |
| `clean` | `rm -rf dist server.js` | Removes build artifacts |
| `lint` | `tsc --noEmit` | Runs strict TypeScript static checks |

---

## 🌐 Free Deployment Options

### Option 1: Render.com (Recommended)

- **Free tier**: 750 hours/month (effectively forever for light usage)
- **Setup**: Connect GitHub repo, set Build/Start commands
- **URL**: `https://your-service-name.onrender.com`
- **Database**: SQLite `riglock.db` persists on disk

### Option 2: GitHub Pages (Frontend Only)

- **Free**: Unlimited bandwidth, no cost
- **Limitation**: Frontend only — backend would need separate hosting
- **Setup**: `npm run build`, deploy `dist/` folder

### Option 3: Vercel

- **Free tier**: 100 GB bandwidth, serverless functions
- **Setup**: Import GitHub repo, add `server.cjs` as serverless function
- **Note**: SQLite not supported on serverless; would need API route refactoring

### Option 4: Self-Hosted (VPS)

- **Cost**: $5-10/month for minimal VPS (DigitalOcean, Linode, etc.)
- **Full control**: Complete root access, custom configurations
- **Setup**: Node.js + PM2 + Nginx reverse proxy

---

## 🔐 Authentication & Data Privacy

### Local Storage Persistence (Default)

All user accounts, sessions, catalog modifications, orders, missions, nodes, and per-buyer saved site addresses persist locally in the browser:

- `riglock_accounts_v1` — Registered buyer and seller accounts
- `riglock_session_v1` — Active authenticated user session
- `riglock_catalog_v1` — Equipment catalog
- `riglock_orders_v1` — Purchase orders, statuses, settlement terms
- `riglock_missions_v1` — Active, completed, and aborted dispatch missions
- `riglock_nodes_v1` — Regional staging vans and depot nodes
- `riglock_addresses_<buyerId>` — Per-buyer saved delivery site addresses

**To reset**: Clear site `localStorage` in browser DevTools and reload.

### Supabase Integration (Optional)

For cloud database backup, Supabase migrations are provided in `supabase/` directory. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` to enable.

### SQLite Data Privacy

- Database file (`riglock.db`) stored on server disk
- No external data transmission except API calls
- All API endpoints authenticated via session (no hardcoded credentials)
- **Recommendation**: Regular database backups if hosting production data

---

## 👥 Role-Locked Access Control

### Buyer Portal

- Access: Triage Board, Buyer Desk (12-SKU catalog), Active Dispatch live tracker, My Ledger
- Order management: Create POs, view current/past orders, GST invoices, cancellations
- Multi-address book: Saved site addresses in `localStorage`
- Rent equipment: Direct rental staging from catalog

### Seller & Renter Portal

- Access: Seller & Renter Hub (inventory pricing & staging toggles), Dispatch Queue, My Depot Nodes
- Inventory management: Toggle staging status, inline-edit prices and rates
- Order fulfillment: Advance stages (APPROVE & RELEASE → DISPATCH FREIGHT → MARK DELIVERED)
- Past sales: Gross sale, 5% platform fee, net payout calculation
- Hardware listing: Publish new units with product images (new feature)
- Performance metrics: D3 revenue charts, fulfillment rate, fleet utilization

### Cross-Account Isolation

Enforced at the state layer (`src/App.tsx`):

- Buyers only see their own orders (`order.buyerId === currentUser.id`) and rental missions (`mission.buyerId === currentUser.id`)
- Sellers only see their own inventory (`item.sellerId === currentUser.id`), incoming PO line items, fleet rental dispatches (`mission.equipment.sellerId === currentUser.id`), and assigned depot nodes (`node.sellerId === currentUser.id`)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details (or add one if needed).

Copyright (c) 2026 Sourish Dey. All rights reserved.

---

## 🆘 Support

- **Issues**: Use the GitHub Issues tab
- **Questions**: Open a discussion on the Discussions tab
- **Demo**: Use the provided demo accounts above
- **Deployment**: Refer to the "Free Deployment Options" section

---

## 🛠️ Development & Contributing

### Adding New Features

1. **Frontend**: Modify `src/components/` or `src/App.tsx`
2. **Backend**: Update `server.cjs` API endpoints
3. **Database**: Add migrations to `supabase/` directory or update `riglock.db` schema
4. **TypeScript**: Update `src/types/rescue.ts` if adding new types

### Code Conventions

- **TypeScript**: Strict mode, `tsc --noEmit` must pass
- **Tailwind**: Follow existing design tokens and component patterns
- **Naming**: PascalCase for components, camelCase for variables, UPPER_SNAKE_CASE for constants
- **Commit**: Use conventional commit messages (optional but recommended)
- **Testing**: Manual testing via demo accounts recommended

### Contribution Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Contact

**Project**: RIGLOCK — Industrial Rescue Dispatch & B2B Equipment Marketplace
**Author**: Sourish Dey
**Year**: 2026

For questions, feedback, or deployment assistance, please refer to the Issues section or open a discussion.

---

## 📦 Version History

### v0.1.0 (2026-11-18)

- **Initial release**
- Role-locked buyer/seller portals
- Equipment catalog with 12 seeded SKUs
- Dispatch missions with 4-stage stepper
- SVG field map and telemetry log
- Product image upload for sellers (new)
- SQLite + Express backend (free fullstack)
- Supabase migrations (optional)
- Render.com free hosting guide

---

*Generated with ❤️ for the industrial rescue community*