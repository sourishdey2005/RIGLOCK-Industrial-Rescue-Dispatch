// RIGLOCK Backend Server - SQLite + Express
// Run with: node server.js
// Free hosting: Render.com (free tier) or any VPS

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware - CORS configured for Vercel frontend
const allowedOrigins = process.env.CORS_ORIGIN 
  ? [process.env.CORS_ORIGIN] 
  : ['https://riglock-industrysite.vercel.app', 'http://localhost:3000'];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.static('public'));

// Database path
const dbPath = path.resolve(__dirname, 'riglock.db');

// Initialize SQLite database
function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite database');
      
      db.serialize(() => {
        // Create accounts table
        db.run(`CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          role TEXT NOT NULL CHECK (role IN ('buyer', 'seller')),
          full_name TEXT NOT NULL,
          company_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          phone TEXT,
          gstin TEXT,
          site_or_depot_address TEXT,
          depot_region TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        )`);
        
        // Create equipment table
        db.run(`CREATE TABLE IF NOT EXISTS equipment (
          id TEXT PRIMARY KEY,
          sku TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          category TEXT NOT NULL CHECK (category IN ('POWER', 'DEWATERING', 'HYDRAULIC', 'LIGHTING', 'CUTTING', 'AIR')),
          image_url TEXT NOT NULL,
          condition_rating TEXT NOT NULL CHECK (condition_rating IN ('GRADE-A1', 'GRADE-A2')),
          availability_flag TEXT NOT NULL CHECK (availability_flag IN ('IN VEHICLE', 'DEPOT READY')),
          emergency_hourly_rate REAL DEFAULT 0,
          emergency_dispatch_fee REAL DEFAULT 0,
          rental_daily_rate REAL DEFAULT 0,
          rental_weekly_rate REAL DEFAULT 0,
          purchase_price REAL DEFAULT 0,
          stock_qty INTEGER DEFAULT 0,
          seller_id TEXT,
          seller_name TEXT,
          deposit_amount REAL DEFAULT 0,
          deposit_tier TEXT DEFAULT 'TIER-2 BOND' CHECK (deposit_tier IN ('TIER-1 BOND', 'TIER-2 BOND')),
          rating REAL DEFAULT 4.97,
          last_ping_seconds INTEGER DEFAULT 6,
          distance_miles REAL DEFAULT 1.0,
          eta_minutes INTEGER DEFAULT 22,
          node_id TEXT,
          node_callsign TEXT,
          courier_name TEXT,
          courier_plate TEXT,
          weight_lbs REAL DEFAULT 340,
          primary_output TEXT NOT NULL,
          voltage_or_pressure TEXT DEFAULT 'INDUSTRIAL GRADE',
          inspection_date TEXT DEFAULT (date('now')),
          summary TEXT NOT NULL,
          specs TEXT DEFAULT '[]',
          checklist TEXT DEFAULT '[]',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )`);
        
        // Create depot_nodes table
        db.run(`CREATE TABLE IF NOT EXISTS depot_nodes (
          id TEXT PRIMARY KEY,
          callsign TEXT NOT NULL UNIQUE,
          region TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('LIVE NODE', 'IN VEHICLE')),
          coordinates TEXT,
          map_x INTEGER DEFAULT 0,
          map_y INTEGER DEFAULT 0,
          distance_miles REAL DEFAULT 1.0,
          rating REAL DEFAULT 4.97,
          last_ping_seconds INTEGER DEFAULT 6,
          active_units INTEGER DEFAULT 0,
          sla_minutes INTEGER DEFAULT 22,
          vehicle_type TEXT DEFAULT '24/7 STAGING WAREHOUSE',
          deposit_tier TEXT DEFAULT 'TIER-1 BOND' CHECK (deposit_tier IN ('TIER-1 BOND', 'TIER-2 BOND')),
          seller_id TEXT,
          lead_tech TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now'))
        )`);
        
        // Create orders table
        db.run(`CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          po_number TEXT UNIQUE NOT NULL,
          buyer_id TEXT,
          buyer_company TEXT NOT NULL,
          gstin TEXT,
          delivery_address TEXT NOT NULL,
          delivery_tier TEXT NOT NULL CHECK (delivery_tier IN ('FREIGHT', 'ER_DROP', 'PICKUP')),
          delivery_fee REAL DEFAULT 0,
          subtotal REAL DEFAULT 0,
          gst_amount REAL DEFAULT 0,
          grand_total REAL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'APPROVED_FOR_RELEASE', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED_BY_BUYER', 'CANCELLED_BY_SELLER')),
          created_at TEXT DEFAULT (datetime('now')),
          cancelled_at TEXT,
          cancelled_by TEXT CHECK (cancelled_by IN ('BUYER', 'SELLER')),
          cancellation_reason TEXT
        )`);
        
        // Create order_items table
        db.run(`CREATE TABLE IF NOT EXISTS order_items (
          id TEXT PRIMARY KEY,
          order_id TEXT,
          equipment_id TEXT,
          sku TEXT NOT NULL,
          name TEXT NOT NULL,
          seller_id TEXT,
          seller_name TEXT,
          qty INTEGER DEFAULT 1,
          unit_price REAL DEFAULT 0,
          total_price REAL DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now'))
        )`);
        
        // Create missions table
        db.run(`CREATE TABLE IF NOT EXISTS missions (
          id TEXT PRIMARY KEY,
          mission_code TEXT UNIQUE NOT NULL,
          buyer_id TEXT,
          buyer_name TEXT NOT NULL,
          equipment_id TEXT,
          mode TEXT NOT NULL CHECK (mode IN ('emergency', 'rental')),
          drop_zone_address TEXT NOT NULL,
          site_coordinates TEXT,
          priority_override INTEGER DEFAULT 0,
          eta_total_seconds INTEGER DEFAULT 2700,
          remaining_seconds INTEGER DEFAULT 1800,
          status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (status IN ('VERIFIED', 'LOADED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'ABORTED')),
          handoff_pin TEXT,
          courier_name TEXT,
          courier_plate TEXT,
          started_at TEXT,
          total_cost REAL DEFAULT 0,
          rental_days INTEGER DEFAULT 0,
          cancellation_reason TEXT,
          logs TEXT DEFAULT '[]',
          created_at TEXT DEFAULT (datetime('now'))
        )`);
      });
      
      resolve(db);
    });
  });
}

