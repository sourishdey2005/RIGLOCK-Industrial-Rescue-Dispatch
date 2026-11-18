// RIGLOCK Backend Server - sql.js + Express
// Pure JavaScript SQLite - no native binding GLIBC issues
// Free hosting: Render.com (free tier) or any Node.js host
// Frontend: Vercel (https://riglock-industrysite.vercel.app/)

const express = require('express');
const sql = require('sql.js');
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

// Database path - sql.js will use this for the .db file
const dbPath = path.resolve(__dirname, 'riglock.db');

// Initialize sql.js database
// sql.js requires loading the database from an ArrayBuffer or ArrayBufferView
// We'll initialize it empty and let it create the .db file on first run

let database = null;

// Initialize the database on server start
function initDatabase() {
  return new Promise((resolve, reject) => {
    // Read the existing .db file if it exists, otherwise create new
    const fs = require('fs');
    let buffer = null;
    
    try {
      // Try to read existing database file
      if (fs.existsSync(dbPath)) {
        buffer = fs.readFileSync(dbPath);
        console.log('Found existing riglock.db, loading...');
      } else {
        console.log('No existing riglock.db, creating new...');
        // Create an empty database buffer - sql.js uses a specific magic number header
        // The minimum size for a valid sql.js database is 16 bytes with the header
        buffer = new ArrayBuffer(16);
      }
      
      database = new sql.Database(buffer);
      
      // Initialize all tables
      runMigrations();
      
      resolve(database);
    } catch (err) {
      reject(err);
    }
  });
}

// Run all database migrations/tables
function runMigrations() {
  // These are executed right after database initialization
  // We'll also have API endpoints that create tables on first use
}

