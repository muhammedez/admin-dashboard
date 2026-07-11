import { DatabaseSync } from "node:sqlite"
import path from "path"
import { createHash, randomBytes } from "crypto"

const DB_PATH = path.join(process.cwd(), "data.db")

let db: DatabaseSync | null = null

export function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(DB_PATH)
    db.exec("PRAGMA journal_mode = WAL")
    initSchema(db)
  }
  return db
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      totalOrders INTEGER NOT NULL DEFAULT 0,
      totalSpent REAL NOT NULL DEFAULT 0,
      joinedAt TEXT NOT NULL DEFAULT (date('now')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      userId INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      customerName TEXT NOT NULL,
      productName TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed', 'pending', 'failed')),
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      paymentMethod TEXT NOT NULL DEFAULT 'Credit Card'
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('admin', 'client')),
      createdAt TEXT NOT NULL DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id),
      role TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  try { db.exec("ALTER TABLE customers ADD COLUMN userId INTEGER REFERENCES users(id)") } catch { /* already exists */ }

  const row = db.prepare("SELECT COUNT(*) as cnt FROM products").get() as { cnt: number }
  if (row.cnt === 0) {
    seedUsers(db)
    seed(db)
  }

  const catRow = db.prepare("SELECT COUNT(*) as cnt FROM categories").get() as { cnt: number }
  if (catRow.cnt === 0) {
    seedCategories(db)
  }
}

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

function seedUsers(db: DatabaseSync) {
  const insert = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)")
  insert.run("Admin User", "admin@dashboard.com", hashPassword("admin123"), "admin")
  insert.run("Client User", "client@dashboard.com", hashPassword("client123"), "client")
}

export function createSession(userId: number, role: string): string {
  const db = getDb()
  const token = randomBytes(32).toString("hex")
  db.prepare("INSERT INTO sessions (token, userId, role) VALUES (?, ?, ?)").run(token, userId, role)
  return token
}

export function getSession(token: string): { userId: number; role: string } | null {
  const db = getDb()
  const row = db.prepare("SELECT userId, role FROM sessions WHERE token = ?").get(token) as any
  return row || null
}

export function deleteSession(token: string) {
  const db = getDb()
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token)
}

export function verifyPassword(email: string, password: string): { id: number; name: string; email: string; role: string } | null {
  const db = getDb()
  const user = db.prepare("SELECT id, name, email, password, role FROM users WHERE email = ?").get(email) as any
  if (!user) return null
  if (user.password !== hashPassword(password)) return null
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

function seedCategories(db: DatabaseSync) {
  const categories = [
    ["CAT-1", "Electronics", "2025-01-01"],
    ["CAT-2", "Accessories", "2025-01-01"],
    ["CAT-3", "Footwear", "2025-01-01"],
    ["CAT-4", "Fitness", "2025-01-01"],
    ["CAT-5", "Home", "2025-01-01"],
  ]
  const insert = db.prepare("INSERT INTO categories (id, name, createdAt) VALUES (?, ?, ?)")
  for (const c of categories) insert.run(...c)
}

function seed(db: DatabaseSync) {
  const products = [
    ["P-1001", "Wireless Headphones", "Electronics", 149.99, 45, "Premium wireless headphones with noise cancellation", "2025-01-15"],
    ["P-1002", "Smart Watch", "Electronics", 299.99, 30, "Fitness tracking smartwatch with GPS", "2025-02-10"],
    ["P-1003", "Leather Backpack", "Accessories", 89.99, 60, "Handcrafted leather backpack", "2025-03-05"],
    ["P-1004", "Running Shoes", "Footwear", 129.99, 25, "Lightweight running shoes", "2025-01-20"],
    ["P-1005", "Yoga Mat", "Fitness", 39.99, 80, "Non-slip exercise yoga mat", "2025-04-12"],
    ["P-1006", "Coffee Maker", "Home", 79.99, 20, "Programmable drip coffee maker", "2025-02-28"],
    ["P-1007", "Bluetooth Speaker", "Electronics", 59.99, 55, "Portable waterproof speaker", "2025-05-01"],
    ["P-1008", "Desk Lamp", "Home", 49.99, 40, "LED desk lamp with adjustable brightness", "2025-03-18"],
    ["P-1009", "Sunglasses", "Accessories", 159.99, 35, "Polarized aviator sunglasses", "2025-04-22"],
    ["P-1010", "Protein Powder", "Fitness", 54.99, 90, "Whey protein isolate powder", "2025-05-10"],
  ]

  const customers = [
    ["C-001", "Alice Johnson", "alice@example.com", 12, 2340.50, "2024-06-15", "active", 2],
    ["C-002", "Bob Smith", "bob@example.com", 8, 1250.00, "2024-08-20", "active", null],
    ["C-003", "Carol Davis", "carol@example.com", 5, 680.25, "2025-01-10", "active", null],
    ["C-004", "David Wilson", "david@example.com", 15, 3450.75, "2024-03-05", "active", null],
    ["C-005", "Eve Martinez", "eve@example.com", 3, 210.00, "2025-04-18", "inactive", null],
    ["C-006", "Frank Taylor", "frank@example.com", 20, 5200.00, "2024-01-12", "active", null],
    ["C-007", "Grace Lee", "grace@example.com", 7, 980.50, "2024-11-30", "active", null],
    ["C-008", "Henry Brown", "henry@example.com", 2, 150.00, "2025-06-01", "inactive", null],
  ]

  const transactions = [
    ["T-5001", "Alice Johnson", "Wireless Headphones", 149.99, "completed", "2025-07-10T09:15:00Z", "Credit Card"],
    ["T-5002", "Frank Taylor", "Smart Watch", 299.99, "completed", "2025-07-10T09:30:00Z", "PayPal"],
    ["T-5003", "Carol Davis", "Yoga Mat", 39.99, "pending", "2025-07-10T09:45:00Z", "Debit Card"],
    ["T-5004", "Bob Smith", "Leather Backpack", 89.99, "completed", "2025-07-10T10:00:00Z", "Credit Card"],
    ["T-5005", "Grace Lee", "Bluetooth Speaker", 59.99, "failed", "2025-07-10T10:15:00Z", "PayPal"],
    ["T-5006", "David Wilson", "Running Shoes", 129.99, "completed", "2025-07-10T10:30:00Z", "Credit Card"],
    ["T-5007", "Alice Johnson", "Coffee Maker", 79.99, "pending", "2025-07-10T10:45:00Z", "Debit Card"],
    ["T-5008", "Henry Brown", "Desk Lamp", 49.99, "completed", "2025-07-10T11:00:00Z", "Credit Card"],
    ["T-5009", "Eve Martinez", "Sunglasses", 159.99, "completed", "2025-07-10T11:15:00Z", "PayPal"],
    ["T-5010", "Frank Taylor", "Protein Powder", 54.99, "completed", "2025-07-10T11:30:00Z", "Credit Card"],
  ]

  const insertProduct = db.prepare(
    "INSERT INTO products (id, name, category, price, stock, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
  const insertCustomer = db.prepare(
    "INSERT INTO customers (id, name, email, totalOrders, totalSpent, joinedAt, status, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  )
  const insertTransaction = db.prepare(
    "INSERT INTO transactions (id, customerName, productName, amount, status, timestamp, paymentMethod) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )

  for (const p of products) insertProduct.run(...p)
  for (const c of customers) insertCustomer.run(...c)
  for (const t of transactions) insertTransaction.run(...t)
}