// Initialize database and start server
initDatabase().then(() => {
  console.log('Database initialized, starting server...');
  
  // ===== ACCOUNTS API =====
  
  // Register new account
  app.post('/api/register', async (req, res) => {
    const { role, fullName, companyName, email, password, phone, gstin, siteOrDepotAddress, depotRegion } = req.body;
    const id = `user-${Date.now()}`;
    
    try {
      await db.run(
        `INSERT INTO accounts (id, role, full_name, company_name, email, phone, gstin, site_or_depot_address, depot_region, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [id, role, fullName, companyName, email, phone, gstin, siteOrDepotAddress, depotRegion]
      );
      res.json({ success: true, id, role });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Email already registered' });
    }
  });
  
  // Login
  app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM accounts WHERE email = ?`, [email], (err, user) => {
      if (err || !user || user.password !== password) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
      res.json({ success: true, user: { id: user.id, role: user.role, ...user } });
    });
  });
  
  // ===== EQUIPMENT API =====
  
  // Get all equipment
  app.get('/api/equipment', (req, res) => {
    db.all(`SELECT * FROM equipment`, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
  
  // Get equipment by seller
  app.get('/api/seller/equipment', (req, res) => {
    const sellerId = req.query.sellerId;
    db.all(`SELECT * FROM equipment WHERE seller_id = ?`, [sellerId], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
  
  // Add new equipment (seller)
  app.post('/api/equipment', (req, res) => {
    const item = req.body;
    const id = `eq-${Date.now()}`;
    
    const stmt = db.prepare(
      `INSERT INTO equipment (id, sku, name, category, image_url, condition_rating, availability_flag, 
       emergency_hourly_rate, emergency_dispatch_fee, rental_daily_rate, rental_weekly_rate, 
       purchase_price, stock_qty, seller_id, seller_name, deposit_amount, deposit_tier, rating, 
       last_ping_seconds, distance_miles, eta_minutes, node_id, node_callsign, courier_name, 
       courier_plate, weight_lbs, primary_output, voltage_or_pressure, inspection_date, summary, specs, checklist, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    );
    
    stmt.run([
      id, item.sku, item.name, item.category, item.image || '/src/assets/images/placeholder.jpg',
      item.conditionRating, item.availabilityFlag, item.emergencyHourlyRate, item.emergencyDispatchFee,
      item.rentalDailyRate, item.rentalWeeklyRate, item.purchasePrice, item.stockQty,
      item.sellerId, item.sellerName, item.depositAmount, item.depositTier,
      item.rating, item.lastPingSeconds, item.distanceMiles, item.etaMinutes,
      item.nodeId, item.nodeCallsign, item.courierName, item.courierPlate,
      item.weightLbs, item.primaryOutput, item.voltageOrPressure, item.inspectionDate,
      item.summary, JSON.stringify(item.specs || []), JSON.stringify(item.checklist || [])
    ], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id });
    });
    stmt.finalize();
  });
  
  // Update equipment rates
  app.put('/api/equipment/:id', (req, res) => {
    const { id } = req.params;
    const { purchasePrice, rentalDailyRate, emergencyHourlyRate, stockQty } = req.body;
    
    db.run(
      `UPDATE equipment SET purchase_price = ?, rental_daily_rate = ?, emergency_hourly_rate = ?, stock_qty = ?, updated_at = datetime('now') WHERE id = ?`,
      [purchasePrice, rentalDailyRate, emergencyHourlyRate, stockQty, id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: this.changes > 0 });
      }
    );
  });
  
  // Delete equipment
  app.delete('/api/equipment/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM equipment WHERE id = ?`, [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: this.changes > 0 });
    });
  });
  
  // ===== ORDERS API =====
  
  // Get buyer orders
  app.get('/api/buyer/orders', (req, res) => {
    db.all(`SELECT * FROM orders WHERE buyer_id = ?`, [req.query.buyerId], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
  
  // Create order
  app.post('/api/orders', (req, res) => {
    const { poNumber, buyerId, buyerCompany, gstin, deliveryAddress, deliveryTier, deliveryFee,
            subtotal, gstAmount, grandTotal, items } = req.body;
    const id = `po-${Date.now()}`;
    
    // Insert order
    db.run(
      `INSERT INTO orders (id, po_number, buyer_id, buyer_company, gstin, delivery_address, delivery_tier, 
       delivery_fee, subtotal, gst_amount, grand_total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_APPROVAL', datetime('now'))`,
      [id, poNumber, buyerId, buyerCompany, gstin, deliveryAddress, deliveryTier, deliveryFee, subtotal, gstAmount, grandTotal],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Insert order items
        const itemPromises = items.map((item, idx) => {
          return new Promise((resolve, reject) => {
            const itemId = `oi-${Date.now()}-${idx}`;
            db.run(
              `INSERT INTO order_items (id, order_id, equipment_id, sku, name, seller_id, seller_name, qty, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [itemId, id, item.equipmentId, item.sku, item.name, item.sellerId, item.sellerName,
               item.qty, item.unitPrice, item.totalPrice],
              function(err) { resolve(); }
            );
          });
        });
        
        Promise.all(itemPromises).then(() => {
          res.json({ success: true, orderId: id });
        });
      }
    );
  });
  
  // ===== MISSIONS API =====
  
  // Get missions for buyer
  app.get('/api/buyer/missions', (req, res) => {
    db.all(`SELECT * FROM missions WHERE buyer_id = ?`, [req.query.buyerId], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
  
  // Create mission
  app.post('/api/missions', (req, res) => {
    const mission = req.body;
    const id = `mis-${Date.now()}`;
    
    db.run(
      `INSERT INTO missions (id, mission_code, buyer_id, buyer_name, equipment_id, mode, drop_zone_address, 
       site_coordinates, priority_override, eta_total_seconds, remaining_seconds, status, handoff_pin, 
       courier_name, courier_plate, started_at, total_cost, rental_days, cancellation_reason, logs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, mission.missionCode, mission.buyerId, mission.buyerName, mission.equipmentId, mission.mode,
       mission.dropZoneAddress, mission.siteCoordinates, mission.priorityOverride ? 1 : 0,
       mission.etaTotalSeconds, mission.remainingSeconds, mission.status || 'VERIFIED', mission.handoffPin,
       mission.courierName, mission.courierPlate, mission.startedAt || new Date().toISOString(),
       mission.totalCost, mission.rentalDays, mission.cancellationReason, JSON.stringify(mission.logs || [])],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, missionId: id });
      }
    );
  });
  
  // ===== DEPOT NODES API =====
  
  // Get all nodes
  app.get('/api/nodes', (req, res) => {
    db.all(`SELECT * FROM depot_nodes`, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
  
  // Add node (seller)
  app.post('/api/nodes', (req, res) => {
    const { callsign, region, status, sellerId, leadTech } = req.body;
    const id = `node-${Date.now()}`;
    
    db.run(
      `INSERT INTO depot_nodes (id, callsign, region, status, seller_id, lead_tech, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [id, callsign, region, status, sellerId, leadTech],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, nodeId: id });
      }
    );
  });
  
  // Start server
  app.listen(PORT, () => {
    console.log(`RIGLOCK Backend running on port ${PORT}`);
    console.log(`Database: ${dbPath}`);
    console.log(`Free hosting: Render.com or any Node.js compatible host`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

module.exports = app;