// Get a run helper
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    database.exec(sql, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// ===== ACCOUNTS API =====

// Register new account
app.post('/api/register', async (req, res) => {
  const { role, fullName, companyName, email, password, phone, gstin, siteOrDepotAddress, depotRegion } = req.body;
  const id = `user-${Date.now()}`;
  
  try {
    await run(
      `INSERT INTO accounts (id, role, full_name, company_name, email, phone, gstin, site_or_depot_address, depot_region, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [id, role, fullName, companyName, email, phone, gstin, siteOrDepotAddress, depotRegion]
    );
    res.json({ success: true, id, role });
  } catch (err) {
    // Check if email already exists
    const existing = await getAccountByEmail(email);
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered' });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// Get account by email (for CORS check)
async function getAccountByEmail(email) {
  return new Promise((resolve, reject) => {
    database.exec(`SELECT * FROM accounts WHERE email = '${email}'`, function(err, rows) {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const accounts = await new Promise((resolve, reject) => {
    database.exec(`SELECT * FROM accounts WHERE email = '${email}'`, function(err, rows) {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  if (accounts.length === 0 || accounts[0].password !== password) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
  res.json({ success: true, user: accounts[0] });
});

// ===== EQUIPMENT API =====

// Get all equipment
app.get('/api/equipment', async (req, res) => {
  try {
    const equipment = await new Promise((resolve, reject) => {
      database.all('SELECT * FROM equipment', [], function(err, rows) {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get equipment by seller
app.get('/api/seller/equipment', async (req, res) => {
  const sellerId = req.query.sellerId;
  try {
    const equipment = await new Promise((resolve, reject) => {
      database.all('SELECT * FROM equipment WHERE seller_id = ?', [sellerId], function(err, rows) {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new equipment (seller)
app.post('/api/equipment', async (req, res) => {
  const item = req.body;
  const id = `eq-${Date.now()}`;
  
  try {
    await run(
      `INSERT INTO equipment (id, sku, name, category, image_url, condition_rating, availability_flag, 
       emergency_hourly_rate, emergency_dispatch_fee, rental_daily_rate, rental_weekly_rate, 
       purchase_price, stock_qty, seller_id, seller_name, deposit_amount, deposit_tier, rating, 
       last_ping_seconds, distance_miles, eta_minutes, node_id, node_callsign, courier_name, 
       courier_plate, weight_lbs, primary_output, voltage_or_pressure, inspection_date, summary, specs, checklist, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [id, item.sku, item.name, item.category, item.image || '/src/assets/images/placeholder.jpg',
        item.conditionRating, item.availabilityFlag, item.emergencyHourlyRate, item.emergencyDispatchFee,
        item.rentalDailyRate, item.rentalWeeklyRate, item.purchasePrice, item.stockQty,
        item.sellerId, item.sellerName, item.depositAmount, item.depositTier,
        item.rating, item.lastPingSeconds, item.distanceMiles, item.etaMinutes,
        item.nodeId, item.nodeCallsign, item.courierName, item.courierPlate,
        item.weightLbs, item.primaryOutput, item.voltageOrPressure, item.inspectionDate,
        item.summary, JSON.stringify(item.specs || []), JSON.stringify(item.checklist || [])
      ]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update equipment rates
app.put('/api/equipment/:id', async (req, res) => {
  const { id } = req.params;
  const { purchasePrice, rentalDailyRate, emergencyHourlyRate, stockQty } = req.body;
  
  try {
    await run(
      `UPDATE equipment SET purchase_price = ?, rental_daily_rate = ?, emergency_hourly_rate = ?, stock_qty = ?, updated_at = datetime('now') WHERE id = ?`,
      [purchasePrice, rentalDailyRate, emergencyHourlyRate, stockQty, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete equipment
app.delete('/api/equipment/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await run(`DELETE FROM equipment WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ORDERS API =====

// Get buyer orders
app.get('/api/buyer/orders', async (req, res) => {
  try {
    const orders = await new Promise((resolve, reject) => {
      database.all('SELECT * FROM orders WHERE buyer_id = ?', [req.query.buyerId], function(err, rows) {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create order
app.post('/api/orders', async (req, res) => {
  const { poNumber, buyerId, buyerCompany, gstin, deliveryAddress, deliveryTier, deliveryFee,
          subtotal, gstAmount, grandTotal, items } = req.body;
  const id = `po-${Date.now()}`;
  
  try {
    // Insert order
    await run(
      `INSERT INTO orders (id, po_number, buyer_id, buyer_company, gstin, delivery_address, delivery_tier, 
       delivery_fee, subtotal, gst_amount, grand_total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_APPROVAL', datetime('now'))`,
      [id, poNumber, buyerId, buyerCompany, gstin, deliveryAddress, deliveryTier, deliveryFee, subtotal, gstAmount, grandTotal]
    );
    
    // Insert order items
    const itemPromises = items.map((item, idx) => {
      return new Promise((resolve, reject) => {
        const itemId = `oi-${Date.now()}-${idx}`;
        database.run(
          `INSERT INTO order_items (id, order_id, equipment_id, sku, name, seller_id, seller_name, qty, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [itemId, id, item.equipmentId, item.sku, item.name, item.sellerId, item.sellerName,
           item.qty, item.unitPrice, item.totalPrice],
          function(err) { resolve(); }
        );
      });
    });
    
    await Promise.all(itemPromises);
    res.json({ success: true, orderId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== MISSIONS API =====

// Get missions for buyer
app.get('/api/buyer/missions', async (req, res) => {
  try {
    const missions = await new Promise((resolve, reject) => {
      database.all('SELECT * FROM missions WHERE buyer_id = ?', [req.query.buyerId], function(err, rows) {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(missions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create mission
app.post('/api/missions', async (req, res) => {
  const mission = req.body;
  const id = `mis-${Date.now()}`;
  
  try {
    await run(
      `INSERT INTO missions (id, mission_code, buyer_id, buyer_name, equipment_id, mode, drop_zone_address, 
       site_coordinates, priority_override, eta_total_seconds, remaining_seconds, status, handoff_pin, 
       courier_name, courier_plate, started_at, total_cost, rental_days, cancellation_reason, logs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, mission.missionCode, mission.buyerId, mission.buyerName, mission.equipmentId, mission.mode,
       mission.dropZoneAddress, mission.siteCoordinates, mission.priorityOverride ? 1 : 0,
       mission.etaTotalSeconds, mission.remainingSeconds, mission.status || 'VERIFIED', mission.handoffPin,
       mission.courierName, mission.courierPlate, mission.startedAt || new Date().toISOString(),
       mission.totalCost, mission.rentalDays, mission.cancellationReason, JSON.stringify(mission.logs || [])]
    );
    res.json({ success: true, missionId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== DEPOT NODES API =====

// Get all nodes
app.get('/api/nodes', async (req, res) => {
  try {
    const nodes = await new Promise((resolve, reject) => {
      database.all('SELECT * FROM depot_nodes', [], function(err, rows) {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(nodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add node (seller)
app.post('/api/nodes', async (req, res) => {
  const { callsign, region, status, sellerId, leadTech } = req.body;
  const id = `node-${Date.now()}`;
  
  try {
    await run(
      `INSERT INTO depot_nodes (id, callsign, region, status, seller_id, lead_tech, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [id, callsign, region, status, sellerId, leadTech]
    );
    res.json({ success: true, nodeId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`RIGLOCK Backend running on port ${PORT}`);
  console.log(`Database: ${dbPath}`);
  console.log('Free hosting: Render.com or any Node.js compatible host');
  
  // Initialize database after server starts
  initDatabase().then(() => {
    console.log('Database initialized');
  }).catch(err => {
    console.error('Database initialization error:', err);
  });
});

// Expose database for testing/inspection (optional)
app.get('/api/db-info', (req, res) => {
  res.json({ dbPath, dbExists: require('fs').existsSync(dbPath) });
});

module.exports = app;